import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { openapiSpec } from './docs/openapi.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { sendSuccess } from './utils/apiResponse.js';

/**
 * Builds and configures the Express app. Kept separate from server.js so it can
 * be imported by tests without opening a port.
 */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    })
  );

  // CORS — allow configured origins, Vercel deployments, localhost, and handle preflight smoothly
  const allowAll = env.corsOrigins.includes('*');
  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      try {
        const parsed = new URL(origin);
        // Allow any Vercel deployment preview/production or localhost
        if (parsed.hostname.endsWith('.vercel.app') || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  });

  app.use(corsMiddleware);
  app.options('*', corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Serve locally-stored uploads (used when Cloudinary is not configured).
  app.use('/uploads', express.static(path.join(process.cwd(), env.storage.localDir)));

  // Root info route
  app.get('/', (req, res) =>
    sendSuccess(res, {
      service: 'SUTRA Backend API',
      docs: '/api/docs',
      health: '/api/health',
    })
  );

  // API docs (OpenAPI/Swagger). Raw spec + interactive UI.
  app.get('/api/docs.json', (req, res) => res.json(openapiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'SUTRA API Docs' }));

  // Rate limiting + API routes
  // Mount on both /api (standard) and / (fallback for clients requesting without /api)
  app.use('/api', generalLimiter, apiRouter);
  app.use('/', generalLimiter, apiRouter);

  // 404 + error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
