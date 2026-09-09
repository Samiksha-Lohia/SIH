import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as service from './application.service.js';

/** POST /api/opportunities/:id/apply (student) */
export const apply = asyncHandler(async (req, res) => {
  const application = await service.apply(req.params.id, req.user._id, req.body);
  sendSuccess(res, { application: application.toJSON() }, { status: 201 });
});

/** GET /api/applications/me (student) */
export const listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listMine(req.user._id, req.query);
  sendSuccess(res, { applications: items }, { meta: paginationMeta({ page, limit, total }) });
});

/** GET /api/applications/:id */
export const getApplication = asyncHandler(async (req, res) => {
  const application = await service.getApplication(req.params.id, req.user);
  sendSuccess(res, { application: application.toJSON() });
});

/** POST /api/applications/:id/withdraw (student) */
export const withdraw = asyncHandler(async (req, res) => {
  const application = await service.withdraw(req.params.id, req.user._id);
  sendSuccess(res, { application: application.toJSON() });
});

/** GET /api/applications/opportunity/:opportunityId (recruiter) */
export const listForOpportunity = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listForOpportunity(
    req.params.opportunityId,
    req.user,
    req.query
  );
  sendSuccess(res, { applications: items }, { meta: paginationMeta({ page, limit, total }) });
});

/** PATCH /api/applications/:id/status (recruiter) */
export const updateStatus = asyncHandler(async (req, res) => {
  const application = await service.updateStatus(req.params.id, req.body.status, req.user, req.body.note);
  sendSuccess(res, { application: application.toJSON() });
});

/** POST /api/applications/:id/notes (recruiter) */
export const addNote = asyncHandler(async (req, res) => {
  const application = await service.addNote(req.params.id, req.body.note, req.user);
  sendSuccess(res, { application: application.toJSON() }, { status: 201 });
});

/** POST /api/applications/:id/interviews (recruiter) */
export const addInterviewStage = asyncHandler(async (req, res) => {
  const application = await service.addInterviewStage(req.params.id, req.body, req.user);
  sendSuccess(res, { application: application.toJSON() }, { status: 201 });
});

/** PATCH /api/applications/:id/interviews/:stageId (recruiter) */
export const updateInterviewStage = asyncHandler(async (req, res) => {
  const application = await service.updateInterviewStage(req.params.id, req.params.stageId, req.body, req.user);
  sendSuccess(res, { application: application.toJSON() });
});
