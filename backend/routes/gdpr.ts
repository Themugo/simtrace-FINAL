// routes/gdpr.ts - GDPR Compliance API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createGdprRequest,
  getGdprRequest,
  getGdprRequestsByUser,
  processGdprRequest,
  rejectGdprRequest,
  setDataResidency,
  getDataResidency,
  updateDataResidency,
  checkGdprCompliance,
  getGdprStatistics,
  getExportUrl,
} from "../services/gdpr.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── GDPR Request Management ─────────────────────────────────────────────────────
router.post("/requests", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      requestType: z.enum(["data_export", "data_deletion", "access_request", "rectification"]),
    });

    const data = schema.parse(req.body);
    const request = await createGdprRequest({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(request);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/requests/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await getGdprRequest(String(id));

    if (!request) {
      return res.status(404).json({ error: "GDPR request not found" });
    }

    res.json(request);
  } catch (err) { next(err); }
});

router.get("/requests", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requests = await getGdprRequestsByUser(req.user!.id);
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.post("/requests/:id/process", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await processGdprRequest(String(id), req.user!.id);
    res.json(request);
  } catch (err) { next(err); }
});

router.post("/requests/:id/reject", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const request = await rejectGdprRequest(String(id), reason);

    res.json(request);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/requests/:id/export", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const exportUrl = await getExportUrl(String(id));
    res.json({ exportUrl });
  } catch (err) { next(err); }
});

// ── Data Residency Management ─────────────────────────────────────────────────────
router.post("/residency", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      region: z.enum(["eu", "us", "africa", "asia", "global"]),
      storageLocations: z.array(z.object({
        provider: z.string(),
        region: z.string(),
        dataTypes: z.array(z.string()),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const residency = await setDataResidency({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(residency);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/residency", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const residency = await getDataResidency(req.user!.id);
    res.json(residency);
  } catch (err) { next(err); }
});

router.patch("/residency", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const residency = await updateDataResidency(req.user!.id, req.body);
    res.json(residency);
  } catch (err) { next(err); }
});

// ── Compliance Check ───────────────────────────────────────────────────────────
router.get("/compliance", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const compliance = await checkGdprCompliance(req.user!.id);
    res.json(compliance);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getGdprStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
