import { Application } from './application.model.js';
import { Opportunity } from '../opportunities/opportunity.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination, parseSort } from '../../utils/query.js';
import { computeMatch } from '../matching/match.engine.js';
import { safeNotify } from '../notifications/notification.service.js';
import { safeAudit, AUDIT_ACTION } from '../audit/audit.service.js';
import { ROLES, APPLICATION_STATUS, OPPORTUNITY_STATUS, NOTIFICATION_TYPE } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const TERMINAL = [APPLICATION_STATUS.WITHDRAWN];

/**
 * Student applies to an opportunity. Computes and stores the match score so
 * recruiters see fit at a glance.
 */
export async function apply(opportunityId, userId, { coverLetter } = {}) {
  ensureDB();
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  if (opportunity.status !== OPPORTUNITY_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This opportunity is not open for applications', { code: 'NOT_PUBLISHED' });
  }

  const existing = await Application.findOne({ applicant: userId, opportunity: opportunityId });
  if (existing) throw ApiError.conflict('You have already applied to this opportunity', { code: 'ALREADY_APPLIED' });

  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) throw ApiError.badRequest('Complete your profile before applying', { code: 'NO_PROFILE' });

  const match = computeMatch(opportunity.toObject(), profile.toObject());

  const application = await Application.create({
    applicant: userId,
    opportunity: opportunityId,
    company: opportunity.company,
    matchScore: match.score,
    matchBreakdown: match.breakdown,
    coverLetter,
    status: APPLICATION_STATUS.APPLIED,
    statusHistory: [{ status: APPLICATION_STATUS.APPLIED, by: userId }],
  });

  return application;
}

export async function withdraw(applicationId, userId) {
  ensureDB();
  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(userId)) {
    throw ApiError.forbidden('You can only withdraw your own application', { code: 'NOT_OWNER' });
  }
  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw ApiError.badRequest('Application already withdrawn', { code: 'ALREADY_WITHDRAWN' });
  }
  application.status = APPLICATION_STATUS.WITHDRAWN;
  application.statusHistory.push({ status: APPLICATION_STATUS.WITHDRAWN, by: userId });
  await application.save();
  return application;
}

export async function listMine(userId, query) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { applicant: userId };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('opportunity', 'title type companyName location workMode status deadline'),
    Application.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

async function loadForRecruiter(applicationId, requester) {
  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found');
  const isOwner = String(application.company) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You cannot manage this application', { code: 'NOT_OWNER' });
  }
  return application;
}

export async function getApplication(applicationId, requester) {
  ensureDB();
  const application = await Application.findById(applicationId)
    .populate('opportunity', 'title type companyName')
    .populate('applicant', 'name email');
  if (!application) throw ApiError.notFound('Application not found');

  const isApplicant = String(application.applicant?._id ?? application.applicant) === String(requester._id);
  const isOwner = String(application.company) === String(requester._id);
  if (!isApplicant && !isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You cannot view this application', { code: 'NOT_ALLOWED' });
  }
  return application;
}

export async function listForOpportunity(opportunityId, requester, query) {
  ensureDB();
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) throw ApiError.notFound('Opportunity not found');
  const isOwner = String(opportunity.company) === String(requester._id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only view applicants for your own opportunities', { code: 'NOT_OWNER' });
  }

  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { opportunity: opportunityId };
  if (query.status) filter.status = query.status;
  const sort = parseSort(query.sort, { matchScore: -1, createdAt: -1 });

  const [items, total] = await Promise.all([
    Application.find(filter).sort(sort).skip(skip).limit(limit).populate('applicant', 'name email'),
    Application.countDocuments(filter),
  ]);
  return { items, page, limit, total };
}

/**
 * Recruiter updates an application's status. Blocks changes to withdrawn apps.
 */
export async function updateStatus(applicationId, status, requester, note) {
  ensureDB();
  const application = await loadForRecruiter(applicationId, requester);
  if (TERMINAL.includes(application.status)) {
    throw ApiError.badRequest(`Cannot change a ${application.status} application`, { code: 'TERMINAL_STATUS' });
  }
  application.status = status;
  application.statusHistory.push({ status, by: requester._id, note });
  await application.save();

  // Notify the applicant of the status change (non-fatal).
  safeNotify({
    user: application.applicant,
    type: NOTIFICATION_TYPE.APPLICATION_STATUS,
    title: 'Application status updated',
    message: `Your application status changed to "${status}".`,
    link: `/applications/${application._id}`,
    meta: { applicationId: String(application._id), status },
  });
  safeAudit({
    actor: requester._id,
    actorRole: requester.role,
    action: AUDIT_ACTION.APPLICATION_STATUS,
    resource: 'Application',
    resourceId: String(application._id),
    meta: { status },
  });

  return application;
}

export async function addNote(applicationId, note, requester) {
  ensureDB();
  const application = await loadForRecruiter(applicationId, requester);
  application.recruiterNotes.push({ note, by: requester._id });
  await application.save();
  return application;
}

export async function addInterviewStage(applicationId, stage, requester) {
  ensureDB();
  const application = await loadForRecruiter(applicationId, requester);
  application.interviewStages.push(stage);
  await application.save();
  return application;
}

export async function updateInterviewStage(applicationId, stageId, patch, requester) {
  ensureDB();
  const application = await loadForRecruiter(applicationId, requester);
  const stage = application.interviewStages.id(stageId);
  if (!stage) throw ApiError.notFound('Interview stage not found');
  Object.assign(stage, patch);
  await application.save();
  return application;
}
