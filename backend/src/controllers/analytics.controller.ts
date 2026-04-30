import { Request, Response, NextFunction } from 'express';
import { University } from '../models/University.model';
import { Program } from '../models/Program.model';
import { User } from '../models/User.model';
import { ComparisonSession } from '../models/ComparisonSession.model';
import { StagedChange } from '../models/StagedChange.model';
import { SyncJob } from '../models/SyncJob.model';

export const analyticsController = {

  /** GET /api/v1/admin/analytics
   *  Admin business dashboard stats (protected, admin-only).
   */
  async getAdminAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUniversities,
        totalPrograms,
        totalStudents,
        totalComparisons,
        pendingStagedChanges,
        syncJobsByStatus,
        stagedChangesByType,
        recentSyncJobs,
      ] = await Promise.all([
        University.countDocuments({ status: 'active' }),
        Program.countDocuments({ status: 'active' }),
        User.countDocuments({ role: 'user' }),
        ComparisonSession.countDocuments(),
        StagedChange.countDocuments({ status: 'pending' }),
        SyncJob.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        StagedChange.aggregate([
          { $match: { status: 'pending' } },
          { $group: { _id: '$entityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        SyncJob.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUniversities,
          totalPrograms,
          totalStudents,
          totalComparisons,
          pendingStagedChanges,
          syncJobsByStatus,
          stagedChangesByType,
          recentSyncJobs,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /** GET /api/v1/analytics/public
   *  Public-facing aggregated data for charts (no auth required).
   */
  async getPublicAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        universitiesByState,
        programsByField,
        programsByLevel,
        avgTuitionByField,
        totalUniversities,
        totalPrograms,
      ] = await Promise.all([
        University.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$state', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Program.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: { $ifNull: ['$fieldOfStudy', '$field'] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
        Program.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$level', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Program.aggregate([
          {
            $match: {
              status: 'active',
              $or: [{ annualTuition: { $gt: 0 } }, { tuitionFeeInternational: { $gt: 0 } }],
            },
          },
          {
            $group: {
              _id: { $ifNull: ['$fieldOfStudy', '$field'] },
              avgTuition: {
                $avg: { $ifNull: ['$annualTuition', '$tuitionFeeInternational'] },
              },
            },
          },
          { $sort: { avgTuition: -1 } },
          { $limit: 10 },
        ]),
        University.countDocuments({ status: 'active' }),
        Program.countDocuments({ status: 'active' }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUniversities,
          totalPrograms,
          universitiesByState,
          programsByField,
          programsByLevel,
          avgTuitionByField,
        },
      });
    } catch (error) {
      next(error);
    }
  },
  /** GET /api/v1/admin/analytics/config
   *  Get analytics configuration (Metabase vs PowerBI).
   */
  async getAnalyticsConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.json({
      success: true,
      data: {
        type: 'metabase',
        embedUrl: process.env.METABASE_EMBED_URL || null,
        directUrl: process.env.METABASE_URL || 'http://localhost:3001',
      }
    });
  },

  /** GET /api/v1/admin/analytics/native
   *  Built-in stats dashboard using raw MongoDB aggregations.
   */
  async getNativeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        programsByLevel,
        programsByCampusMode,
        universitiesByState,
        universitiesByType,
        tuitionDistribution,
        syncJobStats,
        stagedChangeStats,
        topComparedPrograms,
      ] = await Promise.all([
        Program.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }]),
        Program.aggregate([{ $group: { _id: '$campusMode', count: { $sum: 1 } } }]),
        University.aggregate([{ $group: { _id: '$state', count: { $sum: 1 } } }]),
        University.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
        Program.aggregate([
          { $match: { tuitionFeeInternational: { $exists: true, $gt: 0 } } },
          { $bucket: { 
            groupBy: '$tuitionFeeInternational',
            boundaries: [0, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 100000],
            default: 'other',
            output: { count: { $sum: 1 } }
          }}
        ]),
        SyncJob.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        StagedChange.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ComparisonSession.aggregate([
          { $unwind: '$selectedProgramIds' },
          { $group: { _id: '$selectedProgramIds', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'program' } },
          { $unwind: '$program' },
          { $project: { name: '$program.name', count: 1 } }
        ])
      ]);
      
      res.json({ success: true, data: {
        programsByLevel, programsByCampusMode, universitiesByState, universitiesByType,
        tuitionDistribution, syncJobStats, stagedChangeStats, topComparedPrograms
      }});
    } catch (error) {
      next(error);
    }
  },
};
