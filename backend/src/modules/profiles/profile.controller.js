import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess, paginationMeta } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../config/constants.js';
import * as profileService from './profile.service.js';

/**
 * Factory producing get/update handlers for a specific role, so student/faculty/
 * institution/industry share identical logic with the correct profile type.
 */
function makeProfileHandlers(role) {
  const get = asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.params.id, role);
    if (!profile) {
      // Profile not created yet — return an empty shell so the frontend can render onboarding.
      return sendSuccess(res, { profile: null, exists: false });
    }
    sendSuccess(res, { profile: profile.toJSON(), exists: true });
  });

  const update = asyncHandler(async (req, res) => {
    const profile = await profileService.upsertProfile(req.params.id, role, req.body);
    sendSuccess(res, { profile: profile.toJSON() });
  });

  return { get, update };
}

export const studentHandlers = makeProfileHandlers(ROLES.STUDENT);
export const facultyHandlers = makeProfileHandlers(ROLES.FACULTY);
export const institutionHandlers = makeProfileHandlers(ROLES.INSTITUTION);
export const industryHandlers = makeProfileHandlers(ROLES.INDUSTRY);

/**
 * POST /api/students/:id/voice-profile
 * Extract a structured profile from a transcript (AI or fallback).
 */
export const voiceProfile = asyncHandler(async (req, res) => {
  const { transcript, autoMerge } = req.body;
  // Voice profiling supports student (and faculty) — derive role from target user via service.
  const role = req.user && String(req.user._id) === String(req.params.id) ? req.user.role : ROLES.STUDENT;
  const result = await profileService.voiceProfile(req.params.id, role, transcript, autoMerge);
  sendSuccess(res, result);
});

/**
 * POST /api/students/:id/voice-transcribe
 * Upload audio recording, transcribe via Groq Whisper, and extract profile skills.
 */
export const voiceTranscribe = asyncHandler(async (req, res) => {
  const audioFile = req.file || null;
  const fallbackTranscript = req.body.transcript || '';
  const autoMerge = req.body.autoMerge === 'true' || req.body.autoMerge === true;
  const role = req.user && String(req.user._id) === String(req.params.id) ? req.user.role : ROLES.STUDENT;

  const result = await profileService.transcribeAndExtractVoiceProfile(
    req.params.id,
    role,
    audioFile,
    fallbackTranscript,
    autoMerge
  );
  sendSuccess(res, result);
});

/**
 * GET /api/profiles/me — current user's profile regardless of role.
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const role = req.user.role;
  if (role === ROLES.ADMIN) {
    throw ApiError.badRequest('Admin accounts do not have a profile', { code: 'NO_PROFILE_FOR_ROLE' });
  }
  const profile = await profileService.getProfile(req.user._id, role);
  sendSuccess(res, {
    role,
    profile: profile ? profile.toJSON() : null,
    exists: Boolean(profile),
  });
});

/**
 * GET /api/institutions — list institutions with pagination and search (Admin).
 */
export const listInstitutions = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await profileService.listInstitutions(req.query);
  sendSuccess(res, { institutions: items }, { meta: paginationMeta({ page, limit, total }) });
});

/**
 * GET /api/industries — list industries/companies with pagination and search (Admin).
 */
export const listIndustries = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await profileService.listIndustries(req.query);
  sendSuccess(res, { industries: items, companies: items }, { meta: paginationMeta({ page, limit, total }) });
});

/**
 * PATCH /api/institutions/:id/verify — set verification status (verified/rejected) (Admin).
 */
export const verifyInstitution = asyncHandler(async (req, res) => {
  const status = req.body.status || req.body.verificationStatus;
  const institution = await profileService.verifyInstitution(req.params.id, status, req.user, req.ip);
  sendSuccess(res, { institution });
});

/**
 * PATCH /api/industries/:id/verify — set verification status (verified/rejected) (Admin).
 */
export const verifyIndustry = asyncHandler(async (req, res) => {
  const status = req.body.status || req.body.verificationStatus;
  const industry = await profileService.verifyIndustry(req.params.id, status, req.user, req.ip);
  sendSuccess(res, { industry, company: industry });
});
