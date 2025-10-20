import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middleware/auth'
import { notificationService } from '../services/notificationService'

const router = Router()
const prisma = new PrismaClient()

// GET /api/projects/:projectId/updates - Get all updates for a project
router.get('/projects/:projectId/updates', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params
    const { type, limit = '20', offset = '0' } = req.query

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { clientId: req.user!.id },
          { freelancerId: req.user!.id }
        ]
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      })
    }

    const whereClause: any = {
      projectId,
      isVisible: true
    }

    if (type && ['PROGRESS', 'MILESTONE', 'DELIVERABLE', 'ISSUE', 'QUESTION'].includes(type as string)) {
      whereClause.type = type
    }

    const updates = await prisma.projectUpdate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    })

    const totalCount = await prisma.projectUpdate.count({
      where: whereClause
    })

    res.json({
      success: true,
      data: {
        updates,
        totalCount,
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching project updates:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project updates'
    })
  }
})

// POST /api/projects/:projectId/updates - Create a new update
router.post('/projects/:projectId/updates', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params
    const { title, description, type = 'PROGRESS', attachments = [] } = req.body

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      })
    }

    // Verify project access (only freelancer can create updates)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        freelancerId: req.user!.id
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true }
        },
        freelancer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you are not the assigned freelancer'
      })
    }

    // Create the update
    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        title,
        description,
        type,
        attachments
      }
    })

    // Send notification to client about the new update
    try {
      if (project.freelancer) {
        await notificationService.sendProjectUpdateNotification(
          project.client.id,
          update.id,
          projectId,
          title,
          project.title,
          `${project.freelancer.firstName} ${project.freelancer.lastName}`
        );
      }
    } catch (error) {
      console.error('Error sending project update notification:', error);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: { update },
      message: 'Progress update created successfully'
    })
  } catch (error) {
    console.error('Error creating project update:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create project update'
    })
  }
})

export default router