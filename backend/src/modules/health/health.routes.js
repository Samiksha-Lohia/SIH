import { Router } from 'express';
import { sendSuccess } from '../../utils/apiResponse.js';
import { isDBConnected } from '../../config/db.js';
import { env } from '../../config/env.js';

const router = Router();

/**
 * GET /api/health
 * Liveness + dependency status. Never requires auth or DB.
 */
router.get('/', (req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'sutra-backend',
    version: '1.0.0',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: {
      database: isDBConnected() ? 'connected' : 'disconnected',
      ai: env.ai.enabled ? 'configured' : 'fallback',
      storage: env.storage.cloudinaryEnabled ? 'cloudinary' : 'local',
      email: env.email.enabled ? 'configured' : 'disabled',
    },
  });
});

export default router;
