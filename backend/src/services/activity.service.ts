import { Activity, ActivityType } from '../models/Activity.model';
import mongoose from 'mongoose';

export class ActivityService {
  static async log(params: {
    type: ActivityType;
    title: string;
    description: string;
    actorName?: string;
    actorRole?: string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const activity = new Activity({
        ...params,
        actorId: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : undefined,
      });
      await activity.save();
      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      // We don't want to break the main flow if activity logging fails
    }
  }

  static async getRecent(limit = 10) {
    return Activity.find().sort({ createdAt: -1 }).limit(limit);
  }
}
