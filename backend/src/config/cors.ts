import { CorsOptions } from 'cors';

/**
 * Production-only CORS configuration
 * Security: Strict whitelist of allowed origins - no wildcards, no localhost
 */

const ALLOWED_ORIGINS = [
  'https://koihire.com',                    // Main production domain
  'https://www.koihire.com',                // WWW variant
  'https://koihire-production.vercel.app'   // Vercel deployment URL
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
    if (!origin) {
      console.log('✅ CORS: No origin (allowing for testing/mobile)');
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log(`✅ CORS: Allowed origin: ${origin}`);
      return callback(null, true);
    }

    // Security: Log and reject all other origins
    console.error(`❌ CORS: Blocked unauthorized origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Exposed response headers (frontend can read these)
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],

  // How long browser can cache preflight response (seconds)
  maxAge: 600, // 10 minutes

  // Allow preflight OPTIONS requests
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Socket.IO CORS configuration
 * Must match Express CORS for consistency
 */
export const socketCorsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true
};
