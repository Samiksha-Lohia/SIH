import { Notification } from './notification.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { emailService } from '../../services/email/email.service.js';
import { logger } from '../../utils/logger.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

/**
 * Create a notification for a user. Optionally also emails the user.
 */
export async function createNotification({ user, type, title, message, link, meta, email = false }) {
  ensureDB();
  const notification = await Notification.create({ user, type, title, message, link, meta });
  if (email) {
    const u = await User.findById(user).select('email').lean();
    if (u?.email) emailService.send({ to: u.email, subject: title, text: message }).catch(() => {});
  }
  return notification;
}

/**
 * Fire-and-forget notification for use inside other services. Never throws, so
 * a notification failure can't break the primary operation.
 */
export async function safeNotify(payload) {
  try {
    if (!isDBConnected()) return null;
    return await createNotification(payload);
  } catch (err) {
    logger.warn(`safeNotify failed: ${err.message}`);
    return null;
  }
}

export async function listMine(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { user: userId };
  if (query.read === 'true') filter.read = true;
  if (query.read === 'false') filter.read = false;
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

export async function unreadCount(userId) {
  ensureDB();
  return Notification.countDocuments({ user: userId, read: false });
}

export async function markRead(id, userId) {
  ensureDB();
  const n = await Notification.findOne({ _id: id, user: userId });
  if (!n) throw ApiError.notFound('Notification not found');
  if (!n.read) {
    n.read = true;
    n.readAt = new Date();
    await n.save();
  }
  return n;
}

export async function markAllRead(userId) {
  ensureDB();
  const res = await Notification.updateMany(
    { user: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return { updated: res.modifiedCount ?? 0 };
}

export async function remove(id, userId) {
  ensureDB();
  const n = await Notification.findOneAndDelete({ _id: id, user: userId });
  if (!n) throw ApiError.notFound('Notification not found');
  return { deleted: true, id };
}
