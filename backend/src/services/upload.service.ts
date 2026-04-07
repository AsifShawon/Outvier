import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import slugify from 'slugify';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { UploadJob } from '../models/UploadJob.model';

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

async function parseCSV(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const records: Record<string, string>[] = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', (row: Record<string, string>) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

export const uploadService = {
  async processUniversitiesCSV(buffer: Buffer, filename: string) {
    const job = await UploadJob.create({ entity: 'universities', filename, status: 'processing' });
    const records = await parseCSV(buffer);
    job.totalRows = records.length;

    let successCount = 0;
    const rowErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const slug = slugify(row.name, { lower: true, strict: true });
        await University.findOneAndUpdate(
          { name: new RegExp(`^${row.name}$`, 'i') },
          {
            name: row.name,
            slug,
            description: row.description || '',
            location: row.location || '',
            state: row.state || '',
            website: row.website || '',
            logo: row.logo || '',
            establishedYear: row.establishedYear ? parseInt(row.establishedYear) : undefined,
            ranking: row.ranking ? parseInt(row.ranking) : undefined,
            type: (row.type as 'public' | 'private') || 'public',
            campuses: row.campuses ? row.campuses.split(';').map((c) => c.trim()) : [],
            internationalStudents: row.internationalStudents !== 'false',
          },
          { upsert: true, new: true }
        );
        successCount++;
      } catch (err: unknown) {
        rowErrors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    job.successCount = successCount;
    job.errorCount = rowErrors.length;
    job.rowErrors = rowErrors;
    job.status = rowErrors.length === records.length ? 'failed' : 'completed';
    await job.save();
    return job;
  },

  async processProgramsCSV(buffer: Buffer, filename: string) {
    const job = await UploadJob.create({ entity: 'programs', filename, status: 'processing' });
    const records = await parseCSV(buffer);
    job.totalRows = records.length;

    let successCount = 0;
    const rowErrors: { row: number; message: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const university = await University.findOne({
          $or: [{ slug: slugify(row.universityName || '', { lower: true, strict: true }) }, { name: row.universityName }],
        });
        if (!university) throw new Error(`University "${row.universityName}" not found`);

        const baseSlug = slugify(`${row.name} ${university.name}`, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (await Program.findOne({ slug, university: { $ne: university._id } })) {
          slug = `${baseSlug}-${counter++}`;
        }

        await Program.findOneAndUpdate(
          { name: new RegExp(`^${row.name}$`, 'i'), university: university._id },
          {
            name: row.name,
            slug,
            university: university._id,
            universityName: university.name,
            universitySlug: university.slug,
            level: row.level || 'bachelor',
            field: row.field || '',
            description: row.description || '',
            duration: row.duration || '',
            tuitionFeeLocal: row.tuitionFeeLocal ? parseFloat(row.tuitionFeeLocal) : undefined,
            tuitionFeeInternational: row.tuitionFeeInternational ? parseFloat(row.tuitionFeeInternational) : undefined,
            intakeMonths: row.intakeMonths ? row.intakeMonths.split(';').map((m) => m.trim()) : [],
            englishRequirements: row.englishRequirements || '',
            academicRequirements: row.academicRequirements || '',
            careerPathways: row.careerPathways ? row.careerPathways.split(';').map((c) => c.trim()) : [],
            campusMode: row.campusMode || 'on-campus',
            website: row.website || '',
          },
          { upsert: true, new: true }
        );
        successCount++;
      } catch (err: unknown) {
        rowErrors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    job.successCount = successCount;
    job.errorCount = rowErrors.length;
    job.rowErrors = rowErrors;
    job.status = rowErrors.length === records.length ? 'failed' : 'completed';
    await job.save();
    return job;
  },

  async getUploadJobs() {
    return UploadJob.find().sort({ createdAt: -1 }).limit(50);
  },
};
