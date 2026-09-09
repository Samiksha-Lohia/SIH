import { Opportunity } from './opportunity.model.js';
import { Industry } from '../profiles/industry.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { parsePagination, parseSort } from '../../utils/query.js';
import { ROLES, OPPORTUNITY_STATUS, VERIFICATION_STATUS } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const withSlugs = (skills = []) => skills.map((s) => ({ ...s, slug: slugify(s.name) }));

function assertOwnerOrAdmin(opportunity, user) {
  const isOwner = String(opportunity.company) === String(user._id);
  if (!isOwner && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only manage your own opportunities', { code: 'NOT_OWNER' });
  }
}

export async function createOpportunity(data, user) {
  ensureDB();
  // Denormalize company name from the industry profile if present.
  const industry = await Industry.findOne({ user: user._id });
  const opportunity = await Opportunity.create({
    ...data,
    requiredSkills: withSlugs(data.requiredSkills),
    preferredSkills: withSlugs(data.preferredSkills),
    company: user._id,
    companyName: industry?.companyName,
    createdBy: user._id,
    status: OPPORTUNITY_STATUS.DRAFT,
  });
  return opportunity;
}

export async function listOpportunities(query, requester) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};

  // Visibility: non-owners see only published opportunities by default.
  const isPrivileged = requester && [ROLES.ADMIN].includes(requester.role);
  if (query.mine && requester) {
    filter.company = requester._id;
  } else if (query.company) {
    filter.company = query.company;
  }

  if (query.status) {
    filter.status = query.status;
  } else if (!query.mine && !isPrivileged) {
    filter.status = OPPORTUNITY_STATUS.PUBLISHED;
  }

  if (query.type) filter.type = query.type;
  if (query.location) filter.location = new RegExp(query.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.workMode) filter.workMode = query.workMode;
  if (query.role) filter.role = new RegExp(query.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.skill) {
    const s = slugify(query.skill);
    filter.$or = [{ 'requiredSkills.slug': s }, { 'preferredSkills.slug': s }];
  }
  if (query.q) filter.title = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const sort = parseSort(query.sort, { createdAt: -1 });
  const [docs, total] = await Promise.all([
    Opportunity.find(filter).sort(sort).skip(skip).limit(limit),
    Opportunity.countDocuments(filter),
  ]);
  return { items: docs.map((d) => d.toJSON()), page, limit, total };
}

export async function getOpportunity(id) {
  ensureDB();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  return opportunity;
}

export async function updateOpportunity(id, data, user) {
  ensureDB();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(opportunity, user);

  const patch = { ...data };
  if (data.requiredSkills) patch.requiredSkills = withSlugs(data.requiredSkills);
  if (data.preferredSkills) patch.preferredSkills = withSlugs(data.preferredSkills);
  Object.assign(opportunity, patch);
  await opportunity.save();
  return opportunity;
}

/**
 * Change publish status. Publishing enforces the trust framework: only a
 * verified company (or admin) can publish; a verification badge is then set.
 */
export async function changeStatus(id, status, user) {
  ensureDB();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(opportunity, user);

  if (status === OPPORTUNITY_STATUS.PUBLISHED) {
    if (user.role !== ROLES.ADMIN) {
      const industry = await Industry.findOne({ user: opportunity.company });
      if (!industry || industry.verificationStatus !== VERIFICATION_STATUS.VERIFIED) {
        throw ApiError.forbidden(
          'Company must be verified before publishing opportunities',
          { code: 'COMPANY_NOT_VERIFIED' }
        );
      }
      opportunity.verificationBadge = true;
    } else {
      const industry = await Industry.findOne({ user: opportunity.company });
      opportunity.verificationBadge = industry?.verificationStatus === VERIFICATION_STATUS.VERIFIED;
    }
  }

  opportunity.status = status;
  await opportunity.save();
  return opportunity;
}

export async function deleteOpportunity(id, user) {
  ensureDB();
  const opportunity = await Opportunity.findById(id);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(opportunity, user);
  await opportunity.deleteOne();
  return { deleted: true, id };
}
