import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Ping, Device } from "../db/index.js";
import { getIO } from "../services/socket.js";
import { runIntelligence } from "../services/intelligence.js";
import pino from "pino";

const log = pino({ level: "info" }).child({ service: "track" });

const router = Router();

interface PingRequest extends Request {
  pingVerified?: boolean;
}

// ── Device key auth middleware ─────────────────────────────────────────────────
// Mobile agent must send X-Device-Key: <deviceKey> in every ping request.
// The key is returned once on device registration (POST /api/imei/register).
// If the key is missing or wrong, we still accept the ping but mark it unverified
// so intelligence can weight it lower. In a stricter mode, set TRACK_REQUIRE_AUTH=true.
async function deviceKeyAuth(req: PingRequest, res: Response, next: NextFunction) {
  const key  = req.headers["x-device-key"] as string;
  const imei = req.body?.imei;

  if (!key || !imei) {
    if (process.env.TRACK_REQUIRE_AUTH === "true") {
      return res.status(401).json({ error: "X-Device-Key header required" });
    }
    req.pingVerified = false;
    return next();
  }

  const device = await Device.findOne({ imei }).select("deviceKey").lean();
  if (!device?.deviceKey) {
    // Device not registered — accept but mark unverified
    req.pingVerified = false;
    return next();
  }

  if (device.deviceKey !== key) {
    return res.status(401).json({ error: "Invalid device key" });
  }

  req.pingVerified = true;
  next();
}

const pingSchema = z.object({
  imei:      z.string().min(15).max(17).regex(/^\d+$/, "IMEI must be numeric"),
  lat:       z.number().min(-90).max(90),
  lng:       z.number().min(-180).max(180),
  accuracy:  z.number().optional(),
  simIccid:  z.string().optional(),
  networkOp: z.string().optional(),
  fingerprint: z.object({
    networkMac:   z.string().optional(),
    bluetoothMac: z.string().optional(),
    screenRes:    z.string().optional(),
    osVersion:    z.string().optional(),
    buildId:      z.string().optional(),
  }).optional(),
});

// POST /api/track — called by the mobile agent on the tracked device
router.post("/", deviceKeyAuth, async (req: PingRequest, res: Response, next: NextFunction) => {
  try {
    const data = pingSchema.parse(req.body);

    // 1. Persist ping
    const ping = await Ping.create({
      imei:      data.imei,
      lat:       data.lat,
      lng:       data.lng,
      accuracy:  data.accuracy,
      simIccid:  data.simIccid,
      networkOp: data.networkOp,
      ipAddress: req.ip,
      verified:  req.pingVerified ?? false,
    });

    // 2. Update device last seen + fingerprint
    const device = await Device.findOneAndUpdate(
      { imei: data.imei },
      {
        lastSeen: new Date(),
        ...(data.fingerprint && { fingerprint: data.fingerprint }),
      },
      { new: true }
    );

    // 3. Run intelligence (async — don't block response)
    runIntelligence({ ping, device: device as any }).catch(err => log.error({ err, imei: data.imei }, "Intelligence failed"));

    // 4. Emit real-time location to subscribed dashboard clients
    getIO().to(`device:${data.imei}`).emit("location_update", {
      imei:     data.imei,
      lat:      data.lat,
      lng:      data.lng,
      ts:       ping.ts,
      verified: req.pingVerified ?? false,
    });
    // Also emit to admin room for showAll map
    getIO().to("role:admin").emit("location_update", {
      imei:     data.imei,
      lat:      data.lat,
      lng:      data.lng,
      ts:       ping.ts,
      status:   device?.status ?? "unknown",
      verified: req.pingVerified ?? false,
    });

    res.json({ success: true, pingId: ping._id });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
