import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User.model';
import { StudentProfile } from '../models/StudentProfile.model';
import { env } from '../config/env';

async function seedAdminAndStudent() {
  const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI || 'mongodb://127.0.0.1:27017/outvier';
  console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':***@')}...`);

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('hello321', salt);

  // 1. Upsert Admin User (admin@outvier.com / pass: hello321)
  console.log('👤 Configuring Admin User: admin@outvier.com...');
  let admin = await User.findOne({ email: 'admin@outvier.com' });

  if (admin) {
    admin.name = 'Outvier Administrator';
    admin.username = 'admin';
    admin.role = 'admin';
    admin.passwordHash = hashedPassword;
    admin.status = 'active';
    admin.emailVerified = true;
    await admin.save();
    console.log('✨ Updated existing Admin user password to "hello321" and ensured role="admin"');
  } else {
    admin = await User.create({
      name: 'Outvier Administrator',
      username: 'admin',
      email: 'admin@outvier.com',
      passwordHash: 'hello321', // pre-save hook will hash this
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });
    console.log('🎉 Created new Admin user: admin@outvier.com (pass: hello321)');
  }

  // 2. Upsert Student User (student@outvier.com / pass: hello321)
  console.log('🎓 Configuring Student User: student@outvier.com...');
  let student = await User.findOne({ email: 'student@outvier.com' });

  if (student) {
    student.name = 'Alex Student';
    student.username = 'student';
    student.role = 'user';
    student.passwordHash = hashedPassword;
    student.status = 'active';
    student.emailVerified = true;
    await student.save();
    console.log('✨ Updated existing Student user password to "hello321" and ensured role="user"');
  } else {
    student = await User.create({
      name: 'Alex Student',
      username: 'student',
      email: 'student@outvier.com',
      passwordHash: 'hello321', // pre-save hook will hash this
      role: 'user',
      status: 'active',
      emailVerified: true,
    });
    console.log('🎉 Created new Student user: student@outvier.com (pass: hello321)');
  }

  // 3. Ensure Student Profile exists for the student
  let profile = await StudentProfile.findOne({ userId: student._id });
  if (!profile) {
    profile = await StudentProfile.create({
      userId: student._id,
      country: 'India',
      currentEducationLevel: 'Bachelor',
      lastDegreeName: 'Bachelor of Computer Science',
      institutionName: 'Delhi University',
      gpa: 3.6,
      gradingScale: 4.0,
      workExperienceYears: 2,
      preferredField: 'Information Technology',
      preferredLevel: 'master',
      preferredStates: ['NSW', 'VIC'],
      intakePreference: 'Feb 2027 Intake',
      budgetMaxAud: 48000,
      fundingSource: 'Personal Savings & Education Loan',
      scholarshipNeeded: true,
      ieltsOverall: 7.5,
      testStatus: 'taken',
      preferredJobRole: 'Software Engineer',
      targetIndustry: 'Technology',
      postStudyWorkInterest: true,
      migrationInterest: false,
    });
    console.log('📝 Created comprehensive study abroad profile for student@outvier.com');
  } else {
    console.log('ℹ️ Existing student profile found for student@outvier.com');
  }

  console.log('\n==========================================');
  console.log('🔐 CREDENTIALS SUMMARY');
  console.log('==========================================');
  console.log('👑 Admin Account:');
  console.log('   Email:    admin@outvier.com');
  console.log('   Password: hello321');
  console.log('   Role:     admin');
  console.log('------------------------------------------');
  console.log('🎓 Student Account:');
  console.log('   Email:    student@outvier.com');
  console.log('   Password: hello321');
  console.log('   Role:     user');
  console.log('==========================================\n');

  try {
    const { connection } = await import('../config/redis');
    connection.disconnect();
  } catch {}

  await mongoose.disconnect();
  console.log('👋 Database disconnected. Seeding completed successfully.');
}

seedAdminAndStudent().catch((err) => {
  console.error('❌ Error seeding users:', err);
  process.exit(1);
});
