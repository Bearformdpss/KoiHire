import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { validate, serviceOrderSchema, serviceReviewSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';

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

  // Filter by status if provided
  if (status && status !== 'ALL') {
    where.status = status as string;
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
          category: true,
          skills: {
            include: {
              skill: true
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
          firstName: true,
          lastName: true
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

  const servicePackage = service.packages[0];
  if (!servicePackage) {
    throw new AppError('Service package not found', 404);
  }

  // Calculate delivery date
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + servicePackage.deliveryTime);

  // Create order
  const order = await prisma.serviceOrder.create({
    data: {
      serviceId,
      packageId,
      clientId: req.user!.id,
      freelancerId: service.freelancer.id,
      orderNumber: generateOrderNumber(),
      totalAmount: servicePackage.price,
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
      client: { select: { id: true, firstName: true, lastName: true } }
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
      client: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to deliver for this order', 403);
  }

  if (order.status !== 'IN_PROGRESS') {
    throw new AppError('Order must be in progress to submit delivery', 400);
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

  // Update order status
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date()
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
      freelancer: { select: { id: true, firstName: true, lastName: true } }
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
    data: { status: 'COMPLETED' }
  });

  // Update service metrics
  await prisma.service.update({
    where: { id: order.serviceId },
    data: {
      orders: { increment: 1 }
    }
  });

  // Send notification to freelancer
  try {
    await notificationService.sendServiceOrderNotification(
      order.freelancer.id,
      orderId,
      order.service.title,
      `${order.freelancer.firstName} ${order.freelancer.lastName}`,
      'SERVICE_ORDER_APPROVED'
    );
  } catch (error) {
    console.error('Error sending approval notification:', error);
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
      freelancer: { select: { id: true, firstName: true, lastName: true } }
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

  // Send notification to freelancer
  try {
    await notificationService.sendServiceReviewNotification(
      order.freelancerId,
      order.service.id,
      order.service.title,
      rating
    );
  } catch (error) {
    console.error('Error sending review notification:', error);
  }

  res.json({
    success: true,
    message: 'Review submitted successfully',
    data: { review }
  });
}));

export default router;