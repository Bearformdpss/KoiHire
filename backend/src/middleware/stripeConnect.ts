import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

/**
 * Middleware to ensure freelancer has a valid payout method set up
 * before they can create services or apply to projects.
 *
 * Valid payout methods:
 * - Stripe Connect (stripePayoutsEnabled = true)
 * - PayPal (payoutMethod = 'PAYPAL' with valid paypalEmail)
 * - Payoneer (payoutMethod = 'PAYONEER' with valid payoneerEmail)
 *
 * This prevents freelancers from creating services/applications that cannot
 * be accepted due to missing payment setup.
 *
 * Note: We fetch payment fields from the database because auth middleware
 * intentionally excludes them for security (see auth.ts line 41).
 */
export const requireStripeConnect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // Fetch payment-related fields from database
    // (auth middleware excludes these for security)
    const userPaymentData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        stripeConnectAccountId: true,
        stripePayoutsEnabled: true,
        payoutMethod: true,
        paypalEmail: true,
        payoneerEmail: true
      }
    });

    if (!userPaymentData) {
      throw new AppError('User not found', 404);
    }

    console.log('🔍 requireStripeConnect middleware check:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      paymentData: userPaymentData
    });

    // Check if user has a valid payout method
    const hasStripeConnect = userPaymentData.stripeConnectAccountId && userPaymentData.stripePayoutsEnabled;
    const hasPayPal = userPaymentData.payoutMethod === 'PAYPAL' && userPaymentData.paypalEmail;
    const hasPayoneer = userPaymentData.payoutMethod === 'PAYONEER' && userPaymentData.payoneerEmail;

    console.log('🔍 Payout method checks:', {
      hasStripeConnect,
      hasPayPal,
      hasPayoneer,
      willPass: hasStripeConnect || hasPayPal || hasPayoneer
    });

    if (!hasStripeConnect && !hasPayPal && !hasPayoneer) {
      throw new AppError(
        'You must set up a payout method before performing this action. Go to Settings > Payments to set up PayPal, Payoneer, or Stripe Connect.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
