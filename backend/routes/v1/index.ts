import { Router } from 'express';
import authRoutes from './auth.js';
import deviceRoutes from './devices.js';
import imeiRoutes from './imei.js';
import alertRoutes from './alerts.js';
import trackRoutes from './track.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/imei', imeiRoutes);
router.use('/alerts', alertRoutes);
router.use('/track', trackRoutes);

export default router;
