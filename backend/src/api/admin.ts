import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import {
  releaseProjectEscrowPayment,
  refundProjectEscrowPayment,
  releaseServiceOrderPayment,
  refundServiceOrderPayment
} from '../services/stripeService';

const router = express.Router();
const prisma = new PrismaClient();

// Apply admin middleware to all routes
router.use(requireAdmin);

// ==================== DASHBOARD STATS ====================

router.get('/dashboard/stats', asyncHandler(async (req: AuthRequest, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenue calculations (platform fees)
  const [revenueToday, revenueWeek, revenueMonth, revenueTotal] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        createdAt: { gte: today }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        createdAt: { gte: thisWeek }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        createdAt: { gte: thisMonth }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        type: 'FEE',
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    })
  ]);

  // Escrow stats
  const [escrowsPending, escrowsFunded, escrowsTotal] = await Promise.all([
    prisma.escrow.count({ where: { status: 'PENDING' } }),
    prisma.escrow.count({ where: { status: 'FUNDED' } }),
    prisma.escrow.count()
  ]);

  // Get total amount in funded escrows
  const fundedEscrowsAmount = await prisma.escrow.aggregate({
    where: { status: 'FUNDED' },
    _sum: { amount: true }
  });

  // Project stats
  const [projectsOpen, projectsInProgress, projectsCompleted, projectsTotal] = await Promise.all([
    prisma.project.count({ where: { status: 'OPEN' } }),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count()
  ]);

  // User stats
  const [totalUsers, clientsCount, freelancersCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'FREELANCER' } })
  ]);

  // Service order stats
  const [serviceOrdersPending, serviceOrdersInProgress, serviceOrdersCompleted] = await Promise.all([
    prisma.serviceOrder.count({ where: { status: 'PENDING' } }),
    prisma.serviceOrder.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.serviceOrder.count({ where: { status: 'COMPLETED' } })
  ]);

  // Recent transactions (last 10)
  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true
        }
      },
      escrow: {
        select: {
          id: true,
          projectId: true,
          project: {
            select: {
              title: true
            }
          }
        }
      },
      serviceOrder: {
        select: {
          id: true,
          orderNumber: true,
          service: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  // Pending payouts (funded escrows where work is completed and ready to be released)
  const pendingPayouts = await prisma.escrow.findMany({
    where: {
      status: 'FUNDED',
      project: {
        status: {
          in: ['COMPLETED', 'PENDING_REVIEW']
        }
      }
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          freelancer: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      }
    }
  });

  // Failed payments
  const failedPayments = await prisma.transaction.count({
    where: { status: 'FAILED' }
  });

  res.json({
    success: true,
    data: {
      revenue: {
        today: revenueToday._sum.amount || 0,
        week: revenueWeek._sum.amount || 0,
        month: revenueMonth._sum.amount || 0,
        total: revenueTotal._sum.amount || 0
      },
      escrows: {
        pending: escrowsPending,
        funded: escrowsFunded,
        total: escrowsTotal,
        fundedAmount: fundedEscrowsAmount._sum.amount || 0
      },
      projects: {
        open: projectsOpen,
        inProgress: projectsInProgress,
        completed: projectsCompleted,
        total: projectsTotal
      },
      serviceOrders: {
        pending: serviceOrdersPending,
        inProgress: serviceOrdersInProgress,
        completed: serviceOrdersCompleted
      },
      users: {
        total: totalUsers,
        clients: clientsCount,
        freelancers: freelancersCount
      },
      recentTransactions,
      pendingPayouts,
      alerts: {
        failedPayments,
        pendingPayoutsCount: pendingPayouts.length
      }
    }
  });
}));

// ==================== TRANSACTIONS ====================

router.get('/transactions', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    type,
    status,
    userId,
    search
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (type) where.type = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;

  // Search by user email or username
  if (search) {
    where.user = {
      OR: [
        { email: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } }
      ]
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true
          }
        },
        escrow: {
          select: {
            id: true,
            projectId: true,
            status: true,
            project: {
              select: {
                title: true
              }
            }
          }
        },
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            service: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// ==================== ESCROWS ====================

