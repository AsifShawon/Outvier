import { Router } from 'express';
import { applicationTrackerController } from '../controllers/applicationTracker.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Board & Columns
router.get('/board', applicationTrackerController.getBoard);
router.patch('/board', applicationTrackerController.updateBoard);
router.post('/columns', applicationTrackerController.addColumn);
router.patch('/columns/reorder', applicationTrackerController.reorderColumns);
router.patch('/columns/:columnId', applicationTrackerController.updateColumn);

// Items
router.get('/items', applicationTrackerController.getItems);
router.post('/items', applicationTrackerController.addItem);
router.patch('/items/reorder', applicationTrackerController.reorderItems);
router.get('/items/:id', applicationTrackerController.getItem);
router.patch('/items/:id', applicationTrackerController.updateItem);
router.patch('/items/:id/move', applicationTrackerController.moveItem);
router.patch('/items/:id/documents', applicationTrackerController.updateDocuments);
router.patch('/items/:id/tasks', applicationTrackerController.updateTasks);
router.patch('/items/:id/archive', applicationTrackerController.archiveItem);
router.delete('/items/:id', applicationTrackerController.removeItem);

// Legacy routes (for backward compatibility if needed, but we'll redirect them or handle them)
router.get('/', applicationTrackerController.getItems);
router.post('/', applicationTrackerController.addItem);
router.patch('/:id', applicationTrackerController.updateItem);

export default router;

