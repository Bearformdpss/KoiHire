import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { generateTokens, saveRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt';
import { emailService } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// Cookie configuration for secure token storage
const getCookieOptions = (maxAge: number) => {
  // Detect production environment: Railway sets RAILWAY_ENVIRONMENT, Vercel sets VERCEL
  // This ensures secure: true even if NODE_ENV isn't explicitly set
  const isProduction = !!(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL || process.env.NODE_ENV === 'production');

  return {
    httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
    secure: isProduction, // HTTPS only in production (Railway/Vercel)
    sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' required for cross-origin in production
    maxAge,
    // Do NOT set domain for cross-origin cookies (Vercel frontend + Railway backend)
    // Setting domain restricts where cookies can be set/read - omit for cross-domain scenarios
    path: '/',
  };
};

const accessTokenCookieOptions = getCookieOptions(15 * 60 * 1000); // 15 minutes
const refreshTokenCookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000); // 7 days

// Helper function to clear cookies (for stale cookie cleanup)
const clearAuthCookies = (res: express.Response) => {
  const isProduction = !!(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL || process.env.NODE_ENV === 'production');

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
  };

  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};

// Register
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  // Clear any existing stale cookies before creating new account
  clearAuthCookies(res);

  const { email, username, firstName, lastName, password, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    throw new AppError('User already exists with this email or username', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      avatar: true,
      isVerified: true,
      isAvailable: true,
      rating: true
      // Sensitive payment data removed for security - fetch via /api/users/payment-settings when needed
    }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

  // Send welcome email to new user
  try {
    await emailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.firstName,
      role: user.role as 'CLIENT' | 'FREELANCER'
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't fail the registration if email fails
  }

  // Set httpOnly cookies for tokens (secure, XSS-protected)
  res
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .status(201)
    .json({
      success: true,
      message: 'User registered successfully',
      user,
      expiresAt: Date.now() + 15 * 60 * 1000, // Access token expiry time for frontend
    });
}));

// Login
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  // Clear any existing stale cookies before login
  clearAuthCookies(res);

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

  // Set httpOnly cookies for tokens (secure, XSS-protected)
  res
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
    .json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isAvailable: user.isAvailable,
        rating: user.rating
        // Sensitive payment data removed for security - fetch via /api/users/payment-settings when needed
      },
      expiresAt: Date.now() + 15 * 60 * 1000, // Access token expiry time for frontend
    });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  // Try to get refresh token from cookie first, then fallback to request body (for gradual migration)
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  const user = await verifyRefreshToken(refreshToken);
  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Revoke old refresh token
  await revokeRefreshToken(refreshToken);

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, newRefreshToken);

  // Set httpOnly cookies for tokens (secure, XSS-protected)
  res
    .cookie('accessToken', accessToken, accessTokenCookieOptions)
    .cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions)
    .json({
      success: true,
      expiresAt: Date.now() + 15 * 60 * 1000, // Access token expiry time for frontend
    });
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  // Try to get refresh token from cookie first, then fallback to request body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  // Clear httpOnly cookies
  res
    .clearCookie('accessToken', { ...accessTokenCookieOptions, maxAge: undefined })
    .clearCookie('refreshToken', { ...refreshTokenCookieOptions, maxAge: undefined })
    .json({
      success: true,
      message: 'Logged out successfully'
    });
}));

// Clear stale cookies - utility endpoint for fixing cookie migration issues
router.post('/clear-cookies', asyncHandler(async (req, res) => {
  // Force clear all auth cookies regardless of their current state
  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'All cookies cleared successfully'
  });
}));

