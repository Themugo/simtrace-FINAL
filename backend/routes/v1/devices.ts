import { Router } from 'express';
import * as deviceController from '../../controllers/devices.js';

const router = Router();

// Device endpoints (v1)
router.get('/', deviceController.listDevices);
router.post('/', deviceController.createDevice);
router.get('/:id', deviceController.getDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/:id/lock', deviceController.lockDevice);
router.post('/:id/unlock', deviceController.unlockDevice);

export default router;
