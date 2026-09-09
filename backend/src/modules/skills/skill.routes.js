import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './skill.controller.js';
import {
  createSkillSchema,
  updateSkillSchema,
  createRoleSchema,
  updateRoleSchema,
  normalizeSchema,
  listSkillsQuery,
  idParamSchema,
} from './skill.validation.js';

/**
 * Taxonomy is readable by any authenticated user (needed for profile building,
 * matching, dashboards) and writable only by admins.
 */

// --- Skills (/api/skills) ---
export const skillRouter = Router();
skillRouter.get('/', optionalAuth, validate({ query: listSkillsQuery }), ctrl.listSkills);
skillRouter.post('/normalize', authenticate, validate({ body: normalizeSchema }), ctrl.normalize);
skillRouter.get('/:id', optionalAuth, validate({ params: idParamSchema }), ctrl.getSkill);
skillRouter.post('/', authenticate, requireRole(ROLES.ADMIN), validate({ body: createSkillSchema }), ctrl.createSkill);
skillRouter.put(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateSkillSchema }),
  ctrl.updateSkill
);
skillRouter.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  ctrl.deleteSkill
);

// --- Roles (/api/roles) ---
export const roleRouter = Router();
roleRouter.get('/', optionalAuth, validate({ query: listSkillsQuery }), ctrl.listRoles);
roleRouter.get('/:id', optionalAuth, validate({ params: idParamSchema }), ctrl.getRole);
roleRouter.post('/', authenticate, requireRole(ROLES.ADMIN), validate({ body: createRoleSchema }), ctrl.createRole);
roleRouter.put(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateRoleSchema }),
  ctrl.updateRole
);
roleRouter.delete(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  ctrl.deleteRole
);
