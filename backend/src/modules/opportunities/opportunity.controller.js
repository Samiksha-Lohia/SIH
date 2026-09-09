import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as service from './opportunity.service.js';

export const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await service.createOpportunity(req.body, req.user);
  sendSuccess(res, { opportunity: opportunity.toJSON() }, { status: 201 });
});

export const listOpportunities = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listOpportunities(req.query, req.user);
  sendSuccess(res, { opportunities: items }, { meta: paginationMeta({ page, limit, total }) });
});

export const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await service.getOpportunity(req.params.id);
  sendSuccess(res, { opportunity: opportunity.toJSON() });
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await service.updateOpportunity(req.params.id, req.body, req.user);
  sendSuccess(res, { opportunity: opportunity.toJSON() });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const opportunity = await service.changeStatus(req.params.id, req.body.status, req.user);
  sendSuccess(res, { opportunity: opportunity.toJSON() });
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  const result = await service.deleteOpportunity(req.params.id, req.user);
  sendSuccess(res, result);
});
