import { Opportunity } from '../opportunities/opportunity.model.js';
import { LearningProgram } from '../opportunities/learningProgram.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { ROLES, OPPORTUNITY_STATUS } from '../../config/constants.js';
import { computeMatch } from './match.engine.js';
import { fallbackMatchExplanation } from '../../services/ai/fallback.js';
import { getSkillGaps } from '../skillgap/skillgap.service.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

async function loadStudentProfile(userId) {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) throw ApiError.badRequest('Student profile not found. Complete onboarding first.', { code: 'NO_PROFILE' });
  return profile;
}

// A concise, deterministic explanation is attached to every ranked item so
// lists stay fast and provider-cost-free regardless of AI configuration.
function explain(match, targetLabel) {
  return fallbackMatchExplanation({ matched: match.matchedSkills, missing: match.missingSkills, score: match.score });
}

/**
 * Rank published opportunities for a student by match score.
 */
export async function matchOpportunitiesForStudent(userId, { limit = 10, type, location } = {}) {
  ensureDB();
  const profile = await loadStudentProfile(userId);

  const filter = { status: OPPORTUNITY_STATUS.PUBLISHED };
  if (type) filter.type = type;
  if (location) filter.location = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  // Bound the candidate pool for performance.
  const opportunities = await Opportunity.find(filter).limit(500).lean();

  const ranked = opportunities
    .map((opp) => {
      const match = computeMatch(opp, profile);
      return {
        opportunity: {
          id: String(opp._id),
          title: opp.title,
          type: opp.type,
          companyName: opp.companyName,
          location: opp.location,
          workMode: opp.workMode,
          deadline: opp.deadline,
          verificationBadge: opp.verificationBadge,
        },
        score: match.score,
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        eligibilityOk: match.eligibilityOk,
        explanation: explain(match),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { count: ranked.length, recommendations: ranked };
}

/**
 * Rank student candidates for a given opportunity (recruiter view).
 */
export async function matchCandidatesForOpportunity(opportunityId, requester, { limit = 10 } = {}) {
  ensureDB();
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');

  const isOwner = String(opportunity.company) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only match candidates for your own opportunities', { code: 'NOT_OWNER' });
  }

  const profiles = await StudentProfile.find({}).limit(1000).lean();
  const userIds = profiles.map((p) => p.user);
  const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const ranked = profiles
    .map((profile) => {
      const match = computeMatch(opportunity.toObject(), profile);
      const u = userMap.get(String(profile.user));
      return {
        candidate: {
          userId: String(profile.user),
          name: u?.name,
          email: u?.email,
          completeness: profile.completeness,
        },
        score: match.score,
        breakdown: match.breakdown,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        eligibilityOk: match.eligibilityOk,
        explanation: explain(match),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { opportunity: { id: String(opportunity._id), title: opportunity.title }, count: ranked.length, candidates: ranked };
}

/**
 * Recommend learning programs that close a student's highest-priority skill gaps.
 */
export async function recommendLearning(userId, { role, roleId, limit = 10 } = {}) {
  ensureDB();
  const gapReport = await getSkillGaps(userId, { role, roleId });

  // Gaps the student has not yet met, keyed by slug with their priority.
  const gapBySlug = new Map();
  for (const g of gapReport.gaps) {
    if (g.status === 'met') continue;
    gapBySlug.set(slugify(g.skill), { skill: g.skill, priority: g.priority, severity: g.severity });
  }

  if (gapBySlug.size === 0) {
    return { role: gapReport.role, message: 'No outstanding skill gaps for this role.', recommendations: [] };
  }

  const gapSlugs = [...gapBySlug.keys()];
  const programs = await LearningProgram.find({
    status: OPPORTUNITY_STATUS.PUBLISHED,
    'skillsCovered.slug': { $in: gapSlugs },
  })
    .limit(200)
    .lean();

  const ranked = programs
    .map((p) => {
      const covers = [];
      let priorityCovered = 0;
      for (const sc of p.skillsCovered || []) {
        const g = gapBySlug.get(sc.slug || slugify(sc.name));
        if (g) {
          covers.push(g.skill);
          priorityCovered += g.priority;
        }
      }
      return {
        program: {
          id: String(p._id),
          title: p.title,
          type: p.type,
          provider: p.provider,
          duration: p.duration,
          certificate: p.certificate,
        },
        coversSkills: covers,
        gapsCovered: covers.length,
        priorityCovered: Number(priorityCovered.toFixed(2)),
      };
    })
    .filter((r) => r.gapsCovered > 0)
    .sort((a, b) => b.priorityCovered - a.priorityCovered)
    .slice(0, limit);

  return {
    role: gapReport.role,
    targetGaps: [...gapBySlug.values()].sort((a, b) => b.priority - a.priority).map((g) => g.skill),
    recommendations: ranked,
  };
}
