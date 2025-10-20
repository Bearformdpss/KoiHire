import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      skills: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true
        }
      },
      _count: {
        select: {
          projects: {
            where: { status: 'OPEN' }
          },
          services: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    categories
  });
}));

// Get category by slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      skills: {
        where: { isActive: true }
      },
      _count: {
        select: {
          projects: {
            where: { status: 'OPEN' }
          },
          services: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  res.json({
    success: true,
    category
  });
}));

// Get all skills
router.get('/skills/all', asyncHandler(async (req, res) => {
  const { categoryId, search } = req.query;

  const where: any = { isActive: true };

  if (categoryId) {
    where.categoryId = categoryId as string;
  }

  if (search) {
    where.name = {
      contains: search as string,
      mode: 'insensitive'
    };
  }

  const skills = await prisma.skill.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    skills
  });
}));

export default router;