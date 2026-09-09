import mongoose from 'mongoose';

const { Schema } = mongoose;

export const MENTORSHIP_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const SlotSchema = new Schema(
  {
    day: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false }
);

/**
 * A mentorship relationship/request between a mentee (student/faculty) and a
 * mentor (faculty/industry).
 */
const mentorshipSchema = new Schema(
  {
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    slots: [SlotSchema],
    status: {
      type: String,
      enum: Object.values(MENTORSHIP_STATUS),
      default: MENTORSHIP_STATUS.REQUESTED,
      index: true,
    },
    responseMessage: { type: String, trim: true },
    respondedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

mentorshipSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Mentorship = mongoose.model('Mentorship', mentorshipSchema);
export default Mentorship;
