import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'logout_all'
  | 'token_refreshed'
  | 'token_reuse_detected'
  | 'session_revoked'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'password_changed'
  | 'email_verification_sent'
  | 'email_verified'
  | 'role_changed'
  | 'sensitive_admin_action';

export interface IAuditLog extends Document {
  action: AuditAction;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
