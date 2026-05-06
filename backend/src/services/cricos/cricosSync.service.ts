import mongoose from 'mongoose';
import { CRICOS_RESOURCES } from '../../config/cricosResources';
import { cricosCkanService } from './cricosCkan.service';
import { cricosMapperService } from './cricosMapper.service';
import { cricosDiffService } from './cricosDiff.service';
import { CricosSyncRun } from '../../models/CricosSyncRun.model';
import { CricosInstitutionRaw } from '../../models/CricosInstitutionRaw.model';
import { CricosCourseRaw } from '../../models/CricosCourseRaw.model';
import { CricosLocationRaw } from '../../models/CricosLocationRaw.model';
import { CricosCourseLocationRaw } from '../../models/CricosCourseLocationRaw.model';
import { University } from '../../models/University.model';
import { Program } from '../../models/Program.model';
import { Campus } from '../../models/Campus.model';
import { ProgramLocation } from '../../models/ProgramLocation.model';

// ─── Upsert helpers ────────────────────────────────────────────────────────

async function upsertRawInstitutions(
  records: any[],
  syncRunId: mongoose.Types.ObjectId
): Promise<number> {
  let count = 0;
  for (const row of records) {
    try {
      const data = cricosMapperService.mapInstitutionRaw(row);
      await CricosInstitutionRaw.findOneAndUpdate(
        { cricosProviderCode: data.cricosProviderCode },
        { $set: { ...data, syncRunId } },
        { upsert: true, new: true }
      );
      count++;
    } catch { /* skip bad rows */ }
  }
  return count;
}

async function upsertRawCourses(
  records: any[],
  syncRunId: mongoose.Types.ObjectId
): Promise<number> {
  let count = 0;
  for (const row of records) {
    try {
      const data = cricosMapperService.mapCourseRaw(row);
      if (!data.cricosProviderCode || !data.cricosCourseCode) continue;
      await CricosCourseRaw.findOneAndUpdate(
        { cricosProviderCode: data.cricosProviderCode, cricosCourseCode: data.cricosCourseCode },
        { $set: { ...data, syncRunId } },
        { upsert: true, new: true }
      );
      count++;
    } catch { /* skip bad rows */ }
  }
  return count;
}

async function upsertRawLocations(
  records: any[],
  syncRunId: mongoose.Types.ObjectId
): Promise<number> {
  let count = 0;
  for (const row of records) {
    try {
      const data = cricosMapperService.mapLocationRaw(row);
      if (!data.cricosProviderCode || !data.locationName || !data.city || !data.postcode) continue;
      await CricosLocationRaw.findOneAndUpdate(
        {
          cricosProviderCode: data.cricosProviderCode,
          locationName: data.locationName,
          addressLine1: data.addressLine1,
          city: data.city,
          postcode: data.postcode,
        },
        { $set: { ...data, syncRunId } },
        { upsert: true, new: true }
      );
      count++;
    } catch { /* skip bad rows */ }
  }
  return count;
}

async function upsertRawCourseLocations(
  records: any[],
  syncRunId: mongoose.Types.ObjectId
): Promise<number> {
  let count = 0;
  for (const row of records) {
    try {
      const data = cricosMapperService.mapCourseLocationRaw(row);
      if (!data.cricosProviderCode || !data.cricosCourseCode || !data.locationName) continue;
      await CricosCourseLocationRaw.findOneAndUpdate(
        {
          cricosProviderCode: data.cricosProviderCode,
          cricosCourseCode: data.cricosCourseCode,
          locationName: data.locationName,
        },
        { $set: { ...data, syncRunId } },
        { upsert: true, new: true }
      );
      count++;
    } catch { /* skip bad rows */ }
  }
  return count;
}

// ─── Staged change creators ────────────────────────────────────────────────

