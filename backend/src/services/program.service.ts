import mongoose from 'mongoose';
import slugify from 'slugify';
import { Program, IProgram } from '../models/Program.model';
import { University } from '../models/University.model';
import { CreateProgramDTO, UpdateProgramDTO } from '../validators/program.validator';
import { ProgramLocation } from '../models/ProgramLocation.model';

const escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

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
  budget?: string;
  intake?: string;
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
      budget,
      intake,
      universitySlug,
      providerSlug,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;

    const filter: Record<string, any> = { status: 'active' };
    const andConditions: any[] = [];

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      andConditions.push({
        $or: [
          { name: searchRegex },
          { providerName: searchRegex },
          { universityName: searchRegex },
          { fieldOfStudy: searchRegex },
          { field: searchRegex },
          { discipline: searchRegex }
        ]
      });
    }
    if (level && level !== 'all') filter.level = level;
    
    const targetField = fieldOfStudy || field;
    if (targetField && targetField !== 'all') {
      const fieldRegex = new RegExp(escapeRegex(targetField), 'i');
      andConditions.push({
        $or: [
          { fieldOfStudy: fieldRegex },
          { field: fieldRegex }
        ]
      });
    }

    const targetMode = studyMode || campusMode;
    if (targetMode && targetMode !== 'all') {
      andConditions.push({
        $or: [
          { availableStudyModes: targetMode },
          { deliveryMode: targetMode },
          { campusMode: targetMode }
        ]
      });
    }

    const targetSlug = providerSlug || universitySlug;
    if (targetSlug) {
      andConditions.push({
        $or: [
          { providerSlug: targetSlug },
          { universitySlug: targetSlug }
        ]
      });
    }

    if (intake && intake !== 'all') {
      andConditions.push({
        $or: [
          { intakeMonths: { $in: [new RegExp(intake, 'i')] } },
          { 'intakeDetails.months': { $in: [new RegExp(intake, 'i')] } }
        ]
      });
    }

    if (city && city !== 'all') {
      const locations = await ProgramLocation.find({ 
        $or: [
          { locationCity: { $regex: city, $options: 'i' } },
          { city: { $regex: city, $options: 'i' } }
        ]
      }).select('program').lean();
      
      const programIdsFromLocations = locations.map(l => l.program).filter(Boolean);
      
      andConditions.push({
        $or: [
          { city: { $regex: city, $options: 'i' } },
          { availableCampusCities: { $regex: city, $options: 'i' } },
          { _id: { $in: programIdsFromLocations } }
        ]
      });
    }

    if (budget && budget !== 'all') {
      let feeCondition: any = null;
      if (budget === 'under-10k') feeCondition = { $lt: 10000 };
      else if (budget === '10k-20k') feeCondition = { $gte: 10000, $lte: 20000 };
      else if (budget === '20k-30k') feeCondition = { $gte: 20000, $lte: 30000 };
      else if (budget === '30k-40k') feeCondition = { $gte: 30000, $lte: 40000 };
      else if (budget === '40k-50k') feeCondition = { $gte: 40000, $lte: 50000 };
      else if (budget === 'over-50k') feeCondition = { $gt: 50000 };

      if (feeCondition) {
        andConditions.push({
          $or: [
            { primaryFeeAnnualAud: feeCondition },
            { tuitionFeeInternational: feeCondition },
            { tuitionFeeLocal: feeCondition },
            { tuitionFeeAud: feeCondition },
            { annualTuition: feeCondition }
          ]
        });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const sort: Record<string, any> = {};
    const allowedSorts = ['name', 'level', 'providerName', 'universityName', 'primaryFeeAnnualAud', 'updatedAt'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const [programs, total] = await Promise.all([
      Program.find(filter).sort(sort).skip(skip).limit(limit),
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
        hasPrevPage: page > 1
      },
    };
  },

  async getBySlug(slug: string): Promise<IProgram> {
    const program = await Program.findOne({ slug });
    if (!program) {
      throw Object.assign(new Error('Program not found'), { statusCode: 404 });
    }
    return program;
  },

  async getById(id: string): Promise<IProgram> {
    const program = await Program.findById(id);
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

    const baseSlug = slugify(`${data.name} ${university.name}`, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Program.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const canonicalFieldOfStudy = data.field;
    const primaryFeeAnnualAud = data.tuitionFeeInternational || data.tuitionFeeLocal;

    const program = await Program.create({
      ...data,
      slug,
      provider: university._id,
      university: university._id,
      providerName: university.name,
      providerSlug: university.slug,
      universityName: university.name,
      universitySlug: university.slug,
      fieldOfStudy: canonicalFieldOfStudy,
      primaryFeeAnnualAud,
      status: 'active',
    });

    // Increment university programCount
    await University.findByIdAndUpdate(university._id, { $inc: { programCount: 1 } });

    return program;
  },

  async update(id: string, data: UpdateProgramDTO): Promise<IProgram> {
    const updateData: any = { ...data };
    if (data.field) {
      updateData.fieldOfStudy = data.field;
    }
    if (data.tuitionFeeInternational !== undefined) {
      updateData.primaryFeeAnnualAud = data.tuitionFeeInternational;
    }
    const program = await Program.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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
    if (program.university || program.provider) {
      await University.findByIdAndUpdate(program.provider || program.university, { $inc: { programCount: -1 } });
    }
  },

  async getFields(): Promise<string[]> {
    const fields = await Program.distinct('fieldOfStudy');
    if (fields.length === 0) {
      return Program.distinct('field');
    }
    return fields.filter(Boolean).sort();
  },

  async getCities(): Promise<string[]> {
    const [programCities, universityCities, locationCities] = await Promise.all([
      Program.distinct('city'),
      University.distinct('city'),
      ProgramLocation.distinct('locationCity')
    ]);
    
    const allCities = new Set([
      ...programCities, 
      ...universityCities, 
      ...locationCities
    ]);
    
    return Array.from(allCities).filter(Boolean).sort();
  },
};

