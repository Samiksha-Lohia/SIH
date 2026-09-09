import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import { uploadMetaSchema } from './document.validation.js';
import * as service from './document.service.js';

/** POST /api/documents (multipart) */
export const uploadDocument = asyncHandler(async (req, res) => {
  // Body fields arrive as strings from multipart; validate/coerce here.
  const meta = uploadMetaSchema.parse(req.body || {});
  const doc = await service.uploadDocument(req.file, meta, req.user._id);
  sendSuccess(res, { document: doc.toJSON() }, { status: 201 });
});

export const listMine = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await service.listMine(req.user._id, req.query);
  sendSuccess(res, { documents: items.map((d) => d.toJSON()) }, { meta: paginationMeta({ page, limit, total }) });
});

export const getDocument = asyncHandler(async (req, res) => {
  const doc = await service.getDocument(req.params.id, req.user);
  sendSuccess(res, { document: doc.toJSON() });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await service.deleteDocument(req.params.id, req.user);
  sendSuccess(res, result);
});

export const verifyDocument = asyncHandler(async (req, res) => {
  const doc = await service.verifyDocument(req.params.id, req.body.status, req.user);
  sendSuccess(res, { document: doc.toJSON() });
});
