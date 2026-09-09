import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../../config/constants.js';

const { Schema } = mongoose;

/**
 * In-app notification. `meta` carries structured context (ids, scores) so the
 * frontend can deep-link; `link` is an optional client route hint.
 */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    link: { type: String, trim: true },
    meta: { type: Object },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
