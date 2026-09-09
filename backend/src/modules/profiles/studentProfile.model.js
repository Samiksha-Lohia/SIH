import mongoose from 'mongoose';
import { WORK_MODE } from '../../config/constants.js';
import {
  SkillRefSchema,
  EducationSchema,
  ExperienceSchema,
  ProjectSchema,
  CertificationSchema,
} from './subschemas.js';

const { Schema } = mongoose;

/**
 * StudentProfile — the rich, document-shaped profile linked 1:1 to a User.
 * Feeds the assessment, skill-gap, matching and portfolio engines.
 */
const studentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // Academic
    branch: { type: String, trim: true },
    semester: { type: Number },
    graduationYear: { type: Number },
    education: [EducationSchema],

    // Competencies
    skills: [SkillRefSchema],
    softSkills: [SkillRefSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    certifications: [CertificationSchema],
    achievements: [{ type: String, trim: true }],

    // Aspirations
    careerGoals: {
      targetRoles: [{ type: String, trim: true }],
      preferredIndustries: [{ type: String, trim: true }],
      summary: { type: String, trim: true },
    },

    // Preferences
    preferences: {
      workMode: { type: String, enum: [...Object.values(WORK_MODE), ''], default: '' },
      locations: [{ type: String, trim: true }],
      jobTypes: [{ type: String, trim: true }],
      stipendExpectation: { type: Number },
    },

    // Links
    portfolio: {
      resumeUrl: { type: String, trim: true },
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      website: { type: String, trim: true },
      otherLinks: [{ type: String, trim: true }],
    },

    // Derived, updated on save (see profile.service)
    completeness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

studentProfileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
