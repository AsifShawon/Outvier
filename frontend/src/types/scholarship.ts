import { University } from './university';

export type ScholarshipStatus = 'draft' | 'published' | 'archived' | 'expired' | 'unpublished';
export type ScholarshipVisibility = 'public' | 'private';

export interface SourceLink {
  label: string;
  url: string;
  type?: string;
  verified?: boolean;
  lastCheckedAt?: string;
}

export interface Scholarship {
  _id: string;
  title: string;
  slug: string;
  shortSummary: string;
  description: string;
  category: string;
  type?: string;
  imageUrl?: string;
  imageAlt?: string;
  linkedUniversity?: University | string;
  country: string;
  state?: string;
  city?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  deadlineTimezone?: string;
  openingDate?: string;
  applicationLink?: string;
  sourceLinks?: SourceLink[];
  eligibility?: string;
  benefits?: string;
  requiredDocuments?: string;
  applicationSteps?: string;
  importantNotes?: string;
  tags?: string[];
  contactEmail?: string;
  status: ScholarshipStatus;
  visibility: ScholarshipVisibility;
  featured: boolean;
  priorityOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateScholarshipPayload = Partial<Omit<Scholarship, '_id' | 'createdAt' | 'updatedAt' | 'slug'>> & {
  title: string;
  shortSummary: string;
  description: string;
  category: string;
  slug?: string;
};

export type UpdateScholarshipPayload = Partial<CreateScholarshipPayload>;
