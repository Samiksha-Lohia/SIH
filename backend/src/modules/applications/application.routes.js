import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './application.controller.js';
import {
  applySchema,
  updateStatusSchema,
  noteSchema,
  interviewStageSchema,
  listMineQuery,
  listForOpportunityQuery,
  idParamSchema,
  opportunityIdParamSchema,
  stageParamSchema,
} from './application.validation.js';

const RECRUITERS = [ROLES.INDUSTRY, ROLES.ADMIN];

/**
 * Applications router (/api/applications). The apply action itself is mounted
 * on the opportunity resource (see applyRoute below).
 */
export const applicationRouter = Router();
applicationRouter.use(authenticate);

// Student views (literal paths before '/:id').
applicationRouter.get('/me', validate({ query: listMineQuery }), ctrl.listMine);

// Recruiter: list applicants for one of their opportunities.
applicationRouter.get(
  '/opportunity/:opportunityId',
  requireRole(RECRUITERS),
  validate({ params: opportunityIdParamSchema, query: listForOpportunityQuery }),
  ctrl.listForOpportunity
);

applicationRouter.get('/:id', validate({ params: idParamSchema }), ctrl.getApplication);
applicationRouter.post('/:id/withdraw', validate({ params: idParamSchema }), ctrl.withdraw);

applicationRouter.patch(
  '/:id/status',
  requireRole(RECRUITERS),
  validate({ params: idParamSchema, body: updateStatusSchema }),
  ctrl.updateStatus
);
applicationRouter.post(
  '/:id/notes',
  requireRole(RECRUITERS),
  validate({ params: idParamSchema, body: noteSchema }),
  ctrl.addNote
);
applicationRouter.post(
  '/:id/interviews',
  requireRole(RECRUITERS),
  validate({ params: idParamSchema, body: interviewStageSchema }),
  ctrl.addInterviewStage
);
applicationRouter.patch(
  '/:id/interviews/:stageId',
  requireRole(RECRUITERS),
  validate({ params: stageParamSchema, body: interviewStageSchema.partial() }),
  ctrl.updateInterviewStage
);

/**
 * Apply action mounted on POST /api/opportunities/:id/apply (student only).
 * Exported as a middleware array to spread into the opportunity router.
 */
export const applyRoute = [
  authenticate,
  requireRole(ROLES.STUDENT),
  validate({ params: idParamSchema, body: applySchema }),
  ctrl.apply,
];
