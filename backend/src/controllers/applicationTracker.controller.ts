import { Request, Response, NextFunction } from 'express';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { TrackerBoard, ITrackerBoard } from '../models/TrackerBoard.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';

const generateId = (prefix = 'col') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

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
  'researching': 'Researching',
  'shortlisted': 'Shortlisted',
  'preparing_documents': 'Preparing',
  'applied': 'Applied',
  'offer_received': 'Offer',
  'accepted': 'Onboarding',
  'visa_process': 'Onboarding',
  'enrolled': 'Onboarding',
  'rejected': 'Archived',
  'archived': 'Archived',
  // Legacy mappings
  'In Progress': 'Offer',
  'Preparing': 'Preparing',
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

export const applicationTrackerController = {
  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      let board = await TrackerBoard.findOne({ userId });

      if (!board) {
        // Create default board
        board = await TrackerBoard.create({
          userId,
          columns: DEFAULT_COLUMNS.map((c, i) => ({
            id: generateId(),
            title: c.title,
            description: c.description,
            color: c.color,
            order: i,
            isArchived: false
          }))
        });

        // Migrate existing applications
        const applications = await ApplicationTracker.find({ userId, boardId: { $exists: false } });
        if (applications.length > 0) {
          for (const app of applications) {
            const targetColumnTitle = STATUS_MAP[app.status || 'researching'] || 'Researching';
            const column = board.columns.find(c => c.title === targetColumnTitle) || board.columns[0];

            app.boardId = board._id as any;
            app.columnId = column.id;
            app.itemType = app.programId ? 'program' : (app.universityId ? 'university' : 'custom');

            // Set title and subtitle if missing
            if (!app.title) {
              if (app.programId) {
                const program = await Program.findById(app.programId);
                app.title = program?.name || app.customProgramName || 'Unknown Program';
              } else {
                app.title = app.customProgramName || 'Custom Item';
              }
            }

            // Fix document checklist IDs
            if (app.documentChecklist) {
              app.documentChecklist = app.documentChecklist.map(d => ({
                ...d.toObject(),
                id: d.id || generateId('doc')
              }));
            }

            // Add creation history if empty
            if (app.history.length === 0) {
              app.history.push({
                type: 'created',
                note: 'Migrated to new board system',
                updatedAt: new Date()
              });
            }

            await app.save();
          }
        }
      }

      res.json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  },

  async updateBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { name, settings } = req.body;
      const board = await TrackerBoard.findOneAndUpdate(
        { userId },
        { $set: { name, settings } },
        { new: true }
      );
      res.json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  },

  async addColumn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { title, color, description, wipLimit } = req.body;

      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      const newColumn = {
        id: generateId(),
        title,
        description: description || '',
        color: color || '#64748b',
        order: board.columns.length,
        isArchived: false,
        wipLimit: wipLimit || undefined,
      };

      board.columns.push(newColumn);
      await board.save();

      res.json({ success: true, data: newColumn });
    } catch (error) {
      next(error);
    }
  },

  async updateColumn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { columnId } = req.params;
      const { title, color, isArchived, description, wipLimit } = req.body;

      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      const colIndex = board.columns.findIndex(c => c.id === columnId);
      if (colIndex === -1) return res.status(404).json({ success: false, message: 'Column not found' });

      if (title) board.columns[colIndex].title = title;
      if (color) board.columns[colIndex].color = color;
      if (description !== undefined) board.columns[colIndex].description = description;
      if (typeof isArchived === 'boolean') board.columns[colIndex].isArchived = isArchived;
      if (wipLimit !== undefined) board.columns[colIndex].wipLimit = wipLimit;

      await board.save();
      res.json({ success: true, data: board.columns[colIndex] });
    } catch (error) {
      next(error);
    }
  },

  async reorderColumns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { columns } = req.body; // Array of { id, order }

      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      columns.forEach((c: { id: string, order: number }) => {
        const index = board.columns.findIndex(col => col.id === c.id);
        if (index !== -1) {
          board.columns[index].order = c.order;
        }
      });

      board.columns.sort((a, b) => a.order - b.order);
      await board.save();

      res.json({ success: true, data: board.columns });
    } catch (error) {
      next(error);
    }
  },

  async resetDefaultColumns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      board.columns = DEFAULT_COLUMNS.map((c, i) => ({
        id: generateId(),
        title: c.title,
        description: c.description,
        color: c.color,
        order: i,
        isArchived: false,
      }));

      await board.save();
      res.json({ success: true, data: board });
    } catch (error) {
      next(error);
    }
  },

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { archived, columnId, priority, itemType, search, country } = req.query;

      const query: any = { userId };
      if (archived !== undefined) query.archived = archived === 'true';
      if (columnId) query.columnId = columnId;
      if (priority) query.priority = priority;
      if (itemType) query.itemType = itemType;
      if (country) query.country = { $regex: country, $options: 'i' };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { subtitle: { $regex: search, $options: 'i' } },
          { customUniversityName: { $regex: search, $options: 'i' } },
          { customProgramName: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } },
        ];
      }

      const items = await ApplicationTracker.find(query)
        .populate('programId', 'name level field university universityName universitySlug logoUrl')
        .populate('universityId', 'name slug logo country')
        .sort({ order: 1, updatedAt: -1 });

      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await ApplicationTracker.findOne({ _id: id, userId: (req as any).user.id })
        .populate('programId')
        .populate('universityId');

      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      let board = await TrackerBoard.findOne({ userId });
      if (!board) {
        await applicationTrackerController.getBoard(req, res, next);
        board = await TrackerBoard.findOne({ userId });
      }

      if (!board) return res.status(500).json({ success: false, message: 'Failed to find or create board' });

      // Determine final universityId if programId is provided
      if (data.programId && !data.universityId) {
        const program = await Program.findById(data.programId);
        if (program) {
          data.universityId = program.university;
          if (!data.country) {
            // Try to get country from university
            const uni = await University.findById(program.university);
            if (uni) data.country = (uni as any).country || '';
          }
        }
      }

      if (data.universityId && !data.country) {
        const uni = await University.findById(data.universityId);
        if (uni) data.country = (uni as any).country || '';
      }

      // Determine column — use first non-archived column if not specified
      const targetColumn = data.columnId
        ? board.columns.find(c => c.id === data.columnId)
        : board.columns.filter(c => !c.isArchived)[0];

      // Auto-generate type-based checklist if not provided
      const itemType = data.itemType || (data.programId ? 'program' : (data.universityId ? 'university' : 'custom'));
      const defaultChecklist = DEFAULT_CHECKLISTS[itemType] || DEFAULT_CHECKLISTS.custom;

      const item = await ApplicationTracker.create({
        ...data,
        userId,
        boardId: board._id,
        columnId: targetColumn?.id || board.columns[0].id,
        itemType,
        documentChecklist: data.documentChecklist?.length > 0
          ? data.documentChecklist
          : defaultChecklist.map(d => ({
              id: generateId('doc'),
              name: d.name,
              status: 'pending',
              updatedAt: new Date()
            })),
        history: [{
          type: 'created',
          note: 'Application added to tracker',
          updatedAt: new Date()
        }]
      });

      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      // Log movement in history
      if (updateData.columnId && updateData.columnId !== item.columnId) {
        item.history.push({
          type: 'moved',
          fromColumnId: item.columnId,
          toColumnId: updateData.columnId,
          note: `Moved to another stage`,
          updatedAt: new Date()
        });
      }

      // Log note updates
      if (updateData.notes !== undefined && updateData.notes !== item.notes) {
        item.history.push({
          type: 'note_updated',
          note: 'Notes updated',
          updatedAt: new Date()
        });
      }

      Object.assign(item, updateData);
      await item.save();

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async moveItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { toColumnId, order } = req.body;
      const userId = (req as any).user.id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      const fromColumnId = item.columnId;
      item.columnId = toColumnId;
      if (order !== undefined) item.order = order;

      item.history.push({
        type: 'moved',
        fromColumnId,
        toColumnId,
        note: `Moved to new stage`,
        updatedAt: new Date()
      });

      await item.save();
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { columnId, items } = req.body; // Array of { id, order }

      const bulkOps = items.map((it: { id: string, order: number }) => ({
        updateOne: {
          filter: { _id: it.id, userId, columnId },
          update: { $set: { order: it.order } }
        }
      }));

      await ApplicationTracker.bulkWrite(bulkOps);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async updateDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { checklist } = req.body;
      const item = await ApplicationTracker.findOneAndUpdate(
        { _id: id, userId: (req as any).user.id },
        {
          $set: { documentChecklist: checklist },
          $push: { history: { type: 'document_updated', updatedAt: new Date() } }
        },
        { new: true }
      );
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async updateTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { tasks } = req.body;
      const item = await ApplicationTracker.findOneAndUpdate(
        { _id: id, userId: (req as any).user.id },
        {
          $set: { tasks },
          $push: { history: { type: 'task_updated', updatedAt: new Date() } }
        },
        { new: true }
      );
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async archiveItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { archived } = req.body;
      const item = await ApplicationTracker.findOneAndUpdate(
        { _id: id, userId: (req as any).user.id },
        {
          $set: {
            archived: archived ?? true,
            archivedAt: archived !== false ? new Date() : undefined
          },
          $push: {
            history: {
              type: 'archived',
              note: archived === false ? 'Restored from archive' : 'Archived',
              updatedAt: new Date()
            }
          }
        },
        { new: true }
      );
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await ApplicationTracker.findOneAndDelete({
        _id: id,
        userId: (req as any).user.id,
      });

      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      res.json({ success: true, message: 'Application removed' });
    } catch (error) {
      next(error);
    }
  }
};
