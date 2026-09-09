import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../config/constants.js';
import * as service from './analytics.service.js';

/** GET /api/analytics/skills */
export const skills = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const data = await service.skillDemand({ limit });
  sendSuccess(res, { skills: data });
});

/** POST /api/analytics/skills/recompute (admin) */
export const recomputeSkills = asyncHandler(async (req, res) => {
  const result = await service.recomputeSkillDemand();
  sendSuccess(res, result);
});

/** GET /api/analytics/institution */
export const institution = asyncHandler(async (req, res) => {
  const data = await service.institutionAnalytics();
  sendSuccess(res, data);
});

/** GET /api/analytics/industry */
export const industry = asyncHandler(async (req, res) => {
  const data = await service.industryAnalytics(req.user);
  sendSuccess(res, data);
});

/** GET /api/analytics/student/:id? (self, or admin/institution for another) */
export const student = asyncHandler(async (req, res) => {
  let userId = req.user._id;
  if (req.params.id && String(req.params.id) !== String(req.user._id)) {
    if (![ROLES.ADMIN, ROLES.INSTITUTION].includes(req.user.role)) {
      throw ApiError.forbidden('You cannot view another student\'s analytics', { code: 'NOT_ALLOWED' });
    }
    userId = req.params.id;
  }
  const data = await service.studentAnalytics(userId);
  sendSuccess(res, data);
});
