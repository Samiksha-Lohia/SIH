import { Mentorship, MENTORSHIP_STATUS } from './mentorship.model.js';
import { FacultyProfile } from '../profiles/facultyProfile.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { safeNotify } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPE } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

/**
 * Discover available mentors (faculty who opted in to mentorship).
 */
export async function discoverMentors(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { 'availability.openToMentorship': true };
  if (query.expertise) filter.expertise = new RegExp(query.expertise.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [profiles, total] = await Promise.all([
    FacultyProfile.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    FacultyProfile.countDocuments(filter),
  ]);
  const users = await User.find({ _id: { $in: profiles.map((p) => p.user) } }).select('name').lean();
  const nameMap = new Map(users.map((u) => [String(u._id), u.name]));

  const items = profiles.map((p) => ({
    mentorId: String(p.user),
    name: nameMap.get(String(p.user)),
    institution: p.institution,
    designation: p.designation,
    expertise: p.expertise,
    interests: p.interests,
    slots: p.availability?.slots || [],
  }));
  return { items, page, limit, total };
}

export async function requestMentorship(menteeId, { mentorId, topic, message, slots }) {
  ensureDB();
  if (String(mentorId) === String(menteeId)) {
    throw ApiError.badRequest('You cannot request mentorship from yourself', { code: 'SELF_MENTORSHIP' });
  }
  const mentor = await User.findById(mentorId);
  if (!mentor) throw ApiError.notFound('Mentor not found');

  const existing = await Mentorship.findOne({
    mentor: mentorId,
    mentee: menteeId,
    topic,
    status: { $in: [MENTORSHIP_STATUS.REQUESTED, MENTORSHIP_STATUS.ACCEPTED] },
  });
  if (existing) throw ApiError.conflict('An active request for this topic already exists', { code: 'DUPLICATE_REQUEST' });

  const created = await Mentorship.create({ mentor: mentorId, mentee: menteeId, topic, message, slots });

  // Notify the mentor of the new request (non-fatal).
  safeNotify({
    user: mentorId,
    type: NOTIFICATION_TYPE.MENTORSHIP_REQUEST,
    title: 'New mentorship request',
    message: `You have a new mentorship request on "${topic}".`,
    link: `/mentorship/${created._id}`,
    meta: { mentorshipId: String(created._id), topic },
  });

  return created;
}

export async function listMine(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const roleFilter = query.as === 'mentor' ? { mentor: userId } : query.as === 'mentee' ? { mentee: userId } : { $or: [{ mentor: userId }, { mentee: userId }] };
  const filter = { ...roleFilter };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Mentorship.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('mentor', 'name email')
      .populate('mentee', 'name email'),
    Mentorship.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

export async function respond(id, mentorUserId, { status, responseMessage }) {
  ensureDB();
  const mentorship = await Mentorship.findById(id);
  if (!mentorship) throw ApiError.notFound('Mentorship request not found');
  if (String(mentorship.mentor) !== String(mentorUserId)) {
    throw ApiError.forbidden('Only the mentor can respond to this request', { code: 'NOT_MENTOR' });
  }
  if (mentorship.status !== MENTORSHIP_STATUS.REQUESTED) {
    throw ApiError.badRequest(`Cannot respond to a ${mentorship.status} request`, { code: 'INVALID_STATE' });
  }
  mentorship.status = status; // accepted | declined
  mentorship.responseMessage = responseMessage;
  mentorship.respondedAt = new Date();
  await mentorship.save();
  return mentorship;
}

export async function complete(id, requesterId) {
  ensureDB();
  const mentorship = await Mentorship.findById(id);
  if (!mentorship) throw ApiError.notFound('Mentorship not found');
  const isParty = [String(mentorship.mentor), String(mentorship.mentee)].includes(String(requesterId));
  if (!isParty) throw ApiError.forbidden('Not part of this mentorship', { code: 'NOT_PARTY' });
  if (mentorship.status !== MENTORSHIP_STATUS.ACCEPTED) {
    throw ApiError.badRequest('Only accepted mentorships can be completed', { code: 'INVALID_STATE' });
  }
  mentorship.status = MENTORSHIP_STATUS.COMPLETED;
  mentorship.completedAt = new Date();
  await mentorship.save();
  return mentorship;
}

export async function cancel(id, requesterId) {
  ensureDB();
  const mentorship = await Mentorship.findById(id);
  if (!mentorship) throw ApiError.notFound('Mentorship not found');
  if (String(mentorship.mentee) !== String(requesterId)) {
    throw ApiError.forbidden('Only the mentee can cancel this request', { code: 'NOT_MENTEE' });
  }
  if ([MENTORSHIP_STATUS.COMPLETED, MENTORSHIP_STATUS.CANCELLED].includes(mentorship.status)) {
    throw ApiError.badRequest(`Cannot cancel a ${mentorship.status} mentorship`, { code: 'INVALID_STATE' });
  }
  mentorship.status = MENTORSHIP_STATUS.CANCELLED;
  await mentorship.save();
  return mentorship;
}
