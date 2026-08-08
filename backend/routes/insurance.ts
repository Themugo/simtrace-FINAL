// routes/insurance.ts - Insurance Tech API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createInsurancePolicy,
  getInsurancePolicy,
  getPoliciesByUser,
  updatePolicyStatus,
  createInsuranceClaim,
  getInsuranceClaim,
  getClaimsByUser,
  updateClaimStatus,
  addClaimEvidence,
  markDeviceRecovered,
  getInsuranceStatistics,
  getProviderStatistics,
  checkPolicyExpiry,
  renewPolicy,
} from "../services/insurance.js";

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Policy Management ─────────────────────────────────────────────────────────────
router.post("/policies", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      provider: z.string(),
      providerId: z.string(),
      coverageType: z.enum(["theft", "damage", "loss", "comprehensive"]),
      devices: z.array(z.string()),
      premium: z.number(),
      currency: z.string().default("KES"),
      deductible: z.number().default(0),
      coverageLimit: z.number(),
      startDate: z.date(),
      endDate: z.date(),
    });

    const data = schema.parse(req.body);
    const policy = await createInsurancePolicy({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(policy);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/policies/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const policy = await getInsurancePolicy(id as string);

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.json(policy);
  } catch (err) { next(err); }
});

router.get("/policies", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const policies = await getPoliciesByUser(req.user!.id);
    res.json({ policies, count: policies.length });
  } catch (err) { next(err); }
});

router.patch("/policies/:id/status", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["active", "expired", "cancelled", "pending"]),
    });

    const { id } = req.params;
    const { status } = schema.parse(req.body);
    const policy = await updatePolicyStatus(id as string, status);

    res.json(policy);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/policies/:id/renew", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      newEndDate: z.date(),
    });

    const { id } = req.params;
    const { newEndDate } = schema.parse(req.body);
    const policy = await renewPolicy(id as string, newEndDate);

    res.json(policy);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── Claim Management ─────────────────────────────────────────────────────────────
router.post("/claims", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      policyId: z.string(),
      deviceId: z.string(),
      claimType: z.enum(["theft", "damage", "loss"]),
      incidentDate: z.date(),
      incidentLocation: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
        address: z.string().optional(),
      }).optional(),
      description: z.string(),
      evidence: z.array(z.object({
        type: z.string(),
        url: z.string(),
        description: z.string(),
      })).optional(),
      policeReportNumber: z.string().optional(),
      policeStation: z.string().optional(),
      claimedAmount: z.number(),
      currency: z.string().default("KES"),
    });

    const data = schema.parse(req.body);
    const claim = await createInsuranceClaim({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(claim);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/claims/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const claim = await getInsuranceClaim(id as string);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    res.json(claim);
  } catch (err) { next(err); }
});

router.get("/claims", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const claims = await getClaimsByUser(req.user!.id);
    res.json({ claims, count: claims.length });
  } catch (err) { next(err); }
});

router.patch("/claims/:id/status", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["submitted", "under_review", "investigating", "approved", "rejected", "paid", "closed"]),
      assessmentNotes: z.string().optional(),
      approvedAmount: z.number().optional(),
    });

    const { id } = req.params;
    const { status, assessmentNotes, approvedAmount } = schema.parse(req.body);
    const claim = await updateClaimStatus(String(id), status, req.user!.id, assessmentNotes, approvedAmount);

    res.json(claim);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/claims/:id/evidence", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.string(),
      url: z.string(),
      description: z.string(),
    });

    const { id } = req.params;
    const evidence = schema.parse(req.body);
    const claim = await addClaimEvidence(id as string, evidence);

    res.json(claim);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/claims/:id/recovered", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const claim = await markDeviceRecovered(id as string);
    res.json(claim);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getInsuranceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/stats/provider/:providerId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const stats = await getProviderStatistics(providerId as string);
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Policy Expiry Check ─────────────────────────────────────────────────────────
router.post("/check-expiry", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await checkPolicyExpiry();
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