async function stageUniversity(
  providerCode: string,
  institutionRows: any[],
  syncRunId: mongoose.Types.ObjectId,
  fetchedAt: Date
): Promise<{ university: any | null; stagedCount: number }> {
  if (institutionRows.length === 0) return { university: null, stagedCount: 0 };

  const rawInstitution = cricosMapperService.mapInstitutionRaw(institutionRows[0]);
  const uniPayload = cricosMapperService.mapInstitutionToUniversity(rawInstitution, fetchedAt);

  const existing = await University.findOne({ cricosProviderCode: providerCode }).lean();

  const result = await cricosDiffService.createStagedChangeIfChanged({
    entityType: 'university',
    externalKey: providerCode,
    oldValue: existing ? (existing as any) : undefined,
    newValue: uniPayload as any,
    entityId: existing ? (existing as any)._id : undefined,
    syncRunId,
    sourceResourceId: CRICOS_RESOURCES.INSTITUTIONS.id,
    rawHash: rawInstitution.rawHash,
  });

  await University.findOneAndUpdate(
    { cricosProviderCode: providerCode },
    { $set: { lastCricosSyncedAt: fetchedAt, cricosSyncStatus: 'changes_pending' } },
    { upsert: false }
  );

  return { university: existing, stagedCount: result === 'created' ? 1 : 0 };
}

async function stagePrograms(
  providerCode: string,
  courseRows: any[],
  university: any,
  syncRunId: mongoose.Types.ObjectId,
  fetchedAt: Date
): Promise<{ staged: number; unchanged: number; errors: number }> {
  let staged = 0; let unchanged = 0; let errors = 0;

  for (const row of courseRows) {
    try {
      const rawCourse = cricosMapperService.mapCourseRaw(row);
      if (!rawCourse.cricosCourseCode) { errors++; continue; }

      const programPayload = cricosMapperService.mapCourseToProgram(rawCourse, university, fetchedAt);

      const existing = await Program.findOne({
        cricosProviderCode: providerCode,
        cricosCourseCode: rawCourse.cricosCourseCode,
      }).lean();

      const externalKey = `${providerCode}_${rawCourse.cricosCourseCode}`;
      const result = await cricosDiffService.createStagedChangeIfChanged({
        entityType: 'program',
        externalKey,
        oldValue: existing ? (existing as any) : undefined,
        newValue: programPayload as any,
        entityId: existing ? (existing as any)._id : undefined,
        syncRunId,
        universityId: university ? (university as any)._id : undefined,
        sourceResourceId: CRICOS_RESOURCES.COURSES.id,
        rawHash: rawCourse.rawHash,
      });

      if (result === 'created') staged++;
      else unchanged++;
    } catch { errors++; }
  }

  return { staged, unchanged, errors };
}

async function stageCampuses(
  providerCode: string,
  locationRows: any[],
  university: any,
  syncRunId: mongoose.Types.ObjectId,
  fetchedAt: Date
): Promise<{ staged: number; unchanged: number; errors: number }> {
  let staged = 0; let unchanged = 0; let errors = 0;

  for (const row of locationRows) {
    try {
      const rawLoc = cricosMapperService.mapLocationRaw(row);
      if (!rawLoc.locationName || !rawLoc.city || !rawLoc.postcode) { errors++; continue; }

      const campusPayload = cricosMapperService.mapLocationToCampus(rawLoc, university, fetchedAt);

      const existing = await Campus.findOne({
        cricosProviderCode: providerCode,
        name: rawLoc.locationName,
        city: rawLoc.city,
        postcode: rawLoc.postcode,
      }).lean();

      const externalKey = `${providerCode}_${rawLoc.locationName}_${rawLoc.city}`;
      const result = await cricosDiffService.createStagedChangeIfChanged({
        entityType: 'campus',
        externalKey,
        oldValue: existing ? (existing as any) : undefined,
        newValue: campusPayload as any,
        entityId: existing ? (existing as any)._id : undefined,
        syncRunId,
        universityId: university ? (university as any)._id : undefined,
        sourceResourceId: CRICOS_RESOURCES.LOCATIONS.id,
        rawHash: rawLoc.rawHash,
      });

      if (result === 'created') staged++;
      else unchanged++;
    } catch { errors++; }
  }

  return { staged, unchanged, errors };
}

