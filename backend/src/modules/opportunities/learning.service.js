import { LearningProgram } from './learningProgram.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { parsePagination } from '../../utils/query.js';
import { ROLES, NOTIFICATION_TYPE } from '../../config/constants.js';
import { safeNotify } from '../notifications/notification.service.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const withSlugs = (skills = []) => skills.map((s) => ({ ...s, slug: slugify(s.name) }));

function assertOwnerOrAdmin(program, user) {
  const isOwner = String(program.createdBy) === String(user._id);
  if (!isOwner && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only manage your own programs', { code: 'NOT_OWNER' });
  }
}

export async function createProgram(data, user) {
  ensureDB();
  return LearningProgram.create({
    ...data,
    skillsCovered: withSlugs(data.skillsCovered),
    createdBy: user._id,
  });
}

export async function listPrograms(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.provider) filter.provider = new RegExp(query.provider.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (query.skill) filter['skillsCovered.slug'] = slugify(query.skill);
  if (query.q) filter.title = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [items, total] = await Promise.all([
    LearningProgram.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LearningProgram.countDocuments(filter),
  ]);
  // Hide the full enrollment roster in list views.
  const sanitized = items.map((p) => {
    const j = p.toJSON();
    delete j.enrollments;
    return j;
  });
  return { items: sanitized, page, limit, total };
}

export async function getProgram(id) {
  ensureDB();
  const program = await LearningProgram.findById(id);
  if (!program) throw ApiError.notFound('Learning program not found');
  return program;
}

export async function updateProgram(id, data, user) {
  ensureDB();
  const program = await LearningProgram.findById(id);
  if (!program) throw ApiError.notFound('Learning program not found');
  assertOwnerOrAdmin(program, user);
  const patch = { ...data };
  if (data.skillsCovered) patch.skillsCovered = withSlugs(data.skillsCovered);
  Object.assign(program, patch);
  await program.save();
  return program;
}

export async function deleteProgram(id, user) {
  ensureDB();
  const program = await LearningProgram.findById(id);
  if (!program) throw ApiError.notFound('Learning program not found');
  assertOwnerOrAdmin(program, user);
  await program.deleteOne();
  return { deleted: true, id };
}

// ---------- Enrollment tracking ----------

function findEnrollment(program, userId) {
  return program.enrollments.find((e) => String(e.user) === String(userId));
}

export async function enroll(id, userId) {
  ensureDB();
  const program = await LearningProgram.findById(id);
  if (!program) throw ApiError.notFound('Learning program not found');
  if (findEnrollment(program, userId)) {
    throw ApiError.conflict('Already enrolled in this program', { code: 'ALREADY_ENROLLED' });
  }
  program.enrollments.push({ user: userId, status: 'enrolled', progress: 0 });
  await program.save();
  return findEnrollment(program, userId);
}

export async function updateProgress(id, userId, progress) {
  ensureDB();
  const program = await LearningProgram.findById(id);
  if (!program) throw ApiError.notFound('Learning program not found');
  const enrollment = findEnrollment(program, userId);
  if (!enrollment) throw ApiError.badRequest('You are not enrolled in this program', { code: 'NOT_ENROLLED' });

  const wasCompleted = enrollment.status === 'completed';
  enrollment.progress = progress;
  if (progress >= 100) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
  } else if (progress > 0) {
    enrollment.status = 'in_progress';
  }
  await program.save();

  // Notify on first completion (non-fatal).
  if (!wasCompleted && enrollment.status === 'completed') {
    safeNotify({
      user: userId,
      type: NOTIFICATION_TYPE.PROGRAM_COMPLETION,
      title: 'Program completed',
      message: `You completed "${program.title}". Add it to your portfolio!`,
      link: `/learning/${program._id}`,
      meta: { programId: String(program._id) },
    });
  }
  return enrollment;
}

export async function complete(id, userId) {
  return updateProgress(id, userId, 100);
}

export async function listMyEnrollments(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { 'enrollments.user': userId };
  const [programs, total] = await Promise.all([
    LearningProgram.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    LearningProgram.countDocuments(filter),
  ]);
  const items = programs.map((p) => {
    const enrollment = findEnrollment(p, userId);
    return {
      program: { id: String(p._id), title: p.title, type: p.type, provider: p.provider },
      enrollment,
    };
  });
  return { items, page, limit, total };
}
