import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/work-notes/:itemType/:itemId
 * Get note for a specific work item
 */
router.get('/:itemType/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemType, itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (itemType !== 'project' && itemType !== 'service') {
      return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    const whereClause: any = { userId };
    if (itemType === 'project') {
      whereClause.projectId = itemId;
    } else {
      whereClause.serviceOrderId = itemId;
    }

    const note = await prisma.workItemNote.findFirst({
      where: whereClause
    });

    res.json({
      success: true,
      data: note
    });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
});

/**
 * POST /api/work-notes/:itemType/:itemId
 * Create or update note for a work item
 */
router.post('/:itemType/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemType, itemId } = req.params;
    const { note } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (itemType !== 'project' && itemType !== 'service') {
      return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    if (!note || typeof note !== 'string') {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    // Verify the work item exists and belongs to the user
    if (itemType === 'project') {
      const project = await prisma.project.findFirst({
        where: {
          id: itemId,
          freelancerId: userId
        }
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found or access denied' });
      }
    } else {
      const serviceOrder = await prisma.serviceOrder.findFirst({
        where: {
          id: itemId,
          freelancerId: userId
        }
      });

      if (!serviceOrder) {
        return res.status(404).json({ success: false, error: 'Service order not found or access denied' });
      }
    }

    // Create or update note
    const data: any = {
      userId,
      note
    };

    if (itemType === 'project') {
      data.projectId = itemId;
    } else {
      data.serviceOrderId = itemId;
    }

    const savedNote = await prisma.workItemNote.upsert({
      where: itemType === 'project'
        ? { userId_projectId: { userId, projectId: itemId } }
        : { userId_serviceOrderId: { userId, serviceOrderId: itemId } },
      update: { note },
      create: data
    });

    res.json({
      success: true,
      data: savedNote
    });
  } catch (error: any) {
    console.error('Error saving note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save note'
    });
  }
});

/**
 * DELETE /api/work-notes/:itemType/:itemId
 * Delete note for a work item
 */
router.delete('/:itemType/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { itemType, itemId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (itemType !== 'project' && itemType !== 'service') {
      return res.status(400).json({ success: false, error: 'Invalid item type' });
    }

    const whereClause: any = { userId };
    if (itemType === 'project') {
      whereClause.projectId = itemId;
    } else {
      whereClause.serviceOrderId = itemId;
    }

    await prisma.workItemNote.deleteMany({
      where: whereClause
    });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
});

export default router;
