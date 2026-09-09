import mongoose from 'mongoose';
import { PROFICIENCY } from '../../config/constants.js';

const { Schema } = mongoose;

/**
 * A required/preferred skill within a role's competency model.
 * `required` distinguishes must-have from nice-to-have; `weight` lets the
 * matching engine emphasize business-critical skills.
 */
const MappedSkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    level: { type: String, enum: Object.values(PROFICIENCY), default: PROFICIENCY.INTERMEDIATE },
    required: { type: Boolean, default: true },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

/**
 * Target Role / job archetype mapped to a set of skills. Drives skill-gap
 * analysis and opportunity matching.
 */
const roleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    mappedSkills: [MappedSkillSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleSchema.index({ title: 'text' });

roleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Role = mongoose.model('Role', roleSchema);
export default Role;
