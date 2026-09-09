import mongoose from 'mongoose';
import { PROFICIENCY } from '../../config/constants.js';

const { Schema } = mongoose;

const AnswerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selected: [{ type: String, trim: true }],
    correct: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

// Per-skill breakdown derived from the attempt (feeds skill-gap + matching).
const SkillScoreSchema = new Schema(
  {
    skill: { type: String, required: true, trim: true },
    score: { type: Number, default: 0 }, // percentage 0-100
    level: { type: String, enum: Object.values(PROFICIENCY), default: PROFICIENCY.BEGINNER },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

/**
 * A single attempt of an assessment by a user, with scoring results.
 */
const attemptSchema = new Schema(
  {
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: [AnswerSchema],
    rawScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // normalized percentage 0-100
    skillScores: [SkillScoreSchema],
    passed: { type: Boolean, default: false },
    startedAt: { type: Date },
    completedAt: { type: Date, default: Date.now },
    durationSec: { type: Number },
  },
  { timestamps: true }
);

attemptSchema.index({ user: 1, assessment: 1, createdAt: -1 });

attemptSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', attemptSchema);
export default AssessmentAttempt;
