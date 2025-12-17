import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, requireRole } from '../middleware/auth';
import { requireStripeConnect } from '../middleware/stripeConnect';
import { validate, applicationSchema, validateMonetaryAmount } from '../utils/validation';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// Get applications for a project (project owner only)
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { 
    status, 
    minBudget, 
    maxBudget, 
    minRating, 
    location,
    sortBy = 'createdAt',
    order = 'desc',
    verified,
    timeline
  } = req.query;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { clientId: true }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.clientId !== req.user!.id) {
    throw new AppError('Not authorized to view applications for this project', 403);
  }

  const where: any = { projectId };
  
  // Status filter
  if (status) {
    where.status = status as string;
  }

  // Budget filters
  if (minBudget || maxBudget) {
    where.proposedBudget = {};
    if (minBudget) {
      where.proposedBudget.gte = Number(minBudget);
    }
    if (maxBudget) {
      where.proposedBudget.lte = Number(maxBudget);
    }
  }

  // Timeline filter (approximate match)
  if (timeline) {
    where.timeline = {
      contains: timeline as string,
      mode: 'insensitive'
    };
  }

  // Freelancer-specific filters
  const freelancerWhere: any = {};
  
  // Rating filter
  if (minRating) {
    freelancerWhere.rating = {
      gte: Number(minRating)
    };
  }

  // Location filter
  if (location) {
    freelancerWhere.location = {
      contains: location as string,
      mode: 'insensitive'
    };
  }

  // Verified filter (assuming isVerified field exists)
  if (verified === 'true') {
    freelancerWhere.isVerified = true;
  }

  // Add freelancer filters to where clause
  if (Object.keys(freelancerWhere).length > 0) {
    where.freelancer = freelancerWhere;
  }

  // Sorting options
  const orderBy: any = {};
  switch (sortBy) {
    case 'budget':
      orderBy.proposedBudget = order;
      break;
    case 'rating':
      orderBy.freelancer = { rating: order };
      break;
    case 'timeline':
      orderBy.timeline = order;
      break;
    default:
      orderBy.createdAt = order;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          rating: true,
          location: true,
          isVerified: true,
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
      }
    },
    orderBy
  });

  res.json({
    success: true,
    applications,
    filters: {
      status,
      minBudget,
      maxBudget,
      minRating,
      location,
      sortBy,
      order,
      verified,
      timeline
    }
  });
}));

// Check if user has applied to a specific project (freelancer only)
router.get('/check/:projectId', requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const application = await prisma.application.findUnique({
    where: {
      projectId_freelancerId: {
        projectId,
        freelancerId: req.user!.id
      }
    },
    select: {
      id: true,
      status: true,
      createdAt: true
    }
  });

  // Consider WITHDRAWN as not applied (user can reapply)
  const hasApplied = application !== null && application.status !== 'WITHDRAWN';

  res.json({
    success: true,
    hasApplied,
    application: hasApplied ? application : null
  });
}));

// Batch check if user has applied to multiple projects (freelancer only)
router.post('/check-batch', requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { projectIds } = req.body;

  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    throw new AppError('projectIds must be a non-empty array', 400);
  }

  // Limit to 50 projects per request to prevent abuse
  const limitedIds = projectIds.slice(0, 50);

  const applications = await prisma.application.findMany({
    where: {
      freelancerId: req.user!.id,
      projectId: { in: limitedIds },
      status: { not: 'WITHDRAWN' } // Exclude withdrawn applications
    },
    select: {
      projectId: true,
      status: true
    }
  });

  // Create a map of projectId -> hasApplied
  const appliedMap: Record<string, boolean> = {};
  limitedIds.forEach(id => {
    appliedMap[id] = applications.some(app => app.projectId === id);
  });

  res.json({
    success: true,
    appliedProjects: appliedMap
  });
}));

