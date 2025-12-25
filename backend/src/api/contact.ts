import express from 'express';
import Joi from 'joi';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for contact form submissions
// Moderate limits to prevent spam while allowing legitimate use
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // 5 submissions per hour in production
  message: 'Too many contact form submissions. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: express.Request) => {
    const email = req.body.email;
    return email ? `contact:${email}` : `contact:ip:${req.ip}`;
  }
});

// Validation schema for contact form
const contactFormSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  subject: Joi.string()
    .valid('general', 'account', 'payment', 'technical', 'dispute', 'feedback', 'other')
    .required()
    .messages({
      'any.only': 'Please select a valid subject',
      'any.required': 'Subject is required'
    }),
  message: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message must be at least 10 characters',
      'string.max': 'Message cannot exceed 2000 characters',
      'any.required': 'Message is required'
    })
});

// Validation middleware
const validate = (schema: Joi.ObjectSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      throw new AppError(errors.join(', '), 400);
    }

    req.body = value;
    next();
  };
};

/**
 * POST /api/contact
 * Submit contact form (public endpoint)
 */
router.post('/', contactLimiter, validate(contactFormSchema), asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic XSS prevention - strip HTML tags
  const sanitize = (text: string) => text.replace(/<[^>]*>/g, '');

  const sanitizedData = {
    name: sanitize(name),
    email: email.toLowerCase(),
    subject,
    message: sanitize(message)
  };

  // Send notification email to support team
  await emailService.sendContactFormNotification(sanitizedData);

  // Send confirmation email to user
  await emailService.sendContactFormConfirmation({
    email: sanitizedData.email,
    name: sanitizedData.name
  });

  res.status(200).json({
    success: true,
    message: 'Contact form submitted successfully'
  });
}));

export default router;
