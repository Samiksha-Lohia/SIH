import { PortfolioItem } from './portfolioItem.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { aiService } from '../../services/ai/ai.service.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';
import { ROLES, VERIFICATION_STATUS } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const VERIFIERS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];

export async function createItem(userId, data) {
  ensureDB();
  return PortfolioItem.create({ ...data, user: userId, verificationStatus: VERIFICATION_STATUS.UNVERIFIED });
}

export async function listItems(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = { user: userId };
  if (query.type) filter.type = query.type;
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  const [items, total] = await Promise.all([
    PortfolioItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PortfolioItem.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

async function loadOwned(id, requester) {
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  const isOwner = String(item.user) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only manage your own portfolio', { code: 'NOT_OWNER' });
  }
  return item;
}

export async function getItem(id, requester) {
  ensureDB();
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  const isOwner = String(item.user) === String(requester?._id);
  const isPrivileged = requester && VERIFIERS.includes(requester.role);
  if (item.visibility === 'private' && !isOwner && !isPrivileged) {
    throw ApiError.forbidden('This portfolio item is private', { code: 'PRIVATE_ITEM' });
  }
  return item;
}

export async function updateItem(id, requester, data) {
  ensureDB();
  const item = await loadOwned(id, requester);
  // Re-verification is required after content edits.
  const contentChanged = ['title', 'description', 'evidence', 'issuer', 'credentialId'].some((k) => k in data);
  Object.assign(item, data);
  if (contentChanged && requester.role === ROLES.STUDENT) {
    item.verificationStatus = VERIFICATION_STATUS.UNVERIFIED;
    item.verifiedBy = undefined;
    item.verifiedAt = undefined;
  }
  await item.save();
  return item;
}

export async function deleteItem(id, requester) {
  ensureDB();
  const item = await loadOwned(id, requester);
  await item.deleteOne();
  return { deleted: true, id };
}

export async function verifyItem(id, status, requester) {
  ensureDB();
  if (!VERIFIERS.includes(requester.role)) {
    throw ApiError.forbidden('Not allowed to verify portfolio items', { code: 'NOT_VERIFIER' });
  }
  const item = await PortfolioItem.findById(id);
  if (!item) throw ApiError.notFound('Portfolio item not found');
  item.verificationStatus = status;
  item.verifiedBy = requester._id;
  item.verifiedAt = status === VERIFICATION_STATUS.VERIFIED ? new Date() : undefined;
  await item.save();
  safeAudit({
    actor: requester._id,
    actorRole: requester.role,
    action: AUDIT_ACTION.PORTFOLIO_VERIFY,
    resource: 'PortfolioItem',
    resourceId: String(item._id),
    meta: { status },
  });
  return item;
}

/**
 * Public share view: the owner's public portfolio items plus a light profile
 * summary. No auth required (optionalAuth on the route).
 */
export async function getShareView(userId) {
  ensureDB();
  const user = await User.findById(userId).select('name role');
  if (!user) throw ApiError.notFound('User not found');

  const items = await PortfolioItem.find({ user: userId, visibility: 'public' }).sort({ createdAt: -1 });
  const profile = await StudentProfile.findOne({ user: userId }).select('skills careerGoals completeness');

  return {
    user: { id: String(user._id), name: user.name, role: user.role },
    summary: profile
      ? {
          completeness: profile.completeness,
          topSkills: (profile.skills || []).slice(0, 10),
          targetRoles: profile.careerGoals?.targetRoles || [],
        }
      : null,
    verifiedCount: items.filter((i) => i.verificationStatus === VERIFICATION_STATUS.VERIFIED).length,
    items: items.map((i) => i.toJSON()),
  };
}

/**
 * AI-assisted resume generation from the student's profile + verified items.
 */
export async function generateResume(userId) {
  ensureDB();
  const [user, profile, items] = await Promise.all([
    User.findById(userId).select('name email'),
    StudentProfile.findOne({ user: userId }),
    PortfolioItem.find({ user: userId }),
  ]);
  if (!profile) throw ApiError.badRequest('Complete your profile before generating a resume', { code: 'NO_PROFILE' });

  const payload = {
    name: user?.name,
    email: user?.email,
    skills: profile.skills,
    softSkills: profile.softSkills,
    projects: profile.projects,
    certifications: profile.certifications,
    education: profile.education,
    careerGoals: profile.careerGoals,
    achievements: profile.achievements,
    portfolio: items.map((i) => ({ type: i.type, title: i.title, verified: i.verificationStatus })),
  };

  const resume = await aiService.generateResume(payload);
  return { source: resume._meta?.source || aiService.mode, resume };
}
