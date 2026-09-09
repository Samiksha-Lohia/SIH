/**
 * Single source of truth for all role definitions, storage keys, and platform routes.
 * Never hardcode role strings elsewhere in the codebase.
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  FACULTY: 'faculty',
  INSTITUTION: 'institution',
  INDUSTRY: 'industry',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  [ROLES.STUDENT]: 'Student',
  [ROLES.FACULTY]: 'Faculty / Academician',
  [ROLES.INSTITUTION]: 'Institution',
  [ROLES.INDUSTRY]: 'Industry / Recruiter',
  [ROLES.ADMIN]: 'Platform Administrator',
});

export const ROLE_HOME_ROUTES = Object.freeze({
  [ROLES.STUDENT]: '/student',
  [ROLES.FACULTY]: '/faculty',
  [ROLES.INSTITUTION]: '/institution',
  [ROLES.INDUSTRY]: '/industry',
  [ROLES.ADMIN]: '/admin',
});

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: 'sutra_access_token',
  REFRESH_TOKEN: 'sutra_refresh_token',
  USER: 'sutra_user',
});
