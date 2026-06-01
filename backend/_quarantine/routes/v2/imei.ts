import { Router } from 'express';
import * as imeiController from '../../controllers/imei.js';

const router = Router();

// IMEI endpoints (v2 - enhanced with geolocation enrichment)
router.get('/:imei', imeiController.checkImei);
router.post('/:imei/report', imeiController.reportTheft);
router.get('/:imei/history', imeiController.getHistory);

// v2-specific endpoints
router.get('/:imei/risk', imeiController.getRiskAssessment);
router.get('/:imei/locations', imeiController.getLocations);
router.get('/:imei/timeline', imeiController.getTimeline);

export default router;
