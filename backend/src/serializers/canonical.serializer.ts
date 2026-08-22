/**
 * canonical.serializer.ts — Serialization for Clean Modern API Output.
 * Exposes exclusively canonical, typed properties to frontend clients without legacy ambiguity.
 */
import { canonicalReadAdapter } from '../adapters/canonicalReadAdapter';

export interface SerializedCanonicalProgram {
  id: string;
  provider: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  level: string;
  fieldOfStudy: string;
  discipline?: string;
  programCode?: string;
  description: string;
  faculty?: string;
  duration: {
    years?: number;
    semesters?: number;
    weeks?: number;
    text?: string;
  };
  fees: {
    primaryAnnualAud?: number;
    primaryTotalAud?: number;
    currency: string;
  };
  cricosCourseCode?: string;
  status: string;
  studyModes: string[];
  campusCities: string[];
  careerPathways: string[];
  activeIntakeCount: number;
  sourceEvidence?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SerializedCanonicalUniversity {
  id: string;
  name: string;
  slug: string;
  shortName?: string;
  country: string;
  state: string;
  city?: string;
  officialWebsite?: string;
  logoUrl?: string;
  providerType: string;
  cricosProviderCode?: string;
  teqsaProviderId?: string;
  establishedYear?: number;
  description: string;
  status: string;
  stats: {
    programCount: number;
    offeringCount?: number;
    campusCount?: number;
    primaryRank?: number;
    averageAnnualTuitionAud?: number;
  };
  campuses: Array<{
    name: string;
    city?: string;
    state?: string;
    address?: string;
  }>;
  sourceEvidence?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const canonicalSerializer = {
  serializeProgram(doc: any): SerializedCanonicalProgram {
    const adapted = canonicalReadAdapter.adaptProgram(doc);
    return {
      id: adapted.id,
      provider: {
        id: adapted.providerId,
        name: adapted.providerName,
        slug: adapted.providerSlug,
      },
      name: adapted.name,
      slug: adapted.slug,
      level: adapted.level,
      fieldOfStudy: adapted.fieldOfStudy,
      discipline: adapted.discipline,
      programCode: adapted.programCode,
      description: adapted.description,
      faculty: adapted.faculty,
      duration: adapted.duration,
      fees: {
        primaryAnnualAud: adapted.primaryFeeAnnualAud,
        primaryTotalAud: adapted.primaryFeeTotalAud,
        currency: 'AUD',
      },
      cricosCourseCode: adapted.cricosCourseCode,
      status: adapted.status,
      studyModes: adapted.availableStudyModes || [adapted.campusMode],
      campusCities: adapted.availableCampusCities || (adapted.city ? [adapted.city] : []),
      careerPathways: adapted.careerPathways || [],
      activeIntakeCount: adapted.activeIntakeCount || 0,
      sourceEvidence: adapted.sourceEvidence,
      createdAt: adapted.createdAt,
      updatedAt: adapted.updatedAt,
    };
  },

  serializePrograms(docs: any[]): SerializedCanonicalProgram[] {
    return (docs || []).map(d => this.serializeProgram(d));
  },

  serializeUniversity(doc: any): SerializedCanonicalUniversity {
    const adapted = canonicalReadAdapter.adaptUniversity(doc);
    return {
      id: adapted.id,
      name: adapted.name,
      slug: adapted.slug,
      shortName: adapted.shortName,
      country: adapted.country,
      state: adapted.state,
      city: adapted.city,
      officialWebsite: adapted.officialWebsite,
      logoUrl: adapted.logoUrl,
      providerType: adapted.providerType || 'university',
      cricosProviderCode: adapted.cricosProviderCode,
      teqsaProviderId: adapted.teqsaProviderId,
      establishedYear: adapted.establishedYear,
      description: adapted.description || '',
      status: adapted.status,
      stats: {
        programCount: adapted.programCount,
        offeringCount: adapted.offeringCount,
        campusCount: adapted.campusCount,
        primaryRank: adapted.primaryRank,
        averageAnnualTuitionAud: adapted.averageTuitionAud,
      },
      campuses: (adapted.campusDetails || []).map((c: any) => ({
        name: c.name,
        city: c.city,
        state: c.state,
        address: c.address,
      })),
      sourceEvidence: adapted.sourceEvidence,
      createdAt: adapted.createdAt,
      updatedAt: adapted.updatedAt,
    };
  },

  serializeUniversities(docs: any[]): SerializedCanonicalUniversity[] {
    return (docs || []).map(d => this.serializeUniversity(d));
  },
};
