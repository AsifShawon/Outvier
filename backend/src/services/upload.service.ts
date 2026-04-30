import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { UploadJob, IUploadJob } from '../models/UploadJob.model';
import { seedImportService } from './seedImport.service';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export const uploadService = {
  async processUniversitiesCSV(buffer: Buffer, originalFilename: string): Promise<IUploadJob> {
    // We can reuse the preview logic from seedImportService but directly move it to confirmed if desired, 
    // or just follow the preview -> confirm flow. The prompt suggests a direct process for bulk-upload.
    // However, the prompt says it should return a 'job'.
    
    // For now, let's use the preview logic and then auto-confirm if it's a direct upload, 
    // or just create a job and return it as 'preview' so the UI can show it.
    const previewData = await seedImportService.preview(buffer, originalFilename);
    const job = await UploadJob.findById(previewData.jobId);
    if (!job) throw new Error('Failed to create upload job');
    
    // Alias filename for backward compat
    job.filename = originalFilename;
    await job.save();
    
    return job;
  },

  async processProgramsCSV(buffer: Buffer, originalFilename: string): Promise<IUploadJob> {
    // Similar to universities, but for programs
    // We'll need a program validator and logic similar to seedImportService.preview
    // For now, let's create a minimal job tracker
    
    const job = await UploadJob.create({
      entity: 'programs',
      originalFilename,
      filename: originalFilename,
      status: 'preview',
      totalRows: 0, // Will be updated
    });

    const records: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer.toString());
      stream
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true, bom: true }))
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    job.totalRows = records.length;
    job.validRows = records.length; // Simplified for now
    job.previewRows = records.slice(0, 10).map((r, i) => ({ rowIndex: i + 2, data: r, action: 'create' }));
    await job.save();

    return job;
  },

  async getUploadJobs() {
    return UploadJob.find().sort({ createdAt: -1 }).limit(50).lean();
  }
};
