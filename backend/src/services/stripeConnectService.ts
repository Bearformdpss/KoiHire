import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

const MINIMUM_PAYOUT_AMOUNT = 10.00; // $10 minimum payout threshold

/**
 * Create Stripe Connect Standard account for freelancer
 * Returns account ID and onboarding link
 */
export const createConnectAccount = async (
  userId: string,
  email: string,
  country: string = 'US'
) => {
  console.log(`🔄 Creating Connect account for user ${userId} in ${country}`);

  // Create Connect account
  const account = await stripe.accounts.create({
    type: 'standard', // Standard = full Stripe account for freelancer
    email,
    country,
    metadata: {
      userId,
      platform: 'koihire'
    }
  });

  console.log(`✅ Connect account created: ${account.id}`);

  // Create onboarding link for freelancer to complete setup
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.FRONTEND_URL}/dashboard/payments/connect/refresh`,
    return_url: `${process.env.FRONTEND_URL}/dashboard/payments/connect/complete`,
    type: 'account_onboarding'
  });

  // Update user in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeConnectAccountId: account.id,
      stripeOnboardingComplete: false
    }
  });

  console.log(`✅ Onboarding link created for ${account.id}`);

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url
  };
};

/**
 * Create new onboarding link for existing Connect account
 * Used when user needs to continue/restart onboarding
 */
export const createAccountLink = async (accountId: string) => {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.FRONTEND_URL}/dashboard/payments/connect/refresh`,
    return_url: `${process.env.FRONTEND_URL}/dashboard/payments/connect/complete`,
    type: 'account_onboarding'
  });

  return accountLink.url;
};

/**
 * Check if Connect account is ready for payouts
 */
export const checkAccountStatus = async (accountId: string) => {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requiresAction: !account.details_submitted || !account.payouts_enabled,
    country: account.country,
    defaultCurrency: account.default_currency
  };
};

/**
 * Transfer funds to freelancer's Connect account
 * Called when project/service order is approved
 * Implements $10 minimum payout threshold
 */
export const transferToFreelancer = async (
  freelancerId: string,
  amount: number, // Net amount after platform fee
  platformFee: number, // Our 12.5% commission
  description: string,
  metadata: { projectId?: string; serviceOrderId?: string }
) => {
  console.log(`💸 Initiating transfer to freelancer ${freelancerId}: $${amount}`);

  // Check minimum payout threshold
  if (amount < MINIMUM_PAYOUT_AMOUNT) {
    console.log(`⚠️  Amount $${amount} is below minimum threshold of $${MINIMUM_PAYOUT_AMOUNT}`);

    // Create pending payout record - will accumulate until threshold met
    const payout = await prisma.payout.create({
      data: {
        userId: freelancerId,
        projectId: metadata.projectId,
        serviceOrderId: metadata.serviceOrderId,
        amount,
        platformFee,
        status: 'PENDING',
        failureReason: `Amount below minimum payout threshold ($${MINIMUM_PAYOUT_AMOUNT}). Will be paid when accumulated earnings reach threshold.`
      }
    });

    console.log(`📝 Pending payout created: ${payout.id}`);

    return {
      transfer: null,
      payout,
      message: `Payout below $${MINIMUM_PAYOUT_AMOUNT} minimum. Funds will be accumulated and paid when threshold is reached.`
    };
  }

  // Get freelancer's Connect account
  const freelancer = await prisma.user.findUnique({
    where: { id: freelancerId },
    select: {
      stripeConnectAccountId: true,
      stripePayoutsEnabled: true,
      email: true,
      firstName: true,
      lastName: true
    }
  });

  if (!freelancer?.stripeConnectAccountId) {
    console.error(`❌ Freelancer ${freelancerId} has not set up Stripe Connect`);

    // Create pending payout - notify freelancer to set up Connect
    const payout = await prisma.payout.create({
      data: {
        userId: freelancerId,
        projectId: metadata.projectId,
        serviceOrderId: metadata.serviceOrderId,
        amount,
        platformFee,
        status: 'PENDING',
        failureReason: 'Freelancer has not completed Stripe Connect onboarding'
      }
    });

    throw new Error('Freelancer has not set up Stripe Connect. They need to complete onboarding to receive payouts.');
  }

  if (!freelancer.stripePayoutsEnabled) {
    console.error(`❌ Payouts not enabled for freelancer ${freelancerId}`);

    // Create pending payout - freelancer needs to complete verification
    const payout = await prisma.payout.create({
      data: {
        userId: freelancerId,
        projectId: metadata.projectId,
        serviceOrderId: metadata.serviceOrderId,
        amount,
        platformFee,
        status: 'PENDING',
        failureReason: 'Freelancer payouts not enabled. They may need to complete identity verification.'
      }
    });

    throw new Error('Freelancer payouts not enabled. They may need to complete verification with Stripe.');
  }

  try {
    // Create instant transfer to freelancer's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: freelancer.stripeConnectAccountId,
      description,
      metadata: {
        ...metadata,
        freelancerId,
        freelancerEmail: freelancer.email,
        freelancerName: `${freelancer.firstName} ${freelancer.lastName}`
      }
    });

    console.log(`✅ Transfer created: ${transfer.id} for $${amount}`);

    // Create completed payout record
    const payout = await prisma.payout.create({
      data: {
        userId: freelancerId,
        projectId: metadata.projectId,
        serviceOrderId: metadata.serviceOrderId,
        amount,
        platformFee,
        stripeTransferId: transfer.id,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    console.log(`✅ Payout record created: ${payout.id}`);

    return { transfer, payout, message: 'Transfer completed successfully' };
  } catch (error: any) {
    console.error(`❌ Transfer failed:`, error);

    // Create failed payout record for retry
    const payout = await prisma.payout.create({
      data: {
        userId: freelancerId,
        projectId: metadata.projectId,
        serviceOrderId: metadata.serviceOrderId,
        amount,
        platformFee,
        status: 'FAILED',
        failureReason: error.message || 'Unknown transfer error'
      }
    });

    throw error;
  }
};

/**
 * Get accumulated pending payouts for a freelancer
 * Used to check if they've reached the $10 minimum threshold
 */
export const getPendingPayouts = async (freelancerId: string) => {
  const pendingPayouts = await prisma.payout.findMany({
    where: {
      userId: freelancerId,
      status: 'PENDING',
      failureReason: {
        contains: 'below minimum payout threshold'
      }
    },
    include: {
      project: {
        select: { id: true, title: true }
      },
      serviceOrder: {
        select: { id: true, orderNumber: true }
      }
    }
  });

  const totalPending = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);

  return {
    payouts: pendingPayouts,
    totalAmount: totalPending,
    count: pendingPayouts.length,
    canPayout: totalPending >= MINIMUM_PAYOUT_AMOUNT
  };
};

