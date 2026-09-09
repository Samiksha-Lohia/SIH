import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import { ROLES } from '../../config/constants.js';
import * as service from './assessment.service.js';

const isPrivileged = (role) => [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY].includes(role);

// ---------- Questions ----------
export const createQuestion = asyncHandler(async (req, res) => {
  const q = await service.createQuestion(req.body, req.user._id);
  sendSuccess(res, { question: q.toJSON() }, { status: 201 });
});

export const listQuestions = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listQuestions(req.query);
  sendSuccess(res, { questions: items.map((q) => q.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});

// ---------- Assessments ----------
export const createAssessment = asyncHandler(async (req, res) => {
  const a = await service.createAssessment(req.body, req.user._id);
  sendSuccess(res, { assessment: a.toJSON() }, { status: 201 });
});

export const listAssessments = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listAssessments(req.query);
  sendSuccess(res, { assessments: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const getAssessment = asyncHandler(async (req, res) => {
  // Privileged roles (creators/admins) see answers; candidates do not.
  const forCandidate = !isPrivileged(req.user.role);
  const assessment = await service.getAssessment(req.params.id, { forCandidate });
  sendSuccess(res, { assessment });
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const a = await service.updateAssessment(req.params.id, req.body);
  sendSuccess(res, { assessment: a.toJSON() });
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  const result = await service.deleteAssessment(req.params.id);
  sendSuccess(res, result);
});

// ---------- Attempts ----------
export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await service.submitAttempt(req.params.id, req.user._id, req.body);
  sendSuccess(res, { attempt: attempt.toJSON() }, { status: 201 });
});

export const getResult = asyncHandler(async (req, res) => {
  const attempt = await service.getAttempt(req.params.attemptId, req.user);
  sendSuccess(res, { attempt: attempt.toJSON() });
});

export const listMyAttempts = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listMyAttempts(req.user._id, req.query);
  sendSuccess(res, { attempts: items.map((a) => a.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});
