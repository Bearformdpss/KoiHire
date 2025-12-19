import Stripe from 'stripe';
import { PrismaClient, Prisma } from '@prisma/client';
import { createProjectEvent, createServiceEvent, PROJECT_EVENT_TYPES, SERVICE_EVENT_TYPES } from './eventService';
import { emailService } from './emailService';
import { withPaymentIdempotency, withSimpleIdempotency } from '../utils/webhookIdempotency';

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

  // IDEMPOTENCY CHECK: Prevent duplicate processing if webhook is retried
  // Check if we've already created a Transaction for this PaymentIntent
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      stripeId: paymentIntentId,
      type: 'DEPOSIT',
      status: 'COMPLETED'
    }
  });

  if (existingTransaction) {
    console.log(`⏭️ Payment ${paymentIntentId} already processed (duplicate webhook detected)`);

    // Return existing escrow instead of creating duplicates
    const escrow = await prisma.escrow.findUnique({
      where: { projectId }
    });

    if (!escrow) {
      throw new Error('Transaction exists but escrow not found - data inconsistency');
    }

    return escrow; // Return early - idempotent
  }

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
  const startTime = Date.now();
  console.log(`🔍 releaseProjectEscrowPayment called for projectId: ${projectId}`);

  return await prisma.$transaction(
    async (tx) => {
      // Use SELECT FOR UPDATE to lock the escrow row and prevent concurrent modifications
      // This ensures only one request can process the release at a time
      const escrowRows = await tx.$queryRaw<Array<any>>`
        SELECT * FROM "escrow"
        WHERE "projectId" = ${projectId}
        FOR UPDATE
      `;

      if (!escrowRows || escrowRows.length === 0) {
        throw new Error('Escrow not found for this project');
      }

      const escrowRecord = escrowRows[0];

      if (escrowRecord.status !== 'FUNDED') {
        throw new Error(`Escrow status is ${escrowRecord.status}, expected FUNDED`);
      }

      // Get related data (not locked, just for reference)
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { client: true, freelancer: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.freelancer) {
        throw new Error('No freelancer assigned to this project');
      }

      const transactions = await tx.transaction.findMany({
        where: { escrowId: escrowRecord.id }
      });

      console.log(`💰 Escrow found (locked):`, {
        id: escrowRecord.id,
        amount: escrowRecord.amount,
        status: escrowRecord.status,
        agreedAmount: project.agreedAmount,
        buyerFee: project.buyerFee,
        sellerCommission: project.sellerCommission
      });

      // Find the original payment intent from transaction
      const depositTransaction = transactions.find(t => t.type === 'DEPOSIT');
      if (!depositTransaction || !depositTransaction.stripeId) {
        throw new Error('Original payment not found');
      }

      // Check the payment intent to see if it used destination charges (Stripe Connect)
      const paymentIntent = await stripe.paymentIntents.retrieve(depositTransaction.stripeId);
      const usedStripeConnect = !!paymentIntent.transfer_data?.destination;

      // Capture the payment (release from escrow)
      // This is idempotent - Stripe prevents double capture
      console.log(`📥 Capturing payment: ${depositTransaction.stripeId}`);

      try {
        await stripe.paymentIntents.capture(depositTransaction.stripeId);
      } catch (error: any) {
        // If already captured, Stripe returns specific error
        if (error.code === 'payment_intent_unexpected_state') {
          console.log('⚠️ Payment already captured (race condition caught), continuing with database update');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Calculate amounts using the new fee structure
      const agreedAmount = project.agreedAmount || escrowRecord.amount;
      const buyerFee = project.buyerFee || 0;
      const sellerCommission = project.sellerCommission || 0;
      const freelancerAmount = agreedAmount - sellerCommission;
      const totalPlatformFee = buyerFee + sellerCommission;

      console.log(`💸 Payment breakdown:`, {
        totalHeld: escrowRecord.amount,
        agreedAmount,
        buyerFee,
        sellerCommission,
        freelancerReceives: freelancerAmount,
        platformTotal: totalPlatformFee,
        usedStripeConnect
      });

      // Determine payout method and email
      const freelancer = project.freelancer;
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

      // All database updates in same transaction
      await tx.escrow.update({
        where: { id: escrowRecord.id },
        data: { status: 'RELEASED', releasedAt: new Date() }
      });

      await tx.project.update({
        where: { id: projectId },
        data: { paymentStatus: 'RELEASED' }
      });

      await tx.transaction.create({
        data: {
          userId: project.clientId,
          escrowId: escrowRecord.id,
          type: 'FEE',
          amount: buyerFee,
          status: 'COMPLETED',
          description: `Buyer service fee (2.5%): ${project.title}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: project.freelancerId!,
          escrowId: escrowRecord.id,
          type: 'FEE',
          amount: sellerCommission,
          status: 'COMPLETED',
          description: `Seller commission (12.5%): ${project.title}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: project.freelancerId!,
          escrowId: escrowRecord.id,
          type: 'WITHDRAWAL',
          amount: freelancerAmount,
          status: usedStripeConnect ? 'COMPLETED' : 'PENDING',
          description: `Earnings from project: ${project.title}`
        }
      });

      await tx.user.update({
        where: { id: project.freelancerId! },
        data: { totalEarnings: { increment: freelancerAmount } }
      });

      await tx.user.update({
        where: { id: project.clientId },
        data: { totalSpent: { increment: escrowRecord.amount } }
      });

      if (payoutData) {
        await tx.payout.create({ data: payoutData });
      }

      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`⚠️ Slow payment release: ${duration}ms for project ${projectId}`);
      }

      console.log(`✅ Escrow payment released successfully (${duration}ms)`);

      if (usedStripeConnect) {
        console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
      } else {
        console.log(`📋 Payout record created for manual processing via ${payoutMethod || 'PENDING_SETUP'}`);
      }
      console.log(`   Freelancer receives: $${freelancerAmount} (after ${sellerCommission} commission)`);
      console.log(`   Platform receives: $${totalPlatformFee} (buyer fee + seller commission)`);

      // Create timeline event after transaction commits (outside of transaction for better performance)
      setImmediate(async () => {
        try {
          await createProjectEvent({
            projectId,
            eventType: PROJECT_EVENT_TYPES.PAYMENT_RELEASED,
            actorId: null,
            actorName: 'System',
            metadata: {
              amount: freelancerAmount,
              platformFee: totalPlatformFee,
              stripePaymentId: depositTransaction.stripeId,
              releasedTo: project.freelancerId,
              releasedToName: `${freelancer.firstName} ${freelancer.lastName}`,
              payoutMethod: usedStripeConnect ? 'STRIPE' : payoutMethod,
              requiresManualPayout: !usedStripeConnect
            }
          });
        } catch (error) {
          console.error('Failed to create project event:', error);
        }
      });

      return escrowRecord;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,  // Wait up to 5 seconds for transaction to start
      timeout: 15000, // Transaction must complete within 15 seconds
    }
  );
};

