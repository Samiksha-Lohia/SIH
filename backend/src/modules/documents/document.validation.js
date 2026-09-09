import { z } from 'zod';
import { VERIFICATION_STATUS } from '../../config/constants.js';
import { DOCUMENT_TYPE } from './document.model.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

// Multipart form fields arrive as strings; keep this lenient.
export const uploadMetaSchema = z.object({
  type: z.enum(Object.values(DOCUMENT_TYPE)).optional().default(DOCUMENT_TYPE.OTHER),
  title: z.string().max(200).optional(),
  access: z.enum(['private', 'shared', 'public']).optional().default('private'),
});

export const verifySchema = z.object({
  status: z.enum([VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED, VERIFICATION_STATUS.PENDING]),
});

export const listQuery = z.object({
  type: z.enum(Object.values(DOCUMENT_TYPE)).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const idParamSchema = z.object({ id: objectId });
