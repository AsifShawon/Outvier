import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { StudentProfile } from '../models/StudentProfile.model';

export async function autoSeedDefaultUsers(): Promise<void> {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('hello321', salt);

    // 1. Ensure Admin User
    let admin = await User.findOne({ email: 'admin@outvier.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Outvier Administrator',
        username: 'admin',
        email: 'admin@outvier.com',
        passwordHash: 'hello321',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      });
      console.log('👑 Auto-seeded Admin User: admin@outvier.com / hello321');
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      admin.status = 'active';
      await admin.save();
    }

    // 2. Ensure Student User
    let student = await User.findOne({ email: 'student@outvier.com' });
    if (!student) {
      student = await User.create({
        name: 'Outvier Student',
        username: 'student',
        email: 'student@outvier.com',
        passwordHash: 'hello321',
        role: 'user',
        status: 'active',
        emailVerified: true,
      });
      console.log('🎓 Auto-seeded Student User: student@outvier.com / hello321');
    }

    // 3. Ensure Student Profile
    if (student) {
      const existingProfile = await StudentProfile.findOne({ userId: student._id });
      if (!existingProfile) {
        await StudentProfile.create({
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
        console.log('📝 Auto-seeded Student Profile for student@outvier.com');
      }
    }
  } catch (error) {
    console.warn('⚠️ Auto-seed default users skipped or encountered an issue:', (error as any)?.message);
  }
}
