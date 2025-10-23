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
      buyerId: true,
      service: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Service order not found', 404);
  }

  // Only buyer or seller can check escrow status
  if (order.buyerId !== req.user!.id && order.service.userId !== req.user!.id) {
    throw new AppError('Not authorized to view escrow for this order', 403);
  }

  const escrow = await prisma.escrow.findUnique({
    where: { serviceOrderId: orderId }
  });

  if (!escrow) {
    return res.json({
      success: true,
      escrow: null,
      message: 'No escrow found for this order'
    });
  }

  res.json({
    success: true,
    escrow: {
      id: escrow.id,
      serviceOrderId: escrow.serviceOrderId,
      amount: escrow.amount,
      status: escrow.status,
      createdAt: escrow.createdAt,
      releasedAt: escrow.releasedAt
    }
  });
}));

export default router;
