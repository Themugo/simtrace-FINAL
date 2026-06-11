import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import { LawEnforcementCase, User } from "../db/index.js";

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string } }

// GET /api/law-enforcement-cases — get law enforcement cases
router.get("/", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.string().optional(),
      priority: z.string().optional(),
      agency: z.string().optional(),
      assignedTo: z.string().optional(),
    });
    const { status, priority, agency, assignedTo } = schema.parse(req.query);

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (agency) query.agency = agency;
    if (assignedTo) query.assignedTo = assignedTo;

    const cases = await LawEnforcementCase.find(query)
      .populate("assignedTo", "name email")
      .populate("relatedDevices", "imei make model")
      .populate("collaborators.userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ cases, total: cases.length });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// GET /api/law-enforcement-cases/:id — get case details
router.get("/:id", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const caseData = await LawEnforcementCase.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("relatedDevices", "imei make model")
      .populate("evidence.uploadedBy", "name email")
      .populate("notes.addedBy", "name email")
      .populate("collaborators.userId", "name email");

    if (!caseData) return res.status(404).json({ error: "Case not found" });

    return res.json(caseData);
  } catch (err) { next(err); }
});

// POST /api/law-enforcement-cases — create new case
router.post("/", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      agency: z.string().min(1),
      priority: z.enum(["low", "medium", "high", "critical"]),
      relatedImeis: z.array(z.string()),
    });
    const data = schema.parse(req.body);

    // Generate case number
    const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newCase = await LawEnforcementCase.create({
      caseNumber,
      title: data.title,
      description: data.description,
      assignedTo: req.user!.id,
      agency: data.agency,
      priority: data.priority,
      relatedImeis: data.relatedImeis || [],
      relatedDevices: [],
      evidence: [],
      notes: [],
      collaborators: [],
    });

    return res.status(201).json(newCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// PUT /api/law-enforcement-cases/:id — update case
router.put("/:id", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["open", "investigating", "evidence_collection", "prosecution", "closed", "archived"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      assignedTo: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const caseData = await LawEnforcementCase.findById(req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const updatedCase = await LawEnforcementCase.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        updatedAt: new Date(),
        ...(data.status === "closed" || data.status === "archived" ? { closedAt: new Date() } : {}),
      },
      { new: true }
    );

    return res.json(updatedCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// POST /api/law-enforcement-cases/:id/evidence — add evidence to case
router.post("/:id/evidence", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.string().min(1),
      description: z.string().min(1),
    });
    const data = schema.parse(req.body);

    const caseData = await LawEnforcementCase.findById(req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const evidenceId = `EVID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newEvidence = {
      id: evidenceId,
      type: data.type,
      description: data.description,
      uploadedBy: req.user!.id,
      uploadedAt: new Date(),
      chainOfCustody: [{
        handler: req.user!.id,
        action: "uploaded",
        timestamp: new Date(),
      }],
    };

    await LawEnforcementCase.findByIdAndUpdate(
      req.params.id,
      {
        $push: { evidence: newEvidence },
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(201).json(newEvidence);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// POST /api/law-enforcement-cases/:id/evidence/:evidenceId/custody — update chain of custody
router.post("/:id/evidence/:evidenceId/custody", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      action: z.string().min(1),
      notes: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const caseData = await LawEnforcementCase.findById(req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const evidence = caseData.evidence.find(e => e.id === req.params.evidenceId);
    if (!evidence) return res.status(404).json({ error: "Evidence not found" });

    const custodyEntry = {
      handler: req.user!.id,
      action: data.action,
      timestamp: new Date(),
      notes: data.notes,
    };

    await LawEnforcementCase.findByIdAndUpdate(
      req.params.id,
      {
        $push: { "evidence.$.chainOfCustody": custodyEntry },
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(201).json(custodyEntry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// POST /api/law-enforcement-cases/:id/notes — add note to case
router.post("/:id/notes", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      content: z.string().min(1),
      isInternal: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    const caseData = await LawEnforcementCase.findById(req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const newNote = {
      addedBy: req.user!.id,
      content: data.content,
      timestamp: new Date(),
      isInternal: data.isInternal || false,
    };

    await LawEnforcementCase.findByIdAndUpdate(
      req.params.id,
      {
        $push: { notes: newNote },
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(201).json(newNote);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

// POST /api/law-enforcement-cases/:id/collaborators — add collaborator to case
router.post("/:id/collaborators", authenticate, requireRole("law_enforcement"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      role: z.string().min(1),
      agency: z.string().min(1),
    });
    const data = schema.parse(req.body);

    const caseData = await LawEnforcementCase.findById(req.params.id);
    if (!caseData) return res.status(404).json({ error: "Case not found" });

    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newCollaborator = {
      userId: data.userId,
      role: data.role,
      agency: data.agency,
      addedAt: new Date(),
    };

    await LawEnforcementCase.findByIdAndUpdate(
      req.params.id,
      {
        $push: { collaborators: newCollaborator },
        updatedAt: new Date(),
      },
      { new: true }
    );

    return res.status(201).json(newCollaborator);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    return next(err);
  }
});

export default router;
