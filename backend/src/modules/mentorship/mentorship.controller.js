import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as mentorship from './mentorship.service.js';
import * as academician from './academician.service.js';

// ---- Mentorship ----
export const discoverMentors = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await mentorship.discoverMentors(req.query);
  sendSuccess(res, { mentors: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const requestMentorship = asyncHandler(async (req, res) => {
  const m = await mentorship.requestMentorship(req.user._id, req.body);
  sendSuccess(res, { mentorship: m.toJSON() }, { status: 201 });
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await mentorship.listMine(req.user._id, req.query);
  sendSuccess(res, { mentorships: items.map((m) => m.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});

export const respond = asyncHandler(async (req, res) => {
  const m = await mentorship.respond(req.params.id, req.user._id, req.body);
  sendSuccess(res, { mentorship: m.toJSON() });
});

export const complete = asyncHandler(async (req, res) => {
  const m = await mentorship.complete(req.params.id, req.user._id);
  sendSuccess(res, { mentorship: m.toJSON() });
});

export const cancel = asyncHandler(async (req, res) => {
  const m = await mentorship.cancel(req.params.id, req.user._id);
  sendSuccess(res, { mentorship: m.toJSON() });
});

// ---- Academician opportunities ----
export const createAcademic = asyncHandler(async (req, res) => {
  const doc = await academician.create(req.body, req.user);
  sendSuccess(res, { opportunity: doc.toJSON() }, { status: 201 });
});

export const listAcademic = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await academician.list(req.query, req.user);
  sendSuccess(res, { opportunities: items.map((d) => (typeof d.toJSON === 'function' ? d.toJSON() : d)) }, { meta: paginationMeta({ page, limit, total }) });
});

export const getAcademic = asyncHandler(async (req, res) => {
  const doc = await academician.get(req.params.id, req.user);
  sendSuccess(res, { opportunity: typeof doc.toJSON === 'function' ? doc.toJSON() : doc });
});

export const updateAcademic = asyncHandler(async (req, res) => {
  const doc = await academician.update(req.params.id, req.body, req.user);
  sendSuccess(res, { opportunity: doc.toJSON() });
});

export const deleteAcademic = asyncHandler(async (req, res) => {
  const result = await academician.remove(req.params.id, req.user);
  sendSuccess(res, result);
});

export const expressInterest = asyncHandler(async (req, res) => {
  const result = await academician.expressInterest(req.params.id, req.user._id, req.body.message);
  sendSuccess(res, result, { status: 201 });
});

export const listInterested = asyncHandler(async (req, res) => {
  const interested = await academician.listInterested(req.params.id, req.user);
  sendSuccess(res, { interested });
});