async function stageProgramLocations(
  providerCode: string,
  courseLocationRows: any[],
  university: any,
  syncRunId: mongoose.Types.ObjectId,
  fetchedAt: Date
): Promise<{ staged: number; unchanged: number; errors: number }> {
  let staged = 0; let unchanged = 0; let errors = 0;

  for (const row of courseLocationRows) {
    try {
      const rawCL = cricosMapperService.mapCourseLocationRaw(row);
      if (!rawCL.cricosCourseCode || !rawCL.locationName) { errors++; continue; }

      const program = await Program.findOne({
        cricosProviderCode: providerCode,
        cricosCourseCode: rawCL.cricosCourseCode,
      }).lean();

      const campus = await Campus.findOne({
        cricosProviderCode: providerCode,
        name: rawCL.locationName,
      }).lean();

      const plPayload = cricosMapperService.mapCourseLocationToProgramLocation(
        rawCL, university, program, campus, fetchedAt
      );

      const existing = await ProgramLocation.findOne({
        cricosProviderCode: providerCode,
        cricosCourseCode: rawCL.cricosCourseCode,
        locationName: rawCL.locationName,
      }).lean();

      const externalKey = `${providerCode}_${rawCL.cricosCourseCode}_${rawCL.locationName}`;
      const result = await cricosDiffService.createStagedChangeIfChanged({
        entityType: 'programLocation',
        externalKey,
        oldValue: existing ? (existing as any) : undefined,
        newValue: plPayload as any,
        entityId: existing ? (existing as any)._id : undefined,
        syncRunId,
        universityId: university ? (university as any)._id : undefined,
        sourceResourceId: CRICOS_RESOURCES.COURSE_LOCATIONS.id,
        rawHash: rawCL.rawHash,
      });

      if (result === 'created') staged++;
      else unchanged++;
    } catch { errors++; }
  }

  return { staged, unchanged, errors };
}

// ─── Public service ────────────────────────────────────────────────────────

