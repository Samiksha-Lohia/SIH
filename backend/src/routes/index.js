import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/auth/user.routes.js';
import {
  studentRouter,
  facultyRouter,
  institutionRouter,
  industryRouter,
  profilesRouter,
} from '../modules/profiles/profile.routes.js';
import { skillRouter, roleRouter } from '../modules/skills/skill.routes.js';
import assessmentRoutes from '../modules/assessments/assessment.routes.js';
import { skillGapRouter } from '../modules/skillgap/skillgap.routes.js';
import { opportunityRouter, learningRouter } from '../modules/opportunities/opportunity.routes.js';
import { matchingRouter } from '../modules/matching/matching.routes.js';
import { applicationRouter } from '../modules/applications/application.routes.js';
import { portfolioRouter } from '../modules/portfolio/portfolio.routes.js';
import { documentRouter } from '../modules/documents/document.routes.js';
import { analyticsRouter } from '../modules/analytics/analytics.routes.js';
import { mentorshipRouter, academicianRouter } from '../modules/mentorship/mentorship.routes.js';
import { notificationRouter } from '../modules/notifications/notification.routes.js';
import { auditRouter } from '../modules/audit/audit.routes.js';

/**
 * Central API router. Each module mounts its own sub-router here as batches land.
 * Keeping mounts in one file makes the full API surface easy to see.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRouter);
router.use('/faculty', facultyRouter);
router.use('/institutions', institutionRouter);
router.use('/industries', industryRouter);
router.use('/profiles', profilesRouter);
router.use('/skills', skillRouter);
router.use('/roles', roleRouter);
router.use('/assessments', assessmentRoutes);
router.use('/skill-gap', skillGapRouter);
router.use('/opportunities', opportunityRouter);
router.use('/learning', learningRouter);
router.use('/matching', matchingRouter);
router.use('/applications', applicationRouter);
router.use('/portfolio', portfolioRouter);
router.use('/documents', documentRouter);
router.use('/analytics', analyticsRouter);
router.use('/mentorship', mentorshipRouter);
router.use('/academician-opportunities', academicianRouter);
router.use('/notifications', notificationRouter);
router.use('/audit', auditRouter);

export default router;
