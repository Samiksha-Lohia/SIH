import mongoose from 'mongoose';
import { Opportunity } from '../opportunities/opportunity.model.js';
import { LearningProgram } from '../opportunities/learningProgram.model.js';
import { Application } from '../applications/application.model.js';
import { StudentProfile } from '../profiles/studentProfile.model.js';
import { AssessmentAttempt } from '../assessments/attempt.model.js';
import { Skill } from '../skills/skill.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { isDBConnected } from '../../config/db.js';
import { ROLES, OPPORTUNITY_STATUS } from '../../config/constants.js';

function ensureDB() {
  if (!isDBConnected()) {
    throw ApiError.serviceUnavailable('Database unavailable. Configure MONGODB_URI.', { code: 'DB_UNAVAILABLE' });
  }
}

const arrToObj = (arr, key = '_id', val = 'count') =>
  arr.reduce((acc, r) => {
    acc[r[key]] = r[val];
    return acc;
  }, {});

/**
 * Skill demand: how frequently each skill is requested across published
 * opportunities (weighted). Backs GET /api/analytics/skills.
 */
export async function skillDemand({ limit = 20 } = {}) {
  ensureDB();
  const pipeline = [
    { $match: { status: OPPORTUNITY_STATUS.PUBLISHED } },
    {
      $project: {
        skills: { $concatArrays: [{ $ifNull: ['$requiredSkills', []] }, { $ifNull: ['$preferredSkills', []] }] },
      },
    },
    { $unwind: '$skills' },
    {
      $group: {
        _id: { $ifNull: ['$skills.slug', '$skills.name'] },
        name: { $first: '$skills.name' },
        demand: { $sum: 1 },
        weightSum: { $sum: { $ifNull: ['$skills.weight', 1] } },
      },
    },
    { $sort: { demand: -1, weightSum: -1 } },
    { $limit: limit },
  ];
  const rows = await Opportunity.aggregate(pipeline);
  return rows.map((r) => ({ slug: r._id, name: r.name, demand: r.demand, weightedDemand: r.weightSum }));
}

/**
 * Recompute and persist Skill.demandScore from live opportunity demand (admin).
 */
export async function recomputeSkillDemand() {
  ensureDB();
  const rows = await skillDemand({ limit: 10000 });
  if (!rows.length) return { updated: 0 };
  const ops = rows.map((r) => ({
    updateOne: { filter: { slug: r.slug }, update: { $set: { demandScore: r.demand } } },
  }));
  const res = await Skill.bulkWrite(ops);
  return { updated: res.modifiedCount ?? 0, evaluated: rows.length };
}

function bucketReadiness(profiles) {
  const buckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
  for (const p of profiles) {
    const c = p.completeness || 0;
    if (c <= 25) buckets['0-25'] += 1;
    else if (c <= 50) buckets['26-50'] += 1;
    else if (c <= 75) buckets['51-75'] += 1;
    else buckets['76-100'] += 1;
  }
  return buckets;
}

/**
 * Institution dashboard analytics (platform-wide student view).
 */
