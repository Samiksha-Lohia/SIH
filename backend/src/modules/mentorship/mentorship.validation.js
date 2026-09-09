import { z } from 'zod';
import { MENTORSHIP_STATUS } from './mentorship.model.js';
import { ACADEMIC_OPP_TYPE } from './academicianOpportunity.model.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const slot = z.object({ day: z.string(), from: z.string(), to: z.string() });

export const requestSchema = z.object({
  mentorId: objectId,
  topic: z.string().min(1).max(200),
  message: z.string().max(2000).optional(),
  slots: z.array(slot).optional(),
});

export const respondSchema = z.object({
  status: z.enum([MENTORSHIP_STATUS.ACCEPTED, MENTORSHIP_STATUS.DECLINED]),
  responseMessage: z.string().max(2000).optional(),
});

export const discoverQuery = z.object({
  expertise: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listMineQuery = z.object({
  as: z.enum(['mentor', 'mentee']).optional(),
  status: z.enum(Object.values(MENTORSHIP_STATUS)).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ---- Academician opportunities ----
export const createAcademicSchema = z.object({
  type: z.enum(Object.values(ACADEMIC_OPP_TYPE)).optional().default(ACADEMIC_OPP_TYPE.FDP),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  providerName: z.string().max(200).optional(),
  areas: z.array(z.string().max(120)).optional(),
  eligibility: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  mode: z.string().max(60).optional(),
  honorarium: z.number().min(0).optional(),
  deadline: z.coerce.date().optional(),
});

export const updateAcademicSchema = createAcademicSchema.partial().strip();

export const interestSchema = z.object({
  message: z.string().max(1000).optional(),
});

export const listAcademicQuery = z.object({
  type: z.enum(Object.values(ACADEMIC_OPP_TYPE)).optional(),
  status: z.string().max(20).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const idParamSchema = z.object({ id: objectId });
