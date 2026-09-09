import mongoose from 'mongoose';
import { APPLICATION_STATUS } from '../../config/constants.js';

const { Schema } = mongoose;

const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(APPLICATION_STATUS), required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const subJson = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    if (ret._id != null) ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
};

const RecruiterNoteSchema = new Schema(
  {
    note: { type: String, required: true, trim: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);
RecruiterNoteSchema.set('toJSON', subJson);

const InterviewStageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mode: { type: String, enum: ['onsite', 'remote', 'phone'], default: 'remote' },
    scheduledAt: { type: Date },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    feedback: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 10 },
  },
  { _id: true }
);
InterviewStageSchema.set('toJSON', subJson);

/**
 * A student's application to an opportunity, with recruitment tracking:
 * status flow, recruiter notes, and interview stages.
 */
const applicationSchema = new Schema(
  {
    applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunity: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // denormalized owner

    matchScore: { type: Number, min: 0, max: 100 },
    matchBreakdown: { type: Object },

    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
      index: true,
    },
    statusHistory: [StatusHistorySchema],
    recruiterNotes: [RecruiterNoteSchema],
    interviewStages: [InterviewStageSchema],
    coverLetter: { type: String, trim: true },
  },
  { timestamps: true }
);

// A student can apply to a given opportunity only once.
applicationSchema.index({ applicant: 1, opportunity: 1 }, { unique: true });

applicationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
