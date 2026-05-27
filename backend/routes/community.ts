import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const sightingSchema = new mongoose.Schema({
  imei: { type: String, required: true, index: true },
  location: { type: String, required: true },
  notes: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});
const Sighting = mongoose.models.Sighting || mongoose.model('Sighting', sightingSchema);

const sightingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many sightings submitted' } });

// GET /api/community/sightings
router.get('/sightings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sightings = await Sighting.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-reportedBy')
      .lean();
    res.json({ sightings });
  } catch (err) { next(err); }
});

// POST /api/community/sightings
router.post('/sightings', authenticate, sightingLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei, location, notes } = z.object({
      imei: z.string().min(15).max(17).regex(/^\d+$/),
      location: z.string().min(3).max(200),
      notes: z.string().max(500).optional(),
    }).parse(req.body);

    const sighting = await Sighting.create({
      imei, location, notes, reportedBy: req.user!.id,
    });

    res.status(201).json({ id: sighting._id, message: 'Sighting recorded. Thank you for helping the community.' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
