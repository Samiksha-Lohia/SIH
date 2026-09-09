import { User } from '../modules/auth/user.model.js';
import { StudentProfile } from '../modules/profiles/studentProfile.model.js';
import { Industry } from '../modules/profiles/industry.model.js';
import { FacultyProfile } from '../modules/profiles/facultyProfile.model.js';
import { Opportunity } from '../modules/opportunities/opportunity.model.js';
import { LearningProgram } from '../modules/opportunities/learningProgram.model.js';
import { Question } from '../modules/assessments/question.model.js';
import { Assessment } from '../modules/assessments/assessment.model.js';
import { computeStudentCompleteness } from '../modules/profiles/completeness.js';
import { slugify } from '../utils/slugify.js';
import {
  ROLES,
  VERIFICATION_STATUS,
  OPPORTUNITY_STATUS,
  OPPORTUNITY_TYPE,
  WORK_MODE,
  PROFICIENCY,
  ASSESSMENT_TYPE,
  DIFFICULTY,
  LEARNING_PROGRAM_TYPE,
} from '../config/constants.js';
import { logger } from '../utils/logger.js';

const DEMO_PASSWORD = 'Password123';

async function upsertUser(name, email, role) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ name, email, role });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
  }
  return user;
}

const withSlugs = (skills) => skills.map((s) => ({ ...s, slug: slugify(s.name) }));

/**
 * Seed a small, coherent demo dataset (idempotent by email/slug). Useful for
 * exercising the API and demoing the full student journey.
 */
