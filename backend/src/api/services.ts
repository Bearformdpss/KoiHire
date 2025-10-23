import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import { validate, serviceSchema } from '../utils/validation';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Get all services (public, with filters)
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    featured = false,
    featuredLevel = null,
    deliveryTime,
    rating
  } = req.query;

  // Map frontend sortBy values to valid Prisma field names
  const sortByMapping: Record<string, string> = {
    'newest': 'createdAt',
    'oldest': 'createdAt',
    'price-high': 'basePrice',
    'price-low': 'basePrice',
    'rating': 'rating',
    'orders': 'orders',
    'title': 'title',
    'featured_priority': 'featuredLevel'
  };

  const validSortBy = sortByMapping[sortBy as string] || sortBy as string || 'createdAt';

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    isActive: true,
    freelancer: {
      isAvailable: true  // Only show services from available freelancers
    }
  };

  if (category) {
    where.categoryId = category as string;
  }

  if (minPrice || maxPrice) {
    where.AND = [];
    if (minPrice) {
      where.AND.push({ basePrice: { gte: Number(minPrice) } });
    }
    if (maxPrice) {
      where.AND.push({ basePrice: { lte: Number(maxPrice) } });
    }
  }

  // IMPROVED SEARCH: Split search query into words and find services containing ALL words
  let searchWords: string[] = [];
  if (search) {
    console.log('[SEARCH] Original query:', search);

    // Split search query into individual words and filter out short words (< 3 chars)
    searchWords = (search as string)
      .trim()
      .split(/\s+/)
      .filter(word => word.length >= 3)
      .map(word => word.toLowerCase());

    console.log('[SEARCH] Search words after filtering:', searchWords);

    if (searchWords.length > 0) {
      // Build AND query: all words must appear in at least one of the searchable fields
      const searchConditions = searchWords.map(word => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { description: { contains: word, mode: 'insensitive' } },
          { shortDescription: { contains: word, mode: 'insensitive' } },
          { tags: { has: word } }
        ]
      }));

      // If where.AND already exists (from price filter), append to it
      if (where.AND) {
        where.AND = [...where.AND, ...searchConditions];
      } else {
        where.AND = searchConditions;
      }

      console.log('[SEARCH] Generated AND conditions for', searchWords.length, 'words');
    } else {
      console.log('[SEARCH] No valid search words (all < 3 characters), skipping search filter');
    }
  }

  // Featured services filter
  if (featured === 'true' || featured === true) {
    where.isFeatured = true;
    where.featuredUntil = {
      gte: new Date()
    };

    if (featuredLevel && ['BASIC', 'PREMIUM', 'SPOTLIGHT'].includes(featuredLevel as string)) {
      where.featuredLevel = featuredLevel as string;
    }
  }

  // Delivery time filter
  if (deliveryTime) {
    where.deliveryTime = { lte: Number(deliveryTime) };
  }

  // Rating filter
  if (rating) {
    where.rating = { gte: Number(rating) };
  }

  let [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { [validSortBy]: order },
      include: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        packages: {
          where: { isActive: true },
          orderBy: { tier: 'asc' }
        },
        _count: {
          select: {
            serviceOrders: true,
            reviews: true
          }
        }
      }
    }),
    prisma.service.count({ where })
  ]);

  // PRIORITY RANKING: When searching, sort results by relevance
  // Services with search terms in title appear before those with terms only in description
  if (search && searchWords.length > 0) {
    console.log('[SEARCH] Applying priority ranking to', services.length, 'services');

    services = services.map(service => {
      let score = 0;
      const titleLower = (service.title || '').toLowerCase();
      const descriptionLower = (service.description || '').toLowerCase();
      const shortDescLower = (service.shortDescription || '').toLowerCase();

      searchWords.forEach(word => {
        // Title matches get highest priority (3 points)
        if (titleLower.includes(word)) {
          score += 3;
        }
        // Short description matches get medium priority (2 points)
        else if (shortDescLower.includes(word)) {
          score += 2;
        }
        // Description matches get lowest priority (1 point)
        else if (descriptionLower.includes(word)) {
          score += 1;
        }
        // Tags matches also get medium priority (2 points)
        else if (service.tags && service.tags.some((tag: string) => tag.toLowerCase().includes(word))) {
          score += 2;
        }
      });

      return { ...service, _searchScore: score };
    }).sort((a: any, b: any) => {
      // Sort by search score descending (higher score = more relevant)
      return b._searchScore - a._searchScore;
    });

    console.log('[SEARCH] Top 3 results:', services.slice(0, 3).map((s: any) => ({ title: s.title, score: s._searchScore })));
  }

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

