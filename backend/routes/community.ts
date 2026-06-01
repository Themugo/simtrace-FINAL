import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Inline schema — sightings don't need their own model file
const sightingSchema = new mongoose.Schema({
  imei:       { type: String, required: true, index: true },
  location:   { type: String, required: true },
  notes:      String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt:  { type: Date, default: Date.now },
});
const Sighting = (mongoose.models.Sighting || mongoose.model("Sighting", sightingSchema)) as mongoose.Model<any>;

const sightingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: "Too many sightings submitted" } });

// GET /api/community/sightings — public
router.get("/sightings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sightings = await Sighting.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-reportedBy") // don't expose reporter identity publicly
      .lean();
    res.json({ sightings });
  } catch (err) { next(err); }
});

// POST /api/community/sightings — authenticated
router.post("/sightings", authenticate, sightingLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei, location, notes } = z.object({
      imei:     z.string().min(15).max(17).regex(/^\d+$/),
      location: z.string().min(3).max(200),
      notes:    z.string().max(500).optional(),
    }).parse(req.body);

    const sighting = await Sighting.create({
      imei, location, notes, reportedBy: req.user!.id,
    });

    res.status(201).json({ id: sighting._id, message: "Sighting recorded. Thank you for helping the community." });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
