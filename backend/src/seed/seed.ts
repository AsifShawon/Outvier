import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import { User } from '../models/User.model';
import { University, IUniversity } from '../models/University.model';
import { Program } from '../models/Program.model';

dotenv.config({ path: '../../.env' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/outvier';

const universities = [
  {
    name: 'Adelaide University',
    description:
      'Adelaide University is a new world-class university formed through the merger of the University of Adelaide and UniSA. It combines centuries of tradition with innovative research and teaching excellence.',
    location: 'Adelaide, South Australia',
    state: 'SA',
    website: 'https://www.adelaide.edu.au',
    establishedYear: 1874,
    ranking: 100,
    type: 'public' as const,
    campuses: ['North Terrace', 'Mawson Lakes', 'Mount Gambier'],
    internationalStudents: true,
  },
  {
    name: 'Flinders University',
    description:
      'Flinders University is a public research university in Adelaide, South Australia. Named after Matthew Flinders, who charted much of the Australian coastline, the university is committed to changing lives and changing the world.',
    location: 'Adelaide, South Australia',
    state: 'SA',
    website: 'https://www.flinders.edu.au',
    establishedYear: 1966,
    ranking: 401,
    type: 'public' as const,
    campuses: ['Bedford Park', 'City Campus', 'Tonsley'],
    internationalStudents: true,
  },
  {
    name: 'Torrens University Australia',
    description:
      'Torrens University Australia is a private, not-for-profit university offering industry-focused programs in business, design, health, education, and hospitality. Known for its flexible learning options and campus in Adelaide.',
    location: 'Adelaide, South Australia',
    state: 'SA',
    website: 'https://www.torrens.edu.au',
    establishedYear: 2013,
    type: 'private' as const,
    campuses: ['Adelaide', 'Sydney', 'Melbourne', 'Brisbane'],
    internationalStudents: true,
  },
  {
    name: 'CQUniversity',
    description:
      'CQUniversity is Australia\'s largest regional university, headquartered in Rockhampton. It focuses on applied education and research with strong industry engagement across Australia.',
    location: 'Rockhampton, Queensland',
    state: 'QLD',
    website: 'https://www.cqu.edu.au',
    establishedYear: 1967,
    ranking: 601,
    type: 'public' as const,
    campuses: ['Rockhampton', 'Adelaide', 'Melbourne', 'Brisbane', 'Sydney'],
    internationalStudents: true,
  },
];

const programTemplates = [
  // Adelaide University
  {
    universityName: 'Adelaide University',
    programs: [
      {
        name: 'Bachelor of Computer Science',
        level: 'bachelor' as const,
        field: 'Information Technology',
        description: 'A comprehensive program covering algorithms, software engineering, AI, and data structures. Graduates are equipped for roles in software development, data science, and systems architecture.',
        duration: '3 years full-time',
        tuitionFeeLocal: 12500,
        tuitionFeeInternational: 38000,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.5 overall, no band below 6.0',
        academicRequirements: 'ATAR 80 or equivalent',
        careerPathways: ['Software Engineer', 'Data Scientist', 'Systems Analyst', 'AI Engineer'],
        campusMode: 'on-campus' as const,
        website: 'https://www.adelaide.edu.au/programs/computer-science',
      },
      {
        name: 'Master of Data Science',
        level: 'master' as const,
        field: 'Data Science',
        description: 'An advanced program exploring machine learning, big data analytics, statistical modeling, and data visualization. Ideal for professionals seeking to advance their careers in data-driven fields.',
        duration: '2 years full-time',
        tuitionFeeLocal: 15000,
        tuitionFeeInternational: 45000,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.5 overall, no band below 6.0',
        academicRequirements: 'Bachelor degree in related field with GPA 5.0+',
        careerPathways: ['Data Scientist', 'Machine Learning Engineer', 'Business Intelligence Analyst'],
        campusMode: 'hybrid' as const,
        website: 'https://www.adelaide.edu.au/programs/master-data-science',
      },
      {
        name: 'Graduate Certificate in Cybersecurity',
        level: 'graduate_certificate' as const,
        field: 'Cybersecurity',
        description: 'A focused program covering network security, ethical hacking, risk management, and compliance frameworks. Designed for IT professionals looking to specialise in information security.',
        duration: '6 months full-time',
        tuitionFeeLocal: 9500,
        tuitionFeeInternational: 22000,
        intakeMonths: ['February', 'July', 'November'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'Bachelor degree in IT or equivalent experience',
        careerPathways: ['Security Analyst', 'Penetration Tester', 'CISO'],
        campusMode: 'online' as const,
        website: 'https://www.adelaide.edu.au/programs/grad-cert-cybersecurity',
      },
    ],
  },
  // Flinders University
  {
    universityName: 'Flinders University',
    programs: [
      {
        name: 'Bachelor of Information Technology',
        level: 'bachelor' as const,
        field: 'Information Technology',
        description: 'A practice-oriented program that blends theory with real-world skills in software development, networking, and information systems. Industry placements are a core component.',
        duration: '3 years full-time',
        tuitionFeeLocal: 11800,
        tuitionFeeInternational: 33500,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'ATAR 65 or equivalent',
        careerPathways: ['IT Consultant', 'Network Engineer', 'Web Developer'],
        campusMode: 'on-campus' as const,
        website: 'https://www.flinders.edu.au/study/courses/bachelor-information-technology',
      },
      {
        name: 'Master of Artificial Intelligence',
        level: 'master' as const,
        field: 'Artificial Intelligence',
        description: 'Covering deep learning, natural language processing, computer vision, and AI ethics. Students work on applied AI projects with industry partners in Adelaide and beyond.',
        duration: '2 years full-time',
        tuitionFeeLocal: 16000,
        tuitionFeeInternational: 42000,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.5',
        academicRequirements: 'Bachelor in CS, IT, or Mathematics with credit average',
        careerPathways: ['AI Researcher', 'ML Engineer', 'NLP Specialist'],
        campusMode: 'on-campus' as const,
        website: 'https://www.flinders.edu.au/study/courses/master-artificial-intelligence',
      },
      {
        name: 'Graduate Certificate in Project Management',
        level: 'graduate_certificate' as const,
        field: 'Business',
        description: 'A practical qualification covering project planning, risk assessment, stakeholder management, and agile methodologies. Suitable for professionals across all industries.',
        duration: '6 months full-time',
        tuitionFeeLocal: 8500,
        tuitionFeeInternational: 19500,
        intakeMonths: ['February', 'July', 'October'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'Bachelor degree or 3 years relevant work experience',
        careerPathways: ['Project Manager', 'Program Coordinator', 'Scrum Master'],
        campusMode: 'hybrid' as const,
        website: 'https://www.flinders.edu.au/study/courses/grad-cert-project-management',
      },
    ],
  },
  // Torrens University
  {
    universityName: 'Torrens University Australia',
    programs: [
      {
        name: 'Bachelor of Business (Entrepreneurship)',
        level: 'bachelor' as const,
        field: 'Business',
        description: 'An entrepreneurship-focused business degree that nurtures startup thinking, innovation, and leadership skills. Students work on real business challenges from day one.',
        duration: '3 years full-time',
        tuitionFeeLocal: 13200,
        tuitionFeeInternational: 30000,
        intakeMonths: ['January', 'April', 'July', 'October'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'Australian Year 12 or equivalent',
        careerPathways: ['Entrepreneur', 'Business Consultant', 'Startup Founder', 'Product Manager'],
        campusMode: 'hybrid' as const,
        website: 'https://www.torrens.edu.au/courses/business/bachelor-business-entrepreneurship',
      },
      {
        name: 'Master of Interaction Design',
        level: 'master' as const,
        field: 'Design',
        description: 'An advanced design program focusing on UX/UI, design thinking, human-centred design, and digital product strategy. Graduates are ready to lead design teams in tech companies.',
        duration: '2 years full-time',
        tuitionFeeLocal: 14500,
        tuitionFeeInternational: 35000,
        intakeMonths: ['January', 'July'],
        englishRequirements: 'IELTS 6.5',
        academicRequirements: 'Bachelor degree in Design, IT, or related field',
        careerPathways: ['UX Designer', 'Product Designer', 'Design Lead', 'Creative Director'],
        campusMode: 'on-campus' as const,
        website: 'https://www.torrens.edu.au/courses/design/master-interaction-design',
      },
    ],
  },
  // CQUniversity
  {
    universityName: 'CQUniversity',
    programs: [
      {
        name: 'Bachelor of Engineering (Software)',
        level: 'bachelor' as const,
        field: 'Engineering',
        description: 'An accredited engineering degree combining software development, systems design, and embedded systems. Includes a mandatory industry placement in the final year.',
        duration: '4 years full-time',
        tuitionFeeLocal: 10800,
        tuitionFeeInternational: 29000,
        intakeMonths: ['February', 'July'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'ATAR 65 or equivalent with Maths',
        careerPathways: ['Software Engineer', 'Embedded Systems Developer', 'Systems Architect'],
        campusMode: 'on-campus' as const,
        website: 'https://www.cqu.edu.au/courses/bachelor-engineering-software',
      },
      {
        name: 'Master of Information Systems',
        level: 'master' as const,
        field: 'Information Technology',
        description: 'Covers enterprise systems, IT governance, cloud computing, and business process optimization. Designed for working professionals with flexible online delivery.',
        duration: '2 years full-time',
        tuitionFeeLocal: 13500,
        tuitionFeeInternational: 32000,
        intakeMonths: ['February', 'June', 'September'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'Bachelor degree in any field with relevant work experience',
        careerPathways: ['IT Manager', 'Business Analyst', 'ERP Consultant'],
        campusMode: 'online' as const,
        website: 'https://www.cqu.edu.au/courses/master-information-systems',
      },
      {
        name: 'Graduate Certificate in Data Analytics',
        level: 'graduate_certificate' as const,
        field: 'Data Science',
        description: 'An entry-level postgraduate qualification in data analytics, covering SQL, Python, Power BI, and statistical analysis. Perfect for career changers entering the data industry.',
        duration: '6 months full-time',
        tuitionFeeLocal: 7500,
        tuitionFeeInternational: 18000,
        intakeMonths: ['February', 'June', 'September'],
        englishRequirements: 'IELTS 6.0',
        academicRequirements: 'Bachelor degree or significant work experience',
        careerPathways: ['Data Analyst', 'Business Intelligence Developer', 'Reporting Analyst'],
        campusMode: 'online' as const,
        website: 'https://www.cqu.edu.au/courses/grad-cert-data-analytics',
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      University.deleteMany({}),
      Program.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin',
      role: 'admin',
    });
    console.log(`👤 Admin user created: ${adminUser.username}`);

    // Create universities
    const createdUniversities: Record<string, IUniversity> = {};
    for (const uniData of universities) {
      const slug = slugify(uniData.name, { lower: true, strict: true });
      const university = await University.create({ ...uniData, slug });
      createdUniversities[uniData.name] = university;
      console.log(`🏫 University created: ${university.name}`);
    }

    // Create programs
    let programCount = 0;
    for (const template of programTemplates) {
      const university = createdUniversities[template.universityName];
      if (!university) continue;

      for (const programData of template.programs) {
        const baseSlug = slugify(`${programData.name} ${university.name}`, { lower: true, strict: true });
        await Program.create({
          ...programData,
          slug: baseSlug,
          university: university._id,
          universityName: university.name,
          universitySlug: university.slug,
        });
        programCount++;
        console.log(`📚 Program created: ${programData.name} @ ${university.name}`);
      }
    }

    console.log(`\n✅ Seed complete!`);
    console.log(`   👤 Users: 1 (admin/admin)`);
    console.log(`   🏫 Universities: ${Object.keys(createdUniversities).length}`);
    console.log(`   📚 Programs: ${programCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
