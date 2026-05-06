import slugify from 'slugify';

export const cricosMapperService = {
  /**
   * Defensive helper to get field value from row with multiple possible column names
   */
  getField(row: any, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null) {
        return String(row[name]).trim();
      }
    }
    return undefined;
  },

  normalizeProviderCode(code: string): string {
    return code.trim().toUpperCase();
  },

  normalizeCourseCode(code: string): string {
    return code.trim().toUpperCase();
  },

  normalizeMoney(value: any): number | null {
    if (value === undefined || value === null) return null;
    const str = String(value).replace(/[$,\s]|AUD/gi, '');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  },

  normalizeDuration(value: any): { weeks: number | null; text: string } {
    if (value === undefined || value === null) return { weeks: null, text: '' };
    const str = String(value).trim();
    const weeks = parseInt(str.replace(/\D/g, ''));
    return {
      weeks: isNaN(weeks) ? null : weeks,
      text: str.toLowerCase().includes('week') ? str : `${str} weeks`,
    };
  },

  normalizeLevel(cricosLevel: string): string {
    const level = cricosLevel.toLowerCase();
    if (level.includes('bachelor')) return 'bachelor';
    if (level.includes('master')) return 'master';
    if (level.includes('doctoral') || level.includes('phd')) return 'phd';
    if (level.includes('graduate certificate')) return 'graduate_certificate';
    if (level.includes('diploma')) return 'diploma';
    if (level.includes('certificate')) return 'certificate';
    return 'other';
  },

  mapInstitutionToUniversity(row: any) {
    const providerCode = this.getField(row, ["CRICOS Provider Code", "Provider Code", "CRICOSProviderCode"]);
    const name = this.getField(row, ["Institution Name", "Name", "Trading Name"]);

    if (!providerCode || !name) {
      throw new Error("Missing mandatory Institution fields (Provider Code or Name)");
    }

    return {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      cricosProviderCode: this.normalizeProviderCode(providerCode),
      shortName: this.getField(row, ["Trading Name", "Short Name"]),
      institutionType: this.getField(row, ["Institution Type"]),
      institutionCapacity: parseInt(this.getField(row, ["Institution Capacity"]) || "0"),
      officialWebsite: this.getField(row, ["Website"]),
      city: this.getField(row, ["Postal Address City", "City"]),
      state: this.getField(row, ["Postal Address State", "State"]),
      country: "Australia",
      status: 'active',
      sourceMetadata: {
        sourceName: "CRICOS",
        createdVia: 'cricos_api',
        importMethod: 'cricos_api',
        fetchedAt: new Date(),
        confidence: 0.95,
      },
    };
  },

  mapCourseToProgram(row: any, university?: any) {
    const universityId = typeof university === 'string' ? university : university?._id?.toString();
    const universityName = university?.name;
    const universitySlug = university?.slug;
    const courseCode = this.getField(row, ["CRICOS Course Code", "Course Code", "CRICOSCourseCode"]);
    const courseName = this.getField(row, ["Course Name", "Name"]);
    const providerCode = this.getField(row, ["CRICOS Provider Code", "Provider Code"]);

    if (!courseCode || !courseName || !providerCode) {
      throw new Error("Missing mandatory Course fields (Course Code, Course Name, or Provider Code)");
    }

    const duration = this.normalizeDuration(this.getField(row, ["Duration (Weeks)", "DurationWeeks", "Duration"]));

    return {
      name: courseName,
      slug: slugify(`${courseName} ${courseCode}`, { lower: true, strict: true }),
      cricosCourseCode: this.normalizeCourseCode(courseCode),
      cricosProviderCode: this.normalizeProviderCode(providerCode),
      university: universityId,
      universityName: universityName,
      universitySlug: universitySlug,
      level: this.normalizeLevel(this.getField(row, ["Course Level", "Level"]) || ""),
      fieldOfEducationBroad: this.getField(row, ["Broad Field of Education", "FieldOfEducationBroad"]),
      fieldOfEducationNarrow: this.getField(row, ["Narrow Field of Education", "FieldOfEducationNarrow"]),
      field: this.getField(row, ["Broad Field of Education"]) || "Other",
      durationWeeks: duration.weeks,
      duration: duration.text,
      tuitionFeeAud: this.normalizeMoney(this.getField(row, ["Tuition Fee", "TuitionFee"])),
      nonTuitionFeeAud: this.normalizeMoney(this.getField(row, ["Non-Tuition Fee", "NonTuitionFee"])),
      estimatedTotalCourseCostAud: this.normalizeMoney(this.getField(row, ["Estimated Total Course Cost", "TotalCost"])),
      workComponent: this.getField(row, ["Work Component", "WorkComponent"]),
      courseLanguage: this.getField(row, ["Course Language", "Language"]) || "English",
      status: 'active',
      dataQuality: {
        sourceName: "CRICOS",
        importMethod: 'cricos_api',
        lastFetchedAt: new Date(),
        confidence: 0.95,
      },
    };
  },

  mapLocationToCampus(row: any, university?: any) {
    const universityId = typeof university === 'string' ? university : university?._id?.toString();
    const universityName = university?.name;
    const universitySlug = university?.slug;
    const locationName = this.getField(row, ["Location Name", "Name"]);
    const providerCode = this.getField(row, ["CRICOS Provider Code", "Provider Code"]);
    const city = this.getField(row, ["City", "Town/City"]);
    const state = this.getField(row, ["State"]);
    const postcode = this.getField(row, ["Postcode"]);

    if (!locationName || !providerCode || !city || !state || !postcode) {
      throw new Error("Missing mandatory Location fields");
    }

    return {
      university: universityId,
      cricosProviderCode: this.normalizeProviderCode(providerCode),
      name: locationName,
      locationType: this.getField(row, ["Location Type"]),
      addressLine1: this.getField(row, ["Address Line 1", "Address"]),
      addressLine2: this.getField(row, ["Address Line 2"]),
      addressLine3: this.getField(row, ["Address Line 3"]),
      addressLine4: this.getField(row, ["Address Line 4"]),
      city,
      state,
      postcode,
      status: 'active',
      sourceMetadata: {
        sourceName: "CRICOS",
        fetchedAt: new Date(),
        confidence: 0.95,
      },
    };
  },
};
