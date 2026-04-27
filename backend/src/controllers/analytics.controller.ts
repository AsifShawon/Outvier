import { Request, Response, NextFunction } from 'express';
import { powerbiService } from '../services/powerbi.service';

export const analyticsController = {
  /** GET /api/v1/admin/analytics/powerbi/token
   *  Get an embed token for rendering the Power BI report
   */
  async getPowerBiToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if feature is configured
      if (!process.env.POWERBI_TENANT_ID) {
        res.status(503).json({ 
          success: false, 
          message: 'Power BI integration is not configured. Please add POWERBI_* variables to .env'
        });
        return;
      }

      const embedConfig = await powerbiService.getEmbedToken();
      res.status(200).json({ success: true, data: embedConfig });
    } catch (error: any) {
      // Return 500 but don't crash if Azure AD is misconfigured
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
