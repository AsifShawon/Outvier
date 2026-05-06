import slugify from 'slugify';
import { University, IUniversity } from '../models/University.model';
import { CreateUniversityDTO, UpdateUniversityDTO } from '../validators/university.validator';

export interface UniversityQuery {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  rankingBand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const universityService = {
  async getAll(query: UniversityQuery) {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      state, 
      rankingBand, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = query;
    
    const filter: Record<string, any> = { status: 'active' };

    if (search) {
      filter.$text = { $search: search };
    }
    if (state && state !== 'all') filter.state = state;
    
    if (rankingBand && rankingBand !== 'all') {
      if (rankingBand === 'unranked') {
        filter.ranking = { $exists: false };
      } else {
        const maxRank = parseInt(rankingBand.replace('top', ''));
        filter.ranking = { $lte: maxRank, $gt: 0 };
      }
    }

    const sort: Record<string, any> = {};
    const allowedSorts = ['name', 'ranking', 'programCount', 'averageEstimatedTotalCostAud', 'updatedAt'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const [universities, total] = await Promise.all([
      University.find(filter).sort(sort).skip(skip).limit(limit),
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

    // Auto-trigger enrichment if website is provided
    const website = data.officialWebsite || data.website;
    if (website) {
      try {
        const { universitySyncQueue } = await import('../jobs/queue');
        await universitySyncQueue.add('sync', { 
          universityId: String(university._id), 
          triggeredBy: 'system_auto_create' 
        });
      } catch (err) {
        console.error('Failed to trigger auto-enrichment:', err);
      }
    }

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
