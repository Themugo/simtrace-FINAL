import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { User, Subscription, Device } from '../db/index.js';

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-passwordHash -apiKey').sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(users.map(async (u: any) => {
      const [sub, deviceCount] = await Promise.all([
        Subscription.findOne({ user: u._id }).select('plan status extraDevices').lean(),
        Device.countDocuments({ owner: u._id }),
      ]);
      return { ...u, subscription: sub, deviceCount };
    }));

    res.json(enriched);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = z.object({
      role: z.enum(['user', 'admin', 'telecom', 'law_enforcement'])
    }).parse(req.body);

    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
