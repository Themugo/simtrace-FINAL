import { Router } from 'express';
import * as trackController from '../../controllers/track.js';

const router = Router();

// Tracking endpoints (v2 - enhanced with telemetry pipeline)
router.post('/ping', trackController.submitPing);
router.get('/:imei/pings', trackController.getPings);
router.get('/:imei/locations', trackController.getLocations);

// v2-specific endpoints
router.post('/batch', trackController.submitBatchPings);
router.get('/:imei/sessions', trackController.getSessions);
router.get('/:imei/analytics', trackController.getAnalytics);

export default router;
