import mongoose from 'mongoose';

const { Schema } = mongoose;

const AssignedStudentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned',
    },
    attempt: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt' },
    score: { type: Number },
    passed: { type: Boolean },
    completedAt: { type: Date },
  },
  { _id: false }
);

/**
 * AssessmentCampaign — An institution-created campaign that assigns a question-bank
 * assessment to specific students or a cohort, with deadline and completion tracking.
 */
const assessmentCampaignSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    institution: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    cohort: { type: String, trim: true, default: 'General Cohort' },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    assignedStudents: [AssignedStudentSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assessmentCampaignSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const AssessmentCampaign = mongoose.model('AssessmentCampaign', assessmentCampaignSchema);
export default AssessmentCampaign;
