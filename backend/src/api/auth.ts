import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { generateTokens, saveRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/jwt';

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
      createdAt: true
    }
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  await saveRefreshToken(user.id, refreshToken);

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
      totalSpent: user.totalSpent
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

// Forgot password (placeholder)
router.post('/forgot-password', asyncHandler(async (req, res) => {
  // TODO: Implement forgot password functionality
  res.json({
    success: true,
    message: 'Password reset email sent (placeholder)'
  });
}));

export default router;