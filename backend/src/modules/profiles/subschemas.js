import mongoose from 'mongoose';
import { PROFICIENCY } from '../../config/constants.js';

const { Schema } = mongoose;

// A skill reference embedded in a profile. `name` is the (eventually normalized)
// skill label; `level` is ordinal proficiency used by the matching/gap engines.
export const SkillRefSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: Object.values(PROFICIENCY),
      default: PROFICIENCY.INTERMEDIATE,
    },
  },
  { _id: false }
);

export const EducationSchema = new Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    branch: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    graduationYear: { type: Number },
    cgpa: { type: Number },
  },
  { _id: false }
);

export const ExperienceSchema = new Schema(
  {
    title: { type: String, trim: true },
    organization: { type: String, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

export const ProjectSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    techStack: [{ type: String, trim: true }],
    link: { type: String, trim: true },
    role: { type: String, trim: true },
  },
  { _id: false }
);

export const CertificationSchema = new Schema(
  {
    name: { type: String, trim: true },
    issuer: { type: String, trim: true },
    credentialId: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    url: { type: String, trim: true },
  },
  { _id: false }
);

export const ContactSchema = new Schema(
  {
    person: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);
