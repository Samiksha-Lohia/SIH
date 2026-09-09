/**
 * Shared enums and constants used across modules.
 * Kept centralized so the API contract stays consistent for frontend integration.
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  FACULTY: 'faculty',
  INSTITUTION: 'institution',
  INDUSTRY: 'industry',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.values(ROLES);

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
});

export const VERIFICATION_STATUS = Object.freeze({
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

// Proficiency levels are ordinal; numeric weight drives skill-gap math.
export const PROFICIENCY = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
});

export const PROFICIENCY_LEVEL = Object.freeze({
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
});

export const SKILL_CATEGORY = Object.freeze({
  TECHNICAL: 'technical',
  DOMAIN: 'domain',
  TOOLS: 'tools',
  SOFT: 'soft',
  COMMUNICATION: 'communication',
  LEADERSHIP: 'leadership',
});

export const OPPORTUNITY_TYPE = Object.freeze({
  INTERNSHIP: 'internship',
  JOB: 'job',
  APPRENTICESHIP: 'apprenticeship',
  LIVE_PROJECT: 'live_project',
  INDUSTRIAL_TRAINING: 'industrial_training',
  ENTRY_LEVEL: 'entry_level',
});

export const OPPORTUNITY_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PAUSED: 'paused',
  CLOSED: 'closed',
});

export const WORK_MODE = Object.freeze({
  ONSITE: 'onsite',
  REMOTE: 'remote',
  HYBRID: 'hybrid',
});

// Application lifecycle per CONTEXT.md 2.10
export const APPLICATION_STATUS = Object.freeze({
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
});

export const APPLICATION_FLOW = Object.freeze([
  APPLICATION_STATUS.APPLIED,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.SHORTLISTED,
  APPLICATION_STATUS.INTERVIEW,
  APPLICATION_STATUS.SELECTED,
  APPLICATION_STATUS.REJECTED,
]);

export const ASSESSMENT_TYPE = Object.freeze({
  TECHNICAL: 'technical',
  SOFT_SKILL: 'soft_skill',
  APTITUDE: 'aptitude',
  QUESTIONNAIRE: 'questionnaire',
});

export const DIFFICULTY = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

export const GAP_SEVERITY = Object.freeze({
  MET: 'met',
  MINOR: 'minor',
  MODERATE: 'moderate',
  CRITICAL: 'critical',
});

export const LEARNING_PROGRAM_TYPE = Object.freeze({
  TRAINING: 'training',
  CERTIFICATION: 'certification',
  WORKSHOP: 'workshop',
  BOOTCAMP: 'bootcamp',
  MENTORSHIP: 'mentorship',
});

export const NOTIFICATION_TYPE = Object.freeze({
  NEW_MATCH: 'new_matching_opportunity',
  APPLICATION_STATUS: 'application_status_change',
  ASSESSMENT_REMINDER: 'assessment_reminder',
  SKILL_GAP_READY: 'skill_gap_report_ready',
  TRAINING_RECOMMENDATION: 'training_recommendation',
  MENTORSHIP_REQUEST: 'mentorship_request',
  PROGRAM_COMPLETION: 'program_completion',
});

// Default configurable weights for the explainable match score (CONTEXT.md 5.2)
export const MATCH_WEIGHTS = Object.freeze({
  skillCompatibility: 0.35,
  skillProficiency: 0.2,
  education: 0.15,
  careerInterest: 0.1,
  experience: 0.1,
  location: 0.05,
  certifications: 0.05,
});