export async function seedDemo() {
  const [admin, student, faculty, institution, industry] = await Promise.all([
    upsertUser('Demo Admin', 'admin@sutra.dev', ROLES.ADMIN),
    upsertUser('Asha Rao', 'student@sutra.dev', ROLES.STUDENT),
    upsertUser('Dr. Meera Nair', 'faculty@sutra.dev', ROLES.FACULTY),
    upsertUser('Demo Institute', 'institution@sutra.dev', ROLES.INSTITUTION),
    upsertUser('Acme Corp', 'industry@sutra.dev', ROLES.INDUSTRY),
  ]);

  // Verified industry profile (so it can publish).
  await Industry.updateOne(
    { user: industry._id },
    {
      $set: {
        user: industry._id,
        companyName: 'Acme Corp',
        sector: 'Software',
        location: 'Bangalore',
        website: 'https://acme.example',
        description: 'A demo software company.',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        contact: { email: 'hr@acme.example', person: 'HR Team' },
      },
    },
    { upsert: true }
  );

  // Faculty profile open to mentorship.
  await FacultyProfile.updateOne(
    { user: faculty._id },
    {
      $set: {
        user: faculty._id,
        institution: 'Demo Institute',
        designation: 'Associate Professor',
        expertise: ['Machine Learning', 'Data Structures'],
        availability: { openToMentorship: true, openToConsultancy: true, slots: [] },
        collaborationPreferences: ['research', 'guest_lecture'],
      },
    },
    { upsert: true }
  );

  // Student profile with skills + goals.
  const studentSkills = withSlugs([
    { name: 'JavaScript', level: PROFICIENCY.ADVANCED },
    { name: 'React', level: PROFICIENCY.INTERMEDIATE },
    { name: 'Node.js', level: PROFICIENCY.INTERMEDIATE },
    { name: 'Git', level: PROFICIENCY.INTERMEDIATE },
  ]);
  const studentDoc = {
    user: student._id,
    branch: 'CSE',
    graduationYear: 2026,
    education: [{ institution: 'Demo Institute', degree: 'B.Tech', branch: 'CSE', cgpa: 8.2 }],
    skills: studentSkills,
    softSkills: withSlugs([{ name: 'Communication', level: PROFICIENCY.INTERMEDIATE }]),
    projects: [{ title: 'Portfolio Website', description: 'Built with React', techStack: ['React', 'JavaScript'] }],
    careerGoals: { targetRoles: ['Frontend Developer'], preferredIndustries: ['Software'], summary: 'Aspiring frontend developer.' },
    preferences: { workMode: WORK_MODE.HYBRID, locations: ['Bangalore'] },
  };
  studentDoc.completeness = computeStudentCompleteness(studentDoc);
  await StudentProfile.updateOne({ user: student._id }, { $set: studentDoc }, { upsert: true });

  // A published opportunity.
  const oppSkills = {
    requiredSkills: withSlugs([
      { name: 'React', level: PROFICIENCY.ADVANCED, weight: 3 },
      { name: 'JavaScript', level: PROFICIENCY.ADVANCED, weight: 3 },
      { name: 'Git', level: PROFICIENCY.INTERMEDIATE, weight: 1 },
    ]),
    preferredSkills: withSlugs([{ name: 'Testing', level: PROFICIENCY.INTERMEDIATE, weight: 2 }]),
  };
  await Opportunity.updateOne(
    { company: industry._id, title: 'Frontend Developer Intern' },
    {
      $set: {
        type: OPPORTUNITY_TYPE.INTERNSHIP,
        title: 'Frontend Developer Intern',
        description: 'Work on our React web app.',
        company: industry._id,
        companyName: 'Acme Corp',
        role: 'Frontend Developer',
        ...oppSkills,
        location: 'Bangalore',
        workMode: WORK_MODE.HYBRID,
        duration: '3 months',
        stipend: 15000,
        status: OPPORTUNITY_STATUS.PUBLISHED,
        verificationBadge: true,
        createdBy: industry._id,
      },
    },
    { upsert: true }
  );

  // Assessment + questions.
  const existingAssessment = await Assessment.findOne({ title: 'Frontend Basics' });
  if (!existingAssessment) {
    const q1 = await Question.create({
      text: 'Which hook manages state in React?',
      type: ASSESSMENT_TYPE.TECHNICAL,
      skill: 'React',
      difficulty: DIFFICULTY.BEGINNER,
      options: [
        { key: 'A', text: 'useState' },
        { key: 'B', text: 'useMemo' },
        { key: 'C', text: 'useEffect' },
      ],
      correctKeys: ['A'],
      points: 1,
      createdBy: admin._id,
    });
    const q2 = await Question.create({
      text: 'What does === check in JavaScript?',
      type: ASSESSMENT_TYPE.TECHNICAL,
      skill: 'JavaScript',
      difficulty: DIFFICULTY.BEGINNER,
      options: [
        { key: 'A', text: 'Value only' },
        { key: 'B', text: 'Value and type' },
        { key: 'C', text: 'Reference only' },
      ],
      correctKeys: ['B'],
      points: 1,
      createdBy: admin._id,
    });
    await Assessment.create({
      title: 'Frontend Basics',
      description: 'A short React + JavaScript check.',
      type: ASSESSMENT_TYPE.TECHNICAL,
      role: 'Frontend Developer',
      skillSet: ['React', 'JavaScript'],
      difficulty: DIFFICULTY.BEGINNER,
      questionIds: [q1._id, q2._id],
      createdBy: admin._id,
    });
  }

  // A learning program covering the likely gap (Testing, advanced React).
  await LearningProgram.updateOne(
    { title: 'Advanced React & Testing' },
    {
      $set: {
        type: LEARNING_PROGRAM_TYPE.CERTIFICATION,
        title: 'Advanced React & Testing',
        description: 'Level up React and learn testing.',
        provider: 'Acme Academy',
        skillsCovered: withSlugs([
          { name: 'React', level: PROFICIENCY.ADVANCED },
          { name: 'Testing', level: PROFICIENCY.INTERMEDIATE },
        ]),
        duration: '4 weeks',
        certificate: true,
        status: OPPORTUNITY_STATUS.PUBLISHED,
        createdBy: industry._id,
      },
    },
    { upsert: true }
  );

  logger.info('Demo data seeded. Login with any of: admin@/student@/faculty@/institution@/industry@sutra.dev (password: Password123)');
  return { users: 5, note: 'password: Password123' };
}
