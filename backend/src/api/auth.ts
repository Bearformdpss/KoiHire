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

// Register
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
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
      rating: true,
      totalEarnings: true,
      totalSpent: true,
      stripeConnectAccountId: true,
      stripeOnboardingComplete: true,
      stripePayoutsEnabled: true,
      stripeDetailsSubmitted: true,
      stripeChargesEnabled: true
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

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
    accessToken,
    refreshToken
  });
}));

// Login
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
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

  res.json({
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
      rating: user.rating,
      totalEarnings: user.totalEarnings,
      totalSpent: user.totalSpent,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      stripePayoutsEnabled: user.stripePayoutsEnabled,
      stripeDetailsSubmitted: user.stripeDetailsSubmitted,
      stripeChargesEnabled: user.stripeChargesEnabled
    },
    accessToken,
    refreshToken
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

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

  res.json({
    success: true,
    accessToken,
    refreshToken: newRefreshToken
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
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