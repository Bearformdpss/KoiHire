import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

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
 */
export const requireStripeConnect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    throw new AppError('Authentication required', 401);
  }

  // DIAGNOSTIC LOGGING
  console.log('🔍 requireStripeConnect middleware check:', {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    // These fields should be UNDEFINED because auth middleware doesn't fetch them
    stripeConnectAccountId: (user as any).stripeConnectAccountId,
    stripePayoutsEnabled: (user as any).stripePayoutsEnabled,
    payoutMethod: (user as any).payoutMethod,
    paypalEmail: (user as any).paypalEmail,
    payoneerEmail: (user as any).payoneerEmail,
    // Show what req.user actually contains
    userObjectKeys: Object.keys(user),
    diagnosis: 'Payment fields should be undefined - auth middleware does not fetch them for security'
  });

  // Check if user has a valid payout method
  const hasStripeConnect = (user as any).stripeConnectAccountId && (user as any).stripePayoutsEnabled;
  const hasPayPal = (user as any).payoutMethod === 'PAYPAL' && (user as any).paypalEmail;
  const hasPayoneer = (user as any).payoutMethod === 'PAYONEER' && (user as any).payoneerEmail;

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
};
