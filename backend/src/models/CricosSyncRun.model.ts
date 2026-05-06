import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosSyncRun extends Document {
  syncType: "all" | "provider" | "resource";
  providerCode?: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: Date;
  finishedAt?: Date;
  resourcesSynced: string[];
  stats: {
    institutionsFetched: number;
    coursesFetched: number;
    locationsFetched: number;
    courseLocationsFetched: number;
    stagedChangesCreated: number;
    universitiesMatched: number;
    programsMatched: number;
    errorsCount: number;
  };
  errors: string[];
  triggeredBy: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const CricosSyncRunSchema = new Schema<ICricosSyncRun>(
  {
    syncType: { type: String, enum: ["all", "provider", "resource"], required: true },
    providerCode: { type: String, trim: true },
    status: { type: String, enum: ["queued", "running", "completed", "failed"], default: "queued" },
    startedAt: { type: Date, default: Date.now },
    finishedAt: Date,
    resourcesSynced: [{ type: String }],
    stats: {
      institutionsFetched: { type: Number, default: 0 },
      coursesFetched: { type: Number, default: 0 },
      locationsFetched: { type: Number, default: 0 },
      courseLocationsFetched: { type: Number, default: 0 },
      stagedChangesCreated: { type: Number, default: 0 },
      universitiesMatched: { type: Number, default: 0 },
      programsMatched: { type: Number, default: 0 },
      errorsCount: { type: Number, default: 0 },
    },
    errors: [{ type: String }],
    triggeredBy: { type: String, default: "admin" },
    source: { type: String, default: "data.gov.au CKAN DataStore API" },
  },
  { timestamps: true }
);

export const CricosSyncRun = mongoose.model<ICricosSyncRun>('CricosSyncRun', CricosSyncRunSchema);
