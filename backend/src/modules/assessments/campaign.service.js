import { AssessmentCampaign } from './assessmentCampaign.model.js';
import { Assessment } from './assessment.model.js';
import { User } from '../auth/user.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { parsePagination } from '../../utils/query.js';
import { ROLES } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

/**
 * List all students available for assignment by an institution.
 */
export async function listInstitutionStudents(institutionUserId) {
  ensureDB();
  const students = await User.find({ role: ROLES.STUDENT, status: 'active' })
    .select('name email')
    .sort({ name: 1 })
    .lean();

  const userIds = students.map((s) => s._id);
  const profiles = await StudentProfile.find({ user: { $in: userIds } })
    .select('user branch graduationYear education')
    .lean();

  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

  return students.map((s) => {
    const prof = profileMap.get(String(s._id));
    return {
      id: String(s._id),
      name: s.name,
      email: s.email,
      branch: prof?.branch || 'General',
      graduationYear: prof?.graduationYear || null,
      institution: prof?.education?.[0]?.institution || '',
    };
  });
}

/**
 * Create a new assessment campaign.
 */
export async function createCampaign(data, institutionUserId) {
  ensureDB();

  const assessment = await Assessment.findById(data.assessmentId);
  if (!assessment) {
    throw ApiError.notFound('Target assessment does not exist');
  }

  let studentIds = Array.isArray(data.studentIds) ? data.studentIds : [];

  // If no specific studentIds provided but a cohort/branch is specified, resolve students by cohort/branch
  if (studentIds.length === 0) {
    if (data.cohort && data.cohort !== 'All Students') {
      const matchingProfiles = await StudentProfile.find({
        $or: [{ branch: new RegExp(data.cohort, 'i') }],
      }).select('user');
      studentIds = matchingProfiles.map((p) => String(p.user));
    } else {
      // Assign to all active students
      const allStudents = await User.find({ role: ROLES.STUDENT, status: 'active' }).select('_id');
      studentIds = allStudents.map((s) => String(s._id));
    }
  }

  if (studentIds.length === 0) {
    throw ApiError.badRequest('No students found to assign to this campaign');
  }

  // Ensure unique student IDs
  const uniqueIds = [...new Set(studentIds.map(String))];

  const assignedStudents = uniqueIds.map((sid) => ({
    student: sid,
    status: 'assigned',
  }));

  const campaign = await AssessmentCampaign.create({
    title: data.title.trim(),
    description: data.description?.trim(),
    institution: institutionUserId,
    assessment: assessment._id,
    cohort: data.cohort?.trim() || 'General Cohort',
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    deadline: new Date(data.deadline),
    status: 'active',
    assignedStudents,
    createdBy: institutionUserId,
  });

  return getCampaign(campaign._id, { _id: institutionUserId, role: ROLES.INSTITUTION });
}

/**
 * List campaigns created by an institution with progress aggregation.
 */
export async function listCampaigns(institutionUserId, query = {}, userRole = ROLES.INSTITUTION) {
  ensureDB();
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (userRole !== ROLES.ADMIN) {
    filter.institution = institutionUserId;
  }
  if (query.status) filter.status = query.status;

  const [docs, total] = await Promise.all([
    AssessmentCampaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assessment', 'title role type difficulty durationMinutes passingScore skillSet')
      .lean(),
    AssessmentCampaign.countDocuments(filter),
  ]);

  const items = docs.map((c) => {
    const totalAssigned = c.assignedStudents?.length || 0;
    const completedList = c.assignedStudents?.filter((s) => s.status === 'completed') || [];
    const completedCount = completedList.length;
    const scores = completedList.map((s) => s.score).filter((sc) => typeof sc === 'number');
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

    return {
      id: String(c._id),
      title: c.title,
      description: c.description,
      cohort: c.cohort,
      startDate: c.startDate,
      deadline: c.deadline,
      status: c.status,
      assessment: c.assessment,
      totalAssigned,
      completedCount,
      completionRate,
      avgScore,
      createdAt: c.createdAt,
    };
  });

  return { items, page, limit, total };
}

/**
 * Get full campaign details including student-by-student monitoring breakdown.
 */
