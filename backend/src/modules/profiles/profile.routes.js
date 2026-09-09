import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole, requireSelfOrRoles } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { audioUpload } from '../../middleware/upload.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './profile.controller.js';
import * as skillGapCtrl from '../skillgap/skillgap.controller.js';
import { targetRoleQuery } from '../skillgap/skillgap.validation.js';
import {
  updateStudentSchema,
  updateFacultySchema,
  updateInstitutionSchema,
  updateIndustrySchema,
  voiceProfileSchema,
  idParamSchema,
  listInstitutionsQuery,
  listIndustriesQuery,
  verifyProfileSchema,
} from './profile.validation.js';

/**
 * Profile routes. `:id` is the owning user's id. Read access is granted to the
 * owner plus roles that legitimately need profiles (admin, and recruiters/
 * institutions for candidate discovery). Writes are owner-or-admin only.
 */

// --- Students (/api/students) ---
export const studentRouter = Router();
studentRouter.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY),
  ctrl.studentHandlers.get
);
studentRouter.put(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateStudentSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  ctrl.studentHandlers.update
);
studentRouter.post(
  '/:id/voice-profile',
  authenticate,
  validate({ params: idParamSchema, body: voiceProfileSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  ctrl.voiceProfile
);
studentRouter.post(
  '/:id/voice-transcribe',
  authenticate,
  validate({ params: idParamSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  audioUpload.single('audio'),
  ctrl.voiceTranscribe
);
// Skill-gap + readiness reports (Batch 5) live under the student resource.
studentRouter.get(
  '/:id/skill-gaps',
  authenticate,
  validate({ params: idParamSchema, query: targetRoleQuery }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY),
  skillGapCtrl.getSkillGaps
);
studentRouter.get(
  '/:id/readiness',
  authenticate,
  validate({ params: idParamSchema, query: targetRoleQuery }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY),
  skillGapCtrl.getReadiness
);

// --- Faculty (/api/faculty) ---
export const facultyRouter = Router();
facultyRouter.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY),
  ctrl.facultyHandlers.get
);
facultyRouter.put(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateFacultySchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  ctrl.facultyHandlers.update
);

// --- Institutions (/api/institutions) ---
export const institutionRouter = Router();
institutionRouter.get(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ query: listInstitutionsQuery }),
  ctrl.listInstitutions
);
institutionRouter.patch(
  '/:id/verify',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema, body: verifyProfileSchema }),
  ctrl.verifyInstitution
);
institutionRouter.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INDUSTRY),
  ctrl.institutionHandlers.get
);
institutionRouter.put(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateInstitutionSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  ctrl.institutionHandlers.update
);

// --- Industries (/api/industries) ---
export const industryRouter = Router();
industryRouter.get(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ query: listIndustriesQuery }),
  ctrl.listIndustries
);
industryRouter.patch(
  '/:id/verify',
  authenticate,
  requireRole(ROLES.ADMIN),
  validate({ params: idParamSchema, body: verifyProfileSchema }),
  ctrl.verifyIndustry
);
industryRouter.get(
  '/:id',
  authenticate,
  validate({ params: idParamSchema }),
  requireSelfOrRoles('id', ROLES.ADMIN, ROLES.INSTITUTION),
  ctrl.industryHandlers.get
);
industryRouter.put(
  '/:id',
  authenticate,
  validate({ params: idParamSchema, body: updateIndustrySchema }),
  requireSelfOrRoles('id', ROLES.ADMIN),
  ctrl.industryHandlers.update
);

// --- Current user's profile (/api/profiles) ---
export const profilesRouter = Router();
profilesRouter.get('/me', authenticate, ctrl.getMyProfile);
