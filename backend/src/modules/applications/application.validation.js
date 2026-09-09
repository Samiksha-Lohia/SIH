import { z } from 'zod';
import { APPLICATION_STATUS } from '../../config/constants.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const applySchema = z.object({
  coverLetter: z.string().max(3000).optional(),
});

// Recruiter-controllable statuses (withdraw is a student-only action).
export const updateStatusSchema = z.object({
  status: z.enum([
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW,
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ]),
  note: z.string().max(1000).optional(),
});

export const noteSchema = z.object({
  note: z.string().min(1).max(1000),
});

export const interviewStageSchema = z.object({
  name: z.string().min(1).max(120),
  mode: z.enum(['onsite', 'remote', 'phone']).optional().default('remote'),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  feedback: z.string().max(2000).optional(),
  rating: z.number().min(0).max(10).optional(),
});

export const listMineQuery = z.object({
  status: z.enum(Object.values(APPLICATION_STATUS)).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listForOpportunityQuery = z.object({
  status: z.enum(Object.values(APPLICATION_STATUS)).optional(),
  sort: z.string().max(60).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const idParamSchema = z.object({ id: objectId });
export const opportunityIdParamSchema = z.object({ opportunityId: objectId });
export const stageParamSchema = z.object({ id: objectId, stageId: objectId });
