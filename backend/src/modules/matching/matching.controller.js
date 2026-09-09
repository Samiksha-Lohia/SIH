import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../config/constants.js';
import * as service from './matching.service.js';

/**
 * Resolve which student the request targets. Students act on themselves;
 * admins/institutions may target another student via studentId.
 */
function resolveStudentId(req) {
  const { studentId } = req.body;
  const privileged = [ROLES.ADMIN, ROLES.INSTITUTION].includes(req.user.role);
  if (studentId) {
    if (String(studentId) === String(req.user._id) || privileged) return studentId;
    throw ApiError.forbidden('You cannot run matching for another student', { code: 'NOT_ALLOWED' });
  }
  if (req.user.role === ROLES.STUDENT) return req.user._id;
  throw ApiError.badRequest('studentId is required for non-student accounts', { code: 'STUDENT_ID_REQUIRED' });
}

/** POST /api/matching/opportunities */
export const matchOpportunities = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const result = await service.matchOpportunitiesForStudent(studentId, req.body);
  sendSuccess(res, result);
});

/** POST /api/matching/candidates */
export const matchCandidates = asyncHandler(async (req, res) => {
  const result = await service.matchCandidatesForOpportunity(req.body.opportunityId, req.user, req.body);
  sendSuccess(res, result);
});

/** POST /api/learning/recommend */
export const recommendLearning = asyncHandler(async (req, res) => {
  const studentId = resolveStudentId(req);
  const result = await service.recommendLearning(studentId, req.body);
  sendSuccess(res, result);
});
