import mongoose from 'mongoose';
import { OPPORTUNITY_STATUS } from '../../config/constants.js';

const { Schema } = mongoose;

export const ACADEMIC_OPP_TYPE = Object.freeze({
  FACULTY_INTERNSHIP: 'faculty_internship',
  INDUSTRIAL_TRAINING: 'industrial_training',
  FDP: 'fdp',
  CONSULTANCY: 'consultancy',
  RESEARCH_COLLABORATION: 'research_collaboration',
  GUEST_LECTURE: 'guest_lecture',
  OTHER: 'other',
});

const InterestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Opportunities aimed at academicians: faculty internships, FDPs, consultancy,
 * research collaborations, guest lectures, etc.
 */
const academicianOpportunitySchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(ACADEMIC_OPP_TYPE),
      default: ACADEMIC_OPP_TYPE.FDP,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerName: { type: String, trim: true },
    areas: [{ type: String, trim: true }],
    eligibility: { type: String, trim: true },
    location: { type: String, trim: true },
    mode: { type: String, trim: true },
    honorarium: { type: Number, min: 0 },
    deadline: { type: Date },
    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.PUBLISHED,
      index: true,
    },
    interested: [InterestSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

academicianOpportunitySchema.index({ title: 'text', description: 'text' });

academicianOpportunitySchema.virtual('interestedCount').get(function () {
  return this.interested?.length || 0;
});

academicianOpportunitySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const AcademicianOpportunity = mongoose.model('AcademicianOpportunity', academicianOpportunitySchema);
export default AcademicianOpportunity;
