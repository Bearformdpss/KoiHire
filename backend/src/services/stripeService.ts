import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// ==================== PROJECT ESCROW PAYMENT METHODS ====================

/**
 * Create payment intent for project escrow
 * Funds are held in escrow with manual capture until work is approved
 */
export const createProjectEscrowPayment = async (
  projectId: string,
  amount: number,
  clientId: string,
  description?: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    // Manual capture - funds held until work approved
    capture_method: 'manual',
    metadata: {
      projectId,
      clientId,
      type: 'project_escrow'
    },
    description: description || `Escrow payment for project ${projectId}`
  });

  return paymentIntent;
};

/**
 * Confirm project escrow payment after client pays
 * Creates escrow record and updates project status
 */
export const confirmProjectEscrowPayment = async (projectId: string, paymentIntentId: string) => {
  console.log(`🔍 confirmProjectEscrowPayment called for projectId: ${projectId}, paymentIntentId: ${paymentIntentId}`);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      freelancer: true
    }
  });

  if (!project) {
    console.error(`❌ Project not found: ${projectId}`);
    throw new Error('Project not found');
  }

  console.log(`📦 Project found:`, {
    id: project.id,
    title: project.title,
    status: project.status
  });

  // Create or update escrow record
  const escrow = await prisma.escrow.upsert({
    where: { projectId },
    create: {
      projectId,
      amount: project.maxBudget, // Using maxBudget as agreed amount
      status: 'FUNDED',
      stripePaymentId: paymentIntentId
    },
    update: {
      status: 'FUNDED',
      stripePaymentId: paymentIntentId
    }
  });

  console.log(`💰 Escrow created/updated:`, {
    id: escrow.id,
    amount: escrow.amount,
    status: escrow.status
  });

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      userId: project.clientId,
      escrowId: escrow.id,
      type: 'DEPOSIT',
      amount: escrow.amount,
      status: 'COMPLETED',
      stripeId: paymentIntentId,
      description: `Escrow payment for project: ${project.title}`
    }
  });

  console.log(`💳 Transaction created:`, {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount
  });

  return escrow;
};

/**
 * Release project escrow payment to freelancer
 * Called when client approves completed work
 * Captures payment and distributes funds
 */
export const releaseProjectEscrowPayment = async (projectId: string) => {
  console.log(`🔍 releaseProjectEscrowPayment called for projectId: ${projectId}`);

  const escrow = await prisma.escrow.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          client: true,
          freelancer: true
        }
      },
      transactions: true
    }
  });

  if (!escrow) {
    throw new Error('Escrow not found for this project');
  }

  if (escrow.status !== 'FUNDED') {
    throw new Error('Escrow must be funded to release payment');
  }

  if (!escrow.project.freelancer) {
    throw new Error('No freelancer assigned to this project');
  }

  console.log(`💰 Escrow found:`, {
    id: escrow.id,
    amount: escrow.amount,
    status: escrow.status
  });

  // Find the original payment intent from transaction
  const depositTransaction = escrow.transactions.find(t => t.type === 'DEPOSIT');
  if (!depositTransaction || !depositTransaction.stripeId) {
    throw new Error('Original payment not found');
  }

  // Capture the payment (release from escrow)
  console.log(`📥 Capturing payment: ${depositTransaction.stripeId}`);
  await stripe.paymentIntents.capture(depositTransaction.stripeId);

  // Calculate platform fee (5% for projects)
  const platformFee = escrow.amount * 0.05;
  const freelancerAmount = escrow.amount - platformFee;

  console.log(`💸 Payment breakdown:`, {
    total: escrow.amount,
    platformFee,
    freelancerAmount
  });

  await prisma.$transaction([
    // Update escrow status
    prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    }),
    // Create freelancer payout transaction
    prisma.transaction.create({
      data: {
        userId: escrow.project.freelancerId!,
        escrowId: escrow.id,
        type: 'WITHDRAWAL',
        amount: freelancerAmount,
        status: 'COMPLETED',
        description: `Earnings from project: ${escrow.project.title}`
      }
    }),
    // Create platform fee transaction
    prisma.transaction.create({
      data: {
        userId: escrow.project.freelancerId!,
        escrowId: escrow.id,
        type: 'FEE',
        amount: platformFee,
        status: 'COMPLETED',
        description: `Platform fee for project: ${escrow.project.title}`
      }
    }),
    // Update freelancer total earnings
    prisma.user.update({
      where: { id: escrow.project.freelancerId! },
      data: {
        totalEarnings: {
          increment: freelancerAmount
        }
      }
    }),
    // Update client total spent
    prisma.user.update({
      where: { id: escrow.project.clientId },
      data: {
        totalSpent: {
          increment: escrow.amount
        }
      }
    })
  ]);

  console.log(`✅ Escrow payment released successfully`);

  return escrow;
};

