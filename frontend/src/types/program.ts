export type ProgramLevel = 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate' | 'graduate_certificate' | 'secondary' | 'elicos' | 'non_award' | 'other';
export type CampusMode = 'on-campus' | 'online' | 'hybrid';

export interface Program {
  _id: string;
  name: string;
  slug: string;
  university: string;
  universityName: string;
  universitySlug: string;
  level: ProgramLevel;
  field: string;
  description?: string;
  duration?: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: CampusMode;
  website?: string;
  status?: string;

  // CRICOS identity
  cricosCourseCode?: string;
  cricosProviderCode?: string;
  institutionName?: string;
  courseLevel?: string;
  expired?: boolean;
  lastCricosSyncedAt?: string;

  // CRICOS course details
  durationWeeks?: number;
  tuitionFeeAud?: number;
  nonTuitionFeeAud?: number;
  estimatedTotalCourseCostAud?: number;
  totalEstimatedCost?: number;
  courseLanguage?: string;
  workComponent?: string;
  workComponentHoursPerWeek?: number;
  workComponentWeeks?: number;
  workComponentTotalHours?: number;
  vetNationalCode?: string;
  dualQualification?: boolean;
  foundationStudies?: boolean;

  // Field of education
  fieldOfStudy?: string;
  fieldOfEducation1BroadField?: string;
  fieldOfEducation1NarrowField?: string;
  fieldOfEducation1DetailedField?: string;
  fieldOfEducation2BroadField?: string;
  fieldOfEducation2NarrowField?: string;
  fieldOfEducation2DetailedField?: string;

  dataQuality?: {
    sourceName?: string;
    sourceResourceId?: string;
    importMethod?: string;
    lastFetchedAt?: string;
    confidence?: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramPayload {
  name: string;
  university: string;
  level: ProgramLevel;
  field: string;
  description?: string;
  duration?: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: CampusMode;
  website?: string;
}
