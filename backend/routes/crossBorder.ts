// routes/crossBorder.ts - Cross-Border Enforcement API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin, requireRole } from "../middleware/auth.js";
import {
  createCrossBorderRequest,
  updateRequestStatus,
  addEvidence,
  autoAcknowledgeRequest,
  checkRequestExpiry,
  getCrossBorderRequest,
  getRequestsByImei,
  getRequestsByCountry,
  getPendingRequests,
  getRequestsByTreaty,
  getCrossBorderStatistics,
  submitToInterpol,
  generateMlatRequest,
  checkCountryCompliance,
} from "../services/crossBorder.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Cross-Border Request Management ───────────────────────────────────────────────
router.post("/requests", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      recoveryCaseId: z.string().optional(),
      requestingCountry: z.string().length(2),
      targetCountry: z.string().length(2),
      requestType: z.enum(["location_request", "device_seizure", "investigation_assist", "legal_proceedings", "extradition", "evidence_sharing"]),
      treaty: z.enum(["MLAT", "INTERPOL", "BILATERAL"]).optional(),
      referenceNumber: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      requestingAuthority: z.object({
        agency: z.string(),
        contact: z.string(),
        badgeNumber: z.string(),
      }),
      targetAuthority: z.object({
        agency: z.string(),
        contact: z.string(),
        badgeNumber: z.string(),
      }),
      evidence: z.array(z.object({
        type: z.string(),
        url: z.string(),
        description: z.string(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const request = await createCrossBorderRequest(data);

    res.status(201).json(request);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/requests/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getCrossBorderRequest(id as string);

    if (!request) {
      return res.status(404).json({ error: "Cross-border request not found" });
    }

    res.json(request);
  } catch (err) { next(err); }
});

router.get("/requests/imei/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const requests = await getRequestsByImei(imei as string);
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.get("/requests/country/:country", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const { role } = req.query;
    const requests = await getRequestsByCountry(country as string, role as string);
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.get("/requests/pending", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await getPendingRequests();
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.get("/requests/treaty/:treaty", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { treaty } = req.params;
    const requests = await getRequestsByTreaty(treaty as string);
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.patch("/requests/:id/status", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["pending", "acknowledged", "in_progress", "approved", "rejected", "completed", "expired"]),
      outcome: z.string().optional(),
      outcomeDetails: z.string().optional(),
    });

    const { id } = req.params;
    const { status, outcome, outcomeDetails } = schema.parse(req.body);
    const request = await updateRequestStatus(id as string, status, outcome ?? null, outcomeDetails ?? "");

    res.json(request);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/requests/:id/evidence", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.string(),
      url: z.string(),
      description: z.string(),
    });

    const { id } = req.params;
    const evidence = schema.parse(req.body);
    const request = await addEvidence(id as string, evidence);

    res.json(request);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/requests/:id/auto-acknowledge", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await autoAcknowledgeRequest(id as string);
    res.json(request);
  } catch (err) { next(err); }
});

// ── Special Actions ───────────────────────────────────────────────────────────────
router.post("/requests/:id/interpol", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await submitToInterpol(id as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.get("/requests/:id/mlat", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await generateMlatRequest(id as string);
    res.json(document);
  } catch (err) { next(err); }
});

router.post("/check-compliance", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      requestingCountry: z.string().length(2),
      targetCountry: z.string().length(2),
    });

    const { requestingCountry, targetCountry } = schema.parse(req.body);
    const compliance = await checkCountryCompliance(requestingCountry, targetCountry);

    res.json(compliance);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getCrossBorderStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Cron Job Endpoint ───────────────────────────────────────────────────────────────
router.post("/check-expiry", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expiredCount = await checkRequestExpiry();
    res.json({ message: "Expiry check completed", expiredCount });
  } catch (err) { next(err); }
});

export default router;
