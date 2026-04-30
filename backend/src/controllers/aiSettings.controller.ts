import { Request, Response, NextFunction } from 'express';
import { AIProviderSetting } from '../models/AIProviderSetting.model';
import { encryptText, decryptText } from '../utils/encryption';

const maskKey = (key: string): string => {
  if (!key || key.length < 8) return '***';
  return `***...${key.slice(-4)}`;
};

export const aiSettingsController = {
  /** GET /api/v1/admin/settings/ai
   *  List all AI provider settings with masked keys
   */
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AIProviderSetting.find().select('+encryptedApiKey');
      const masked = settings.map(s => {
        const obj = s.toObject() as unknown as Record<string, unknown>;
        if (s.encryptedApiKey) {
          try {
            const plainKey = decryptText(s.encryptedApiKey);
            obj.maskedApiKey = maskKey(plainKey);
          } catch {
            obj.maskedApiKey = '***';
          }
        } else {
          obj.maskedApiKey = null;
        }
        delete obj.encryptedApiKey;
        return obj;
      });
      res.status(200).json({ success: true, data: masked });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/settings/ai
   *  Create or update a provider setting. Encrypts the API key before storing.
   */
  async upsertSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider, aiModel, apiKey, baseUrl, isActive } = req.body as {
        provider: string;
        aiModel: string;
        apiKey?: string;
        baseUrl?: string;
        isActive?: boolean;
      };

      if (!provider || !aiModel) {
        res.status(400).json({ success: false, message: 'provider and aiModel are required' });
        return;
      }

      const updateData: Record<string, unknown> = {
        aiModel,
        baseUrl: baseUrl || undefined,
        updatedBy: (req as any).user?.username,
      };

      if (apiKey) {
        updateData.encryptedApiKey = encryptText(apiKey);
        updateData.testStatus = 'untested';
      }

      // If setting this provider as active, deactivate all others first
      if (isActive) {
        await AIProviderSetting.updateMany({ provider: { $ne: provider } }, { isActive: false });
        updateData.isActive = true;
      } else if (isActive === false) {
        updateData.isActive = false;
      }

      const setting = await AIProviderSetting.findOneAndUpdate(
        { provider },
        { $set: updateData, $setOnInsert: { createdBy: (req as any).user?.username } },
        { upsert: true, new: true }
      );

      const obj = setting.toObject() as unknown as Record<string, unknown>;
      delete obj.encryptedApiKey;

      res.status(200).json({ success: true, data: obj });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/settings/ai/test
   *  Test connectivity for an AI provider
   */
  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.body as { provider: string };
      if (!provider) {
        res.status(400).json({ success: false, message: 'provider is required' });
        return;
      }

      const setting = await AIProviderSetting.findOne({ provider }).select('+encryptedApiKey');
      if (!setting) {
        res.status(404).json({ success: false, message: 'Provider not configured' });
        return;
      }
      if (!setting.encryptedApiKey) {
        res.status(400).json({ success: false, message: 'No API key stored for this provider' });
        return;
      }

      let success = false;
      let errorMsg = '';

      try {
        const apiKey = decryptText(setting.encryptedApiKey);
        const baseUrl = setting.baseUrl;

        if (provider === 'groq') {
          const { ChatGroq } = await import('@langchain/groq');
          const model = new ChatGroq({ apiKey, model: setting.aiModel });
          await model.invoke('ping');
          success = true;
        } else if (provider === 'nvidia') {
          const url = `${baseUrl || 'https://integrate.api.nvidia.com/v1'}/models`;
          const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          success = resp.ok;
          if (!success) errorMsg = `HTTP ${resp.status}`;
        } else if (provider === 'mistral') {
          const resp = await fetch('https://api.mistral.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          success = resp.ok;
          if (!success) errorMsg = `HTTP ${resp.status}`;
        }
      } catch (err: any) {
        errorMsg = err.message;
      }

      await AIProviderSetting.findOneAndUpdate(
        { provider },
        {
          lastTestedAt: new Date(),
          testStatus: success ? 'success' : 'failure',
        }
      );

      res.status(200).json({
        success,
        data: { provider, testStatus: success ? 'success' : 'failure', error: errorMsg || undefined },
      });
    } catch (error) {
      next(error);
    }
  },

  /** POST /api/v1/admin/settings/ai/activate
   *  Set one provider as active, deactivate others
   */
  async activateProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.body as { provider: string };
      if (!provider) {
        res.status(400).json({ success: false, message: 'provider is required' });
        return;
      }

      const setting = await AIProviderSetting.findOne({ provider });
      if (!setting) {
        res.status(404).json({ success: false, message: 'Provider not configured' });
        return;
      }

      await AIProviderSetting.updateMany({}, { isActive: false });
      await AIProviderSetting.findOneAndUpdate({ provider }, { isActive: true });

      res.status(200).json({ success: true, message: `${provider} is now the active AI provider` });
    } catch (error) {
      next(error);
    }
  },
};
