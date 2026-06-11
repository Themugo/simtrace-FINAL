import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import jwt    from "jsonwebtoken";
import { Device, TheftReport, Ping } from "../db/index.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { computeRiskScore } from "../services/intelligence.js";
import { sendAlert } from "../services/notify.js";
import { checkDeviceLimit } from "../services/billing.js";
import { reconstructLocationPath, addTimelineEvent, stitchTimeline } from "../forensics/module.js";
import { predictFraud, predictTheft } from "../ml/pipeline.js";

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string } }

// ── Luhn algorithm — validates IMEI check digit ───────────────────────────────
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
router.post("/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei:         z.string().min(15).max(17),
      serialNumber: z.string().optional(),
      make:         z.string().optional(),
      model:        z.string().optional(),
    });
    const data = schema.parse(req.body);

    if (!luhnValid(data.imei)) {
      return res.status(400).json({ error: "Invalid IMEI — failed Luhn checksum" });
    }

    const existing = await Device.findOne({ imei: data.imei });
    if (existing) return res.status(409).json({ error: "Device already registered" });

    // Enforce plan device limit
    const limit = await checkDeviceLimit(req.user!.id);
    if (!limit.canAdd) {
      return res.status(402).json({
        error:       "Device limit reached for your plan",
        plan:        limit.plan,
        deviceCount: limit.deviceCount,
        totalAllowed: limit.totalAllowed,
        extraDeviceKES: limit.extraDeviceKES,
        upgradeRequired: limit.isOverFreeLimit,
        code:        "DEVICE_LIMIT_REACHED",
      });
    }

    const deviceKey = crypto.randomBytes(32).toString("hex");
    const device = await Device.create({ ...data, owner: req.user!.id, status: "active", deviceKey });

    res.status(201).json({
      ...device.toObject(),
      deviceKey,  // ← shown ONCE — mobile agent must store this securely
      _keyWarning: "Store deviceKey securely on the device. It cannot be retrieved again.",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/imei/report-stolen — report a device as stolen
router.post("/report-stolen", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei:        z.string().min(15).max(17),
      description: z.string().max(1000).optional(),
      policeRef:   z.string().max(100).optional(),
    });
    const { imei, description, policeRef } = schema.parse(req.body);

    // Mark device blacklisted
    await Device.findOneAndUpdate({ imei }, { status: "stolen" }, { upsert: true });

    // Create report
    const report = await TheftReport.create({
      imei, description, policeRef,
      reportedBy: req.user!.id,
    });

    // Notify device owner and ops team
    await sendAlert({
      type:    "theft_report",
      imei,
      userId:  req.user!.id,
      message: `Device ${imei} has been reported stolen. Case #${report._id}`,
    });

    res.status(201).json({ reportId: report._id, message: "Device reported stolen and blacklisted" });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/imei/my-reports — all theft reports for devices owned by current user
router.get("/my-reports", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get all devices owned by user
    const devices = await Device.find({ owner: req.user!.id }).select("imei make model status _id").lean();
    const imeis   = devices.map(d => d.imei);

    // Fetch all reports in one query
    const reports = await TheftReport.find({ imei: { $in: imeis } })
      .sort({ createdAt: -1 })
      .lean();

    // Attach device info to each report
    const deviceMap = Object.fromEntries(devices.map(d => [d.imei, d]));
    const enriched  = reports.map(r => ({ ...r, device: deviceMap[r.imei] || null }));

    res.json({ reports: enriched });
  } catch (err) { next(err); }
});

