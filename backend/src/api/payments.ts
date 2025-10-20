import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import {
  createPaymentIntent,
  createEscrow,
  releaseEscrow,
  refundEscrow,
  createServiceOrderPayment,
  confirmServiceOrderPayment,
  releaseServiceOrderPayment,
  refundServiceOrderPayment,
  handleStripeWebhook,
  stripe
} from '../services/stripeService';

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent for escrow deposit
router.post('/create-payment-intent', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId, amount } = req.body;

  if (!projectId || !amount) {
    throw new AppError('Project ID and amount are required', 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      clientId: true,
      freelancerId: true,
      status: true,
      minBudget: true,
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

  if (amount < project.minBudget || amount > project.maxBudget) {
    throw new AppError(`Amount must be between $${project.minBudget} and $${project.maxBudget}`, 400);
  }

  // Check if escrow already exists
  const existingEscrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (existingEscrow) {
    throw new AppError('Escrow already exists for this project', 400);
  }

  try {
    const paymentIntent = await createPaymentIntent(
      amount,
      projectId,
      req.user!.id,
      `Escrow deposit for project: ${project.title}`
    );

    await createEscrow(projectId, amount, paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new AppError('Failed to create payment intent', 500);
  }
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

// Release escrow (project owner only)
router.post('/escrow/:projectId/release', asyncHandler(async (req: AuthRequest, res) => {
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
    await releaseEscrow(escrow.id, project.freelancerId!);

    res.json({
      success: true,
      message: 'Escrow released successfully'
    });
  } catch (error) {
    console.error('Error releasing escrow:', error);
    throw new AppError('Failed to release escrow', 500);
  }
}));

// Refund escrow (admin or dispute resolution)
router.post('/escrow/:projectId/refund', asyncHandler(async (req: AuthRequest, res) => {
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
    await refundEscrow(escrow.id, reason);

    res.json({
      success: true,
      message: 'Escrow refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding escrow:', error);
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

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Stripe webhook secret not configured', 500);
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    throw new AppError('Invalid webhook signature', 400);
  }

  try {
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw new AppError('Error processing webhook', 500);
  }
}));

export default router;