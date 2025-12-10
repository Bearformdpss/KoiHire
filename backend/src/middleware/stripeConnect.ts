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

  // Check if user has a valid payout method
  const hasStripeConnect = user.stripeConnectAccountId && user.stripePayoutsEnabled;
  const hasPayPal = user.payoutMethod === 'PAYPAL' && user.paypalEmail;
  const hasPayoneer = user.payoutMethod === 'PAYONEER' && user.payoneerEmail;

  if (!hasStripeConnect && !hasPayPal && !hasPayoneer) {
    throw new AppError(
      'You must set up a payout method before performing this action. Go to Settings > Payments to set up PayPal, Payoneer, or Stripe Connect.',
      403
    );
  }

  next();
};
