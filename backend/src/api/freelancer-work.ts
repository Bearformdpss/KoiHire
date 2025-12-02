import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

/**
 * GET /api/freelancer/active-work
 * Get all active projects and service orders for a freelancer
 * Query params:
 * - type: 'all' | 'projects' | 'services'
 */
router.get('/active-work', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type = 'all' } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Fetch active projects
    let projects = [];
    if (type === 'all' || type === 'projects') {
      projects = await prisma.project.findMany({
        where: {
          freelancerId: userId,
          status: {
            in: ['IN_PROGRESS', 'PENDING_REVIEW', 'PAUSED', 'DISPUTED']
          }
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          note: {
            select: {
              note: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    // Fetch active service orders
    let serviceOrders = [];
    if (type === 'all' || type === 'services') {
      serviceOrders = await prisma.serviceOrder.findMany({
        where: {
          freelancerId: userId,
          status: {
            in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED']
          }
        },
        include: {
          service: {
            select: {
              title: true
            }
          },
          package: {
            select: {
              tier: true
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
          conversation: {
            select: {
              id: true
            }
          },
          note: {
            select: {
              note: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    // Transform projects to unified format
    const projectItems = projects.map(project => ({
      id: project.id,
      type: 'PROJECT' as const,
      title: project.title,
      description: project.description,
      status: project.status,
      amount: project.agreedAmount || project.maxBudget,
      client: {
        id: project.client.id,
        firstName: project.client.firstName,
        lastName: project.client.lastName,
        avatar: project.client.avatar
      },
      deadline: null, // Projects don't have specific delivery dates
      timeline: project.timeline,
      updatedAt: project.updatedAt,
      conversationId: null,
      note: project.note?.note || null,
      noteUpdatedAt: project.note?.updatedAt || null,
      detailsUrl: `/projects/${project.id}`
    }));

    // Transform service orders to unified format
    const serviceItems = serviceOrders.map(order => ({
      id: order.id,
      type: 'SERVICE' as const,
      title: order.service.title,
      description: `${order.package.tier} Package`,
      status: order.status,
      amount: order.packagePrice,
      client: {
        id: order.client.id,
        firstName: order.client.firstName,
        lastName: order.client.lastName,
        avatar: order.client.avatar
      },
      deadline: order.deliveryDate,
      timeline: null,
      updatedAt: order.updatedAt,
      conversationId: order.conversation?.id || null,
      note: order.note?.note || null,
      noteUpdatedAt: order.note?.updatedAt || null,
      detailsUrl: `/orders/${order.id}`
    }));

    // Combine and sort by most recent
    const allItems = [...projectItems, ...serviceItems].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Calculate stats
    const stats = {
      totalProjects: projectItems.length,
      totalServices: serviceItems.length,
      totalActive: allItems.length
    };

    res.json({
      success: true,
      data: {
        items: allItems,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching active work:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active work'
    });
  }
});

export default router;
