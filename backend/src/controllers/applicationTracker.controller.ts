import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApplicationTracker, IApplicationTracker, IDocumentStatus, ITask } from '../models/ApplicationTracker.model';
import { TrackerBoard, ITrackerBoard } from '../models/TrackerBoard.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';
import { sendSuccess, sendError, escapeRegex } from '../utils/response.util';
import {
  CreateTrackerItemDTO,
  UpdateTrackerItemDTO,
  TrackerQueryDTO,
} from '../validators/tracker.validator';

const generateId = (prefix = 'col') => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

const DEFAULT_COLUMNS = [
  { title: 'Researching', description: 'Universities and programs you are exploring', color: '#64748b' },
  { title: 'Shortlisted', description: 'Strong options you want to compare seriously', color: '#3b82f6' },
  { title: 'Preparing', description: 'Checking eligibility, costs, and documents', color: '#f59e0b' },
  { title: 'Applied', description: 'Application submitted and awaiting response', color: '#8b5cf6' },
  { title: 'Offer', description: 'Conditional or unconditional offer received', color: '#10b981' },
  { title: 'Onboarding', description: 'Visa, payment, accommodation, and enrollment', color: '#06b6d4' },
  { title: 'Archived', description: 'Rejected, cancelled, or no longer relevant', color: '#94a3b8' },
];

const STATUS_MAP: Record<string, string> = {
  researching: 'Researching',
  shortlisted: 'Shortlisted',
  preparing_documents: 'Preparing',
  applied: 'Applied',
  offer_received: 'Offer',
  accepted: 'Onboarding',
  visa_process: 'Onboarding',
  enrolled: 'Onboarding',
  rejected: 'Archived',
  archived: 'Archived',
  'In Progress': 'Offer',
  Preparing: 'Preparing',
};

const DEFAULT_CHECKLISTS: Record<string, { name: string }[]> = {
  university: [
    { name: 'Passport (valid for 6+ months)' },
    { name: 'Academic Transcript' },
    { name: 'Bachelor Certificate / Degree' },
    { name: 'CV / Resume' },
    { name: 'Statement of Purpose (SOP)' },
    { name: 'Recommendation Letter (×2)' },
    { name: 'English Proficiency Test (IELTS/PTE/TOEFL)' },
    { name: 'Application Fee Payment' },
  ],
  program: [
    { name: 'Passport (valid for 6+ months)' },
    { name: 'Academic Transcript' },
    { name: 'Bachelor Certificate / Degree' },
    { name: 'CV / Resume' },
    { name: 'Statement of Purpose (SOP)' },
    { name: 'Recommendation Letter (×2)' },
    { name: 'English Proficiency Test (IELTS/PTE/TOEFL)' },
    { name: 'Application Fee Payment' },
  ],
  scholarship: [
    { name: 'Passport (valid for 6+ months)' },
    { name: 'Academic Transcript' },
    { name: 'Scholarship Application Form' },
    { name: 'Personal Statement / Essay' },
    { name: 'Recommendation Letter (×2)' },
    { name: 'Bank Statement / Financial Proof' },
    { name: 'Research Proposal (if required)' },
    { name: 'English Proficiency Test Result' },
  ],
  visa: [
    { name: 'Valid Passport' },
    { name: 'University Offer / Acceptance Letter' },
    { name: 'Visa Application Form (CoE or equivalent)' },
    { name: 'Financial Proof (Bank Statement)' },
    { name: 'Health Insurance (OSHC or equivalent)' },
    { name: 'Biometrics / Medical Exam' },
    { name: 'Passport-size Photos' },
    { name: 'Visa Fee Payment' },
  ],
  custom: [
    { name: 'Application Form' },
    { name: 'Required Documents' },
    { name: 'Submission Confirmation' },
  ],
};

