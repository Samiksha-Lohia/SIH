import { z } from 'zod';
import { PROFICIENCY, WORK_MODE, VERIFICATION_STATUS } from '../../config/constants.js';

const proficiency = z.enum(Object.values(PROFICIENCY));
const skillRef = z.object({
  name: z.string().min(1).max(100),
  level: proficiency.optional().default(PROFICIENCY.INTERMEDIATE),
});

const education = z.object({
  institution: z.string().max(200).optional(),
  degree: z.string().max(120).optional(),
  branch: z.string().max(120).optional(),
  fieldOfStudy: z.string().max(120).optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  graduationYear: z.number().int().optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

const project = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  techStack: z.array(z.string().max(60)).optional(),
  link: z.string().max(500).optional(),
  role: z.string().max(120).optional(),
});

const certification = z.object({
  name: z.string().max(200).optional(),
  issuer: z.string().max(200).optional(),
  credentialId: z.string().max(200).optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  url: z.string().max(500).optional(),
});

export const updateStudentSchema = z
  .object({
    branch: z.string().max(120).optional(),
    semester: z.number().int().min(1).max(12).optional(),
    graduationYear: z.number().int().optional(),
    education: z.array(education).optional(),
    skills: z.array(skillRef).optional(),
    softSkills: z.array(skillRef).optional(),
    projects: z.array(project).optional(),
    certifications: z.array(certification).optional(),
    achievements: z.array(z.string().max(300)).optional(),
    careerGoals: z
      .object({
        targetRoles: z.array(z.string().max(120)).optional(),
        preferredIndustries: z.array(z.string().max(120)).optional(),
        summary: z.string().max(2000).optional(),
      })
      .optional(),
    preferences: z
      .object({
        workMode: z.enum([...Object.values(WORK_MODE), '']).optional(),
        locations: z.array(z.string().max(120)).optional(),
        jobTypes: z.array(z.string().max(60)).optional(),
        stipendExpectation: z.number().min(0).optional(),
      })
      .optional(),
    portfolio: z
      .object({
        resumeUrl: z.string().max(500).optional(),
        github: z.string().max(300).optional(),
        linkedin: z.string().max(300).optional(),
        website: z.string().max(300).optional(),
        otherLinks: z.array(z.string().max(500)).optional(),
      })
      .optional(),
  })
  .strip();

export const updateFacultySchema = z
  .object({
    institution: z.string().max(200).optional(),
    designation: z.string().max(120).optional(),
    expertise: z.array(z.string().max(120)).optional(),
    qualifications: z.array(z.string().max(200)).optional(),
    experienceYears: z.number().min(0).max(70).optional(),
    interests: z.array(z.string().max(120)).optional(),
    availability: z
      .object({
        openToMentorship: z.boolean().optional(),
        openToConsultancy: z.boolean().optional(),
        slots: z
          .array(z.object({ day: z.string(), from: z.string(), to: z.string() }))
          .optional(),
      })
      .optional(),
    collaborationPreferences: z.array(z.string().max(60)).optional(),
  })
  .strip();

export const updateInstitutionSchema = z
  .object({
    name: z.string().max(200).optional(),
    departments: z.array(z.string().max(120)).optional(),
    address: z.string().max(300).optional(),
    location: z.string().max(200).optional(),
    website: z.string().max(300).optional(),
    contact: z
      .object({
        person: z.string().max(120).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
      })
      .optional(),
  })
  .strip();

export const updateIndustrySchema = z
  .object({
    companyName: z.string().max(200).optional(),
    sector: z.string().max(120).optional(),
    location: z.string().max(200).optional(),
    website: z.string().max(300).optional(),
    description: z.string().max(2000).optional(),
    size: z.string().max(60).optional(),
    contact: z
      .object({
        person: z.string().max(120).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
      })
      .optional(),
  })
  .strip();

export const voiceProfileSchema = z.object({
  transcript: z.string().min(3, 'transcript is required').max(8000),
  autoMerge: z.boolean().optional().default(false),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id'),
});

export const verifyProfileSchema = z
  .object({
    status: z.enum([VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED]).optional(),
    verificationStatus: z.enum([VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED]).optional(),
  })
  .refine((data) => data.status || data.verificationStatus, {
    message: 'Either status or verificationStatus is required and must be "verified" or "rejected"',
  });

export const listInstitutionsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  verificationStatus: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  q: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});

export const listIndustriesQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  verificationStatus: z.enum(Object.values(VERIFICATION_STATUS)).optional(),
  q: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
});
