/**
 * Profile completeness scoring (0-100). Each role has a weighted checklist of
 * fields; the score is the sum of weights for fields that are meaningfully filled.
 * Used for onboarding progress and the student dashboard.
 */

const nonEmptyArr = (v) => Array.isArray(v) && v.length > 0;
const nonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

function scoreChecklist(checklist) {
  const total = checklist.reduce((sum, item) => sum + item.weight, 0) || 1;
  const earned = checklist.reduce((sum, item) => sum + (item.filled ? item.weight : 0), 0);
  return Math.round((earned / total) * 100);
}

export function computeStudentCompleteness(p = {}) {
  return scoreChecklist([
    { weight: 10, filled: nonEmptyStr(p.branch) },
    { weight: 8, filled: Boolean(p.graduationYear) },
    { weight: 12, filled: nonEmptyArr(p.education) },
    { weight: 20, filled: nonEmptyArr(p.skills) },
    { weight: 8, filled: nonEmptyArr(p.softSkills) },
    { weight: 12, filled: nonEmptyArr(p.projects) },
    { weight: 8, filled: nonEmptyArr(p.certifications) },
    { weight: 10, filled: nonEmptyArr(p.careerGoals?.targetRoles) },
    { weight: 6, filled: nonEmptyStr(p.careerGoals?.summary) },
    { weight: 6, filled: nonEmptyStr(p.portfolio?.resumeUrl) || nonEmptyStr(p.portfolio?.github) },
  ]);
}

export function computeFacultyCompleteness(p = {}) {
  return scoreChecklist([
    { weight: 15, filled: nonEmptyStr(p.institution) },
    { weight: 10, filled: nonEmptyStr(p.designation) },
    { weight: 20, filled: nonEmptyArr(p.expertise) },
    { weight: 15, filled: nonEmptyArr(p.qualifications) },
    { weight: 15, filled: Boolean(p.experienceYears) || nonEmptyArr(p.experience) },
    { weight: 10, filled: nonEmptyArr(p.interests) },
    { weight: 15, filled: nonEmptyArr(p.collaborationPreferences) },
  ]);
}

export function computeInstitutionCompleteness(p = {}) {
  return scoreChecklist([
    { weight: 20, filled: nonEmptyStr(p.name) },
    { weight: 20, filled: nonEmptyArr(p.departments) },
    { weight: 15, filled: nonEmptyStr(p.location) || nonEmptyStr(p.address) },
    { weight: 15, filled: nonEmptyStr(p.website) },
    { weight: 20, filled: nonEmptyStr(p.contact?.email) },
    { weight: 10, filled: nonEmptyStr(p.contact?.person) },
  ]);
}

export function computeIndustryCompleteness(p = {}) {
  return scoreChecklist([
    { weight: 20, filled: nonEmptyStr(p.companyName) },
    { weight: 15, filled: nonEmptyStr(p.sector) },
    { weight: 15, filled: nonEmptyStr(p.location) },
    { weight: 15, filled: nonEmptyStr(p.website) },
    { weight: 15, filled: nonEmptyStr(p.description) },
    { weight: 20, filled: nonEmptyStr(p.contact?.email) },
  ]);
}

export const completenessByRole = {
  student: computeStudentCompleteness,
  faculty: computeFacultyCompleteness,
  institution: computeInstitutionCompleteness,
  industry: computeIndustryCompleteness,
};
