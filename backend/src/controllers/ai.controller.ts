import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { ChatLog } from '../models/ChatLog.model';

export const aiController = {
  /** POST /api/v1/copilot/chat
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question } = req.body;
      const userId = (req as any).user?._id;
      const sessionKey = req.headers['x-session-key'] as string;

      if (!question) {
        res.status(400).json({ success: false, message: 'Question is required' });
        return;
      }

      // Generate AI response
      const result = await aiService.generateResponse(question, sessionKey, userId);

      // Log the conversation asynchronously (no need to block the response)
      ChatLog.create({
        userId,
        sessionKey,
        provider: process.env.DEFAULT_AI_PROVIDER || 'groq', // Simplified tracking for demo
        question,
        answer: result.answer,
      }).catch(err => console.error('Failed to save ChatLog', err));

      res.status(200).json({ 
        success: true, 
        data: {
          answer: result.answer,
          contextUsed: result.contextUsed,
        }
      });
    } catch (error: any) {
      console.error('AI Controller Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate AI response' });
    }
  }
};
