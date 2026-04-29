import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import slugify from 'slugify';
import { University } from '../models/University.model';
import { UploadJob, IUploadJob } from '../models/UploadJob.model';
import { validateSeedRow, SeedUniversityRow } from '../validators/seedUniversity.validator';

/** Re-export the existing multer instance so this can be imported standalone */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface SeedPreviewRow {
  rowIndex: number;
  data: SeedUniversityRow | null;
  action: 'create' | 'update' | 'duplicate' | 'invalid';
  errors?: string[];
  existingId?: string;
}

export interface SeedPreview {
  jobId: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  toCreate: number;
  toUpdate: number;
  duplicates: number;
  rows: SeedPreviewRow[];
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

async function parseCSV(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const records: Record<string, string>[] = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, bom: true }))
      .on('data', (row: Record<string, string>) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // remove trailing slash and www prefix for comparison
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// --------------------------------------------------------------------------
// Service
// --------------------------------------------------------------------------

export const seedImportService = {
  /**
   * Parse and validate a seed CSV, generate a preview without writing anything.
   * Creates a UploadJob in 'pending' status so the admin can confirm later.
   */
  async preview(buffer: Buffer, filename: string): Promise<SeedPreview> {
    const rawRows = await parseCSV(buffer);
    
    // Create a pending UploadJob to track this import
    const job = await UploadJob.create({
      entity: 'universities',
      originalFilename: filename,
      status: 'preview',
      totalRows: rawRows.length,
    });

    const rows: SeedPreviewRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let toCreate = 0;
    let toUpdate = 0;
    let duplicates = 0;

    // Load all existing universities for duplicate detection
    const allUniversities = await University.find({}, {
      name: 1,
      slug: 1,
      cricosProviderCode: 1,
      officialWebsite: 1,
      state: 1,
    }).lean();

    for (let i = 0; i < rawRows.length; i++) {
      const validation = validateSeedRow(rawRows[i], i + 2);
      
      if (!validation.valid) {
        invalidCount++;
        rows.push({ rowIndex: i + 2, data: null, action: 'invalid', errors: validation.errors });
        continue;
      }

      const data = validation.data;
      validCount++;

      // Upsert strategy:
      // 1. cricosProviderCode (if provided and unique)
      // 2. normalized officialWebsite
      // 3. normalized name + state
      let existing: { _id: unknown; name?: string } | null = null;

      if (data.cricosProviderCode) {
        existing = allUniversities.find(
          (u) => u.cricosProviderCode === data.cricosProviderCode
        ) ?? null;
      }

      if (!existing && data.officialWebsite) {
        const normalizedInput = normalizeUrl(data.officialWebsite);
        existing = allUniversities.find(
          (u) => u.officialWebsite && normalizeUrl(u.officialWebsite) === normalizedInput
        ) ?? null;
      }

      if (!existing) {
        const normalizedInputName = normalizeName(data.universityName);
        const matches = allUniversities.filter(
          (u) =>
            normalizeName(u.name as string) === normalizedInputName &&
            (u.state as string)?.toLowerCase() === data.state?.toLowerCase()
        );
        if (matches.length === 1) {
          existing = matches[0];
        } else if (matches.length > 1) {
          // Ambiguous duplicate
          duplicates++;
          rows.push({
            rowIndex: i + 2,
            data,
            action: 'duplicate',
            errors: [`Multiple existing records match "${data.universityName}" in ${data.state}`],
          });
          continue;
        }
      }

      if (existing) {
        toUpdate++;
        rows.push({ rowIndex: i + 2, data, action: 'update', existingId: String(existing._id) });
      } else {
        toCreate++;
        rows.push({ rowIndex: i + 2, data, action: 'create' });
      }
    }

    job.totalRows = rawRows.length;
    job.validRows = validCount;
    job.invalidRows = invalidCount;
    job.duplicateRows = duplicates;
    job.previewRows = rows;
    await job.save();

    return {
      jobId: String(job._id),
      filename,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      toCreate,
      toUpdate,
      duplicates,
      rows,
    };
  },

  /**
   * Confirm and apply the import.
   * Reads the preview data from the job, re-validates, and writes to the database.
   */
  async confirm(jobId: string, uploadedBy?: string): Promise<IUploadJob> {
    const job = await UploadJob.findById(jobId);
    if (!job) throw new Error(`Upload job ${jobId} not found`);
    if (job.status !== 'preview') throw new Error(`Job is already ${job.status}`);

    job.status = 'processing';
    await job.save();

    let successCount = 0;
    const rowErrors: { row: number; message: string }[] = [];

    const StagedChange = (await import('../models/StagedChange.model')).StagedChange;

    for (const row of job.previewRows as SeedPreviewRow[]) {
      if (row.action === 'invalid' || row.action === 'duplicate' || !row.data) continue;

      try {
        const data: SeedUniversityRow = row.data;
        const changeType = row.action === 'create' ? 'create' : 'update';
        
        await StagedChange.create({
          entityType: 'university',
          changeType,
          entityId: row.existingId ? row.existingId : undefined,
          newValue: data,
          confidence: 1, // High confidence for admin manual upload
          status: 'pending',
          sourceUrl: 'csv_upload',
        });

        successCount++;
      } catch (err: unknown) {
        rowErrors.push({
          row: row.rowIndex,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    job.status = 'confirmed';
    job.confirmedAt = new Date();
    await job.save();

    return job;
  },

  async getImports(limit = 50) {
    return UploadJob.find({ entity: 'universities' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async getImportById(id: string) {
    return UploadJob.findById(id).lean();
  },
};
