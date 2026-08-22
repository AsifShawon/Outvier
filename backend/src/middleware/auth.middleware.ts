import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token.util';
import { User } from '../models/User.model';
import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } from '../utils/cookie.util';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // 1. Check HttpOnly cookie first
  if (req.cookies?.[ACCESS_TOKEN_COOKIE]) {
    token = req.cookies[ACCESS_TOKEN_COOKIE];
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    // 2. Fall back to Bearer header for API clients
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized: No access token provided' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);

    // Re-query database to ensure account is not suspended, deleted, or permissions changed
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authorized: Account does not exist' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Forbidden: Account is inactive or suspended' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized: Invalid or expired access token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.cookies?.[ACCESS_TOKEN_COOKIE]) {
    token = req.cookies[ACCESS_TOKEN_COOKIE];
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.status === 'active') {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        permissions: user.permissions || [],
      };
    }
    next();
  } catch {
    next();
  }
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Admins bypass granular permission checks
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission(s): ${requiredPermissions.join(', ')}`,
      });
      return;
    }

    next();
  };
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden: Administrator privileges required' });
    return;
  }

  next();
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Only check CSRF on state-mutating requests
  if (!mutatingMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // Exempt auth bootstrap endpoints where user is unauthenticated
  const exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/signup',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
  ];

  if (exemptPaths.some((p) => req.path.endsWith(p))) {
    return next();
  }

  // If request uses cookie authentication, verify CSRF header matches cookie
  const cookieAccess = req.cookies?.[ACCESS_TOKEN_COOKIE];
  const cookieRefresh = req.cookies?.[CSRF_TOKEN_COOKIE];

  if (cookieAccess || cookieRefresh) {
    const headerToken = (req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string);
    const expectedToken = req.cookies?.[CSRF_TOKEN_COOKIE];

    if (!headerToken || !expectedToken || headerToken !== expectedToken) {
      res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token header (X-CSRF-Token)',
      });
      return;
    }
  }

  next();
};
