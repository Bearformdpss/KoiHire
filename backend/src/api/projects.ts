import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { validate, projectSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects (public, with filters)
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minBudget,
    maxBudget,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    featured = false,
    featuredLevel = null
  } = req.query;

  // Map frontend sortBy values to valid Prisma field names
  const sortByMapping: Record<string, string> = {
    'newest': 'createdAt',
    'oldest': 'createdAt',
    'budget-high': 'maxBudget',
    'budget-low': 'minBudget',
    'title': 'title',
    'featured_priority': 'featuredLevel' // For featured projects sorting
  };

  const validSortBy = sortByMapping[sortBy as string] || sortBy as string || 'createdAt';

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    status: 'OPEN'
  };

  if (category) {
    where.categoryId = category as string;
  }

  if (minBudget || maxBudget) {
    where.AND = [];
    if (minBudget) {
      where.AND.push({ minBudget: { gte: Number(minBudget) } });
    }
    if (maxBudget) {
      where.AND.push({ maxBudget: { lte: Number(maxBudget) } });
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  // Featured projects filter
  if (featured === 'true' || featured === true) {
    where.isFeatured = true;
    where.featuredUntil = {
      gte: new Date() // Only show currently active featured projects
    };
    
    // Filter by specific featured level if provided
    if (featuredLevel && ['BASIC', 'PREMIUM', 'SPOTLIGHT'].includes(featuredLevel as string)) {
      where.featuredLevel = featuredLevel as string;
    }
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { [validSortBy]: order },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            avatar: true,
            rating: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    success: true,
    projects,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get user's projects (authenticated route) - MUST come before /:projectId
// Clients get projects they posted, Freelancers get projects they're assigned to
router.get('/my-projects', authMiddleware, requireRole(['CLIENT', 'FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Different query logic based on user role
  const where: any = {};
  
  if (req.user!.role === 'CLIENT') {
    // Clients see projects they posted
    where.clientId = req.user!.id;
  } else if (req.user!.role === 'FREELANCER') {
    // Freelancers see projects they're assigned to
    where.freelancerId = req.user!.id;
  }

  // Filter by status if provided
  if (status && status !== 'ALL') {
    where.status = status as string;
  }

  // Search functionality
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: order },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        // Include client info for freelancers to see who they're working for
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true
          }
        },
        // Include freelancer info for clients to see who they hired
        freelancer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    }),
    prisma.project.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
}));

// Get project by ID
router.get('/:projectId', asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true,
          location: true
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true
        }
      },
      category: true,
      applications: {
        include: {
          freelancer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({
    success: true,
    project
  });
}));

// Create project (clients only)
router.post('/', authMiddleware, requireRole(['CLIENT']), validate(projectSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { title, description, requirements, minBudget, maxBudget, timeline, categoryId, featured, featuredLevel, featuredPrice } = req.body;

  // Handle premium upgrade logic
  let premiumData = {};
  if (featured && featuredLevel && featuredLevel !== 'NONE') {
    // Set featured until 60 days from now (can be adjusted)
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 60);
    
    premiumData = {
      isFeatured: true,
      featuredLevel: featuredLevel,
      featuredUntil: featuredUntil,
      featuredPrice: featuredPrice || 0
    };
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      requirements,
      minBudget,
      maxBudget,
      timeline,
      categoryId,
      clientId: req.user!.id,
      ...premiumData
    },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      category: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project
  });
}));

// Update project (project owner only)
router.put('/:projectId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { title, description, requirements, minBudget, maxBudget, timeline } = req.body;

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!existingProject) {
    throw new AppError('Project not found', 404);
  }

  if (existingProject.clientId !== req.user!.id) {
    throw new AppError('Not authorized to update this project', 403);
  }

  if (existingProject.status !== 'OPEN') {
    throw new AppError('Cannot update project that is not open', 400);
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      description,
      requirements,
      minBudget,
      maxBudget,
      timeline
    },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          avatar: true
        }
      },
      category: true
    }
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    project: updatedProject
  });
}));

// Accept freelancer application (project owner only)
router.post('/:projectId/accept/:applicationId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId, applicationId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      applications: {
        where: { id: applicationId }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status !== 'OPEN') {
    throw new AppError('Project is not open for applications', 400);
  }

  const application = project.applications[0];
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Get all other applications for rejection notifications
  const allApplications = await prisma.application.findMany({
    where: { projectId },
    include: {
      freelancer: {
        select: { id: true, firstName: true, lastName: true }
      },
      project: {
        select: { title: true }
      }
    }
  });

  const acceptedApplication = allApplications.find(app => app.id === applicationId);
  const rejectedApplications = allApplications.filter(app => app.id !== applicationId);

  // Update project and application status
  // Set agreedAmount from the accepted application's proposedBudget
  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'IN_PROGRESS',
        freelancerId: application.freelancerId,
        agreedAmount: application.proposedBudget || project.maxBudget // Use proposedBudget or fallback to maxBudget
      }
    }),
    prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' }
    }),
    // Reject all other applications
    prisma.application.updateMany({
      where: {
        projectId,
        id: { not: applicationId }
      },
      data: { status: 'REJECTED' }
    })
  ]);

  // Send notifications
  try {
    // Notify accepted freelancer
    if (acceptedApplication) {
      await notificationService.sendApplicationAcceptedNotification(
        acceptedApplication.freelancerId,
        applicationId,
        projectId,
        acceptedApplication.project.title
      );
    }

    // Notify rejected freelancers
    for (const rejectedApp of rejectedApplications) {
      await notificationService.sendApplicationRejectedNotification(
        rejectedApp.freelancerId,
        rejectedApp.id,
        projectId,
        rejectedApp.project.title
      );
    }
  } catch (error) {
    console.error('Error sending application status notifications:', error);
    // Don't fail the request if notifications fail
  }

  res.json({
    success: true,
    message: 'Application accepted successfully'
  });
}));