export const cricosSyncService = {

  async previewProviderSync(providerCode: string) {
    const code = cricosMapperService.normalizeProviderCode(providerCode);
    const [institutions, courses, locations, courseLocations] = await Promise.all([
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.INSTITUTIONS.id, code),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSES.id, code),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.LOCATIONS.id, code),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSE_LOCATIONS.id, code),
    ]);

    const activeCourses = courses.filter(
      (c: any) => (c['Expired'] || '').toLowerCase() !== 'yes'
    );
    const expiredCourses = courses.filter(
      (c: any) => (c['Expired'] || '').toLowerCase() === 'yes'
    );

    const warnings: string[] = [];
    if (institutions.length === 0) warnings.push(`No institution found for provider code ${code}`);
    if (courses.length === 0) warnings.push('No courses found');

    return {
      providerCode: code,
      institutionFound: institutions.length > 0,
      coursesCount: courses.length,
      activeCoursesCount: activeCourses.length,
      expiredCoursesCount: expiredCourses.length,
      locationsCount: locations.length,
      courseLocationsCount: courseLocations.length,
      sampleCourses: courses.slice(0, 3),
      sampleLocations: locations.slice(0, 3),
      sampleInstitution: institutions[0] ?? null,
      warnings,
    };
  },

  async syncProvider(providerCode: string, triggeredBy = 'admin'): Promise<string> {
    return this._runSync(providerCode, triggeredBy, false);
  },

  async recheckProvider(providerCode: string, triggeredBy = 'admin'): Promise<string> {
    return this._runSync(providerCode, triggeredBy, true);
  },

  async _runSync(providerCode: string, triggeredBy: string, isRecheck: boolean): Promise<string> {
    const code = cricosMapperService.normalizeProviderCode(providerCode);
    const fetchedAt = new Date();

    const syncRun = await CricosSyncRun.create({
      syncType: 'provider',
      providerCode: code,
      triggeredBy,
      status: 'running',
      startedAt: fetchedAt,
    });
    const syncRunId = syncRun._id as mongoose.Types.ObjectId;

    try {
      const [institutions, courses, locations, courseLocations] = await Promise.all([
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.INSTITUTIONS.id, code),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSES.id, code),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.LOCATIONS.id, code),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSE_LOCATIONS.id, code),
      ]);

      syncRun.stats.institutionsFetched = institutions.length;
      syncRun.stats.coursesFetched = courses.length;
      syncRun.stats.locationsFetched = locations.length;
      syncRun.stats.courseLocationsFetched = courseLocations.length;
      await syncRun.save();

      // Upsert raw records
      await upsertRawInstitutions(institutions, syncRunId);
      await upsertRawCourses(courses, syncRunId);
      await upsertRawLocations(locations, syncRunId);
      await upsertRawCourseLocations(courseLocations, syncRunId);

      // Create staged changes
      const { university, stagedCount: uniStaged } =
        await stageUniversity(code, institutions, syncRunId, fetchedAt);

      const uniForMapping = university ?? (institutions.length > 0
        ? await University.findOne({ cricosProviderCode: code }).lean()
        : null);

      const programStats = await stagePrograms(code, courses, uniForMapping, syncRunId, fetchedAt);
      const campusStats = await stageCampuses(code, locations, uniForMapping, syncRunId, fetchedAt);
      const plStats = await stageProgramLocations(code, courseLocations, uniForMapping, syncRunId, fetchedAt);

      const totalStaged = uniStaged + programStats.staged + campusStats.staged + plStats.staged;
      const totalUnchanged = programStats.unchanged + campusStats.unchanged + plStats.unchanged;
      const totalErrors = programStats.errors + campusStats.errors + plStats.errors;

      syncRun.stats.stagedChangesCreated = totalStaged;
      syncRun.stats.errorsCount = totalErrors;
      syncRun.status = 'completed';
      syncRun.finishedAt = new Date();
      syncRun.resourcesSynced = [
        CRICOS_RESOURCES.INSTITUTIONS.id,
        CRICOS_RESOURCES.COURSES.id,
        CRICOS_RESOURCES.LOCATIONS.id,
        CRICOS_RESOURCES.COURSE_LOCATIONS.id,
      ];
      await syncRun.save();

      await University.findOneAndUpdate(
        { cricosProviderCode: code },
        {
          $set: {
            lastCricosSyncedAt: fetchedAt,
            cricosSyncStatus: totalStaged > 0 ? 'changes_pending' : 'synced',
          },
        }
      );

      return syncRun._id!.toString();
    } catch (error: any) {
      syncRun.status = 'failed';
      syncRun.syncErrors = [error.message];
      syncRun.finishedAt = new Date();
      await syncRun.save();

      await University.findOneAndUpdate(
        { cricosProviderCode: code },
        { $set: { cricosSyncStatus: 'failed' } }
      );

      throw error;
    }
  },

  async syncInstitutionOnly(providerCode: string, triggeredBy = 'admin'): Promise<string> {
    const code = cricosMapperService.normalizeProviderCode(providerCode);
    const fetchedAt = new Date();
    const syncRun = await CricosSyncRun.create({
      syncType: 'resource',
      providerCode: code,
      triggeredBy,
      status: 'running',
      startedAt: fetchedAt,
    });

    try {
      const institutions = await cricosCkanService.queryByProviderCode(
        CRICOS_RESOURCES.INSTITUTIONS.id, code
      );
      syncRun.stats.institutionsFetched = institutions.length;
      await upsertRawInstitutions(institutions, syncRun._id as mongoose.Types.ObjectId);
      const { stagedCount } = await stageUniversity(
        code, institutions, syncRun._id as mongoose.Types.ObjectId, fetchedAt
      );
      syncRun.stats.stagedChangesCreated = stagedCount;
      syncRun.status = 'completed';
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id!.toString();
    } catch (error: any) {
      syncRun.status = 'failed';
      syncRun.syncErrors = [error.message];
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },

  async syncCoursesOnly(providerCode: string, triggeredBy = 'admin'): Promise<string> {
    const code = cricosMapperService.normalizeProviderCode(providerCode);
    const fetchedAt = new Date();
    const syncRun = await CricosSyncRun.create({
      syncType: 'resource',
      providerCode: code,
      triggeredBy,
      status: 'running',
      startedAt: fetchedAt,
    });

    try {
      const courses = await cricosCkanService.queryByProviderCode(
        CRICOS_RESOURCES.COURSES.id, code
      );
      syncRun.stats.coursesFetched = courses.length;
      await upsertRawCourses(courses, syncRun._id as mongoose.Types.ObjectId);
      const university = await University.findOne({ cricosProviderCode: code }).lean();
      const stats = await stagePrograms(
        code, courses, university, syncRun._id as mongoose.Types.ObjectId, fetchedAt
      );
      syncRun.stats.stagedChangesCreated = stats.staged;
      syncRun.stats.errorsCount = stats.errors;
      syncRun.status = 'completed';
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id!.toString();
    } catch (error: any) {
      syncRun.status = 'failed';
      syncRun.syncErrors = [error.message];
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },

  async syncLocationsOnly(providerCode: string, triggeredBy = 'admin'): Promise<string> {
    const code = cricosMapperService.normalizeProviderCode(providerCode);
    const fetchedAt = new Date();
    const syncRun = await CricosSyncRun.create({
      syncType: 'resource',
      providerCode: code,
      triggeredBy,
      status: 'running',
      startedAt: fetchedAt,
    });

    try {
      const [locations, courseLocations] = await Promise.all([
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.LOCATIONS.id, code),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSE_LOCATIONS.id, code),
      ]);
      syncRun.stats.locationsFetched = locations.length;
      syncRun.stats.courseLocationsFetched = courseLocations.length;

      await upsertRawLocations(locations, syncRun._id as mongoose.Types.ObjectId);
      await upsertRawCourseLocations(courseLocations, syncRun._id as mongoose.Types.ObjectId);

      const university = await University.findOne({ cricosProviderCode: code }).lean();
      const campusStats = await stageCampuses(
        code, locations, university, syncRun._id as mongoose.Types.ObjectId, fetchedAt
      );
      const plStats = await stageProgramLocations(
        code, courseLocations, university, syncRun._id as mongoose.Types.ObjectId, fetchedAt
      );

      syncRun.stats.stagedChangesCreated = campusStats.staged + plStats.staged;
      syncRun.stats.errorsCount = campusStats.errors + plStats.errors;
      syncRun.status = 'completed';
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id!.toString();
    } catch (error: any) {
      syncRun.status = 'failed';
      syncRun.syncErrors = [error.message];
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },

  async syncAllInstitutions(triggeredBy = 'admin'): Promise<string> {
    const fetchedAt = new Date();
    const syncRun = await CricosSyncRun.create({
      syncType: 'all',
      triggeredBy,
      status: 'running',
      startedAt: fetchedAt,
    });

    try {
      const institutions = await cricosCkanService.getAllRecords(CRICOS_RESOURCES.INSTITUTIONS.id);
      syncRun.stats.institutionsFetched = institutions.length;
      await syncRun.save();

      await upsertRawInstitutions(institutions, syncRun._id as mongoose.Types.ObjectId);

      let totalStaged = 0;
      let totalErrors = 0;

      for (const row of institutions) {
        try {
          const raw = cricosMapperService.mapInstitutionRaw(row);
          if (!raw.cricosProviderCode) continue;
          const uniPayload = cricosMapperService.mapInstitutionToUniversity(raw, fetchedAt);
          const existing = await University.findOne({ cricosProviderCode: raw.cricosProviderCode }).lean();

          const result = await cricosDiffService.createStagedChangeIfChanged({
            entityType: 'university',
            externalKey: raw.cricosProviderCode,
            oldValue: existing ? (existing as any) : undefined,
            newValue: uniPayload as any,
            entityId: existing ? (existing as any)._id : undefined,
            syncRunId: syncRun._id as mongoose.Types.ObjectId,
            sourceResourceId: CRICOS_RESOURCES.INSTITUTIONS.id,
            rawHash: raw.rawHash,
          });

          if (result === 'created') totalStaged++;
        } catch { totalErrors++; }
      }

      syncRun.stats.stagedChangesCreated = totalStaged;
      syncRun.stats.errorsCount = totalErrors;
      syncRun.status = 'completed';
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id!.toString();
    } catch (error: any) {
      syncRun.status = 'failed';
      syncRun.syncErrors = [error.message];
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },
};