async function getOrCreateDefaultBoard(userId: string): Promise<ITrackerBoard> {
  let board = await TrackerBoard.findOne({ userId });

  if (!board) {
    board = await TrackerBoard.create({
      userId,
      columns: DEFAULT_COLUMNS.map((c, i) => ({
        id: generateId('col'),
        title: c.title,
        description: c.description,
        color: c.color,
        order: i,
        isArchived: false,
      })),
    });

    const applications = await ApplicationTracker.find({ userId, boardId: { $exists: false } });
    if (applications.length > 0) {
      for (const app of applications) {
        const targetColumnTitle = STATUS_MAP[app.status || 'researching'] || 'Researching';
        const column = board.columns.find((c) => c.title === targetColumnTitle) || board.columns[0];

        app.boardId = board._id as any;
        app.columnId = column.id;
        app.itemType = app.programId ? 'program' : (app.universityId ? 'university' : 'custom');

        if (!app.title) {
          if (app.programId) {
            const program = await Program.findById(app.programId);
            app.title = program?.name || app.customProgramName || 'Unknown Program';
          } else {
            app.title = app.customProgramName || 'Custom Item';
          }
        }

        if (app.documentChecklist) {
          app.documentChecklist = app.documentChecklist.map((d) => {
            const docObj = typeof (d as any).toObject === 'function' ? (d as any).toObject() : d;
            return {
              ...docObj,
              id: d.id || generateId('doc'),
            };
          });
        }

        if (!app.history || app.history.length === 0) {
          app.history = [{
            type: 'created',
            note: 'Migrated to board system',
            updatedAt: new Date(),
          }];
        }

        await app.save();
      }
    }
  }

  return board;
}

