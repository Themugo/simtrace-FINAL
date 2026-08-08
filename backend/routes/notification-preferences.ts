import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { NotificationPreferences } from "../db/index.js";

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string } }

// GET /api/notification-preferences — get user's notification preferences
router.get("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prefs = await NotificationPreferences.findOne({ user: req.user!.id });
    
    if (!prefs) {
      // Return default preferences if none exist
      return res.json({
        channels: {
          sms: true,
          email: true,
          push: true,
          inApp: true,
        },
        alertTypes: {
          theft_report: true,
          sim_swap: true,
          location_jump: true,
          fraud_pattern: true,
          blacklist_ping: true,
          recovery_update: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'Africa/Nairobi',
        },
      });
    }

    res.json(prefs);
  } catch (err) { next(err); }
});

// PUT /api/notification-preferences — update user's notification preferences
router.put("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      channels: z.object({
        sms: z.boolean(),
        email: z.boolean(),
        push: z.boolean(),
        inApp: z.boolean(),
      }),
      alertTypes: z.object({
        theft_report: z.boolean(),
        sim_swap: z.boolean(),
        location_jump: z.boolean(),
        fraud_pattern: z.boolean(),
        blacklist_ping: z.boolean(),
        recovery_update: z.boolean(),
      }),
      quietHours: z.object({
        enabled: z.boolean(),
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string(),
      }),
    });
    const data = schema.parse(req.body);

    const prefs = await NotificationPreferences.findOneAndUpdate(
      { user: req.user!.id },
      {
        ...data,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(prefs);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// PATCH /api/notification-preferences/channels — update channel preferences only
router.patch("/channels", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    const prefs = await NotificationPreferences.findOneAndUpdate(
      { user: req.user!.id },
      {
        $set: Object.keys(data).reduce((acc: Record<string, unknown>, key) => {
          acc[`channels.${key}`] = (data as Record<string, unknown>)[key];
          return acc;
        }, {} as Record<string, unknown>),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(prefs);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// PATCH /api/notification-preferences/alert-types — update alert type preferences only
router.patch("/alert-types", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      theft_report: z.boolean().optional(),
      sim_swap: z.boolean().optional(),
      location_jump: z.boolean().optional(),
      fraud_pattern: z.boolean().optional(),
      blacklist_ping: z.boolean().optional(),
      recovery_update: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    const prefs = await NotificationPreferences.findOneAndUpdate(
      { user: req.user!.id },
      {
        $set: Object.keys(data).reduce((acc: Record<string, unknown>, key) => {
          acc[`alertTypes.${key}`] = (data as Record<string, unknown>)[key];
          return acc;
        }, {} as Record<string, unknown>),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(prefs);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// PATCH /api/notification-preferences/quiet-hours — update quiet hours only
router.patch("/quiet-hours", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      enabled: z.boolean().optional(),
      start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      timezone: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const prefs = await NotificationPreferences.findOneAndUpdate(
      { user: req.user!.id },
      {
        $set: Object.keys(data).reduce((acc: Record<string, unknown>, key) => {
          acc[`quietHours.${key}`] = (data as Record<string, unknown>)[key];
          return acc;
        }, {} as Record<string, unknown>),
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json(prefs);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// DELETE /api/notification-preferences — reset to default preferences
router.delete("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await NotificationPreferences.deleteOne({ user: req.user!.id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
