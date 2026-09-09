import { AcademicianOpportunity } from './academicianOpportunity.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { ROLES } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

function assertOwnerOrAdmin(doc, user) {
  const isOwner = String(doc.provider) === String(user._id);
  if (!isOwner && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only manage your own postings', { code: 'NOT_OWNER' });
  }
}

export async function create(data, user) {
  ensureDB();
  return AcademicianOpportunity.create({
    ...data,
    provider: user._id,
    providerName: data.providerName,
    createdBy: user._id,
  });
}

export async function list(query, user) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  else filter.status = 'published';
  if (query.q) filter.title = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [items, total] = await Promise.all([
    AcademicianOpportunity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AcademicianOpportunity.countDocuments(filter),
  ]);

  const userIdStr = user?._id ? String(user._id) : (user?.id ? String(user.id) : null);

  const mapped = items.map((doc) => {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    if (obj._id && !obj.id) obj.id = String(obj._id);
    const hasApplied = !!(userIdStr && Array.isArray(doc.interested) && doc.interested.some((i) => String(i.user) === userIdStr));
    obj.hasApplied = hasApplied;
    obj.isInterested = hasApplied;
    obj.interestedCount = Array.isArray(doc.interested) ? doc.interested.length : 0;
    delete obj.interested;
    return obj;
  });

  return { items: mapped, page, limit, total };
}

export async function get(id, user) {
  ensureDB();
  const doc = await AcademicianOpportunity.findById(id);
  if (!doc) throw ApiError.notFound('Opportunity not found');

  const userIdStr = user?._id ? String(user._id) : (user?.id ? String(user.id) : null);
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj._id && !obj.id) obj.id = String(obj._id);
  const hasApplied = !!(userIdStr && Array.isArray(doc.interested) && doc.interested.some((i) => String(i.user) === userIdStr));
  obj.hasApplied = hasApplied;
  obj.isInterested = hasApplied;
  obj.interestedCount = Array.isArray(doc.interested) ? doc.interested.length : 0;
  delete obj.interested;

  return obj;
}

export async function update(id, data, user) {
  ensureDB();
  const doc = await AcademicianOpportunity.findById(id);
  if (!doc) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(doc, user);
  Object.assign(doc, data);
  await doc.save();
  return doc;
}

export async function remove(id, user) {
  ensureDB();
  const doc = await AcademicianOpportunity.findById(id);
  if (!doc) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(doc, user);
  await doc.deleteOne();
  return { deleted: true, id };
}

export async function expressInterest(id, userId, message) {
  ensureDB();
  const doc = await AcademicianOpportunity.findById(id);
  if (!doc) throw ApiError.notFound('Opportunity not found');
  if (doc.interested.some((i) => String(i.user) === String(userId))) {
    throw ApiError.conflict('You have already expressed interest', { code: 'ALREADY_INTERESTED' });
  }
  doc.interested.push({ user: userId, message });
  await doc.save();
  return { interested: true, interestedCount: doc.interested.length };
}

export async function listInterested(id, user) {
  ensureDB();
  const doc = await AcademicianOpportunity.findById(id).populate('interested.user', 'name email');
  if (!doc) throw ApiError.notFound('Opportunity not found');
  assertOwnerOrAdmin(doc, user);
  return doc.interested;
}
