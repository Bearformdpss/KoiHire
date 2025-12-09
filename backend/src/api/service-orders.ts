import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { validate, serviceOrderSchema, serviceReviewSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { releaseServiceOrderPayment } from '../services/stripeService';
import { calculateServiceOrderPricing } from '../utils/pricing';
import { createServiceEvent, SERVICE_EVENT_TYPES, getServiceEvents } from '../services/eventService';

const router = express.Router();
const prisma = new PrismaClient();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SRV-${timestamp}-${random}`;
};

// Get user's service orders (role-based)
router.get('/', authMiddleware, requireRole(['CLIENT', 'FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
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

  const where: any = {};

  // Role-based filtering
  if (req.user!.role === 'CLIENT') {
    where.clientId = req.user!.id;
  } else if (req.user!.role === 'FREELANCER') {
    where.freelancerId = req.user!.id;
  }

  // Filter by status if provided (supports single or comma-separated values)
  if (status && status !== 'ALL') {
    const statuses = (status as string).split(',').map(s => s.trim());
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else {
      where.status = { in: statuses };
    }
  }

  // Search functionality
  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string, mode: 'insensitive' } },
      { service: { title: { contains: search as string, mode: 'insensitive' } } },
      { requirements: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: order },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            category: {
              select: {
                name: true
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
            }
          }
        },
        package: true,
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
        conversation: {
          select: {
            id: true
          }
        },
        deliverables: {
          orderBy: { submittedAt: 'desc' },
          take: 1
        },
        reviews: {
          where: { clientId: req.user!.id },
          take: 1
        }
      }
    }),
    prisma.serviceOrder.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Get specific order details
router.get('/:orderId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: {
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
              location: true
            }
          },
          category: true
        }
      },
      package: true,
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
          rating: true,
          location: true
        }
      },
      conversation: {
        select: {
          id: true
        }
      },
      deliverables: {
        orderBy: { submittedAt: 'desc' }
      },
      reviews: true,
      transactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check authorization
  if (order.clientId !== req.user!.id && order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Place order (clients only)
router.post('/:serviceId/order', authMiddleware, requireRole(['CLIENT']), validate(serviceOrderSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { serviceId } = req.params;
  const { packageId, requirements } = req.body;

  // Verify service exists and is active
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          stripeConnectAccountId: true,
          stripeOnboardingComplete: true,
          stripePayoutsEnabled: true
        }
      },
      packages: {
        where: { id: packageId }
      }
    }
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  if (!service.isActive) {
    throw new AppError('Service is not available', 400);
  }

  // Check if freelancer has Stripe Connect set up and verified
  if (!service.freelancer.stripeConnectAccountId || !service.freelancer.stripeOnboardingComplete || !service.freelancer.stripePayoutsEnabled) {
    throw new AppError(
      `This service is temporarily unavailable. ${service.freelancer.firstName} ${service.freelancer.lastName} has not completed payment setup yet.`,
      400
    );
  }

  const servicePackage = service.packages[0];
  if (!servicePackage) {
    throw new AppError('Service package not found', 404);
  }

  // Calculate delivery date
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + servicePackage.deliveryTime);

  // Calculate pricing with fees
  const pricing = calculateServiceOrderPricing(servicePackage.price);

  // Create order
  const order = await prisma.serviceOrder.create({
    data: {
      serviceId,
      packageId,
      clientId: req.user!.id,
      freelancerId: service.freelancer.id,
      orderNumber: generateOrderNumber(),
      packagePrice: pricing.packagePrice,
      buyerFee: pricing.buyerFee,
      sellerCommission: pricing.sellerCommission,
      totalAmount: pricing.totalCharged,
      requirements,
      deliveryDate,
      status: 'PENDING'
    },
    include: {
      service: {
        select: {
          title: true
        }
      },
      package: true,
      client: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  // Create conversation for the order
  const conversation = await prisma.conversation.create({
    data: {
      serviceOrderId: order.id,
      participants: {
        create: [
          { userId: order.clientId },
          { userId: order.freelancerId }
        ]
      }
    }
  });

  // Update order with conversation ID
  await prisma.serviceOrder.update({
    where: { id: order.id },
    data: { conversationId: conversation.id }
  });

  // Send notification to freelancer
  try {
    await notificationService.sendServiceOrderNotification(
      order.freelancerId,
      order.id,
      order.service.title,
      `${order.client.firstName} ${order.client.lastName}`,
      'SERVICE_ORDER_RECEIVED'
    );
  } catch (error) {
    console.error('Error sending order notification:', error);
  }

  // Send email notifications to both parties
  console.log('📧📧📧 ATTEMPTING TO SEND ORDER PLACEMENT EMAILS...');
  console.log('📧 Freelancer email:', order.freelancer.email);
  console.log('📧 Client email:', order.client.email);
  try {
    await emailService.sendOrderPlacedFreelancerEmail({
      order,
      freelancer: order.freelancer,
      client: order.client
    });
    console.log('📧 Freelancer email sent successfully');

    await emailService.sendOrderPlacedClientEmail({
      order,
      client: order.client,
      freelancer: order.freelancer
    });
    console.log('📧 Client email sent successfully');
  } catch (error) {
    console.error('❌ Error sending order placement emails:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order }
  });
}));

// Accept order (freelancer only)
router.post('/:orderId/accept', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: { select: { title: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      freelancer: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to accept this order', 403);
  }

  if (order.status !== 'PENDING') {
    throw new AppError('Order cannot be accepted in current status', 400);
  }

  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: 'ACCEPTED' }
  });

  // Create timeline event for order confirmation
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.ORDER_CONFIRMED,
    actorId: req.user!.id,
    actorName: `${order.freelancer.firstName} ${order.freelancer.lastName}`,
    metadata: {
      serviceTitle: order.service.title,
      totalAmount: order.totalAmount,
      packagePrice: order.packagePrice
    }
  });

  // Send notification to client
  try {
    await notificationService.sendServiceOrderNotification(
      order.client.id,
      orderId,
      order.service.title,
      `${order.client.firstName} ${order.client.lastName}`,
      'SERVICE_ORDER_ACCEPTED'
    );
  } catch (error) {
    console.error('Error sending order acceptance notification:', error);
  }

  // Send email to client about order acceptance
  try {
    // Get client email
    const clientDetails = await prisma.user.findUnique({
      where: { id: order.client.id },
      select: { email: true, firstName: true }
    });

    if (clientDetails) {
      // Calculate expected delivery date
      const servicePackage = await prisma.servicePackage.findFirst({
        where: { id: order.packageId }
      });

      const expectedDeliveryDate = order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : servicePackage
          ? new Date(Date.now() + servicePackage.deliveryTime * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : 'To be determined';

      await emailService.sendServiceOrderAcceptedClientEmail({
        client: { email: clientDetails.email, firstName: clientDetails.firstName },
        freelancer: { firstName: order.freelancer.firstName, lastName: order.freelancer.lastName },
        order: { id: orderId, orderNumber: order.orderNumber },
        service: { title: order.service.title },
        expectedDeliveryDate
      });
    }
  } catch (error) {
    console.error('Error sending order accepted email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: { status: updatedOrder.status }
  });
}));

// Start work on order (freelancer only)
router.post('/:orderId/start', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to start this order', 403);
  }

  if (order.status !== 'ACCEPTED') {
    throw new AppError('Order must be accepted before starting work', 400);
  }

  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: 'IN_PROGRESS' }
  });

  res.json({
    success: true,
    message: 'Work started successfully',
    data: { status: updatedOrder.status }
  });
}));

// Submit delivery (freelancer only)
router.post('/:orderId/deliver', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const { title, description, files } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: { select: { title: true } },
      package: { select: { revisions: true } },
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to deliver for this order', 403);
  }

  if (order.status !== 'IN_PROGRESS' && order.status !== 'REVISION_REQUESTED') {
    throw new AppError('Order must be in progress or revision requested to submit delivery', 400);
  }

  // Create deliverable
  const deliverable = await prisma.orderDeliverable.create({
    data: {
      orderId,
      title,
      description,
      files: files || []
    }
  });

  // Create ServiceOrderFile records for each deliverable file
  if (files && files.length > 0) {
    try {
      await Promise.all(
        files.map((fileUrl: string) => {
          // Extract filename from S3 URL
          const fileName = fileUrl.split('/').pop() || 'file';

          return prisma.serviceOrderFile.create({
            data: {
              orderId,
              fileName,
              originalName: fileName,
              fileSize: 0, // Size not available from deliverable
              mimeType: 'application/octet-stream', // Type not available from deliverable
              filePath: fileUrl,
              uploadedById: req.user!.id
            }
          });
        })
      );
    } catch (error) {
      console.error('Error creating ServiceOrderFile records for deliverable:', error);
      // Don't fail the whole delivery if this fails
    }
  }

  // Update order status
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date()
    },
    include: {
      service: { select: { title: true } },
      package: { select: { revisions: true } }
    }
  });

  // Create timeline event for delivery
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.DELIVERY_MADE,
    actorId: req.user!.id,
    actorName: `${order.freelancer.firstName} ${order.freelancer.lastName}`,
    metadata: {
      deliverableId: deliverable.id,
      deliveryTitle: title,
      deliveryDescription: description,
      filesCount: files?.length || 0
    }
  });

  // Send notification to client
  try {
    await notificationService.sendServiceOrderNotification(
      order.client.id,
      orderId,
      order.service.title,
      `${order.client.firstName} ${order.client.lastName}`,
      'SERVICE_ORDER_DELIVERED'
    );
  } catch (error) {
    console.error('Error sending delivery notification:', error);
  }

  // Send email notification to client
  try {
    await emailService.sendOrderDeliveredClientEmail({
      order: updatedOrder,
      client: order.client,
      freelancer: order.freelancer,
      deliverable
    });
  } catch (error) {
    console.error('Error sending delivery email:', error);
  }

  res.json({
    success: true,
    message: 'Delivery submitted successfully',
    data: {
      order: updatedOrder,
      deliverable
    }
  });
}));

// Approve delivery (client only)
router.post('/:orderId/approve', authMiddleware, requireRole(['CLIENT']), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: { select: { title: true } },
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      },
      freelancer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.clientId !== req.user!.id) {
    throw new AppError('Not authorized to approve this order', 403);
  }

  if (order.status !== 'DELIVERED') {
    throw new AppError('Order must be delivered to approve', 400);
  }

  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: 'COMPLETED' },
    include: {
      service: { select: { title: true } }
    }
  });

  // Update service metrics
  await prisma.service.update({
    where: { id: order.serviceId },
    data: {
      orders: { increment: 1 }
    }
  });

  // Create timeline event for order completion (before payment release)
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.ORDER_COMPLETED,
    actorId: req.user!.id,
    actorName: `${order.client.firstName} ${order.client.lastName}`,
    metadata: {
      serviceTitle: order.service.title,
      totalAmount: order.totalAmount,
      packagePrice: order.packagePrice
    }
  });

  // Release payment to freelancer
  try {
    console.log(`🔄 Releasing payment for order ${orderId}...`);
    await releaseServiceOrderPayment(orderId);
    console.log(`✅ Payment released successfully for order ${orderId}`);
  } catch (error: any) {
    console.error(`❌ Error releasing payment for order ${orderId}:`, error);
    // Rollback order status if payment fails
    await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' }
    });
    throw new AppError(`Failed to release payment: ${error.message}`, 500);
  }

  // Send notifications to freelancer (approved + completed)
  try {
    await notificationService.sendServiceOrderNotification(
      order.freelancer.id,
      orderId,
      order.service.title,
      `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      'SERVICE_ORDER_APPROVED'
    );

    await notificationService.sendServiceOrderNotification(
      order.freelancer.id,
      orderId,
      order.service.title,
      `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      'SERVICE_ORDER_COMPLETED'
    );
  } catch (error) {
    console.error('Error sending approval notification:', error);
  }

  // Send email notification to freelancer (payment released)
  try {
    await emailService.sendOrderCompletedFreelancerEmail({
      order: updatedOrder,
      freelancer: order.freelancer,
      client: order.client
    });
  } catch (error) {
    console.error('Error sending completion email:', error);
  }

  res.json({
    success: true,
    message: 'Order approved and completed successfully',
    data: { status: updatedOrder.status }
  });
}));

// Request revision (client only)
router.post('/:orderId/revision', authMiddleware, requireRole(['CLIENT']), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const { revisionNote } = req.body;

  if (!revisionNote || revisionNote.trim().length === 0) {
    throw new AppError('Revision note is required', 400);
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      package: true,
      service: { select: { title: true } },
      freelancer: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.clientId !== req.user!.id) {
    throw new AppError('Not authorized to request revision for this order', 403);
  }

  if (order.status !== 'DELIVERED') {
    throw new AppError('Order must be delivered to request revision', 400);
  }

  if (order.revisionsUsed >= order.package.revisions) {
    throw new AppError('No more revisions available for this order', 400);
  }

  // Update order status and revision count
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: 'REVISION_REQUESTED',
      revisionsUsed: { increment: 1 }
    }
  });

  // Update latest deliverable with revision note
  await prisma.orderDeliverable.updateMany({
    where: { orderId },
    data: {
      status: 'REVISION_REQUESTED',
      revisionNote: revisionNote.trim()
    }
  });

  // Create timeline event for revision request
  await createServiceEvent({
    serviceOrderId: orderId,
    eventType: SERVICE_EVENT_TYPES.REVISION_REQUESTED,
    actorId: req.user!.id,
    actorName: `${order.client.firstName} ${order.client.lastName}`,
    metadata: {
      revisionNote: revisionNote.trim(),
      revisionNumber: updatedOrder.revisionsUsed,
      revisionsRemaining: order.package.revisions - updatedOrder.revisionsUsed
    }
  });

  // Send notification to freelancer
  try {
    await notificationService.sendServiceOrderNotification(
      order.freelancer.id,
      orderId,
      order.service.title,
      `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      'SERVICE_ORDER_REVISION_REQUESTED'
    );
  } catch (error) {
    console.error('Error sending revision notification:', error);
  }

  // Send email to freelancer about revision request
  try {
    const freelancerDetails = await prisma.user.findUnique({
      where: { id: order.freelancer.id },
      select: { email: true, firstName: true }
    });

    if (freelancerDetails) {
      await emailService.sendRevisionRequestedFreelancerEmail({
        freelancer: { email: freelancerDetails.email, firstName: freelancerDetails.firstName },
        client: { firstName: order.client.firstName, lastName: order.client.lastName },
        order: { id: orderId, orderNumber: order.orderNumber },
        service: { title: order.service.title },
        revisionNote: revisionNote.trim(),
        revisionsUsed: updatedOrder.revisionsUsed,
        maxRevisions: order.package.revisions
      });
    }
  } catch (error) {
    console.error('Error sending revision requested email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Revision requested successfully',
    data: {
      status: updatedOrder.status,
      revisionsUsed: updatedOrder.revisionsUsed,
      revisionsRemaining: order.package.revisions - updatedOrder.revisionsUsed
    }
  });
}));

