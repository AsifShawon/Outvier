import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Application, IApplication, ApplicationStage } from '../models/Application.model';
import { ApplicationVersion } from '../models/ApplicationVersion.model';
import { StatusEvent, StatusSource } from '../models/StatusEvent.model';
import { DocumentRecord } from '../models/Document.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';
import { TrackerBoard } from '../models/TrackerBoard.model';
import { applicationWorkflowService } from '../services/applicationWorkflow.service';
import { sendSuccess, sendError, escapeRegex } from '../utils/response.util';

const generateId = (prefix = 'item') => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

// Stage to Tracker Column Title Mapping
const STAGE_TO_COLUMN_MAP: Record<ApplicationStage, string> = {
  draft: 'Researching',
  ready_for_review: 'Preparing',
  changes_requested: 'Preparing',
  staff_verified: 'Preparing',
  external_submission_required: 'Preparing',
  submitted_externally: 'Applied',
  provider_confirmed: 'Offer',
  offer: 'Offer',
  rejected: 'Archived',
  withdrawn: 'Archived',
};

export const applicationController = {
  /**
   * List applications with filters, sorting, and pagination.
   */
  async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const {
        stage,
        statusSource,
        priority,
        search,
        archived = 'false',
        page = '1',
        limit = '50',
        sortField = 'updatedAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const query: any = {
        userId: user.role === 'admin' && req.query.allUsers === 'true' ? { $exists: true } : user.id,
      };

      if (archived !== 'all') {
        query.archived = archived === 'true';
      }
      if (stage && stage !== 'all') {
        query.stage = stage;
      }
      if (statusSource && statusSource !== 'all') {
        query.statusSource = statusSource;
      }
      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      if (search) {
        const safeRegex = escapeRegex(search);
        query.$or = [
          { title: { $regex: safeRegex, $options: 'i' } },
          { subtitle: { $regex: safeRegex, $options: 'i' } },
          { 'programChoice.customProgramName': { $regex: safeRegex, $options: 'i' } },
          { 'programChoice.customUniversityName': { $regex: safeRegex, $options: 'i' } },
          { notes: { $regex: safeRegex, $options: 'i' } },
        ];
      }

      const sort: Record<string, 1 | -1> = {};
      sort[sortField] = sortOrder === 'asc' ? 1 : -1;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [applications, total] = await Promise.all([
        Application.find(query)
          .populate('programChoice.programId', 'name level fieldOfStudy university universityName universitySlug logoUrl')
          .populate('programChoice.universityId', 'name slug logo country state city')
          .populate('assignedReviewerId', 'name email username role')
          .populate('documents', 'title originalFilename mimeType fileSizeBytes scanStatus verificationStatus documentType')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Application.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      sendSuccess(res, applications, {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Master-Detail workspace view for a single application.
   */
  async getApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const application = await Application.findOne(query)
        .populate('programChoice.programId')
        .populate('programChoice.universityId')
        .populate('assignedReviewerId', 'name email username role')
        .populate('documents')
        .populate({
          path: 'statusEvents',
          options: { sort: { createdAt: -1 } },
          populate: { path: 'changedBy', select: 'name username role email' },
        })
        .populate('communications.senderId', 'name username role');

      if (!application) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      // Recompute readiness dynamically
      const readiness = applicationWorkflowService.calculateReadiness(application);

      sendSuccess(res, {
        application,
        readiness,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Creates a new application workspace record.
   */
  async createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const data = req.body;

      // Resolve Program / University metadata if IDs provided
      let customProgramName = data.customProgramName;
      let customUniversityName = data.customUniversityName;
      let fieldOfStudy = data.fieldOfStudy;
      let studyLevel = data.studyLevel;
      let estimatedTuitionAud = undefined;

      if (data.programId) {
        const prog = await Program.findById(data.programId).populate('university');
        if (prog) {
          customProgramName = prog.name;
          fieldOfStudy = prog.fieldOfStudy || fieldOfStudy;
          studyLevel = prog.level || studyLevel;
          estimatedTuitionAud = (prog as any).primaryFeeAnnualAud;
          if (!data.universityId && prog.university) {
            data.universityId = prog.university.toString();
          }
        }
      }

      if (data.universityId) {
        const uni = await University.findById(data.universityId);
        if (uni) {
          customUniversityName = uni.name;
        }
      }

      // Find or create user board
      let board = await TrackerBoard.findOne({ userId: user.id });
      if (!board) {
        board = await TrackerBoard.create({
          userId: user.id,
          name: 'My Application Tracker',
          columns: [
            { id: generateId('col'), title: 'Researching', description: 'Exploring', color: '#64748b', order: 0, isArchived: false },
            { id: generateId('col'), title: 'Shortlisted', description: 'Comparing', color: '#3b82f6', order: 1, isArchived: false },
            { id: generateId('col'), title: 'Preparing', description: 'Gathering docs', color: '#f59e0b', order: 2, isArchived: false },
            { id: generateId('col'), title: 'Applied', description: 'Submitted', color: '#8b5cf6', order: 3, isArchived: false },
            { id: generateId('col'), title: 'Offer', description: 'Offer received', color: '#10b981', order: 4, isArchived: false },
            { id: generateId('col'), title: 'Onboarding', description: 'Visa & enrollment', color: '#06b6d4', order: 5, isArchived: false },
            { id: generateId('col'), title: 'Archived', description: 'Archived', color: '#94a3b8', order: 6, isArchived: false },
          ],
        });
      }

      const firstCol = board.columns[0]?.id || generateId('col');

      // Populate default tasks for study application
      const defaultTasks = [
        { id: generateId('task'), title: 'Gather certified academic transcripts', category: 'document' as const, priority: 'high' as const, completed: false, assignedToRole: 'student' as const, order: 0, createdAt: new Date() },
        { id: generateId('task'), title: 'Provide valid passport details & copy', category: 'document' as const, priority: 'high' as const, completed: false, assignedToRole: 'student' as const, order: 1, createdAt: new Date() },
        { id: generateId('task'), title: 'Take English test or submit valid scorecard', category: 'form' as const, priority: 'high' as const, completed: false, assignedToRole: 'student' as const, order: 2, createdAt: new Date() },
        { id: generateId('task'), title: 'Draft Statement of Purpose (SOP)', category: 'form' as const, priority: 'medium' as const, completed: false, assignedToRole: 'student' as const, order: 3, createdAt: new Date() },
        { id: generateId('task'), title: 'Request academic or employer recommendation letter', category: 'document' as const, priority: 'medium' as const, completed: false, assignedToRole: 'student' as const, order: 4, createdAt: new Date() },
      ];

      const initialIdentity = data.identity || {
        firstName: user.name?.split(' ')[0] || user.username || 'Applicant',
        lastName: user.name?.split(' ').slice(1).join(' ') || 'Student',
        email: user.email,
      };

      const application = new Application({
        userId: user.id,
        boardId: board._id,
        columnId: firstCol,
        title: data.title || customProgramName || 'New University Application',
        subtitle: data.subtitle || customUniversityName || '',
        priority: data.priority || 'medium',
        stage: 'draft',
        statusSource: 'student-reported',
        deadline: data.deadline,
        notes: data.notes,
        tags: data.tags || [],
        programChoice: {
          programId: data.programId,
          universityId: data.universityId,
          customProgramName,
          customUniversityName,
          campusName: data.campusName,
          studyLevel,
          fieldOfStudy,
          intakeTerm: data.intakeTerm,
          intakeYear: data.intakeYear || new Date().getFullYear() + 1,
          estimatedTuitionAud,
        },
        identity: initialIdentity,
        academicRecords: data.academicRecords || [],
        englishTestRecords: data.englishTestRecords || [],
        employmentRecords: data.employmentRecords || [],
        references: data.references || [],
        consents: data.consents || [],
        statementOfPurpose: data.statementOfPurpose,
        tasks: defaultTasks,
        communications: [],
        statusEvents: [],
      });

      // Calculate initial readiness
      const readiness = applicationWorkflowService.calculateReadiness(application);
      application.readinessPercentage = readiness.score;

      await application.save();

      // Record initial creation status event
      await applicationWorkflowService.recordStatusEvent({
        applicationId: application._id as any,
        fromStage: 'none',
        toStage: 'draft',
        fromStatusSource: undefined,
        toStatusSource: 'student-reported',
        changedBy: new Types.ObjectId(user.id),
        changedByRole: user.role,
        actorName: user.name || user.username,
        reason: 'Application created in workspace',
      });

      sendSuccess(res, application, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Updates application wizard sections / metadata and recalculates readiness score.
   */
  async updateApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const updateData = req.body;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const application = await Application.findOne(query);
      if (!application) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      // Check if locked
      if (application.isLocked && user.role !== 'admin' && !updateData.forceUnlock) {
        sendError(res, 400, 'APPLICATION_LOCKED', 'This application version has been submitted and is locked. Create a new draft or request staff unlock to modify.');
        return;
      }

      if (updateData.title !== undefined) application.title = updateData.title;
      if (updateData.subtitle !== undefined) application.subtitle = updateData.subtitle;
      if (updateData.priority !== undefined) application.priority = updateData.priority;
      if (updateData.deadline !== undefined) application.deadline = updateData.deadline ?? undefined;
      if (updateData.notes !== undefined) application.notes = updateData.notes;
      if (updateData.officialApplicationUrl !== undefined) application.officialApplicationUrl = updateData.officialApplicationUrl ?? undefined;
      if (updateData.portalApplicationNumber !== undefined) application.portalApplicationNumber = updateData.portalApplicationNumber;
      if (updateData.statementOfPurpose !== undefined) application.statementOfPurpose = updateData.statementOfPurpose;
      if (updateData.tags !== undefined) application.tags = updateData.tags;
      if (typeof updateData.archived === 'boolean') application.archived = updateData.archived;

      if (updateData.programChoice) {
        application.programChoice = {
          ...application.programChoice,
          ...updateData.programChoice,
        };
      }

      if (updateData.identity) {
        application.identity = {
          ...application.identity,
          ...updateData.identity,
        };
      }

      if (updateData.academicRecords) {
        application.academicRecords = updateData.academicRecords.map((a: any) => ({
          ...a,
          id: a.id || generateId('acad'),
        }));
      }

      if (updateData.englishTestRecords) {
        application.englishTestRecords = updateData.englishTestRecords.map((e: any) => ({
          ...e,
          id: e.id || generateId('eng'),
        }));
      }

      if (updateData.employmentRecords) {
        application.employmentRecords = updateData.employmentRecords.map((emp: any) => ({
          ...emp,
          id: emp.id || generateId('emp'),
        }));
      }

      if (updateData.references) {
        application.references = updateData.references.map((r: any) => ({
          ...r,
          id: r.id || generateId('ref'),
        }));
      }

      if (updateData.consents) {
        application.consents = updateData.consents.map((c: any) => ({
          ...c,
          agreedAt: c.agreedAt || new Date(),
        }));
      }

      // Re-calculate readiness
      const readiness = applicationWorkflowService.calculateReadiness(application);
      application.readinessPercentage = readiness.score;

      await application.save();

      sendSuccess(res, {
        application,
        readiness,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validated Stage & Status Source Transitions.
   */
  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { stage: targetStage, statusSource: targetStatusSource = 'student-reported', reason, notes, partnerApplicationRef, partnerName } = req.body;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const application = await Application.findOne(query);
      if (!application) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      const currentStage = application.stage;
      const currentStatusSource = application.statusSource;

      // Validate transition permissions and state path
      const validation = applicationWorkflowService.validateTransition(
        currentStage,
        targetStage,
        targetStatusSource,
        user
      );

      if (!validation.valid) {
        sendError(res, 400, 'INVALID_TRANSITION', validation.error || 'Invalid transition');
        return;
      }

      // Sync with Board Column if present
      const targetColumnTitle = STAGE_TO_COLUMN_MAP[targetStage as ApplicationStage];
      if (application.boardId && targetColumnTitle) {
        const board = await TrackerBoard.findById(application.boardId);
        if (board) {
          const matchingCol = board.columns.find((c) => c.title.toLowerCase() === targetColumnTitle.toLowerCase());
          if (matchingCol) {
            application.columnId = matchingCol.id;
          }
        }
      }

      // Update application stage and source
      application.stage = targetStage;
      application.statusSource = targetStatusSource;

      // Record auditable status event
      const event = await applicationWorkflowService.recordStatusEvent({
        applicationId: application._id as any,
        fromStage: currentStage,
        toStage: targetStage,
        fromStatusSource: currentStatusSource,
        toStatusSource: targetStatusSource,
        changedBy: new Types.ObjectId(user.id),
        changedByRole: user.role,
        actorName: user.name || user.username,
        reason: reason || `Transitioned from ${currentStage} to ${targetStage}`,
        notes,
      });

      // If entering submitted state, generate immutable version snapshot
      let versionSnapshot = null;
      if (targetStage === 'submitted_externally' || targetStage === 'provider_confirmed') {
        const isVerifiedIntegration = targetStatusSource === 'integration-confirmed';
        versionSnapshot = await applicationWorkflowService.createImmutableSnapshot({
          application,
          submittedBy: new Types.ObjectId(user.id),
          method: isVerifiedIntegration ? 'partner-integration' : (user.role === 'admin' ? 'staff-assisted' : 'student-manual'),
          partnerName,
          partnerApplicationRef,
          isVerifiedIntegration,
        });
      }

      await application.save();

      sendSuccess(res, {
        application,
        statusEvent: event,
        versionSnapshot,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually creates an immutable version snapshot.
   */
  async createSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { method, partnerName, partnerApplicationRef, isVerifiedIntegration } = req.body;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const application = await Application.findOne(query);
      if (!application) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      // Only admin or integration can claim verified integration
      const verified = user.role === 'admin' ? !!isVerifiedIntegration : false;

      const snapshot = await applicationWorkflowService.createImmutableSnapshot({
        application,
        submittedBy: new Types.ObjectId(user.id),
        method: method || 'student-manual',
        partnerName,
        partnerApplicationRef,
        isVerifiedIntegration: verified,
      });

      sendSuccess(res, snapshot, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets version history for an application.
   */
  async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const app = await Application.findOne(query);
      if (!app) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      const versions = await ApplicationVersion.find({ applicationId: id })
        .populate('submittedBy', 'name username email role')
        .sort({ versionNumber: -1 });

      sendSuccess(res, versions);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Updates task timeline.
   */
  async updateTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { tasks } = req.body;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const app = await Application.findOne(query);
      if (!app) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      app.tasks = (tasks || []).map((t: any, index: number) => ({
        id: t.id || generateId('task'),
        title: t.title,
        category: t.category || 'general',
        priority: t.priority || 'medium',
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        completed: !!t.completed,
        completedAt: t.completed ? (t.completedAt || new Date()) : undefined,
        assignedToRole: t.assignedToRole || 'student',
        order: t.order !== undefined ? t.order : index,
        createdAt: t.createdAt || new Date(),
      }));

      await app.save();
      sendSuccess(res, app.tasks);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Adds communication note / message between student and reviewer.
   */
  async addCommunication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { message, channel = 'comment', attachments, isInternalOnly = false } = req.body;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      const app = await Application.findOne(query);
      if (!app) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      const newMsg = {
        id: generateId('msg'),
        senderId: new Types.ObjectId(user.id),
        senderRole: (user.role === 'admin' ? 'admin' : 'user') as any,
        channel,
        message,
        attachments: attachments?.map((a: string) => new Types.ObjectId(a)),
        isInternalOnly: user.role === 'admin' ? !!isInternalOnly : false,
        createdAt: new Date(),
      };

      app.communications.push(newMsg as any);
      await app.save();

      sendSuccess(res, newMsg, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assigns reviewer to application (Staff/Admin only).
   */
  async assignReviewer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reviewerId } = req.body;

      if (user.role !== 'admin') {
        sendError(res, 403, 'FORBIDDEN', 'Only staff/admin can assign reviewers');
        return;
      }

      const app = await Application.findById(id);
      if (!app) {
        sendError(res, 404, 'NOT_FOUND', 'Application not found');
        return;
      }

      app.assignedReviewerId = new Types.ObjectId(reviewerId);
      await app.save();

      sendSuccess(res, { message: 'Reviewer assigned successfully', assignedReviewerId: reviewerId });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes or archives application.
   */
  async deleteApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { permanent } = req.query;

      const query: any = { _id: id };
      if (user.role !== 'admin') {
        query.userId = user.id;
      }

      if (permanent === 'true' || user.role === 'admin') {
        const deleted = await Application.findOneAndDelete(query);
        if (!deleted) {
          sendError(res, 404, 'NOT_FOUND', 'Application not found');
          return;
        }
        await StatusEvent.deleteMany({ applicationId: id });
        sendSuccess(res, { message: 'Application permanently deleted' });
      } else {
        const app = await Application.findOne(query);
        if (!app) {
          sendError(res, 404, 'NOT_FOUND', 'Application not found');
          return;
        }
        app.archived = true;
        app.archivedAt = new Date();
        await app.save();
        sendSuccess(res, { message: 'Application moved to archive' });
      }
    } catch (error) {
      next(error);
    }
  },
};
