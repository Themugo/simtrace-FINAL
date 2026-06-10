import { Router, Request, Response, NextFunction } from "express";
import bcrypt     from "bcryptjs";
import crypto     from "crypto";
import { z }      from "zod";
import { User, Subscription, PasswordReset } from "../db/index.js";
import { signToken, authenticate }            from "../middleware/auth.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mustChangePassword?: boolean;
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name:     z.string().min(2).max(80).trim(),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone:    z.string().optional(),
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, deviceInfo } = z.object({
      name: z.string().min(2).max(80).trim(),
      email: z.string().email().toLowerCase(),
      password: z.string().min(8).max(128),
      phone: z.string().optional(),
      deviceInfo: z.object({
        imei: z.string().optional(),
        serialNumber: z.string().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        deviceDNA: z.string().optional(),
      }).optional(),
    }).parse(req.body);
    
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: "user", phone, phoneVerified: !!phone });
    await Subscription.create({ user: user._id, plan: "free", status: "active" });
    
    // Auto-register device if device info provided from intelligent onboarding
    if (deviceInfo && deviceInfo.imei) {
      const { Device } = await import("../db/index.js");
      await Device.create({
        imei: deviceInfo.imei,
        serialNumber: deviceInfo.serialNumber,
        make: deviceInfo.make,
        model: deviceInfo.model,
        owner: user._id,
        status: "active",
        deviceKey: deviceInfo.deviceDNA,
      });
    }
    
    res.status(201).json({ token: signToken(user), user: sanitize(user) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash -apiKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) { next(err); }
});

// ── PATCH /api/auth/update-profile ───────────────────────────────────────────
router.patch("/update-profile", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, name } = z.object({
      phone: z.string().max(20).optional(),
      name:  z.string().min(2).max(80).optional(),
    }).parse(req.body);
    const update: Record<string, unknown> = {};
    if (phone !== undefined) update.phone = phone;
    if (name  !== undefined) update.name  = name;
    const user = await User.findByIdAndUpdate(req.user!.id, update, { new: true }).select("-passwordHash -apiKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/auth/change-password ───────────────────────────────────────────
router.post("/change-password", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(8).max(128),
    }).parse(req.body);
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;   // revoke other sessions
    await user.save();
    res.json({ message: "Password updated successfully", token: signToken(user) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
// Generates a secure 1-hour token and sends reset link via SendGrid
router.post("/forgot-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    // Always respond 200 — never reveal if email is registered (anti-enumeration)
    res.json({ message: "If this email is registered, a reset link will be sent." });

    // Fire-and-forget — after responding
    setImmediate(async () => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return; // silent — already responded

        // Invalidate previous tokens for this user
        await PasswordReset.deleteMany({ user: user._id });

        const rawToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await PasswordReset.create({ user: user._id, token: rawToken, expiresAt });

        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;

        await sendResetEmail(user.email, user.name, resetUrl);
      } catch (err) {
        console.error("[forgot-password] Error:", err instanceof Error ? err.message : String(err));
      }
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = z.object({
      token:       z.string().length(64),
      newPassword: z.string().min(8).max(128),
    }).parse(req.body);

    const reset = await PasswordReset.findOne({ token, used: false });
    if (!reset)                       return res.status(400).json({ error: "Invalid or expired reset link" });
    if (reset.expiresAt < new Date()) return res.status(400).json({ error: "Reset link has expired. Request a new one." });

    const user = await User.findById(reset.user);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;   // revoke sessions on reset
    await user.save();

    reset.used = true;
    await reset.save();

    // Sign new token so user is logged in immediately after reset
    res.json({ message: "Password reset successfully.", token: signToken(user), user: sanitize(user) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitize(user: Record<string, unknown>): SanitizedUser {
  return {
    id: user._id as string,
    name: user.name as string,
    email: user.email as string,
    role: user.role as string,
    emailVerified: user.emailVerified as boolean | undefined,
    phoneVerified: user.phoneVerified as boolean | undefined,
    mustChangePassword: user.mustChangePassword as boolean | undefined,
  };
}

async function sendResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    // Dev fallback — log to console
    console.log(`[Password Reset] Link for ${to}: ${resetUrl}`);
    return;
  }

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0f1117; color: #f1f5f9; border-radius: 12px;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; letter-spacing: 0.05em;">SIM<span style="color: #0ea5e9;">TRACE</span>™</span>
      </div>
      <h2 style="margin: 0 0 12px; font-size: 20px;">Reset your password</h2>
      <p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
        Hi ${name}, we received a request to reset your SimTrace password. Click the button below to set a new password.
        This link expires in <strong style="color: #f1f5f9;">1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9px; font-weight: 700; font-size: 15px;">
        Reset Password
      </a>
      <p style="color: #475569; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
        If you didn't request this, ignore this email — your password won't change.<br>
        If you're concerned, contact <a href="mailto:${process.env.SUPPORT_EMAIL || "support@simtrace.local"}" style="color: #0ea5e9;">${process.env.SUPPORT_EMAIL || "support@simtrace.local"}</a>
      </p>
    </div>
  `;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method:  "POST",
    headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from:    { email: process.env.FROM_EMAIL || "noreply@simtrace.local", name: "SimTrace" },
      subject: "Reset your SimTrace password",
      content: [
        { type: "text/plain", value: `Hi ${name}, reset your password here: ${resetUrl}\n\nThis link expires in 1 hour.` },
        { type: "text/html",  value: html },
      ],
    }),
  });

  if (!res.ok) console.error("[SendGrid] Email failed:", res.status, await res.text());
}

// ── POST /api/auth/refresh — extend session with a fresh token ────────────────
// Client calls this before the 7d token expires to get a new one
router.post("/refresh", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash -apiKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ token: signToken(user), user: sanitize(user) });
  } catch (err) { next(err); }
});

router.post("/logout-all", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    res.json({ message: "All sessions revoked. Please log in again." });
  } catch (err) { next(err); }
});

export default router;
