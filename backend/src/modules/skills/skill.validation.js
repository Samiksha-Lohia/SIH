import { z } from 'zod';
import { SKILL_CATEGORY, PROFICIENCY } from '../../config/constants.js';

const category = z.enum(Object.values(SKILL_CATEGORY));
const proficiency = z.enum(Object.values(PROFICIENCY));

export const createSkillSchema = z.object({
  canonicalName: z.string().min(1).max(100),
  category: category.optional().default(SKILL_CATEGORY.TECHNICAL),
  aliases: z.array(z.string().max(100)).optional().default([]),
  description: z.string().max(1000).optional(),
  proficiencyLevels: z.array(proficiency).optional(),
});

export const updateSkillSchema = z
  .object({
    canonicalName: z.string().min(1).max(100).optional(),
    category: category.optional(),
    aliases: z.array(z.string().max(100)).optional(),
    description: z.string().max(1000).optional(),
    proficiencyLevels: z.array(proficiency).optional(),
    active: z.boolean().optional(),
  })
  .strip();

const mappedSkill = z.object({
  name: z.string().min(1).max(100),
  level: proficiency.optional().default(PROFICIENCY.INTERMEDIATE),
  required: z.boolean().optional().default(true),
  weight: z.number().min(0).max(10).optional().default(1),
});

export const createRoleSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().max(80).optional(),
  description: z.string().max(1000).optional(),
  mappedSkills: z.array(mappedSkill).optional().default([]),
});

export const updateRoleSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    category: z.string().max(80).optional(),
    description: z.string().max(1000).optional(),
    mappedSkills: z.array(mappedSkill).optional(),
    active: z.boolean().optional(),
  })
  .strip();

export const normalizeSchema = z.object({
  skills: z
    .array(z.union([z.string(), z.object({ name: z.string(), level: z.string().optional() })]))
    .min(1),
});

export const listSkillsQuery = z.object({
  q: z.string().max(100).optional(),
  category: category.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  sort: z.string().max(60).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});
