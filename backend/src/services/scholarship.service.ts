import { FilterQuery, SortOrder } from 'mongoose';
import { Scholarship, IScholarship } from '../models/Scholarship.model';
import { AppError } from '../utils/AppError';
import slugify from 'slugify';

interface GetOpportunitiesOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  university?: string;
  status?: string;
  visibility?: string;
  featured?: boolean;
  archived?: boolean;
  expired?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isAdmin?: boolean;
}

export const scholarshipService = {
  async getAll(options: GetOpportunitiesOptions) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      university,
      status,
      visibility,
      featured,
      archived,
      expired,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isAdmin = false,
    } = options;

    const query: FilterQuery<IScholarship> = {};

    // Base rules for public vs admin
    if (!isAdmin) {
      query.status = 'published';
      query.visibility = 'public';
      query.archivedAt = null;
      // Do not show expired
      query.$or = [
        { deadlineDate: null },
        { deadlineDate: { $gte: new Date() } }
      ];
    } else {
      if (status) query.status = status;
      if (visibility) query.visibility = visibility;
      if (archived !== undefined) {
        if (archived) query.archivedAt = { $ne: null };
        else query.archivedAt = null;
      }
      if (expired) {
        query.deadlineDate = { $lt: new Date() };
      }
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (category) query.category = category;
    if (university) query.linkedUniversity = university;
    if (featured !== undefined) query.featured = featured;

    const skip = (page - 1) * limit;

    const sortObj: { [key: string]: any } = {};
    if (search && !sortBy) {
      sortObj.score = { $meta: 'textScore' };
    } else {
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const items = await Scholarship.find(query)
      .sort(sortObj as Record<string, 1 | -1 | { $meta: 'textScore' }>)
      .skip(skip)
      .limit(limit)
      .populate('linkedUniversity', 'name slug logoUrl country city');

    const total = await Scholarship.countDocuments(query);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getBySlug(slug: string, isAdmin: boolean = false) {
    const query: FilterQuery<IScholarship> = { slug };

    if (!isAdmin) {
      query.status = 'published';
      query.visibility = 'public';
      query.archivedAt = null;
      query.$or = [
        { deadlineDate: null },
        { deadlineDate: { $gte: new Date() } }
      ];
    }

    const item = await Scholarship.findOne(query).populate('linkedUniversity', 'name slug logoUrl country city');
    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    return item;
  },

  async getById(id: string) {
    const item = await Scholarship.findById(id).populate('linkedUniversity', 'name slug logoUrl country city');
    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }
    return item;
  },

  async create(data: Partial<IScholarship>, adminId: string) {
    const slug = slugify(data.slug || data.title || '', { lower: true, strict: true });
    
    // Check slug uniqueness
    const existing = await Scholarship.findOne({ slug });
    if (existing) {
      throw new AppError(400, 'An scholarship with this title or slug already exists');
    }

    const item = new Scholarship({
      ...data,
      slug,
      createdBy: adminId,
    });

    await item.save();
    return item;
  },

  async update(id: string, data: Partial<IScholarship>, adminId: string) {
    if (data.slug) {
      data.slug = slugify(data.slug, { lower: true, strict: true });
      const existing = await Scholarship.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) {
        throw new AppError(400, 'An scholarship with this slug already exists');
      }
    } else if (data.title) {
      // Re-generate slug if title changed and no slug provided
      // Optional behavior, maybe better to let user manually change slug
    }

    const item = await Scholarship.findByIdAndUpdate(
      id,
      { ...data, updatedBy: adminId },
      { new: true, runValidators: true }
    );

    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    return item;
  },

  async archive(id: string, adminId: string, reason?: string) {
    const item = await Scholarship.findByIdAndUpdate(
      id,
      {
        status: 'archived',
        archivedAt: new Date(),
        archivedBy: adminId,
        archiveReason: reason,
        updatedBy: adminId,
      },
      { new: true }
    );

    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    return item;
  },

  async restore(id: string, adminId: string) {
    const item = await Scholarship.findById(id);
    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    item.status = 'draft';
    item.archivedAt = undefined;
    item.archivedBy = undefined;
    item.archiveReason = undefined;
    item.updatedBy = adminId;
    
    // Ensure deadline is updated or user is aware
    if (item.deadlineDate && item.deadlineDate < new Date()) {
      // it will still be drafted but technically expired by date
      // that's fine, admin can update it
    }

    await item.save();
    return item;
  },

  async changeStatus(id: string, status: IScholarship['status'], adminId: string) {
    const item = await Scholarship.findByIdAndUpdate(
      id,
      { status, updatedBy: adminId },
      { new: true }
    );

    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    return item;
  },
  
  async feature(id: string, featured: boolean, adminId: string) {
    const item = await Scholarship.findByIdAndUpdate(
      id,
      { featured, updatedBy: adminId },
      { new: true }
    );

    if (!item) {
      throw new AppError(404, 'Scholarship not found');
    }

    return item;
  }
};
