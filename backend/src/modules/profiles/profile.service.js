import mongoose from 'mongoose';
import { StudentProfile } from './studentProfile.model.js';
import { FacultyProfile } from './facultyProfile.model.js';
import { Institution } from './institution.model.js';
import { Industry } from './industry.model.js';
import { User } from '../auth/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { mergeDeep } from '../../utils/merge.js';
import { parsePagination } from '../../utils/query.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';
import { aiService } from '../../services/ai/ai.service.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../config/constants.js';
import {
  computeStudentCompleteness,
  computeFacultyCompleteness,
  computeInstitutionCompleteness,
  computeIndustryCompleteness,
} from './completeness.js';

// Registry mapping role -> model, completeness fn, and the User.profileModel tag.
const REGISTRY = {
  [ROLES.STUDENT]: { Model: StudentProfile, completeness: computeStudentCompleteness, tag: 'StudentProfile' },
  [ROLES.FACULTY]: { Model: FacultyProfile, completeness: computeFacultyCompleteness, tag: 'FacultyProfile' },
  [ROLES.INSTITUTION]: { Model: Institution, completeness: computeInstitutionCompleteness, tag: 'Institution' },
  [ROLES.INDUSTRY]: { Model: Industry, completeness: computeIndustryCompleteness, tag: 'Industry' },
};

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

function registryForRole(role) {
  const entry = REGISTRY[role];
  if (!entry) throw ApiError.badRequest(`No profile type for role "${role}"`, { code: 'NO_PROFILE_FOR_ROLE' });
  return entry;
}

async function loadUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

function assertRole(user, role) {
  if (user.role !== role) {
    throw ApiError.badRequest(`User is a "${user.role}", not a "${role}"`, { code: 'ROLE_MISMATCH' });
  }
}

/**
 * Fetch a profile by userId for a given role. Returns null if not yet created.
 */
export async function getProfile(userId, role) {
  ensureDB();
  const { Model } = registryForRole(role);
  const user = await loadUser(userId);
  assertRole(user, role);
  return Model.findOne({ user: userId });
}

/**
 * Create or update a profile (upsert). Recomputes completeness and links the
 * profile back to the User document.
 */
export async function upsertProfile(userId, role, data) {
  ensureDB();
  const { Model, completeness, tag } = registryForRole(role);
  const user = await loadUser(userId);
  assertRole(user, role);

  let profile = await Model.findOne({ user: userId });
  if (!profile) profile = new Model({ user: userId });

  // Merge provided fields onto the current profile object.
  const current = profile.toObject();
  const merged = mergeDeep(current, data);
  profile.set(merged);

  // Institution/Industry require a name/companyName to save meaningfully.
  profile.completeness = completeness(profile.toObject());
  await profile.save();

  // Link profile to user + onboarding flag.
  const updates = {};
  if (String(user.profileRef || '') !== String(profile._id) || user.profileModel !== tag) {
    updates.profileRef = profile._id;
    updates.profileModel = tag;
  }
  const nowComplete = profile.completeness >= 60;
  if (user.onboardingComplete !== nowComplete) updates.onboardingComplete = nowComplete;
  if (Object.keys(updates).length) {
    await User.updateOne({ _id: user._id }, { $set: updates });
  }

  return profile;
}

/**
 * Extract a structured profile from a voice/text transcript via the AI service.
 * By default returns a *proposal* (per spec: merge only after user confirmation).
 * If autoMerge is true, applies the extracted fields to the student profile.
 */
export async function voiceProfile(userId, role, transcript, autoMerge = false) {
  ensureDB();
  if (role !== ROLES.STUDENT && role !== ROLES.FACULTY) {
    throw ApiError.badRequest('Voice profiling is available for student and faculty roles', {
      code: 'UNSUPPORTED_ROLE',
    });
  }

  const extracted = await aiService.extractProfile(transcript, { role });

  let profile = null;
  if (autoMerge && role === ROLES.STUDENT) {
    const existing = await StudentProfile.findOne({ user: userId });
    const existingObj = existing ? existing.toObject() : {};

    // 1. Merge technical skills deduplicating by case-insensitive name
    const mergedSkills = [...(existingObj.skills || [])];
    (extracted.skills || []).forEach((newS) => {
      if (!newS?.name) return;
      const idx = mergedSkills.findIndex((s) => s.name?.toLowerCase() === newS.name.toLowerCase());
      if (idx >= 0) {
        mergedSkills[idx] = { ...mergedSkills[idx], ...newS };
      } else {
        mergedSkills.push(newS);
      }
    });

    // 2. Merge soft skills deduplicating by case-insensitive name
    const mergedSoftSkills = [...(existingObj.softSkills || [])];
    (extracted.softSkills || []).forEach((newS) => {
      if (!newS?.name) return;
      const idx = mergedSoftSkills.findIndex((s) => s.name?.toLowerCase() === newS.name.toLowerCase());
      if (idx >= 0) {
        mergedSoftSkills[idx] = { ...mergedSoftSkills[idx], ...newS };
      } else {
        mergedSoftSkills.push(newS);
      }
    });

    // 3. Merge career goals target roles
    const existingRoles = existingObj.careerGoals?.targetRoles || [];
    const newRoles = extracted.careerGoals?.targetRoles || [];
    const mergedTargetRoles = Array.from(new Set([...existingRoles, ...newRoles]));

    // 4. Merge projects (append new ones that have titles not already present)
    const existingProjects = existingObj.projects || [];
    const newProjects = (extracted.projects || []).filter(
      (np) => np.title && !existingProjects.some((ep) => ep.title?.toLowerCase() === np.title.toLowerCase())
    );
    const mergedProjects = [...existingProjects, ...newProjects];

    const patch = {
      skills: mergedSkills,
      softSkills: mergedSoftSkills,
      projects: mergedProjects,
      careerGoals: {
        ...(existingObj.careerGoals || {}),
        targetRoles: mergedTargetRoles,
        summary: extracted.careerGoals?.summary || existingObj.careerGoals?.summary || '',
      },
    };

    if (extracted.certifications?.length) {
      patch.certifications = [...(existingObj.certifications || []), ...extracted.certifications];
    }
    if (extracted.education?.length) {
      patch.education = [...(existingObj.education || []), ...extracted.education];
    }

    profile = await upsertProfile(userId, role, patch);
  }

  return {
    source: extracted._meta?.source || aiService.mode,
    extracted,
    merged: Boolean(autoMerge && profile),
    profile: profile ? profile.toJSON() : undefined,
  };
}

