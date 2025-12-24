import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get escrow status for a project
router.get('/project/:projectId', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      clientId: true,
      freelancerId: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Only project owner or assigned freelancer can check escrow status
  if (project.clientId !== req.user!.id && project.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to view escrow for this project', 403);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { projectId }
  });

  if (!escrow) {
    return res.json({
      success: true,
      escrow: null,
      message: 'No escrow found for this project'
    });
  }

  res.json({
    success: true,
    escrow: {
      id: escrow.id,
      projectId: escrow.projectId,
      amount: escrow.amount,
      status: escrow.status,
      createdAt: escrow.createdAt,
      releasedAt: escrow.releasedAt
    }
  });
}));

// Get escrow status for a service order
router.get('/service-order/:orderId', asyncHandler(async (req: AuthRequest, res) => {
  const { orderId } = req.params;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: {
      clientId: true,
      service: {
        select: {
          freelancerId: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  // Only buyer or seller can check escrow status
  if (order.clientId !== req.user!.id && order.service.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to view escrow for this order', 403);
  }

  // Note: Escrow is only for projects, not service orders
  // Service orders use direct payment, not escrow
  return res.json({
    success: true,
    escrow: null,
    message: 'Service orders do not use escrow - they use direct payment'
  });
}));

export default router;