// Get user's applications (freelancer only)
router.get('/my-applications', requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = { freelancerId: req.user!.id };
  if (status) {
    where.status = status as string;
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take,
      include: {
        project: {
          include: {
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
            category: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                applications: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.application.count({ where })
  ]);

  res.json({
    success: true,
    applications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// Submit application to project (freelancers only)
router.post('/:projectId', requireRole(['FREELANCER']), requireStripeConnect, validate(applicationSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { coverLetter, proposedBudget, timeline } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      status: true,
      clientId: true,
      minBudget: true,
      maxBudget: true,
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.status !== 'OPEN') {
    throw new AppError('This project is not accepting applications', 400);
  }

  if (project.clientId === req.user!.id) {
    throw new AppError('You cannot apply to your own project', 400);
  }

  // Check if user already applied
  const existingApplication = await prisma.application.findUnique({
    where: {
      projectId_freelancerId: {
        projectId,
        freelancerId: req.user!.id
      }
    }
  });

  if (existingApplication) {
    throw new AppError('You have already applied to this project', 400);
  }

  // Validate proposed budget if provided
  if (proposedBudget) {
    const validatedBudget = validateMonetaryAmount(proposedBudget, {
      min: project.minBudget,
      max: project.maxBudget,
      fieldName: 'Proposed budget'
    });
    // Use the validated and normalized amount
    req.body.proposedBudget = validatedBudget;
  }

  const application = await prisma.application.create({
    data: {
      projectId,
      freelancerId: req.user!.id,
      coverLetter,
      proposedBudget,
      timeline
    },
    include: {
      project: {
        select: {
          title: true,
          client: {
            select: {
              username: true
            }
          }
        }
      },
      freelancer: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true,
          location: true
        }
      }
    }
  });

  // Get total applications count for this project
  const totalApplications = await prisma.application.count({
    where: { projectId }
  });

  // Send notification to client about new application
  try {
    await notificationService.sendApplicationNotification(
      project.clientId,
      application.id,
      projectId,
      `${application.freelancer.firstName} ${application.freelancer.lastName}`,
      application.project.title
    );
  } catch (error) {
    console.error('Error sending application notification:', error);
    // Don't fail the request if notification fails
  }

  // Send email notification to client
  try {
    await emailService.sendApplicationReceivedClientEmail({
      application,
      client: project.client,
      freelancer: application.freelancer,
      project: { id: projectId, title: project.title },
      totalApplications
    });
  } catch (error) {
    console.error('Error sending application email:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    application
  });
}));

// Update application (freelancer only, before acceptance)
router.put('/:applicationId', asyncHandler(async (req: AuthRequest, res) => {
  const { applicationId } = req.params;
  const { coverLetter, proposedBudget, timeline } = req.body;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      project: {
        select: {
          minBudget: true,
          maxBudget: true
        }
      }
    }
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (application.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to update this application', 403);
  }

  if (application.status !== 'PENDING') {
    throw new AppError('Cannot update application that has been processed', 400);
  }

  // Validate proposed budget if provided
  if (proposedBudget) {
    const validatedBudget = validateMonetaryAmount(proposedBudget, {
      min: application.project.minBudget,
      max: application.project.maxBudget,
      fieldName: 'Proposed budget'
    });
    // Use the validated and normalized amount
    req.body.proposedBudget = validatedBudget;
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: {
      coverLetter,
      proposedBudget,
      timeline
    },
    include: {
      project: {
        select: {
          title: true
        }
      },
      freelancer: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          rating: true
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Application updated successfully',
    application: updatedApplication
  });
}));

// Withdraw application (freelancer only)
router.delete('/:applicationId', asyncHandler(async (req: AuthRequest, res) => {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (application.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to withdraw this application', 403);
  }

  if (application.status === 'ACCEPTED') {
    throw new AppError('Cannot withdraw accepted application', 400);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'WITHDRAWN' }
  });

  res.json({
    success: true,
    message: 'Application withdrawn successfully'
  });
}));

// Get application by ID
router.get('/:applicationId', asyncHandler(async (req: AuthRequest, res) => {
  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      project: {
        include: {
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
          category: true,
          skills: {
            include: {
              skill: true
            }
          }
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          rating: true,
          location: true,
          skills: {
            include: {
              skill: true
            }
          },
          freelancerReviews: {
            where: { isPublic: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Only project owner or applicant can view
  if (application.project.clientId !== req.user!.id && application.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to view this application', 403);
  }

  res.json({
    success: true,
    application
  });
}));

export default router;