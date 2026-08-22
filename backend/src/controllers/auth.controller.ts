import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { setAuthCookies, clearAuthCookies, REFRESH_TOKEN_COOKIE } from '../utils/cookie.util';

function getRequestContext(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip,
    userAgent: req.headers['user-agent'],
  };
}

export const authController = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = getRequestContext(req);
      const result = await authService.signup(req.body, context);

      setAuthCookies(res, result.accessToken, result.refreshToken, result.csrfToken);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          csrfToken: result.csrfToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const context = getRequestContext(req);
      const result = await authService.login(email, password, context);

      setAuthCookies(res, result.accessToken, result.refreshToken, result.csrfToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          csrfToken: result.csrfToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;
      if (!refreshToken) {
        clearAuthCookies(res);
        res.status(401).json({ success: false, message: 'Refresh token not found' });
        return;
      }

      const context = getRequestContext(req);
      const result = await authService.rotateRefreshToken(refreshToken, context);

      setAuthCookies(res, result.accessToken, result.refreshToken, result.csrfToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          csrfToken: result.csrfToken,
        },
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;
      const context = getRequestContext(req);
      await authService.logout(refreshToken, context);

      clearAuthCookies(res);

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },

  async logoutAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = getRequestContext(req);
      if (req.user?.id) {
        await authService.logoutAll(req.user.id, context);
      }

      clearAuthCookies(res);

      res.status(200).json({ success: true, message: 'All active sessions have been revoked' });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const context = getRequestContext(req);
      const result = await authService.forgotPassword(email, context);
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const context = getRequestContext(req);
      await authService.resetPassword(token, password, context);
      clearAuthCookies(res);
      res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in.' });
    } catch (error) {
      next(error);
    }
  },
};
