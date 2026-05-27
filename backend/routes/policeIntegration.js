// routes/policeIntegration.js - Law Enforcement Integration API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createPoliceStation,
  getPoliceStations,
  getPoliceStation,
  updatePoliceStation,
  getNearbyStations,
  createPoliceReport,
  confirmPoliceReport,
  getPoliceReport,
  getPoliceReportsByStation,
  getPoliceReportsByDevice,
  addEvidenceToReport,
  createNationwideAlert,
  getNationwideAlert,
  getActiveNationwideAlerts,
  reportSighting,
  deactivateAlert,
  requestCaseTransfer,
  acceptCaseTransfer,
  rejectCaseTransfer,
  completeCaseTransfer,
  createRecoveryWorkflow,
  updateRecoveryStage,
  addInvestigator,
  locateDevice,
  recoverDevice,
  returnDeviceToOwner,
  addArrest,
  createCourtCase,
  updateCourtCase,
  createInterpolCase,
  publishInterpolNotice,
  addInterpolResponse,
  getPoliceStatistics,
} from "../services/policeIntegration.js";

const router = Router();

// ── Police Station Management ─────────────────────────────────────────────────────
router.post("/stations", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      stationCode: z.string(),
      stationName: z.string(),
      stationType: z.enum(["headquarters", "regional", "divisional", "post"]),
      address: z.string(),
      county: z.string(),
      subCounty: z.string().optional(),
      ward: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().optional(),
      }),
      phone: z.string().optional(),
      email: z.string().optional(),
      oicName: z.string().optional(),
      oicPhone: z.string().optional(),
      jurisdiction: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const station = await createPoliceStation(data);
    res.status(201).json(station);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/stations", authenticate, async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.county) filters.county = req.query.county;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.stationType) filters.stationType = req.query.stationType;

    const stations = await getPoliceStations(filters);
    res.json({ stations, count: stations.length });
  } catch (err) { next(err); }
});

router.get("/stations/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const station = await getPoliceStation(id);
    res.json(station);
  } catch (err) { next(err); }
});

router.patch("/stations/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const station = await updatePoliceStation(id, req.body);
    res.json(station);
  } catch (err) { next(err); }
});

router.get("/stations/nearby", authenticate, async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const stations = await getNearbyStations(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 50
    );
    res.json({ stations, count: stations.length });
  } catch (err) { next(err); }
});

// ── Police Report System ─────────────────────────────────────────────────────────
router.post("/reports", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      stationId: z.string(),
      obNumber: z.string(),
      reportDate: z.string().or(z.date()),
      incidentDate: z.string().or(z.date()),
      incidentLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        description: z.string().optional(),
      }),
      incidentType: z.enum(["theft", "robbery", "snatch", "lost", "other"]),
      incidentDescription: z.string().optional(),
      abstractNumber: z.string().optional(),
      abstractFile: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const report = await createPoliceReport({
      ...data,
      userId: req.user.id,
      reportDate: new Date(data.reportDate),
      incidentDate: new Date(data.incidentDate),
    });

    res.status(201).json(report);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/reports/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      confirmationNotes: z.string().optional(),
    });

    const { id } = req.params;
    const { confirmationNotes } = schema.parse(req.body);
    const report = await confirmPoliceReport(id, req.user.id, confirmationNotes);
    res.json(report);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/reports/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await getPoliceReport(id);
    res.json(report);
  } catch (err) { next(err); }
});

router.get("/reports/station/:stationId", authenticate, async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const reports = await getPoliceReportsByStation(stationId);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.get("/reports/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const reports = await getPoliceReportsByDevice(deviceId);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.post("/reports/:id/evidence", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.string(),
      url: z.string(),
      description: z.string().optional(),
    });

    const { id } = req.params;
    const evidenceData = schema.parse(req.body);
    const report = await addEvidenceToReport(id, evidenceData);
    res.json(report);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Nationwide Alert System ───────────────────────────────────────────────────────
router.post("/alerts", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      policeReport: z.string(),
      alertType: z.enum(["stolen", "wanted", "missing_person"]),
      alertLevel: z.enum(["low", "medium", "high", "critical"]),
      deviceDescription: z.string().optional(),
      devicePhoto: z.string().optional(),
      uniqueFeatures: z.string().optional(),
      lastKnownLocation: z.object({
        lat: z.number(),
        lng: z.number(),
        timestamp: z.date().optional(),
      }),
    });

    const data = schema.parse(req.body);
    const alert = await createNationwideAlert(data);
    res.status(201).json(alert);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/alerts/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await getNationwideAlert(id);
    res.json(alert);
  } catch (err) { next(err); }
});

router.get("/alerts/active", authenticate, async (req, res, next) => {
  try {
    const alerts = await getActiveNationwideAlerts();
    res.json({ alerts, count: alerts.length });
  } catch (err) { next(err); }
});

