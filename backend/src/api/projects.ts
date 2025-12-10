import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { validate, projectSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { calculateProjectPricing } from '../utils/pricing';
import { releaseProjectEscrowPayment } from '../services/stripeService';
import { createProjectEvent, PROJECT_EVENT_TYPES, getProjectEvents } from '../services/eventService';

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

  // Generate unique project number (format: PRJ-{timestamp}-{random3digits})
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const projectNumber = `PRJ-${timestamp}-${randomSuffix}`;

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
      projectNumber,
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
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
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

  // Check if freelancer has any payout method set up (Stripe Connect OR PayPal/Payoneer)
  const freelancer = await prisma.user.findUnique({
    where: { id: application.freelancerId },
    select: {
      stripeConnectAccountId: true,
      stripeOnboardingComplete: true,
      stripePayoutsEnabled: true,
      payoutMethod: true,
      paypalEmail: true,
      payoneerEmail: true,
      firstName: true,
      lastName: true
    }
  });

  // Freelancer can work if they have:
  // 1. Stripe Connect set up and verified, OR
  // 2. PayPal payout method with email, OR
  // 3. Payoneer payout method with email
  const hasStripeConnect = freelancer?.stripeConnectAccountId && freelancer.stripeOnboardingComplete && freelancer.stripePayoutsEnabled;
  const hasPayPal = freelancer?.payoutMethod === 'PAYPAL' && freelancer.paypalEmail;
  const hasPayoneer = freelancer?.payoutMethod === 'PAYONEER' && freelancer.payoneerEmail;
  const hasValidPayoutMethod = hasStripeConnect || hasPayPal || hasPayoneer;

  if (!hasValidPayoutMethod) {
    throw new AppError(
      `Cannot accept application. ${freelancer?.firstName} ${freelancer?.lastName} has not set up a payout method. They need to configure PayPal, Payoneer, or Stripe Connect before accepting work.`,
      400
    );
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

  // Calculate pricing with fees
  const agreedAmount = application.proposedBudget || project.maxBudget;
  const pricing = calculateProjectPricing(agreedAmount);

  console.log('💰 Project pricing calculated:', {
    agreedAmount: pricing.agreedAmount,
    buyerFee: pricing.buyerFee,
    sellerCommission: pricing.sellerCommission,
    totalCharged: pricing.totalCharged,
    freelancerReceives: pricing.freelancerReceives
  });

  // Update project and application status with fee structure
  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'IN_PROGRESS',
        freelancerId: application.freelancerId,
        agreedAmount: pricing.agreedAmount,
        buyerFee: pricing.buyerFee,
        sellerCommission: pricing.sellerCommission,
        totalCharged: pricing.totalCharged,
        paymentStatus: 'PENDING'
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

  // Create timeline event for freelancer being hired
  await createProjectEvent({
    projectId,
    eventType: PROJECT_EVENT_TYPES.FREELANCER_HIRED,
    actorId: req.user!.id,
    actorName: `${project.client.firstName} ${project.client.lastName}`,
    metadata: {
      freelancerId: application.freelancerId,
      freelancerName: `${acceptedApplication.freelancer.firstName} ${acceptedApplication.freelancer.lastName}`,
      agreedAmount: pricing.agreedAmount,
      totalCharged: pricing.totalCharged,
      buyerFee: pricing.buyerFee,
      sellerCommission: pricing.sellerCommission
    }
  });

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

  // Send email notifications
  try {
    // Get accepted freelancer details for email
    const acceptedFreelancer = await prisma.user.findUnique({
      where: { id: acceptedApplication.freelancerId },
      select: { email: true, firstName: true, lastName: true }
    });

    // Email accepted freelancer
    if (acceptedFreelancer) {
      await emailService.sendApplicationAcceptedFreelancerEmail({
        freelancer: acceptedFreelancer,
        client: { firstName: project.client.firstName, lastName: project.client.lastName },
        project: { id: projectId, title: project.title },
        agreedAmount: pricing.agreedAmount
      });
    }

    // Email rejected freelancers
    for (const rejectedApp of rejectedApplications) {
      const rejectedFreelancer = await prisma.user.findUnique({
        where: { id: rejectedApp.freelancerId },
        select: { email: true, firstName: true }
      });

      if (rejectedFreelancer) {
        await emailService.sendApplicationRejectedFreelancerEmail({
          freelancer: rejectedFreelancer,
          project: { title: project.title }
        });
      }
    }
  } catch (error) {
    console.error('Error sending application status emails:', error);
    // Don't fail the request if emails fail
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

  // Get client info for event
  const client = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { firstName: true, lastName: true }
  });

  // Create timeline event for project cancellation
  if (client) {
    await createProjectEvent({
      projectId,
      eventType: PROJECT_EVENT_TYPES.PROJECT_CANCELLED,
      actorId: req.user!.id,
      actorName: `${client.firstName} ${client.lastName}`,
      metadata: {
        reason: reason || 'No reason provided',
        cancelledAt: new Date()
      }
    });
  }

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

// Submit project work for review (freelancer only) - Enhanced with ProjectSubmission
router.put('/:projectId/submit-work', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const { title, description, files } = req.body;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    throw new AppError('Submission title is required', 400);
  }

  if (title.length > 200) {
    throw new AppError('Submission title cannot exceed 200 characters', 400);
  }

  if (description && description.length > 2000) {
    throw new AppError('Submission description cannot exceed 2000 characters', 400);
  }

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
      },
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1
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

  // Calculate submission number (count of all previous submissions + 1)
  const submissionCount = await prisma.projectSubmission.count({
    where: { projectId }
  });
  const submissionNumber = submissionCount + 1;

  // Create ProjectSubmission record
  const submission = await prisma.projectSubmission.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      files: files || [],
      submissionNumber,
      status: 'SUBMITTED'
    }
  });

  // Create ProjectFile records for each submitted file so they appear in Project Files section
  if (files && files.length > 0) {
    try {
      await Promise.all(
        files.map((fileUrl: string) => {
          // Extract filename from URL (S3 URL format: https://bucket.s3.region.amazonaws.com/path/filename)
          const fileName = fileUrl.split('/').pop() || 'file';

          return prisma.projectFile.create({
            data: {
              projectId,
              fileName,
              originalName: fileName,
              fileSize: 0, // Size not available from deliverable submission
              mimeType: 'application/octet-stream', // Type not available from URL
              filePath: fileUrl,
              uploadedById: req.user!.id
            }
          });
        })
      );
    } catch (error) {
      console.error('Error creating ProjectFile records for submission:', error);
      // Don't fail the whole submission if this fails
    }
  }

  // Update project status to PENDING_REVIEW
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'PENDING_REVIEW'
    }
  });

  // Create timeline event - check if this is initial submission or revision
  const isRevision = submissionNumber > 1;

  await createProjectEvent({
    projectId,
    eventType: isRevision ? PROJECT_EVENT_TYPES.REVISION_SUBMITTED : PROJECT_EVENT_TYPES.WORK_SUBMITTED,
    actorId: req.user!.id,
    actorName: `${project.freelancer!.firstName} ${project.freelancer!.lastName}`,
    metadata: {
      submittedAt: new Date(),
      submissionId: submission.id,
      submissionTitle: title.trim(),
      submissionNumber,
      filesCount: files?.length || 0
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

  // Send email to client about work submission
  try {
    if (project.freelancer) {
      await emailService.sendWorkSubmittedClientEmail({
        client: { email: project.client.email, firstName: project.client.firstName },
        freelancer: { firstName: project.freelancer.firstName, lastName: project.freelancer.lastName },
        project: { id: projectId, title: project.title },
        submission: { title: title.trim(), submissionNumber }
      });
    }
  } catch (error) {
    console.error('Error sending work submitted email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Work submitted for client review successfully',
    data: {
      submission,
      submissionNumber
    }
  });
}));

