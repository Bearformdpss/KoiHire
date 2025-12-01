import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { addDays, differenceInHours, isAfter } from 'date-fns';

const router = express.Router();
const prisma = new PrismaClient();

interface ActionItem {
  id: string;
  type: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  title: string;
  message: string;
  link: string;
  metadata: {
    count?: number;
    dueDate?: string;
    clientName?: string;
    freelancerName?: string;
    orderNumber?: string;
    projectId?: string;
    orderId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Helper function to calculate order priority based on deadline
function calculateOrderPriority(createdAt: Date, deliveryTime: number, deliveredAt?: Date | null): 'URGENT' | 'HIGH' | 'NORMAL' {
  const startDate = deliveredAt || createdAt;
  const dueDate = addDays(startDate, deliveryTime);
  const now = new Date();
  const hoursUntilDue = differenceInHours(dueDate, now);

  if (hoursUntilDue < 0) return 'URGENT'; // Overdue
  if (hoursUntilDue <= 24) return 'HIGH';  // Due within 24h
  return 'NORMAL';
}

// Helper function to check if payment is urgent (>24h pending)
function isPaymentUrgent(createdAt: Date): boolean {
  return differenceInHours(new Date(), createdAt) > 24;
}

// GET /api/actions - Get all action-required items for authenticated user
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  console.log('[Actions API] Request received');
  console.log('[Actions API] User ID:', userId);
  console.log('[Actions API] User Role:', userRole);

  const actions: ActionItem[] = [];

  if (userRole === 'CLIENT') {
    // CLIENT ACTIONS
    console.log('[Actions API] Processing CLIENT actions');

    // 1. Projects with new applications (OPEN status)
    const projectsWithApplications = await prisma.project.findMany({
      where: {
        clientId: userId,
        status: 'OPEN',
        applications: { some: {} }
      },
      include: {
        _count: { select: { applications: true } }
      }
    });

    for (const project of projectsWithApplications) {
      actions.push({
        id: project.id,
        type: 'PROJECT_APPLICATION',
        priority: 'HIGH',
        title: project.title,
        message: `Review ${project._count.applications} ${project._count.applications === 1 ? 'application' : 'applications'}`,
        link: `/projects/${project.id}/applications`,
        metadata: {
          count: project._count.applications,
          projectId: project.id
        },
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      });
    }

    // 2. Projects needing escrow funding (IN_PROGRESS, escrow not FUNDED)
    const projectsNeedingEscrow = await prisma.project.findMany({
      where: {
        clientId: userId,
        status: 'IN_PROGRESS',
        escrow: {
          status: { not: 'FUNDED' }
        }
      },
      include: {
        escrow: true,
        freelancer: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    for (const project of projectsNeedingEscrow) {
      const freelancerName = project.freelancer
        ? `${project.freelancer.firstName} ${project.freelancer.lastName}`
        : 'freelancer';

      actions.push({
        id: project.id,
        type: 'PROJECT_ESCROW',
        priority: 'URGENT',
        title: project.title,
        message: `Fund escrow to start work with ${freelancerName}`,
        link: `/projects/${project.id}`,
        metadata: {
          projectId: project.id,
          freelancerName
        },
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      });
    }

    // 3. Projects awaiting review (PENDING_REVIEW status)
    const projectsPendingReview = await prisma.project.findMany({
      where: {
        clientId: userId,
        status: 'PENDING_REVIEW'
      },
      include: {
        freelancer: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    for (const project of projectsPendingReview) {
      const freelancerName = project.freelancer
        ? `${project.freelancer.firstName} ${project.freelancer.lastName}`
        : 'freelancer';

      actions.push({
        id: project.id,
        type: 'PROJECT_REVIEW',
        priority: 'HIGH',
        title: project.title,
        message: `Review deliverable from ${freelancerName}`,
        link: `/projects/${project.id}`,
        metadata: {
          projectId: project.id,
          freelancerName
        },
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      });
    }

    // 4. Service orders needing payment (paymentStatus !== PAID, regardless of status)
    console.log('[Actions API] Checking for orders needing payment...');
    const ordersNeedingPayment = await prisma.serviceOrder.findMany({
      where: {
        clientId: userId,
        paymentStatus: { not: 'PAID' },
        status: { in: ['PENDING', 'ACCEPTED'] }
      },
      include: {
        service: { select: { title: true } },
        freelancer: { select: { firstName: true, lastName: true } },
        package: { select: { tier: true } }
      }
    });
    console.log('[Actions API] Orders needing payment found:', ordersNeedingPayment.length);
    console.log('[Actions API] Orders:', JSON.stringify(ordersNeedingPayment, null, 2));

    for (const order of ordersNeedingPayment) {
      const isUrgent = isPaymentUrgent(order.createdAt);
      const freelancerName = `${order.freelancer.firstName} ${order.freelancer.lastName}`;

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_PAYMENT',
        priority: isUrgent ? 'URGENT' : 'HIGH',
        title: `${order.service.title} - ${order.package.tier}`,
        message: isUrgent ? 'Payment overdue - Complete payment now' : 'Complete payment to start order',
        link: `/orders/${order.id}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          freelancerName
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

    // 5. Service orders delivered (DELIVERED status)
    const ordersToReview = await prisma.serviceOrder.findMany({
      where: {
        clientId: userId,
        status: 'DELIVERED'
      },
      include: {
        service: { select: { title: true } },
        freelancer: { select: { firstName: true, lastName: true } },
        package: { select: { tier: true } }
      }
    });

    for (const order of ordersToReview) {
      const freelancerName = `${order.freelancer.firstName} ${order.freelancer.lastName}`;

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_REVIEW',
        priority: 'HIGH',
        title: `${order.service.title} - ${order.package.tier}`,
        message: `Review deliverable from ${freelancerName}`,
        link: `/orders/${order.id}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          freelancerName
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

  } else if (userRole === 'FREELANCER') {
    // FREELANCER ACTIONS

    // 1. Service orders to accept (PENDING, payment already PAID)
    const ordersToAccept = await prisma.serviceOrder.findMany({
      where: {
        freelancerId: userId,
        status: 'PENDING',
        paymentStatus: 'PAID'
      },
      include: {
        service: { select: { title: true } },
        client: { select: { firstName: true, lastName: true } },
        package: { select: { tier: true } }
      }
    });

    for (const order of ordersToAccept) {
      const clientName = `${order.client.firstName} ${order.client.lastName}`;

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_ACCEPT',
        priority: 'HIGH',
        title: `${order.service.title} - ${order.package.tier}`,
        message: `New order from ${clientName}`,
        link: `/freelancer/orders`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

    // 2. Orders to start (ACCEPTED status)
    const ordersToStart = await prisma.serviceOrder.findMany({
      where: {
        freelancerId: userId,
        status: 'ACCEPTED'
      },
      include: {
        service: { select: { title: true } },
        client: { select: { firstName: true, lastName: true } },
        package: { select: { tier: true } }
      }
    });

    for (const order of ordersToStart) {
      const clientName = `${order.client.firstName} ${order.client.lastName}`;

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_START',
        priority: 'NORMAL',
        title: `${order.service.title} - ${order.package.tier}`,
        message: `Start work for ${clientName}`,
        link: `/freelancer/orders`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

    // 3. Orders in progress (to deliver)
    const ordersInProgress = await prisma.serviceOrder.findMany({
      where: {
        freelancerId: userId,
        status: 'IN_PROGRESS'
      },
      include: {
        service: { select: { title: true } },
        client: { select: { firstName: true, lastName: true } },
        package: { select: { deliveryTime: true, tier: true } }
      }
    });

    for (const order of ordersInProgress) {
      const priority = calculateOrderPriority(order.createdAt, order.package.deliveryTime, order.deliveredAt);
      const dueDate = addDays(order.deliveredAt || order.createdAt, order.package.deliveryTime);
      const hoursUntilDue = differenceInHours(dueDate, new Date());
      const clientName = `${order.client.firstName} ${order.client.lastName}`;

      let message = '';
      if (hoursUntilDue < 0) {
        message = `Overdue by ${Math.abs(Math.floor(hoursUntilDue / 24))} ${Math.abs(Math.floor(hoursUntilDue / 24)) === 1 ? 'day' : 'days'}`;
      } else if (hoursUntilDue <= 24) {
        message = `Due in ${hoursUntilDue} hours`;
      } else {
        message = `Due in ${Math.floor(hoursUntilDue / 24)} days`;
      }

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_DELIVER',
        priority,
        title: `${order.service.title} - ${order.package.tier}`,
        message,
        link: `/freelancer/orders`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName,
          dueDate: dueDate.toISOString()
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

    // 4. Revision requests (REVISION_REQUESTED status)
    const revisionsNeeded = await prisma.serviceOrder.findMany({
      where: {
        freelancerId: userId,
        status: 'REVISION_REQUESTED'
      },
      include: {
        service: { select: { title: true } },
        client: { select: { firstName: true, lastName: true } },
        package: { select: { tier: true } },
        deliverables: {
          where: { status: 'REVISION_REQUESTED' },
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { revisionNote: true }
        }
      }
    });

    for (const order of revisionsNeeded) {
      const clientName = `${order.client.firstName} ${order.client.lastName}`;

      actions.push({
        id: order.id,
        type: 'SERVICE_ORDER_REVISION',
        priority: 'HIGH',
        title: `${order.service.title} - ${order.package.tier}`,
        message: `Revision requested by ${clientName}`,
        link: `/freelancer/orders`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          clientName
        },
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      });
    }

    // 5. Projects with change requests
    const projectChanges = await prisma.project.findMany({
      where: {
        freelancerId: userId,
        status: 'IN_PROGRESS',
        changeRequestMessage: { not: null }
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            eventType: true,
            createdAt: true
          }
        }
      }
    });

    for (const project of projectChanges) {
      // Find the most recent CHANGES_REQUESTED event
      const latestChangeRequest = project.events.find(event => event.eventType === 'CHANGES_REQUESTED');

      // Check if there's a WORK_SUBMITTED event after the change request
      if (latestChangeRequest) {
        const workSubmittedAfterChange = project.events.find(event =>
          event.eventType === 'WORK_SUBMITTED' &&
          event.createdAt > latestChangeRequest.createdAt
        );

        // Only show action if changes haven't been addressed yet
        if (!workSubmittedAfterChange) {
          const clientName = `${project.client.firstName} ${project.client.lastName}`;

          actions.push({
            id: project.id,
            type: 'PROJECT_CHANGES',
            priority: 'HIGH',
            title: project.title,
            message: `Changes requested by ${clientName}`,
            link: `/projects/${project.id}/workspace`,
            metadata: {
              projectId: project.id,
              clientName
            },
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString()
          });
        }
      }
    }
  }

  // Sort actions by priority (URGENT > HIGH > NORMAL) and then by most recent
  const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'NORMAL': 2 };
  actions.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  console.log('[Actions API] Total actions found:', actions.length);
  console.log('[Actions API] Returning response:', { totalCount: actions.length, actionsCount: actions.length });

  res.json({
    totalCount: actions.length,
    actions
  });
}));

export default router;
