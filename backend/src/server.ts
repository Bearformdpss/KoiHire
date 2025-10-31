import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupSocketIO } from './services/socketService';

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
import adminRoutes from './api/admin';
// import projectUpdateRoutes from './routes/projectUpdates';

// Load environment variables
dotenv.config();

const app = express();

// Enable trust proxy for Railway deployment
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? (origin, callback) => {
        // Allow any localhost origin during development
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : (origin, callback) => {
        // In production, allow the configured frontend URL and its www variant
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const allowedOrigins = [
          frontendUrl,
          frontendUrl.replace('https://', 'https://www.'),
          frontendUrl.replace('https://www.', 'https://'),
          'https://koi-hire.vercel.app' // Keep old Vercel URL for transition
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(compression());

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
app.use('/api/reviews', authMiddleware, reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-orders', authMiddleware, serviceOrderRoutes);
app.use('/api/escrow', authMiddleware, escrowRoutes);
app.use('/api', fileRoutes);
app.use('/api/admin', authMiddleware, adminRoutes); // Admin routes (requires auth + ADMIN role)
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