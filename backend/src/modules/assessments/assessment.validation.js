import { z } from 'zod';
import { ASSESSMENT_TYPE, DIFFICULTY } from '../../config/constants.js';

const type = z.enum(Object.values(ASSESSMENT_TYPE));
const difficulty = z.enum(Object.values(DIFFICULTY));
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const createQuestionSchema = z.object({
  text: z.string().min(1).max(2000),
  type: type.optional().default(ASSESSMENT_TYPE.TECHNICAL),
  skill: z.string().max(100).optional(),
  difficulty: difficulty.optional().default(DIFFICULTY.INTERMEDIATE),
  options: z
    .array(z.object({ key: z.string().min(1).max(8), text: z.string().min(1).max(500) }))
    .min(2, 'At least two options are required'),
  correctKeys: z.array(z.string().min(1).max(8)).min(1, 'At least one correct key is required'),
  points: z.number().min(0).max(100).optional().default(1),
  explanation: z.string().max(2000).optional(),
});

export const createAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: type.optional().default(ASSESSMENT_TYPE.TECHNICAL),
  role: z.string().max(120).optional(),
  skillSet: z.array(z.string().max(100)).optional().default([]),
  difficulty: difficulty.optional().default(DIFFICULTY.INTERMEDIATE),
  questionIds: z.array(objectId).optional().default([]),
  durationMinutes: z.number().int().min(1).max(600).optional().default(30),
  passingScore: z.number().min(0).max(100).optional().default(50),
});

export const updateAssessmentSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    type: type.optional(),
    role: z.string().max(120).optional(),
    skillSet: z.array(z.string().max(100)).optional(),
    difficulty: difficulty.optional(),
    questionIds: z.array(objectId).optional(),
    durationMinutes: z.number().int().min(1).max(600).optional(),
    passingScore: z.number().min(0).max(100).optional(),
    active: z.boolean().optional(),
  })
  .strip();

export const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: objectId,
        selected: z.array(z.string().max(8)).default([]),
      })
    )
    .min(1, 'At least one answer is required'),
  startedAt: z.coerce.date().optional(),
  applyToProfile: z.boolean().optional().default(true),
});

export const listAssessmentsQuery = z.object({
  role: z.string().max(120).optional(),
  type: type.optional(),
  difficulty: difficulty.optional(),
  skill: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().max(60).optional(),
});

export const listQuestionsQuery = z.object({
  skill: z.string().max(100).optional(),
  type: type.optional(),
  difficulty: difficulty.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const idParamSchema = z.object({ id: objectId });
export const attemptParamSchema = z.object({ attemptId: objectId });
