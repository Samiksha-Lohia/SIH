import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../../config/constants.js';

const { Schema } = mongoose;

export const DOCUMENT_TYPE = Object.freeze({
  RESUME: 'resume',
  CERTIFICATE: 'certificate',
  INTERNSHIP_REPORT: 'internship_report',
  ASSESSMENT_EVIDENCE: 'assessment_evidence',
  ACADEMIC_RECORD: 'academic_record',
  OTHER: 'other',
});

/**
 * A stored file with metadata, verification status and access control.
 * The actual bytes live in the storage provider (Cloudinary or local disk).
 */
const documentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(DOCUMENT_TYPE), default: DOCUMENT_TYPE.OTHER, index: true },
    title: { type: String, trim: true },
    filename: { type: String, trim: true },
    url: { type: String, required: true },
    key: { type: String, required: true }, // storage key for deletion
    provider: { type: String, enum: ['cloudinary', 'local'], required: true },
    mimeType: { type: String, trim: true },
    size: { type: Number },

    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },

    // Access control: private (owner only), shared (link-holders), public.
    access: { type: String, enum: ['private', 'shared', 'public'], default: 'private' },
  },
  { timestamps: true }
);

documentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Document = mongoose.model('Document', documentSchema);
export default Document;
