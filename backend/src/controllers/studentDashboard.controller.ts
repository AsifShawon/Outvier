import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StudentDashboardService } from '../services/studentDashboard.service';
import { sendSuccess, sendError } from '../utils/response.util';

export const studentDashboardController = {
  /**
   * GET /api/v1/dashboard/me
   * Aggregate student readiness telemetry, upcoming deadlines, actionable tasks, and explainable fit scores.
   */
  async getMyDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required to view student dashboard');
        return;
      }

      const dashboardData = await StudentDashboardService.getStudentDashboard(userId);
      sendSuccess(res, dashboardData);
    } catch (error) {
      next(error);
    }
  },
};
