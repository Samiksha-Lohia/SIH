import { z } from 'zod';
import { VERIFICATION_STATUS } from '../../config/constants.js';
import { PORTFOLIO_ITEM_TYPE } from './portfolioItem.model.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

const evidence = z.object({
  label: z.string().max(200).optional(),
  url: z.string().max(500).optional(),
  document: objectId.optional(),
});

export const createItemSchema = z.object({
  type: z.enum(Object.values(PORTFOLIO_ITEM_TYPE)).optional().default(PORTFOLIO_ITEM_TYPE.PROJECT),
  title: z.string().min(1).max(200),
  description: z.string().max(3000).optional(),
  skills: z.array(z.string().max(100)).optional(),
  evidence: z.array(evidence).optional(),
  issuer: z.string().max(200).optional(),
  credentialId: z.string().max(200).optional(),
  issueDate: z.coerce.date().optional(),
  visibility: z.enum(['public', 'private']).optional().default('private'),
});

export const updateItemSchema = createItemSchema.partial().strip();

export const verifySchema = z.object({
  status: z.enum([VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED, VERIFICATION_STATUS.PENDING]),
});

export const listItemsQuery = z.object({
  type: z.enum(Object.values(PORTFOLIO_ITEM_TYPE)).optional(),
  verificationStatus: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const idParamSchema = z.object({ id: objectId });
export const userIdParamSchema = z.object({ userId: objectId });