router.get('/escrows', asyncHandler(async (req: AuthRequest, res) => {
  const { status, projectId, page = '1', limit = '20' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const [escrows, total] = await Promise.all([
    prisma.escrow.findMany({
      where,
      skip,
      take,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            client: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            freelancer: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.escrow.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      escrows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// ==================== PROJECTS ====================

router.get('/projects', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    status,
    search,
    hasEscrow
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  if (hasEscrow === 'true') {
    where.escrow = { isNot: null };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      include: {
        client: {
          select: {
            id: true,
            username: true,
            email: true,
            rating: true
          }
        },
        freelancer: {
          select: {
            id: true,
            username: true,
            email: true,
            rating: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        escrow: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
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
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

router.get('/projects/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          username: true,
          email: true,
          rating: true,
          totalSpent: true
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          email: true,
          rating: true,
          totalEarnings: true
        }
      },
      category: true,
      escrow: {
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      },
      applications: {
        include: {
          freelancer: {
            select: {
              id: true,
              username: true,
              email: true,
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      conversations: {
        include: {
          messages: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({
    success: true,
    data: { project }
  });
}));

// ==================== USERS ====================

router.get('/users', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    role,
    search,
    isVerified
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (role) where.role = role;
  if (isVerified !== undefined) where.isVerified = isVerified === 'true';

  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { username: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isAvailable: true,
        rating: true,
        totalEarnings: true,
        totalSpent: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            clientProjects: true,
            freelancerProjects: true,
            freelancerServices: true,
            clientServiceOrders: true,
            freelancerServiceOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

router.get('/users/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientProjects: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          freelancer: {
            select: {
              username: true,
              email: true
            }
          }
        }
      },
      freelancerProjects: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          client: {
            select: {
              username: true,
              email: true
            }
          }
        }
      },
      freelancerServices: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          clientProjects: true,
          freelancerProjects: true,
          freelancerServices: true,
          clientServiceOrders: true,
          freelancerServiceOrders: true
        }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove sensitive data
  const { password, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: { user: userWithoutPassword }
  });
}));

// ==================== SERVICE ORDERS ====================

router.get('/service-orders', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    status,
    paymentStatus,
    search
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string, mode: 'insensitive' } },
      { service: { title: { contains: search as string, mode: 'insensitive' } } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      skip,
      take,
      include: {
        service: {
          select: {
            id: true,
            title: true
          }
        },
        client: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        freelancer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        package: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
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

router.get('/service-orders/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          description: true
        }
      },
      package: true,
      client: {
        select: {
          id: true,
          username: true,
          email: true,
          rating: true,
          totalSpent: true
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          email: true,
          rating: true,
          totalEarnings: true
        }
      },
      transactions: {
        orderBy: { createdAt: 'desc' }
      },
      deliverables: {
        orderBy: { createdAt: 'desc' }
      },
      conversation: {
        include: {
          messages: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// ==================== ADMIN ACTIONS ====================

// Release escrow
router.post('/escrow/:id/release', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const escrow = await prisma.escrow.findUnique({
    where: { id },
    include: {
      project: true
    }
  });

  if (!escrow) {
    throw new AppError('Escrow not found', 404);
  }

  if (escrow.status !== 'FUNDED') {
    throw new AppError('Escrow must be funded to release', 400);
  }

  await releaseProjectEscrowPayment(escrow.projectId);

  // Log admin action
  console.log(`[ADMIN ACTION] User ${req.user!.email} released escrow ${id} for project ${escrow.projectId}. Reason: ${reason || 'N/A'}`);

  res.json({
    success: true,
    message: 'Escrow released successfully'
  });
}));

// Refund escrow
router.post('/escrow/:id/refund', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Refund reason is required', 400);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { id },
    include: {
      project: true
    }
  });

  if (!escrow) {
    throw new AppError('Escrow not found', 404);
  }

  if (escrow.status !== 'FUNDED') {
    throw new AppError('Escrow must be funded to refund', 400);
  }

  await refundProjectEscrowPayment(escrow.projectId, reason);

  // Log admin action
  console.log(`[ADMIN ACTION] User ${req.user!.email} refunded escrow ${id} for project ${escrow.projectId}. Reason: ${reason}`);

  res.json({
    success: true,
    message: 'Escrow refunded successfully'
  });
}));

// Update project status
router.put('/projects/:id/status', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatuses = ['OPEN', 'PAUSED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      status,
      ...(reason && { cancelReason: reason })
    }
  });

  // Log admin action
  console.log(`[ADMIN ACTION] User ${req.user!.email} updated project ${id} status to ${status}. Reason: ${reason || 'N/A'}`);

  res.json({
    success: true,
    data: { project }
  });
}));

// Update user status
router.put('/users/:id/status', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { isVerified, isAvailable } = req.body;

  const updateData: any = {};
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      isVerified: true,
      isAvailable: true
    }
  });

  // Log admin action
  console.log(`[ADMIN ACTION] User ${req.user!.email} updated user ${id} status. Changes: ${JSON.stringify(updateData)}`);

  res.json({
    success: true,
    data: { user }
  });
}));