// Complete project (project owner only)
router.post('/:projectId/complete', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status !== 'IN_PROGRESS') {
    throw new AppError('Project is not in progress', 400);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Project completed successfully'
  });
}));

// Pause/Resume project (project owner only)
router.post('/:projectId/pause', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status === 'IN_PROGRESS') {
    throw new AppError('Cannot pause project with assigned freelancer', 400);
  }

  const newStatus = project.status === 'PAUSED' ? 'OPEN' : 'PAUSED';
  
  await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus }
  });

  res.json({
    success: true,
    message: `Project ${newStatus === 'PAUSED' ? 'paused' : 'resumed'} successfully`
  });
}));

// Cancel project (project owner only)
router.post('/:projectId/cancel', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { reason } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status === 'IN_PROGRESS') {
    throw new AppError('Cannot cancel project with assigned freelancer', 400);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: 'CANCELLED',
      cancelReason: reason || null
    }
  });

  res.json({
    success: true,
    message: 'Project cancelled successfully'
  });
}));

// Update project timeline (project owner only)
router.put('/:projectId/timeline', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { timeline, reason } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status === 'IN_PROGRESS') {
    throw new AppError('Cannot modify timeline of project with assigned freelancer', 400);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      timeline,
      timelineUpdateReason: reason || null
    }
  });

  res.json({
    success: true,
    message: 'Project timeline updated successfully'
  });
}));

// Update project budget (project owner only)
router.put('/:projectId/budget', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { minBudget, maxBudget, reason } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { 
      minBudget,
      maxBudget,
      budgetUpdateReason: reason || null
    }
  });

  // TODO: Send notifications to freelancer/bidders about budget change
  console.log(`TODO: Notify about budget change for project ${projectId}`);

  res.json({
    success: true,
    message: 'Project budget updated successfully'
  });
}));

// Delete project (project owner only)
router.delete('/:projectId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized', 403);
  }

  if (project.status === 'IN_PROGRESS') {
    throw new AppError('Cannot delete project that is in progress', 400);
  }

  await prisma.project.delete({
    where: { id: projectId }
  });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// Submit project for review (freelancer only)
router.put('/:projectId/submit-for-review', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      freelancer: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify that the current user is the assigned freelancer
  if (project.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized. You must be the assigned freelancer to submit for review.', 403);
  }

  // Verify project is currently in progress
  if (project.status !== 'IN_PROGRESS') {
    throw new AppError('Project must be in progress to submit for review', 400);
  }

  // Update project status to PENDING_REVIEW
  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: 'PENDING_REVIEW'
    }
  });

  // Send notification to client about submission for review
  try {
    if (project.freelancer) {
      await notificationService.sendSubmissionReceivedNotification(
        project.client.id,
        projectId,
        project.title,
        `${project.freelancer.firstName} ${project.freelancer.lastName}`
      );
    }
  } catch (error) {
    console.error('Error sending submission notification:', error);
    // Don't fail the request if notification fails
  }

  res.json({
    success: true,
    message: 'Project submitted for client review successfully'
  });
}));

// Approve project (client only)
router.post('/:projectId/approve', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      freelancer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify that the current user is the project client
  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized. Only the project client can approve submissions.', 403);
  }

  // Verify project is currently pending review or already completed (via review submission)
  if (project.status !== 'PENDING_REVIEW' && project.status !== 'COMPLETED') {
    throw new AppError('Project must be pending review to approve', 400);
  }

  // If already completed (via review submission), return success
  if (project.status === 'COMPLETED') {
    return res.json({
      success: true,
      message: 'Project has already been approved and completed.'
    });
  }

  // Update project status to COMPLETED
  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  // Send notification to freelancer about approval
  try {
    if (project.freelancer) {
      await notificationService.sendWorkApprovedNotification(
        project.freelancer.id,
        projectId,
        project.title
      );
    }
  } catch (error) {
    console.error('Error sending work approval notification:', error);
    // Don't fail the request if notification fails
  }

  // TODO: Process payment release to freelancer

  res.json({
    success: true,
    message: 'Project approved and completed successfully. Payment will be released to the freelancer.'
  });
}));

// Request changes (client only)
router.post('/:projectId/request-changes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    throw new AppError('Change request message is required', 400);
  }

  if (message.length > 500) {
    throw new AppError('Change request message cannot exceed 500 characters', 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      freelancer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify that the current user is the project client
  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized. Only the project client can request changes.', 403);
  }

  // Verify project is currently pending review
  if (project.status !== 'PENDING_REVIEW') {
    throw new AppError('Project must be pending review to request changes', 400);
  }

  // Update project status back to IN_PROGRESS 
  // Note: changeRequestMessage field temporarily disabled due to Prisma client sync issues
  await prisma.project.update({
    where: { id: projectId },
    data: { 
      status: 'IN_PROGRESS'
      // changeRequestMessage: message.trim() // TODO: Re-enable when Prisma client is regenerated
    }
  });

  // Send notification to freelancer about change request
  try {
    if (project.freelancer) {
      await notificationService.sendChangesRequestedNotification(
        project.freelancer.id,
        projectId,
        project.title,
        message.trim()
      );
    }
  } catch (error) {
    console.error('Error sending change request notification:', error);
    // Don't fail the request if notification fails
  }

  res.json({
    success: true,
    message: 'Change request sent to freelancer. Project status updated to in progress.'
  });
}));

export default router;