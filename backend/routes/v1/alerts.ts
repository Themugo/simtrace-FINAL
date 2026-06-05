import { Router } from 'express';
import * as alertController from '../../controllers/alerts.js';

const router = Router();

// Alert endpoints (v1)
router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.put('/:id/read', alertController.markAsRead);
router.delete('/:id', alertController.deleteAlert);

export default router;
