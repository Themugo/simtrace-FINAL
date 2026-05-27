// routes/cellTower.js - Cell Tower Triangulation API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  triangulateFromCellTowers,
  getSatelliteAssistedLocation,
  getHybridLocation,
  recordSatellitePing,
  getLocationHistory,
  getCellTowerStatistics,
} from "../services/cellTowerTriangulation.js";

const router = Router();

// ── Cell Tower Triangulation ─────────────────────────────────────────────────────
router.post("/triangulate", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      mcc: z.string(),
      mnc: z.string(),
      cellTowerId: z.string(),
      signalStrength: z.number().min(0).max(100),
      lac: z.string().optional(),
      cid: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const location = await triangulateFromCellTowers(data);
    res.json(location);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Satellite-Assisted Location ──────────────────────────────────────────────────
router.get("/satellite/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const location = await getSatelliteAssistedLocation(deviceId);
    res.json(location);
  } catch (err) { next(err); }
});

// ── Hybrid Location ─────────────────────────────────────────────────────────────
router.get("/hybrid/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const location = await getHybridLocation(deviceId);
    res.json(location);
  } catch (err) { next(err); }
});

// ── Record Satellite Ping ───────────────────────────────────────────────────────
router.post("/ping", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
      altitude: z.number().optional(),
      source: z.enum(["gps", "wifi", "cell_tower", "satellite", "ip_geolocation"]).optional(),
      satelliteProvider: z.string().optional(),
      satelliteId: z.string().optional(),
      signalStrength: z.number().min(0).max(100).optional(),
      cellTowerId: z.string().optional(),
      cellTowerLat: z.number().optional(),
      cellTowerLng: z.number().optional(),
      mcc: z.string().optional(),
      mnc: z.string().optional(),
      batteryLevel: z.number().min(0).max(100).optional(),
      isCharging: z.boolean().optional(),
      networkType: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const ping = await recordSatellitePing(data);
    res.status(201).json(ping);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Location History ─────────────────────────────────────────────────────────────
router.get("/history/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { hours } = req.query;
    const history = await getLocationHistory(deviceId, hours ? parseInt(hours) : 24);
    res.json({ history, count: history.length });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getCellTowerStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
