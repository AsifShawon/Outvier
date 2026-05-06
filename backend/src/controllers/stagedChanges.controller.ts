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
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';

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
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = { status };
      if (entityType) filter.entityType = entityType;
      if (universityId) filter.universityId = universityId;

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
      if (changeType === 'create') {
        await University.create([newValue], options);
      } else if (changeType === 'update' && entityId) {
        await University.findByIdAndUpdate(entityId, { $set: newValue }, options);
      } else if (changeType === 'delete' && entityId) {
        await University.findByIdAndDelete(entityId, options);
      }
      break;

    case 'program':
      if (changeType === 'create') {
        await Program.create([newValue], options);
      } else if (changeType === 'update' && entityId) {
        await Program.findByIdAndUpdate(entityId, { $set: newValue }, options);
      } else if (changeType === 'delete' && entityId) {
        await Program.findByIdAndDelete(entityId, options);
      }
      break;

    case 'ranking':
      if (changeType === 'create') {
        await RankingRecord.create([value], options);
      } else if (entityId) {
        await RankingRecord.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;

    case 'tuition':
      if (changeType === 'create') {
        await TuitionRecord.create([value], options);
      } else if (entityId) {
        await TuitionRecord.findByIdAndUpdate(entityId, { $set: value }, options);
      }
      break;

    case 'outcome':
      if (changeType === 'create') {
        await OutcomeMetric.create([value], options);
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
        const uni = await University.findOne({ cricosProviderCode: campusData.cricosProviderCode }).session(session || null);
        if (uni) {
          campusData.university = uni._id;
        } else {
          throw new Error(`University with CRICOS Provider Code ${campusData.cricosProviderCode} not found. Please sync and approve the University first.`);
        }
      }

      if (changeType === 'create') {
        await Campus.create([campusData], options);
      } else if (changeType === 'update' && entityId) {
        await Campus.findByIdAndUpdate(entityId, { $set: campusData }, options);
      } else if (changeType === 'delete' && entityId) {
        await Campus.findByIdAndDelete(entityId, options);
      }
      break;

    case 'program':
      const programData = { ...newValue };
      if (programData.cricosProviderCode && (!programData.university || !programData.universityName || !programData.universitySlug)) {
        const uni = await University.findOne({ cricosProviderCode: programData.cricosProviderCode }).session(session || null).lean();
        
        // DEBUG LOGGING TO FILE
        const fs = require('fs');
        const logPath = require('path').join(process.cwd(), 'debug_staged_approval.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] Approving program for code: ${programData.cricosProviderCode}\n`);
        fs.appendFileSync(logPath, `Found Uni: ${uni ? uni.name : 'NULL'}\n`);
        
        if (uni) {
          programData.university = uni._id;
          programData.universityName = uni.name;
          programData.universitySlug = uni.slug;
          fs.appendFileSync(logPath, `Injected ID: ${uni._id}\n`);
        } else {
          throw new Error(`University with CRICOS Provider Code ${programData.cricosProviderCode} not found. Please sync and approve the University first.`);
        }
      }

      if (changeType === 'create') {
        await Program.create([programData], options);
      } else if (changeType === 'update' && entityId) {
        await Program.findByIdAndUpdate(entityId, { $set: programData }, options);
      } else if (changeType === 'delete' && entityId) {
        await Program.findByIdAndDelete(entityId, options);
      }
      break;

    case 'programLocation':
      if (changeType === 'create') {
        await ProgramLocation.create([newValue], options);
      } else if (changeType === 'update' && entityId) {
        await ProgramLocation.findByIdAndUpdate(entityId, { $set: newValue }, options);
      } else if (changeType === 'delete' && entityId) {
        await ProgramLocation.findByIdAndDelete(entityId, options);
      }
      break;

    default:
      break;
  }
}
