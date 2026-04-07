import slugify from 'slugify';
import { University, IUniversity } from '../models/University.model';
import { CreateUniversityDTO, UpdateUniversityDTO } from '../validators/university.validator';

export interface UniversityQuery {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  type?: string;
}

export const universityService = {
  async getAll(query: UniversityQuery) {
    const { page = 1, limit = 12, search, state, type } = query;
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (state) filter.state = state;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [universities, total] = await Promise.all([
      University.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      University.countDocuments(filter),
    ]);

    return {
      universities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getBySlug(slug: string): Promise<IUniversity> {
    const university = await University.findOne({ slug });
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }
    return university;
  },

  async getById(id: string): Promise<IUniversity> {
    const university = await University.findById(id);
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }
    return university;
  },

  async create(data: CreateUniversityDTO): Promise<IUniversity> {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existing = await University.findOne({ $or: [{ name: data.name }, { slug }] });
    if (existing) {
      throw Object.assign(new Error('University with this name already exists'), { statusCode: 409 });
    }
    const university = await University.create({ ...data, slug });
    return university;
  },

  async update(id: string, data: UpdateUniversityDTO): Promise<IUniversity> {
    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name, { lower: true, strict: true });
    }
    const university = await University.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }
    return university;
  },

  async delete(id: string): Promise<void> {
    const university = await University.findByIdAndDelete(id);
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }
  },

  async getStates(): Promise<string[]> {
    return University.distinct('state');
  },
};