// Get featured services only
router.get('/featured', asyncHandler(async (req, res) => {
  const {
    limit = 10,
    featuredLevel = null
  } = req.query;

  const where: any = {
    isActive: true,
    isFeatured: true,
    featuredUntil: {
      gte: new Date()
    },
    freelancer: {
      isAvailable: true  // Only show featured services from available freelancers
    }
  };

  if (featuredLevel && ['BASIC', 'PREMIUM', 'SPOTLIGHT'].includes(featuredLevel as string)) {
    where.featuredLevel = featuredLevel as string;
  }

  const services = await prisma.service.findMany({
    where,
    take: Number(limit),
    orderBy: [
      { featuredLevel: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
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
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      packages: {
        where: { isActive: true },
        orderBy: { tier: 'asc' }
      },
      _count: {
        select: {
          serviceOrders: true,
          reviews: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: { services }
  });
}));

// Get user's services (freelancers only)
router.get('/my-services', authMiddleware, requireRole(['FREELANCER']), asyncHandler(async (req: AuthRequest, res) => {
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

  const where: any = {
    freelancerId: req.user!.id
  };

  console.log('=== MY SERVICES DEBUG ===');
  console.log('User ID:', req.user!.id);
  console.log('Status filter:', status);
  console.log('Search:', search);

  if (status && status !== 'ALL') {
    where.isActive = status === 'ACTIVE' ? true : false;
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  console.log('Where clause:', JSON.stringify(where, null, 2));

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: order },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        packages: {
          where: { isActive: true },
          orderBy: { tier: 'asc' }
        },
        _count: {
          select: {
            serviceOrders: true,
            reviews: true
          }
        }
      }
    }),
    prisma.service.count({ where })
  ]);

  console.log('Services found:', services.length);
  console.log('Total count:', total);
  console.log('=========================');

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / take)
      }
    }
  });
}));

// Get services by user ID (public endpoint)
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    freelancerId: userId,
    isActive: true // Only show active services on public profile
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: order },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        packages: {
          where: { isActive: true },
          orderBy: { tier: 'asc' }
        },
        _count: {
          select: {
            serviceOrders: true,
            reviews: true
          }
        }
      }
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
        pages: Math.ceil(total / take)
      }
    }
  });
}));

// Get service by ID
router.get('/:serviceId', asyncHandler(async (req, res) => {
  const { serviceId } = req.params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
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
          location: true,
          totalEarnings: true,
          createdAt: true
        }
      },
      category: true,
      skills: {
        include: {
          skill: true
        }
      },
      packages: {
        where: { isActive: true },
        orderBy: { tier: 'asc' }
      },
      reviews: {
        where: { isPublic: true },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      faqs: {
        orderBy: { order: 'asc' }
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

  // Increment view count
  await prisma.service.update({
    where: { id: serviceId },
    data: { views: { increment: 1 } }
  });

  res.json({
    success: true,
    data: { service }
  });
}));

