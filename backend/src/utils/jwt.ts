import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const generateTokens = (userId: string) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const saveRefreshToken = async (userId: string, refreshToken: string) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
  
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(decoded.exp * 1000)
    }
  });
};

export const verifyRefreshToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
      return null;
    }

    return tokenRecord.user;
  } catch (error) {
    return null;
  }
};

export const revokeRefreshToken = async (refreshToken: string) => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken }
  });
};

export const revokeAllUserTokens = async (userId: string) => {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
};