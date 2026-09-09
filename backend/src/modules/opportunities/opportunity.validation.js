import { z } from 'zod';
import {
  OPPORTUNITY_TYPE,
  OPPORTUNITY_STATUS,
  WORK_MODE,
  PROFICIENCY,
  LEARNING_PROGRAM_TYPE,
} from '../../config/constants.js';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
const proficiency = z.enum(Object.values(PROFICIENCY));

const skillReq = z.object({
  name: z.string().min(1).max(100),
  level: proficiency.optional().default(PROFICIENCY.INTERMEDIATE),
  weight: z.number().min(0).max(10).optional().default(1),
});

const eligibility = z.object({
  minCgpa: z.number().min(0).max(10).optional(),
  graduationYears: z.array(z.number().int()).optional(),
  branches: z.array(z.string().max(120)).optional(),
  notes: z.string().max(1000).optional(),
});

export const createOpportunitySchema = z.object({
  type: z.enum(Object.values(OPPORTUNITY_TYPE)).optional().default(OPPORTUNITY_TYPE.INTERNSHIP),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  role: z.string().max(120).optional(),
  requiredSkills: z.array(skillReq).optional().default([]),
  preferredSkills: z.array(skillReq).optional().default([]),
  eligibility: eligibility.optional(),
  location: z.string().max(200).optional(),
  workMode: z.enum(Object.values(WORK_MODE)).optional().default(WORK_MODE.ONSITE),
  duration: z.string().max(100).optional(),
  stipend: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  openings: z.number().int().min(1).optional().default(1),
  deadline: z.coerce.date().optional(),
});

export const updateOpportunitySchema = createOpportunitySchema.partial().strip();

export const statusSchema = z.object({
  status: z.enum([OPPORTUNITY_STATUS.PUBLISHED, OPPORTUNITY_STATUS.PAUSED, OPPORTUNITY_STATUS.CLOSED, OPPORTUNITY_STATUS.DRAFT]),
});

export const listOpportunitiesQuery = z.object({
  q: z.string().max(120).optional(),
  type: z.enum(Object.values(OPPORTUNITY_TYPE)).optional(),
  status: z.enum(Object.values(OPPORTUNITY_STATUS)).optional(),
  location: z.string().max(120).optional(),
  workMode: z.enum(Object.values(WORK_MODE)).optional(),
  skill: z.string().max(100).optional(),
  role: z.string().max(120).optional(),
  company: objectId.optional(),
  mine: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(60).optional(),
});

// ---------- Learning programs ----------
const coveredSkill = z.object({
  name: z.string().min(1).max(100),
  level: proficiency.optional().default(PROFICIENCY.INTERMEDIATE),
});

export const createLearningSchema = z.object({
  type: z.enum(Object.values(LEARNING_PROGRAM_TYPE)).optional().default(LEARNING_PROGRAM_TYPE.TRAINING),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  provider: z.string().max(200).optional(),
  skillsCovered: z.array(coveredSkill).optional().default([]),
  duration: z.string().max(100).optional(),
  eligibility: z.string().max(1000).optional(),
  fee: z.number().min(0).optional().default(0),
  stipend: z.number().min(0).optional(),
  schedule: z.string().max(500).optional(),
  completionCriteria: z.string().max(1000).optional(),
  certificate: z.boolean().optional().default(false),
});

export const updateLearningSchema = createLearningSchema.partial().strip();

export const progressSchema = z.object({
  progress: z.number().min(0).max(100),
});

export const listLearningQuery = z.object({
  q: z.string().max(120).optional(),
  type: z.enum(Object.values(LEARNING_PROGRAM_TYPE)).optional(),
  skill: z.string().max(100).optional(),
  provider: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const idParamSchema = z.object({ id: objectId });
