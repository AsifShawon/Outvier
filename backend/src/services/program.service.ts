import slugify from 'slugify';
import { Program, IProgram } from '../models/Program.model';
import { University } from '../models/University.model';
import { CreateProgramDTO, UpdateProgramDTO } from '../validators/program.validator';

export interface ProgramQuery {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  field?: string;
  campusMode?: string;
  city?: string;
  universitySlug?: string;
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
      campusMode, 
      city,
      universitySlug,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;

    const filter: Record<string, unknown> = {};

    if (search) filter.$text = { $search: search };
    if (level && level !== 'all') filter.level = level;
    if (field && field !== 'all') filter.field = { $regex: field, $options: 'i' };
    if (campusMode && campusMode !== 'all') filter.campusMode = campusMode;
    if (city && city !== 'all') filter.city = city;
    if (universitySlug) filter.universitySlug = universitySlug;

    const sort: Record<string, any> = {};
    const allowedSorts = ['name', 'level', 'universityName', 'updatedAt'];
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

    const program = await Program.create({
      ...data,
      slug,
      universityName: university.name,
      universitySlug: university.slug,
    });
    return program;
  },

  async update(id: string, data: UpdateProgramDTO): Promise<IProgram> {
    const program = await Program.findByIdAndUpdate(id, data, { new: true, runValidators: true });
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

  async getFields(): Promise<string[]> {
    return Program.distinct('field');
  },

  async getCities(): Promise<string[]> {
    return Program.distinct('city');
  },
};
