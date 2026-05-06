import mongoose from 'mongoose';
import { CRICOS_RESOURCES } from '../../config/cricosResources';
import { cricosCkanService } from './cricosCkan.service';
import { cricosMapperService } from './cricosMapper.service';
import { CricosSyncRun } from '../../models/CricosSyncRun.model';
import { CricosInstitutionRaw } from '../../models/CricosInstitutionRaw.model';
import { CricosCourseRaw } from '../../models/CricosCourseRaw.model';
import { CricosLocationRaw } from '../../models/CricosLocationRaw.model';
import { CricosCourseLocationRaw } from '../../models/CricosCourseLocationRaw.model';
import { University } from '../../models/University.model';
import { Program } from '../../models/Program.model';
import { Campus } from '../../models/Campus.model';
import { ProgramLocation } from '../../models/ProgramLocation.model';
import { StagedChange } from '../../models/StagedChange.model';

export const cricosSyncService = {
  /**
   * Sync a specific provider (University) and its related data
   */
  async syncProvider(providerCode: string, triggeredBy: string = "admin"): Promise<string> {
    const syncRun = await CricosSyncRun.create({
      syncType: "provider",
      providerCode,
      triggeredBy,
      status: "running",
    });

    try {
      // 1. Fetch Raw Records
      const [institutions, courses, locations, courseLocations] = await Promise.all([
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.INSTITUTIONS.id, providerCode),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSES.id, providerCode),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.LOCATIONS.id, providerCode),
        cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSE_LOCATIONS.id, providerCode),
      ]);

      syncRun.stats.institutionsFetched = institutions.length;
      syncRun.stats.coursesFetched = courses.length;
      syncRun.stats.locationsFetched = locations.length;
      syncRun.stats.courseLocationsFetched = courseLocations.length;
      await syncRun.save();

      // 2. Upsert Raw Records
      await this.upsertRawInstitutions(institutions, syncRun._id as mongoose.Types.ObjectId);
      await this.upsertRawCourses(courses, syncRun._id as mongoose.Types.ObjectId);
      await this.upsertRawLocations(locations, syncRun._id as mongoose.Types.ObjectId);
      await this.upsertRawCourseLocations(courseLocations, syncRun._id as mongoose.Types.ObjectId);

      // 3. Map to Outvier Models & Create Staged Changes
      if (institutions.length > 0) {
        const uniData = cricosMapperService.mapInstitutionToUniversity(institutions[0]);
        let university = await University.findOne({ cricosProviderCode: providerCode });
        
        await this.createStagedChangeIfChanged(
          'university',
          providerCode,
          university?.toObject(),
          uniData,
          university?._id as mongoose.Types.ObjectId,
          syncRun._id as mongoose.Types.ObjectId
        );

        if (university) syncRun.stats.universitiesMatched = 1;

        // Sync Programs
        for (const courseRow of courses) {
          const programData = cricosMapperService.mapCourseToProgram(courseRow, university || uniData);
          const externalKey = `${providerCode}_${programData.cricosCourseCode}`;
          const existingProgram = await Program.findOne({ 
            cricosCourseCode: programData.cricosCourseCode, 
            cricosProviderCode: providerCode 
          });

          await this.createStagedChangeIfChanged(
            'program',
            externalKey,
            existingProgram?.toObject(),
            programData,
            existingProgram?._id as mongoose.Types.ObjectId,
            syncRun._id as mongoose.Types.ObjectId,
            university?._id as mongoose.Types.ObjectId
          );
          if (existingProgram) syncRun.stats.programsMatched++;
        }

        // Sync Campuses
        for (const locRow of locations) {
          const campusData = cricosMapperService.mapLocationToCampus(locRow, university?._id?.toString() || university || uniData);
          const externalKey = `${providerCode}_${campusData.name}_${campusData.city}`;
          const existingCampus = await Campus.findOne({
            cricosProviderCode: providerCode,
            name: campusData.name,
            city: campusData.city,
            postcode: campusData.postcode
          });

          await this.createStagedChangeIfChanged(
            'campus',
            externalKey,
            existingCampus?.toObject(),
            campusData,
            existingCampus?._id as mongoose.Types.ObjectId,
            syncRun._id as mongoose.Types.ObjectId,
            university?._id as mongoose.Types.ObjectId
          );
        }
      }

      syncRun.status = "completed";
      syncRun.finishedAt = new Date();
      await syncRun.save();

      return syncRun._id as string;
    } catch (error: any) {
      syncRun.status = "failed";
      syncRun.errors.push(error.message);
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },

  /**
   * Sync all Australian institutions from CRICOS
   */
  async syncAllInstitutions(triggeredBy: string = "admin"): Promise<string> {
    const syncRun = await CricosSyncRun.create({
      syncType: "all",
      triggeredBy,
      status: "running",
    });

    try {
      const institutions = await cricosCkanService.getAllRecords(CRICOS_RESOURCES.INSTITUTIONS.id);
      syncRun.stats.institutionsFetched = institutions.length;
      await syncRun.save();

      await this.upsertRawInstitutions(institutions, syncRun._id as mongoose.Types.ObjectId);

      for (const row of institutions) {
        try {
          const uniData = cricosMapperService.mapInstitutionToUniversity(row);
          const university = await University.findOne({ cricosProviderCode: uniData.cricosProviderCode });
          
          await this.createStagedChangeIfChanged(
            'university',
            uniData.cricosProviderCode,
            university?.toObject(),
            uniData,
            university?._id as mongoose.Types.ObjectId,
            syncRun._id as mongoose.Types.ObjectId
          );
          if (university) syncRun.stats.universitiesMatched++;
        } catch (err) {
          syncRun.stats.errorsCount++;
          console.error(`[CRICOS] Error mapping institution ${row["Institution Name"]}:`, err);
        }
      }

      syncRun.status = "completed";
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id as string;
    } catch (error: any) {
      syncRun.status = "failed";
      syncRun.errors.push(error.message);
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },

  /**
   * Sync all courses (CAUTION: Large dataset)
   */
  async syncAllCourses(triggeredBy: string = "admin"): Promise<string> {
    const syncRun = await CricosSyncRun.create({
      syncType: "resource",
      triggeredBy,
      status: "running",
    });

    try {
      const courses = await cricosCkanService.getAllRecords(CRICOS_RESOURCES.COURSES.id);
      syncRun.stats.coursesFetched = courses.length;
      await syncRun.save();

      await this.upsertRawCourses(courses, syncRun._id as mongoose.Types.ObjectId);

      syncRun.status = "completed";
      syncRun.finishedAt = new Date();
      await syncRun.save();
      return syncRun._id as string;
    } catch (error: any) {
      syncRun.status = "failed";
      syncRun.errors.push(error.message);
      syncRun.finishedAt = new Date();
      await syncRun.save();
      throw error;
    }
  },


  async previewProviderSync(providerCode: string) {
    const [institutions, courses, locations, courseLocations] = await Promise.all([
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.INSTITUTIONS.id, providerCode),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSES.id, providerCode),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.LOCATIONS.id, providerCode),
      cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSE_LOCATIONS.id, providerCode),
    ]);

    return {
      providerCode,
      counts: {
        institutions: institutions.length,
        courses: courses.length,
        locations: locations.length,
        courseLocations: courseLocations.length,
      },
      samples: {
        institution: institutions[0],
        course: courses[0],
        location: locations[0],
      },
    };
  },

  /**
   * Helper: Create staged change if data differs
   */
  async createStagedChangeIfChanged(
    entityType: string,
    externalKey: string,
    oldValue: any,
    newValue: any,
    entityId?: mongoose.Types.ObjectId,
    syncRunId?: mongoose.Types.ObjectId,
    universityId?: mongoose.Types.ObjectId
  ) {
    // Basic change detection (can be more sophisticated)
    const hasChanged = !oldValue || JSON.stringify(this.stripMetadata(oldValue)) !== JSON.stringify(this.stripMetadata(newValue));
    
    if (!hasChanged) return;

    // Avoid duplicate pending changes
    const pending = await StagedChange.findOne({
      entityType,
      status: 'pending',
      $or: [
        { entityId: entityId },
        { 'newValue.cricosProviderCode': newValue.cricosProviderCode, 'newValue.cricosCourseCode': newValue.cricosCourseCode }
      ]
    });

    if (pending) return;

    await StagedChange.create({
      entityType,
      entityId,
      universityId,
      changeType: oldValue ? 'update' : 'create',
      oldValue,
      newValue,
      confidence: 0.95,
      sourceUrl: `https://cricos.education.gov.au/`, // Placeholder/Generic
      status: 'pending',
      // @ts-ignore
      syncRunId,
      externalKey,
    });
  },

  stripMetadata(obj: any) {
    const { _id, __v, createdAt, updatedAt, sourceMetadata, dataQuality, ...rest } = obj;
    return rest;
  },

  async upsertRawInstitutions(records: any[], syncRunId: mongoose.Types.ObjectId) {
    for (const row of records) {
      const data = cricosMapperService.mapInstitutionToUniversity(row);
      await CricosInstitutionRaw.findOneAndUpdate(
        { cricosProviderCode: data.cricosProviderCode },
        { 
          ...data, 
          raw: row, 
          syncRunId, 
          fetchedAt: new Date(),
          sourceResourceId: CRICOS_RESOURCES.INSTITUTIONS.id 
        },
        { upsert: true }
      );
    }
  },

  async upsertRawCourses(records: any[], syncRunId: mongoose.Types.ObjectId) {
    for (const row of records) {
      const data = cricosMapperService.mapCourseToProgram(row);
      await CricosCourseRaw.findOneAndUpdate(
        { cricosCourseCode: data.cricosCourseCode, cricosProviderCode: data.cricosProviderCode },
        { 
          ...data, 
          raw: row, 
          syncRunId, 
          fetchedAt: new Date(),
          sourceResourceId: CRICOS_RESOURCES.COURSES.id 
        },
        { upsert: true }
      );
    }
  },

  async upsertRawLocations(records: any[], syncRunId: mongoose.Types.ObjectId) {
    for (const row of records) {
      const data = cricosMapperService.mapLocationToCampus(row);
      await CricosLocationRaw.findOneAndUpdate(
        { 
          cricosProviderCode: data.cricosProviderCode, 
          locationName: data.name, 
          addressLine1: data.addressLine1,
          city: data.city,
          postcode: data.postcode
        },
        { 
          ...data, 
          locationName: data.name,
          raw: row, 
          syncRunId, 
          fetchedAt: new Date(),
          sourceResourceId: CRICOS_RESOURCES.LOCATIONS.id 
        },
        { upsert: true }
      );
    }
  },

  async upsertRawCourseLocations(records: any[], syncRunId: mongoose.Types.ObjectId) {
    for (const row of records) {
      const pCode = cricosMapperService.getField(row, ["CRICOS Provider Code", "Provider Code"]);
      const cCode = cricosMapperService.getField(row, ["CRICOS Course Code", "Course Code"]);
      const lName = cricosMapperService.getField(row, ["Location Name", "Name"]);
      
      if (pCode && cCode && lName) {
        await CricosCourseLocationRaw.findOneAndUpdate(
          { cricosProviderCode: pCode, cricosCourseCode: cCode, locationName: lName },
          { 
            raw: row, 
            syncRunId, 
            fetchedAt: new Date(),
            sourceResourceId: CRICOS_RESOURCES.COURSE_LOCATIONS.id 
          },
          { upsert: true }
        );
      }
    }
  },
};
