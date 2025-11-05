import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

/**
 * Middleware to ensure freelancer has completed Stripe Connect onboarding
 * before they can create services or apply to projects.
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

  // Check if user has completed Stripe Connect onboarding
  if (!user.stripeConnectAccountId || !user.stripePayoutsEnabled) {
    throw new AppError(
      'You must complete Stripe Connect onboarding before performing this action. This ensures you can receive payments when clients accept your work.',
      403
    );
  }

  next();
};