export async function institutionAnalytics() {
  ensureDB();
  const [
    totalStudents,
    skillDist,
    branchDist,
    profiles,
    placementFunnel,
    assessmentAgg,
    topDemand,
    trainingAgg,
  ] = await Promise.all([
    StudentProfile.countDocuments(),
    StudentProfile.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    StudentProfile.aggregate([
      { $match: { branch: { $nin: [null, ''] } } },
      { $group: { _id: '$branch', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    StudentProfile.find({}).select('completeness').lean(),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AssessmentAttempt.aggregate([
      { $group: { _id: null, attempts: { $sum: 1 }, avgScore: { $avg: '$score' }, students: { $addToSet: '$user' } } },
    ]),
    skillDemand({ limit: 10 }),
    LearningProgram.aggregate([
      { $unwind: { path: '$enrollments', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          enrollments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$enrollments.status', 'completed'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const assessment = assessmentAgg[0] || { attempts: 0, avgScore: 0, students: [] };
  const training = trainingAgg[0] || { enrollments: 0, completed: 0 };

  return {
    totalStudents,
    assessedStudents: assessment.students?.length || 0,
    averageAssessmentScore: Math.round(assessment.avgScore || 0),
    skillDistribution: skillDist.map((s) => ({ skill: s._id, count: s.count })),
    branchDistribution: branchDist.map((b) => ({ branch: b._id, count: b.count })),
    readinessDistribution: bucketReadiness(profiles),
    placementFunnel: arrToObj(placementFunnel),
    topDemandSkills: topDemand,
    training: { enrollments: training.enrollments, completed: training.completed },
  };
}

/**
 * Industry dashboard analytics, scoped to the requester's opportunities
 * (or platform-wide for admin).
 */
export async function industryAnalytics(requester) {
  ensureDB();
  const scope = requester.role === ROLES.ADMIN ? {} : { company: new mongoose.Types.ObjectId(requester._id) };

  const [totalOpportunities, activeOpportunities, funnel, compat, perOpportunity, topCandidateSkills] =
    await Promise.all([
      Opportunity.countDocuments(scope),
      Opportunity.countDocuments({ ...scope, status: OPPORTUNITY_STATUS.PUBLISHED }),
      Application.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([{ $match: scope }, { $group: { _id: null, avg: { $avg: '$matchScore' }, total: { $sum: 1 } } }]),
      Application.aggregate([
        { $match: scope },
        { $group: { _id: '$opportunity', applications: { $sum: 1 }, avgScore: { $avg: '$matchScore' } } },
        { $sort: { applications: -1 } },
        { $limit: 20 },
      ]),
      // Top skills among applicants to this company's opportunities.
      Application.aggregate([
        { $match: scope },
        { $lookup: { from: 'studentprofiles', localField: 'applicant', foreignField: 'user', as: 'profile' } },
        { $unwind: '$profile' },
        { $unwind: '$profile.skills' },
        { $group: { _id: '$profile.skills.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

  const funnelObj = arrToObj(funnel);
  const totalApps = compat[0]?.total || 0;
  const shortlisted = (funnelObj.shortlisted || 0) + (funnelObj.interview || 0) + (funnelObj.selected || 0);

  return {
    totalOpportunities,
    activeOpportunities,
    applicationsReceived: totalApps,
    pipeline: funnelObj,
    averageCompatibility: Math.round(compat[0]?.avg || 0),
    shortlistRate: totalApps ? Math.round((shortlisted / totalApps) * 100) : 0,
    topCandidateSkills: topCandidateSkills.map((s) => ({ skill: s._id, count: s.count })),
    opportunityPerformance: perOpportunity.map((o) => ({
      opportunityId: String(o._id),
      applications: o.applications,
      averageScore: Math.round(o.avgScore || 0),
    })),
  };
}

/**
 * Student dashboard summary.
 */
export async function studentAnalytics(userId) {
  ensureDB();
  const uid = new mongoose.Types.ObjectId(userId);
  const [profile, appFunnel, assessmentAgg, enrollmentAgg] = await Promise.all([
    StudentProfile.findOne({ user: userId }).select('completeness skills careerGoals').lean(),
    Application.aggregate([{ $match: { applicant: uid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    AssessmentAttempt.aggregate([
      { $match: { user: uid } },
      { $group: { _id: null, attempts: { $sum: 1 }, avgScore: { $avg: '$score' }, best: { $max: '$score' } } },
    ]),
    LearningProgram.aggregate([
      { $match: { 'enrollments.user': uid } },
      { $unwind: '$enrollments' },
      { $match: { 'enrollments.user': uid } },
      {
        $group: {
          _id: null,
          enrolled: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$enrollments.status', 'completed'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const assessment = assessmentAgg[0] || { attempts: 0, avgScore: 0, best: 0 };
  const enrollments = enrollmentAgg[0] || { enrolled: 0, completed: 0 };

  return {
    profileCompleteness: profile?.completeness || 0,
    skillCount: profile?.skills?.length || 0,
    targetRoles: profile?.careerGoals?.targetRoles || [],
    applications: arrToObj(appFunnel),
    assessments: {
      attempts: assessment.attempts,
      averageScore: Math.round(assessment.avgScore || 0),
      bestScore: assessment.best || 0,
    },
    learning: { enrolled: enrollments.enrolled, completed: enrollments.completed },
  };
}
