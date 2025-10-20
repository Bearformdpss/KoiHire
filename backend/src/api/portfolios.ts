import express from 'express'
import { PrismaClient, PortfolioCategory } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/portfolios - Get all portfolios with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      userId, 
      category, 
      page = '1', 
      limit = '12',
      search 
    } = req.query

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const where: any = {
      isPublic: true
    }

    if (userId) {
      where.userId = userId as string
    }

    if (category && category !== 'ALL') {
      where.category = category as PortfolioCategory
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { technologies: { hasSome: [search as string] } }
      ]
    }

    const [portfolios, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        include: {
          user: {
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
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.portfolio.count({ where })
    ])

    res.json({
      success: true,
      portfolios,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    })
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch portfolios' 
    })
  }
})

// GET /api/portfolios/:id - Get single portfolio
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
            totalEarnings: true,
            isVerified: true
          }
        }
      }
    })

    if (!portfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      })
    }

    // Increment view count
    await prisma.portfolio.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    res.json({
      success: true,
      portfolio: {
        ...portfolio,
        views: portfolio.views + 1
      }
    })
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch portfolio' 
    })
  }
})

// POST /api/portfolios - Create new portfolio
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      description,
      category,
      thumbnail,
      images = [],
      liveUrl,
      codeUrl,
      technologies = [],
      duration,
      clientName,
      completedAt,
      isPublic = true
    } = req.body

    if (!title || !description || !completedAt) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and completion date are required'
      })
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: req.user!.id,
        title,
        description,
        category: category || 'OTHER',
        thumbnail,
        images,
        liveUrl,
        codeUrl,
        technologies,
        duration,
        clientName,
        completedAt: new Date(completedAt),
        isPublic
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      portfolio
    })
  } catch (error) {
    console.error('Error creating portfolio:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create portfolio' 
    })
  }
})

// PUT /api/portfolios/:id - Update portfolio
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      category,
      thumbnail,
      images,
      liveUrl,
      codeUrl,
      technologies,
      duration,
      clientName,
      completedAt,
      isPublic
    } = req.body

    // Check if portfolio belongs to user
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id }
    })

    if (!existingPortfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      })
    }

    if (existingPortfolio.userId !== req.user!.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this portfolio' 
      })
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        title,
        description,
        category,
        thumbnail,
        images,
        liveUrl,
        codeUrl,
        technologies,
        duration,
        clientName,
        ...(completedAt && { completedAt: new Date(completedAt) }),
        isPublic
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    res.json({
      success: true,
      portfolio
    })
  } catch (error) {
    console.error('Error updating portfolio:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update portfolio' 
    })
  }
})

// DELETE /api/portfolios/:id - Delete portfolio
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    // Check if portfolio belongs to user
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id }
    })

    if (!existingPortfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found' 
      })
    }

    if (existingPortfolio.userId !== req.user!.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this portfolio' 
      })
    }

    await prisma.portfolio.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete portfolio' 
    })
  }
})

export default router