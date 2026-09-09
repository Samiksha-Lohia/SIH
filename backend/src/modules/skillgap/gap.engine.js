import { PROFICIENCY_LEVEL, GAP_SEVERITY } from '../../config/constants.js';

/**
 * Skill-gap engine (pure functions, no DB) implementing the logic from the
 * SUTRA spec (CONTEXT.md 5.3):
 *
 *   gap = max(required_level - student_level, 0)
 *   severity: Met | Minor | Moderate | Critical
 *   rank gaps by (business importance × gap severity)
 */

export function levelNum(level) {
  return PROFICIENCY_LEVEL[level] || 0;
}

/** Map a numeric gap (0..3) to a severity bucket. */
export function severityForGap(gap) {
  if (gap <= 0) return GAP_SEVERITY.MET;
  if (gap === 1) return GAP_SEVERITY.MINOR;
  if (gap === 2) return GAP_SEVERITY.MODERATE;
  return GAP_SEVERITY.CRITICAL;
}

/**
 * Analyze a student's skills against a role's required/preferred competencies.
 *
 * @param {Object} params
 * @param {Array}  params.requiredSkills - [{ name, level, required=true, weight=1 }]
 * @param {Array}  params.studentSkills  - [{ name, level }]
 * @returns { gaps, strong, weak, missing, summary, readiness }
 */
export function analyzeGap({ requiredSkills = [], studentSkills = [] }) {
  // Index student skills by normalized (lowercased) name for lookup.
  const studentMap = new Map();
  for (const s of studentSkills) {
    if (!s?.name) continue;
    studentMap.set(s.name.toLowerCase(), levelNum(s.level));
  }

  const gaps = [];
  let weightedAttainment = 0;
  let totalWeight = 0;

  for (const req of requiredSkills) {
    if (!req?.name) continue;
    const required = req.required !== false;
    const weight = typeof req.weight === 'number' ? req.weight : 1;
    const requiredLevel = req.level || 'intermediate';
    const reqNum = levelNum(requiredLevel);
    const hasSkill = studentMap.has(req.name.toLowerCase());
    const studNum = hasSkill ? studentMap.get(req.name.toLowerCase()) : 0;
    const gap = Math.max(reqNum - studNum, 0);

    let status;
    if (!hasSkill) status = 'missing';
    else if (studNum >= reqNum) status = 'met';
    else status = 'weak';

    const severity = severityForGap(gap);
    // Priority weights required skills higher and scales by the size of the gap.
    const priority = Number((gap * weight * (required ? 1.5 : 1)).toFixed(2));

    gaps.push({
      skill: req.name,
      requiredLevel,
      studentLevel: levelName(studNum),
      gap,
      severity,
      status,
      required,
      weight,
      priority,
      reason: buildReason({ name: req.name, status, requiredLevel, studentLevelNum: studNum, required }),
    });

    // Readiness contribution: preferred skills count at half weight.
    const effectiveWeight = weight * (required ? 1 : 0.5);
    const attainment = reqNum > 0 ? Math.min(studNum / reqNum, 1) : 1;
    weightedAttainment += attainment * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  // Rank gaps: highest priority first; met skills sink to the bottom.
  const ranked = [...gaps].sort((a, b) => b.priority - a.priority);

  const strong = gaps.filter((g) => g.status === 'met').map((g) => g.skill);
  const weak = gaps.filter((g) => g.status === 'weak').map((g) => g.skill);
  const missing = gaps.filter((g) => g.status === 'missing').map((g) => g.skill);

  const summary = {
    total: gaps.length,
    met: strong.length,
    weak: weak.length,
    missing: missing.length,
    critical: gaps.filter((g) => g.severity === GAP_SEVERITY.CRITICAL).length,
    moderate: gaps.filter((g) => g.severity === GAP_SEVERITY.MODERATE).length,
    minor: gaps.filter((g) => g.severity === GAP_SEVERITY.MINOR).length,
  };

  const readiness = totalWeight > 0 ? Math.round((weightedAttainment / totalWeight) * 100) : 0;

  return { gaps: ranked, strong, weak, missing, summary, readiness };
}

function levelName(num) {
  const entry = Object.entries(PROFICIENCY_LEVEL).find(([, v]) => v === num);
  return entry ? entry[0] : 'none';
}

function buildReason({ name, status, requiredLevel, studentLevelNum, required }) {
  const tag = required ? 'required' : 'preferred';
  if (status === 'missing') return `Missing ${tag} skill "${name}" (needs ${requiredLevel}).`;
  if (status === 'weak') return `"${name}" is at ${levelName(studentLevelNum)}, but the role needs ${requiredLevel}.`;
  return `Meets the requirement for "${name}".`;
}
