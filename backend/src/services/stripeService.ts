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
 * Uses Stripe Connect Destination Charges to automatically route payment to freelancer on capture
 */
export const createProjectEscrowPayment = async (
  projectId: string,
  amount: number,
  clientId: string,
  description?: string
) => {
  // Get project with freelancer's Connect account and fee structure
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      freelancerId: true,
      agreedAmount: true,
      buyerFee: true,
      sellerCommission: true,
      freelancer: {
        select: {
          id: true,
          stripeConnectAccountId: true,
          stripePayoutsEnabled: true
        }
      }
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!project.freelancer) {
    throw new Error('Project must have an assigned freelancer');
  }

  // Check if freelancer has Connect account set up
  if (!project.freelancer.stripeConnectAccountId) {
    throw new Error('Freelancer must complete Stripe Connect onboarding before escrow can be funded');
  }

  if (!project.freelancer.stripePayoutsEnabled) {
    throw new Error('Freelancer payouts not enabled. They may need to complete verification with Stripe.');
  }

  // Calculate fee breakdown
  const agreedAmount = project.agreedAmount || amount;
  const sellerCommission = project.sellerCommission || 0;
  const buyerFee = project.buyerFee || 0;
  const totalPlatformFee = sellerCommission + buyerFee;

  console.log('💰 Creating payment intent with destination charges:', {
    totalAmount: amount,
    agreedAmount,
    platformFee: totalPlatformFee,
    freelancerConnectAccount: project.freelancer.stripeConnectAccountId
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    // Manual capture - funds held until work approved (ESCROW PROTECTION)
    capture_method: 'manual',

    // Destination Charges: Route payment to freelancer's Connect account on capture
    transfer_data: {
      destination: project.freelancer.stripeConnectAccountId,
    },

    // Platform fee: Automatically deducted and sent to platform account
    application_fee_amount: Math.round(totalPlatformFee * 100),

    metadata: {
      projectId,
      clientId,
      freelancerId: project.freelancerId!,
      type: 'project_escrow'
    },
    description: description || `Escrow payment for project ${projectId}`
  });

  console.log('✅ Payment intent created with destination charges:', {
    paymentIntentId: paymentIntent.id,
    destination: project.freelancer.stripeConnectAccountId,
    applicationFee: totalPlatformFee
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

  // Use totalCharged or agreedAmount or maxBudget for escrow amount
  const escrowAmount = project.totalCharged || project.agreedAmount || project.maxBudget;

  // Create or update escrow record
  const escrow = await prisma.escrow.upsert({
    where: { projectId },
    create: {
      projectId,
      amount: escrowAmount,
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

  // Update project payment status to PAID
  await prisma.project.update({
    where: { id: projectId },
    data: {
      paymentStatus: 'PAID'
    }
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
 * Captures payment and distributes funds with proper fee structure
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
    status: escrow.status,
    agreedAmount: escrow.project.agreedAmount,
    buyerFee: escrow.project.buyerFee,
    sellerCommission: escrow.project.sellerCommission
  });

  // Find the original payment intent from transaction
  const depositTransaction = escrow.transactions.find(t => t.type === 'DEPOSIT');
  if (!depositTransaction || !depositTransaction.stripeId) {
    throw new Error('Original payment not found');
  }

  // Capture the payment (release from escrow)
  console.log(`📥 Capturing payment: ${depositTransaction.stripeId}`);
  await stripe.paymentIntents.capture(depositTransaction.stripeId);

  // Calculate amounts using the new fee structure
  // Total held in escrow: agreedAmount + buyerFee (totalCharged)
  // Platform keeps: buyerFee + sellerCommission
  // Freelancer receives: agreedAmount - sellerCommission
  const agreedAmount = escrow.project.agreedAmount || escrow.amount;
  const buyerFee = escrow.project.buyerFee || 0;
  const sellerCommission = escrow.project.sellerCommission || 0;
  const freelancerAmount = agreedAmount - sellerCommission;
  const totalPlatformFee = buyerFee + sellerCommission;

  console.log(`💸 Payment breakdown:`, {
    totalHeld: escrow.amount,
    agreedAmount,
    buyerFee,
    sellerCommission,
    freelancerReceives: freelancerAmount,
    platformTotal: totalPlatformFee
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
    // Update project payment status
    prisma.project.update({
      where: { id: projectId },
      data: {
        paymentStatus: 'RELEASED'
      }
    }),
    // Create buyer fee transaction (platform revenue from buyer)
    prisma.transaction.create({
      data: {
        userId: escrow.project.clientId,
        escrowId: escrow.id,
        type: 'FEE',
        amount: buyerFee,
        status: 'COMPLETED',
        description: `Buyer service fee (2.5%): ${escrow.project.title}`
      }
    }),
    // Create seller commission transaction (platform revenue from seller)
    prisma.transaction.create({
      data: {
        userId: escrow.project.freelancerId!,
        escrowId: escrow.id,
        type: 'FEE',
        amount: sellerCommission,
        status: 'COMPLETED',
        description: `Seller commission (12.5%): ${escrow.project.title}`
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

  // NOTE: With Stripe Connect Destination Charges, the payment automatically routes
  // to the freelancer's Connect account when we capture the PaymentIntent above.
  // The platform fee (application_fee_amount) is automatically deducted and sent to our account.
  // No manual transfer needed - Stripe handles everything atomically on capture.

  console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
  console.log(`   Freelancer receives: $${freelancerAmount} (after ${sellerCommission} commission)`);
  console.log(`   Platform receives: $${totalPlatformFee} (buyer fee + seller commission)`);

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
 * Uses Stripe Connect Destination Charges to automatically route payment to freelancer on capture
 */
export const createServiceOrderPayment = async (
  orderId: string,
  amount: number,
  clientId: string,
  description?: string
) => {
  // Get service order with freelancer's Connect account and fee structure
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      freelancerId: true,
      packagePrice: true,
      buyerFee: true,
      sellerCommission: true,
      totalAmount: true,
      freelancer: {
        select: {
          id: true,
          stripeConnectAccountId: true,
          stripePayoutsEnabled: true
        }
      }
    }
  });

  if (!order) {
    throw new Error('Service order not found');
  }

  if (!order.freelancer) {
    throw new Error('Service order must have an assigned freelancer');
  }

  // Check if freelancer has Connect account set up
  if (!order.freelancer.stripeConnectAccountId) {
    throw new Error('Freelancer must complete Stripe Connect onboarding before payment can be processed');
  }

  if (!order.freelancer.stripePayoutsEnabled) {
    throw new Error('Freelancer payouts not enabled. They may need to complete verification with Stripe.');
  }

  // Calculate fee breakdown
  const totalPlatformFee = order.buyerFee + order.sellerCommission;

  console.log('💰 Creating service order payment intent with destination charges:', {
    totalAmount: amount,
    packagePrice: order.packagePrice,
    platformFee: totalPlatformFee,
    freelancerConnectAccount: order.freelancer.stripeConnectAccountId
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    // Manual capture - funds held until work approved (ESCROW PROTECTION)
    capture_method: 'manual',

    // Destination Charges: Route payment to freelancer's Connect account on capture
    transfer_data: {
      destination: order.freelancer.stripeConnectAccountId,
    },

    // Platform fee: Automatically deducted and sent to platform account
    application_fee_amount: Math.round(totalPlatformFee * 100),

    metadata: {
      orderId,
      clientId,
      freelancerId: order.freelancerId,
      type: 'service_order'
    },
    description: description || `Payment for service order ${orderId}`
  });

  console.log('✅ Service order payment intent created with destination charges:', {
    paymentIntentId: paymentIntent.id,
    destination: order.freelancer.stripeConnectAccountId,
    applicationFee: totalPlatformFee
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

  // Calculate amounts using the new fee structure
  // Total held in escrow: packagePrice + buyerFee
  // Platform keeps: buyerFee + sellerCommission
  // Freelancer receives: packagePrice - sellerCommission
  const freelancerAmount = order.packagePrice - order.sellerCommission;
  const totalPlatformFee = order.buyerFee + order.sellerCommission;

  console.log(`💸 Payment breakdown:`, {
    totalHeld: order.totalAmount,
    packagePrice: order.packagePrice,
    buyerFee: order.buyerFee,
    sellerCommission: order.sellerCommission,
    freelancerReceives: freelancerAmount,
    platformTotal: totalPlatformFee
  });

  await prisma.$transaction([
    // Update order payment status
    prisma.serviceOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'RELEASED',
        status: 'COMPLETED'
      }
    }),
    // Create buyer fee transaction (platform revenue from buyer)
    prisma.transaction.create({
      data: {
        userId: order.clientId,
        serviceOrderId: order.id,
        type: 'FEE',
        amount: order.buyerFee,
        status: 'COMPLETED',
        description: `Buyer service fee (2.5%): ${order.service.title}`
      }
    }),
    // Create seller commission transaction (platform revenue from seller)
    prisma.transaction.create({
      data: {
        userId: order.freelancerId,
        serviceOrderId: order.id,
        type: 'FEE',
        amount: order.sellerCommission,
        status: 'COMPLETED',
        description: `Seller commission (12.5%): ${order.service.title}`
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

  // NOTE: With Stripe Connect Destination Charges, the payment automatically routes
  // to the freelancer's Connect account when we capture the PaymentIntent above.
  // The platform fee (application_fee_amount) is automatically deducted and sent to our account.
  // No manual transfer needed - Stripe handles everything atomically on capture.

  console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
  console.log(`   Freelancer receives: $${freelancerAmount} (after ${order.sellerCommission} commission)`);
  console.log(`   Platform receives: $${totalPlatformFee} (buyer fee + seller commission)`);

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
        // Project escrow payment succeeded - already handled in amount_capturable_updated event
        console.log(`💸 Project ${projectId} payment captured/succeeded`);
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

    case 'account.updated':
      // Stripe Connect account status updated
      const account = event.data.object as Stripe.Account;
      const userId = account.metadata?.userId;

      if (userId) {
        console.log(`👤 Updating Connect account status for user ${userId}`);

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripePayoutsEnabled: account.payouts_enabled || false,
            stripeChargesEnabled: account.charges_enabled || false,
            stripeDetailsSubmitted: account.details_submitted || false,
            stripeOnboardingComplete: (account.details_submitted && account.payouts_enabled) || false
          }
        });

        console.log(`✅ User ${userId} Connect status updated`);
      }
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }
};