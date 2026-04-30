import { Router } from 'express';
import { recommendationsController } from '../controllers/recommendations.controller';
import { protect, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Authenticated student gets their personalised recommendations
router.get('/me', protect, recommendationsController.getMyRecommendations);

// Preview recommendations for an arbitrary profile payload (no auth needed)
router.post('/profile', optionalAuth, recommendationsController.getRecommendationsForProfile);

export default router;
