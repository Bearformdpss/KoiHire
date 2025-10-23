import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('CLIENT', 'FREELANCER').required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const projectSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(5000).required(),
  requirements: Joi.string().max(2000).optional(),
  minBudget: Joi.number().positive().required(),
  maxBudget: Joi.number().positive().min(Joi.ref('minBudget')).required(),
  timeline: Joi.string().min(5).max(500).required(),
  categoryId: Joi.string().required(),
  // Premium upgrade fields (optional)
  featured: Joi.boolean().optional(),
  featuredLevel: Joi.string().valid('NONE', 'FEATURED', 'PREMIUM', 'SPOTLIGHT').optional(),
  featuredPrice: Joi.number().min(0).optional()
});

export const applicationSchema = Joi.object({
  coverLetter: Joi.string().min(20).max(2000).required(),
  proposedBudget: Joi.number().positive().optional(),
  timeline: Joi.string().min(5).max(500).required()
});

export const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  type: Joi.string().valid('TEXT', 'FILE', 'IMAGE', 'SYSTEM').default('TEXT'),
  attachments: Joi.array().items(Joi.string()).max(5).optional()
});

export const reviewSchema = Joi.object({
  projectId: Joi.string().optional(),
  revieweeId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).required(),
  communication: Joi.number().integer().min(1).max(5).optional(),
  quality: Joi.number().integer().min(1).max(5).optional(),
  timeliness: Joi.number().integer().min(1).max(5).optional(),
  professionalism: Joi.number().integer().min(1).max(5).optional()
});

export const servicePackageSchema = Joi.object({
  tier: Joi.string().valid('BASIC', 'STANDARD', 'PREMIUM').required(),
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  price: Joi.number().positive().required(),
  deliveryTime: Joi.number().integer().min(1).max(365).required(),
  revisions: Joi.number().integer().min(0).max(50).required(),
  features: Joi.array().items(Joi.string().max(100)).min(1).max(20).required()
});

export const serviceFAQSchema = Joi.object({
  question: Joi.string().min(5).max(200).required(),
  answer: Joi.string().min(10).max(1000).required()
});

export const serviceSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(50).max(5000).required(),
  shortDescription: Joi.string().min(20).max(300).optional(),
  categoryId: Joi.string().required(),
  basePrice: Joi.number().positive().required(),
  deliveryTime: Joi.number().integer().min(1).max(365).required(),
  revisions: Joi.number().integer().min(0).max(50).required(),
  requirements: Joi.string().max(2000).optional(),
  coverImage: Joi.string().allow('').optional(),
  galleryImages: Joi.array().items(Joi.string().allow('')).max(10).optional(),
  videoUrl: Joi.string().allow('').optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  packages: Joi.array().items(servicePackageSchema).min(1).max(3).required(),
  faqs: Joi.array().items(serviceFAQSchema).max(10).optional(),
  // Premium upgrade fields (optional)
  featured: Joi.boolean().optional(),
  featuredLevel: Joi.string().valid('NONE', 'BASIC', 'PREMIUM', 'SPOTLIGHT').optional(),
  featuredPrice: Joi.number().min(0).optional()
});

export const serviceOrderSchema = Joi.object({
  packageId: Joi.string().required(),
  requirements: Joi.string().max(2000).optional()
});

export const serviceReviewSchema = Joi.object({
  orderId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
  communication: Joi.number().integer().min(1).max(5).optional(),
  quality: Joi.number().integer().min(1).max(5).optional(),
  delivery: Joi.number().integer().min(1).max(5).optional(),
  value: Joi.number().integer().min(1).max(5).optional()
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail: any) => detail.message)
      });
    }
    next();
  };
};