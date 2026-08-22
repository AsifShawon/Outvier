/**
 * canonicalReadAdapter.ts — Bidirectional Compatibility Read Adapters.
 * Adapts legacy and modern raw documents into canonical, provenance-aware representations
 * while synthesizing legacy aliases so older views and third-party integrations do not break.
 */
import { Types } from 'mongoose';

export interface CanonicalProgramDTO {
  id: string;
  _id: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  name: string;
  slug: string;
  level: string;
  fieldOfStudy: string;
  discipline?: string;
  fieldOfEducation?: {
    broadField?: string;
    narrowField?: string;
    detailedField?: string;
    broadCode?: string;
    narrowCode?: string;
    detailedCode?: string;
  };
  programCode?: string;
  description: string;
  faculty?: string;
  duration: {
    years?: number;
    semesters?: number;
    weeks?: number;
    text?: string;
  };
  primaryFeeAnnualAud?: number;
  primaryFeeTotalAud?: number;
  cricosCourseCode?: string;
  cricosProviderCode?: string;
  status: string;
  careerPathways?: string[];
  courseStructure?: Record<string, unknown>;
  availableStudyModes?: string[];
  availableCampusCities?: string[];
  activeIntakeCount?: number;
  sourceEvidence?: Record<string, unknown>;
  dataQuality?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Legacy compatibility getters / fields
  field: string;
  campusMode: string;
  tuitionFeeInternational?: number;
  tuitionFeeLocal?: number;
  annualTuition?: number;
  totalEstimatedCost?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  website?: string;
  university: string;
  universityName: string;
  universitySlug: string;
  city?: string;
  state?: string;
}

export interface CanonicalUniversityDTO {
  id: string;
  _id: string;
  name: string;
  slug: string;
  shortName?: string;
  country: string;
  state: string;
  city?: string;
  officialWebsite?: string;
  logoUrl?: string;
  providerType?: string;
  cricosProviderCode?: string;
  teqsaProviderId?: string;
  establishedYear?: number;
  description?: string;
  status: string;
  postalAddress?: Record<string, unknown>;
  campusDetails?: Array<Record<string, unknown>>;
  programCount: number;
  offeringCount?: number;
  campusCount?: number;
  primaryRank?: number;
  averageEstimatedTotalCostAud?: number;
  averageTuitionAud?: number;
  sourceEvidence?: Record<string, unknown>;
  sourceMetadata?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Legacy compatibility fields
  location?: string;
  website?: string;
  logo?: string;
  ranking?: number;
  rankingBand?: string;
  type?: string;
  campuses?: string[];
  internationalStudents?: boolean;
}

