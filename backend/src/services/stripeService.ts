import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { createProjectEvent, createServiceEvent, PROJECT_EVENT_TYPES, SERVICE_EVENT_TYPES } from './eventService';
import { emailService } from './emailService';

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
 * Uses Stripe Connect Destination Charges if freelancer has Connect account,
 * otherwise funds go to platform account for manual payout via PayPal/Payoneer
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
          stripePayoutsEnabled: true,
          payoutMethod: true,
          paypalEmail: true,
          payoneerEmail: true
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

  // Calculate fee breakdown
  const agreedAmount = project.agreedAmount || amount;
  const sellerCommission = project.sellerCommission || 0;
  const buyerFee = project.buyerFee || 0;
  const totalPlatformFee = sellerCommission + buyerFee;

  // Check if freelancer has Stripe Connect for automatic payouts
  const hasStripeConnect = project.freelancer.stripeConnectAccountId && project.freelancer.stripePayoutsEnabled;

  if (hasStripeConnect) {
    // Use Destination Charges for automatic payout to freelancer's Stripe account
    console.log('💰 Creating payment intent with destination charges (Stripe Connect):', {
      totalAmount: amount,
      agreedAmount,
      platformFee: totalPlatformFee,
      freelancerConnectAccount: project.freelancer.stripeConnectAccountId
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual',
      transfer_data: {
        destination: project.freelancer.stripeConnectAccountId!,
      },
      application_fee_amount: Math.round(totalPlatformFee * 100),
      metadata: {
        projectId,
        clientId,
        freelancerId: project.freelancerId!,
        type: 'project_escrow',
        payoutMethod: 'STRIPE'
      },
      description: description || `Escrow payment for project ${projectId}`
    });

    console.log('✅ Payment intent created with destination charges');
    return paymentIntent;
  } else {
    // No Stripe Connect - funds go to platform account for manual payout
    console.log('💰 Creating payment intent WITHOUT destination charges (manual payout):', {
      totalAmount: amount,
      agreedAmount,
      platformFee: totalPlatformFee,
      payoutMethod: project.freelancer.payoutMethod || 'PENDING_SETUP'
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual',
      // No transfer_data - funds stay in platform account
      metadata: {
        projectId,
        clientId,
        freelancerId: project.freelancerId!,
        type: 'project_escrow',
        payoutMethod: project.freelancer.payoutMethod || 'PENDING_SETUP'
      },
      description: description || `Escrow payment for project ${projectId}`
    });

    console.log('✅ Payment intent created for manual payout');
    return paymentIntent;
  }
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

  // Create timeline event for escrow funding (after all operations complete)
  await createProjectEvent({
    projectId,
    eventType: PROJECT_EVENT_TYPES.ESCROW_FUNDED,
    actorId: project.clientId,
    actorName: `${project.client.firstName} ${project.client.lastName}`,
    metadata: {
      amount: escrow.amount,
      stripePaymentId: paymentIntentId,
      totalCharged: project.totalCharged || escrow.amount
    }
  });

  // Send email to freelancer about escrow being funded
  try {
    if (project.freelancer) {
      const freelancerDetails = await prisma.user.findUnique({
        where: { id: project.freelancer.id },
        select: { email: true, firstName: true }
      });

      if (freelancerDetails) {
        await emailService.sendEscrowFundedFreelancerEmail({
          freelancer: { email: freelancerDetails.email, firstName: freelancerDetails.firstName },
          client: { firstName: project.client.firstName, lastName: project.client.lastName },
          project: { id: projectId, title: project.title },
          fundedAmount: project.agreedAmount || escrow.amount
        });
      }
    }
  } catch (error) {
    console.error('Error sending escrow funded email:', error);
    // Don't fail the payment if email fails
  }

  return escrow;
};

