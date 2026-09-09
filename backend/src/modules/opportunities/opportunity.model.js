import mongoose from 'mongoose';
import {
  OPPORTUNITY_TYPE,
  OPPORTUNITY_STATUS,
  WORK_MODE,
  PROFICIENCY,
} from '../../config/constants.js';

const { Schema } = mongoose;

// Skill requirement on an opportunity (parallels Role.mappedSkills so the
// matching engine can treat roles and opportunities uniformly).
const OppSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    level: { type: String, enum: Object.values(PROFICIENCY), default: PROFICIENCY.INTERMEDIATE },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const EligibilitySchema = new Schema(
  {
    minCgpa: { type: Number, min: 0, max: 10 },
    graduationYears: [{ type: Number }],
    branches: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * An opportunity published by an industry account: internship, job,
 * apprenticeship, live project, industrial training or entry-level role.
 */
const opportunitySchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(OPPORTUNITY_TYPE),
      default: OPPORTUNITY_TYPE.INTERNSHIP,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Owning company (User with role=industry). companyName denormalized for lists.
    company: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, trim: true },

    role: { type: String, trim: true }, // target role title (optional)
    requiredSkills: [OppSkillSchema],
    preferredSkills: [OppSkillSchema],
    eligibility: EligibilitySchema,

    location: { type: String, trim: true, index: true },
    workMode: { type: String, enum: Object.values(WORK_MODE), default: WORK_MODE.ONSITE },
    duration: { type: String, trim: true },
    stipend: { type: Number, min: 0 },
    salary: { type: Number, min: 0 },
    openings: { type: Number, default: 1, min: 1 },
    deadline: { type: Date },

    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.DRAFT,
      index: true,
    },
    // Set true when published by a verified company (trust framework).
    verificationBadge: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

opportunitySchema.index({ title: 'text', description: 'text' });

opportunitySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Opportunity = mongoose.model('Opportunity', opportunitySchema);
export default Opportunity;