/**
 * Transcribe recorded audio with Groq Whisper, then extract structured skills/profile.
 */
export async function transcribeAndExtractVoiceProfile(
  userId,
  role,
  audioFile,
  fallbackTranscript = '',
  autoMerge = false
) {
  ensureDB();
  let transcript = '';

  if (audioFile && audioFile.buffer) {
    try {
      transcript = await aiService.transcribeAudio(
        audioFile.buffer,
        audioFile.mimetype,
        audioFile.originalname
      );
    } catch (err) {
      logger.warn(`Groq Whisper transcription failed: ${err.message}`);
    }
  }

  // Fallback to client-provided transcript if Groq Whisper was not available or empty
  if (!transcript && fallbackTranscript) {
    transcript = fallbackTranscript;
  }

  if (!transcript || !transcript.trim()) {
    if (!env.ai.groqEnabled && !fallbackTranscript) {
      throw ApiError.badRequest(
        'Groq Whisper API key is not configured and no live speech text was detected. Please check GROQ_API_KEY in backend .env, or use live speech recognition.',
        { code: 'GROQ_NOT_CONFIGURED' }
      );
    }
    throw ApiError.badRequest(
      'No spoken audio or speech transcript could be detected. Please try recording again.',
      { code: 'EMPTY_TRANSCRIPT' }
    );
  }

  const result = await voiceProfile(userId, role, transcript, autoMerge);
  return {
    ...result,
    transcript,
  };
}

/**
 * List institutions with pagination and search (Admin).
 */
export async function listInstitutions(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};

  const status = query.status || query.verificationStatus;
  if (status) filter.verificationStatus = status;

  const search = query.q || query.search;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { location: { $regex: escaped, $options: 'i' } },
      { departments: { $regex: escaped, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Institution.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role status')
      .populate('verifiedBy', 'name email'),
    Institution.countDocuments(filter),
  ]);

  return { items: items.map((doc) => doc.toJSON()), page, limit, total };
}

/**
 * List industries/companies with pagination and search (Admin).
 */
export async function listIndustries(query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};

  const status = query.status || query.verificationStatus;
  if (status) filter.verificationStatus = status;

  const search = query.q || query.search;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { companyName: { $regex: escaped, $options: 'i' } },
      { sector: { $regex: escaped, $options: 'i' } },
      { location: { $regex: escaped, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Industry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role status')
      .populate('verifiedBy', 'name email'),
    Industry.countDocuments(filter),
  ]);

  return { items: items.map((doc) => doc.toJSON()), page, limit, total };
}

/**
 * Set institution verification status (verified/rejected) and record verifiedBy / verifiedAt.
 */
export async function verifyInstitution(id, status, adminUser, ip) {
  ensureDB();
  const filter = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { user: id }] } : { _id: id };
  const institution = await Institution.findOne(filter);
  if (!institution) {
    throw ApiError.notFound('Institution not found');
  }

  institution.verificationStatus = status;
  institution.verifiedBy = adminUser._id;
  institution.verifiedAt = new Date();
  await institution.save();

  await institution.populate([
    { path: 'user', select: 'name email role status' },
    { path: 'verifiedBy', select: 'name email' },
  ]);

  safeAudit({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: AUDIT_ACTION.INSTITUTION_VERIFY,
    resource: 'Institution',
    resourceId: String(institution._id),
    meta: { verificationStatus: status },
    ip,
  });

  return institution.toJSON();
}

/**
 * Set industry/company verification status (verified/rejected) and record verifiedBy / verifiedAt.
 */
export async function verifyIndustry(id, status, adminUser, ip) {
  ensureDB();
  const filter = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { user: id }] } : { _id: id };
  const industry = await Industry.findOne(filter);
  if (!industry) {
    throw ApiError.notFound('Industry not found');
  }

  industry.verificationStatus = status;
  industry.verifiedBy = adminUser._id;
  industry.verifiedAt = new Date();
  await industry.save();

  await industry.populate([
    { path: 'user', select: 'name email role status' },
    { path: 'verifiedBy', select: 'name email' },
  ]);

  safeAudit({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: AUDIT_ACTION.COMPANY_VERIFY,
    resource: 'Industry',
    resourceId: String(industry._id),
    meta: { verificationStatus: status },
    ip,
  });

  return industry.toJSON();
}
