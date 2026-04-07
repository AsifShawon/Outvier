export type ProgramLevel = 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate' | 'graduate_certificate';
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
  description: string;
  duration: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: CampusMode;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramPayload {
  name: string;
  university: string;
  level: ProgramLevel;
  field: string;
  description: string;
  duration: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: CampusMode;
  website?: string;
}