export const canonicalReadAdapter = {
  /**
   * Adapts a raw or Mongoose Program document into a CanonicalProgramDTO.
   */
  adaptProgram(raw: any): CanonicalProgramDTO {
    if (!raw) return raw;
    const doc = typeof raw.toObject === 'function' ? raw.toObject() : raw;

    const id = doc._id ? String(doc._id) : (doc.id ? String(doc.id) : '');
    const providerId = doc.provider ? String(doc.provider._id || doc.provider) : (doc.university ? String(doc.university._id || doc.university) : '');
    const providerName = doc.providerName || doc.universityName || doc.provider?.name || doc.university?.name || '';
    const providerSlug = doc.providerSlug || doc.universitySlug || doc.provider?.slug || doc.university?.slug || '';

    const canonicalFieldOfStudy = doc.fieldOfStudy || doc.field || 'General Studies';
    
    // Parse duration structure
    let durationYears = doc.durationStructure?.durationYears;
    let durationWeeks = doc.durationStructure?.durationWeeks || doc.durationWeeks;
    let durationText = doc.durationStructure?.durationText || doc.duration || (durationWeeks ? `${durationWeeks} weeks` : '');
    
    if (!durationYears && typeof durationText === 'string') {
      const yearMatch = durationText.match(/(\d+(?:\.\d+)?)\s*year/i);
      if (yearMatch) durationYears = parseFloat(yearMatch[1]);
    }

    // Resolve unified primary fees
    const primaryFeeAnnualAud =
      doc.primaryFeeAnnualAud ??
      doc.annualTuition ??
      doc.tuitionFeeAud ??
      doc.tuitionFeeInternational ??
      doc.tuitionDetails?.annualTuitionFee ??
      undefined;

    const primaryFeeTotalAud =
      doc.primaryFeeTotalAud ??
      doc.totalEstimatedCost ??
      doc.estimatedTotalCourseCostAud ??
      doc.tuitionDetails?.totalEstimatedTuitionFee ??
      (primaryFeeAnnualAud && durationYears ? Math.round(primaryFeeAnnualAud * durationYears) : undefined);

    const studyMode = doc.campusMode || doc.deliveryMode || doc.studyMode || 'on-campus';

    return {
      id,
      _id: id,
      providerId,
      providerName,
      providerSlug,
      name: doc.name || '',
      slug: doc.slug || '',
      level: doc.level || 'bachelor',
      fieldOfStudy: canonicalFieldOfStudy,
      discipline: doc.discipline,
      fieldOfEducation: doc.fieldOfEducation || {
        broadField: doc.fieldOfEducation1BroadField,
        narrowField: doc.fieldOfEducation1NarrowField,
        detailedField: doc.fieldOfEducation1DetailedField,
      },
      programCode: doc.programCode || doc.cricosCourseCode,
      description: doc.description || '',
      faculty: doc.faculty,
      duration: {
        years: durationYears,
        semesters: doc.durationStructure?.durationSemesters,
        weeks: durationWeeks,
        text: durationText,
      },
      primaryFeeAnnualAud,
      primaryFeeTotalAud,
      cricosCourseCode: doc.cricosCourseCode,
      cricosProviderCode: doc.cricosProviderCode,
      status: doc.status || 'active',
      careerPathways: doc.careerPathways || doc.careerOutcomes?.jobRoles,
      courseStructure: doc.courseStructure,
      availableStudyModes: doc.availableStudyModes || [studyMode],
      availableCampusCities: doc.availableCampusCities || (doc.city ? [doc.city] : []),
      activeIntakeCount: doc.activeIntakeCount ?? (doc.intakeMonths?.length || 0),
      sourceEvidence: doc.sourceEvidence,
      dataQuality: doc.dataQuality,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,

      // Legacy compatibility mappings
      field: canonicalFieldOfStudy,
      campusMode: studyMode as any,
      tuitionFeeInternational: primaryFeeAnnualAud,
      tuitionFeeLocal: doc.tuitionFeeLocal,
      annualTuition: primaryFeeAnnualAud,
      totalEstimatedCost: primaryFeeTotalAud,
      intakeMonths: doc.intakeMonths || doc.intakeDetails?.months || [],
      englishRequirements: doc.englishRequirements || (doc.ieltsRequirement ? `IELTS ${doc.ieltsRequirement}` : undefined),
      academicRequirements: doc.academicRequirements || doc.academicRequirement || doc.academicEntryRequirements,
      website: doc.website || doc.officialProgramUrl,
      university: providerId,
      universityName: providerName,
      universitySlug: providerSlug,
      city: doc.city,
      state: doc.state,
    };
  },

  /**
   * Adapts a raw or Mongoose University document into a CanonicalUniversityDTO.
   */
  adaptUniversity(raw: any): CanonicalUniversityDTO {
    if (!raw) return raw;
    const doc = typeof raw.toObject === 'function' ? raw.toObject() : raw;

    const id = doc._id ? String(doc._id) : (doc.id ? String(doc.id) : '');
    const officialWebsite = doc.officialWebsite || doc.website || '';
    const logoUrl = doc.logoUrl || doc.logo || '';
    const state = doc.state || '';
    const city = doc.city || doc.location?.split(',')[0]?.trim() || '';
    const providerType = doc.providerType || doc.institutionType || doc.type || 'university';
    const primaryRank = doc.primaryRank ?? doc.ranking ?? undefined;

    return {
      id,
      _id: id,
      name: doc.name || '',
      slug: doc.slug || '',
      shortName: doc.shortName,
      country: doc.country || 'Australia',
      state,
      city,
      officialWebsite,
      logoUrl,
      providerType,
      cricosProviderCode: doc.cricosProviderCode,
      teqsaProviderId: doc.teqsaProviderId,
      establishedYear: doc.establishedYear,
      description: doc.description || '',
      status: doc.status || 'active',
      postalAddress: doc.postalAddress,
      campusDetails: doc.campusDetails,
      programCount: doc.programCount || 0,
      offeringCount: doc.offeringCount,
      campusCount: doc.campusCount || (doc.campusDetails?.length || doc.campuses?.length || 0),
      primaryRank,
      averageEstimatedTotalCostAud: doc.averageEstimatedTotalCostAud,
      averageTuitionAud: doc.averageTuitionAud,
      sourceEvidence: doc.sourceEvidence,
      sourceMetadata: doc.sourceMetadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,

      // Legacy compatibility mappings
      location: doc.location || `${city}, ${state}`.replace(/^,\s*|,\s*$/g, ''),
      website: officialWebsite,
      logo: logoUrl,
      ranking: primaryRank,
      rankingBand: doc.rankingBand,
      type: (providerType === 'public' || providerType === 'private') ? providerType : 'public',
      campuses: doc.campuses || (doc.campusDetails?.map((c: any) => c.name) || []),
      internationalStudents: doc.internationalStudents ?? true,
    };
  },

  /**
   * Adapts multiple programs.
   */
  adaptPrograms(programs: any[]): CanonicalProgramDTO[] {
    return (programs || []).map(p => this.adaptProgram(p));
  },

  /**
   * Adapts multiple universities.
   */
  adaptUniversities(universities: any[]): CanonicalUniversityDTO[] {
    return (universities || []).map(u => this.adaptUniversity(u));
  },
};
