import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './skillgap.controller.js';
import { analyzeSchema } from './skillgap.validation.js';

/**
 * Ad-hoc skill-gap analysis (/api/skill-gap). Any authenticated user can run an
 * analysis; students without an explicit studentSkills list use their profile.
 */
export const skillGapRouter = Router();
skillGapRouter.post('/analyze', authenticate, validate({ body: analyzeSchema }), ctrl.analyze);

export default skillGapRouter;
