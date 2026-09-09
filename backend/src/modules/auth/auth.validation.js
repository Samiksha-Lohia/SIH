import { z } from 'zod';
import { ROLE_VALUES, USER_STATUS } from '../../config/constants.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().max(20).optional().default(''),
  role: z.enum(ROLE_VALUES).optional().default('student'),
});

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken is required'),
});

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum(ROLE_VALUES).optional(),
  status: z.enum(Object.values(USER_STATUS)).optional(),
  q: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});