// Cancel order
router.post('/:orderId/cancel', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: { select: { title: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      freelancer: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Only client or freelancer can cancel their own orders
  if (order.clientId !== req.user!.id && order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to cancel this order', 403);
  }

  // Orders can only be cancelled in certain statuses
  if (!['PENDING', 'ACCEPTED'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled in current status', 400);
  }

  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' }
  });

  // Send notification to the other party
  const notifyUserId = order.clientId === req.user!.id ? order.freelancerId : order.clientId;
  try {
    await notificationService.sendServiceOrderNotification(
      notifyUserId,
      orderId,
      order.service.title,
      order.clientId === req.user!.id ? `${order.client.firstName} ${order.client.lastName}` : `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      'SERVICE_ORDER_CANCELLED'
    );
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }

  // Send email to the other party about order cancellation
  try {
    const isCancelledByClient = order.clientId === req.user!.id;
    const recipientId = isCancelledByClient ? order.freelancerId : order.clientId;

    const recipientDetails = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, firstName: true }
    });

    if (recipientDetails) {
      await emailService.sendOrderCancelledEmail({
        recipient: {
          email: recipientDetails.email,
          firstName: recipientDetails.firstName,
          role: isCancelledByClient ? 'FREELANCER' : 'CLIENT'
        },
        cancelledBy: {
          firstName: isCancelledByClient ? order.client.firstName : order.freelancer.firstName,
          lastName: isCancelledByClient ? order.client.lastName : order.freelancer.lastName,
          role: isCancelledByClient ? 'CLIENT' : 'FREELANCER'
        },
        order: { orderNumber: order.orderNumber },
        service: { title: order.service.title },
        reason
      });
    }
  } catch (error) {
    console.error('Error sending order cancelled email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { status: updatedOrder.status }
  });
}));

// Submit review for completed order (client only)
router.post('/:orderId/review', authMiddleware, requireRole(['CLIENT']), validate(serviceReviewSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const {
    rating,
    comment,
    communication,
    quality,
    delivery,
    value
  } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      service: { select: { id: true, title: true } },
      reviews: { where: { clientId: req.user!.id } }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.clientId !== req.user!.id) {
    throw new AppError('Not authorized to review this order', 403);
  }

  if (order.status !== 'COMPLETED') {
    throw new AppError('Order must be completed to submit review', 400);
  }

  if (order.reviews.length > 0) {
    throw new AppError('Review already submitted for this order', 400);
  }

  // Create review
  const review = await prisma.serviceReview.create({
    data: {
      serviceId: order.serviceId,
      orderId,
      clientId: req.user!.id,
      freelancerId: order.freelancerId,
      rating,
      comment,
      communication,
      quality,
      delivery,
      value
    }
  });

  // Update service rating
  const serviceReviews = await prisma.serviceReview.findMany({
    where: { serviceId: order.serviceId },
    select: { rating: true }
  });

  const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;

  await prisma.service.update({
    where: { id: order.serviceId },
    data: { rating: avgRating }
  });

  // Send email to freelancer about new review
  try {
    const freelancerDetails = await prisma.user.findUnique({
      where: { id: order.freelancerId },
      select: { email: true, firstName: true }
    });

    const clientDetails = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { firstName: true, lastName: true }
    });

    if (freelancerDetails && clientDetails) {
      await emailService.sendServiceReviewReceivedFreelancerEmail({
        freelancer: { email: freelancerDetails.email, firstName: freelancerDetails.firstName },
        client: { firstName: clientDetails.firstName, lastName: clientDetails.lastName },
        service: { title: order.service.title },
        review: { rating, comment }
      });
    }
  } catch (error) {
    console.error('Error sending review received email:', error);
    // Don't fail the request if email fails
  }

  res.json({
    success: true,
    message: 'Review submitted successfully',
    data: { review }
  });
}));

// Get service order timeline events
router.get('/:orderId/events', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const userId = req.user!.id;

  // Verify order exists and user has access
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user is client or freelancer on this order
  if (order.clientId !== userId && order.freelancerId !== userId) {
    throw new AppError('Not authorized to view this order', 403);
  }

  // Fetch all events for this order
  const events = await getServiceEvents(orderId);

  res.json({
    success: true,
    data: { events }
  });
}));

export default router;