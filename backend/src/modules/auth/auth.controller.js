import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, result, { status: 201 });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  sendSuccess(res, result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  sendSuccess(res, { user });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  sendSuccess(res, result);
});

/**
 * Stateless JWT: logout is client-side (discard tokens). We acknowledge so the
 * frontend has a consistent endpoint; token blacklisting can be added later.
 */
export const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Logged out. Please discard your tokens.' });
});

/**
 * GET /api/users — list users with pagination, filter by role and status (admin only).
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await authService.listUsers(req.query);
  sendSuccess(res, { users: items }, { meta: paginationMeta({ page, limit, total }) });
});

/**
 * POST /api/users — create a new user (admin only).
 */
export const createUser = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, { user: result.user }, { status: 201 });
});
