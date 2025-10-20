import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// List public users (must come before /:userId to avoid route conflicts)
router.get('/', asyncHandler(async (req, res) => {
  const {
    role,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const where: any = {};

  if (role) {
    where.role = role as string;
    // Only show available freelancers in public listings
    if (role === 'FREELANCER') {
      where.isAvailable = true;
    }
  }

  const users = await prisma.user.findMany({
    where,
    take: Number(limit),
    orderBy: { [sortBy as string]: order },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      location: true,
      role: true,
      rating: true,
      isVerified: true,
      totalEarnings: true,
      skills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: {
      users,
      total: users.length
    }
  });
}));

// Get user by ID (public profile)
router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      role: true,
      rating: true,
      createdAt: true,
      isVerified: true,
      totalEarnings: true,
      totalSpent: true,
      skills: {
        include: {
          skill: {
            include: {
              category: true
            }
          }
        }
      },
      freelancerReviews: {
        where: { isPublic: true },
        include: {
          reviewer: {
            select: {
              username: true,
              avatar: true
            }
          },
          project: {
            select: {
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user
  });
}));

// Get user by username (public profile)
router.get('/username/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      role: true,
      rating: true,
      createdAt: true,
      isVerified: true,
      totalEarnings: true,
      totalSpent: true,
      skills: {
        include: {
          skill: {
            include: {
              category: true
            }
          }
        }
      },
      freelancerReviews: {
        where: { isPublic: true },
        include: {
          reviewer: {
            select: {
              username: true,
              avatar: true
            }
          },
          project: {
            select: {
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user
  });
}));

// Get user statistics (public)
router.get('/:userId/stats', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const stats: any = {
    userId,
    role: user.role
  };

  if (user.role === 'FREELANCER') {
    // Get freelancer stats
    const [
      totalProjects,
      completedProjects,
      activeProjects,
      averageRating,
      totalEarnings,
      totalReviews
    ] = await Promise.all([
      prisma.project.count({
        where: { 
          freelancerId: userId,
          status: { in: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }
        }
      }),
      prisma.project.count({
        where: { 
          freelancerId: userId,
          status: 'COMPLETED'
        }
      }),
      prisma.project.count({
        where: { 
          freelancerId: userId,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.review.aggregate({
        where: { 
          freelancerId: userId,
          isPublic: true
        },
        _avg: { rating: true }
      }),
      prisma.payment.aggregate({
        where: {
          project: { freelancerId: userId },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.review.count({
        where: { 
          freelancerId: userId,
          isPublic: true
        }
      })
    ]);

    stats.freelancer = {
      totalProjects,
      completedProjects,
      activeProjects,
      averageRating: averageRating._avg.rating || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
      totalReviews,
      successRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0
    };
  } else if (user.role === 'CLIENT') {
    // Get client stats
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalSpent
    ] = await Promise.all([
      prisma.project.count({
        where: { clientId: userId }
      }),
      prisma.project.count({
        where: { 
          clientId: userId,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.project.count({
        where: { 
          clientId: userId,
          status: 'COMPLETED'
        }
      }),
      prisma.payment.aggregate({
        where: {
          project: { clientId: userId },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      })
    ]);

    stats.client = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalSpent: totalSpent._sum.amount || 0
    };
  }

  res.json({
    success: true,
    stats
  });
}));

export default router;