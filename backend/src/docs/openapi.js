import { env } from '../config/env.js';

/**
 * OpenAPI 3.0 spec for the SUTRA backend. Hand-authored and concise: documents
 * the API surface (paths, methods, auth, tags) so frontend developers have a
 * live contract at /api/docs. All responses use the `{ success, data, error,
 * meta }` envelope.
 */
const bearer = [{ bearerAuth: [] }];

const op = (tag, summary, { auth = true, body = false } = {}) => ({
  tags: [tag],
  summary,
  ...(auth ? { security: bearer } : {}),
  ...(body ? { requestBody: { content: { 'application/json': { schema: { type: 'object' } } } } } : {}),
  responses: {
    200: { description: 'Success (standard envelope)' },
    400: { description: 'Bad request / validation error' },
    401: { description: 'Unauthorized' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
    503: { description: 'Database unavailable' },
  },
});

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SUTRA Backend API',
    version: '1.0.0',
    description:
      'Smart Unified Talent & Recruitment Alignment Platform. All responses use the envelope `{ success, data, error, meta }`. Authenticate via `Authorization: Bearer <accessToken>`.',
  },
  servers: [{ url: `http://localhost:${env.port}`, description: 'Local' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Profiles' },
    { name: 'Skills & Roles' },
    { name: 'Assessments' },
    { name: 'Skill Gap' },
    { name: 'Opportunities' },
    { name: 'Learning' },
    { name: 'Matching' },
    { name: 'Applications' },
    { name: 'Portfolio' },
    { name: 'Documents' },
    { name: 'Analytics' },
    { name: 'Mentorship' },
    { name: 'Academician Opportunities' },
    { name: 'Notifications' },
    { name: 'Audit' },
  ],
  paths: {
    '/api/health': { get: op('Health', 'Liveness + dependency status', { auth: false }) },

    // Auth
    '/api/auth/register': { post: op('Auth', 'Create account', { auth: false, body: true }) },
    '/api/auth/login': { post: op('Auth', 'Authenticate user', { auth: false, body: true }) },
    '/api/auth/refresh': { post: op('Auth', 'Refresh tokens', { auth: false, body: true }) },
    '/api/auth/me': { get: op('Auth', 'Get current user') },
    '/api/auth/logout': { post: op('Auth', 'Logout (client discards tokens)') },

    // Profiles
    '/api/profiles/me': { get: op('Profiles', "Current user's profile") },
    '/api/students/{id}': {
      get: op('Profiles', 'Get student profile'),
      put: op('Profiles', 'Update student profile', { body: true }),
    },
    '/api/students/{id}/voice-profile': { post: op('Profiles', 'Extract profile from voice/text', { body: true }) },
    '/api/students/{id}/readiness': { get: op('Skill Gap', 'Industry readiness for a target role') },
    '/api/students/{id}/skill-gaps': { get: op('Skill Gap', 'Skill-gap report for a target role') },
    '/api/faculty/{id}': { get: op('Profiles', 'Get faculty profile'), put: op('Profiles', 'Update faculty profile', { body: true }) },
    '/api/institutions/{id}': { get: op('Profiles', 'Get institution'), put: op('Profiles', 'Update institution', { body: true }) },
    '/api/industries/{id}': { get: op('Profiles', 'Get industry'), put: op('Profiles', 'Update industry', { body: true }) },

    // Skills & roles
    '/api/skills': { get: op('Skills & Roles', 'List skills'), post: op('Skills & Roles', 'Create skill (admin)', { body: true }) },
    '/api/skills/normalize': { post: op('Skills & Roles', 'Normalize skill labels to canonical', { body: true }) },
    '/api/skills/{id}': {
      get: op('Skills & Roles', 'Get skill'),
      put: op('Skills & Roles', 'Update skill (admin)', { body: true }),
      delete: op('Skills & Roles', 'Delete skill (admin)'),
    },
    '/api/roles': { get: op('Skills & Roles', 'List roles'), post: op('Skills & Roles', 'Create role (admin)', { body: true }) },
    '/api/roles/{id}': {
      get: op('Skills & Roles', 'Get role'),
      put: op('Skills & Roles', 'Update role (admin)', { body: true }),
      delete: op('Skills & Roles', 'Delete role (admin)'),
    },

    // Assessments
    '/api/assessments': { get: op('Assessments', 'List assessments'), post: op('Assessments', 'Create assessment', { body: true }) },
    '/api/assessments/questions': {
      get: op('Assessments', 'List question bank'),
      post: op('Assessments', 'Create question', { body: true }),
    },
    '/api/assessments/attempts/me': { get: op('Assessments', 'My attempt history') },
    '/api/assessments/results/{attemptId}': { get: op('Assessments', 'Get attempt result') },
    '/api/assessments/{id}': {
      get: op('Assessments', 'Get assessment (answers hidden for candidates)'),
      put: op('Assessments', 'Update assessment', { body: true }),
      delete: op('Assessments', 'Delete assessment'),
    },
    '/api/assessments/{id}/submit': { post: op('Assessments', 'Submit an attempt', { body: true }) },

    // Skill gap
    '/api/skill-gap/analyze': { post: op('Skill Gap', 'Ad-hoc skill-gap analysis', { body: true }) },

    // Opportunities
    '/api/opportunities': { get: op('Opportunities', 'Search/filter opportunities'), post: op('Opportunities', 'Create opportunity', { body: true }) },
    '/api/opportunities/{id}': {
      get: op('Opportunities', 'Opportunity details'),
      put: op('Opportunities', 'Edit opportunity', { body: true }),
      delete: op('Opportunities', 'Delete opportunity'),
    },
    '/api/opportunities/{id}/status': { patch: op('Opportunities', 'Publish/pause/close', { body: true }) },
    '/api/opportunities/{id}/apply': { post: op('Applications', 'Apply to an opportunity (student)', { body: true }) },

    // Learning
    '/api/learning': { get: op('Learning', 'List learning programs'), post: op('Learning', 'Create program', { body: true }) },
    '/api/learning/recommend': { post: op('Learning', 'Recommend programs from skill gaps', { body: true }) },
    '/api/learning/me/enrollments': { get: op('Learning', 'My enrollments') },
    '/api/learning/{id}': {
      get: op('Learning', 'Get program'),
      put: op('Learning', 'Update program', { body: true }),
      delete: op('Learning', 'Delete program'),
    },
    '/api/learning/{id}/enroll': { post: op('Learning', 'Enroll in a program') },
    '/api/learning/{id}/progress': { patch: op('Learning', 'Update enrollment progress', { body: true }) },
    '/api/learning/{id}/complete': { post: op('Learning', 'Mark program complete') },

    // Matching
    '/api/matching/opportunities': { post: op('Matching', 'Ranked opportunities for a student', { body: true }) },
    '/api/matching/candidates': { post: op('Matching', 'Ranked candidates for an opportunity', { body: true }) },

    // Applications
    '/api/applications/me': { get: op('Applications', 'My applications (student)') },
    '/api/applications/opportunity/{opportunityId}': { get: op('Applications', 'Applicants for an opportunity (recruiter)') },
    '/api/applications/{id}': { get: op('Applications', 'Get application') },
    '/api/applications/{id}/withdraw': { post: op('Applications', 'Withdraw application (student)') },
    '/api/applications/{id}/status': { patch: op('Applications', 'Update status (recruiter)', { body: true }) },
    '/api/applications/{id}/notes': { post: op('Applications', 'Add recruiter note', { body: true }) },
    '/api/applications/{id}/interviews': { post: op('Applications', 'Add interview stage', { body: true }) },
    '/api/applications/{id}/interviews/{stageId}': { patch: op('Applications', 'Update interview stage', { body: true }) },

    // Portfolio
    '/api/portfolio': { get: op('Portfolio', 'My portfolio items'), post: op('Portfolio', 'Create item', { body: true }) },
    '/api/portfolio/resume': { post: op('Portfolio', 'AI-assisted resume generation') },
    '/api/portfolio/share/{userId}': { get: op('Portfolio', 'Public share view', { auth: false }) },
    '/api/portfolio/{id}': {
      get: op('Portfolio', 'Get item'),
      put: op('Portfolio', 'Update item', { body: true }),
      delete: op('Portfolio', 'Delete item'),
    },
    '/api/portfolio/{id}/verify': { patch: op('Portfolio', 'Verify item (verifier roles)', { body: true }) },

    // Documents
    '/api/documents': { post: op('Documents', 'Upload a document (multipart form field "file")') },
    '/api/documents/me': { get: op('Documents', 'My documents') },
    '/api/documents/{id}': { get: op('Documents', 'Get document'), delete: op('Documents', 'Delete document') },
    '/api/documents/{id}/verify': { patch: op('Documents', 'Verify document (verifier roles)', { body: true }) },

    // Analytics
    '/api/analytics/skills': { get: op('Analytics', 'Skill demand analytics') },
    '/api/analytics/skills/recompute': { post: op('Analytics', 'Recompute skill demand (admin)') },
    '/api/analytics/institution': { get: op('Analytics', 'Institution dashboard') },
    '/api/analytics/industry': { get: op('Analytics', 'Industry dashboard') },
    '/api/analytics/student/{id}': { get: op('Analytics', 'Student dashboard') },

    // Mentorship
    '/api/mentorship/mentors': { get: op('Mentorship', 'Discover mentors') },
    '/api/mentorship/me': { get: op('Mentorship', 'My mentorships') },
    '/api/mentorship': { post: op('Mentorship', 'Request mentorship', { body: true }) },
    '/api/mentorship/{id}/respond': { patch: op('Mentorship', 'Mentor responds (accept/decline)', { body: true }) },
    '/api/mentorship/{id}/complete': { patch: op('Mentorship', 'Complete mentorship') },
    '/api/mentorship/{id}/cancel': { patch: op('Mentorship', 'Cancel request (mentee)') },

    // Academician opportunities
    '/api/academician-opportunities': {
      get: op('Academician Opportunities', 'List postings'),
      post: op('Academician Opportunities', 'Create posting', { body: true }),
    },
    '/api/academician-opportunities/{id}': {
      get: op('Academician Opportunities', 'Get posting'),
      put: op('Academician Opportunities', 'Update posting', { body: true }),
      delete: op('Academician Opportunities', 'Delete posting'),
    },
    '/api/academician-opportunities/{id}/interest': { post: op('Academician Opportunities', 'Express interest (faculty)', { body: true }) },
    '/api/academician-opportunities/{id}/interested': { get: op('Academician Opportunities', 'List interested faculty (owner)') },

    // Notifications
    '/api/notifications': { get: op('Notifications', 'My notifications') },
    '/api/notifications/unread-count': { get: op('Notifications', 'Unread count') },
    '/api/notifications/read-all': { post: op('Notifications', 'Mark all read') },
    '/api/notifications/{id}/read': { patch: op('Notifications', 'Mark one read') },
    '/api/notifications/{id}': { delete: op('Notifications', 'Delete notification') },

    // Audit
    '/api/audit': { get: op('Audit', 'View audit log (admin)') },
  },
};

export default openapiSpec;
