import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import {
  createProjectEscrowPayment,
  confirmProjectEscrowPayment,
  releaseProjectEscrowPayment,
  refundProjectEscrowPayment,
  createServiceOrderPayment,
  confirmServiceOrderPayment,
  releaseServiceOrderPayment,
  refundServiceOrderPayment,
  handleStripeWebhook,
  stripe
} from '../services/stripeService';
import {
  createConnectAccount,
  createAccountLink,
  checkAccountStatus,
  getPendingPayouts,
  processAccumulatedPayouts
} from '../services/stripeConnectService';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const webhookRouter = express.Router(); // Separate router for webhook (no auth)
const prisma = new PrismaClient();

// ==================== PROJECT ESCROW PAYMENT ROUTES ====================

// Create payment intent for project escrow (when client accepts application)
router.post('/project/create-payment-intent', paymentLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      clientId: true,
      freelancerId: true,
      status: true,
      agreedAmount: true,
      maxBudget: true,
      totalCharged: true,
      buyerFee: true,
      sellerCommission: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Only the project owner can fund escrow', 403);
  }

  if (project.status !== 'IN_PROGRESS' && project.status !== 'PENDING_REVIEW') {
    throw new AppError('Project must be in progress or pending review to fund escrow', 400);
  }

  if (!project.freelancerId) {
    throw new AppError('Project must have an assigned freelancer', 400);
  }

  // Use totalCharged (includes buyer fee) or fallback to agreedAmount or maxBudget
  const escrowAmount = project.totalCharged || project.agreedAmount || project.maxBudget;

  console.log('💰 Escrow payment amount:', {
    totalCharged: project.totalCharged,
    agreedAmount: project.agreedAmount,
    maxBudget: project.maxBudget,
    usingAmount: escrowAmount
  });

  // Check if escrow already exists and is funded
  const existingEscrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (existingEscrow && existingEscrow.status === 'FUNDED') {
    throw new AppError('Escrow already funded for this project', 400);
  }

  try {
    const paymentIntent = await createProjectEscrowPayment(
      projectId,
      escrowAmount,
      req.user!.id,
      `Escrow payment for project: ${project.title}`
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: escrowAmount
    });
  } catch (error) {
    console.error('Error creating project payment intent:', error);
    throw new AppError('Failed to create payment intent', 500);
  }
}));

// Update agreed amount for project (before funding escrow)
router.put('/project/:projectId/agreed-amount', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { agreedAmount } = req.body;

  if (!agreedAmount || agreedAmount <= 0) {
    throw new AppError('Valid agreed amount is required', 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      status: true,
      minBudget: true,
      maxBudget: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Only the project owner can modify agreed amount', 403);
  }

  if (project.status !== 'IN_PROGRESS') {
    throw new AppError('Can only modify agreed amount for projects in progress', 400);
  }

  // Validate that agreed amount is within budget range
  if (agreedAmount < project.minBudget || agreedAmount > project.maxBudget) {
    throw new AppError(`Agreed amount must be between $${project.minBudget} and $${project.maxBudget}`, 400);
  }

  // Check if escrow already funded (can't change after funding)
  const existingEscrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (existingEscrow && existingEscrow.status === 'FUNDED') {
    throw new AppError('Cannot modify agreed amount after escrow has been funded', 400);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { agreedAmount }
  });

  res.json({
    success: true,
    message: 'Agreed amount updated successfully',
    agreedAmount
  });
}));

// Get escrow status for a project
router.get('/escrow/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      freelancerId: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Only project participants can view escrow
  if (req.user!.id !== project.clientId && req.user!.id !== project.freelancerId) {
    throw new AppError('Not authorized to view escrow for this project', 403);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { projectId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  res.json({
    success: true,
    escrow
  });
}));

// Release project escrow (client approves completed work)
router.post('/project/:projectId/release', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      freelancerId: true,
      status: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Only the project owner can release escrow', 403);
  }

  if (project.status !== 'COMPLETED') {
    throw new AppError('Project must be completed to release escrow', 400);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (!escrow) {
    throw new AppError('No escrow found for this project', 404);
  }

  if (escrow.status !== 'FUNDED') {
    throw new AppError('Escrow is not in funded status', 400);
  }

  try {
    await releaseProjectEscrowPayment(projectId);

    res.json({
      success: true,
      message: 'Payment released to freelancer successfully'
    });
  } catch (error) {
    console.error('Error releasing project escrow:', error);
    throw new AppError('Failed to release payment', 500);
  }
}));

// Refund project escrow (when project is cancelled)
router.post('/project/:projectId/refund', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { reason } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      freelancerId: true,
      status: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Only project client can request refund, or admin can process it
  if (project.clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Not authorized to refund this escrow', 403);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (!escrow) {
    throw new AppError('No escrow found for this project', 404);
  }

  if (escrow.status !== 'FUNDED') {
    throw new AppError('Escrow is not in funded status', 400);
  }

  try {
    await refundProjectEscrowPayment(projectId, reason);

    res.json({
      success: true,
      message: 'Escrow refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding project escrow:', error);
    throw new AppError('Failed to refund escrow', 500);
  }
}));