export async function getCampaign(campaignId, requester) {
  ensureDB();
  const campaign = await AssessmentCampaign.findById(campaignId)
    .populate('assessment')
    .populate('assignedStudents.student', 'name email')
    .populate('assignedStudents.attempt', 'score passed rawScore maxScore completedAt')
    .lean();

  if (!campaign) {
    throw ApiError.notFound('Campaign not found');
  }

  const isOwner = String(campaign.institution) === String(requester._id || requester.id);
  if (!isOwner && requester.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You do not have access to view this campaign');
  }

  const totalAssigned = campaign.assignedStudents?.length || 0;
  const completedList = campaign.assignedStudents?.filter((s) => s.status === 'completed') || [];
  const completedCount = completedList.length;
  const pendingCount = totalAssigned - completedCount;
  const passedCount = completedList.filter((s) => s.passed).length;
  const scores = completedList.map((s) => s.score).filter((sc) => typeof sc === 'number');
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    id: String(campaign._id),
    title: campaign.title,
    description: campaign.description,
    cohort: campaign.cohort,
    startDate: campaign.startDate,
    deadline: campaign.deadline,
    status: campaign.status,
    assessment: campaign.assessment,
    stats: {
      totalAssigned,
      completedCount,
      pendingCount,
      passedCount,
      completionRate: totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0,
      avgScore,
    },
    students: (campaign.assignedStudents || []).map((s) => ({
      studentId: s.student?._id ? String(s.student._id) : String(s.student),
      name: s.student?.name || 'Enrolled Student',
      email: s.student?.email || 'N/A',
      status: s.status,
      score: s.score ?? null,
      passed: s.passed ?? null,
      completedAt: s.completedAt || null,
      attemptId: s.attempt?._id ? String(s.attempt._id) : null,
    })),
    createdAt: campaign.createdAt,
  };
}

/**
 * List assessments specifically assigned to the logged-in student.
 */
export async function listMyAssignedAssessments(studentUserId) {
  ensureDB();
  const userIdStr = String(studentUserId);

  const campaigns = await AssessmentCampaign.find({
    'assignedStudents.student': studentUserId,
    status: 'active',
  })
    .populate('assessment')
    .populate('institution', 'name email')
    .sort({ deadline: 1 })
    .lean();

  return campaigns.map((c) => {
    const studentEntry = c.assignedStudents.find((s) => String(s.student) === userIdStr);
    const questions = c.assessment?.questionIds || [];

    return {
      campaignId: String(c._id),
      campaignTitle: c.title,
      cohort: c.cohort,
      institutionName: c.institution?.name || 'Institution Partner',
      deadline: c.deadline,
      startDate: c.startDate,
      status: studentEntry?.status || 'assigned',
      score: studentEntry?.score ?? null,
      passed: studentEntry?.passed ?? null,
      completedAt: studentEntry?.completedAt || null,
      attemptId: studentEntry?.attempt ? String(studentEntry.attempt) : null,
      assessment: {
        id: String(c.assessment?._id || c.assessment?.id),
        title: c.assessment?.title,
        description: c.assessment?.description,
        type: c.assessment?.type,
        role: c.assessment?.role,
        difficulty: c.assessment?.difficulty,
        durationMinutes: c.assessment?.durationMinutes || 30,
        passingScore: c.assessment?.passingScore || 50,
        questionCount: questions.length,
        skillSet: c.assessment?.skillSet || [],
      },
    };
  });
}

/**
 * Record a student attempt back into the campaign tracking record.
 */
export async function recordCampaignAttempt(campaignId, studentUserId, attempt) {
  if (!campaignId) return;
  try {
    const campaign = await AssessmentCampaign.findById(campaignId);
    if (!campaign) return;

    const studentEntry = campaign.assignedStudents.find(
      (s) => String(s.student) === String(studentUserId)
    );

    if (studentEntry) {
      studentEntry.status = 'completed';
      studentEntry.attempt = attempt._id;
      studentEntry.score = attempt.score;
      studentEntry.passed = attempt.passed;
      studentEntry.completedAt = attempt.completedAt || new Date();
      await campaign.save();
    }
  } catch (err) {
    console.error('Failed to link attempt to campaign:', err);
  }
}
