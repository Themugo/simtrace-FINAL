import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Ping, Device } from '../db/index.js';
import { getIO } from '../services/socket.js';
import { runIntelligence } from '../services/intelligence.js';
import pino from 'pino';

const log = pino({ level: 'info' }).child({ service: 'track' });
const router = Router();

// ── Device key auth middleware ─────────────────────────────────────────────────
async function deviceKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-device-key'] as string;
  const imei = (req.body as any)?.imei;

  if (!key || !imei) {
    if (process.env.TRACK_REQUIRE_AUTH === 'true') {
      return res.status(401).json({ error: 'X-Device-Key header required' });
    }
    (req as any).pingVerified = false;
    return next();
  }

  const device = await Device.findOne({ imei }).select('deviceKey').lean();
  if (!device?.deviceKey) {
    (req as any).pingVerified = false;
    return next();
  }

  if (device.deviceKey !== key) {
    return res.status(401).json({ error: 'Invalid device key' });
  }

  (req as any).pingVerified = true;
  next();
}

const pingSchema = z.object({
  imei: z.string().min(15).max(17).regex(/^\d+$/, 'IMEI must be numeric'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  simIccid: z.string().optional(),
  networkOp: z.string().optional(),
  fingerprint: z.object({
    networkMac: z.string().optional(),
    bluetoothMac: z.string().optional(),
    screenRes: z.string().optional(),
    osVersion: z.string().optional(),
    buildId: z.string().optional(),
  }).optional(),
});

// POST /api/track
router.post('/', deviceKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = pingSchema.parse(req.body);

    const ping = await Ping.create({
      imei: data.imei,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      simIccid: data.simIccid,
      networkOp: data.networkOp,
      ipAddress: req.ip,
      verified: (req as any).pingVerified ?? false,
    });

    const device = await Device.findOneAndUpdate(
      { imei: data.imei },
      {
        lastSeen: new Date(),
        ...(data.fingerprint && { fingerprint: data.fingerprint }),
      },
      { new: true }
    );

    runIntelligence({ ping, device }).catch(err => log.error({ err, imei: data.imei }, 'Intelligence failed'));

    getIO().to(`device:${data.imei}`).emit('location_update', {
      imei: data.imei,
      lat: data.lat,
      lng: data.lng,
      ts: ping.ts,
      verified: (req as any).pingVerified ?? false,
    });

    getIO().to('role:admin').emit('location_update', {
      imei: data.imei,
      lat: data.lat,
      lng: data.lng,
      ts: ping.ts,
      status: device?.status ?? 'unknown',
      verified: (req as any).pingVerified ?? false,
    });

    res.json({ success: true, pingId: ping._id });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
