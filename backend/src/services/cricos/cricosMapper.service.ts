import slugify from 'slugify';
import crypto from 'crypto';
import { CRICOS_RESOURCES } from '../../config/cricosResources';

export const cricosMapperService = {
  // ─── Defensive field accessor ─────────────────────────────────────────────

  getField(row: any, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }
    return undefined;
  },

  // ─── Normalizers ─────────────────────────────────────────────────────────

  normalizeProviderCode(value: any): string {
    return String(value || '').trim().toUpperCase();
  },

  normalizeCourseCode(value: any): string {
    return String(value || '').trim().toUpperCase();
  },

  parseMoney(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const str = String(value).replace(/[$,\s]|AUD/gi, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  },

  parseNumber(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const str = String(value).replace(/,/g, '').trim();
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  },

  parseFloat_(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const str = String(value).replace(/,/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  },

  parseBooleanYesNo(value: any): boolean | null {
    if (value === undefined || value === null || value === '') return null;
    const s = String(value).trim().toLowerCase();
    if (s === 'yes' || s === 'y' || s === 'true') return true;
    if (s === 'no' || s === 'n' || s === 'false') return false;
    return null;
  },

  normalizeCourseLevel(value: any): string {
    if (!value) return 'other';
    const v = String(value).toLowerCase().trim();
    if (v.includes('bachelor')) return 'bachelor';
    if (v.includes('masters') || v.includes('master')) return 'master';
    if (v.includes('doctoral') || v.includes('phd')) return 'phd';
    if (v.includes('graduate certificate')) return 'graduate_certificate';
    if (v.includes('graduate diploma')) return 'diploma';
    if (v.includes('diploma')) return 'diploma';
    if (v.includes('senior secondary')) return 'secondary';
    if (v.includes('elicos') || v.includes('english language')) return 'elicos';
    if (v.includes('non aqf') || v.includes('non-aqf')) return 'non_award';
    if (v.includes('certificate')) return 'certificate';
    return 'other';
  },

  // ─── Hashing ─────────────────────────────────────────────────────────────

  hashRecord(record: any): string {
    const stable = JSON.stringify(record, Object.keys(record).sort());
    return crypto.createHash('sha256').update(stable).digest('hex').slice(0, 16);
  },

  // ─── Source metadata builder ──────────────────────────────────────────────

  buildSourceMetadata(resourceId: string, fetchedAt: Date) {
    return {
      sourceName: 'CRICOS data.gov.au CKAN DataStore API',
      sourceResourceId: resourceId,
      sourceUrl: 'https://data.gov.au/data/dataset/cricos',
      fetchedAt,
      confidence: 0.95,
      importMethod: 'cricos_api' as const,
    };
  },

  // ─── Raw model mappers (faithful to CRICOS source field names) ────────────

  mapInstitutionRaw(row: any) {
    const g = (names: string[]) => this.getField(row, names);
    return {
      cricosProviderCode: this.normalizeProviderCode(g(['CRICOS Provider Code'])),
      tradingName: g(['Trading Name']) ?? '',
      institutionName: g(['Institution Name']) ?? '',
      institutionType: g(['Institution Type']) ?? '',
      institutionCapacity: this.parseNumber(g(['Institution Capacity'])) ?? 0,
      website: g(['Website']),
      postalAddressLine1: g(['Postal Address Line 1']),
      postalAddressLine2: g(['Postal Address Line 2']),
      postalAddressLine3: g(['Postal Address Line 3']),
      postalAddressLine4: g(['Postal Address Line 4']),
      postalAddressCity: g(['Postal Address City']),
      postalAddressState: g(['Postal Address State']),
      postalAddressPostcode: g(['Postal Address Postcode']),
      raw: row,
      rawHash: this.hashRecord(row),
      sourceResourceId: CRICOS_RESOURCES.INSTITUTIONS.id,
      fetchedAt: new Date(),
    };
  },

  mapCourseRaw(row: any) {
    const g = (names: string[]) => this.getField(row, names);
    return {
      cricosProviderCode: this.normalizeProviderCode(g(['CRICOS Provider Code'])),
      institutionName: g(['Institution Name']) ?? '',
      cricosCourseCode: this.normalizeCourseCode(g(['CRICOS Course Code']) ?? ''),
      courseName: g(['Course Name']) ?? '',
      vetNationalCode: g(['VET National Code']),
      dualQualification: g(['Dual Qualification']),
      fieldOfEducation1BroadField: g(['Field of Education 1 Broad Field']),
      fieldOfEducation1NarrowField: g(['Field of Education 1 Narrow Field']),
      fieldOfEducation1DetailedField: g(['Field of Education 1 Detailed Field']),
      fieldOfEducation2BroadField: g(['Field of Education 2 Broad Field']),
      fieldOfEducation2NarrowField: g(['Field of Education 2 Narrow Field']),
      fieldOfEducation2DetailedField: g(['Field of Education 2 Detailed Field']),
      courseLevel: g(['Course Level']),
      foundationStudies: g(['Foundation Studies']),
      workComponent: g(['Work Component']),
      workComponentHoursPerWeek: this.parseFloat_(g(['Work Component Hours/Week'])),
      workComponentWeeks: this.parseNumber(g(['Work Component Weeks'])),
      workComponentTotalHours: this.parseNumber(g(['Work Component Total Hours'])),
      courseLanguage: g(['Course Language']),
      durationWeeks: this.parseNumber(g(['Duration (Weeks)'])),
      tuitionFee: this.parseMoney(g(['Tuition Fee'])),
      nonTuitionFee: this.parseMoney(g(['Non Tuition Fee'])),
      estimatedTotalCourseCost: this.parseMoney(g(['Estimated Total Course Cost'])),
      expired: this.parseBooleanYesNo(g(['Expired'])) ?? false,
      raw: row,
      rawHash: this.hashRecord(row),
      sourceResourceId: CRICOS_RESOURCES.COURSES.id,
      fetchedAt: new Date(),
    };
  },

  mapLocationRaw(row: any) {
    const g = (names: string[]) => this.getField(row, names);
    return {
      cricosProviderCode: this.normalizeProviderCode(g(['CRICOS Provider Code'])),
      institutionName: g(['Institution Name']) ?? '',
      locationName: g(['Location Name']) ?? '',
      locationType: g(['Location Type']),
      addressLine1: g(['Address Line 1']),
      addressLine2: g(['Address Line 2']),
      addressLine3: g(['Address Line 3']),
      addressLine4: g(['Address Line 4']),
      city: g(['City']) ?? '',
      state: g(['State']) ?? '',
      postcode: g(['Postcode']) ?? '',
      raw: row,
      rawHash: this.hashRecord(row),
      sourceResourceId: CRICOS_RESOURCES.LOCATIONS.id,
      fetchedAt: new Date(),
    };
  },

  mapCourseLocationRaw(row: any) {
    const g = (names: string[]) => this.getField(row, names);
    return {
      cricosProviderCode: this.normalizeProviderCode(g(['CRICOS Provider Code'])),
      institutionName: g(['Institution Name']) ?? '',
      cricosCourseCode: this.normalizeCourseCode(g(['CRICOS Course Code']) ?? ''),
      locationName: g(['Location Name']) ?? '',
      locationCity: g(['Location City']),
      locationState: g(['Location State']),
      raw: row,
      rawHash: this.hashRecord(row),
      sourceResourceId: CRICOS_RESOURCES.COURSE_LOCATIONS.id,
      fetchedAt: new Date(),
    };
  },

  // ─── Domain model mappers (for staged changes) ────────────────────────────

  mapInstitutionToUniversity(raw: any, fetchedAt: Date = new Date()) {
    const name = raw.institutionName || raw.tradingName || '';
    return {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      shortName: raw.tradingName || undefined,
      cricosProviderCode: raw.cricosProviderCode,
      institutionType: raw.institutionType || undefined,
      institutionCapacity: raw.institutionCapacity || undefined,
      officialWebsite: raw.website || undefined,
      postalAddress: {
        line1: raw.postalAddressLine1,
        line2: raw.postalAddressLine2,
        line3: raw.postalAddressLine3,
        line4: raw.postalAddressLine4,
        city: raw.postalAddressCity,
        state: raw.postalAddressState,
        postcode: raw.postalAddressPostcode,
      },
      city: raw.postalAddressCity || undefined,
      state: raw.postalAddressState || undefined,
      country: 'Australia',
      status: 'active' as const,
      cricosSyncStatus: 'synced' as const,
      lastCricosSyncedAt: fetchedAt,
      cricosDataHash: raw.rawHash,
      sourceMetadata: this.buildSourceMetadata(CRICOS_RESOURCES.INSTITUTIONS.id, fetchedAt),
    };
  },

  mapCourseToProgram(raw: any, university?: any, fetchedAt: Date = new Date()) {
    const uniId = typeof university === 'string' ? university : university?._id?.toString();
    const uniName = typeof university === 'object' ? university?.name : undefined;
    const uniSlug = typeof university === 'object' ? university?.slug : undefined;

    const name = raw.courseName || '';
    const codeSlug = raw.cricosCourseCode ? `-${raw.cricosCourseCode.toLowerCase()}` : '';

    return {
      name,
      slug: slugify(`${name}${codeSlug}`, { lower: true, strict: true }),
      university: uniId,
      universityName: uniName,
      universitySlug: uniSlug,
      cricosProviderCode: raw.cricosProviderCode,
      cricosCourseCode: raw.cricosCourseCode,
      institutionName: raw.institutionName,
      courseLevel: raw.courseLevel,
      level: this.normalizeCourseLevel(raw.courseLevel),
      field: raw.fieldOfEducation1BroadField || 'Other',
      fieldOfStudy: raw.fieldOfEducation1BroadField,
      fieldOfEducation1BroadField: raw.fieldOfEducation1BroadField,
      fieldOfEducation1NarrowField: raw.fieldOfEducation1NarrowField,
      fieldOfEducation1DetailedField: raw.fieldOfEducation1DetailedField,
      fieldOfEducation2BroadField: raw.fieldOfEducation2BroadField,
      fieldOfEducation2NarrowField: raw.fieldOfEducation2NarrowField,
      fieldOfEducation2DetailedField: raw.fieldOfEducation2DetailedField,
      vetNationalCode: raw.vetNationalCode,
      dualQualification: this.parseBooleanYesNo(raw.dualQualification) ?? false,
      foundationStudies: this.parseBooleanYesNo(raw.foundationStudies) ?? false,
      durationWeeks: raw.durationWeeks,
      duration: raw.durationWeeks ? `${raw.durationWeeks} weeks` : '',
      tuitionFeeAud: raw.tuitionFee,
      nonTuitionFeeAud: raw.nonTuitionFee,
      estimatedTotalCourseCostAud: raw.estimatedTotalCourseCost,
      workComponent: raw.workComponent,
      courseLanguage: raw.courseLanguage,
      expired: raw.expired ?? false,
      status: raw.expired ? 'archived' as const : 'active' as const,
      campusMode: 'on-campus' as const,
      lastCricosSyncedAt: fetchedAt,
      cricosDataHash: raw.rawHash,
      dataQuality: {
        sourceName: 'CRICOS',
        sourceResourceId: CRICOS_RESOURCES.COURSES.id,
        importMethod: 'cricos_api' as const,
        lastFetchedAt: fetchedAt,
        confidence: 0.95,
      },
    };
  },

  mapLocationToCampus(raw: any, university?: any, fetchedAt: Date = new Date()) {
    const uniId = typeof university === 'string' ? university : university?._id?.toString();

    const parts = [raw.addressLine1, raw.city, raw.state, raw.postcode].filter(Boolean);

    return {
      university: uniId,
      cricosProviderCode: raw.cricosProviderCode,
      institutionName: raw.institutionName,
      name: raw.locationName,
      locationType: raw.locationType,
      addressLine1: raw.addressLine1,
      addressLine2: raw.addressLine2,
      addressLine3: raw.addressLine3,
      addressLine4: raw.addressLine4,
      city: raw.city,
      state: raw.state,
      postcode: raw.postcode,
      fullAddress: parts.join(', '),
      status: 'active' as const,
      sourceMetadata: {
        ...this.buildSourceMetadata(CRICOS_RESOURCES.LOCATIONS.id, fetchedAt),
        importMethod: 'cricos_api' as const,
      },
    };
  },

  mapCourseLocationToProgramLocation(
    raw: any,
    university?: any,
    program?: any,
    campus?: any,
    fetchedAt: Date = new Date()
  ) {
    const uniId = typeof university === 'string' ? university : university?._id?.toString();
    const progId = typeof program === 'string' ? program : program?._id?.toString();
    const campId = typeof campus === 'string' ? campus : campus?._id?.toString();

    return {
      university: uniId,
      program: progId,
      campus: campId,
      cricosProviderCode: raw.cricosProviderCode,
      cricosCourseCode: raw.cricosCourseCode,
      locationName: raw.locationName,
      locationCity: raw.locationCity,
      locationState: raw.locationState,
      status: 'active' as const,
      sourceMetadata: {
        sourceName: 'CRICOS data.gov.au CKAN DataStore API',
        sourceResourceId: CRICOS_RESOURCES.COURSE_LOCATIONS.id,
        fetchedAt,
      },
    };
  },
};
