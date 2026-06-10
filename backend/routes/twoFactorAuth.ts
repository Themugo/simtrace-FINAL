// routes/twoFactorAuth.ts - Two-Factor Authentication API endpoints
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  generateSecret,
  generateQRCode,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  verifyTwoFactorAuth,
  regenerateBackupCodes,
  hasTwoFactorEnabled,
} from '../services/twoFactorAuth.js';
import { User } from '../db/index.js';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// ── Setup 2FA ─────────────────────────────────────────────────────────────
router.post('/setup', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const setup = generateSecret(user as unknown as Record<string, unknown>);
    const qrCode = await generateQRCode(setup.secret);

    res.json({
      secret: setup.secret,
      qrCode,
      backupCodes: setup.backupCodes,
    });
  } catch (err) {
    next(err);
  }
});

// ── Enable 2FA ─────────────────────────────────────────────────────────────
router.post('/enable', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      secret: z.string(),
      token: z.string(),
      backupCodes: z.array(z.string()),
    });

    const { secret, token, backupCodes } = schema.parse(req.body);

    // Verify token before enabling
    const { valid } = await verifyTwoFactorAuth(req.user!.id, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await enableTwoFactorAuth(req.user!.id, secret, backupCodes);

    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

// ── Disable 2FA ───────────────────────────────────────────────────────────
router.post('/disable', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token: z.string(),
    });

    const { token } = schema.parse(req.body);

    // Verify token before disabling
    const { valid } = await verifyTwoFactorAuth(req.user!.id, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await disableTwoFactorAuth(req.user!.id);

    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

// ── Verify 2FA Token ───────────────────────────────────────────────────────
router.post('/verify', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token: z.string(),
    });

    const { token } = schema.parse(req.body);

    const result = await verifyTwoFactorAuth(req.user!.id, token);

    if (result.valid) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

// ── Check 2FA Status ───────────────────────────────────────────────────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const enabled = await hasTwoFactorEnabled(req.user!.id);

    res.json({ enabled });
  } catch (err) {
    next(err);
  }
});

// ── Regenerate Backup Codes ───────────────────────────────────────────────
router.post('/regenerate-backup-codes', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token: z.string(),
    });

    const { token } = schema.parse(req.body);

    // Verify token before regenerating
    const { valid } = await verifyTwoFactorAuth(req.user!.id, token);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const newCodes = await regenerateBackupCodes(req.user!.id);

    res.json({ backupCodes: newCodes });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return res.status(400).json({ error: (err as any).errors });
    }
    next(err);
  }
});

export default router;
