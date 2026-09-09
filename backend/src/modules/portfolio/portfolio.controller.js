import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as service from './portfolio.service.js';

export const createItem = asyncHandler(async (req, res) => {
  const item = await service.createItem(req.user._id, req.body);
  sendSuccess(res, { item: item.toJSON() }, { status: 201 });
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listItems(req.user._id, req.query);
  sendSuccess(res, { items: items.map((i) => i.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await service.getItem(req.params.id, req.user);
  sendSuccess(res, { item: item.toJSON() });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await service.updateItem(req.params.id, req.user, req.body);
  sendSuccess(res, { item: item.toJSON() });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const result = await service.deleteItem(req.params.id, req.user);
  sendSuccess(res, result);
});

export const verifyItem = asyncHandler(async (req, res) => {
  const item = await service.verifyItem(req.params.id, req.body.status, req.user);
  sendSuccess(res, { item: item.toJSON() });
});

/** GET /api/portfolio/share/:userId (public) */
export const getShareView = asyncHandler(async (req, res) => {
  const view = await service.getShareView(req.params.userId);
  sendSuccess(res, view);
});

/** POST /api/portfolio/resume (AI-assisted) */
export const generateResume = asyncHandler(async (req, res) => {
  const result = await service.generateResume(req.user._id);
  sendSuccess(res, result);
});
