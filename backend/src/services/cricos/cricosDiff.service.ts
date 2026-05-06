import crypto from 'crypto';
import { StagedChange } from '../../models/StagedChange.model';
import mongoose from 'mongoose';

const IGNORED_FIELDS = new Set([
  '_id', '__v', 'id',
  'createdAt', 'updatedAt',
  'fetchedAt', 'lastSyncedAt', 'lastCricosSyncedAt',
  'raw', 'syncRunId', 'ingestionJobId',
]);

export const cricosDiffService = {
  hashRecord(record: Record<string, unknown>): string {
    const clean = this.stripIgnored(record);
    const stable = JSON.stringify(clean, Object.keys(clean).sort());
    return crypto.createHash('sha256').update(stable).digest('hex').slice(0, 16);
  },

  stripIgnored(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!IGNORED_FIELDS.has(k)) out[k] = v;
    }
    return out;
  },

  hasMeaningfulChange(
    oldValue: Record<string, unknown> | undefined,
    newValue: Record<string, unknown>
  ): boolean {
    if (!oldValue) return true;
    return this.hashRecord(oldValue) !== this.hashRecord(newValue);
  },

  buildDiff(
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>
  ): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of keys) {
      if (IGNORED_FIELDS.has(key)) continue;
      const o = oldValue[key];
      const n = newValue[key];
      if (JSON.stringify(o) !== JSON.stringify(n)) {
        diff[key] = { old: o, new: n };
      }
    }

    return diff;
  },

  buildDiffSummary(diff: Record<string, { old: unknown; new: unknown }>): string {
    const parts: string[] = [];
    for (const [field, { old: o, new: n }] of Object.entries(diff)) {
      const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
      parts.push(`${label} changed from ${o ?? 'null'} to ${n ?? 'null'}`);
    }
    return parts.slice(0, 5).join('; ') + (parts.length > 5 ? ` (+${parts.length - 5} more)` : '');
  },

  async createStagedChangeIfChanged(params: {
    entityType: string;
    externalKey: string;
    oldValue: Record<string, unknown> | undefined;
    newValue: Record<string, unknown>;
    entityId?: mongoose.Types.ObjectId;
    syncRunId?: mongoose.Types.ObjectId;
    universityId?: mongoose.Types.ObjectId;
    sourceResourceId?: string;
    rawHash?: string;
  }): Promise<'created' | 'skipped' | 'unchanged'> {
    const {
      entityType, externalKey, oldValue, newValue,
      entityId, syncRunId, universityId, sourceResourceId, rawHash,
    } = params;

    // Skip if nothing changed
    if (!this.hasMeaningfulChange(oldValue, newValue)) return 'unchanged';

    // Skip if identical pending change already exists for this external key + hash
    const existingPending = await StagedChange.findOne({
      entityType,
      externalKey,
      status: 'pending',
      ...(rawHash ? { rawHash } : {}),
    }).lean();

    if (existingPending) return 'skipped';

    const diff = oldValue ? this.buildDiff(oldValue, newValue) : {};
    const diffSummary = Object.keys(diff).length > 0 ? this.buildDiffSummary(diff) : undefined;
    const newHash = rawHash ?? this.hashRecord(newValue);

    await StagedChange.create({
      entityType,
      entityId,
      universityId,
      changeType: oldValue ? 'update' : 'create',
      oldValue,
      newValue,
      diff,
      diffSummary,
      externalKey,
      syncRunId,
      sourceName: 'CRICOS data.gov.au CKAN DataStore API',
      sourceResourceId,
      rawHash: newHash,
      confidence: 0.95,
      confidenceScore: 95,
      autoApprovalEligible: false,
      status: 'pending',
    });

    return 'created';
  },
};
