import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as service from './learning.service.js';

export const createProgram = asyncHandler(async (req, res) => {
  const program = await service.createProgram(req.body, req.user);
  sendSuccess(res, { program: program.toJSON() }, { status: 201 });
});

export const listPrograms = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listPrograms(req.query);
  sendSuccess(res, { programs: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const listMyEnrollments = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listMyEnrollments(req.user._id, req.query);
  sendSuccess(res, { enrollments: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const getProgram = asyncHandler(async (req, res) => {
  const program = await service.getProgram(req.params.id);
  sendSuccess(res, { program: program.toJSON() });
});

export const updateProgram = asyncHandler(async (req, res) => {
  const program = await service.updateProgram(req.params.id, req.body, req.user);
  sendSuccess(res, { program: program.toJSON() });
});

export const deleteProgram = asyncHandler(async (req, res) => {
  const result = await service.deleteProgram(req.params.id, req.user);
  sendSuccess(res, result);
});

export const enroll = asyncHandler(async (req, res) => {
  const enrollment = await service.enroll(req.params.id, req.user._id);
  sendSuccess(res, { enrollment }, { status: 201 });
});

export const updateProgress = asyncHandler(async (req, res) => {
  const enrollment = await service.updateProgress(req.params.id, req.user._id, req.body.progress);
  sendSuccess(res, { enrollment });
});

export const complete = asyncHandler(async (req, res) => {
  const enrollment = await service.complete(req.params.id, req.user._id);
  sendSuccess(res, { enrollment });
});