// Get user's transactions
router.get('/transactions', asyncHandler(async (req: AuthRequest, res) => {
  const { type, page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { userId: req.user!.id };
  if (type) {
    where.type = type as string;
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take,
      include: {
        escrow: {
          include: {
            project: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// ==================== SERVICE ORDER PAYMENT ROUTES ====================

// Create payment intent for service order
router.post('/service-order/create-payment-intent', paymentLimiter, asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new AppError('Order ID is required', 400);
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      client: true,
      freelancer: true
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  if (order.clientId !== req.user!.id) {
    throw new AppError('Only the order client can make payment', 403);
  }

  if (order.status !== 'PENDING') {
    throw new AppError('Order must be pending to make payment', 400);
  }

  if (order.paymentStatus !== 'PENDING') {
    throw new AppError('Payment already processed for this order', 400);
  }

  try {
    const paymentIntent = await createServiceOrderPayment(
      orderId,
      order.totalAmount,
      req.user!.id,
      `Payment for service: ${order.service.title}`
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating service order payment:', error);
    throw new AppError('Failed to create payment intent', 500);
  }
}));

// Get service order payment status
router.get('/service-order/:orderId', asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      transactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  // Only order participants can view payment details
  if (req.user!.id !== order.clientId && req.user!.id !== order.freelancerId) {
    throw new AppError('Not authorized to view payment details', 403);
  }

  res.json({
    success: true,
    order: {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      service: {
        id: order.service.id,
        title: order.service.title
      },
      transactions: order.transactions
    }
  });
}));

// Release service order payment (client approves work)
router.post('/service-order/:orderId/release', asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      clientId: true,
      freelancerId: true,
      status: true,
      paymentStatus: true
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  if (order.clientId !== req.user!.id) {
    throw new AppError('Only the order client can release payment', 403);
  }

  if (order.status !== 'DELIVERED') {
    throw new AppError('Work must be delivered before releasing payment', 400);
  }

  if (order.paymentStatus !== 'PAID') {
    throw new AppError('Payment not confirmed yet', 400);
  }

  try {
    await releaseServiceOrderPayment(orderId);

    res.json({
      success: true,
      message: 'Payment released successfully'
    });
  } catch (error) {
    console.error('Error releasing service order payment:', error);
    throw new AppError('Failed to release payment', 500);
  }
}));

// Refund service order payment
router.post('/service-order/:orderId/refund', asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      clientId: true,
      freelancerId: true,
      status: true,
      paymentStatus: true
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  // Client or admin can request refund
  if (order.clientId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Not authorized to refund this order', 403);
  }

  if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'RELEASED') {
    throw new AppError('Cannot refund unpaid order', 400);
  }

  if (order.paymentStatus === 'RELEASED') {
    throw new AppError('Cannot refund released payment', 400);
  }

  try {
    await refundServiceOrderPayment(orderId, reason);

    res.json({
      success: true,
      message: 'Order refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding service order:', error);
    throw new AppError('Failed to refund order', 500);
  }
}));

// ==================== STRIPE CONNECT ROUTES ====================

// Create or get Stripe Connect account for freelancer
router.post('/connect/create-account', paymentLimiter, authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userEmail = req.user!.email;

  // Fetch payment settings to check if already has Connect account
  const userPaymentData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectAccountId: true
    }
  });

  // Check if already has Connect account
  if (userPaymentData?.stripeConnectAccountId) {
    const status = await checkAccountStatus(userPaymentData.stripeConnectAccountId);

    if (status.requiresAction) {
      // Generate new onboarding link
      const onboardingUrl = await createAccountLink(userPaymentData.stripeConnectAccountId);

      return res.json({
        success: true,
        accountId: userPaymentData.stripeConnectAccountId,
        onboardingUrl,
        status,
        message: 'Please complete your Stripe Connect onboarding'
      });
    }

    return res.json({
      success: true,
      accountId: userPaymentData.stripeConnectAccountId,
      status,
      message: 'Connect account already set up'
    });
  }

  // Create new Connect account
  const result = await createConnectAccount(userId, userEmail);

  res.json({
    success: true,
    ...result
  });
}));

// Get Connect account status
router.get('/connect/status', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Fetch payment settings to check Connect account status
  const userPaymentData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectAccountId: true
    }
  });

  if (!userPaymentData?.stripeConnectAccountId) {
    return res.json({
      success: true,
      connected: false,
      message: 'No Connect account set up yet'
    });
  }

  const status = await checkAccountStatus(userPaymentData.stripeConnectAccountId);

  res.json({
    success: true,
    connected: true,
    accountId: userPaymentData.stripeConnectAccountId,
    ...status
  });
}));

// Get pending payouts for freelancer
router.get('/connect/pending-payouts', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const pendingPayouts = await getPendingPayouts(req.user!.id);

  res.json({
    success: true,
    ...pendingPayouts
  });
}));

// Process accumulated pending payouts (manual trigger or automatic when threshold reached)
router.post('/connect/process-pending-payouts', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const result = await processAccumulatedPayouts(req.user!.id);

    res.json({
      success: true,
      message: 'Accumulated payouts processed successfully',
      transfer: result.transfer,
      payoutsCount: result.payouts.length
    });
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}));

// Stripe webhook handler (on separate router - no auth required)
webhookRouter.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  console.log('🔔 Webhook endpoint hit!', {
    signature: !!sig,
    body: req.body ? 'present' : 'missing'
  });

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Stripe webhook secret not configured', 500);
  }

  let event: any;
  let verificationError: any;

  // Try to verify with the primary webhook secret first
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook verified with primary secret');
  } catch (err: any) {
    verificationError = err;

    // If primary fails and we have a Connect webhook secret, try that
    if (process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
        console.log('✅ Webhook verified with Connect webhook secret');
        verificationError = null; // Clear the error since we succeeded
      } catch (connectErr: any) {
        console.error('❌ Webhook signature verification failed with both secrets');
      }
    }
  }

  // If verification failed with all available secrets, reject the webhook
  if (verificationError && !event) {
    console.error('❌ Webhook signature verification failed:', verificationError.message);
    throw new AppError('Invalid webhook signature', 400);
  }

  try {
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    throw new AppError('Error processing webhook', 500);
  }
}));

export default router;
export { webhookRouter };