/**
 * Release project escrow payment to freelancer
 * Called when client approves completed work
 * Captures payment and distributes funds with proper fee structure
 *
 * For Stripe Connect users: Funds automatically route to their Connect account
 * For PayPal/Payoneer users: Creates a Payout record for manual processing
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

  // Check the payment intent to see if it used destination charges (Stripe Connect)
  const paymentIntent = await stripe.paymentIntents.retrieve(depositTransaction.stripeId);
  const usedStripeConnect = !!paymentIntent.transfer_data?.destination;

  // Capture the payment (release from escrow)
  console.log(`📥 Capturing payment: ${depositTransaction.stripeId}`);
  await stripe.paymentIntents.capture(depositTransaction.stripeId);

  // Calculate amounts using the new fee structure
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
    platformTotal: totalPlatformFee,
    usedStripeConnect
  });

  // Determine payout method and email
  const freelancer = escrow.project.freelancer;
  const payoutMethod = usedStripeConnect ? 'STRIPE' : (freelancer.payoutMethod || null);
  const payoutEmail = payoutMethod === 'PAYPAL' ? freelancer.paypalEmail :
                      payoutMethod === 'PAYONEER' ? freelancer.payoneerEmail : null;

  // For non-Stripe Connect, create a Payout record for manual processing
  const payoutData = !usedStripeConnect ? {
    userId: freelancer.id,
    projectId,
    amount: freelancerAmount,
    platformFee: sellerCommission,
    payoutMethod: payoutMethod as any,
    payoutEmail,
    status: 'PENDING' as const
  } : null;

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
        status: usedStripeConnect ? 'COMPLETED' : 'PENDING',
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
    }),
    // Create Payout record for manual payouts (PayPal/Payoneer)
    ...(payoutData ? [prisma.payout.create({ data: payoutData })] : [])
  ]);

  // Create timeline event for payment release
  await createProjectEvent({
    projectId,
    eventType: PROJECT_EVENT_TYPES.PAYMENT_RELEASED,
    actorId: null,
    actorName: 'System',
    metadata: {
      amount: freelancerAmount,
      platformFee: totalPlatformFee,
      stripePaymentId: depositTransaction.stripeId,
      releasedTo: escrow.project.freelancerId,
      releasedToName: `${escrow.project.freelancer.firstName} ${escrow.project.freelancer.lastName}`,
      payoutMethod: usedStripeConnect ? 'STRIPE' : payoutMethod,
      requiresManualPayout: !usedStripeConnect
    }
  });

  console.log(`✅ Escrow payment released successfully`);

  if (usedStripeConnect) {
    console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
  } else {
    console.log(`📋 Payout record created for manual processing via ${payoutMethod || 'PENDING_SETUP'}`);
  }
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
 * Uses Stripe Connect Destination Charges if freelancer has Connect account,
 * otherwise funds go to platform account for manual payout via PayPal/Payoneer
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
          stripePayoutsEnabled: true,
          payoutMethod: true,
          paypalEmail: true,
          payoneerEmail: true
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

  // Calculate fee breakdown
  const totalPlatformFee = order.buyerFee + order.sellerCommission;

  // Check if freelancer has Stripe Connect for automatic payouts
  const hasStripeConnect = order.freelancer.stripeConnectAccountId && order.freelancer.stripePayoutsEnabled;

  if (hasStripeConnect) {
    // Use Destination Charges for automatic payout to freelancer's Stripe account
    console.log('💰 Creating service order payment intent with destination charges (Stripe Connect):', {
      totalAmount: amount,
      packagePrice: order.packagePrice,
      platformFee: totalPlatformFee,
      freelancerConnectAccount: order.freelancer.stripeConnectAccountId
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual',
      transfer_data: {
        destination: order.freelancer.stripeConnectAccountId!,
      },
      application_fee_amount: Math.round(totalPlatformFee * 100),
      metadata: {
        orderId,
        clientId,
        freelancerId: order.freelancerId,
        type: 'service_order',
        payoutMethod: 'STRIPE'
      },
      description: description || `Payment for service order ${orderId}`
    });

    console.log('✅ Service order payment intent created with destination charges');
    return paymentIntent;
  } else {
    // No Stripe Connect - funds go to platform account for manual payout
    console.log('💰 Creating service order payment intent WITHOUT destination charges (manual payout):', {
      totalAmount: amount,
      packagePrice: order.packagePrice,
      platformFee: totalPlatformFee,
      payoutMethod: order.freelancer.payoutMethod || 'PENDING_SETUP'
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      capture_method: 'manual',
      // No transfer_data - funds stay in platform account
      metadata: {
        orderId,
        clientId,
        freelancerId: order.freelancerId,
        type: 'service_order',
        payoutMethod: order.freelancer.payoutMethod || 'PENDING_SETUP'
      },
      description: description || `Payment for service order ${orderId}`
    });

    console.log('✅ Service order payment intent created for manual payout');
    return paymentIntent;
  }
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

  // Update order payment status - go directly to IN_PROGRESS (matching project workflow)
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      status: 'IN_PROGRESS' // Freelancer can start work immediately
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

  // Create timeline event for payment received (after Stripe confirmation)
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.PAYMENT_RECEIVED,
    actorId: null, // System-generated event
    actorName: 'System',
    metadata: {
      amount: order.totalAmount,
      packagePrice: order.packagePrice,
      buyerFee: order.buyerFee,
      stripePaymentId: paymentIntentId,
      paidBy: order.clientId,
      paidByName: `${order.client.firstName} ${order.client.lastName}`
    }
  });

  return updatedOrder;
};

/**
 * Capture payment and release to freelancer
 * Called when client approves the work
 *
 * For Stripe Connect users: Funds automatically route to their Connect account
 * For PayPal/Payoneer users: Creates a Payout record for manual processing
 */
