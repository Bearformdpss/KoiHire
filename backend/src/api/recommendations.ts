import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get newest projects for the authenticated freelancer
 * Shows the most recently posted open projects
 */
router.get('/projects', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const freelancerId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 10;

  // Get newest open projects that the freelancer hasn't applied to yet
  const projects = await prisma.project.findMany({
    where: {
      status: 'OPEN',
      // Exclude projects freelancer already applied to
      applications: {
        none: {
          freelancerId: freelancerId
        }
      }
    },
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
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });

  // Format response with applications count
  const formattedProjects = projects.map(({ _count, ...project }) => ({
    ...project,
    applicationsCount: _count.applications
  }));

  res.json({
    success: true,
    data: {
      projects: formattedProjects,
      totalMatches: formattedProjects.length
    }
  });
}));

export default router;
