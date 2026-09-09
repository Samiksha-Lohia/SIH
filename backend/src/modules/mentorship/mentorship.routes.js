import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './mentorship.controller.js';
import {
  requestSchema,
  respondSchema,
  discoverQuery,
  listMineQuery,
  createAcademicSchema,
  updateAcademicSchema,
  interestSchema,
  listAcademicQuery,
  idParamSchema,
} from './mentorship.validation.js';

// --- Mentorship (/api/mentorship) ---
export const mentorshipRouter = Router();
mentorshipRouter.use(authenticate);

mentorshipRouter.get('/mentors', validate({ query: discoverQuery }), ctrl.discoverMentors);
mentorshipRouter.get('/me', validate({ query: listMineQuery }), ctrl.listMine);
mentorshipRouter.post('/', validate({ body: requestSchema }), ctrl.requestMentorship);
mentorshipRouter.patch('/:id/respond', validate({ params: idParamSchema, body: respondSchema }), ctrl.respond);
mentorshipRouter.patch('/:id/complete', validate({ params: idParamSchema }), ctrl.complete);
mentorshipRouter.patch('/:id/cancel', validate({ params: idParamSchema }), ctrl.cancel);

// --- Academician opportunities (/api/academician-opportunities) ---
export const academicianRouter = Router();
academicianRouter.use(authenticate);
const PROVIDERS = [ROLES.INDUSTRY, ROLES.INSTITUTION, ROLES.ADMIN];

academicianRouter.post('/', requireRole(PROVIDERS), validate({ body: createAcademicSchema }), ctrl.createAcademic);
academicianRouter.get('/', validate({ query: listAcademicQuery }), ctrl.listAcademic);
academicianRouter.get('/:id', validate({ params: idParamSchema }), ctrl.getAcademic);
academicianRouter.put(
  '/:id',
  requireRole(PROVIDERS),
  validate({ params: idParamSchema, body: updateAcademicSchema }),
  ctrl.updateAcademic
);
academicianRouter.delete('/:id', requireRole(PROVIDERS), validate({ params: idParamSchema }), ctrl.deleteAcademic);
academicianRouter.post(
  '/:id/interest',
  requireRole(ROLES.FACULTY, ROLES.ADMIN),
  validate({ params: idParamSchema, body: interestSchema }),
  ctrl.expressInterest
);
academicianRouter.get(
  '/:id/interested',
  requireRole(PROVIDERS),
  validate({ params: idParamSchema }),
  ctrl.listInterested
);
