import { Router } from 'express';
import { applicationTrackerController } from '../controllers/applicationTracker.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createTrackerItemSchema,
  updateTrackerItemSchema,
  moveTrackerItemSchema,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  updateBoardSchema,
  trackerQuerySchema,
} from '../validators/tracker.validator';

const router = Router();

router.use(protect);

// Board & Columns
router.get('/board', applicationTrackerController.getBoard);
router.patch('/board', validateRequest({ body: updateBoardSchema }), applicationTrackerController.updateBoard);
router.post('/board/reset-columns', applicationTrackerController.resetDefaultColumns);
router.post('/columns', validateRequest({ body: createColumnSchema }), applicationTrackerController.addColumn);
router.patch('/columns/reorder', validateRequest({ body: reorderColumnsSchema }), applicationTrackerController.reorderColumns);
router.patch('/columns/:columnId', validateRequest({ body: updateColumnSchema }), applicationTrackerController.updateColumn);

// Items
router.get('/items', validateRequest({ query: trackerQuerySchema }), applicationTrackerController.getItems);
router.post('/items', validateRequest({ body: createTrackerItemSchema }), applicationTrackerController.addItem);
router.patch('/items/reorder', applicationTrackerController.reorderItems);
router.get('/items/:id', applicationTrackerController.getItem);
router.patch('/items/:id', validateRequest({ body: updateTrackerItemSchema }), applicationTrackerController.updateItem);
router.patch('/items/:id/move', validateRequest({ body: moveTrackerItemSchema }), applicationTrackerController.moveItem);
router.patch('/items/:id/documents', applicationTrackerController.updateDocuments);
router.patch('/items/:id/tasks', applicationTrackerController.updateTasks);
router.patch('/items/:id/archive', applicationTrackerController.archiveItem);
router.delete('/items/:id', applicationTrackerController.deleteItem);

// Legacy routes (for backward compatibility)
router.get('/', validateRequest({ query: trackerQuerySchema }), applicationTrackerController.getItems);
router.post('/', validateRequest({ body: createTrackerItemSchema }), applicationTrackerController.addItem);
router.patch('/:id', validateRequest({ body: updateTrackerItemSchema }), applicationTrackerController.updateItem);

export default router;
