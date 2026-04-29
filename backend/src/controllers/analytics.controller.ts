import { Request, Response, NextFunction } from 'express';
import { powerbiService } from '../services/powerbi.service';

export const analyticsController = {
  /** GET /api/v1/admin/analytics/powerbi/token
   *  Get an embed token for rendering the Power BI report
   */
  async getPowerBiToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if feature is configured
      if (!process.env.POWERBI_TENANT_ID || !process.env.POWERBI_CLIENT_ID) {
        // Return mock data for demo/development purposes
        res.status(200).json({ 
          success: true, 
          data: {
            accessToken: 'mock_token',
            embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=mock_report_id',
            expiry: new Date(Date.now() + 3600000).toISOString(),
            mocked: true
          }
        });
        return;
      }

      const embedConfig = await powerbiService.getEmbedToken();
      res.status(200).json({ success: true, data: { ...embedConfig, mocked: false } });
    } catch (error: any) {
      // Return 500 but don't crash if Azure AD is misconfigured
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
