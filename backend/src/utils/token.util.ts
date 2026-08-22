import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { IUser } from '../models/User.model';

export interface AccessTokenPayload {
  id: string;
  email: string;
  username: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  id: string;
  familyId: string;
  jti: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generateAccessToken(user: IUser): string {
  const payload: AccessTokenPayload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
    permissions: user.permissions || [],
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (env.ACCESS_TOKEN_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(user: IUser, familyId?: string): { token: string; familyId: string; jti: string } {
  const finalFamilyId = familyId || crypto.randomUUID();
  const jti = crypto.randomUUID();

  const payload: RefreshTokenPayload = {
    id: user._id.toString(),
    familyId: finalFamilyId,
    jti,
  };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: (env.REFRESH_TOKEN_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });

  return { token, familyId: finalFamilyId, jti };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
