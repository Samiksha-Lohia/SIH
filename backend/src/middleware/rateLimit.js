import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

const handler = (req, res) =>
  sendError(res, {
    status: 429,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  });

/**
 * General limiter applied to all /api routes.
 */
export const generalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/**
 * Stricter limiter for sensitive endpoints (auth, assessment submit, AI).
 */
export const strictLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: Math.max(10, Math.floor(env.rateLimit.max / 6)),
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export default generalLimiter;
