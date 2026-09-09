import { Role } from '../skills/role.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { analyzeGap } from './gap.engine.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

/**
 * Resolve a target Role document from an explicit id/title, otherwise fall back
 * to the student's first career-goal target role.
 */
async function resolveRole({ roleId, role, student }) {
  if (roleId) {
    const r = await Role.findById(roleId);
    if (!r) throw ApiError.notFound('Role not found');
    return r;
  }
  const title = role || student?.careerGoals?.targetRoles?.[0];
  if (!title) {
    throw ApiError.badRequest(
      'No target role specified and none found in career goals. Provide ?role= or ?roleId=.',
      { code: 'NO_TARGET_ROLE' }
    );
  }
  const r = await Role.findOne({ slug: slugify(title) });
  if (!r) {
    throw ApiError.notFound(`Role "${title}" is not in the taxonomy. Seed roles or pass a valid roleId.`, {
      code: 'ROLE_NOT_IN_TAXONOMY',
    });
  }
  return r;
}

/** Merge a student's technical + soft skills into a single list for analysis. */
function studentSkillList(profile) {
  return [...(profile.skills || []), ...(profile.softSkills || [])].map((s) => ({ name: s.name, level: s.level }));
}

async function loadStudentProfile(userId) {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) {
    throw ApiError.badRequest('Student profile not found. Complete onboarding first.', { code: 'NO_PROFILE' });
  }
  return profile;
}

/**
 * Full skill-gap report for a student against a target role.
 */
export async function getSkillGaps(userId, { role, roleId } = {}) {
  ensureDB();
  const profile = await loadStudentProfile(userId);
  const targetRole = await resolveRole({ roleId, role, student: profile });

  const result = analyzeGap({
    requiredSkills: targetRole.mappedSkills,
    studentSkills: studentSkillList(profile),
  });

  return {
    role: { id: String(targetRole._id), title: targetRole.title },
    ...result,
  };
}

/**
 * Readiness summary for dashboards: overall score + top strengths + top gaps.
 */
export async function getReadiness(userId, { role, roleId } = {}) {
  ensureDB();
  const profile = await loadStudentProfile(userId);
  const targetRole = await resolveRole({ roleId, role, student: profile });

  const result = analyzeGap({
    requiredSkills: targetRole.mappedSkills,
    studentSkills: studentSkillList(profile),
  });

  const criticalGaps = result.gaps
    .filter((g) => g.status !== 'met')
    .slice(0, 5)
    .map((g) => ({ skill: g.skill, severity: g.severity, reason: g.reason }));

  return {
    role: { id: String(targetRole._id), title: targetRole.title },
    readiness: result.readiness,
    profileCompleteness: profile.completeness,
    topStrengths: result.strong.slice(0, 5),
    criticalGaps,
    summary: result.summary,
  };
}

/**
 * Flexible ad-hoc analysis (POST /api/skill-gap/analyze).
 * Accepts either an explicit requiredSkills list or a role reference, and either
 * an explicit studentSkills list or the authenticated student's profile.
 */
export async function analyze({ requiredSkills, role, roleId, studentSkills, requester }) {
  let required = requiredSkills;
  let roleInfo;

  if (!required || required.length === 0) {
    ensureDB();
    const targetRole = await resolveRole({ roleId, role, student: null });
    required = targetRole.mappedSkills;
    roleInfo = { id: String(targetRole._id), title: targetRole.title };
  }

  let student = studentSkills;
  if (!student || student.length === 0) {
    if (requester?.role === 'student') {
      ensureDB();
      const profile = await loadStudentProfile(requester._id);
      student = studentSkillList(profile);
    } else {
      student = [];
    }
  }

  const result = analyzeGap({ requiredSkills: required, studentSkills: student });
  return { role: roleInfo, ...result };
}