// GET /api/imei/:imei — public lookup (IMEI check)
// ⚠️  NEVER return owner PII to unauthenticated callers
router.get("/:imei", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imei = String(req.params.imei);
    if (!/^\d{15,17}$/.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI format" });
    }

    // Determine caller identity (optional auth)
    let callerId   = null;
    let callerRole = null;
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as any;
        callerId   = payload.id;
        callerRole = payload.role;
      } catch { console.warn("[IMEI] JWT verify failed — unauthenticated lookup"); }
    }

    const device    = await Device.findOne({ imei }).lean();   // no populate — PII stays in DB
    const report    = await TheftReport.findOne({ imei, status: { $in: ["open", "investigating"] } }).lean();
    const riskScore = await computeRiskScore(imei);

    const isOwner = device?.owner && callerId && device.owner.toString() === callerId;
    const isAdmin = callerRole === "admin" || callerRole === "law_enforcement";

    const response: Record<string, unknown> = {
      imei,
      found:      !!device,
      status:     device?.status ?? "unknown",
      make:       device?.make   ?? null,
      model:      device?.model  ?? null,
      stolen:     !!report,
      riskScore,
      lastSeen:   device?.lastSeen ?? null,
      reportRef:  report?._id      ?? null,
    };

    // Only owner or admin gets full details
    if (isOwner || isAdmin) {
      response.serialNumber = device?.serialNumber ?? null;
      response.fingerprint  = device?.fingerprint  ?? null;
    }

    // Integrate ML predictions for authenticated users
    if (callerId) {
      try {
        // Get location history for forensics
        const pings = await Ping.find({ imei })
          .sort({ ts: -1 })
          .limit(50)
          .select("lat lng ts")
          .lean();

        if (pings.length > 0) {
          // Forensics: location reconstruction
          const locationPoints = pings.map(p => ({
            lat: p.lat,
            lng: p.lng,
            timestamp: new Date(p.ts)
          }));
          const locationReconstruction = reconstructLocationPath(device?._id?.toString() || imei, locationPoints);
          
          // Add timeline event for this check
          addTimelineEvent({
            timestamp: new Date(),
            type: 'device_detected',
            deviceId: device?._id?.toString(),
            userId: callerId,
            data: { imei, riskScore },
            source: 'api_check'
          });

          response.forensics = {
            locationReconstruction: {
              pathPoints: locationReconstruction.reconstructedPath.length,
              gaps: locationReconstruction.gaps.length,
              confidence: locationReconstruction.reconstructedPath.reduce((sum, p) => sum + p.confidence, 0) / locationReconstruction.reconstructedPath.length
            }
          };
        }

        // ML: fraud prediction
        const fraudPrediction = predictFraud({
          riskScore,
          simChanges: 0, // Would be calculated from actual data
          deviceAge: device?.createdAt ? Math.floor((Date.now() - new Date(device.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          locationChanges: pings.length
        });

        // ML: theft prediction
        const theftPrediction = predictTheft({
          riskScore,
          movementCount: pings.length,
          simChanges: 0
        });

        response.mlPredictions = {
          fraud: {
            score: fraudPrediction.prediction,
            confidence: fraudPrediction.confidence
          },
          theft: {
            likelihood: theftPrediction.prediction,
            confidence: theftPrediction.confidence
          }
        };
      } catch (mlError) {
        // Don't fail the request if ML/forensics fails
        console.error('ML/Forensics integration error:', mlError);
      }
    }

    res.json(response);
  } catch (err) { next(err); }
});

// PATCH /api/imei/:imei/status — admin: update device status
router.patch("/:imei/status", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = z.object({
      status: z.enum(["active", "stolen", "recovered", "blacklisted"])
    }).parse(req.body);

    const device = await Device.findOneAndUpdate(
      { imei: req.params.imei },
      { status },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: "Device not found" });

    if (status === "recovered") {
      await TheftReport.updateMany(
        { imei: req.params.imei, status: { $in: ["open", "investigating"] } },
        { status: "recovered", resolvedAt: new Date() }
      );
    }

    res.json(device);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/imei/:imei/history — location history for a device
router.get("/:imei/history", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const pings = await Ping.find({ imei: req.params.imei })
      .sort({ ts: -1 })
      .limit(limit)
      .select("lat lng ts simIccid networkOp");
    res.json(pings);
  } catch (err) { next(err); }
});

export default router;