export const releaseServiceOrderPayment = async (orderId: string) => {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      transactions: true,
      freelancer: true
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

  // Check the payment intent to see if it used destination charges (Stripe Connect)
  const paymentIntent = await stripe.paymentIntents.retrieve(depositTransaction.stripeId);
  const usedStripeConnect = !!paymentIntent.transfer_data?.destination;

  // Capture the payment (release from escrow)
  await stripe.paymentIntents.capture(depositTransaction.stripeId);

  // Calculate amounts
  const freelancerAmount = order.packagePrice - order.sellerCommission;
  const totalPlatformFee = order.buyerFee + order.sellerCommission;

  console.log(`💸 Payment breakdown:`, {
    totalHeld: order.totalAmount,
    packagePrice: order.packagePrice,
    buyerFee: order.buyerFee,
    sellerCommission: order.sellerCommission,
    freelancerReceives: freelancerAmount,
    platformTotal: totalPlatformFee,
    usedStripeConnect
  });

  // Determine payout method and email
  const freelancer = order.freelancer;
  const payoutMethod = usedStripeConnect ? 'STRIPE' : (freelancer.payoutMethod || null);
  const payoutEmail = payoutMethod === 'PAYPAL' ? freelancer.paypalEmail :
                      payoutMethod === 'PAYONEER' ? freelancer.payoneerEmail : null;

  // For non-Stripe Connect, create a Payout record for manual processing
  const payoutData = !usedStripeConnect ? {
    userId: freelancer.id,
    serviceOrderId: orderId,
    amount: freelancerAmount,
    platformFee: order.sellerCommission,
    payoutMethod: payoutMethod as any,
    payoutEmail,
    status: 'PENDING' as const
  } : null;

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
        status: usedStripeConnect ? 'COMPLETED' : 'PENDING',
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
    }),
    // Create Payout record for manual payouts (PayPal/Payoneer)
    ...(payoutData ? [prisma.payout.create({ data: payoutData })] : [])
  ]);

  if (usedStripeConnect) {
    console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
  } else {
    console.log(`📋 Payout record created for manual processing via ${payoutMethod || 'PENDING_SETUP'}`);
  }
  console.log(`   Freelancer receives: $${freelancerAmount} (after ${order.sellerCommission} commission)`);
  console.log(`   Platform receives: $${totalPlatformFee} (buyer fee + seller commission)`);

  // Create timeline event for payment release
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.PAYMENT_RELEASED,
    actorId: null,
    actorName: 'System',
    metadata: {
      amount: freelancerAmount,
      platformFee: totalPlatformFee,
      stripePaymentId: depositTransaction.stripeId,
      releasedTo: order.freelancerId,
      releasedToName: `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      payoutMethod: usedStripeConnect ? 'STRIPE' : payoutMethod,
      requiresManualPayout: !usedStripeConnect
    }
  });

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