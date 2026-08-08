import { Router, Request, Response, NextFunction } from "express";
import bcrypt     from "bcryptjs";
import crypto     from "crypto";
import { z }      from "zod";
import { User, Subscription, PasswordReset, EmailVerification } from "../db/index.js";
import { signToken, authenticate }            from "../middleware/auth.js";
import { isAccountLocked, recordFailedLogin, resetLoginAttempts, getLockoutRemainingTime } from "../services/accountLockout.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.js";
import { sendOtpCode } from "../services/otp.js";

const router = Router();

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

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
  email?: string;
  phone?: string;
  role: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mustChangePassword?: boolean;
}

// ── Schemas ───────────────────────────────────────────────────────────────────
// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, phone, deviceInfo } = z.object({
      name: z.string().min(2).max(80).trim(),
      email: z.string().email().toLowerCase().optional(),
      password: z.string().min(8).max(128),
      phone: z.string().min(7).optional(),
      deviceInfo: z.object({
        imei: z.string().optional(),
        serialNumber: z.string().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        deviceDNA: z.string().optional(),
      }).optional(),
    }).refine(d => d.email || d.phone, { message: "Email or mobile number is required" }).parse(req.body);

    if (email && await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    if (phone && await User.findOne({ phone })) return res.status(409).json({ error: "Mobile number already registered" });
    const passwordHash = await bcrypt.hash(password, 12);
    // phoneVerified always starts false -- it was previously set to !!phone,
    // which marked a number "verified" just because it was supplied, with no
    // actual verification ever happening. Real verification now happens via
    // the SMS OTP fired below + POST /api/verify/check.
    const user = await User.create({ name, email, passwordHash, role: "user", phone, phoneVerified: false });
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
    
    res.status(201).json({ token: signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number }), user: sanitize(user as unknown as Record<string, unknown>) });

    // Fire-and-forget, same pattern as forgot-password — never blocks the
    // response, and a failure here shouldn't prevent account creation/login.
    setImmediate(async () => {
      if (user.email) {
        try {
          const rawToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          await EmailVerification.create({ user: user._id, token: rawToken, expiresAt });
          const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${rawToken}`;
          await sendVerificationEmail(user.email, user.name, verifyUrl);
        } catch (err) {
          console.error("[register] verification email error:", err instanceof Error ? err.message : String(err));
        }
      }
      if (user.phone) {
        try {
          await sendOtpCode("sms", user.phone); // confirmed later via POST /api/verify/check
        } catch (err) {
          console.error("[register] phone OTP error:", err instanceof Error ? err.message : String(err));
        }
      }
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password } = z.object({
      email: z.string().email().optional(),
      phone: z.string().min(7).optional(),
      password: z.string().min(1),
    }).refine(d => d.email || d.phone, { message: "Email or phone is required" }).parse(req.body);

    const user = email
      ? await User.findOne({ email: email.toLowerCase() })
      : await User.findOne({ phone });

    // Check lockout before touching the password, so a locked-out account
    // doesn't even get a bcrypt.compare timing signal.
    if (user && (await isAccountLocked(user._id.toString()))) {
      const remainingMs = await getLockoutRemainingTime(user._id.toString());
      const remainingMinutes = remainingMs ? Math.ceil(remainingMs / 60000) : 15;
      return res.status(423).json({
        error: `Account temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minute(s).`,
      });
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      if (user) {
        const { locked } = await recordFailedLogin(user._id.toString());
        if (locked) {
          return res.status(423).json({
            error: "Account locked due to too many failed login attempts. Try again in 15 minutes.",
          });
        }
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await resetLoginAttempts(user._id.toString());
    res.json({ token: signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number }), user: sanitize(user as unknown as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
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
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
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
    res.json({ message: "Password updated successfully", token: signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number }) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
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

        await sendPasswordResetEmail(user.email!, user.name, resetUrl);
      } catch (err) {
        console.error("[forgot-password] Error:", err instanceof Error ? err.message : String(err));
      }
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
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
    res.json({ message: "Password reset successfully.", token: signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number }), user: sanitize(user as unknown as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── GET /api/auth/verify-email?token=... ─────────────────────────────────────
router.get("/verify-email", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.query.token || "");
    if (token.length !== 64) return res.status(400).json({ error: "Invalid verification link" });

    const record = await EmailVerification.findOne({ token, used: false });
    if (!record) return res.status(400).json({ error: "Invalid or already-used verification link" });
    if (record.expiresAt < new Date()) return res.status(400).json({ error: "Verification link has expired. Request a new one." });

    await User.findByIdAndUpdate(record.user, { emailVerified: true });
    record.used = true;
    await record.save();

    res.json({ message: "Email verified successfully." });
  } catch (err) { next(err); }
});

// ── POST /api/auth/resend-verification (authenticated) ───────────────────────
// Resends whichever verification(s) are still outstanding — email link,
// SMS OTP, or both, depending on what the account has and hasn't confirmed.
router.post("/resend-verification", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const actions: string[] = [];

    if (user.email && !user.emailVerified) {
      await EmailVerification.deleteMany({ user: user._id }); // invalidate previous links
      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await EmailVerification.create({ user: user._id, token: rawToken, expiresAt });
      const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${rawToken}`;
      await sendVerificationEmail(user.email, user.name, verifyUrl);
      actions.push("email");
    }

    if (user.phone && !user.phoneVerified) {
      await sendOtpCode("sms", user.phone);
      actions.push("sms");
    }

    if (actions.length === 0) return res.json({ message: "Everything on your account is already verified." });
    res.json({ message: `Verification sent via ${actions.join(" and ")}.`, channels: actions });
  } catch (err) { next(err); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitize(user: Record<string, unknown>): SanitizedUser {
  return {
    id: user._id as string,
    name: user.name as string,
    email: user.email as string | undefined,
    phone: user.phone as string | undefined,
    role: user.role as string,
    emailVerified: user.emailVerified as boolean | undefined,
    phoneVerified: user.phoneVerified as boolean | undefined,
    mustChangePassword: user.mustChangePassword as boolean | undefined,
  };
}

// ── POST /api/auth/refresh — extend session with a fresh token ────────────────
// Client calls this before the 7d token expires to get a new one
router.post("/refresh", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash -apiKey");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ token: signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number }), user: sanitize(user as unknown as Record<string, unknown>) });
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
