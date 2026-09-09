import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './matching.controller.js';
import { matchOpportunitiesSchema, matchCandidatesSchema, recommendLearningSchema } from './matching.validation.js';

/**
 * Matching is compute-heavy (and may call AI), so it is rate-limited more
 * strictly. Candidate matching is restricted to recruiters/admins.
 */
export const matchingRouter = Router();

matchingRouter.post(
  '/opportunities',
  authenticate,
  strictLimiter,
  validate({ body: matchOpportunitiesSchema }),
  ctrl.matchOpportunities
);

matchingRouter.post(
  '/candidates',
  authenticate,
  requireRole(ROLES.INDUSTRY, ROLES.ADMIN),
  strictLimiter,
  validate({ body: matchCandidatesSchema }),
  ctrl.matchCandidates
);

// Exposed so it can be mounted at /api/learning/recommend (per the documented API).
export const recommendLearningRoute = [
  authenticate,
  strictLimiter,
  validate({ body: recommendLearningSchema }),
  ctrl.recommendLearning,
];
