import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';
import { ROLES } from '../../config/constants.js';
import * as ctrl from './assessment.controller.js';
import {
  createQuestionSchema,
  createAssessmentSchema,
  updateAssessmentSchema,
  submitSchema,
  listAssessmentsQuery,
  listQuestionsQuery,
  createCampaignSchema,
  listCampaignsQuery,
  idParamSchema,
  attemptParamSchema,
} from './assessment.validation.js';

const router = Router();
const CREATORS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];
const INSTITUTION_ROLES = [ROLES.ADMIN, ROLES.INSTITUTION];

// All assessment routes require authentication.
router.use(authenticate);

// --- Question bank (privileged) --- declared before '/:id' to avoid capture.
router.post('/questions', requireRole(CREATORS), validate({ body: createQuestionSchema }), ctrl.createQuestion);
router.get('/questions', requireRole(CREATORS), validate({ query: listQuestionsQuery }), ctrl.listQuestions);

// --- Campaigns & Cohort Assignments (Institution & Admin) ---
router.get('/campaigns/students', requireRole(INSTITUTION_ROLES), ctrl.listStudentsForInstitution);
router.post('/campaigns', requireRole(INSTITUTION_ROLES), validate({ body: createCampaignSchema }), ctrl.createCampaign);
router.get('/campaigns', requireRole(INSTITUTION_ROLES), validate({ query: listCampaignsQuery }), ctrl.listCampaigns);
router.get('/campaigns/:id', requireRole(INSTITUTION_ROLES), validate({ params: idParamSchema }), ctrl.getCampaign);

// --- Student Assigned Assessments (Personalized for logged-in student) ---
router.get('/my-assignments', ctrl.listMyAssignedAssessments);

// --- Attempt results / history ---
router.get('/results/:attemptId', validate({ params: attemptParamSchema }), ctrl.getResult);
router.get('/attempts/me', ctrl.listMyAttempts);

// --- Assessments ---
router.post('/', requireRole(CREATORS), validate({ body: createAssessmentSchema }), ctrl.createAssessment);
router.get('/', validate({ query: listAssessmentsQuery }), ctrl.listAssessments);

router.post(
  '/:id/submit',
  strictLimiter,
  validate({ params: idParamSchema, body: submitSchema }),
  ctrl.submitAttempt
);
router.get('/:id', validate({ params: idParamSchema }), ctrl.getAssessment);
router.put(
  '/:id',
  requireRole(CREATORS),
  validate({ params: idParamSchema, body: updateAssessmentSchema }),
  ctrl.updateAssessment
);
router.delete('/:id', requireRole(CREATORS), validate({ params: idParamSchema }), ctrl.deleteAssessment);

export default router;
