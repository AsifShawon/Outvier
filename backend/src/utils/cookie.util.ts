import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_TOKEN_COOKIE = 'csrf_token';

// 15 minutes
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
// 7 days
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string, csrfToken: string): void {
  const baseOptions = getBaseCookieOptions();

  // Access token cookie
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Refresh token cookie (scoped to refresh endpoint or root)
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseOptions,
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // CSRF token cookie (readable by JS to echo into X-CSRF-Token header)
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
    ...baseOptions,
    httpOnly: false, // Must be readable by client JS to send in header
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  const baseOptions = getBaseCookieOptions();

  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseOptions, path: '/' });
  res.clearCookie(CSRF_TOKEN_COOKIE, { ...baseOptions, httpOnly: false });
}
