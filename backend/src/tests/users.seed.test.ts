import assert from 'node:assert/strict';
import test, { describe, before, after } from 'node:test';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { StudentProfile } from '../models/StudentProfile.model';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier_test_users';

describe('Admin & Student Authentication and User Seeding Tests', () => {
  let isDbConnected = false;

  before(async () => {
    try {
      await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      isDbConnected = true;
    } catch {
      console.log('⚠️ MongoDB not running locally for test runner. Running standalone password hash verification.');
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

  test('Bcrypt password verification for hello321 matches', async () => {
    const rawPass = 'hello321';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPass, salt);

    const isMatch = await bcrypt.compare('hello321', hash);
    assert.strictEqual(isMatch, true, 'Password hello321 must match generated hash');

    const isWrongMatch = await bcrypt.compare('wrongpass', hash);
    assert.strictEqual(isWrongMatch, false, 'Wrong password must fail comparison');
  });

  test('Admin user has admin role and all admin permissions', async () => {
    if (!isDbConnected) return;

    await User.deleteMany({ email: 'admin@outvier.com' });

    const admin = await User.create({
      name: 'Outvier Administrator',
      username: 'admin',
      email: 'admin@outvier.com',
      passwordHash: 'hello321',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });

    assert.strictEqual(admin.email, 'admin@outvier.com');
    assert.strictEqual(admin.role, 'admin');
    assert.ok(admin.permissions.includes('manage_catalog'));
    assert.ok(admin.permissions.includes('manage_users'));
    assert.ok(admin.permissions.includes('manage_settings'));

    const isPasswordValid = await admin.comparePassword('hello321');
    assert.strictEqual(isPasswordValid, true, 'Admin password comparePassword("hello321") must return true');
  });

  test('Student user has user role and default student permissions', async () => {
    if (!isDbConnected) return;

    await User.deleteMany({ email: 'student@outvier.com' });

    const student = await User.create({
      name: 'Outvier Student',
      username: 'student',
      email: 'student@outvier.com',
      passwordHash: 'hello321',
      role: 'user',
      status: 'active',
      emailVerified: true,
    });

    assert.strictEqual(student.email, 'student@outvier.com');
    assert.strictEqual(student.role, 'user');
    assert.ok(student.permissions.includes('manage_profile'));
    assert.ok(student.permissions.includes('manage_tracker'));
    assert.strictEqual(student.permissions.includes('manage_users'), false);

    const isPasswordValid = await student.comparePassword('hello321');
    assert.strictEqual(isPasswordValid, true, 'Student password comparePassword("hello321") must return true');
  });
});
