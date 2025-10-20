import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const createPaymentIntent = async (
  amount: number,
  projectId: string,
  clientId: string,
  description?: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      projectId,
      clientId,
      type: 'escrow_deposit'
    },
    description: description || `Escrow deposit for project ${projectId}`
  });

  return paymentIntent;
};

export const createEscrow = async (
  projectId: string,
  amount: number,
  stripePaymentIntentId: string
) => {
  const escrow = await prisma.escrow.create({
    data: {
      projectId,
      amount,
      status: 'PENDING',
      stripePaymentId: stripePaymentIntentId
    }
  });

  return escrow;
};

export const confirmEscrowPayment = async (escrowId: string) => {
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    include: {
      project: {
        include: {
          client: true,
          freelancer: true
        }
      }
    }
  });

  if (!escrow) {
    throw new Error('Escrow not found');
  }

  if (escrow.status !== 'PENDING') {
    throw new Error('Escrow is not in pending status');
  }

  // Update escrow status
  await prisma.escrow.update({
    where: { id: escrowId },
    data: { status: 'FUNDED' }
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId: escrow.project.clientId,
      escrowId: escrow.id,
      type: 'DEPOSIT',
      amount: escrow.amount,
      status: 'COMPLETED',
      stripeId: escrow.stripePaymentId,
      description: `Escrow deposit for project: ${escrow.project.title}`
    }
  });

  return escrow;
};

export const releaseEscrow = async (escrowId: string, freelancerId: string) => {
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    include: {
      project: {
        include: {
          client: true,
          freelancer: true
        }
      }
    }
  });

  if (!escrow) {
    throw new Error('Escrow not found');
  }

  if (escrow.status !== 'FUNDED') {
    throw new Error('Escrow is not funded');
  }

  if (escrow.project.freelancerId !== freelancerId) {
    throw new Error('Invalid freelancer for this escrow');
  }

  // Calculate platform fee (5% in this example)
  const platformFee = escrow.amount * 0.05;
  const freelancerAmount = escrow.amount - platformFee;

  // In a real implementation, you would transfer money to freelancer's Stripe account
  // For now, we'll just record the transaction

  await prisma.$transaction([
    // Update escrow status
    prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    }),
    // Create freelancer transaction
    prisma.transaction.create({
      data: {
        userId: freelancerId,
        escrowId: escrow.id,
        type: 'WITHDRAWAL',
        amount: freelancerAmount,
        status: 'COMPLETED',
        description: `Payment for project: ${escrow.project.title}`
      }
    }),
    // Create platform fee transaction
    prisma.transaction.create({
      data: {
        userId: freelancerId, // Associate with freelancer for accounting
        escrowId: escrow.id,
        type: 'FEE',
        amount: platformFee,
        status: 'COMPLETED',
        description: `Platform fee for project: ${escrow.project.title}`
      }
    }),
    // Update freelancer earnings
    prisma.user.update({
      where: { id: freelancerId },
      data: {
        totalEarnings: {
          increment: freelancerAmount
        }
      }
    }),
    // Update client spending
    prisma.user.update({
      where: { id: escrow.project.clientId },
      data: {
        totalSpent: {
          increment: escrow.amount
        }
      }
    })
  ]);

  return escrow;
};

export const refundEscrow = async (escrowId: string, reason?: string) => {
  const escrow = await prisma.escrow.findUnique({
    where: { id: escrowId },
    include: {
      project: {
        include: {
          client: true
        }
      }
    }
  });

  if (!escrow) {
    throw new Error('Escrow not found');
  }

  if (escrow.status !== 'FUNDED') {
    throw new Error('Escrow is not funded');
  }

  // In a real implementation, you would process refund through Stripe
  const refund = await stripe.refunds.create({
    payment_intent: escrow.stripePaymentId!,
    amount: Math.round(escrow.amount * 100), // Convert to cents
    reason: 'requested_by_customer',
    metadata: {
      escrowId,
      projectId: escrow.projectId
    }
  });

  await prisma.$transaction([
    // Update escrow status
    prisma.escrow.update({
      where: { id: escrowId },
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
        stripeId: refund.id,
        description: `Refund for project: ${escrow.project.title}${reason ? ` - ${reason}` : ''}`
      }
    })
  ]);

  return { escrow, refund };
};

export const handleStripeWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { projectId } = paymentIntent.metadata;

      if (projectId) {
        const escrow = await prisma.escrow.findFirst({
          where: {
            projectId,
            stripePaymentId: paymentIntent.id
          }
        });

        if (escrow) {
          await confirmEscrowPayment(escrow.id);
        }
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', failedPayment);
      
      // Handle failed payment - you might want to notify the client
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};