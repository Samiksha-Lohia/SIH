import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../../config/constants.js';

const { Schema } = mongoose;

export const PORTFOLIO_ITEM_TYPE = Object.freeze({
  SKILL: 'skill',
  CERTIFICATION: 'certification',
  PROJECT: 'project',
  INTERNSHIP: 'internship',
  ACHIEVEMENT: 'achievement',
  ASSESSMENT: 'assessment',
  OTHER: 'other',
});

const EvidenceSchema = new Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
    document: { type: Schema.Types.ObjectId, ref: 'Document' },
  },
  { _id: false }
);

/**
 * A verifiable entry in a student's digital employability portfolio.
 */
const portfolioItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(PORTFOLIO_ITEM_TYPE),
      default: PORTFOLIO_ITEM_TYPE.PROJECT,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    evidence: [EvidenceSchema],

    // Verification metadata (trust framework).
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
      index: true,
    },
    issuer: { type: String, trim: true },
    credentialId: { type: String, trim: true },
    issueDate: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },

    // Controls appearance in the public share view.
    visibility: { type: String, enum: ['public', 'private'], default: 'private', index: true },

    // Optional link back to a source record (e.g. assessment attempt).
    sourceRef: { type: Schema.Types.ObjectId },
    sourceModel: { type: String },
  },
  { timestamps: true }
);

portfolioItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);
export default PortfolioItem;
