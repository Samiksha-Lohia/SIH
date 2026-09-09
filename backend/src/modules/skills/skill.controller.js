import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as skillService from './skill.service.js';
import { normalizeSkillList } from './normalization.service.js';

// ---------- Skills ----------
export const listSkills = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await skillService.listSkills(req.query);
  sendSuccess(res, { skills: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const getSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkill(req.params.id);
  sendSuccess(res, { skill: skill.toJSON() });
});

export const createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.createSkill(req.body);
  sendSuccess(res, { skill: skill.toJSON() }, { status: 201 });
});

export const updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkill(req.params.id, req.body);
  sendSuccess(res, { skill: skill.toJSON() });
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const result = await skillService.deleteSkill(req.params.id);
  sendSuccess(res, result);
});

/** POST /api/skills/normalize — map raw skill labels to canonical taxonomy. */
export const normalize = asyncHandler(async (req, res) => {
  const normalized = await normalizeSkillList(req.body.skills);
  sendSuccess(res, { normalized });
});

// ---------- Roles ----------
export const listRoles = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await skillService.listRoles(req.query);
  sendSuccess(res, { roles: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await skillService.getRole(req.params.id);
  sendSuccess(res, { role: role.toJSON() });
});

export const createRole = asyncHandler(async (req, res) => {
  const role = await skillService.createRole(req.body);
  sendSuccess(res, { role: role.toJSON() }, { status: 201 });
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await skillService.updateRole(req.params.id, req.body);
  sendSuccess(res, { role: role.toJSON() });
});

export const deleteRole = asyncHandler(async (req, res) => {
  const result = await skillService.deleteRole(req.params.id);
  sendSuccess(res, result);
});
