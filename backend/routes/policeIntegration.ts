// routes/policeIntegration.ts - Law Enforcement Integration API endpoints
import { Router, Request, Response, NextFunction } from "express";
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

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Police Station Management ─────────────────────────────────────────────────────
router.post("/stations", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/stations", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters: any = {};
    if (req.query.county) filters.county = req.query.county;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.stationType) filters.stationType = req.query.stationType;

    const stations = await getPoliceStations(filters);
    res.json({ stations, count: stations.length });
  } catch (err) { next(err); }
});

router.get("/stations/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const station = await getPoliceStation(id as string);
    res.json(station);
  } catch (err) { next(err); }
});

router.patch("/stations/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const station = await updatePoliceStation(id as string, req.body);
    res.json(station);
  } catch (err) { next(err); }
});

router.get("/stations/nearby", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng required" });
    }

    const stations = await getNearbyStations(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseFloat(radius as string) : 50
    );
    res.json({ stations, count: stations.length });
  } catch (err) { next(err); }
});

// ── Police Report System ─────────────────────────────────────────────────────────
router.post("/reports", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      userId: req.user!.id,
      reportDate: new Date(data.reportDate),
      incidentDate: new Date(data.incidentDate),
    });

    res.status(201).json(report);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/reports/:id/confirm", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      confirmationNotes: z.string().optional(),
    });

    const { id } = req.params;
    const { confirmationNotes } = schema.parse(req.body);
    const report = await confirmPoliceReport(id as string, req.user!.id, confirmationNotes);
    res.json(report);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/reports/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await getPoliceReport(id as string);
    res.json(report);
  } catch (err) { next(err); }
});

router.get("/reports/station/:stationId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;
    const reports = await getPoliceReportsByStation(stationId as string);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.get("/reports/device/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const reports = await getPoliceReportsByDevice(deviceId as string);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.post("/reports/:id/evidence", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.string(),
      url: z.string(),
      description: z.string().optional(),
    });

    const { id } = req.params;
    const evidenceData = schema.parse(req.body);
    const report = await addEvidenceToReport(id as string, evidenceData);
    res.json(report);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Nationwide Alert System ───────────────────────────────────────────────────────
router.post("/alerts", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/alerts/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await getNationwideAlert(id as string);
    res.json(alert);
  } catch (err) { next(err); }
});

router.get("/alerts", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const alerts = await getActiveNationwideAlerts();
    res.json({ alerts, count: alerts.length });
  } catch (err) { next(err); }
});

router.post("/alerts/:id/sighting", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      }),
      description: z.string().optional(),
      photo: z.string().optional(),
    });

    const { id } = req.params;
    const data = schema.parse(req.body);
    const alert = await reportSighting(id as string, data, req.user!.id);
    res.json(alert);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/alerts/:id/deactivate", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await deactivateAlert(id as string);
    res.json(alert);
  } catch (err) { next(err); }
});

// ── Case Transfer System ─────────────────────────────────────────────────────────
router.post("/case-transfers", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      policeReportId: z.string(),
      fromStationId: z.string(),
      toStationId: z.string(),
      transferReason: z.string(),
    });

    const data = schema.parse(req.body);
    const transfer = await requestCaseTransfer({ ...data, requestedBy: req.user!.id });
    res.status(201).json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/case-transfers/:id/accept", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transfer = await acceptCaseTransfer(id as string, req.user!.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/case-transfers/:id/reject", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rejectionReason: z.string(),
    });

    const { id } = req.params;
    const { rejectionReason } = schema.parse(req.body);
    const transfer = await rejectCaseTransfer(id as string, req.user!.id, rejectionReason);
    res.json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/case-transfers/:id/complete", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transfer = await completeCaseTransfer(id as string, req.user!.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

// ── Recovery Workflow ─────────────────────────────────────────────────────────────
router.post("/recovery", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/recovery/:id/stage", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      stage: z.enum(["reported", "investigating", "tracking", "located", "recovered", "returned", "closed"]),
      notes: z.string().optional(),
    });

    const { id } = req.params;
    const { stage, notes } = schema.parse(req.body);
    const workflow = await updateRecoveryStage(id as string, stage, notes, req.user!.id);
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/recovery/:id/investigators", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      investigatorId: z.string(),
    });

    const { id } = req.params;
    const { investigatorId } = schema.parse(req.body);
    const workflow = await addInvestigator(id as string, investigatorId);
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/recovery/:id/locate", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const workflow = await locateDevice(id as string, locationData, req.user!.id);
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/recovery/:id/recover", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    const workflow = await recoverDevice(id as string, recoveryData, req.user!.id);
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/recovery/:id/return", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      returnCondition: z.string(),
    });

    const { id } = req.params;
    const { returnCondition } = schema.parse(req.body);
    const workflow = await returnDeviceToOwner(id as string, returnCondition, req.user!.id);
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/recovery/:id/arrests", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      suspectName: z.string(),
      arrestDate: z.date().or(z.string()),
      charges: z.array(z.string()),
      caseNumber: z.string().optional(),
    });

    const { id } = req.params;
    const arrestData = schema.parse(req.body);
    const workflow = await addArrest(id as string, {
      ...arrestData,
      arrestDate: new Date(arrestData.arrestDate),
    });
    res.json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Court Case Integration ───────────────────────────────────────────────────────
router.post("/court-cases", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/court-cases/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const courtCase = await updateCourtCase(id as string, req.body);
    res.json(courtCase);
  } catch (err) { next(err); }
});

// ── Interpol Integration ─────────────────────────────────────────────────────────
router.post("/interpol", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/interpol/:id/publish", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const interpolCase = await publishInterpolNotice(id as string);
    res.json(interpolCase);
  } catch (err) { next(err); }
});

router.post("/interpol/:id/response", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      country: z.string(),
      agency: z.string(),
      response: z.string(),
    });

    const { id } = req.params;
    const responseData = schema.parse(req.body);
    const interpolCase = await addInterpolResponse(id as string, responseData);
    res.json(interpolCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getPoliceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
