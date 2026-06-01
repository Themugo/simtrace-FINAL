import { Router } from 'express';
import * as alertController from '../../controllers/alerts.js';

const router = Router();

// Alert endpoints (v2 - enhanced with filtering)
router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.put('/:id/read', alertController.markAsRead);
router.delete('/:id', alertController.deleteAlert);

// v2-specific endpoints
router.put('/read-all', alertController.markAllAsRead);
router.get('/stats', alertController.getAlertStats);

export default router;