/**
 * Refund project escrow payment
 * Called when project is cancelled before completion
 */
export const refundProjectEscrowPayment = async (projectId: string, reason?: string) => {
  console.log(`🔍 refundProjectEscrowPayment called for projectId: ${projectId}`);

  const escrow = await prisma.escrow.findUnique({
    where: { projectId },
    include: {
      project: {
        include: {
          client: true
        }
      },
      transactions: true
    }
  });

  if (!escrow) {
    throw new Error('Escrow not found for this project');
  }

  if (escrow.status !== 'FUNDED') {
    throw new Error('Cannot refund escrow that is not funded');
  }

  // Find the original payment intent
  const depositTransaction = escrow.transactions.find(t => t.type === 'DEPOSIT');
  if (!depositTransaction || !depositTransaction.stripeId) {
    throw new Error('Original payment not found');
  }

  // Cancel (refund) the payment intent
  console.log(`🔄 Cancelling payment: ${depositTransaction.stripeId}`);
  await stripe.paymentIntents.cancel(depositTransaction.stripeId);

  await prisma.$transaction([
    // Update escrow status
    prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date()
      }
    }),
    // Create refund transaction
    prisma.transaction.create({
      data: {
        userId: escrow.project.clientId,
        escrowId: escrow.id,
        type: 'REFUND',
        amount: escrow.amount,
        status: 'COMPLETED',
        description: `Refund for project: ${escrow.project.title}${reason ? ` - ${reason}` : ''}`
      }
    })
  ]);

  console.log(`✅ Escrow payment refunded successfully`);

  return escrow;
};

// ==================== SERVICE ORDER PAYMENT METHODS ====================

/**
 * Create payment intent for service order
 * Funds are held in escrow until work is approved
 */
export const createServiceOrderPayment = async (
  orderId: string,
  amount: number,
  clientId: string,
  description?: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    // Manual capture - funds held until work approved
    capture_method: 'manual',
    metadata: {
      orderId,
      clientId,
      type: 'service_order'
    },
    description: description || `Payment for service order ${orderId}`
  });

  return paymentIntent;
};

/**
 * Confirm service order payment after client pays
 * Updates order status to PAID
 */
export const confirmServiceOrderPayment = async (orderId: string, paymentIntentId: string) => {
  console.log(`🔍 confirmServiceOrderPayment called for orderId: ${orderId}, paymentIntentId: ${paymentIntentId}`);

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      client: true,
      freelancer: true
    }
  });

  if (!order) {
    console.error(`❌ Service order not found: ${orderId}`);
    throw new Error('Service order not found');
  }

  console.log(`📦 Order found:`, {
    id: order.id,
    currentStatus: order.status,
    currentPaymentStatus: order.paymentStatus
  });

  // Update order payment status
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      status: 'ACCEPTED' // Freelancer can start work
    }
  });

  console.log(`✅ Order updated:`, {
    id: updatedOrder.id,
    newStatus: updatedOrder.status,
    newPaymentStatus: updatedOrder.paymentStatus
  });

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      userId: order.clientId,
      serviceOrderId: order.id,
      type: 'DEPOSIT',
      amount: order.totalAmount,
      status: 'COMPLETED',
      stripeId: paymentIntentId,
      description: `Payment for service: ${order.service.title}`
    }
  });

  console.log(`💳 Transaction created:`, {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount
  });

  return updatedOrder;
};

/**
 * Capture payment and release to freelancer
 * Called when client approves the work
 */
