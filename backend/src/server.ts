import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupSocketIO } from './services/socketService';
import { globalLimiter } from './middleware/rateLimiter';
import { corsOptions, socketCorsOptions } from './config/cors';

// Import routes
import authRoutes from './api/auth';
import userRoutes from './api/users';
import publicUserRoutes from './api/users-public';
import projectRoutes from './api/projects';
import applicationRoutes from './api/applications';
import messageRoutes from './api/messages';
import paymentRoutes, { webhookRouter } from './api/payments';
import reviewRoutes from './api/reviews';
import categoryRoutes from './api/categories';
import notificationRoutes from './api/notifications';
import portfolioRoutes from './api/portfolios';
import uploadRoutes from './api/upload';
import serviceRoutes from './api/services';
import serviceOrderRoutes from './api/service-orders';
import escrowRoutes from './api/escrow';
import fileRoutes from './routes/files.routes';
import serviceOrderFileRoutes from './routes/service-order-files.routes';
import adminRoutes from './api/admin';
import recommendationsRoutes from './api/recommendations';
import actionsRoutes from './api/actions';
import freelancerWorkRoutes from './api/freelancer-work';
import workNotesRoutes from './api/work-notes';
// import projectUpdateRoutes from './routes/projectUpdates';

// Load environment variables
dotenv.config();

// Validate environment configuration at startup (for cookie security diagnostics)
const isProduction = !!(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL || process.env.NODE_ENV === 'production');
console.log('🔍 Environment Configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT || 'not set');
console.log('  VERCEL:', process.env.VERCEL || 'not set');
console.log('  Cookie secure flag:', isProduction);
console.log('  Cookie sameSite:', isProduction ? 'none' : 'lax');

const app = express();

// Enable trust proxy for Railway deployment
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: socketCorsOptions
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Global rate limiting (baseline protection for all endpoints)
// Endpoint-specific limiters are applied in individual route files
app.use(globalLimiter);

// Body parsing middleware
app.use(compression());

// Cookie parser middleware - must be before routes that use cookies
app.use(cookieParser());

// Stripe webhook needs raw body, so we need to handle it before JSON parsing
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with proper CORS headers
app.use('/uploads', (req, res, next) => {
  // Override restrictive CORS headers for uploaded files
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users/public', publicUserRoutes); // Public user routes (no auth required)
app.use('/api/users', authMiddleware, userRoutes); // Private user routes (auth required)
app.use('/api/projects', projectRoutes);
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/payments', webhookRouter); // Webhook router (no auth) - handles /api/payments/webhook
app.use('/api/payments', authMiddleware, paymentRoutes); // All other payment routes require auth
app.use('/api/reviews', reviewRoutes); // Auth applied per-route (public endpoints exist)
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-orders', authMiddleware, serviceOrderRoutes);
app.use('/api/escrow', authMiddleware, escrowRoutes);
app.use('/api/projects', fileRoutes); // For /:projectId/files routes (upload/list)
app.use('/api/files', fileRoutes); // For /download/:fileId and /:fileId routes (download/delete)
app.use('/api/service-orders', serviceOrderFileRoutes); // For /:orderId/files routes (upload/list)
app.use('/api/service-order-files', serviceOrderFileRoutes); // For /download/:fileId and /:fileId routes (download/delete)
app.use('/api/admin', authMiddleware, adminRoutes); // Admin routes (requires auth + ADMIN role)
app.use('/api/recommendations', authMiddleware, recommendationsRoutes); // Recommendations for freelancers
app.use('/api/actions', actionsRoutes); // Actions requiring attention (already has authMiddleware in routes)
app.use('/api/freelancer', authMiddleware, freelancerWorkRoutes); // Active work section
app.use('/api/work-notes', authMiddleware, workNotesRoutes); // Work item notes
// app.use('/api', authMiddleware, projectUpdateRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export { app, io };