import { z } from 'zod';
import { OPPORTUNITY_TYPE } from '../../config/constants.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const matchOpportunitiesSchema = z.object({
  studentId: objectId.optional(), // admin/institution can target another student
  type: z.enum(Object.values(OPPORTUNITY_TYPE)).optional(),
  location: z.string().max(120).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const matchCandidatesSchema = z.object({
  opportunityId: objectId,
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const recommendLearningSchema = z.object({
  studentId: objectId.optional(),
  role: z.string().max(120).optional(),
  roleId: objectId.optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});