export const applicationTrackerController = {
  async getBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const board = await getOrCreateDefaultBoard(userId);
      sendSuccess(res, board);
    } catch (error) {
      next(error);
    }
  },

  async updateBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name, settings } = req.body;

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (settings !== undefined) updateData.settings = settings;

      const board = await TrackerBoard.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!board) {
        sendError(res, 404, 'NOT_FOUND', 'Board not found');
        return;
      }

      sendSuccess(res, board);
    } catch (error) {
      next(error);
    }
  },

  async addColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { title, description, color, wipLimit } = req.body;

      const board = await getOrCreateDefaultBoard(userId);
      const newColumn = {
        id: generateId('col'),
        title,
        description: description || '',
        color: color || '#64748b',
        order: board.columns.length,
        isArchived: false,
        wipLimit: wipLimit || undefined,
      };

      board.columns.push(newColumn);
      await board.save();

      sendSuccess(res, newColumn, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { columnId } = req.params;
      const { title, color, isArchived, description, wipLimit } = req.body;

      const board = await TrackerBoard.findOne({ userId });
      if (!board) {
        sendError(res, 404, 'NOT_FOUND', 'Board not found');
        return;
      }

      const colIndex = board.columns.findIndex((c) => c.id === columnId);
      if (colIndex === -1) {
        sendError(res, 404, 'NOT_FOUND', 'Column not found');
        return;
      }

      if (title !== undefined) board.columns[colIndex].title = title;
      if (color !== undefined) board.columns[colIndex].color = color;
      if (description !== undefined) board.columns[colIndex].description = description;
      if (typeof isArchived === 'boolean') board.columns[colIndex].isArchived = isArchived;
      if (wipLimit !== undefined) board.columns[colIndex].wipLimit = wipLimit ?? undefined;

      await board.save();
      sendSuccess(res, board.columns[colIndex]);
    } catch (error) {
      next(error);
    }
  },

  async reorderColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { columns } = req.body;

      const board = await TrackerBoard.findOne({ userId });
      if (!board) {
        sendError(res, 404, 'NOT_FOUND', 'Board not found');
        return;
      }

      columns.forEach((c: { id: string; order: number }) => {
        const index = board.columns.findIndex((col) => col.id === c.id);
        if (index !== -1) {
          board.columns[index].order = c.order;
        }
      });

      board.columns.sort((a, b) => a.order - b.order);
      await board.save();

      sendSuccess(res, board.columns);
    } catch (error) {
      next(error);
    }
  },

  async resetDefaultColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const board = await getOrCreateDefaultBoard(userId);

      board.columns = DEFAULT_COLUMNS.map((c, i) => ({
        id: generateId('col'),
        title: c.title,
        description: c.description,
        color: c.color,
        order: i,
        isArchived: false,
      }));

      await board.save();
      sendSuccess(res, board);
    } catch (error) {
      next(error);
    }
  },

  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const queryParams: TrackerQueryDTO = req.query as any;
      const { archived, columnId, priority, itemType, search, country, page = 1, limit = 50, sortField = 'order', sortDirection = 'asc' } = queryParams;

      const query: any = { userId };
      if (archived !== undefined) query.archived = archived === 'true';
      if (columnId) query.columnId = columnId;
      if (priority) query.priority = priority;
      if (itemType) query.itemType = itemType;

      if (country) {
        query.country = { $regex: escapeRegex(country), $options: 'i' };
      }

      if (search) {
        const safeRegex = escapeRegex(search);
        query.$or = [
          { title: { $regex: safeRegex, $options: 'i' } },
          { subtitle: { $regex: safeRegex, $options: 'i' } },
          { customUniversityName: { $regex: safeRegex, $options: 'i' } },
          { customProgramName: { $regex: safeRegex, $options: 'i' } },
          { country: { $regex: safeRegex, $options: 'i' } },
          { tags: { $regex: safeRegex, $options: 'i' } },
        ];
      }

      const sort: Record<string, 1 | -1> = {};
      sort[sortField] = sortDirection === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ApplicationTracker.find(query)
          .populate('programId', 'name level field university universityName universitySlug logoUrl')
          .populate('universityId', 'name slug logo country')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        ApplicationTracker.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      sendSuccess(res, items, {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
      });
    } catch (error) {
      next(error);
    }
  },

  async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await ApplicationTracker.findOne({ _id: id, userId: (req as any).user.id })
        .populate('programId')
        .populate('universityId');

      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Application item not found');
        return;
      }

      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },

  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const data: CreateTrackerItemDTO = req.body;

      const board = await getOrCreateDefaultBoard(userId);

      let finalUniversityId = data.universityId;
      let finalCountry = data.country;

      if (data.programId && !finalUniversityId) {
        const program = await Program.findById(data.programId);
        if (program) {
          finalUniversityId = program.university?.toString();
          if (!finalCountry) {
            const uni = await University.findById(program.university);
            if (uni) finalCountry = (uni as any).country || '';
          }
        }
      }

      if (finalUniversityId && !finalCountry) {
        const uni = await University.findById(finalUniversityId);
        if (uni) finalCountry = (uni as any).country || '';
      }

      let targetColumn = data.columnId
        ? board.columns.find((c) => c.id === data.columnId)
        : board.columns.filter((c) => !c.isArchived)[0];

      if (!targetColumn) {
        targetColumn = board.columns[0];
      }

      const itemType = data.itemType || (data.programId ? 'program' : (finalUniversityId ? 'university' : 'custom'));
      const defaultChecklist = DEFAULT_CHECKLISTS[itemType] || DEFAULT_CHECKLISTS.custom;

      const checklist: IDocumentStatus[] = (data.documentChecklist && data.documentChecklist.length > 0)
        ? data.documentChecklist.map((d) => ({
            id: d.id || generateId('doc'),
            name: d.name,
            status: d.status || 'pending',
            fileUrl: d.fileUrl || undefined,
            notes: d.notes || undefined,
            updatedAt: new Date(),
          }))
        : defaultChecklist.map((d) => ({
            id: generateId('doc'),
            name: d.name,
            status: 'pending',
            updatedAt: new Date(),
          }));

      const tasks: ITask[] = (data.tasks || []).map((t) => ({
        id: t.id || generateId('task'),
        title: t.title,
        completed: !!t.completed,
        dueDate: t.dueDate,
        category: t.category,
        order: t.order,
        createdAt: new Date(),
      }));

      const item = await ApplicationTracker.create({
        userId,
        boardId: board._id,
        columnId: targetColumn.id,
        itemType,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        programId: data.programId,
        universityId: finalUniversityId,
        customProgramName: data.customProgramName,
        customUniversityName: data.customUniversityName,
        priority: data.priority || 'medium',
        deadline: data.deadline,
        intake: data.intake,
        applicationUrl: data.applicationUrl,
        notes: data.notes,
        tags: data.tags || [],
        country: finalCountry,
        documentChecklist: checklist,
        tasks,
        history: [{
          type: 'created',
          note: 'Application added to tracker',
          updatedAt: new Date(),
        }],
      });

      sendSuccess(res, item, undefined, undefined, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateTrackerItemDTO = req.body;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Application item not found');
        return;
      }

      if (updateData.columnId && updateData.columnId !== item.columnId) {
        const board = await TrackerBoard.findOne({ userId });
        const validCol = board?.columns.some((c) => c.id === updateData.columnId);
        if (!validCol) {
          sendError(res, 400, 'INVALID_COLUMN', 'Target column does not exist on your board');
          return;
        }

        item.history.push({
          type: 'moved',
          fromColumnId: item.columnId,
          toColumnId: updateData.columnId,
          note: 'Moved to another stage',
          updatedAt: new Date(),
        });
        item.columnId = updateData.columnId;
      }

      if (updateData.notes !== undefined && updateData.notes !== item.notes) {
        item.history.push({
          type: 'note_updated',
          note: 'Notes updated',
          updatedAt: new Date(),
        });
        item.notes = updateData.notes;
      }

      if (updateData.title !== undefined) item.title = updateData.title;
      if (updateData.subtitle !== undefined) item.subtitle = updateData.subtitle;
      if (updateData.description !== undefined) item.description = updateData.description;
      if (updateData.priority !== undefined) item.priority = updateData.priority;
      if (updateData.deadline !== undefined) item.deadline = updateData.deadline ?? undefined;
      if (updateData.intake !== undefined) item.intake = updateData.intake;
      if (updateData.applicationUrl !== undefined) item.applicationUrl = updateData.applicationUrl ?? undefined;
      if (updateData.tags !== undefined) item.tags = updateData.tags;
      if (updateData.customProgramName !== undefined) item.customProgramName = updateData.customProgramName;
      if (updateData.customUniversityName !== undefined) item.customUniversityName = updateData.customUniversityName;
      if (updateData.country !== undefined) item.country = updateData.country;
      if (updateData.order !== undefined) item.order = updateData.order;
      if (typeof updateData.archived === 'boolean') item.archived = updateData.archived;

      if (updateData.documentChecklist) {
        item.documentChecklist = updateData.documentChecklist.map((d) => ({
          id: d.id || generateId('doc'),
          name: d.name,
          status: d.status || 'pending',
          fileUrl: d.fileUrl || undefined,
          notes: d.notes || undefined,
          updatedAt: new Date(),
        }));
      }

      if (updateData.tasks) {
        item.tasks = updateData.tasks.map((t) => ({
          id: t.id || generateId('task'),
          title: t.title,
          completed: !!t.completed,
          dueDate: t.dueDate,
          category: t.category,
          order: t.order,
          createdAt: new Date(),
        }));
      }

      await item.save();
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },

  async moveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { toColumnId, order } = req.body;
      const userId = (req as any).user.id;

      const [item, board] = await Promise.all([
        ApplicationTracker.findOne({ _id: id, userId }),
        TrackerBoard.findOne({ userId }),
      ]);

      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Item not found');
        return;
      }

      const validCol = board?.columns.some((c) => c.id === toColumnId);
      if (!validCol) {
        sendError(res, 400, 'INVALID_COLUMN', 'Target column does not belong to your board');
        return;
      }

      const fromColumnId = item.columnId;
      item.columnId = toColumnId;
      if (order !== undefined) item.order = order;

      item.history.push({
        type: 'moved',
        fromColumnId,
        toColumnId,
        note: 'Moved to new stage',
        updatedAt: new Date(),
      });

      await item.save();
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOneAndDelete({ _id: id, userId });
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Item not found');
        return;
      }

      sendSuccess(res, { id, message: 'Application removed from tracker' });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    return applicationTrackerController.deleteItem(req, res, next);
  },

  async reorderItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { items } = req.body;

      if (Array.isArray(items)) {
        await Promise.all(
          items.map((it: { id: string; order?: number; columnId?: string }) =>
            ApplicationTracker.findOneAndUpdate(
              { _id: it.id, userId },
              {
                $set: {
                  ...(it.order !== undefined && { order: it.order }),
                  ...(it.columnId && { columnId: it.columnId }),
                },
              }
            )
          )
        );
      }

      sendSuccess(res, { message: 'Items reordered successfully' });
    } catch (error) {
      next(error);
    }
  },

  async updateDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { documentChecklist } = req.body;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Item not found');
        return;
      }

      item.documentChecklist = (documentChecklist || []).map((d: any) => ({
        id: d.id || generateId('doc'),
        name: d.name,
        status: d.status || 'pending',
        fileUrl: d.fileUrl || undefined,
        notes: d.notes || undefined,
        updatedAt: new Date(),
      }));

      await item.save();
      sendSuccess(res, item.documentChecklist);
    } catch (error) {
      next(error);
    }
  },

  async updateTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { tasks } = req.body;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Item not found');
        return;
      }

      item.tasks = (tasks || []).map((t: any) => ({
        id: t.id || generateId('task'),
        title: t.title,
        completed: !!t.completed,
        dueDate: t.dueDate,
        category: t.category,
        order: t.order,
        createdAt: new Date(),
      }));

      await item.save();
      sendSuccess(res, item.tasks);
    } catch (error) {
      next(error);
    }
  },

  async archiveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', 'Item not found');
        return;
      }

      item.archived = !item.archived;
      await item.save();
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  },
};
