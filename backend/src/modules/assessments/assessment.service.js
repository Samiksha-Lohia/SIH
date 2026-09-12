import { Assessment } from './assessment.model.js';
import { Question } from './question.model.js';
import { AssessmentAttempt } from './attempt.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { computeStudentCompleteness } from '../profiles/completeness.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination, parseSort } from '../../utils/query.js';
import { PROFICIENCY_LEVEL } from '../../config/constants.js';
import { scoreAttempt } from './scoring.js';
import { recordCampaignAttempt } from './campaign.service.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

// ---------- Questions (bank) ----------

export async function createQuestion(data, userId) {
  ensureDB();
  return Question.create({ ...data, createdBy: userId });
}

export async function listQuestions(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (query.skill) filter.skill = query.skill;
  if (query.type) filter.type = query.type;
  if (query.difficulty) filter.difficulty = query.difficulty;
  const [items, total] = await Promise.all([
    Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Question.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

// ---------- Assessments ----------

export async function createAssessment(data, userId) {
  ensureDB();
  // Validate referenced questions exist.
  if (data.questionIds?.length) {
    const count = await Question.countDocuments({ _id: { $in: data.questionIds } });
    if (count !== data.questionIds.length) {
      throw ApiError.badRequest('One or more questionIds are invalid', { code: 'INVALID_QUESTION_IDS' });
    }
  }
  return Assessment.create({ ...data, createdBy: userId });
}

export async function listAssessments(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { active: true };
  if (query.role) filter.role = query.role;
  if (query.type) filter.type = query.type;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.skill) filter.skillSet = query.skill;
  const sort = parseSort(query.sort, { createdAt: -1 });
  const [docs, total] = await Promise.all([
    Assessment.find(filter).sort(sort).skip(skip).limit(limit),
    Assessment.countDocuments(filter),
  ]);
  return { items: docs.map((d) => d.toJSON()), page, limit, total };
}

/**
 * Fetch an assessment. When `forCandidate` is true, questions are returned
 * WITHOUT correct answers or explanations.
 */
export async function getAssessment(id, { forCandidate = true } = {}) {
  ensureDB();
  const assessment = await Assessment.findById(id).populate('questionIds');
  if (!assessment) throw ApiError.notFound('Assessment not found');

  const questions = assessment.questionIds || [];
  const json = assessment.toJSON();
  json.questions = forCandidate ? questions.map((q) => q.toPublicJSON()) : questions.map((q) => q.toJSON());
  json.questionCount = questions.length;
  json.totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  delete json.questionIds;
  return json;
}

export async function updateAssessment(id, data) {
  ensureDB();
  const assessment = await Assessment.findById(id);
  if (!assessment) throw ApiError.notFound('Assessment not found');
  if (data.questionIds?.length) {
    const count = await Question.countDocuments({ _id: { $in: data.questionIds } });
    if (count !== data.questionIds.length) {
      throw ApiError.badRequest('One or more questionIds are invalid', { code: 'INVALID_QUESTION_IDS' });
    }
  }
  Object.assign(assessment, data);
  await assessment.save();
  return assessment;
}

export async function deleteAssessment(id) {
  ensureDB();
  const a = await Assessment.findByIdAndDelete(id);
  if (!a) throw ApiError.notFound('Assessment not found');
  return { deleted: true, id };
}

/**
 * Merge assessment-derived proficiency into the student's profile skills,
 * taking the higher of the existing vs. derived level. This is what makes
 * "assessment-derived skill scores" available to the matching engine.
 */
async function applySkillScoresToProfile(userId, skillScores) {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) return;
  const bySlug = new Map((profile.skills || []).map((s) => [s.name.toLowerCase(), s]));
  for (const ss of skillScores) {
    if (ss.skill === 'general') continue;
    const existing = bySlug.get(ss.skill.toLowerCase());
    if (existing) {
      const cur = PROFICIENCY_LEVEL[existing.level] || 0;
      const next = PROFICIENCY_LEVEL[ss.level] || 0;
      if (next > cur) existing.level = ss.level;
    } else {
      profile.skills.push({ name: ss.skill, level: ss.level });
    }
  }
  profile.completeness = computeStudentCompleteness(profile.toObject());
  await profile.save();
}

/**
 * Submit an attempt: score it, persist, and (for students) update profile skills.
 */
export async function submitAttempt(assessmentId, userId, { answers, startedAt, applyToProfile = true, campaignId }) {
  ensureDB();
  const assessment = await Assessment.findById(assessmentId).populate('questionIds');
  if (!assessment) throw ApiError.notFound('Assessment not found');

  const questions = assessment.questionIds || [];
  if (questions.length === 0) {
    throw ApiError.badRequest('Assessment has no questions', { code: 'EMPTY_ASSESSMENT' });
  }

  const result = scoreAttempt(questions, answers, assessment.passingScore);

  const startedDate = startedAt ? new Date(startedAt) : undefined;
  const completedAt = new Date();
  const durationSec = startedDate ? Math.max(0, Math.round((completedAt - startedDate) / 1000)) : undefined;

  const attempt = await AssessmentAttempt.create({
    assessment: assessment._id,
    user: userId,
    answers: result.evaluated,
    rawScore: result.rawScore,
    maxScore: result.maxScore,
    score: result.score,
    skillScores: result.skillScores,
    passed: result.passed,
    startedAt: startedDate,
    completedAt,
    durationSec,
  });

  if (applyToProfile) {
    try {
      await applySkillScoresToProfile(userId, result.skillScores);
    } catch {
      // Non-fatal: scoring still succeeds even if profile update fails.
    }
  }

  if (campaignId) {
    try {
      await recordCampaignAttempt(campaignId, userId, attempt);
    } catch {
      // Non-fatal: scoring still succeeds
    }
  }

  return attempt;
}

export async function getAttempt(attemptId, requester) {
  ensureDB();
  const attempt = await AssessmentAttempt.findById(attemptId).populate('assessment', 'title type role passingScore durationMinutes');
  if (!attempt) throw ApiError.notFound('Attempt not found');
  // Only the owner or privileged roles may view an attempt result.
  const isOwner = String(attempt.user) === String(requester._id);
  const privileged = ['admin', 'institution'].includes(requester.role);
  if (!isOwner && !privileged) {
    throw ApiError.forbidden('You cannot view this attempt', { code: 'NOT_OWNER' });
  }
  return attempt;
}

export async function listMyAttempts(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { user: userId };
  if (query.assessmentId) filter.assessment = query.assessmentId;
  const [items, total] = await Promise.all([
    AssessmentAttempt.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('assessment', 'title type role passingScore durationMinutes'),
    AssessmentAttempt.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}
