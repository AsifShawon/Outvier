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

    job.validRows = successCount;
    job.invalidRows = rowErrors.length;
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
        // Normalize column names: support both snake_case (CSV) and camelCase
        const universityName = row.university_name || row.universityName || '';
        const programName    = row.program_name    || row.name          || '';
        const level          = row.degree_level    || row.level         || 'bachelor';
        const field          = row.field_of_study  || row.field         || '';
        const description    = row.description     || '';
        const duration       = row.duration        || '';
        const tuitionRaw     = row.annual_tuition_fee_aud || row.tuitionFeeInternational || '';
        const intakeRaw      = row.intake_periods   || row.intakeMonths  || '';
        const englishReq     = row.english_requirement || row.englishRequirements || '';
        const campusMode     = row.delivery_mode   || row.campusMode    || 'on-campus';
        const website        = row.source_url      || row.website       || '';

        const university = await University.findOne({
          $or: [
            { slug: slugify(universityName, { lower: true, strict: true }) },
            { name: new RegExp(`^${universityName}$`, 'i') },
          ],
        });
        if (!university) throw new Error(`University "${universityName}" not found`);

        const baseSlug = slugify(`${programName} ${university.name}`, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;
        while (await Program.findOne({ slug, university: { $ne: university._id } })) {
          slug = `${baseSlug}-${counter++}`;
        }

        await Program.findOneAndUpdate(
          { name: new RegExp(`^${programName}$`, 'i'), university: university._id },
          {
            name: programName,
            slug,
            university: university._id,
            universityName: university.name,
            universitySlug: university.slug,
            level,
            field,
            description,
            duration,
            tuitionFeeLocal: undefined,
            tuitionFeeInternational: tuitionRaw ? parseFloat(tuitionRaw) : undefined,
            intakeMonths: intakeRaw ? intakeRaw.split(';').map((m: string) => m.trim()) : [],
            englishRequirements: englishReq,
            academicRequirements: row.academicRequirements || '',
            careerPathways: row.careerPathways ? row.careerPathways.split(';').map((c: string) => c.trim()) : [],
            campusMode,
            website,
          },
          { upsert: true, new: true }
        );
        successCount++;
      } catch (err: unknown) {
        rowErrors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    job.validRows = successCount;
    job.invalidRows = rowErrors.length;
    job.rowErrors = rowErrors;
    job.status = rowErrors.length === records.length ? 'failed' : 'completed';
    await job.save();
    return job;
  },

  async getUploadJobs() {
    return UploadJob.find().sort({ createdAt: -1 }).limit(50);
  },
};
