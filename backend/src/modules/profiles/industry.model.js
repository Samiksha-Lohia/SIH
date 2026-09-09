import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../../config/constants.js';
import { ContactSchema } from './subschemas.js';

const { Schema } = mongoose;

/**
 * Industry — a company/recruiter account. Verified companies can publish
 * high-impact opportunities and receive candidate recommendations.
 */
const industrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    companyName: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, trim: true },
    size: { type: String, trim: true },
    contact: ContactSchema,
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    completeness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

industrySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Industry = mongoose.model('Industry', industrySchema);
export default Industry;
