import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ROLE_VALUES, ROLES, USER_STATUS } from '../../config/constants.js';

/**
 * Core User account. Profile detail per role lives in separate profile
 * collections (Batch 2), linked by userId. This keeps auth concerns isolated.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '' },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true,
      default: ROLES.STUDENT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    // Onboarding/profile linkage (populated in later batches)
    profileRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'profileModel' },
    profileModel: {
      type: String,
      enum: ['StudentProfile', 'FacultyProfile', 'Institution', 'Industry', null],
      default: null,
    },
    onboardingComplete: { type: Boolean, default: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Never leak the password hash or internal versioning to clients.
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret._id;
    return ret;
  },
});

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, env.bcryptSaltRounds);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
export default User;
