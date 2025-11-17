import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get recommended projects for the authenticated freelancer
 * Based on their service categories and past project experience
 */
router.get('/projects', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const freelancerId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 6;

  // 1. Get freelancer's services
  const services = await prisma.service.findMany({
    where: {
      freelancerId: freelancerId,
      isActive: true
    },
    select: { categoryId: true }
  });

  // Get freelancer's completed projects
  const completedProjects = await prisma.project.findMany({
    where: {
      freelancerId: freelancerId,
      status: 'COMPLETED'
    },
    select: { categoryId: true }
  });

  // 2. Extract unique categories from services and completed projects
  const serviceCategories = services.map(s => s.categoryId);
  const projectCategories = completedProjects.map(p => p.categoryId);
  const allCategories = serviceCategories.concat(projectCategories);
  const uniqueCategories = Array.from(new Set(allCategories));

  // 3. Build query for matching projects
  let whereClause: any = {
    status: 'OPEN',
    // Exclude projects freelancer already applied to
    applications: {
      none: {
        freelancerId: freelancerId
      }
    },
    // Recent projects (last 30 days)
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  };

  // If freelancer has categories, filter by them
  if (uniqueCategories.length > 0) {
    whereClause.categoryId = { in: uniqueCategories };
  }

  // 4. Find matching projects
  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      _count: {
        select: { applications: true }
      }
    },
    take: limit * 2, // Get more for scoring
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 5. Score and rank projects
  const scoredProjects = projects.map(project => {
    let score = 0;

    // Category match (higher priority)
    if (uniqueCategories.includes(project.categoryId)) {
      score += 15;
    }

    // Low competition (fewer applicants = better odds)
    const applicantCount = project._count.applications;
    if (applicantCount < 5) {
      score += 5;
    } else if (applicantCount < 10) {
      score += 3;
    }

    // Recent posting (prioritize fresh opportunities)
    const hoursAgo = (Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
      score += 3;
    } else if (hoursAgo < 72) {
      score += 2;
    }

    return {
      ...project,
      applicationsCount: project._count.applications,
      score
    };
  });

  // 6. Sort by score and limit results
  const topProjects = scoredProjects
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ _count, score, ...project }) => ({
      ...project,
      matchReason: project.category ? `Matches your ${project.category.name} experience` : 'Recommended for you'
    }));

  // 7. Get category names for display
  const matchedCategories = await prisma.category.findMany({
    where: {
      id: { in: uniqueCategories.slice(0, 3) } // Top 3 categories
    },
    select: { name: true }
  });

  res.json({
    success: true,
    data: {
      projects: topProjects,
      matchedSkills: matchedCategories.map(c => c.name),
      totalMatches: projects.length
    }
  });
}));

export default router;
