import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      role: true,
      rating: true,
      totalEarnings: true,
      totalSpent: true,
      isVerified: true,
      isAvailable: true,
      createdAt: true,
      skills: {
        include: {
          skill: {
            include: {
              category: true
            }
          }
        }
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

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const { firstName, lastName, bio, location, website, phone, avatar } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName,
      lastName,
      bio,
      location,
      website,
      phone,
      avatar
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      role: true,
      rating: true,
      isVerified: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

// Add or update user skills
router.post('/skills', asyncHandler(async (req: AuthRequest, res) => {
  const { skills } = req.body; // Array of { skillId, level, yearsExp }

  if (!Array.isArray(skills)) {
    throw new AppError('Skills must be an array', 400);
  }

  // Remove existing skills
  await prisma.userSkill.deleteMany({
    where: { userId: req.user!.id }
  });

  // Add new skills
  if (skills.length > 0) {
    await prisma.userSkill.createMany({
      data: skills.map((skill: any) => ({
        userId: req.user!.id,
        skillId: skill.skillId,
        level: skill.level || 'BEGINNER',
        yearsExp: skill.yearsExp
      }))
    });
  }

  res.json({
    success: true,
    message: 'Skills updated successfully'
  });
}));

// Get dashboard statistics for the current user
router.get('/dashboard/stats', asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      totalEarnings: true,
      rating: true,
      totalSpent: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'FREELANCER') {
    // Freelancer dashboard stats
    const [
      activeProjects,
      completedProjects,
      totalApplications,
      acceptedApplications,
      recentActivity
    ] = await Promise.all([
      prisma.project.count({
        where: {
          freelancerId: userId,
          status: 'IN_PROGRESS'
        }
      }),
      prisma.project.count({
        where: {
          freelancerId: userId,
          status: 'COMPLETED'
        }
      }),
      prisma.application.count({
        where: {
          freelancerId: userId
        }
      }),
      prisma.application.count({
        where: {
          freelancerId: userId,
          status: 'ACCEPTED'
        }
      }),
      prisma.project.findMany({
        where: {
          freelancerId: userId
        },
        include: {
          client: {
            select: {
              username: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      stats: {
        activeProjects,
        totalEarnings: user.totalEarnings || 0,
        rating: user.rating || 0,
        completedProjects,
        recentActivity
      }
    });
  } else {
    // Client dashboard stats
    const [
      activeProjects,
      totalProjects,
      freelancersHired,
      avgProjectTime,
      recentActivity
    ] = await Promise.all([
      prisma.project.count({
        where: {
          clientId: userId,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }),
      prisma.project.count({
        where: {
          clientId: userId
        }
      }),
      prisma.project.count({
        where: {
          clientId: userId,
          status: 'COMPLETED'
        }
      }),
      // Skip avg timeline calculation as timeline is a string field
      Promise.resolve({ _avg: { timeline: 0 } }),
      prisma.project.findMany({
        where: {
          clientId: userId
        },
        include: {
          freelancer: {
            select: {
              username: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ]);

    res.json({
      success: true,
      stats: {
        activeProjects,
        totalSpent: user.totalSpent || 0,
        freelancersHired,
        avgProjectTime: avgProjectTime._avg.timeline || 0,
        recentActivity
      }
    });
  }
}));

// REMOVED: Monthly stats endpoint - causing errors due to missing payment model
// The ThisMonthCard component has been removed from the frontend

// Get level progress for freelancer
router.get('/level-progress', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'FREELANCER') {
    throw new AppError('Only freelancers can access level progress', 403);
  }

  const userId = req.user.id;

  // Get completed projects count
  const completedProjects = await prisma.project.count({
    where: {
      freelancerId: userId,
      status: 'COMPLETED'
    }
  });

  // Get total projects (to calculate success rate)
  const totalProjects = await prisma.project.count({
    where: {
      freelancerId: userId,
      status: {
        in: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      }
    }
  });

  const successRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  // Get user rating
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rating: true }
  });

  const rating = user?.rating || 0;

  // Determine current level based on rules
  let currentLevel = 'New Freelancer';
  let nextLevel = 'Rising Star';
  let progress = 0;

  if (completedProjects >= 51 && rating >= 4.9 && successRate >= 95) {
    currentLevel = 'Elite';
    nextLevel = 'Elite';
    progress = 100;
  } else if (completedProjects >= 21 && rating >= 4.7 && successRate >= 90) {
    currentLevel = 'Top Rated';
    nextLevel = 'Elite';
    progress = Math.min(((completedProjects - 21) / (51 - 21)) * 100, 100);
  } else if (completedProjects >= 6 && rating >= 4.5) {
    currentLevel = 'Rising Star';
    nextLevel = 'Top Rated';
    progress = Math.min(((completedProjects - 6) / (21 - 6)) * 100, 100);
  } else {
    currentLevel = 'New Freelancer';
    nextLevel = 'Rising Star';
    progress = Math.min((completedProjects / 6) * 100, 100);
  }

  // Calculate response time (mock for now - would need actual message data)
  const responseTime = '< 1 hour';

  res.json({
    success: true,
    data: {
      currentLevel,
      nextLevel,
      progress: Math.round(progress),
      metrics: {
        completedProjects,
        successRate: Math.round(successRate),
        responseTime,
        completionRate: Math.round(successRate)
      }
    }
  });
}));

// Update user availability
router.patch('/availability', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') {
    throw new AppError('isAvailable must be a boolean', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { isAvailable },
    select: {
      id: true,
      isAvailable: true
    }
  });

  res.json({
    success: true,
    isAvailable: updatedUser.isAvailable
  });
}));

export default router;