// Release service order payment
router.post('/service-orders/:id/release', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.serviceOrder.findUnique({
    where: { id }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  if (order.paymentStatus !== 'PAID') {
    throw new AppError('Order payment must be in PAID status', 400);
  }

  await releaseServiceOrderPayment(id);

  // Log admin action
  console.log(`[ADMIN ACTION] User ${req.user!.email} released payment for service order ${id}. Reason: ${reason || 'N/A'}`);

  res.json({
    success: true,
    message: 'Service order payment released successfully'
  });
}));

// Refund service order
router.post('/service-orders/:id/refund', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Refund reason is required', 400);
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  if (order.paymentStatus !== 'PAID') {
    throw new AppError('Can only refund orders in PAID status', 400);
  }

  await refundServiceOrderPayment(id, reason);

  // Log admin action
  await logAdminAction(req, 'REFUND_SERVICE_ORDER', 'ServiceOrder', id, { reason });

  res.json({
    success: true,
    message: 'Service order refunded successfully'
  });
}));

// ==================== PAYOUTS MANAGEMENT ====================

// Get all payouts with filtering
router.get('/payouts', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    status,
    payoutMethod,
    search
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (status) where.status = status;
  if (payoutMethod) where.payoutMethod = payoutMethod;

  if (search) {
    where.OR = [
      { user: { email: { contains: search as string, mode: 'insensitive' } } },
      { user: { username: { contains: search as string, mode: 'insensitive' } } },
      { payoutEmail: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            payoutMethod: true,
            paypalEmail: true,
            payoneerEmail: true,
            stripeConnectAccountId: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            projectNumber: true
          }
        },
        serviceOrder: {
          select: {
            id: true,
            orderNumber: true,
            service: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payout.count({ where })
  ]);

  // Get summary stats
  const [pendingCount, pendingTotal, processingCount, completedToday] = await Promise.all([
    prisma.payout.count({ where: { status: 'PENDING', payoutMethod: { in: ['PAYPAL', 'PAYONEER'] } } }),
    prisma.payout.aggregate({
      where: { status: 'PENDING', payoutMethod: { in: ['PAYPAL', 'PAYONEER'] } },
      _sum: { amount: true }
    }),
    prisma.payout.count({ where: { status: 'PROCESSING' } }),
    prisma.payout.count({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      payouts,
      summary: {
        pendingCount,
        pendingTotal: pendingTotal._sum.amount || 0,
        processingCount,
        completedToday
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Mark payout as processing
router.put('/payouts/:id/process', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: { user: { select: { email: true, username: true } } }
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'PENDING') {
    throw new AppError('Only pending payouts can be marked as processing', 400);
  }

  const updatedPayout = await prisma.payout.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      processedAt: new Date(),
      adminNotes: adminNotes || payout.adminNotes
    }
  });

  await logAdminAction(req, 'PROCESS_PAYOUT', 'Payout', id, {
    amount: payout.amount,
    payoutMethod: payout.payoutMethod,
    payoutEmail: payout.payoutEmail,
    adminNotes
  });

  res.json({
    success: true,
    message: 'Payout marked as processing',
    data: { payout: updatedPayout }
  });
}));

// Mark payout as completed
router.put('/payouts/:id/complete', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { externalReference, adminNotes } = req.body;

  const payout = await prisma.payout.findUnique({
    where: { id },
    include: { user: { select: { email: true, username: true } } }
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
    throw new AppError('Only pending or processing payouts can be completed', 400);
  }

  const updatedPayout = await prisma.payout.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      externalReference: externalReference || payout.externalReference,
      adminNotes: adminNotes || payout.adminNotes
    }
  });

  await logAdminAction(req, 'COMPLETE_PAYOUT', 'Payout', id, {
    amount: payout.amount,
    payoutMethod: payout.payoutMethod,
    externalReference,
    adminNotes
  });

  res.json({
    success: true,
    message: 'Payout marked as completed',
    data: { payout: updatedPayout }
  });
}));

// Mark payout as failed
router.put('/payouts/:id/fail', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { failureReason, adminNotes } = req.body;

  if (!failureReason) {
    throw new AppError('Failure reason is required', 400);
  }

  const payout = await prisma.payout.findUnique({
    where: { id }
  });

  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  if (payout.status === 'COMPLETED') {
    throw new AppError('Cannot fail a completed payout', 400);
  }

  const updatedPayout = await prisma.payout.update({
    where: { id },
    data: {
      status: 'FAILED',
      failureReason,
      adminNotes: adminNotes || payout.adminNotes
    }
  });

  await logAdminAction(req, 'FAIL_PAYOUT', 'Payout', id, {
    amount: payout.amount,
    payoutMethod: payout.payoutMethod,
    failureReason,
    adminNotes
  });

  res.json({
    success: true,
    message: 'Payout marked as failed',
    data: { payout: updatedPayout }
  });
}));

// ==================== USER PROFILE MANAGEMENT ====================

