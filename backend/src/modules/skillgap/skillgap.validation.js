import { z } from 'zod';
import { PROFICIENCY } from '../../config/constants.js';

const proficiency = z.enum(Object.values(PROFICIENCY));
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const targetRoleQuery = z.object({
  role: z.string().max(120).optional(),
  roleId: objectId.optional(),
});

export const analyzeSchema = z.object({
  role: z.string().max(120).optional(),
  roleId: objectId.optional(),
  requiredSkills: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        level: proficiency.optional().default(PROFICIENCY.INTERMEDIATE),
        required: z.boolean().optional().default(true),
        weight: z.number().min(0).max(10).optional().default(1),
      })
    )
    .optional(),
  studentSkills: z
    .array(z.object({ name: z.string().min(1).max(100), level: proficiency.optional() }))
    .optional(),
});

export const idParamSchema = z.object({ id: objectId });
