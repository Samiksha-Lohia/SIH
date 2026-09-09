import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Immutable-ish audit trail for sensitive actions (verification, application
 * status changes, document access, authentication).
 */
const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    resource: { type: String },
    resourceId: { type: String },
    meta: { type: Object },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
