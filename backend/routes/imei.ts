import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Device, TheftReport, Ping } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { computeRiskScore } from '../services/intelligence.js';
import { sendAlert } from '../services/notify.js';
import { checkDeviceLimit } from '../services/billing.js';

const router = Router();

// ── Luhn algorithm ─────────────────────────────────────────────────────────────
function luhnValid(imei: string): boolean {
  let sum = 0;
  for (let i = 0; i < imei.length; i++) {
    let d = parseInt(imei[imei.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

// POST /api/imei/register — owner registers their device
router.post('/register', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      serialNumber: z.string().optional(),
      make: z.string().optional(),
      model: z.string().optional(),
    });
    const data = schema.parse(req.body);

    if (!luhnValid(data.imei)) {
      return res.status(400).json({ error: 'Invalid IMEI — failed Luhn checksum' });
    }

    const existing = await Device.findOne({ imei: data.imei });
    if (existing) return res.status(409).json({ error: 'Device already registered' });

    const limit = await checkDeviceLimit(req.user!.id);
    if (!limit.canAdd) {
      return res.status(402).json({
        error: 'Device limit reached for your plan',
        plan: limit.plan,
        deviceCount: limit.deviceCount,
        totalAllowed: limit.totalAllowed,
        extraDeviceKES: limit.extraDeviceKES,
        upgradeRequired: limit.isOverFreeLimit,
        code: 'DEVICE_LIMIT_REACHED',
      });
    }

    const deviceKey = crypto.randomBytes(32).toString('hex');
    const device = await Device.create({ ...data, owner: req.user!.id, status: 'active', deviceKey });

    res.status(201).json({
      ...device.toObject(),
      deviceKey,
      _keyWarning: 'Store deviceKey securely on the device. It cannot be retrieved again.',
    });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// POST /api/imei/report-stolen — report a device as stolen
router.post('/report-stolen', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      description: z.string().max(1000).optional(),
      policeRef: z.string().max(100).optional(),
    });
    const { imei, description, policeRef } = schema.parse(req.body);

    await Device.findOneAndUpdate({ imei }, { status: 'stolen' }, { upsert: true });

    const report = await TheftReport.create({
      imei, description, policeRef,
      reportedBy: req.user!.id,
    });

    await sendAlert({
      type: 'theft_report',
      imei,
      userId: req.user!.id,
      message: `Device ${imei} has been reported stolen. Case #${report._id}`,
    });

    res.status(201).json({ reportId: report._id, message: 'Device reported stolen and blacklisted' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/imei/my-reports — all theft reports for devices owned by current user
router.get('/my-reports', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = await Device.find({ owner: req.user!.id }).select('imei make model status _id').lean();
    const imeis = devices.map(d => d.imei);

    const reports = await TheftReport.find({ imei: { $in: imeis } })
      .sort({ createdAt: -1 })
      .lean();

    const deviceMap = Object.fromEntries(devices.map(d => [d.imei, d]));
    const enriched = reports.map(r => ({ ...r, device: deviceMap[r.imei] || null }));

    res.json({ reports: enriched });
  } catch (err) { next(err); }
});

// GET /api/imei/:imei — public lookup (IMEI check)
router.get('/:imei', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    if (!/^\d{15,17}$/.test(imei)) {
      return res.status(400).json({ error: 'Invalid IMEI format' });
    }

    let callerId: string | null = null;
    let callerRole: string | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string; role: string };
        callerId = payload.id;
        callerRole = payload.role;
      } catch { /* unauthenticated — fine */ }
    }

    const device = await Device.findOne({ imei }).lean();
    const report = await TheftReport.findOne({ imei, status: { $in: ['open', 'investigating'] } }).lean();
    const riskScore = await computeRiskScore(imei);

    const isOwner = device?.owner && callerId && device.owner.toString() === callerId;
    const isAdmin = callerRole === 'admin' || callerRole === 'law_enforcement';

    const response: any = {
      imei,
      found: !!device,
      status: device?.status ?? 'unknown',
      make: device?.make ?? null,
      model: device?.model ?? null,
      stolen: !!report,
      riskScore,
      lastSeen: device?.lastSeen ?? null,
      reportRef: report?._id ?? null,
    };

    if (isOwner || isAdmin) {
      response.serialNumber = device?.serialNumber ?? null;
      response.fingerprint = device?.fingerprint ?? null;
    }

    res.json(response);
  } catch (err) { next(err); }
});

// PATCH /api/imei/:imei/status — admin: update device status
router.patch('/:imei/status', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({
      status: z.enum(['active', 'stolen', 'recovered', 'blacklisted'])
    }).parse(req.body);

    const device = await Device.findOneAndUpdate(
      { imei: req.params.imei },
      { status },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });

    if (status === 'recovered') {
      await TheftReport.updateMany(
        { imei: req.params.imei, status: { $in: ['open', 'investigating'] } },
        { status: 'recovered', resolvedAt: new Date() }
      );
    }

    res.json(device);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// GET /api/imei/:imei/history — location history for a device
router.get('/:imei/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const pings = await Ping.find({ imei: req.params.imei })
      .sort({ ts: -1 })
      .limit(limit)
      .select('lat lng ts simIccid networkOp');
    res.json(pings);
  } catch (err) { next(err); }
});

export default router;
