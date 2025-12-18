import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { validate, reviewSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Create review for completed project (requires auth)
router.post('/', authMiddleware, validate(reviewSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { projectId, revieweeId, rating, comment, communication, quality, timeliness, professionalism } = req.body;

  let project = null;

  // If projectId is provided, validate the project
  if (projectId) {
    project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        status: true,
        clientId: true,
        freelancerId: true,
        title: true
      }
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.status !== 'COMPLETED' && project.status !== 'PENDING_REVIEW') {
      throw new AppError('Project must be completed or pending review to leave a review', 400);
    }

    // Verify user is part of the project
    if (req.user!.id !== project.clientId && req.user!.id !== project.freelancerId) {
      throw new AppError('Not authorized to review this project', 403);
    }
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: {
      projectId_reviewerId: {
        projectId,
        reviewerId: req.user!.id
      }
    }
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this project', 400);
  }

  const review = await prisma.review.create({
    data: {
      projectId,
      reviewerId: req.user!.id,
      revieweeId,
      rating,
      comment,
      communication: communication || rating,
      quality: quality || rating,
      timeliness: timeliness || rating,
      professionalism: professionalism || rating
    },
    include: {
      project: {
        select: {
          title: true
        }
      },
      reviewer: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Update reviewee's average rating
  await updateUserRating(revieweeId);

  // Note: Project remains in PENDING_REVIEW status until client explicitly approves
  // This ensures payment is only released when client clicks "Complete Project"

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    review
  });
}));

// Get reviews for a user (public endpoint - no auth required)
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type = 'received', page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    isPublic: true
  };

  if (type === 'received') {
    where.revieweeId = userId;
  } else {
    where.reviewerId = userId;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        reviewee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.count({ where })
  ]);

  // Calculate rating statistics
  const ratingStats = await prisma.review.groupBy({
    by: ['rating'],
    where: { revieweeId: userId, isPublic: true },
    _count: {
      rating: true
    }
  });

  const totalReviews = ratingStats.reduce((sum, stat) => sum + stat._count.rating, 0);
  const averageRating = totalReviews > 0 
    ? ratingStats.reduce((sum, stat) => sum + (stat.rating * stat._count.rating), 0) / totalReviews
    : 0;

  res.json({
    success: true,
    reviews,
    stats: {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingBreakdown: ratingStats.reduce((acc, stat) => {
        acc[stat.rating] = stat._count.rating;
        return acc;
      }, {} as Record<number, number>)
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get review statistics for a user (public endpoint - no auth required)
router.get('/user/:userId/stats', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [reviews, ratingStats] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: userId, isPublic: true },
      select: {
        rating: true,
        communication: true,
        quality: true,
        timeliness: true,
        professionalism: true
      }
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { revieweeId: userId, isPublic: true },
      _count: {
        rating: true
      }
    })
  ]);

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  // Calculate category averages
  const categoryAverages = totalReviews > 0 ? {
    communication: reviews.reduce((sum, r) => sum + (r.communication || r.rating), 0) / totalReviews,
    quality: reviews.reduce((sum, r) => sum + (r.quality || r.rating), 0) / totalReviews,
    timeliness: reviews.reduce((sum, r) => sum + (r.timeliness || r.rating), 0) / totalReviews,
    professionalism: reviews.reduce((sum, r) => sum + (r.professionalism || r.rating), 0) / totalReviews
  } : {
    communication: 0,
    quality: 0,
    timeliness: 0,
    professionalism: 0
  };

  // Create rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingStats.forEach(stat => {
    ratingDistribution[stat.rating as keyof typeof ratingDistribution] = stat._count.rating;
  });

  res.json({
    success: true,
    stats: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      categoryAverages: {
        communication: Math.round(categoryAverages.communication * 10) / 10,
        quality: Math.round(categoryAverages.quality * 10) / 10,
        timeliness: Math.round(categoryAverages.timeliness * 10) / 10,
        professionalism: Math.round(categoryAverages.professionalism * 10) / 10
      }
    }
  });
}));

// Get pending reviews for current user (requires auth)
router.get('/pending', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  // Find completed projects where user hasn't left a review yet
  const completedProjects = await prisma.project.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { clientId: req.user!.id },
        { freelancerId: req.user!.id }
      ]
    },
    select: {
      id: true,
      title: true,
      completedAt: true,
      clientId: true,
      freelancerId: true,
      client: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      reviews: {
        where: {
          reviewerId: req.user!.id
        },
        select: {
          id: true
        }
      }
    }
  });

  // Filter out projects where user has already left a review
  const pendingReviews = completedProjects
    .filter(project => project.reviews.length === 0)
    .map(project => {
      // Determine who the user should review
      const isClient = req.user!.id === project.clientId;
      const reviewee = isClient ? project.freelancer : project.client;
      const revieweeType = isClient ? 'FREELANCER' : 'CLIENT';

      return {
        id: `pending-${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        revieweeId: reviewee?.id || '',
        revieweeName: reviewee ? `${reviewee.firstName} ${reviewee.lastName}` : '',
        revieweeType,
        completedAt: project.completedAt?.toISOString() || new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
    });

  res.json({
    success: true,
    pendingReviews
  });
}));

// Get review for specific project (requires auth)
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      freelancerId: true,
      status: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Only project participants can view reviews
  if (req.user!.id !== project.clientId && req.user!.id !== project.freelancerId) {
    throw new AppError('Not authorized to view reviews for this project', 403);
  }

  const reviews = await prisma.review.findMany({
    where: { projectId },
    include: {
      project: {
        select: {
          title: true
        }
      },
      reviewer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    }
  });

  res.json({
    success: true,
    reviews
  });
}));

// Update review (reviewer only, within 7 days, requires auth)
router.put('/:reviewId', authMiddleware, validate(reviewSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.reviewerId !== req.user!.id) {
    throw new AppError('Not authorized to update this review', 403);
  }

  // Check if review is within 7 days
  const daysSinceCreated = Math.floor((Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceCreated > 7) {
    throw new AppError('Reviews can only be updated within 7 days of creation', 400);
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment
    },
    include: {
      project: {
        select: {
          title: true
        }
      },
      reviewer: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      reviewee: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Update reviewee's average rating
  await updateUserRating(review.revieweeId);

  res.json({
    success: true,
    message: 'Review updated successfully',
    review: updatedReview
  });
}));

// Delete review (reviewer only, within 24 hours, requires auth)
router.delete('/:reviewId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { reviewId } = req.params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.reviewerId !== req.user!.id) {
    throw new AppError('Not authorized to delete this review', 403);
  }

  // Check if review is within 24 hours
  const hoursSinceCreated = Math.floor((Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60));
  if (hoursSinceCreated > 24) {
    throw new AppError('Reviews can only be deleted within 24 hours of creation', 400);
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });

  // Update reviewee's average rating
  await updateUserRating(review.revieweeId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// Helper function to update user's average rating
async function updateUserRating(userId: string) {
  const ratings = await prisma.review.findMany({
    where: {
      revieweeId: userId,
      isPublic: true
    },
    select: {
      rating: true
    }
  });

  if (ratings.length > 0) {
    const averageRating = ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length;
    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: Math.round(averageRating * 10) / 10
      }
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: null
      }
    });
  }
}

export default router;