import assert from 'node:assert/strict';
import test, { describe, before, after, beforeEach } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User.model';
import { Session } from '../models/Session.model';
import { AuditLog } from '../models/AuditLog.model';
import { authService } from '../services/auth.service';
import { validateEnv } from '../config/env';
import { hashToken, generateAccessToken, generateRefreshToken } from '../utils/token.util';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } from '../utils/cookie.util';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_security';

describe('Auth & API Security Integration Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not available locally for live DB tests. Running mock-backed integration tests.');
    }
  });

  after(async () => {
    try {
      const { connection } = await import('../config/redis');
      connection.disconnect();
    } catch {}
    if (isDbConnected) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (isDbConnected) {
      await User.deleteMany({});
      await Session.deleteMany({});
      await AuditLog.deleteMany({});
    }
  });

  describe('1. Environment & Secret Validation', () => {
    test('validateEnv throws error when production JWT_SECRET is missing or insecure', () => {
      const oldEnv = { ...process.env };
      try {
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'short';
        assert.throws(() => validateEnv(), /JWT_SECRET/);
      } finally {
        process.env = oldEnv;
      }
    });

    test('validateEnv throws error when ENABLE_ADMIN_SEEDER is true but password is weak or default', () => {
      const oldEnv = { ...process.env };
      try {
        process.env.ENABLE_ADMIN_SEEDER = 'true';
        process.env.ADMIN_SEED_PASSWORD = 'admin';
        assert.throws(() => validateEnv(), /ENABLE_ADMIN_SEEDER is true but ADMIN_SEED_PASSWORD/);
      } finally {
        process.env = oldEnv;
      }
    });
  });

  describe('2. CSRF Protection Middleware', () => {
    test('rejects mutating request with cookie auth when X-CSRF-Token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/comparison/create')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE}=some_jwt; ${CSRF_TOKEN_COOKIE}=valid_csrf_token`])
        .send({ programs: [] });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /CSRF token/i);
    });

    test('rejects mutating request with cookie auth when X-CSRF-Token does not match cookie', async () => {
      const res = await request(app)
        .post('/api/v1/comparison/create')
        .set('Cookie', [`${ACCESS_TOKEN_COOKIE}=some_jwt; ${CSRF_TOKEN_COOKIE}=valid_csrf_token`])
        .set('X-CSRF-Token', 'wrong_csrf_token')
        .send({ programs: [] });

      assert.equal(res.status, 403);
      assert.match(res.body.message, /CSRF token/i);
    });
  });

  describe('3. Token & Rotation Logic Unit-Integration', () => {
    test('generates valid access token and rotating refresh token with familyId', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'tester@outvier.com',
        username: 'tester',
        role: 'user' as const,
        permissions: ['read_catalog'],
      } as any;

      const accessToken = generateAccessToken(mockUser);
      assert.ok(accessToken);
      assert.equal(typeof accessToken, 'string');

      const { token: refreshToken, familyId } = generateRefreshToken(mockUser);
      assert.ok(refreshToken);
      assert.ok(familyId);
      assert.notEqual(accessToken, refreshToken);
    });

    test('hashToken produces consistent SHA-256 output', () => {
      const token = 'sample_refresh_token_string_123';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
    });
  });

  if (isDbConnected) {
    describe('4. Full Lifecycle Database-Backed Auth & Session Flow', () => {
      test('signup creates user with active status, session record, and sets HttpOnly cookies', async () => {
        const res = await request(app)
          .post('/api/v1/auth/signup')
          .send({
            name: 'Security Test Student',
            email: 'secstudent@outvier.com',
            password: 'SuperSecurePassword123!',
          });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.user.email, 'secstudent@outvier.com');
        assert.ok(res.body.data.csrfToken);

        const rawCookies = res.headers['set-cookie'];
        const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : (rawCookies ? [String(rawCookies)] : []);
        assert.ok(cookies.length > 0);
        assert.ok(cookies.some((c: string) => c.includes('access_token=') && c.includes('HttpOnly')));
        assert.ok(cookies.some((c: string) => c.includes('refresh_token=') && c.includes('HttpOnly')));
        assert.ok(cookies.some((c: string) => c.includes('csrf_token=')));

        const session = await Session.findOne({});
        assert.ok(session);
        assert.equal(session.isRevoked, false);
      });

      test('login fails with wrong password and logs audit event', async () => {
        await authService.signup({
          name: 'Student 2',
          email: 'student2@outvier.com',
          password: 'Password123!',
        });

        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'student2@outvier.com',
            password: 'WrongPassword!',
          });

        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);

        const audit = await AuditLog.findOne({ action: 'login_failure', userEmail: 'student2@outvier.com' });
        assert.ok(audit);
      });

      test('inactive account cannot log in', async () => {
        const user = new User({
          name: 'Inactive User',
          email: 'inactive@outvier.com',
          passwordHash: 'Password123!',
          status: 'inactive',
        });
        await user.save();

        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'inactive@outvier.com',
            password: 'Password123!',
          });

        assert.equal(res.status, 403);
        assert.match(res.body.message, /inactive/i);
      });

      test('refresh token rotation replaces session and issues new rotating token', async () => {
        const signupRes = await authService.signup({
          name: 'Refresh Tester',
          email: 'refreshtest@outvier.com',
          password: 'Password123!',
        });

        const oldRefresh = signupRes.refreshToken;
        const rotateRes = await authService.rotateRefreshToken(oldRefresh);

        assert.ok(rotateRes.accessToken);
        assert.ok(rotateRes.refreshToken);
        assert.notEqual(rotateRes.refreshToken, oldRefresh);

        const oldSession = await Session.findOne({ refreshTokenHash: hashToken(oldRefresh) });
        assert.ok(oldSession);
        assert.equal(oldSession.isRevoked, true);
        assert.equal(oldSession.revocationReason, 'replaced');
        assert.equal(oldSession.replacedByTokenHash, hashToken(rotateRes.refreshToken));
      });

      test('reuse of an old refresh token triggers reuse detection and revokes session family', async () => {
        const signupRes = await authService.signup({
          name: 'Reuse Tester',
          email: 'reusetest@outvier.com',
          password: 'Password123!',
        });

        const initialRefresh = signupRes.refreshToken;
        // First valid rotation
        const rotation1 = await authService.rotateRefreshToken(initialRefresh);
        assert.ok(rotation1.refreshToken);

        // Attacker attempts to reuse initialRefresh
        await assert.rejects(
          async () => {
            await authService.rotateRefreshToken(initialRefresh);
          },
          /Refresh token reuse detected/i
        );

        // Entire family should now be revoked
        const familySessions = await Session.find({ userId: signupRes.user._id });
        assert.ok(familySessions.length >= 2);
        assert.ok(familySessions.every((s) => s.isRevoked === true));

        // Attempting to rotate the newest token should also fail
        await assert.rejects(
          async () => {
            await authService.rotateRefreshToken(rotation1.refreshToken);
          },
          /Invalid or expired|revoked/i
        );
      });

      test('logout single session revokes only that session', async () => {
        const signupRes = await authService.signup({
          name: 'Logout Tester',
          email: 'logouttest@outvier.com',
          password: 'Password123!',
        });

        await authService.logout(signupRes.refreshToken);
        const session = await Session.findOne({ refreshTokenHash: hashToken(signupRes.refreshToken) });
        assert.ok(session);
        assert.equal(session.isRevoked, true);
        assert.equal(session.revocationReason, 'logout');
      });

      test('logoutAll revokes all user sessions', async () => {
        const signupRes = await authService.signup({
          name: 'Logout All Tester',
          email: 'logoutall@outvier.com',
          password: 'Password123!',
        });

        await authService.logoutAll(signupRes.user._id!.toString());
        const activeSessions = await Session.find({ userId: signupRes.user._id, isRevoked: false });
        assert.equal(activeSessions.length, 0);
      });

      test('non-admin access to admin routes is forbidden (403)', async () => {
        const student = await authService.signup({
          name: 'Normal Student',
          email: 'normalstudent@outvier.com',
          password: 'Password123!',
        });

        const res = await request(app)
          .get('/api/v1/admin/universities')
          .set('Authorization', `Bearer ${student.accessToken}`);

        assert.equal(res.status, 403);
        assert.match(res.body.message, /Forbidden/i);
      });
    });
  }
});