/**
 * Refund project escrow payment
 * Called when project is cancelled before completion
 */
export const refundProjectEscrowPayment = async (projectId: string, reason?: string) => {
  const startTime = Date.now();
  console.log(`🔍 refundProjectEscrowPayment called for projectId: ${projectId}`);

  return await prisma.$transaction(
    async (tx) => {
      // Use SELECT FOR UPDATE to lock the escrow row and prevent concurrent modifications
      const escrowRows = await tx.$queryRaw<Array<any>>`
        SELECT * FROM "escrow"
        WHERE "projectId" = ${projectId}
        FOR UPDATE
      `;

      if (!escrowRows || escrowRows.length === 0) {
        throw new Error('Escrow not found for this project');
      }

      const escrowRecord = escrowRows[0];

      if (escrowRecord.status !== 'FUNDED') {
        throw new Error(`Cannot refund escrow with status ${escrowRecord.status}, expected FUNDED`);
      }

      // Get related data
      const project = await tx.project.findUnique({
        where: { id: projectId },
        include: { client: true }
      });

      const transactions = await tx.transaction.findMany({
        where: { escrowId: escrowRecord.id }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      console.log(`💰 Escrow found for refund (locked):`, {
        id: escrowRecord.id,
        amount: escrowRecord.amount,
        status: escrowRecord.status
      });

      // Find the original payment intent
      const depositTransaction = transactions.find(t => t.type === 'DEPOSIT');
      if (!depositTransaction || !depositTransaction.stripeId) {
        throw new Error('Original payment not found');
      }

      // Cancel (refund) the payment intent
      // This is idempotent - Stripe prevents double cancellation
      console.log(`🔄 Cancelling payment: ${depositTransaction.stripeId}`);

      try {
        await stripe.paymentIntents.cancel(depositTransaction.stripeId);
      } catch (error: any) {
        // If already canceled, Stripe returns specific error
        if (error.code === 'payment_intent_unexpected_state') {
          console.log('⚠️ Payment already canceled (race condition caught), continuing with database update');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // All database updates in same transaction
      await tx.escrow.update({
        where: { id: escrowRecord.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date()
        }
      });

      await tx.transaction.create({
        data: {
          userId: project.clientId,
          escrowId: escrowRecord.id,
          type: 'REFUND',
          amount: escrowRecord.amount,
          status: 'COMPLETED',
          description: `Refund for project: ${project.title}${reason ? ` - ${reason}` : ''}`
        }
      });

      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`⚠️ Slow refund operation: ${duration}ms for project ${projectId}`);
      }

      console.log(`✅ Escrow payment refunded successfully (${duration}ms)`);

      return escrowRecord;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    }
  );
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

  // IDEMPOTENCY CHECK: Prevent duplicate processing if webhook is retried
  // Check if we've already created a Transaction for this PaymentIntent
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      stripeId: paymentIntentId,
      type: 'DEPOSIT',
      status: 'COMPLETED'
    }
  });

  if (existingTransaction) {
    console.log(`⏭️ Payment ${paymentIntentId} already processed (duplicate webhook detected)`);

    // Return existing order instead of creating duplicates
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Transaction exists but order not found - data inconsistency');
    }

    return order; // Return early - idempotent
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
  const startTime = Date.now();
  console.log(`🔍 releaseServiceOrderPayment called for orderId: ${orderId}`);

  return await prisma.$transaction(
    async (tx) => {
      // Use SELECT FOR UPDATE to lock the service order row and prevent concurrent modifications
      const orderRows = await tx.$queryRaw<Array<any>>`
        SELECT * FROM "service_orders"
        WHERE "id" = ${orderId}
        FOR UPDATE
      `;

      if (!orderRows || orderRows.length === 0) {
        throw new Error('Service order not found');
      }

      const orderRecord = orderRows[0];

      if (orderRecord.paymentStatus !== 'PAID') {
        throw new Error(`Order payment status is ${orderRecord.paymentStatus}, expected PAID`);
      }

      // Get related data
      const service = await tx.service.findUnique({
        where: { id: orderRecord.serviceId }
      });

      const freelancer = await tx.user.findUnique({
        where: { id: orderRecord.freelancerId }
      });

      const transactions = await tx.transaction.findMany({
        where: { serviceOrderId: orderId }
      });

      if (!service || !freelancer) {
        throw new Error('Service or freelancer not found');
      }

      console.log(`💰 Service order found (locked):`, {
        id: orderRecord.id,
        totalAmount: orderRecord.totalAmount,
        paymentStatus: orderRecord.paymentStatus,
        packagePrice: orderRecord.packagePrice,
        buyerFee: orderRecord.buyerFee,
        sellerCommission: orderRecord.sellerCommission
      });

      // Find the original payment intent from transaction
      const depositTransaction = transactions.find(t => t.type === 'DEPOSIT');
      if (!depositTransaction || !depositTransaction.stripeId) {
        throw new Error('Original payment not found');
      }

      // Check the payment intent to see if it used destination charges (Stripe Connect)
      const paymentIntent = await stripe.paymentIntents.retrieve(depositTransaction.stripeId);
      const usedStripeConnect = !!paymentIntent.transfer_data?.destination;

      // Capture the payment (release from escrow)
      // This is idempotent - Stripe prevents double capture
      console.log(`📥 Capturing payment: ${depositTransaction.stripeId}`);

      try {
        await stripe.paymentIntents.capture(depositTransaction.stripeId);
      } catch (error: any) {
        // If already captured, Stripe returns specific error
        if (error.code === 'payment_intent_unexpected_state') {
          console.log('⚠️ Payment already captured (race condition caught), continuing with database update');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Calculate amounts
      const freelancerAmount = orderRecord.packagePrice - orderRecord.sellerCommission;
      const totalPlatformFee = orderRecord.buyerFee + orderRecord.sellerCommission;

      console.log(`💸 Payment breakdown:`, {
        totalHeld: orderRecord.totalAmount,
        packagePrice: orderRecord.packagePrice,
        buyerFee: orderRecord.buyerFee,
        sellerCommission: orderRecord.sellerCommission,
        freelancerReceives: freelancerAmount,
        platformTotal: totalPlatformFee,
        usedStripeConnect
      });

      // Determine payout method and email
      const payoutMethod = usedStripeConnect ? 'STRIPE' : (freelancer.payoutMethod || null);
      const payoutEmail = payoutMethod === 'PAYPAL' ? freelancer.paypalEmail :
                          payoutMethod === 'PAYONEER' ? freelancer.payoneerEmail : null;

      // For non-Stripe Connect, create a Payout record for manual processing
      const payoutData = !usedStripeConnect ? {
        userId: freelancer.id,
        serviceOrderId: orderId,
        amount: freelancerAmount,
        platformFee: orderRecord.sellerCommission,
        payoutMethod: payoutMethod as any,
        payoutEmail,
        status: 'PENDING' as const
      } : null;

      // All database updates in same transaction
      await tx.serviceOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'RELEASED',
          status: 'COMPLETED'
        }
      });

      await tx.transaction.create({
        data: {
          userId: orderRecord.clientId,
          serviceOrderId: orderId,
          type: 'FEE',
          amount: orderRecord.buyerFee,
          status: 'COMPLETED',
          description: `Buyer service fee (2.5%): ${service.title}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: orderRecord.freelancerId,
          serviceOrderId: orderId,
          type: 'FEE',
          amount: orderRecord.sellerCommission,
          status: 'COMPLETED',
          description: `Seller commission (12.5%): ${service.title}`
        }
      });

      await tx.transaction.create({
        data: {
          userId: orderRecord.freelancerId,
          serviceOrderId: orderId,
          type: 'WITHDRAWAL',
          amount: freelancerAmount,
          status: usedStripeConnect ? 'COMPLETED' : 'PENDING',
          description: `Earnings from service: ${service.title}`
        }
      });

      await tx.user.update({
        where: { id: orderRecord.freelancerId },
        data: { totalEarnings: { increment: freelancerAmount } }
      });

      await tx.user.update({
        where: { id: orderRecord.clientId },
        data: { totalSpent: { increment: orderRecord.totalAmount } }
      });

      if (payoutData) {
        await tx.payout.create({ data: payoutData });
      }

      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`⚠️ Slow service order payment release: ${duration}ms for order ${orderId}`);
      }

      console.log(`✅ Service order payment released successfully (${duration}ms)`);

      if (usedStripeConnect) {
        console.log(`💰 Payment automatically routed to freelancer via Destination Charges`);
      } else {
        console.log(`📋 Payout record created for manual processing via ${payoutMethod || 'PENDING_SETUP'}`);
      }
      console.log(`   Freelancer receives: $${freelancerAmount} (after ${orderRecord.sellerCommission} commission)`);
      console.log(`   Platform receives: $${totalPlatformFee} (buyer fee + seller commission)`);

      // Create timeline event after transaction commits
      setImmediate(async () => {
        try {
          await createServiceEvent({
            serviceOrderId: orderId,
            eventType: SERVICE_EVENT_TYPES.PAYMENT_RELEASED,
            actorId: null,
            actorName: 'System',
            metadata: {
              amount: freelancerAmount,
              platformFee: totalPlatformFee,
              stripePaymentId: depositTransaction.stripeId,
              releasedTo: orderRecord.freelancerId,
              releasedToName: `${freelancer.firstName} ${freelancer.lastName}`,
              payoutMethod: usedStripeConnect ? 'STRIPE' : payoutMethod,
              requiresManualPayout: !usedStripeConnect
            }
          });
        } catch (error) {
          console.error('Failed to create service event:', error);
        }
      });

      return orderRecord;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    }
  );
};

/**
 * Refund service order payment
 * Called when order is cancelled or disputed
 */
export const refundServiceOrderPayment = async (orderId: string, reason?: string) => {
  const startTime = Date.now();
  console.log(`🔍 refundServiceOrderPayment called for orderId: ${orderId}`);

  return await prisma.$transaction(
    async (tx) => {
      // Use SELECT FOR UPDATE to lock the service order row and prevent concurrent modifications
      const orderRows = await tx.$queryRaw<Array<any>>`
        SELECT * FROM "service_orders"
        WHERE "id" = ${orderId}
        FOR UPDATE
      `;

      if (!orderRows || orderRows.length === 0) {
        throw new Error('Service order not found');
      }

      const orderRecord = orderRows[0];

      if (orderRecord.paymentStatus !== 'PAID') {
        throw new Error(`Cannot refund order with payment status ${orderRecord.paymentStatus}, expected PAID`);
      }

      // Get related data
      const service = await tx.service.findUnique({
        where: { id: orderRecord.serviceId }
      });

      const transactions = await tx.transaction.findMany({
        where: { serviceOrderId: orderId }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      console.log(`💰 Service order found for refund (locked):`, {
        id: orderRecord.id,
        totalAmount: orderRecord.totalAmount,
        paymentStatus: orderRecord.paymentStatus
      });

      // Find the original payment intent
      const depositTransaction = transactions.find(t => t.type === 'DEPOSIT');
      if (!depositTransaction || !depositTransaction.stripeId) {
        throw new Error('Original payment not found');
      }

      // Cancel (refund) the payment intent
      // This is idempotent - Stripe prevents double cancellation
      console.log(`🔄 Cancelling payment: ${depositTransaction.stripeId}`);

      try {
        await stripe.paymentIntents.cancel(depositTransaction.stripeId);
      } catch (error: any) {
        // If already canceled, Stripe returns specific error
        if (error.code === 'payment_intent_unexpected_state') {
          console.log('⚠️ Payment already canceled (race condition caught), continuing with database update');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // All database updates in same transaction
      await tx.serviceOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'REFUNDED',
          status: 'CANCELLED'
        }
      });

      await tx.transaction.create({
        data: {
          userId: orderRecord.clientId,
          serviceOrderId: orderId,
          type: 'REFUND',
          amount: orderRecord.totalAmount,
          status: 'COMPLETED',
          description: `Refund for service: ${service.title}${reason ? ` - ${reason}` : ''}`
        }
      });

      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`⚠️ Slow refund operation: ${duration}ms for order ${orderId}`);
      }

      console.log(`✅ Service order payment refunded successfully (${duration}ms)`);

      return orderRecord;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    }
  );
};

// ==================== WEBHOOK HANDLER ====================

export const handleStripeWebhook = async (event: Stripe.Event) => {
  console.log(`🔔 Webhook received: ${event.type} (ID: ${event.id})`);

  try {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        // This event fires when a payment with manual capture is authorized (funds held)
        const capturablePayment = event.data.object as Stripe.PaymentIntent;
        const { orderId: capturableOrderId, projectId: capturableProjectId, type: capturableType } = capturablePayment.metadata;

        // Use payment idempotency wrapper to prevent duplicate processing
        const { duplicate } = await withPaymentIdempotency(
          event,
          capturablePayment.id,
          async () => {
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
          }
        );

        if (duplicate) {
          console.log(`⏭️ Duplicate payment webhook skipped for ${capturablePayment.id}`);
        }
        break;
      }

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

      case 'account.updated': {
        // Stripe Connect account status updated
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.userId;

        if (!userId) {
          console.log('⚠️ Account updated event missing userId metadata');
          break;
        }

        // Use simple idempotency wrapper (in-memory only for non-payment events)
        const { duplicate } = await withSimpleIdempotency(event, async () => {
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
        });

        if (duplicate) {
          console.log(`⏭️ Duplicate account.updated webhook skipped`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error(`❌ Error processing webhook ${event.id}:`, error);
    throw error; // Re-throw to return 500 to Stripe (will retry)
  }
};