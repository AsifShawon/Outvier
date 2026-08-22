import { User, IUser } from '../models/User.model';
import { Session, ISession } from '../models/Session.model';
import { AuditLog, AuditAction } from '../models/AuditLog.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateSecureRandomToken,
  generateCsrfToken,
} from '../utils/token.util';
import { SignupDTO } from '../validators/auth.validator';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: Partial<IUser>;
}

async function logAudit(action: AuditAction, context: RequestContext, userId?: any, userEmail?: string, details?: Record<string, unknown>) {
  try {
    await AuditLog.create({
      action,
      userId,
      userEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export const authService = {
  async signup(data: SignupDTO, context: RequestContext = {}): Promise<AuthResult> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      await logAudit('login_failure', context, undefined, data.email, { reason: 'Email already in use during signup' });
      throw Object.assign(new Error('Email already in use'), { statusCode: 400 });
    }

    const user = new User({
      name: data.name,
      username: data.email.split('@')[0],
      email: data.email,
      passwordHash: data.password,
      role: 'user',
      status: 'active',
      lastLoginAt: new Date(),
    });

    await user.save();

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, familyId } = generateRefreshToken(user);
    const refreshTokenHash = hashToken(refreshToken);
    const csrfToken = generateCsrfToken();

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      familyId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await logAudit('login_success', context, user._id, user.email, { method: 'signup' });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
    };
  },

  async login(email: string, password: string, context: RequestContext = {}): Promise<AuthResult> {
    const user = await User.findOne({ email });
    if (!user) {
      await logAudit('login_failure', context, undefined, email, { reason: 'User not found' });
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    if (user.status !== 'active') {
      await logAudit('login_failure', context, user._id, user.email, { reason: 'Account inactive or suspended' });
      throw Object.assign(new Error('Account is inactive'), { statusCode: 403 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAudit('login_failure', context, user._id, user.email, { reason: 'Invalid password' });
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, familyId } = generateRefreshToken(user);
    const refreshTokenHash = hashToken(refreshToken);
    const csrfToken = generateCsrfToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      familyId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await logAudit('login_success', context, user._id, user.email, { method: 'password' });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
    };
  },

  async rotateRefreshToken(oldRefreshToken: string, context: RequestContext = {}): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    const oldHash = hashToken(oldRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: oldHash });

    // Reuse Detection: Session not found, already revoked, or replaced by another token
    if (!session || session.isRevoked || session.replacedByTokenHash) {
      if (session) {
        // Invalidate entire family due to token reuse attempt
        await Session.updateMany(
          { familyId: session.familyId },
          { isRevoked: true, revocationReason: 'reuse_detected' }
        );
        await logAudit('token_reuse_detected', context, session.userId, undefined, {
          familyId: session.familyId,
          revocationReason: 'Token reuse detected',
        });
      }
      throw Object.assign(new Error('Security violation: Refresh token reuse detected. All sessions revoked.'), { statusCode: 401 });
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      session.isRevoked = true;
      session.revocationReason = 'expired';
      await session.save();
      throw Object.assign(new Error('Session has expired'), { statusCode: 401 });
    }

    // Re-query user and check status
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'active') {
      session.isRevoked = true;
      session.revocationReason = 'admin_revoked';
      await session.save();
      throw Object.assign(new Error('User account is inactive or not found'), { statusCode: 403 });
    }

    // Generate new rotated token pair
    const accessToken = generateAccessToken(user);
    const { token: newRefreshToken, familyId } = generateRefreshToken(user, session.familyId);
    const newHash = hashToken(newRefreshToken);
    const csrfToken = generateCsrfToken();

    // Mark current session as replaced
    session.isRevoked = true;
    session.revocationReason = 'replaced';
    session.replacedByTokenHash = newHash;
    session.lastActiveAt = new Date();
    await session.save();

    // Create new session record in same family
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Session.create({
      userId: user._id,
      refreshTokenHash: newHash,
      familyId,
      userAgent: context.userAgent || session.userAgent,
      ipAddress: context.ipAddress || session.ipAddress,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await logAudit('token_refreshed', context, user._id, user.email, { familyId });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      csrfToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status,
      },
    };
  },

  async logout(refreshToken?: string, context: RequestContext = {}): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      const session = await Session.findOne({ refreshTokenHash: tokenHash });
      if (session) {
        session.isRevoked = true;
        session.revocationReason = 'logout';
        await session.save();
        await logAudit('logout', context, session.userId);
      }
    }
  },

  async logoutAll(userId: string, context: RequestContext = {}): Promise<void> {
    await Session.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revocationReason: 'admin_revoked' }
    );
    await logAudit('logout_all', context, userId);
  },

  async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    if (user.status !== 'active') {
      throw Object.assign(new Error('Account is inactive'), { statusCode: 403 });
    }
    return user;
  },

  async forgotPassword(email: string, context: RequestContext = {}): Promise<{ resetToken: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      // Return dummy token without leaking user existence
      return { resetToken: generateSecureRandomToken() };
    }

    const resetToken = generateSecureRandomToken();
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await logAudit('password_reset_requested', context, user._id, user.email);

    return { resetToken };
  },

  async resetPassword(resetToken: string, newPassword: string, context: RequestContext = {}): Promise<void> {
    const tokenHash = hashToken(resetToken);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired password reset token'), { statusCode: 400 });
    }

    user.passwordHash = newPassword;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // Revoke all existing sessions for security
    await Session.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revocationReason: 'password_changed' }
    );

    await logAudit('password_reset_completed', context, user._id, user.email);
  },
};
