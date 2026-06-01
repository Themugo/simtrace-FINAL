import { Router } from 'express';
import * as trackController from '../../controllers/track.js';

const router = Router();

// Tracking endpoints (v1)
router.post('/ping', trackController.submitPing);
router.get('/:imei/pings', trackController.getPings);
router.get('/:imei/locations', trackController.getLocations);

export default router;
