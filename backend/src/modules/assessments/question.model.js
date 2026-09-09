import mongoose from 'mongoose';
import { ASSESSMENT_TYPE, DIFFICULTY } from '../../config/constants.js';

const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    key: { type: String, required: true, trim: true }, // e.g. "A", "B"
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/**
 * A single question in the question bank. `correctKeys` and `explanation` are
 * sensitive and must never be sent to a candidate before/after submission is
 * controlled by the controller (use toPublicJSON for student-facing views).
 */
const questionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPE),
      default: ASSESSMENT_TYPE.TECHNICAL,
      index: true,
    },
    // The skill this question measures (canonical name), used for per-skill scoring.
    skill: { type: String, trim: true, index: true },
    difficulty: { type: String, enum: Object.values(DIFFICULTY), default: DIFFICULTY.INTERMEDIATE },
    options: [OptionSchema],
    // Supports single or multi-select; a question is correct only if the selected
    // set equals correctKeys exactly.
    correctKeys: [{ type: String, trim: true }],
    points: { type: Number, default: 1, min: 0 },
    explanation: { type: String, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

questionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

// Student-facing projection: no answers or explanations leaked.
questionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: String(this._id),
    text: this.text,
    type: this.type,
    skill: this.skill,
    difficulty: this.difficulty,
    options: this.options.map((o) => ({ key: o.key, text: o.text })),
    points: this.points,
  };
};

export const Question = mongoose.model('Question', questionSchema);
export default Question;
