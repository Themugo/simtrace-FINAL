// routes/telecomIntegration.js - Telecom integration API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  registerSimCard,
  updateSimCardLocation,
  flagSimCardAsStolen,
  unflagSimCard,
  getSimCardTracking,
  getSimCardTrackingByDevice,
  getSimCardTrackingByCompany,
  getSimCardTrackingByICCID,
  getSimCardTrackingByMSISDN,
  getFlaggedSimCards,
  getFlaggedSimCardsByCompany,
  recordNetworkActivity,
  getNetworkActivity,
  getNetworkActivityByDevice,
  getNetworkActivityByCompany,
  getNetworkActivityByType,
  getNetworkActivityByDateRange,
  triangulateDeviceLocation,
  calculateCommission,
} from "../services/telecomIntegration.js";

const router = Router();

// ── SIM Card Tracking ───────────────────────────────────────────────────────────────
router.post("/sim-cards", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      companyId: z.string(),
      iccid: z.string(),
      imsi: z.string(),
      msisdn: z.string(),
      mcc: z.string(),
      mnc: z.string(),
      operator: z.string(),
    });

    const data = schema.parse(req.body);
    const tracking = await registerSimCard({ ...data, createdBy: req.user.id });
    res.status(201).json(tracking);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.patch("/sim-cards/:trackingId/location", async (req, res, next) => {
  try {
    const schema = z.object({
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number(),
      }),
      cellTowerId: z.string(),
    });

    const { trackingId } = req.params;
    const data = schema.parse(req.body);
    const tracking = await updateSimCardLocation(trackingId, data.location, data.cellTowerId);
    res.json(tracking);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/sim-cards/:trackingId/flag-stolen", authenticate, async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const tracking = await flagSimCardAsStolen(trackingId, req.user.id);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.post("/sim-cards/:trackingId/unflag", authenticate, async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const tracking = await unflagSimCard(trackingId, req.user.id);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.get("/sim-cards/:trackingId", authenticate, async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const tracking = await getSimCardTracking(trackingId);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.get("/sim-cards/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const tracking = await getSimCardTrackingByDevice(deviceId);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.get("/sim-cards/company/:companyId", authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const tracking = await getSimCardTrackingByCompany(companyId);
    res.json({ tracking, count: tracking.length });
  } catch (err) { next(err); }
});

router.get("/sim-cards/iccid/:iccid", authenticate, async (req, res, next) => {
  try {
    const { iccid } = req.params;
    const tracking = await getSimCardTrackingByICCID(iccid);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.get("/sim-cards/msisdn/:msisdn", authenticate, async (req, res, next) => {
  try {
    const { msisdn } = req.params;
    const tracking = await getSimCardTrackingByMSISDN(msisdn);
    res.json(tracking);
  } catch (err) { next(err); }
});

router.get("/sim-cards/flagged", authenticate, async (req, res, next) => {
  try {
    const tracking = await getFlaggedSimCards();
    res.json({ tracking, count: tracking.length });
  } catch (err) { next(err); }
});

router.get("/sim-cards/flagged/:companyId", authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const tracking = await getFlaggedSimCardsByCompany(companyId);
    res.json({ tracking, count: tracking.length });
  } catch (err) { next(err); }
});

// ── Network Activity Tracking ─────────────────────────────────────────────────────────
router.post("/network-activity", async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      companyId: z.string(),
      activityType: z.enum(["call", "sms", "data", "location", "roaming"]),
      timestamp: z.date(),
      mcc: z.string().optional(),
      mnc: z.string().optional(),
      cellTowerId: z.string().optional(),
      lac: z.string().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number(),
      }),
      metadata: z.any().optional(),
    });

    const data = schema.parse(req.body);
    const activity = await recordNetworkActivity({ ...data, createdBy: req.user?.id });
    res.status(201).json(activity);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/network-activity/:activityId", authenticate, async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const activity = await getNetworkActivity(activityId);
    res.json(activity);
  } catch (err) { next(err); }
});

router.get("/network-activity/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const activities = await getNetworkActivityByDevice(deviceId);
    res.json({ activities, count: activities.length });
  } catch (err) { next(err); }
});

router.get("/network-activity/company/:companyId", authenticate, async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const activities = await getNetworkActivityByCompany(companyId);
    res.json({ activities, count: activities.length });
  } catch (err) { next(err); }
});

router.get("/network-activity/device/:deviceId/:activityType", authenticate, async (req, res, next) => {
  try {
    const { deviceId, activityType } = req.params;
    const activities = await getNetworkActivityByType(deviceId, activityType);
    res.json({ activities, count: activities.length });
  } catch (err) { next(err); }
});

router.get("/network-activity/company/:companyId/date-range", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      startDate: z.date(),
      endDate: z.date(),
    });

    const { companyId } = req.params;
    const data = schema.parse(req.body);
    const activities = await getNetworkActivityByDateRange(companyId, data.startDate, data.endDate);
    res.json({ activities, count: activities.length });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Cell Tower Triangulation ─────────────────────────────────────────────────────────
router.post("/triangulate/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const location = await triangulateDeviceLocation(deviceId);
    res.json(location);
  } catch (err) { next(err); }
});

// ── Commission Calculation ────────────────────────────────────────────────────────────
router.post("/commission/:companyId/:deviceId", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      recovery: z.boolean(),
    });

    const { companyId, deviceId } = req.params;
    const data = schema.parse(req.body);
    const commission = await calculateCommission(companyId, deviceId, data.recovery);
    res.json({ commission });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