// Get service reviews
router.get('/:serviceId/reviews', asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const {
    page = 1,
    limit = 10,
    rating,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {
    serviceId,
    isPublic: true
  };

  if (rating) {
    where.rating = Number(rating);
  }

  const [reviews, total] = await Promise.all([
    prisma.serviceReview.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: order },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    }),
    prisma.serviceReview.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Create service (freelancers only)
router.post('/', authMiddleware, requireRole(['FREELANCER']), validate(serviceSchema), asyncHandler(async (req: AuthRequest, res) => {
  const {
    title,
    description,
    shortDescription,
    categoryId,
    basePrice,
    deliveryTime,
    revisions,
    requirements,
    coverImage,
    galleryImages,
    videoUrl,
    tags,
    packages,
    faqs,
    featured,
    featuredLevel,
    featuredPrice
  } = req.body;

  // Handle premium upgrade logic
  let premiumData = {};
  if (featured && featuredLevel && featuredLevel !== 'NONE') {
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 60); // 60 days featured

    premiumData = {
      isFeatured: true,
      featuredLevel: featuredLevel,
      featuredUntil: featuredUntil
    };
  }

  const service = await prisma.service.create({
    data: {
      title,
      description,
      shortDescription,
      categoryId,
      basePrice,
      deliveryTime,
      revisions,
      requirements,
      coverImage,
      galleryImages,
      videoUrl,
      tags,
      freelancerId: req.user!.id,
      ...premiumData,
      packages: {
        create: packages
      },
      faqs: faqs ? {
        create: faqs.map((faq: any, index: number) => ({
          question: faq.question,
          answer: faq.answer,
          order: index
        }))
      } : undefined
    },
    include: {
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      category: true,
      packages: {
        orderBy: { tier: 'asc' }
      },
      faqs: {
        orderBy: { order: 'asc' }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: { service }
  });
}));

// Update service (service owner only)
router.put('/:serviceId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { serviceId } = req.params;
  const {
    title,
    description,
    shortDescription,
    basePrice,
    deliveryTime,
    revisions,
    requirements,
    coverImage,
    galleryImages,
    videoUrl,
    tags,
    packages,
    faqs
  } = req.body;

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!existingService) {
    throw new AppError('Service not found', 404);
  }

  if (existingService.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to update this service', 403);
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: {
      title,
      description,
      shortDescription,
      basePrice,
      deliveryTime,
      revisions,
      requirements,
      coverImage,
      galleryImages,
      videoUrl,
      tags,
      packages: packages ? {
        deleteMany: {},
        create: packages
      } : undefined,
      faqs: faqs ? {
        deleteMany: {},
        create: faqs.map((faq: any, index: number) => ({
          question: faq.question,
          answer: faq.answer,
          order: index
        }))
      } : undefined
    },
    include: {
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      category: true,
      packages: {
        orderBy: { tier: 'asc' }
      },
      faqs: {
        orderBy: { order: 'asc' }
      }
    }
  });

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: { service: updatedService }
  });
}));

// Toggle service active status (service owner only)
router.patch('/:serviceId/toggle-status', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { serviceId } = req.params;

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!existingService) {
    throw new AppError('Service not found', 404);
  }

  if (existingService.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to modify this service', 403);
  }

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: {
      isActive: !existingService.isActive
    }
  });

  res.json({
    success: true,
    message: `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: updatedService.isActive }
  });
}));

// Feature service (admin or service owner with payment)
router.post('/:serviceId/feature', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { serviceId } = req.params;
  const { featuredLevel, duration = 60 } = req.body; // duration in days

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId }
  });

  if (!existingService) {
    throw new AppError('Service not found', 404);
  }

  if (existingService.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to feature this service', 403);
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + Number(duration));

  const updatedService = await prisma.service.update({
    where: { id: serviceId },
    data: {
      isFeatured: true,
      featuredLevel: featuredLevel,
      featuredUntil: featuredUntil
    }
  });

  res.json({
    success: true,
    message: 'Service featured successfully',
    data: {
      isFeatured: updatedService.isFeatured,
      featuredLevel: updatedService.featuredLevel,
      featuredUntil: updatedService.featuredUntil
    }
  });
}));

// Delete service (service owner only)
router.delete('/:serviceId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { serviceId } = req.params;

  const existingService = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      _count: {
        select: {
          serviceOrders: {
            where: {
              status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED'] }
            }
          }
        }
      }
    }
  });

  if (!existingService) {
    throw new AppError('Service not found', 404);
  }

  if (existingService.freelancerId !== req.user!.id) {
    throw new AppError('Not authorized to delete this service', 403);
  }

  if (existingService._count.serviceOrders > 0) {
    throw new AppError('Cannot delete service with active orders', 400);
  }

  await prisma.service.delete({
    where: { id: serviceId }
  });

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
}));

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SRV-${timestamp}-${random}`;
};

// Place order for a service (clients only)
router.post('/:serviceId/order', authMiddleware, requireRole(['CLIENT']), asyncHandler(async (req: AuthRequest, res) => {
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

  // Prevent freelancer from ordering their own service
  if (service.freelancerId === req.user!.id) {
    throw new AppError('You cannot order your own service', 400);
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
      freelancerId: service.freelancerId,
      orderNumber: generateOrderNumber(),
      totalAmount: servicePackage.price,
      requirements,
      deliveryDate,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          coverImage: true
        }
      },
      package: true,
      client: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
      freelancer: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
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

export default router;