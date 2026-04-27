import { Request, Response, NextFunction } from 'express';
import { StagedChange } from '../models/StagedChange.model';
import { University } from '../models/University.model';
import { RankingRecord } from '../models/RankingRecord.model';
import { TuitionRecord } from '../models/TuitionRecord.model';
import { OutcomeMetric } from '../models/OutcomeMetric.model';
import { Scholarship } from '../models/Scholarship.model';

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

      const reviewer = (req as any).user?.username || 'admin';
      const approvedAt = new Date();

      // Apply the change to the appropriate collection
      await applyApprovedChange(change.entityType, change.changeType, change.newValue, change.entityId, approvedAt);

      change.status = 'approved';
      change.reviewedBy = reviewer;
      change.reviewedAt = approvedAt;
      await change.save();

      res.status(200).json({ success: true, message: 'Change approved and applied' });
    } catch (error) {
      next(error);
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
    try {
      const change = await StagedChange.findById(req.params.id);
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
      await applyApprovedChange(change.entityType, change.changeType, newValue, change.entityId, approvedAt);

      change.status = 'edited';
      change.reviewedBy = reviewer;
      change.reviewedAt = approvedAt;
      await change.save();

      res.status(200).json({ success: true, message: 'Change edited and approved' });
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
  approvedAt?: Date
): Promise<void> {
  const value = { ...newValue, approvedAt: approvedAt ?? new Date(), status: 'approved' };

  switch (entityType) {
    case 'university':
      if (changeType === 'update' && entityId) {
        await University.findByIdAndUpdate(entityId, { $set: newValue });
      }
      break;

    case 'ranking':
      if (changeType === 'create') {
        await RankingRecord.create(value);
      } else if (entityId) {
        await RankingRecord.findByIdAndUpdate(entityId, { $set: value });
      }
      break;

    case 'tuition':
      if (changeType === 'create') {
        await TuitionRecord.create(value);
      } else if (entityId) {
        await TuitionRecord.findByIdAndUpdate(entityId, { $set: value });
      }
      break;

    case 'outcome':
      if (changeType === 'create') {
        await OutcomeMetric.create(value);
      } else if (entityId) {
        await OutcomeMetric.findByIdAndUpdate(entityId, { $set: value });
      }
      break;

    case 'scholarship':
      if (changeType === 'create') {
        await Scholarship.create(value);
      } else if (entityId) {
        await Scholarship.findByIdAndUpdate(entityId, { $set: value });
      }
      break;

    default:
      break;
  }
}
