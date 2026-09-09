import { AuditLog } from './auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { logger } from '../../utils/logger.js';

/**
 * Record an audit entry. Fire-and-forget: never throws so it can't break the
 * primary operation.
 */
export async function safeAudit({ actor, actorRole, action, resource, resourceId, meta, ip }) {
  try {
    if (!isDBConnected()) return null;
    return await AuditLog.create({ actor, actorRole, action, resource, resourceId, meta, ip });
  } catch (err) {
    logger.warn(`safeAudit failed: ${err.message}`);
    return null;
  }
}

export async function listAudit(query) {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.actor) filter.actor = query.actor;
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

// Well-known audit action names.
export const AUDIT_ACTION = Object.freeze({
  LOGIN: 'auth.login',
  APPLICATION_STATUS: 'application.status_change',
  PORTFOLIO_VERIFY: 'portfolio.verify',
  DOCUMENT_VERIFY: 'document.verify',
  COMPANY_VERIFY: 'company.verify',
  INSTITUTION_VERIFY: 'institution.verify',
});
