import { Request, Response, NextFunction } from 'express';
import { ApplicationTracker } from '../models/ApplicationTracker.model';
import { TrackerBoard, ITrackerBoard } from '../models/TrackerBoard.model';
import { Program } from '../models/Program.model';
import { University } from '../models/University.model';

const generateId = (prefix = 'col') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_COLUMNS = [
  { title: 'Shortlisted', color: '#64748b' },
  { title: 'Preparing', color: '#3b82f6' },
  { title: 'Applied', color: '#f59e0b' },
  { title: 'Offer Received', color: '#10b981' },
  { title: 'Visa Process', color: '#8b5cf6' },
  { title: 'Enrolled', color: '#059669' }
];

const STATUS_MAP: Record<string, string> = {
  'researching': 'Shortlisted',
  'shortlisted': 'Shortlisted',
  'preparing_documents': 'Preparing',
  'applied': 'Applied',
  'offer_received': 'Offer Received',
  'accepted': 'Visa Process',
  'visa_process': 'Visa Process',
  'enrolled': 'Enrolled',
  'rejected': 'Applied', // Keep it in applied or elsewhere
  'archived': 'Enrolled' // Just a fallback
};

export const applicationTrackerController = {
  async getBoard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      let board = await TrackerBoard.findOne({ userId });

      if (!board) {
        // Create default board
        board = await TrackerBoard.create({
          userId,
          columns: DEFAULT_COLUMNS.map((c, i) => ({
            id: generateId(),
            title: c.title,
            color: c.color,
            order: i,
            isArchived: false
          }))
        });

        // Migrate existing applications
        const applications = await ApplicationTracker.find({ userId, boardId: { $exists: false } });
        if (applications.length > 0) {
          for (const app of applications) {
            const targetColumnTitle = STATUS_MAP[app.status || 'researching'] || 'Shortlisted';
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
      const userId = (req as any).user._id;
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
      const userId = (req as any).user._id;
      const { title, color } = req.body;
      
      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      const newColumn = {
        id: generateId(),
        title,
        color: color || '#64748b',
        order: board.columns.length,
        isArchived: false
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
      const userId = (req as any).user._id;
      const { columnId } = req.params;
      const { title, color, isArchived } = req.body;

      const board = await TrackerBoard.findOne({ userId });
      if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

      const colIndex = board.columns.findIndex(c => c.id === columnId);
      if (colIndex === -1) return res.status(404).json({ success: false, message: 'Column not found' });

      if (title) board.columns[colIndex].title = title;
      if (color) board.columns[colIndex].color = color;
      if (typeof isArchived === 'boolean') board.columns[colIndex].isArchived = isArchived;

      await board.save();
      res.json({ success: true, data: board.columns[colIndex] });
    } catch (error) {
      next(error);
    }
  },

  async reorderColumns(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
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

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user._id;
      const { archived, columnId, priority, itemType, search } = req.query;

      const query: any = { userId };
      if (archived !== undefined) query.archived = archived === 'true';
      if (columnId) query.columnId = columnId;
      if (priority) query.priority = priority;
      if (itemType) query.itemType = itemType;
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { customUniversityName: { $regex: search, $options: 'i' } },
          { customProgramName: { $regex: search, $options: 'i' } }
        ];
      }

      const items = await ApplicationTracker.find(query)
        .populate('programId', 'name level field university universityName universitySlug logoUrl')
        .populate('universityId', 'name slug logo')
        .sort({ order: 1, updatedAt: -1 });

      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await ApplicationTracker.findOne({ _id: id, userId: (req as any).user._id })
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
      const userId = (req as any).user._id;
      const data = req.body;

      let board = await TrackerBoard.findOne({ userId });
      if (!board) {
        // Trigger migration/creation if not exists
        await applicationTrackerController.getBoard(req, res, next);
        board = await TrackerBoard.findOne({ userId });
      }

      if (!board) return res.status(500).json({ success: false, message: 'Failed to find or create board' });

      // Determine final universityId if programId is provided
      if (data.programId && !data.universityId) {
        const program = await Program.findById(data.programId);
        if (program) data.universityId = program.university;
      }

      const item = await ApplicationTracker.create({
        ...data,
        userId,
        boardId: board._id,
        columnId: data.columnId || board.columns[0].id,
        itemType: data.itemType || (data.programId ? 'program' : (data.universityId ? 'university' : 'custom')),
        documentChecklist: data.documentChecklist || [
          { id: generateId('doc'), name: 'Passport', status: 'pending' },
          { id: generateId('doc'), name: 'Academic Transcript', status: 'pending' },
          { id: generateId('doc'), name: 'CV / Resume', status: 'pending' },
          { id: generateId('doc'), name: 'Statement of Purpose', status: 'pending' },
          { id: generateId('doc'), name: 'English Proficiency Test', status: 'pending' },
        ],
        history: [{
          type: 'created',
          note: 'Application created',
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
      const userId = (req as any).user._id;

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
      const userId = (req as any).user._id;

      const item = await ApplicationTracker.findOne({ _id: id, userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      const fromColumnId = item.columnId;
      item.columnId = toColumnId;
      if (order !== undefined) item.order = order;

      item.history.push({
        type: 'moved',
        fromColumnId,
        toColumnId,
        note: `Moved to stage: ${toColumnId}`,
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
      const userId = (req as any).user._id;
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
        { _id: id, userId: (req as any).user._id },
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
        { _id: id, userId: (req as any).user._id },
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
        { _id: id, userId: (req as any).user._id },
        { 
          $set: { archived: archived ?? true },
          $push: { history: { type: 'archived', note: archived === false ? 'Unarchived' : 'Archived', updatedAt: new Date() } }
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
        userId: (req as any).user._id,
      });

      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      res.json({ success: true, message: 'Application removed' });
    } catch (error) {
      next(error);
    }
  }
};

