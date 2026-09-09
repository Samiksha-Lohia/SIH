import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../config/constants.js';
import * as oppCtrl from './opportunity.controller.js';
import * as learnCtrl from './learning.controller.js';
import { recommendLearningRoute } from '../matching/matching.routes.js';
import { applyRoute } from '../applications/application.routes.js';
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  statusSchema,
  listOpportunitiesQuery,
  createLearningSchema,
  updateLearningSchema,
  progressSchema,
  listLearningQuery,
  idParamSchema,
} from './opportunity.validation.js';

const PUBLISHERS = [ROLES.INDUSTRY, ROLES.ADMIN];

// --- Opportunities (/api/opportunities) ---
export const opportunityRouter = Router();

opportunityRouter.post(
  '/',
  authenticate,
  requireRole(PUBLISHERS),
  validate({ body: createOpportunitySchema }),
  oppCtrl.createOpportunity
);
// List is public-ish (optionalAuth): anonymous sees published; owners/admin see more.
opportunityRouter.get('/', optionalAuth, validate({ query: listOpportunitiesQuery }), oppCtrl.listOpportunities);
// Student applies to an opportunity (application module).
opportunityRouter.post('/:id/apply', ...applyRoute);
opportunityRouter.get('/:id', optionalAuth, validate({ params: idParamSchema }), oppCtrl.getOpportunity);
opportunityRouter.put(
  '/:id',
  authenticate,
  requireRole(PUBLISHERS),
  validate({ params: idParamSchema, body: updateOpportunitySchema }),
  oppCtrl.updateOpportunity
);
opportunityRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(PUBLISHERS),
  validate({ params: idParamSchema, body: statusSchema }),
  oppCtrl.changeStatus
);
opportunityRouter.delete(
  '/:id',
  authenticate,
  requireRole(PUBLISHERS),
  validate({ params: idParamSchema }),
  oppCtrl.deleteOpportunity
);

// --- Learning programs (/api/learning) ---
export const learningRouter = Router();
const PROVIDERS = [ROLES.INDUSTRY, ROLES.INSTITUTION, ROLES.ADMIN];

// Literal routes before '/:id'.
learningRouter.get('/me/enrollments', authenticate, learnCtrl.listMyEnrollments);
// POST /api/learning/recommend (matching module) — documented endpoint.
learningRouter.post('/recommend', ...recommendLearningRoute);
learningRouter.post(
  '/',
  authenticate,
  requireRole(PROVIDERS),
  validate({ body: createLearningSchema }),
  learnCtrl.createProgram
);
learningRouter.get('/', optionalAuth, validate({ query: listLearningQuery }), learnCtrl.listPrograms);
learningRouter.get('/:id', optionalAuth, validate({ params: idParamSchema }), learnCtrl.getProgram);
learningRouter.put(
  '/:id',
  authenticate,
  requireRole(PROVIDERS),
  validate({ params: idParamSchema, body: updateLearningSchema }),
  learnCtrl.updateProgram
);
learningRouter.delete(
  '/:id',
  authenticate,
  requireRole(PROVIDERS),
  validate({ params: idParamSchema }),
  learnCtrl.deleteProgram
);
learningRouter.post('/:id/enroll', authenticate, validate({ params: idParamSchema }), learnCtrl.enroll);
learningRouter.patch(
  '/:id/progress',
  authenticate,
  validate({ params: idParamSchema, body: progressSchema }),
  learnCtrl.updateProgress
);
learningRouter.post('/:id/complete', authenticate, validate({ params: idParamSchema }), learnCtrl.complete);
