import { MATCH_WEIGHTS, PROFICIENCY_LEVEL } from '../../config/constants.js';
import { slugify } from '../../utils/slugify.js';

/**
 * Explainable weighted match score (CONTEXT.md 5.2):
 *   35% Skill Compatibility
 *   20% Skill Proficiency
 *   15% Education / Eligibility
 *   10% Career Interest Alignment
 *   10% Experience / Project Relevance
 *    5% Location / Work Mode
 *    5% Certifications / Evidence
 *
 * Each component returns 0..1; the weighted sum is normalized to 0..100.
 * Weights are configurable (defaults from MATCH_WEIGHTS) and can be overridden
 * per opportunity type.
 */

function levelNum(level) {
  return PROFICIENCY_LEVEL[level] || 0;
}

function buildStudentSkillMap(student) {
  const map = new Map();
  for (const s of [...(student.skills || []), ...(student.softSkills || [])]) {
    if (s?.name) map.set(slugify(s.name), levelNum(s.level));
  }
  return map;
}

function scoreSkills(opportunity, studentMap) {
  const required = opportunity.requiredSkills || [];
  const preferred = opportunity.preferredSkills || [];
  const all = [...required, ...preferred];

  const matched = [];
  const missing = [];

  // Compatibility: fraction of listed skills the student possesses (any level).
  let haveCount = 0;
  for (const s of all) {
    if (studentMap.has(slugify(s.name))) {
      haveCount += 1;
      matched.push(s.name);
    } else {
      missing.push(s.name);
    }
  }
  const compatibility = all.length ? haveCount / all.length : 1;

  // Proficiency: weighted attainment against REQUIRED levels only.
  let weightedAttain = 0;
  let totalWeight = 0;
  for (const s of required) {
    const weight = typeof s.weight === 'number' ? s.weight : 1;
    const reqNum = levelNum(s.level);
    const studNum = studentMap.get(slugify(s.name)) || 0;
    const attain = reqNum > 0 ? Math.min(studNum / reqNum, 1) : 1;
    weightedAttain += attain * weight;
    totalWeight += weight;
  }
  const proficiency = totalWeight ? weightedAttain / totalWeight : 1;

  return { compatibility, proficiency, matched, missing };
}

function scoreEligibility(opportunity, student) {
  const e = opportunity.eligibility;
  if (!e) return 1;
  const checks = [];
  if (typeof e.minCgpa === 'number') {
    const maxCgpa = Math.max(0, ...(student.education || []).map((ed) => ed.cgpa || 0));
    checks.push(maxCgpa >= e.minCgpa ? 1 : 0);
  }
  if (Array.isArray(e.graduationYears) && e.graduationYears.length) {
    checks.push(e.graduationYears.includes(student.graduationYear) ? 1 : 0);
  }
  if (Array.isArray(e.branches) && e.branches.length) {
    const b = (student.branch || '').toLowerCase();
    checks.push(e.branches.some((x) => x.toLowerCase() === b) ? 1 : 0);
  }
  if (!checks.length) return 1;
  return checks.reduce((a, c) => a + c, 0) / checks.length;
}

function scoreCareerInterest(opportunity, student) {
  const targets = (student.careerGoals?.targetRoles || []).map(slugify);
  if (opportunity.role && targets.includes(slugify(opportunity.role))) return 1;
  if (opportunity.title && targets.some((t) => slugify(opportunity.title).includes(t) || t.includes(slugify(opportunity.title)))) {
    return 0.8;
  }
  return targets.length ? 0.3 : 0.6; // neutral when student stated no goals
}

function scoreExperience(opportunity, student) {
  const required = (opportunity.requiredSkills || []).map((s) => slugify(s.name));
  if (!required.length) return student.projects?.length ? 0.8 : 0.4;

  const evidenceTokens = new Set();
  for (const p of student.projects || []) {
    for (const t of p.techStack || []) evidenceTokens.add(slugify(t));
    if (p.title) evidenceTokens.add(slugify(p.title));
  }
  for (const ex of student.experience || []) {
    if (ex.title) evidenceTokens.add(slugify(ex.title));
    if (ex.description) slugify(ex.description).split(' ').forEach((w) => evidenceTokens.add(w));
  }

  const overlap = required.filter((r) => [...evidenceTokens].some((tok) => tok.includes(r) || r.includes(tok))).length;
  if (overlap === 0) return student.projects?.length ? 0.3 : 0.1;
  return Math.min(1, overlap / Math.max(1, Math.ceil(required.length / 2)));
}

function scoreLocation(opportunity, student) {
  if ((opportunity.workMode || '').toLowerCase() === 'remote') return 1;
  const prefs = (student.preferences?.locations || []).map((l) => l.toLowerCase());
  if (!prefs.length) return 0.6;
  if (opportunity.location && prefs.includes(opportunity.location.toLowerCase())) return 1;
  // Work mode preference alignment as a partial signal.
  if (student.preferences?.workMode && student.preferences.workMode === opportunity.workMode) return 0.7;
  return 0.3;
}

function scoreCertifications(student) {
  return (student.certifications || []).length ? 1 : 0.4;
}

/**
 * Compute a full match result for a student against an opportunity (or any
 * target exposing requiredSkills/preferredSkills/eligibility/role/location).
 */
export function computeMatch(opportunity, student, weights = MATCH_WEIGHTS) {
  const studentMap = buildStudentSkillMap(student);
  const { compatibility, proficiency, matched, missing } = scoreSkills(opportunity, studentMap);

  const components = {
    skillCompatibility: compatibility,
    skillProficiency: proficiency,
    education: scoreEligibility(opportunity, student),
    careerInterest: scoreCareerInterest(opportunity, student),
    experience: scoreExperience(opportunity, student),
    location: scoreLocation(opportunity, student),
    certifications: scoreCertifications(student),
  };

  let score = 0;
  const breakdown = {};
  for (const [key, weight] of Object.entries(weights)) {
    const value = components[key] ?? 0;
    score += value * weight;
    breakdown[key] = Math.round(value * 100);
  }

  return {
    score: Math.round(score * 100),
    breakdown,
    matchedSkills: matched,
    missingSkills: missing,
    eligibilityOk: components.education >= 1,
  };
}