// LEGACY ENDPOINT - Keep for backward compatibility, redirects to new endpoint logic
router.put('/:projectId/submit-for-review', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
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

  if (project.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized. You must be the assigned freelancer to submit for review.', 403);
  }

  if (project.status !== 'IN_PROGRESS') {
    throw new AppError('Project must be in progress to submit for review', 400);
  }

  // Create a basic submission with default values for legacy calls
  const submissionCount = await prisma.projectSubmission.count({
    where: { projectId }
  });

  const submission = await prisma.projectSubmission.create({
    data: {
      projectId,
      title: `Submission ${submissionCount + 1}`,
      description: 'Work completed and submitted for review',
      files: [],
      submissionNumber: submissionCount + 1,
      status: 'SUBMITTED'
    }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'PENDING_REVIEW' }
  });

  await createProjectEvent({
    projectId,
    eventType: submissionCount > 0 ? PROJECT_EVENT_TYPES.REVISION_SUBMITTED : PROJECT_EVENT_TYPES.WORK_SUBMITTED,
    actorId: req.user!.id,
    actorName: `${project.freelancer!.firstName} ${project.freelancer!.lastName}`,
    metadata: { submittedAt: new Date(), submissionId: submission.id }
  });

  res.json({
    success: true,
    message: 'Project submitted for client review successfully'
  });
}));