export const releaseServiceOrderPayment = async (orderId: string) => {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      transactions: true
    }
  });

  if (!order) {
    throw new Error('Service order not found');
  }

  if (order.paymentStatus !== 'PAID') {
    throw new Error('Order payment not confirmed');
  }

  // Find the original payment intent from transaction
  const depositTransaction = order.transactions.find(t => t.type === 'DEPOSIT');
  if (!depositTransaction || !depositTransaction.stripeId) {
    throw new Error('Original payment not found');
  }

  // Capture the payment (release from escrow)
  await stripe.paymentIntents.capture(depositTransaction.stripeId);

  // Calculate platform fee (10%)
  const platformFee = order.totalAmount * 0.10;
  const freelancerAmount = order.totalAmount - platformFee;

  await prisma.$transaction([
    // Update order payment status
    prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'RELEASED',
        status: 'COMPLETED'
      }
    }),
    // Create freelancer payout transaction
    prisma.transaction.create({
      data: {
        userId: order.freelancerId,
        serviceOrderId: order.id,
        type: 'WITHDRAWAL',
        amount: freelancerAmount,
        status: 'COMPLETED',
        description: `Earnings from service: ${order.service.title}`
      }
    }),
    // Create platform fee transaction
    prisma.transaction.create({
      data: {
        userId: order.freelancerId,
        serviceOrderId: order.id,
        type: 'FEE',
        amount: platformFee,
        status: 'COMPLETED',
        description: `Platform fee for service: ${order.service.title}`
      }
    }),
    // Update freelancer total earnings
    prisma.user.update({
      where: { id: order.freelancerId },
      data: {
        totalEarnings: {
          increment: freelancerAmount
        }
      }
    }),
    // Update client total spent
    prisma.user.update({
      where: { id: order.clientId },
      data: {
        totalSpent: {
          increment: order.totalAmount
        }
      }
    })
  ]);

  return order;
};

/**
 * Refund service order payment
 * Called when order is cancelled or disputed
 */
export const refundServiceOrderPayment = async (orderId: string, reason?: string) => {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      transactions: true
    }
  });

  if (!order) {
    throw new Error('Service order not found');
  }

  if (order.paymentStatus !== 'PAID') {
    throw new Error('Cannot refund unpaid order');
  }

  // Find the original payment intent
  const depositTransaction = order.transactions.find(t => t.type === 'DEPOSIT');
  if (!depositTransaction || !depositTransaction.stripeId) {
    throw new Error('Original payment not found');
  }

  // Cancel (refund) the payment intent
  await stripe.paymentIntents.cancel(depositTransaction.stripeId);

  await prisma.$transaction([
    // Update order status
    prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED'
      }
    }),
    // Create refund transaction
    prisma.transaction.create({
      data: {
        userId: order.clientId,
        serviceOrderId: order.id,
        type: 'REFUND',
        amount: order.totalAmount,
        status: 'COMPLETED',
        description: `Refund for service: ${order.service.title}${reason ? ` - ${reason}` : ''}`
      }
    })
  ]);

  return order;
};

// ==================== WEBHOOK HANDLER ====================

export const handleStripeWebhook = async (event: Stripe.Event) => {
  console.log(`🔔 Webhook received: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated':
      // This event fires when a payment with manual capture is authorized (funds held)
      const capturablePayment = event.data.object as Stripe.PaymentIntent;
      const { orderId: capturableOrderId, projectId: capturableProjectId, type: capturableType } = capturablePayment.metadata;

      console.log(`💰 Payment authorized (requires_capture):`, {
        id: capturablePayment.id,
        status: capturablePayment.status,
        orderId: capturableOrderId,
        projectId: capturableProjectId,
        type: capturableType
      });

      if (capturableType === 'service_order' && capturableOrderId) {
        // Service order payment authorized - funds are held in escrow
        await confirmServiceOrderPayment(capturableOrderId, capturablePayment.id);
        console.log(`✅ Service order ${capturableOrderId} payment confirmed (funds held in escrow)`);
      } else if (capturableType === 'project_escrow' && capturableProjectId) {
        // Project escrow payment authorized - funds are held
        await confirmProjectEscrowPayment(capturableProjectId, capturablePayment.id);
        console.log(`✅ Project ${capturableProjectId} escrow payment confirmed (funds held)`);
      }
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { projectId, orderId, type } = paymentIntent.metadata;

      console.log(`✅ Payment succeeded:`, {
        id: paymentIntent.id,
        orderId,
        projectId,
        type
      });

      if (type === 'service_order' && orderId) {
        // This fires when payment is captured (released from escrow)
        // Or for automatic capture payments
        console.log(`💸 Service order ${orderId} payment captured/succeeded`);
      } else if (projectId) {
        // Project escrow payment succeeded
        const escrow = await prisma.escrow.findFirst({
          where: {
            projectId,
            stripePaymentId: paymentIntent.id
          }
        });

        if (escrow) {
          await confirmEscrowPayment(escrow.id);
          console.log(`✅ Project escrow ${escrow.id} payment confirmed`);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.error('❌ Payment failed:', failedPayment);

      // TODO: Send email notification to user about failed payment
      break;

    case 'payment_intent.canceled':
      const canceledPayment = event.data.object as Stripe.PaymentIntent;
      console.log(`🔄 Payment canceled: ${canceledPayment.id}`);
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
};