// Update user profile (admin can edit any user)
router.put('/users/:id/profile', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    username,
    bio,
    location,
    website,
    phone,
    payoutMethod,
    paypalEmail,
    payoneerEmail
  } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      payoutMethod: true,
      paypalEmail: true,
      payoneerEmail: true
    }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check for email/username conflicts
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  if (username && username !== existingUser.username) {
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      throw new AppError('Username already in use', 400);
    }
  }

  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (website !== undefined) updateData.website = website;
  if (phone !== undefined) updateData.phone = phone;
  if (payoutMethod !== undefined) updateData.payoutMethod = payoutMethod || null;
  if (paypalEmail !== undefined) updateData.paypalEmail = paypalEmail || null;
  if (payoneerEmail !== undefined) updateData.payoneerEmail = payoneerEmail || null;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      bio: true,
      location: true,
      website: true,
      phone: true,
      role: true,
      isVerified: true,
      isAvailable: true,
      payoutMethod: true,
      paypalEmail: true,
      payoneerEmail: true
    }
  });

  await logAdminAction(req, 'UPDATE_USER_PROFILE', 'User', id, {
    previousValues: existingUser,
    newValues: updateData
  });

  res.json({
    success: true,
    message: 'User profile updated successfully',
    data: { user: updatedUser }
  });
}));

// Update user role
router.put('/users/:id/role', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    throw new AppError('Role is required', 400);
  }

  const validRoles = ['CLIENT', 'FREELANCER', 'ADMIN'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Prevent removing last admin
  if (existingUser.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new AppError('Cannot change role of the last admin user', 400);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      username: true,
      role: true
    }
  });

  await logAdminAction(req, 'CHANGE_USER_ROLE', 'User', id, {
    previousRole: existingUser.role,
    newRole: role
  });

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user: updatedUser }
  });
}));

// ==================== SERVICES MANAGEMENT ====================

// Get all services
router.get('/services', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '20',
    status,
    categoryId,
    search,
    featured
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;
  if (categoryId) where.categoryId = categoryId;
  if (featured === 'true') where.isFeatured = true;

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { freelancer: { username: { contains: search as string, mode: 'insensitive' } } },
      { freelancer: { email: { contains: search as string, mode: 'insensitive' } } }
    ];
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      include: {
        freelancer: {
          select: {
            id: true,
            email: true,
            username: true,
            isVerified: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        },
        packages: {
          select: {
            id: true,
            tier: true,
            price: true,
            isActive: true
          }
        },
        _count: {
          select: {
            serviceOrders: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.service.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Get service details
router.get('/services/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      freelancer: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          rating: true
        }
      },
      category: true,
      subcategory: true,
      packages: true,
      faqs: true,
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              username: true
            }
          }
        }
      },
      _count: {
        select: {
          serviceOrders: true,
          reviews: true
        }
      }
    }
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  res.json({
    success: true,
    data: { service }
  });
}));

// Toggle service active status
router.put('/services/:id/status', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean', 400);
  }

  const service = await prisma.service.findUnique({
    where: { id },
    select: { id: true, title: true, isActive: true }
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  const updatedService = await prisma.service.update({
    where: { id },
    data: { isActive }
  });

  await logAdminAction(req, isActive ? 'ACTIVATE_SERVICE' : 'DEACTIVATE_SERVICE', 'Service', id, {
    title: service.title,
    previousStatus: service.isActive,
    newStatus: isActive
  });

  res.json({
    success: true,
    message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { service: updatedService }
  });
}));

// Remove featured status from service
router.put('/services/:id/unfeature', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id },
    select: { id: true, title: true, isFeatured: true, featuredLevel: true }
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  const updatedService = await prisma.service.update({
    where: { id },
    data: {
      isFeatured: false,
      featuredLevel: 'NONE',
      featuredUntil: null
    }
  });

  await logAdminAction(req, 'UNFEATURE_SERVICE', 'Service', id, {
    title: service.title,
    previousFeaturedLevel: service.featuredLevel
  });

  res.json({
    success: true,
    message: 'Service featured status removed',
    data: { service: updatedService }
  });
}));

// ==================== ADMIN ACTION LOGGING ====================

// Get admin action logs
router.get('/activity-logs', asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = '1',
    limit = '50',
    action,
    targetType,
    adminId
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};

  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (adminId) where.adminId = adminId;

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.adminActionLog.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Helper function to log admin actions
async function logAdminAction(
  req: AuthRequest,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
) {
  try {
    await prisma.adminActionLog.create({
      data: {
        adminId: req.user!.id,
        adminEmail: req.user!.email,
        action,
        targetType,
        targetId,
        details,
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || null
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the main action
  }
}

export default router;
