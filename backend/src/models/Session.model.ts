import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  familyId: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  revocationReason?: 'logout' | 'reuse_detected' | 'admin_revoked' | 'expired' | 'password_changed' | 'replaced';
  replacedByTokenHash?: string;
  expiresAt: Date;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, unique: true, index: true },
    familyId: { type: String, required: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    isRevoked: { type: Boolean, default: false, index: true },
    revocationReason: {
      type: String,
      enum: ['logout', 'reuse_detected', 'admin_revoked', 'expired', 'password_changed', 'replaced'],
    },
    replacedByTokenHash: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Expire documents after expiresAt
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
