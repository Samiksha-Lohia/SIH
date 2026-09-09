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
  app.use(helmet());

  // CORS — allow configured origins (defaults to * in dev) so any frontend can integrate.
  const allowAll = env.corsOrigins.includes('*');
  app.use(
    cors({
      origin: allowAll ? true : env.corsOrigins,
      credentials: true,
    })
  );

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
  app.use('/api', generalLimiter, apiRouter);

  // 404 + error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
