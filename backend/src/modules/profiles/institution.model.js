import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../../config/constants.js';
import { ContactSchema } from './subschemas.js';

const { Schema } = mongoose;

/**
 * Institution — a college/university account. Verified institutions unlock
 * institutional analytics (see verification/trust framework).
 */
const institutionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    departments: [{ type: String, trim: true }],
    address: { type: String, trim: true },
    location: { type: String, trim: true },
    website: { type: String, trim: true },
    contact: ContactSchema,
    adminUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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

institutionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Institution = mongoose.model('Institution', institutionSchema);
export default Institution;
