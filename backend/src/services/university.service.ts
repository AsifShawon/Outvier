import slugify from 'slugify';
import { University, IUniversity } from '../models/University.model';
import { CreateUniversityDTO, UpdateUniversityDTO } from '../validators/university.validator';
import { RankingObservation } from '../models/RankingObservation.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { Scholarship } from '../models/Scholarship.model';
import { FuzzySearchService } from './fuzzySearch.service';

export interface UniversityQuery {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  type?: string;
  rankingBand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const universityService = {
  async getAll(query: UniversityQuery): Promise<{ universities: any[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const {
      page = 1,
      limit = 12,
      search,
      state,
      rankingBand,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter: Record<string, any> = { status: 'active' };
    const andConditions: any[] = [];

    if (search && search.trim()) {
      const fuzzyCondition = FuzzySearchService.buildUniversitySearchCondition(search);
      if (fuzzyCondition && Object.keys(fuzzyCondition).length > 0) {
        andConditions.push(fuzzyCondition);
      }
    }

    if (state && state !== 'all') filter.state = state;
    if (query.type && query.type !== 'all') {
      andConditions.push({
        $or: [{ providerType: query.type }, { type: query.type }, { institutionType: query.type }],
      });
    }

    if (rankingBand && rankingBand !== 'all') {
      if (rankingBand === 'unranked') {
        andConditions.push({
          $and: [{ primaryRank: { $exists: false } }, { ranking: { $exists: false } }],
        });
      } else {
        const maxRank = parseInt(rankingBand.replace('top', ''), 10);
        andConditions.push({
          $or: [
            { primaryRank: { $lte: maxRank, $gt: 0 } },
            { ranking: { $lte: maxRank, $gt: 0 } },
          ],
        });
      }
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const sort: Record<string, any> = {};
    const allowedSorts = ['name', 'ranking', 'primaryRank', 'programCount', 'averageEstimatedTotalCostAud', 'updatedAt'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const [universities, total] = await Promise.all([
      University.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      University.countDocuments(filter),
    ]);

    // Populate latest rankings & outcomes for card display
    const uniIds = universities.map((u) => u._id);
    const [rankings, outcomes] = await Promise.all([
      RankingObservation.find({ provider: { $in: uniIds } }).sort({ editionYear: -1 }).lean(),
      OutcomeMetric.find({ provider: { $in: uniIds }, status: 'approved' }).sort({ year: -1 }).lean(),
    ]);

    const enrichedUnis = universities.map((u) => {
      const topRank = rankings.find((r) => String(r.provider) === String(u._id));
      const topOutcome = outcomes.find((o) => String(o.provider) === String(u._id) || String(o.universityId) === String(u._id));

      return {
        ...u,
        latestRanking: topRank
          ? {
              publisher: topRank.publisher,
              editionYear: topRank.editionYear,
              rank: topRank.rank,
              rankBand: topRank.rankBand,
              source: `${topRank.publisher} World Rankings (${topRank.editionYear})`,
            }
          : undefined,
        latestOutcome: topOutcome
          ? {
              graduateEmploymentRate: topOutcome.graduateEmploymentRate,
              medianSalary: topOutcome.medianSalary,
              surveyYear: topOutcome.surveyYear || topOutcome.year,
              source: `QILT Graduate Outcomes Survey (${topOutcome.surveyYear || topOutcome.year})`,
            }
          : undefined,
      };
    });

    return {
      universities: enrichedUnis,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getBySlug(slug: string): Promise<Record<string, any>> {
    const university = await University.findOne({ slug }).lean();
    if (!university) {
      throw Object.assign(new Error('University not found'), { statusCode: 404 });
    }

    const uniId = university._id;
    const [rankings, outcomes, scholarships] = await Promise.all([
      RankingObservation.find({ provider: uniId }).sort({ editionYear: -1 }).lean(),
      OutcomeMetric.find({ $or: [{ provider: uniId }, { universityId: uniId }], status: 'approved' }).sort({ year: -1 }).lean(),
      Scholarship.find({ provider: uniId, status: 'published' }).limit(10).lean(),
    ]);

    return {
      ...university,
      canonicalData: {
        rankingObservations: rankings,
        outcomeMetrics: outcomes,
        scholarships,
        freshness: {
          lastVerifiedAt: university.sourceMetadata?.lastVerifiedAt || university.updatedAt,
          sourceName: university.sourceMetadata?.sourceName || 'TEQSA National Register / CRICOS',
          sourceUrl: university.sourceMetadata?.sourceUrl || university.officialWebsite || university.website,
          confidence: university.sourceMetadata?.confidence || 0.95,
        },
      },
    };
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

    const website = data.officialWebsite || data.website;
    if (website) {
      try {
        const { universitySyncQueue } = await import('../jobs/queue');
        if (universitySyncQueue) {
          await universitySyncQueue.add('enrich-university', { universityId: university._id, website });
        }
      } catch {
        // Queue may not be running in testing environments
      }
    }

    return university;
  },

  async update(id: string, data: UpdateUniversityDTO): Promise<IUniversity> {
    const university = await University.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
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
    const states = await University.distinct('state', { status: 'active', state: { $exists: true, $ne: '' } });
    return states.filter(Boolean).sort();
  },
};
