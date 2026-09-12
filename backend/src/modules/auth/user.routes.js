import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../config/constants.js';
import * as authController from './auth.controller.js';
import { listUsersQuery, registerSchema } from './auth.validation.js';

const router = Router();

/**
 * GET /api/users — list users with pagination, filter by role and status (admin only).
 */
router.get(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ query: listUsersQuery }),
  authController.listUsers
);

/**
 * POST /api/users — provision a new user (admin only).
 */
router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ body: registerSchema }),
  authController.createUser
);

export default router;
