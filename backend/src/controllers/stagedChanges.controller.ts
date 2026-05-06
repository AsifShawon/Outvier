import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StagedChange } from '../models/StagedChange.model';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { RankingRecord } from '../models/RankingRecord.model';
import { TuitionRecord } from '../models/TuitionRecord.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { Scholarship } from '../models/Scholarship.model';
import { Campus } from '../models/Campus.model';
import { ProgramLocation } from '../models/ProgramLocation.model';

export const stagedChangesController = {
  /** GET /api/v1/admin/staged-changes
   *  List staged changes with optional filters
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        status = 'pending',
        entityType,
        universityId,
        externalKey,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = { status };
      if (entityType) filter.entityType = entityType;
      if (universityId) filter.universityId = universityId;
      if (externalKey) filter.externalKey = { $regex: externalKey, $options: 'i' };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [changes, total] = await Promise.all([
        StagedChange.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('universityId', 'name slug')
          .lean(),
        StagedChange.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: changes,
        meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/staged-changes/:id/approve
   *  Approve a staged change — writes the approved data to the target collection
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    let session: mongoose.mongo.ClientSession | null = null;
    const isStandalone = mongoose.connection.getClient().topology?.description?.type === 'Single';

    if (!isStandalone) {
      try {
        session = await StagedChange.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
    }
    try {
      const change = await StagedChange.findById(req.params.id).session(session);
      if (!change) {
        res.status(404).json({ success: false, message: 'Staged change not found' });
        return;
      }
      if (change.status !== 'pending') {
        res.status(400).json({ success: false, message: `Change is already ${change.status}` });
        return;
      }

      const reviewer = (req as any).user?.username || 'admin';
      const approvedAt = new Date();

      // Apply the change to the appropriate collection
      await applyApprovedChange(change.entityType, change.changeType, change.newValue, change.entityId, approvedAt, session ?? undefined);

      change.status = 'approved';
      change.reviewedBy = reviewer;
      change.reviewedAt = approvedAt;
      await change.save({ session });

      if (session) await session.commitTransaction();
      res.status(200).json({ success: true, message: 'Change approved and applied' });
    } catch (error) {
      if (session) await session.abortTransaction();
      next(error);
    } finally {
      if (session) session.endSession();
    }
  },

  /** POST /api/v1/admin/staged-changes/:id/reject
   *  Reject a staged change (no DB writes)
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const change = await StagedChange.findById(req.params.id);
      if (!change) {
        res.status(404).json({ success: false, message: 'Staged change not found' });
        return;
      }
      if (change.status !== 'pending') {
        res.status(400).json({ success: false, message: `Change is already ${change.status}` });
        return;
      }

      change.status = 'rejected';
      change.reviewedBy = (req as any).user?.username || 'admin';
      change.reviewedAt = new Date();
      await change.save();

      res.status(200).json({ success: true, message: 'Change rejected' });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/staged-changes/:id/edit-approve
   *  Edit the new value and approve
   */
  async editAndApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
    let session: mongoose.mongo.ClientSession | null = null;
    const isStandalone = mongoose.connection.getClient().topology?.description?.type === 'Single';

    if (!isStandalone) {
      try {
        session = await StagedChange.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
    }
    try {
      const change = await StagedChange.findById(req.params.id).session(session);
      if (!change) {
        res.status(404).json({ success: false, message: 'Staged change not found' });
        return;
      }

      const { newValue } = req.body as { newValue: Record<string, unknown> };
      if (!newValue) {
        res.status(400).json({ success: false, message: 'newValue is required' });
        return;
      }

      const reviewer = (req as any).user?.username || 'admin';
      const approvedAt = new Date();

      change.newValue = newValue;
      await applyApprovedChange(change.entityType, change.changeType, newValue, change.entityId, approvedAt, session ?? undefined);

      change.status = 'edited';
      change.reviewedBy = reviewer;
      change.reviewedAt = approvedAt;
      await change.save({ session });

      if (session) await session.commitTransaction();
      res.status(200).json({ success: true, message: 'Change edited and approved' });
    } catch (error) {
      if (session) await session.abortTransaction();
      next(error);
    } finally {
      if (session) session.endSession();
    }
  },

  /** POST /api/v1/admin/staged-changes/bulk-approve
   *  Approve multiple staged changes
   */
  async bulkApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
    let session: mongoose.mongo.ClientSession | null = null;
    const isStandalone = mongoose.connection.getClient().topology?.description?.type === 'Single';

    if (!isStandalone) {
      try {
        session = await StagedChange.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }
    }
    try {
      const { ids } = req.body as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'ids array is required' });
        return;
      }

      const changes = await StagedChange.find({ _id: { $in: ids }, status: 'pending' }).session(session);
      const reviewer = (req as any).user?.username || 'admin';
      const approvedAt = new Date();

      for (const change of changes) {
        await applyApprovedChange(change.entityType, change.changeType, change.newValue, change.entityId, approvedAt, session ?? undefined);
        change.status = 'approved';
        change.reviewedBy = reviewer;
        change.reviewedAt = approvedAt;
        await change.save({ session });
      }

      if (session) await session.commitTransaction();
      res.status(200).json({ success: true, message: `${changes.length} changes approved` });
    } catch (error) {
      if (session) await session.abortTransaction();
      next(error);
    } finally {
      if (session) session.endSession();
    }
  },

  /** POST /api/v1/admin/staged-changes/bulk-reject
   *  Reject multiple staged changes
   */
  async bulkReject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'ids array is required' });
        return;
      }

      const reviewer = (req as any).user?.username || 'admin';
      await StagedChange.updateMany(
        { _id: { $in: ids }, status: 'pending' },
        { $set: { status: 'rejected', reviewedBy: reviewer, reviewedAt: new Date() } }
      );

      res.status(200).json({ success: true, message: 'Changes rejected' });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/staged-changes/bulk-approve-cricos
   *  Approve all pending CRICOS-sourced staged changes
   *  Accepts optional providerCode to narrow scope
   */
  async bulkApproveCricos(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { providerCode, entityType: filterEntityType } = req.body as {
      providerCode?: string;
      entityType?: string;
    };

    const filter: Record<string, unknown> = {
      status: 'pending',
      sourceName: 'CRICOS data.gov.au CKAN DataStore API',
    };

    if (providerCode) {
      // externalKey starts with the provider code for all CRICOS staged changes
      filter.externalKey = { $regex: `^${providerCode}` };
    }

    if (filterEntityType) {
      filter.entityType = filterEntityType;
    }

    const changes = await StagedChange.find(filter).lean();
    if (changes.length === 0) {
      res.status(200).json({ success: true, message: 'No pending CRICOS changes to approve', approved: 0 });
      return;
    }

    const reviewer = (req as any).user?.username || 'admin';
    const approvedAt = new Date();
    let approved = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in order: universities → campuses → programs → programLocations
    // so that FK lookups work when later entity types reference earlier ones
    const ORDER = ['university', 'campus', 'program', 'programLocation'];
    const sorted = [...changes].sort(
      (a, b) => ORDER.indexOf(a.entityType) - ORDER.indexOf(b.entityType)
    );

    for (const change of sorted) {
      try {
        await applyApprovedChange(
          change.entityType,
          change.changeType,
          change.newValue as Record<string, unknown>,
          change.entityId,
          approvedAt,
          undefined
        );
        await StagedChange.findByIdAndUpdate(change._id, {
          $set: { status: 'approved', reviewedBy: reviewer, reviewedAt: approvedAt },
        });
        approved++;
      } catch (err: any) {
        failed++;
        errors.push(`${change.entityType}/${change.externalKey}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `${approved} CRICOS changes approved${failed > 0 ? `, ${failed} failed` : ''}`,
      approved,
      failed,
      ...(errors.length > 0 && { errors: errors.slice(0, 20) }),
    });
  },
};

// --------------------------------------------------------------------------
// Helper: apply an approved change to the target collection
// --------------------------------------------------------------------------

async function applyApprovedChange(
  entityType: string,
  changeType: string,
  newValue: Record<string, unknown>,
  entityId?: unknown,
  approvedAt?: Date,
  session?: mongoose.mongo.ClientSession
): Promise<void> {
  const value = { ...newValue, approvedAt: approvedAt ?? new Date(), status: 'approved' };
  const options = session ? { session } : {};

  switch (entityType) {
    case 'university':
      if (changeType === 'delete' && entityId) {
        await University.findByIdAndDelete(entityId, options);
      } else if (changeType === 'update' && entityId) {
        await University.findByIdAndUpdate(entityId, { $set: newValue }, options);
      } else {
        // create — upsert by cricosProviderCode when available, else by name
        const uniFilter = (newValue as any).cricosProviderCode
          ? { cricosProviderCode: (newValue as any).cricosProviderCode }
          : { name: (newValue as any).name };
        await University.findOneAndUpdate(uniFilter, { $set: newValue }, { upsert: true, ...options });
      }
      break;

    case 'program': {
      const programData: Record<string, unknown> = { ...newValue };

      if (programData.cricosProviderCode && !programData.university) {
        const uni = await University.findOne({ cricosProviderCode: programData.cricosProviderCode }).lean();
        if (uni) {
          programData.university = uni._id;
          if (!programData.universityName) programData.universityName = uni.name;
          if (!programData.universitySlug) programData.universitySlug = (uni as any).slug;
        }
      }

      if (changeType === 'create' || changeType === 'update') {
        const progFilter = programData.cricosCourseCode 
          ? { cricosCourseCode: programData.cricosCourseCode, university: programData.university }
          : { slug: programData.slug };
        
        await Program.findOneAndUpdate(progFilter, { $set: programData }, { upsert: true, ...options });
      } else if (changeType === 'delete' && entityId) {
        await Program.findByIdAndDelete(entityId, options);
      }
      break;
    }

    case 'ranking':
      if (changeType === 'create' || changeType === 'update') {
        const rankFilter = { 
          universityId: (value as any).universityId, 
          source: (value as any).source, 
          year: (value as any).year 
        };
        await RankingRecord.findOneAndUpdate(rankFilter, { $set: value }, { upsert: true, ...options });
      } else if (entityId) {
        await RankingRecord.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;

    case 'tuition':
      if (changeType === 'create' || changeType === 'update') {
        const tuitionFilter = {
          universityId: (value as any).universityId,
          programId: (value as any).programId,
          year: (value as any).year
        };
        await TuitionRecord.findOneAndUpdate(tuitionFilter, { $set: value }, { upsert: true, ...options });
      } else if (entityId) {
        await TuitionRecord.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;

    case 'outcome':
      if (changeType === 'create' || changeType === 'update') {
        const outcomeFilter = {
          universityId: (value as any).universityId,
          metricName: (value as any).metricName,
          year: (value as any).year
        };
        await OutcomeMetric.findOneAndUpdate(outcomeFilter, { $set: value }, { upsert: true, ...options });
      } else if (entityId) {
        await OutcomeMetric.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;

    case 'scholarship':
      if (changeType === 'create') {
        await Scholarship.create([value], options);
      } else if (entityId) {
        await Scholarship.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;
    
    case 'campus':
      const campusData = { ...newValue };
      if (campusData.cricosProviderCode && !campusData.university) {
        const uni = await University.findOne({ cricosProviderCode: campusData.cricosProviderCode }).lean();
        if (uni) {
          campusData.university = uni._id;
        }
      }

      if (changeType === 'create' || changeType === 'update') {
        const campusFilter = campusData.externalId 
          ? { externalId: campusData.externalId }
          : { university: campusData.university, name: campusData.name };

        await Campus.findOneAndUpdate(campusFilter, { $set: campusData }, { upsert: true, ...options });
      } else if (changeType === 'delete' && entityId) {
        await Campus.findByIdAndDelete(entityId, options);
      }
      break;

    case 'programLocation': {
      const plData: Record<string, unknown> = { ...newValue };

      if (plData.cricosProviderCode && plData.cricosCourseCode && !plData.program) {
        const prog = await Program.findOne({
          cricosProviderCode: plData.cricosProviderCode,
          cricosCourseCode: plData.cricosCourseCode,
        }).lean();
        if (prog) plData.program = prog._id;
      }

      if (plData.cricosProviderCode && plData.locationName && !plData.campus) {
        const camp = await Campus.findOne({
          cricosProviderCode: plData.cricosProviderCode,
          name: plData.locationName,
        }).lean();
        if (camp) plData.campus = camp._id;
      }

      if (!plData.university && plData.cricosProviderCode) {
        const uni = await University.findOne({ cricosProviderCode: plData.cricosProviderCode }).lean();
        if (uni) plData.university = uni._id;
      }

      if (changeType === 'create' || changeType === 'update') {
        const plFilter = {
          cricosProviderCode: plData.cricosProviderCode,
          cricosCourseCode: plData.cricosCourseCode,
          locationName: plData.locationName
        };
        await ProgramLocation.findOneAndUpdate(plFilter, { $set: plData }, { upsert: true, ...options });
      } else if (changeType === 'delete' && entityId) {
        await ProgramLocation.findByIdAndDelete(entityId, options);
      }
      break;
    }

    default:
      break;
  }
}