// Get current submission for a project
router.get('/:projectId/submission/current', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      freelancerId: true,
      status: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Verify user is client or assigned freelancer
  if (project.clientId !== req.user!.id && project.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to view this project submission', 403);
  }

  // Get the most recent submission with SUBMITTED status
  const submission = await prisma.projectSubmission.findFirst({
    where: {
      projectId,
      status: { in: ['SUBMITTED', 'REVISION_REQUESTED', 'APPROVED'] }
    },
    orderBy: { submittedAt: 'desc' }
  });

  res.json({
    success: true,
    data: {
      submission,
      hasSubmission: !!submission
    }
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

  // Get client info for event
  const client = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { firstName: true, lastName: true }
  });

  // Create timeline event for project approval (BEFORE payment release for chronological accuracy)
  if (client) {
    await createProjectEvent({
      projectId,
      eventType: PROJECT_EVENT_TYPES.PROJECT_APPROVED,
      actorId: req.user!.id,
      actorName: `${client.firstName} ${client.lastName}`,
      metadata: {
        approvedAt: new Date()
      }
    });
  }

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

  // Release payment to freelancer
  try {
    console.log(`🔄 Releasing payment for project ${projectId}...`);
    await releaseProjectEscrowPayment(projectId);
    console.log(`✅ Payment released successfully for project ${projectId}`);
  } catch (error: any) {
    console.error(`❌ Error releasing payment for project ${projectId}:`, error);
    // Rollback project status if payment fails
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PENDING_REVIEW',
        completedAt: null
      }
    });
    throw new AppError(`Failed to release payment: ${error.message}`, 500);
  }

  // Send emails to freelancer about approval and payment
  try {
    if (project.freelancer && client) {
      // Calculate freelancer's net payment (agreedAmount - sellerCommission)
      const freelancerPayment = (project.agreedAmount || 0) - (project.sellerCommission || 0);

      // Send work approved email
      await emailService.sendWorkApprovedFreelancerEmail({
        freelancer: { email: project.freelancer.email, firstName: project.freelancer.firstName },
        client: { firstName: client.firstName, lastName: client.lastName },
        project: { id: projectId, title: project.title }
      });

      // Send payment released email
      await emailService.sendProjectPaymentReleasedFreelancerEmail({
        freelancer: { email: project.freelancer.email, firstName: project.freelancer.firstName },
        client: { firstName: client.firstName, lastName: client.lastName },
        project: { title: project.title },
        paymentAmount: freelancerPayment
      });
    }
  } catch (error) {
    console.error('Error sending work approved/payment released emails:', error);
    // Don't fail the request if emails fail
  }

  res.json({
    success: true,
    message: 'Project approved and completed successfully. Payment has been released to the freelancer.'
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
      },
      submissions: {
        where: { status: 'SUBMITTED' },
        orderBy: { submittedAt: 'desc' },
        take: 1
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

  // Check revision limit
  if (project.revisionsRequested >= project.maxRevisionsAllowed) {
    throw new AppError(
      `Revision limit reached. This project allows ${project.maxRevisionsAllowed} revision${project.maxRevisionsAllowed > 1 ? 's' : ''}. Please approve or cancel the project.`,
      400
    );
  }

  // Update the current submission status to REVISION_REQUESTED
  if (project.submissions.length > 0) {
    await prisma.projectSubmission.update({
      where: { id: project.submissions[0].id },
      data: {
        status: 'REVISION_REQUESTED',
        revisionNote: message.trim()
      }
    });
  }

  // Update project: increment revision counter and set status back to IN_PROGRESS
  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: 'IN_PROGRESS',
      revisionsRequested: { increment: 1 },
      changeRequestMessage: message.trim()
    }
  });

  // Get client info for event
  const client = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { firstName: true, lastName: true }
  });

  // Create timeline event for changes requested
  if (client) {
    await createProjectEvent({
      projectId,
      eventType: PROJECT_EVENT_TYPES.CHANGES_REQUESTED,
      actorId: req.user!.id,
      actorName: `${client.firstName} ${client.lastName}`,
      metadata: {
        message: message.trim(),
        requestedAt: new Date(),
        revisionsRequested: project.revisionsRequested + 1,
        maxRevisionsAllowed: project.maxRevisionsAllowed,
        submissionId: project.submissions[0]?.id
      }
    });
  }

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

  // Send email to freelancer about changes requested
  try {
    if (project.freelancer && client) {
      await emailService.sendChangesRequestedFreelancerEmail({
        freelancer: { email: project.freelancer.email, firstName: project.freelancer.firstName },
        client: { firstName: client.firstName, lastName: client.lastName },
        project: { id: projectId, title: project.title },
        changeMessage: message.trim(),
        revisionsUsed: project.revisionsRequested + 1,
        maxRevisions: project.maxRevisionsAllowed
      });
    }
  } catch (error) {
    console.error('Error sending changes requested email:', error);
    // Don't fail the request if email fails
  }

  const revisionsRemaining = project.maxRevisionsAllowed - (project.revisionsRequested + 1);

  res.json({
    success: true,
    message: 'Change request sent to freelancer. Project status updated to in progress.',
    data: {
      revisionsRequested: project.revisionsRequested + 1,
      maxRevisionsAllowed: project.maxRevisionsAllowed,
      revisionsRemaining: Math.max(0, revisionsRemaining)
    }
  });
}));

// Get project timeline events
router.get('/:projectId/events', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const userId = req.user!.id;

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      applications: {
        where: {
          freelancerId: userId,
          status: 'ACCEPTED'
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check if user is client or assigned freelancer
  const isClient = project.clientId === userId;
  const isFreelancer = project.freelancerId === userId || project.applications.length > 0;

  if (!isClient && !isFreelancer) {
    throw new AppError('You do not have access to this project', 403);
  }

  // Fetch all events for this project
  const events = await getProjectEvents(projectId);

  res.json({
    success: true,
    data: { events }
  });
}));

export default router;