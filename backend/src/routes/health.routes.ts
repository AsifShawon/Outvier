import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Liveness Probe: Used by Kubernetes / Docker to restart dead containers
router.get('/live', healthController.getLiveness);

// Readiness Probe: Used by load balancers before directing traffic
router.get('/ready', healthController.getReadiness);

// Prometheus metrics scrape endpoint
router.get('/metrics', healthController.getMetrics);

// Telemetry JSON snapshot
router.get('/snapshot', healthController.getSnapshot);

export default router;
