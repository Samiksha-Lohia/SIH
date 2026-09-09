import mongoose from 'mongoose';
import { LEARNING_PROGRAM_TYPE, OPPORTUNITY_STATUS, PROFICIENCY } from '../../config/constants.js';

const { Schema } = mongoose;

// A skill a program helps build, with the level it targets (used to map
// learning recommendations to skill gaps in Batch 7).
const CoveredSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    level: { type: String, enum: Object.values(PROFICIENCY), default: PROFICIENCY.INTERMEDIATE },
  },
  { _id: false }
);

const EnrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    certificateUrl: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * A learning program: training, certification, workshop, bootcamp or mentorship
 * initiative — with enrollment tracking.
 */
const learningProgramSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(LEARNING_PROGRAM_TYPE),
      default: LEARNING_PROGRAM_TYPE.TRAINING,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    provider: { type: String, trim: true },
    providerCompany: { type: Schema.Types.ObjectId, ref: 'User' },

    skillsCovered: [CoveredSkillSchema],
    duration: { type: String, trim: true },
    eligibility: { type: String, trim: true },
    fee: { type: Number, min: 0, default: 0 },
    stipend: { type: Number, min: 0 },
    schedule: { type: String, trim: true },
    completionCriteria: { type: String, trim: true },
    certificate: { type: Boolean, default: false },

    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.PUBLISHED,
      index: true,
    },
    enrollments: [EnrollmentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

learningProgramSchema.index({ title: 'text', description: 'text' });

learningProgramSchema.virtual('enrollmentCount').get(function () {
  return this.enrollments?.length || 0;
});

learningProgramSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const LearningProgram = mongoose.model('LearningProgram', learningProgramSchema);
export default LearningProgram;
