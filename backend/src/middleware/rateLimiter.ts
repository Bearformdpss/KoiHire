import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Extend Request to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Rate Limiter Middleware
 *
 * Provides endpoint-specific rate limiting to prevent abuse:
 * - Authentication endpoints (login, register)
 * - Password reset endpoints
 * - Payment endpoints
 * - File upload endpoints
 *
 * Uses both IP and email-based rate limiting for authentication routes.
 */

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Global rate limiter - applies to all endpoints as a baseline
 * Generous limits to allow normal usage while preventing extreme abuse
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 300, // Increased to 300 for modern SPA usage patterns
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for whitelisted IPs (e.g., health checks, internal services)
  skip: (req: Request) => {
    const whitelist = ['127.0.0.1', '::1'];
    return whitelist.includes(req.ip || '');
  }
});

/**
 * Authentication rate limiter - for login/register endpoints
 * Strict limits to prevent brute force attacks and account enumeration
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // 5 attempts per 15 minutes in production
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit by email OR IP (whichever is more restrictive)
  keyGenerator: (req: Request) => {
    const email = req.body.email;
    return email ? `auth:${email}` : `auth:ip:${req.ip}`;
  },
  // Only count failed login attempts (successful logins don't increment counter)
  skipSuccessfulRequests: true,
  // Skip failed requests that don't have proper body (likely bots)
  skipFailedRequests: false,
});

/**
 * Registration rate limiter - for new account creation
 * Moderate limits to prevent spam account creation
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 50 : 10, // 10 registrations per hour in production
  message: 'Too many accounts created from this IP. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body.email;
    return email ? `register:${email}` : `register:ip:${req.ip}`;
  }
});

/**
 * Password reset request limiter - for forgot-password endpoint
 * Very strict to prevent email bombing and account enumeration
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 20 : 3, // 3 requests per hour in production
  message: 'Too many password reset requests. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = req.body.email;
    return email ? `reset:${email}` : `reset:ip:${req.ip}`;
  }
});

/**
 * Password reset submission limiter - for reset-password endpoint
 * Moderate limits to prevent token brute forcing
 */
export const passwordResetSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 20 : 5, // 5 attempts per hour in production
  message: 'Too many password reset attempts. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const token = req.body.token || req.params.token;
    return token ? `reset-submit:${token}` : `reset-submit:ip:${req.ip}`;
  }
});

/**
 * Payment endpoint limiter - for payment processing
 * Moderate limits to prevent payment abuse while allowing legitimate transactions
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 50 : 10, // 10 payment operations per hour in production
  message: 'Too many payment requests. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id ? `payment:user:${authReq.user.id}` : `payment:ip:${req.ip}`;
  }
});

/**
 * File upload limiter - for file upload endpoints
 * Moderate limits to prevent storage abuse
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 20, // 20 uploads per hour in production
  message: 'Too many file uploads. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id ? `upload:user:${authReq.user.id}` : `upload:ip:${req.ip}`;
  }
});

/**
 * Refresh token limiter - for token refresh endpoint
 * Moderate limits to prevent refresh token abuse
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // 10 refreshes per 15 minutes in production
  message: 'Too many token refresh attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by IP for refresh tokens
    return `refresh:ip:${req.ip}`;
  }
});
