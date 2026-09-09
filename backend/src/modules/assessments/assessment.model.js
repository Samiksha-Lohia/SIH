import mongoose from 'mongoose';
import { ASSESSMENT_TYPE, DIFFICULTY } from '../../config/constants.js';

const { Schema } = mongoose;

/**
 * An assessment groups question-bank items into a role/skill-targeted test.
 */
const assessmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPE),
      default: ASSESSMENT_TYPE.TECHNICAL,
      index: true,
    },
    // Target role (title) this assessment is aligned to, if any.
    role: { type: String, trim: true, index: true },
    // Skills this assessment covers (canonical names).
    skillSet: [{ type: String, trim: true }],
    difficulty: { type: String, enum: Object.values(DIFFICULTY), default: DIFFICULTY.INTERMEDIATE },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    durationMinutes: { type: Number, default: 30 },
    passingScore: { type: Number, default: 50, min: 0, max: 100 },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assessmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
