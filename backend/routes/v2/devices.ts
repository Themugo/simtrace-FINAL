import { Router } from 'express';
import * as deviceController from '../../controllers/devices.js';

const router = Router();

// Device endpoints (v2 - enhanced with risk scoring)
router.get('/', deviceController.listDevices);
router.post('/', deviceController.createDevice);
router.get('/:id', deviceController.getDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/:id/lock', deviceController.lockDevice);
router.post('/:id/unlock', deviceController.unlockDevice);

// v2-specific endpoints
router.get('/:id/risk', deviceController.getDeviceRisk);
router.get('/:id/sessions', deviceController.getDeviceSessions);
router.get('/:id/events', deviceController.getDeviceEvents);

export default router;
