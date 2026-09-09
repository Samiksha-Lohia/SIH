import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as service from './notification.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listMine(req.user._id, req.query);
  sendSuccess(res, { notifications: items.map((n) => n.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await service.unreadCount(req.user._id);
  sendSuccess(res, { unread: count });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await service.markRead(req.params.id, req.user._id);
  sendSuccess(res, { notification: n.toJSON() });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await service.markAllRead(req.user._id);
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await service.remove(req.params.id, req.user._id);
  sendSuccess(res, result);
});
