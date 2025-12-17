import Joi from 'joi';
import { AppError } from '../middleware/errorHandler';

export interface AmountValidationOptions {
  min?: number;
  max?: number;
  allowZero?: boolean;
  fieldName?: string;
}

/**
 * Comprehensive monetary amount validation utility
 * Protects against: type errors, precision issues, overflow, Stripe API limits
 *
 * @param amount - The amount to validate (can be any type, will be coerced if string)
 * @param options - Validation options (min, max, allowZero, fieldName)
 * @returns Validated and normalized amount (rounded to 2 decimal places)
 * @throws AppError if validation fails
 */
export function validateMonetaryAmount(
  amount: any,
  options: AmountValidationOptions = {}
): number {
  const {
    min = 0.01,
    max = 999999.99, // Stripe's maximum per transaction
    allowZero = false,
    fieldName = 'Amount'
  } = options;

  // 1. Type validation
  if (typeof amount !== 'number') {
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      if (isNaN(parsed)) {
        throw new AppError(`${fieldName} must be a valid number`, 400);
      }
      amount = parsed;
    } else {
      throw new AppError(`${fieldName} must be a number`, 400);
    }
  }

  // 2. Check for NaN, Infinity
  if (!Number.isFinite(amount)) {
    throw new AppError(`${fieldName} must be a finite number`, 400);
  }

  // 3. Check for negative or zero
  if (amount < 0) {
    throw new AppError(`${fieldName} cannot be negative`, 400);
  }

  if (amount === 0 && !allowZero) {
    throw new AppError(`${fieldName} must be greater than zero`, 400);
  }

  // 4. Check decimal precision (max 2 decimal places for USD)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new AppError(`${fieldName} cannot have more than 2 decimal places`, 400);
  }

  // 5. Check safe integer range (when converted to cents)
  const amountInCents = Math.round(amount * 100);
  if (!Number.isSafeInteger(amountInCents)) {
    throw new AppError(`${fieldName} exceeds safe integer range`, 400);
  }

  // 6. Check min/max bounds
  if (amount < min) {
    throw new AppError(`${fieldName} must be at least $${min.toFixed(2)}`, 400);
  }

  if (amount > max) {
    throw new AppError(`${fieldName} cannot exceed $${max.toFixed(2)}`, 400);
  }

  // 7. Round to 2 decimal places to prevent floating point issues
  return Math.round(amount * 100) / 100;
}

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
  subcategoryId: Joi.string().required(),
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