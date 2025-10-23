import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

/**
 * Middleware to check if user has ADMIN role
 * Must be used after auth middleware
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    console.log('❌ Admin middleware: No user found in request');
    throw new AppError('Authentication required', 401);
  }

  console.log('🔍 Admin middleware check:', {
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    isAdmin: req.user.role === 'ADMIN'
  });

  if (req.user.role !== 'ADMIN') {
    console.log('❌ Admin access denied - User role:', req.user.role);
    throw new AppError('Admin access required', 403);
  }

  console.log('✅ Admin access granted');
  next();
};
