import { User } from './user.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../../utils/token.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', {
      code: 'DB_UNAVAILABLE',
    });
  }
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export async function registerUser({ name, email, password, phone, role = 'student' }) {
  ensureDB();
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('Email is already registered', { code: 'EMAIL_TAKEN' });

  const user = new User({ name, email, phone, role });
  await user.setPassword(password);
  await user.save();

  if (user.role === 'student') {
    try {
      const existingProf = await StudentProfile.findOne({ user: user._id });
      if (!existingProf) {
        await StudentProfile.create({ user: user._id, skills: [], softSkills: [] });
      }
    } catch {
      // Non-blocking if profile exists
    }
  }

  return { user: user.toJSON(), tokens: issueTokens(user) };
}

export async function loginUser({ email, password }) {
  ensureDB();
  // passwordHash is select:false, so request it explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials', { code: 'INVALID_CREDENTIALS' });

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials', { code: 'INVALID_CREDENTIALS' });

  user.lastLogin = new Date();
  await user.save();

  safeAudit({ actor: user._id, actorRole: user.role, action: AUDIT_ACTION.LOGIN, resource: 'User', resourceId: String(user._id) });

  return { user: user.toJSON(), tokens: issueTokens(user) };
}

export async function getCurrentUser(userId) {
  ensureDB();
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function refreshTokens(refreshToken) {
  ensureDB();
  const payload = verifyToken(refreshToken);
  if (payload.type !== 'refresh') {
    throw ApiError.unauthorized('Invalid refresh token', { code: 'INVALID_TOKEN_TYPE' });
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists', { code: 'USER_NOT_FOUND' });
  return { tokens: issueTokens(user) };
}

/**
 * List users with pagination and filters (role, status, search).
 */
export async function listUsers(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;

  const search = query.q || query.search;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items: items.map((u) => u.toJSON()), page, limit, total };
}
