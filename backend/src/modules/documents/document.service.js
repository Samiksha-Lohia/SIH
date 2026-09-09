import { Document } from './document.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { storageService } from '../../services/storage/storage.service.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';
import { ROLES, VERIFICATION_STATUS } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const VERIFIERS = [ROLES.ADMIN, ROLES.INSTITUTION, ROLES.INDUSTRY];

export async function uploadDocument(file, meta, userId) {
  ensureDB();
  if (!file) throw ApiError.badRequest('A file is required', { code: 'NO_FILE' });

  let stored;
  try {
    stored = await storageService.putObject({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      folder: `documents/${userId}`,
    });
  } catch (err) {
    // Surface provider/storage errors as a clean 400 rather than a raw 500.
    throw ApiError.badRequest(`File upload failed: ${err.message}`, { code: 'UPLOAD_FAILED' });
  }

  const doc = await Document.create({
    user: userId,
    type: meta.type,
    title: meta.title || file.originalname,
    filename: file.originalname,
    url: stored.url,
    key: stored.key,
    provider: stored.provider,
    mimeType: stored.mimeType,
    size: stored.size,
    access: meta.access || 'private',
  });
  return doc;
}

export async function listMine(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { user: userId };
  if (query.type) filter.type = query.type;
  const [items, total] = await Promise.all([
    Document.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Document.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

export async function getDocument(id, requester) {
  ensureDB();
  const doc = await Document.findById(id);
  if (!doc) throw ApiError.notFound('Document not found');
  const isOwner = String(doc.user) === String(requester?._id);
  const isPrivileged = requester && VERIFIERS.includes(requester.role);
  if (doc.access === 'private' && !isOwner && !isPrivileged) {
    throw ApiError.forbidden('This document is private', { code: 'PRIVATE_DOCUMENT' });
  }
  return doc;
}

export async function deleteDocument(id, requester) {
  ensureDB();
  const doc = await Document.findById(id);
  if (!doc) throw ApiError.notFound('Document not found');
  const isOwner = String(doc.user) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only delete your own documents', { code: 'NOT_OWNER' });
  }
  await storageService.removeObject(doc.key, doc.provider);
  await doc.deleteOne();
  return { deleted: true, id };
}

export async function verifyDocument(id, status, requester) {
  ensureDB();
  if (!VERIFIERS.includes(requester.role)) {
    throw ApiError.forbidden('Not allowed to verify documents', { code: 'NOT_VERIFIER' });
  }
  const doc = await Document.findById(id);
  if (!doc) throw ApiError.notFound('Document not found');
  doc.verificationStatus = status;
  doc.verifiedBy = requester._id;
  doc.verifiedAt = status === VERIFICATION_STATUS.VERIFIED ? new Date() : undefined;
  await doc.save();
  safeAudit({
    actor: requester._id,
    actorRole: requester.role,
    action: AUDIT_ACTION.DOCUMENT_VERIFY,
    resource: 'Document',
    resourceId: String(doc._id),
    meta: { status },
  });
  return doc;
}