/**
 * Process accumulated pending payouts when threshold is reached
 * Combines multiple small payouts into one transfer
 */
export const processAccumulatedPayouts = async (freelancerId: string) => {
  const pending = await getPendingPayouts(freelancerId);

  if (!pending.canPayout) {
    throw new Error(`Accumulated amount ($${pending.totalAmount}) is below minimum threshold ($${MINIMUM_PAYOUT_AMOUNT})`);
  }

  console.log(`💰 Processing accumulated payouts for freelancer ${freelancerId}: $${pending.totalAmount}`);

  // Get freelancer info
  const freelancer = await prisma.user.findUnique({
    where: { id: freelancerId },
    select: {
      stripeConnectAccountId: true,
      stripePayoutsEnabled: true,
      email: true,
      firstName: true,
      lastName: true
    }
  });

  if (!freelancer?.stripeConnectAccountId || !freelancer.stripePayoutsEnabled) {
    throw new Error('Freelancer Connect account not set up or payouts not enabled');
  }

  // Create single transfer for accumulated amount
  const transfer = await stripe.transfers.create({
    amount: Math.round(pending.totalAmount * 100),
    currency: 'usd',
    destination: freelancer.stripeConnectAccountId,
    description: `Accumulated earnings from ${pending.count} completed ${pending.count === 1 ? 'job' : 'jobs'}`,
    metadata: {
      freelancerId,
      accumulatedPayoutIds: pending.payouts.map(p => p.id).join(','),
      count: pending.count.toString()
    }
  });

  console.log(`✅ Accumulated transfer created: ${transfer.id}`);

  // Update all pending payouts to completed
  await prisma.payout.updateMany({
    where: {
      id: {
        in: pending.payouts.map(p => p.id)
      }
    },
    data: {
      status: 'COMPLETED',
      stripeTransferId: transfer.id,
      completedAt: new Date(),
      failureReason: null
    }
  });

  return { transfer, payouts: pending.payouts };
};

/**
 * Reverse transfer if refund needed after payout
 * Creates a transfer reversal to reclaim funds from freelancer
 */
export const reverseTransfer = async (transferId: string, amount?: number, reason?: string) => {
  console.log(`🔄 Reversing transfer ${transferId}${amount ? ` (partial: $${amount})` : ''}`);

  const reversal = await stripe.transfers.createReversal(
    transferId,
    {
      amount: amount ? Math.round(amount * 100) : undefined,
      metadata: {
        reason: reason || 'Refund requested'
      }
    }
  );

  console.log(`✅ Transfer reversal created: ${reversal.id}`);

  return reversal;
};

/**
 * Retry failed payout
 * Attempts to transfer again for failed payouts
 */
export const retryFailedPayout = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      user: {
        select: {
          id: true,
          stripeConnectAccountId: true,
          stripePayoutsEnabled: true
        }
      },
      project: { select: { title: true } },
      serviceOrder: { select: { orderNumber: true } }
    }
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  if (payout.status !== 'FAILED') {
    throw new Error('Can only retry failed payouts');
  }

  // Try transfer again
  const description = payout.project
    ? `Payout for project: ${payout.project.title}`
    : `Payout for order: ${payout.serviceOrder?.orderNumber}`;

  const result = await transferToFreelancer(
    payout.userId,
    payout.amount,
    payout.platformFee,
    description,
    {
      projectId: payout.projectId || undefined,
      serviceOrderId: payout.serviceOrderId || undefined
    }
  );

  // Delete old failed payout record if successful
  if (result.payout.status === 'COMPLETED') {
    await prisma.payout.delete({
      where: { id: payoutId }
    });
  }

  return result;
};
