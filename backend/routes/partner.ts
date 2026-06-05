import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { authenticate, requireAdmin, requireRole } from "../middleware/auth.js";
import { Partner, User } from "../db/index.js";
import { generateApiKey, bulkImeiCheck, getPartnerStats, validatePartnerKey } from "../services/partner.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

interface PartnerRequest extends Request {
  partner?: any;
}

// ── Partner API key middleware ─────────────────────────────────────────────────
async function partnerAuth(req: PartnerRequest, res: Response, next: NextFunction) {
  const key = req.headers["x-partner-key"] as string;
  if (!key) return res.status(401).json({ error: "Partner API key required" });
  try {
    req.partner = await validatePartnerKey(key);
    if (!req.partner) return res.status(401).json({ error: "Invalid partner key" });
    next();
  } catch (err) {
    res.status(429).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

// POST /api/partner/register — apply for partner access
router.post("/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      orgName: z.string().min(2).max(100),
      orgType: z.enum(["telecom", "law_enforcement", "marketplace", "insurance"]),
      country: z.string().length(2).optional(),
      webhookUrl: z.string().url().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await Partner.findOne({ user: req.user!.id });
    if (existing) return res.status(409).json({ error: "Partner account already exists" });

    const apiKey = generateApiKey();
    const partner = await Partner.create({
      ...data,
      user:    req.user!.id,
      apiKey,
      status:  "pending",   // admin reviews
    });

    // SECURITY: do NOT grant a privileged role here. Granting it at self-service
    // registration let any authenticated user become law_enforcement/telecom (and
    // reach criminal/PII routes) with no review. The partner stays "pending"; an
    // admin grants the role on approval via PATCH /api/admin/users/:id/role.

    res.status(201).json({
      message: "Partner application submitted — pending admin review",
      partnerId: partner._id,
      apiKey,                // show once
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/partner/me — partner profile + usage
router.get("/me", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ user: req.user!.id });
    if (!partner) return res.status(404).json({ error: "No partner account found" });
    res.json(await getPartnerStats(String(partner._id)));
  } catch (err) { next(err); }
});

// POST /api/partner/imei/check — single IMEI check via partner key
router.post("/imei/check", partnerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = z.object({ imei: z.string().min(15).max(17) }).parse(req.body);
    const [result] = await bulkImeiCheck([imei]);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/partner/imei/bulk — bulk IMEI check (up to 500)
router.post("/imei/bulk", partnerAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imeis } = z.object({
      imeis: z.array(z.string().min(15).max(17)).min(1).max(500),
    }).parse(req.body);

    const results = await bulkImeiCheck(imeis);
    res.json({
      checked:   results.length,
      flagged:   results.filter(r => r.risk === "HIGH").length,
      results,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Per-partner /:id routes — AFTER named routes ────────────────────────────────

// PATCH /api/partner/:id/webhook — update webhook URL
router.patch("/:id/webhook", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { webhookUrl } = z.object({ webhookUrl: z.string().url() }).parse(req.body);
    const partner = await Partner.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { webhookUrl, webhookSecret: generateApiKey() },
      { new: true }
    );
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    res.json({ webhookUrl: partner.webhookUrl, webhookSecret: partner.webhookSecret });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/partner/:id/regenerate-key — rotate API key
router.post("/:id/regenerate-key", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const newKey = generateApiKey();
    const partner = await Partner.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.id },
      { apiKey: newKey },
      { new: true }
    );
    if (!partner) return res.status(404).json({ error: "Not found" });
    res.json({ apiKey: newKey, message: "Old key is now invalid" });
  } catch (err) { next(err); }
});

// POST /api/partner/:id/webhook-test — send a test payload to the partner's webhook URL
router.post("/:id/webhook-test", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ _id: req.params.id, user: req.user!.id });
    if (!partner)          return res.status(404).json({ error: "Partner not found" });
    if (!partner.webhookUrl) return res.status(400).json({ error: "No webhook URL configured" });

    const testPayload = {
      event:     "test.ping",
      timestamp: new Date().toISOString(),
      partner:   partner.orgName,
      data: {
        imei:      "356938035643809",
        status:    "stolen",
        riskScore: 85,
        message:   "This is a SimTrace webhook test event",
      },
    };

    const sig = crypto
      .createHmac("sha256", partner.webhookSecret || "test-secret")
      .update(JSON.stringify(testPayload))
      .digest("hex");

    const startTime = Date.now();
    try {
      const response = await fetch(partner.webhookUrl, {
        method:  "POST",
        headers: {
          "Content-Type":        "application/json",
          "X-SimTrace-Signature": `sha256=${sig}`,
          "X-SimTrace-Event":     "test.ping",
        },
        body:    JSON.stringify(testPayload),
        signal:  AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - startTime;
      res.json({
        success:    response.ok,
        statusCode: response.status,
        latencyMs,
        webhookUrl: partner.webhookUrl,
        message:    response.ok ? "Webhook delivered successfully" : `Server returned ${response.status}`,
      });
    } catch (fetchErr) {
      res.json({
        success:    false,
        latencyMs:  Date.now() - startTime,
        webhookUrl: partner.webhookUrl,
        message:    fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      });
    }
  } catch (err) { next(err); }
});

export default router;
