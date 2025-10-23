import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
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

const router = express.Router();
const webhookRouter = express.Router(); // Separate router for webhook (no auth)
const prisma = new PrismaClient();

// ==================== PROJECT ESCROW PAYMENT ROUTES ====================

// Create payment intent for project escrow (when client accepts application)
router.post('/project/create-payment-intent', asyncHandler(async (req: AuthRequest, res) => {
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
      maxBudget: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Only the project owner can fund escrow', 403);
  }

  if (project.status !== 'IN_PROGRESS') {
    throw new AppError('Project must be in progress to fund escrow', 400);
  }

  if (!project.freelancerId) {
    throw new AppError('Project must have an assigned freelancer', 400);
  }

  // Use agreedAmount (from accepted application) or fallback to maxBudget
  const escrowAmount = project.agreedAmount || project.maxBudget;

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
router.post('/service-order/create-payment-intent', asyncHandler(async (req: AuthRequest, res) => {
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

  if (order.paymentStatus !== 'PAID') {
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

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
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