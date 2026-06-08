// routes/accountLockout.ts - Account lockout management API endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  isAccountLocked,
  unlockAccount,
  getLockoutRemainingTime,
} from '../services/accountLockout.js';
import { User } from '../db/index.js';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// ── Check Account Lockout Status ───────────────────────────────────────────────
router.get('/status/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const locked = await isAccountLocked(userId);
    const remainingTime = locked ? await getLockoutRemainingTime(userId) : null;

    res.json({
      locked,
      remainingMinutes: remainingTime ? Math.ceil(remainingTime / 60000) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── Unlock Account (Admin Only) ───────────────────────────────────────────────
router.post('/unlock/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const schema = z.object({
      reason: z.string().optional(),
    });

    const { reason } = schema.parse(req.body);

    await unlockAccount(userId);

    res.json({ message: 'Account unlocked successfully' });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

// ── Get User Login Attempts (Admin Only) ────────────────────────────────────────
router.get('/attempts/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      loginAttempts: user.loginAttempts || 0,
      lockedUntil: user.lockedUntil,
    });
  } catch (err) {
    next(err);
  }
});

// ── Reset Login Attempts (Admin Only) ────────────────────────────────────────────
router.post('/reset/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const schema = z.object({
      reason: z.string().optional(),
    });

    const { reason } = schema.parse(req.body);

    await User.findByIdAndUpdate(userId, {
      loginAttempts: 0,
      lockedUntil: undefined,
    });

    res.json({ message: 'Login attempts reset successfully' });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

export default router;