router.post("/alerts/:id/sighting", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      station: z.string(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      notes: z.string().optional(),
    });

    const { id } = req.params;
    const sightingData = schema.parse(req.body);
    const alert = await reportSighting(id, {
      ...sightingData,
      reportedBy: req.user.id,
    });
    res.json(alert);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/alerts/:id/deactivate", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const alert = await deactivateAlert(id, reason);
    res.json(alert);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Case Transfer System ─────────────────────────────────────────────────────────
router.post("/transfers", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      policeReportId: z.string(),
      deviceId: z.string(),
      fromStationId: z.string(),
      toStationId: z.string(),
      transferReason: z.enum(["jurisdiction", "capacity", "specialization", "request"]),
      transferNotes: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const transfer = await requestCaseTransfer({
      ...data,
      requestedBy: req.user.id,
    });

    res.status(201).json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/transfers/:id/accept", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await acceptCaseTransfer(id, req.user.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/transfers/:id/reject", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      rejectionReason: z.string(),
    });

    const { id } = req.params;
    const { rejectionReason } = schema.parse(req.body);
    const transfer = await rejectCaseTransfer(id, req.user.id, rejectionReason);
    res.json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/transfers/:id/complete", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await completeCaseTransfer(id);
    res.json(transfer);
  } catch (err) { next(err); }
});

// ── Recovery Workflow ─────────────────────────────────────────────────────────────
router.post("/recovery", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      policeReportId: z.string(),
      stationId: z.string(),
    });

    const data = schema.parse(req.body);
    const workflow = await createRecoveryWorkflow(data);
    res.status(201).json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.patch("/recovery/:id/stage", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      stage: z.enum(["reported", "investigating", "tracking", "located", "recovered", "returned", "closed"]),
      notes: z.string().optional(),
    });

    const { id } = req.params;
    const { stage, notes } = schema.parse(req.body);
    const workflow = await updateRecoveryStage(id, stage, notes, req.user.id);
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/recovery/:id/investigators", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      investigatorId: z.string(),
    });

    const { id } = req.params;
    const { investigatorId } = schema.parse(req.body);
    const workflow = await addInvestigator(id, investigatorId);
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/recovery/:id/locate", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      locationData: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
        description: z.string().optional(),
      }),
    });

    const { id } = req.params;
    const { locationData } = schema.parse(req.body);
    const workflow = await locateDevice(id, locationData, req.user.id);
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/recovery/:id/recover", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      recoveryData: z.object({
        notes: z.string(),
        evidence: z.array(z.object({
          type: z.string(),
          url: z.string(),
          description: z.string().optional(),
        })).optional(),
      }),
    });

    const { id } = req.params;
    const { recoveryData } = schema.parse(req.body);
    const workflow = await recoverDevice(id, recoveryData, req.user.id);
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/recovery/:id/return", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      returnCondition: z.string(),
    });

    const { id } = req.params;
    const { returnCondition } = schema.parse(req.body);
    const workflow = await returnDeviceToOwner(id, returnCondition, req.user.id);
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/recovery/:id/arrests", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      suspectName: z.string(),
      arrestDate: z.date().or(z.string()),
      charges: z.array(z.string()),
      caseNumber: z.string().optional(),
    });

    const { id } = req.params;
    const arrestData = schema.parse(req.body);
    const workflow = await addArrest(id, {
      ...arrestData,
      arrestDate: new Date(arrestData.arrestDate),
    });
    res.json(workflow);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Court Case Integration ───────────────────────────────────────────────────────
router.post("/court-cases", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      policeReportId: z.string(),
      deviceId: z.string(),
      courtName: z.string(),
      courtType: z.enum(["magistrate", "high_court", "appeal", "supreme"]),
      courtLocation: z.string().optional(),
      caseNumber: z.string(),
      caseType: z.enum(["criminal", "civil"]),
      charges: z.array(z.object({
        section: z.string(),
        description: z.string(),
        penalty: z.string().optional(),
      })).optional(),
      prosecutor: z.string().optional(),
      defenseLawyer: z.string().optional(),
      judge: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const courtCase = await createCourtCase(data);
    res.status(201).json(courtCase);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.patch("/court-cases/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const courtCase = await updateCourtCase(id, req.body);
    res.json(courtCase);
  } catch (err) { next(err); }
});

// ── Interpol Integration ─────────────────────────────────────────────────────────
router.post("/interpol", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      policeReportId: z.string(),
      deviceId: z.string(),
      interpolNotice: z.enum(["red", "blue", "green", "yellow", "purple", "black"]),
      noticeNumber: z.string(),
      originatingCountry: z.string(),
      targetCountries: z.array(z.string()),
      noticeType: z.enum(["stolen_property", "missing_person", "wanted_person"]),
      description: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const interpolCase = await createInterpolCase(data);
    res.status(201).json(interpolCase);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/interpol/:id/publish", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const interpolCase = await publishInterpolNotice(id);
    res.json(interpolCase);
  } catch (err) { next(err); }
});

router.post("/interpol/:id/response", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      country: z.string(),
      agency: z.string(),
      response: z.string(),
    });

    const { id } = req.params;
    const responseData = schema.parse(req.body);
    const interpolCase = await addInterpolResponse(id, responseData);
    res.json(interpolCase);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getPoliceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
