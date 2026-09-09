import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './analytics.controller.js';

const idParam = z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id') });

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

// Skill demand — useful to all authenticated roles.
analyticsRouter.get('/skills', ctrl.skills);
analyticsRouter.post('/skills/recompute', requireRole(ROLES.ADMIN), ctrl.recomputeSkills);

// Role-scoped dashboards.
analyticsRouter.get('/institution', requireRole(ROLES.INSTITUTION, ROLES.ADMIN), ctrl.institution);
analyticsRouter.get('/industry', requireRole(ROLES.INDUSTRY, ROLES.ADMIN), ctrl.industry);

// Student dashboard (self by default; admin/institution can target :id).
analyticsRouter.get('/student', ctrl.student);
analyticsRouter.get('/student/:id', validate({ params: idParam }), ctrl.student);

export default analyticsRouter;
