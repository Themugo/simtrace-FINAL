import { Router } from 'express';
import * as imeiController from '../../controllers/imei.js';

const router = Router();

// IMEI endpoints (v1)
router.get('/:imei', imeiController.checkImei);
router.post('/:imei/report', imeiController.reportTheft);
router.get('/:imei/history', imeiController.getHistory);

export default router;
