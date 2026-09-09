import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as service from './skillgap.service.js';

/** GET /api/students/:id/skill-gaps */
export const getSkillGaps = asyncHandler(async (req, res) => {
  const report = await service.getSkillGaps(req.params.id, req.query);
  sendSuccess(res, report);
});

/** GET /api/students/:id/readiness */
export const getReadiness = asyncHandler(async (req, res) => {
  const report = await service.getReadiness(req.params.id, req.query);
  sendSuccess(res, report);
});

/** POST /api/skill-gap/analyze */
export const analyze = asyncHandler(async (req, res) => {
  const report = await service.analyze({ ...req.body, requester: req.user });
  sendSuccess(res, report);
});
