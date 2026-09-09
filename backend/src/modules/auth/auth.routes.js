import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { strictLimiter } from '../../middleware/rateLimit.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation.js';

const router = Router();

// Auth endpoints are rate-limited more strictly to resist brute force.
router.post('/register', strictLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', strictLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', strictLimiter, validate({ body: refreshSchema }), authController.refresh);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

export default router;
