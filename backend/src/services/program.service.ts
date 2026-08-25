import mongoose from 'mongoose';
import slugify from 'slugify';
import { Program, IProgram } from '../models/Program.model';
import { University } from '../models/University.model';
import { CreateProgramDTO, UpdateProgramDTO } from '../validators/program.validator';
import { ProgramLocation } from '../models/ProgramLocation.model';
import { Intake } from '../models/Intake.model';
import { FeeObservation } from '../models/FeeObservation.model';
import { EntryRequirement } from '../models/EntryRequirement.model';
import { EnglishRequirement } from '../models/EnglishRequirement.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { RankingObservation } from '../models/RankingObservation.model';
import { Scholarship } from '../models/Scholarship.model';
import { FuzzySearchService } from './fuzzySearch.service';

export interface ProgramQuery {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  field?: string;
  fieldOfStudy?: string;
  campusMode?: string;
  studyMode?: string;
  city?: string;
  state?: string;
  location?: string;
  budget?: string;
  minTuition?: number;
  maxTuition?: number;
  feeYear?: string | number;
  intake?: string;
  englishMax?: number;
  englishRequirement?: string | number;
  scholarshipAvailable?: boolean | string;
  cricos?: boolean | string;
  university?: string;
  provider?: string;
  universitySlug?: string;
  providerSlug?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const programService = {
  async getAll(query: ProgramQuery) {
    const {
      page = 1,
      limit = 12,
      search,
      level,
      field,
      fieldOfStudy,
      campusMode,
      studyMode,
      city,
      state,
      location,
      budget,
      minTuition,
      maxTuition,
      feeYear,
      intake,
      englishMax,
      englishRequirement,
      scholarshipAvailable,
      cricos,
      university,
      provider,
      universitySlug,
      providerSlug,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, any> = { status: 'active' };
    const andConditions: any[] = [];

    // 1. Prominent Typo-Tolerant Search
    if (search && search.trim()) {
      const fuzzyCondition = FuzzySearchService.buildProgramSearchCondition(search);
      if (fuzzyCondition && Object.keys(fuzzyCondition).length > 0) {
        andConditions.push(fuzzyCondition);
      }
    }

    // 2. Degree Level
    if (level && level !== 'all') {
      filter.level = level;
    }

    // 3. Field of Study / Discipline
    const targetField = fieldOfStudy || field;
    if (targetField && targetField !== 'all') {
      const fieldRegex = new RegExp(targetField.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      andConditions.push({
        $or: [
          { fieldOfStudy: fieldRegex },
          { field: fieldRegex },
          { discipline: fieldRegex },
          { 'fieldOfEducation.broadField': fieldRegex },
          { fieldOfEducation1BroadField: fieldRegex },
        ],
      });
    }

    // 4. Delivery / Campus Mode
    const targetMode = studyMode || campusMode;
    if (targetMode && targetMode !== 'all') {
      andConditions.push({
        $or: [
          { availableStudyModes: targetMode },
          { deliveryMode: targetMode },
          { campusMode: targetMode },
        ],
      });
    }

    // 5. Provider / University
    const targetProvider = provider || university;
    if (targetProvider && targetProvider !== 'all') {
      if (mongoose.Types.ObjectId.isValid(targetProvider)) {
        andConditions.push({
          $or: [
            { university: targetProvider },
            { provider: targetProvider },
          ],
        });
      } else {
        const provRegex = new RegExp(targetProvider.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
        andConditions.push({
          $or: [
            { providerName: provRegex },
            { universityName: provRegex },
            { providerSlug: targetProvider },
            { universitySlug: targetProvider },
          ],
        });
      }
    }

    const targetSlug = providerSlug || universitySlug;
    if (targetSlug && targetSlug !== 'all') {
      andConditions.push({
        $or: [
          { providerSlug: targetSlug },
          { universitySlug: targetSlug },
        ],
      });
    }

    // 6. Location (City / State / Campus)
    const targetCity = city || location;
    if (targetCity && targetCity !== 'all') {
      const locations = await ProgramLocation.find({
        $or: [
          { locationCity: { $regex: targetCity, $options: 'i' } },
          { city: { $regex: targetCity, $options: 'i' } },
          { state: { $regex: targetCity, $options: 'i' } },
        ],
      }).select('program').lean();

      const programIdsFromLocations = locations.map((l) => l.program).filter(Boolean);

      andConditions.push({
        $or: [
          { city: { $regex: targetCity, $options: 'i' } },
          { state: { $regex: targetCity, $options: 'i' } },
          { availableCampusCities: { $regex: targetCity, $options: 'i' } },
          { _id: { $in: programIdsFromLocations } },
        ],
      });
    }

    if (state && state !== 'all') {
      andConditions.push({
        $or: [
          { state: { $regex: state, $options: 'i' } },
          { availableCampusStates: { $regex: state, $options: 'i' } },
        ],
      });
    }

    // 7. CRICOS Availability
    const cricosFlag = cricos === true || cricos === 'true';
    if (cricosFlag) {
      andConditions.push({
        $or: [
          { cricosCourseCode: { $exists: true, $ne: null, $nin: ['', 'N/A'] } },
          { isCricosRegistered: true },
        ],
      });
    }

    // 8. Tuition Range and Fee Year
    let minFee = minTuition ? Number(minTuition) : undefined;
    let maxFee = maxTuition ? Number(maxTuition) : undefined;

    if (budget && budget !== 'all') {
      if (budget === 'under-10k') { minFee = 0; maxFee = 10000; }
      else if (budget === '10k-20k') { minFee = 10000; maxFee = 20000; }
      else if (budget === '20k-30k') { minFee = 20000; maxFee = 30000; }
      else if (budget === '30k-40k') { minFee = 30000; maxFee = 40000; }
      else if (budget === '40k-50k') { minFee = 40000; maxFee = 50000; }
      else if (budget === 'over-50k') { minFee = 50000; maxFee = undefined; }
    }

    if (minFee !== undefined || maxFee !== undefined) {
      const feeFilter: Record<string, any> = {};
      if (minFee !== undefined) feeFilter.$gte = minFee;
      if (maxFee !== undefined) feeFilter.$lte = maxFee;

      andConditions.push({
        $or: [
          { primaryFeeAnnualAud: feeFilter },
          { tuitionFeeInternational: feeFilter },
          { tuitionFeeAud: feeFilter },
          { annualTuition: feeFilter },
        ],
      });
    }

    if (feeYear && feeYear !== 'all') {
      andConditions.push({
        $or: [
          { 'tuitionDetails.feeYear': String(feeYear) },
          { feeYear: String(feeYear) },
          { academicYear: Number(feeYear) },
        ],
      });
    }

    // 9. Intakes
    if (intake && intake !== 'all') {
      andConditions.push({
        $or: [
          { intakeMonths: { $in: [new RegExp(intake, 'i')] } },
          { 'intakeDetails.months': { $in: [new RegExp(intake, 'i')] } },
          { availableIntakes: { $in: [new RegExp(intake, 'i')] } },
        ],
      });
    }

    // 10. English Requirement (IELTS max accepted threshold)
    const engScore = englishMax ? Number(englishMax) : englishRequirement ? Number(englishRequirement) : undefined;
    if (engScore !== undefined && !isNaN(engScore)) {
      andConditions.push({
        $or: [
          { 'englishRequirements.ieltsOverall': { $lte: engScore } },
          { ieltsRequirement: { $lte: engScore } },
          { minimumIeltsScore: { $lte: engScore } },
        ],
      });
    }

    // 11. Scholarship Availability
    const hasScholarship = scholarshipAvailable === true || scholarshipAvailable === 'true';
    if (hasScholarship) {
      andConditions.push({
        $or: [
          { scholarshipAvailable: true },
          { 'scholarships.0': { $exists: true } },
          { 'scholarshipInfo.available': true },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Sorting
    const sort: Record<string, any> = {};
    const allowedSorts = [
      'name',
      'level',
      'providerName',
      'universityName',
      'primaryFeeAnnualAud',
      'duration',
      'updatedAt',
      'createdAt',
    ];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const [programs, total] = await Promise.all([
      Program.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('university', 'name slug state city logo logoUrl cricosProviderCode providerType')
        .lean(),
      Program.countDocuments(filter),
    ]);

    return {
      programs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  async getBySlug(slug: string): Promise<Record<string, any>> {
    const program = await Program.findOne({ slug })
      .populate('university')
      .lean();

    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }

    const programId = program._id;
    const universityId = (program.university as any)?._id || program.university;

    // Concurrently aggregate canonical evidence models
    const [intakes, feeObservations, entryReqs, englishReqs, outcomes, rankings, scholarships] = await Promise.all([
      Intake.find({ program: programId, status: { $ne: 'cancelled' } }).sort({ startDate: 1 }).lean(),
      FeeObservation.find({ program: programId }).sort({ academicYear: -1 }).lean(),
      EntryRequirement.find({ program: programId }).lean(),
      EnglishRequirement.find({ program: programId }).lean(),
      universityId ? OutcomeMetric.find({ universityId, status: 'approved' }).sort({ year: -1 }).limit(5).lean() : [],
      universityId ? RankingObservation.find({ provider: universityId }).sort({ editionYear: -1 }).limit(5).lean() : [],
      universityId ? Scholarship.find({ $or: [{ provider: universityId }, { eligiblePrograms: programId }], status: 'published' }).limit(6).lean() : [],
    ]);

    return {
      ...program,
      canonicalData: {
        intakes,
        feeObservations,
        entryRequirements: entryReqs,
        englishRequirements: englishReqs,
        outcomeMetrics: outcomes,
        rankingObservations: rankings,
        scholarships,
        freshness: {
          lastVerifiedAt: program.dataQuality?.lastApprovedAt || program.dataQuality?.lastFetchedAt || program.updatedAt,
          sourceName: program.dataQuality?.sourceName || 'University Handbook / CRICOS Register',
          sourceUrl: program.dataQuality?.sourceUrl || program.website,
          confidence: program.dataQuality?.confidence || 0.95,
        },
      },
    };
  },

  async getById(id: string): Promise<Record<string, any>> {
    const program = await Program.findById(id).populate('university').lean();
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    return program;
  },

  async getByUniversity(universitySlug: string, query: ProgramQuery) {
    return programService.getAll({ ...query, universitySlug });
  },

  async create(data: CreateProgramDTO): Promise<IProgram> {
    const university = await University.findById(data.university);
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }

    const slug = slugify(`${data.name}-${university.name}`, { lower: true, strict: true });
    const program = await Program.create({
      ...data,
      slug,
      universityName: university.name,
      universitySlug: university.slug,
      providerName: university.name,
      providerSlug: university.slug,
    });

    return program;
  },

  async update(id: string, data: UpdateProgramDTO): Promise<IProgram> {
    const program = await Program.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    return program;
  },

  async delete(id: string): Promise<void> {
    const program = await Program.findByIdAndDelete(id);
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
  },

  async getCities(): Promise<string[]> {
    const cities = await Program.distinct('city', { status: 'active', city: { $exists: true, $ne: '' } });
    return cities.filter(Boolean).sort();
  },

  async getFields(): Promise<string[]> {
    const fields = await Program.distinct('field', { status: 'active', field: { $exists: true, $ne: '' } });
    return fields.filter(Boolean).sort();
  },
};
