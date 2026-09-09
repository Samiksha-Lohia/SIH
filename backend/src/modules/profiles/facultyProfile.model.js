import mongoose from 'mongoose';
import { ExperienceSchema } from './subschemas.js';

const { Schema } = mongoose;

const AvailabilitySlotSchema = new Schema(
  {
    day: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * FacultyProfile — academician profile for mentorship, FDPs, consultancy,
 * research collaboration and faculty internships.
 */
const facultyProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    institution: { type: String, trim: true },
    designation: { type: String, trim: true },
    expertise: [{ type: String, trim: true }],
    qualifications: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    experience: [ExperienceSchema],
    interests: [{ type: String, trim: true }],
    availability: {
      openToMentorship: { type: Boolean, default: false },
      openToConsultancy: { type: Boolean, default: false },
      slots: [AvailabilitySlotSchema],
    },
    // e.g. ['research', 'guest_lecture', 'fdp', 'consultancy', 'industrial_training']
    collaborationPreferences: [{ type: String, trim: true }],
    completeness: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

facultyProfileSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);
export default FacultyProfile;
