import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller';
import { protect, optionalAuth, adminOnly } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  updateDocumentMetadataSchema,
  verifyDocumentSchema,
} from '../validators/document.validator';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

// Direct signed download route (allows token-based download without cookies, or authenticated session)
router.get('/:id/download', optionalAuth, documentController.downloadDocument);

// Authenticated document routes
router.use(protect);

router.get('/', documentController.getDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/signed-url', documentController.getSignedDownloadUrl);
router.patch(
  '/:id',
  validateRequest({ body: updateDocumentMetadataSchema }),
  documentController.updateDocument
);
router.delete('/:id', documentController.deleteDocument);

// Staff / Admin verification
router.patch(
  '/:id/verify',
  adminOnly,
  validateRequest({ body: verifyDocumentSchema }),
  documentController.verifyDocument
);

export default router;
