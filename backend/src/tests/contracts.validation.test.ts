import assert from 'node:assert/strict';
import test, { describe, before, after, beforeEach } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User.model';
import { TrackerBoard } from '../models/TrackerBoard.model';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { BudgetPlan } from '../models/BudgetPlan.model';
import { authService } from '../services/auth.service';
import { escapeRegex } from '../utils/response.util';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_contracts';

describe('API Contract Standardization & Validation Security Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally. Running standalone contract unit tests.');
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
      await TrackerBoard.deleteMany({});
      await ApplicationTracker.deleteMany({});
      await StudentProfile.deleteMany({});
      await BudgetPlan.deleteMany({});
    }
  });

  describe('1. Regex Escaping Utility Tests', () => {
    test('escapeRegex properly sanitizes ReDoS and regex special characters', () => {
      const malicious = '[.*+?^${}()|[\\]\\\\(a+)+';
      const sanitized = escapeRegex(malicious);
      assert.doesNotThrow(() => new RegExp(sanitized));
      assert.ok(sanitized.includes('\\('));
      assert.ok(sanitized.includes('\\['));
    });
  });

  if (isDbConnected) {
    describe('2. Validation Middleware & Mass Assignment Protection', () => {
      let userToken: string;
      let userBToken: string;

      beforeEach(async () => {
        const userA = await authService.signup({
          name: 'Contract Tester A',
          email: 'contractA@outvier.com',
          password: 'Password123!',
        });
        userToken = userA.accessToken;

        const userB = await authService.signup({
          name: 'Contract Tester B',
          email: 'contractB@outvier.com',
          password: 'Password123!',
        });
        userBToken = userB.accessToken;
      });

      test('StudentProfile: rejects arbitrary extra fields (mass assignment prevention)', async () => {
        const res = await request(app)
          .put('/api/v1/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            gpa: 3.8,
            gradingScale: 4.0,
            isAdmin: true, // Malicious unwhitelisted field
            role: 'admin',
          });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.equal(res.body.error.code, 'VALIDATION_ERROR');
        assert.ok(res.body.error.fieldErrors.length > 0);
      });

      test('Tracker: creates default board cleanly on first request without header collision', async () => {
        const res = await request(app)
          .get('/api/v1/tracker/board')
          .set('Authorization', `Bearer ${userToken}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.columns.length > 0);
        assert.ok(res.body.meta.requestId);
      });

      test('Tracker: rejects mass assignment attempts to inject userId or boardId in addItem', async () => {
        const fakeUserId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .post('/api/v1/tracker/items')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Test Application',
            userId: fakeUserId, // Attempt mass assignment
          });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      });

      test('Tracker: column ownership validation prevents moving items to a non-existent column', async () => {
        // Create an item
        const addRes = await request(app)
          .post('/api/v1/tracker/items')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Master of IT @ Melbourne',
            itemType: 'program',
            priority: 'high',
          });

        assert.equal(addRes.status, 201);
        const itemId = addRes.body.data._id;

        // Try moving to foreign column
        const moveRes = await request(app)
          .patch(`/api/v1/tracker/items/${itemId}/move`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            toColumnId: 'non_existent_column_id_123',
          });

        assert.equal(moveRes.status, 400);
        assert.equal(moveRes.body.error.code, 'INVALID_COLUMN');
      });

      test('Tracker: search handles regex special characters safely without 500 error', async () => {
        const res = await request(app)
          .get('/api/v1/tracker/items?search=' + encodeURIComponent('[(.*+?^$)]'))
          .set('Authorization', `Bearer ${userToken}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
      });

      test('BudgetPlan: prevents user B from updating or deleting user A plan', async () => {
        // User A creates plan
        const createRes = await request(app)
          .post('/api/v1/budget')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Sydney Student Budget',
            tuitionPerYear: 35000,
            monthlyRent: 1600,
          });

        assert.equal(createRes.status, 201);
        const planId = createRes.body.data._id;

        // User B attempts to update User A's plan
        const updateRes = await request(app)
          .put(`/api/v1/budget/${planId}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            title: 'Hacked Budget',
          });

        assert.equal(updateRes.status, 404);

        // User B attempts to delete User A's plan
        const deleteRes = await request(app)
          .delete(`/api/v1/budget/${planId}`)
          .set('Authorization', `Bearer ${userBToken}`);

        assert.equal(deleteRes.status, 404);
      });
    });
  }
});
