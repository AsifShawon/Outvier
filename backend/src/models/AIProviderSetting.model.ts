import mongoose, { Document, Schema } from 'mongoose';

export type AIProvider = 'groq' | 'nvidia' | 'mistral';

export interface IAIProviderSetting extends Document {
  provider: AIProvider;
  aiModel: string;
  encryptedApiKey?: string;
  baseUrl?: string;
  isActive: boolean;
  lastTestedAt?: Date;
  testStatus?: 'success' | 'failure' | 'untested';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIProviderSettingSchema = new Schema<IAIProviderSetting>(
  {
    provider: {
      type: String,
      enum: ['groq', 'nvidia', 'mistral'],
      required: true,
      unique: true,
    },
    aiModel: { type: String, required: true, trim: true },
    encryptedApiKey: { type: String, select: false }, // never returned by default
    baseUrl: String,
    isActive: { type: Boolean, default: false },
    lastTestedAt: Date,
    testStatus: { type: String, enum: ['success', 'failure', 'untested'], default: 'untested' },
    createdBy: String,
    updatedBy: String,
  },
  { timestamps: true }
);

// Only one provider active at a time (enforced at service layer)
AIProviderSettingSchema.index({ isActive: 1 });

export const AIProviderSetting = mongoose.model<IAIProviderSetting>('AIProviderSetting', AIProviderSettingSchema);