// Verify cookies are present and valid (for debugging cross-origin cookie issues)
router.get('/verify-cookies', asyncHandler(async (req, res) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;
  const hasAccessToken = !!accessToken;
  const hasRefreshToken = !!refreshToken;

  // Check if tokens are invalid (null strings or malformed)
  const isAccessTokenInvalid = accessToken === 'null' || accessToken === 'undefined' || (accessToken && accessToken.split('.').length !== 3);
  const isRefreshTokenInvalid = refreshToken === 'null' || refreshToken === 'undefined' || (refreshToken && refreshToken.split('.').length !== 3);

  // If cookies exist but contain invalid tokens, clear them
  if ((hasAccessToken && isAccessTokenInvalid) || (hasRefreshToken && isRefreshTokenInvalid)) {
    console.log('⚠️  Detected invalid/stale cookies, clearing them...');
    clearAuthCookies(res);

    return res.json({
      success: true,
      cookies: {
        accessToken: false,
        refreshToken: false,
      },
      cleared: true,
      message: 'Stale cookies detected and cleared - please login again',
    });
  }

  res.json({
    success: true,
    cookies: {
      accessToken: hasAccessToken,
      refreshToken: hasRefreshToken,
    },
    cleared: false,
    message: hasAccessToken && hasRefreshToken
      ? 'Cookies are present and valid'
      : 'Cookies are missing - check browser settings or cross-origin configuration',
  });
}));

// Forgot password - Request password reset
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  // Always return success to prevent email enumeration
  const successResponse = {
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link.'
  };

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  // If user doesn't exist, still return success (security best practice)
  if (!user) {
    console.log(`Password reset requested for non-existent email: ${email}`);
    return res.json(successResponse);
  }

  // Delete any existing unused reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null
    }
  });

  // Generate secure random token (32 bytes = 64 hex characters)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing in database
  const hashedToken = await bcrypt.hash(resetToken, 12);

  // Create password reset token (expires in 1 hour)
  await prisma.passwordResetToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    }
  });

  // Send password reset email with plain token
  try {
    await emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetToken: resetToken // Send plain token in email, not hashed
    });
    console.log(`✅ Password reset email sent to: ${user.email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    // Don't throw error - still return success to user
  }

  res.json(successResponse);
}));

// Validate reset token
router.get('/reset-password/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  // Find all non-expired, unused tokens
  const resetTokens = await prisma.passwordResetToken.findMany({
    where: {
      expiresAt: { gt: new Date() },
      usedAt: null
    }
  });

  // Check each token by comparing hashes
  let validToken = null;
  for (const dbToken of resetTokens) {
    const isMatch = await bcrypt.compare(token, dbToken.token);
    if (isMatch) {
      validToken = dbToken;
      break;
    }
  }

  if (!validToken) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  res.json({
    success: true,
    message: 'Token is valid',
    valid: true
  });
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    throw new AppError('Token, password, and confirm password are required', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  // Validate password strength
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new AppError('Password must contain at least one lowercase letter, one uppercase letter, and one number', 400);
  }

  // Find all non-expired, unused tokens
  const resetTokens = await prisma.passwordResetToken.findMany({
    where: {
      expiresAt: { gt: new Date() },
      usedAt: null
    },
    include: {
      user: true
    }
  });

  // Check each token by comparing hashes
  let validToken = null;
  for (const dbToken of resetTokens) {
    const isMatch = await bcrypt.compare(token, dbToken.token);
    if (isMatch) {
      validToken = dbToken;
      break;
    }
  }

  if (!validToken) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user's password
  await prisma.user.update({
    where: { id: validToken.userId },
    data: { password: hashedPassword }
  });

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: validToken.id },
    data: { usedAt: new Date() }
  });

  // Revoke all existing refresh tokens for this user (force re-login on all devices)
  await prisma.refreshToken.deleteMany({
    where: { userId: validToken.userId }
  });

  console.log(`✅ Password reset successful for user: ${validToken.user.email}`);

  // Send password changed confirmation email
  try {
    await emailService.sendPasswordChangedConfirmationEmail({
      email: validToken.user.email,
      firstName: validToken.user.firstName
    });
  } catch (error) {
    console.error('Error sending password changed confirmation email:', error);
    // Don't fail the reset if email fails
  }

  res.json({
    success: true,
    message: 'Password has been reset successfully. Please log in with your new password.'
  });
}));

export default router;