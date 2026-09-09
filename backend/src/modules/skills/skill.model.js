import mongoose from 'mongoose';
import { SKILL_CATEGORY, PROFICIENCY } from '../../config/constants.js';

const { Schema } = mongoose;

/**
 * Canonical skill in the taxonomy. `slug` is the normalized key used for
 * matching; `aliases` capture synonyms/spellings that map to this skill.
 */
const skillSchema = new Schema(
  {
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: {
      type: String,
      enum: Object.values(SKILL_CATEGORY),
      default: SKILL_CATEGORY.TECHNICAL,
      index: true,
    },
    aliases: [{ type: String, lowercase: true, trim: true }],
    description: { type: String, trim: true },
    proficiencyLevels: {
      type: [String],
      default: Object.values(PROFICIENCY),
    },
    // Aggregated industry demand (updated by analytics in later batches).
    demandScore: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index enables search across name + aliases.
skillSchema.index({ canonicalName: 'text', aliases: 'text' });

skillSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Skill = mongoose.model('Skill', skillSchema);
export default Skill;
