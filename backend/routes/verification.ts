// routes/verification.ts — OTP verification for email / SMS (and call, once a
// voice provider is configured). Codes are hashed at rest, expire in 10 min,
// and are rate/attempt limited. Send logic lives in services/otp.ts so
// registration can trigger the same flow.
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { User } from "../db/index.js";
import { sendOtpCode, VerificationCode, MAX_ATTEMPTS } from "../services/otp.js";
import bcrypt from "bcryptjs";

const router = Router();

// ── POST /api/verify/send ─────────────────────────────────────────────────────
router.post("/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channel, destination } = z
      .object({
        channel: z.enum(["email", "sms", "call"]),
        destination: z.string().min(3),
      })
      .parse(req.body);

    const result = await sendOtpCode(channel, destination);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    res.json({ sent: true, channel: result.channel, ttlSeconds: result.ttlSeconds, ...(result.devCode ? { devCode: result.devCode } : {}) });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError")
      return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/verify/check ────────────────────────────────────────────────────
router.post("/check", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { destination, code } = z
      .object({ destination: z.string().min(3), code: z.string().min(4) })
      .parse(req.body);

    const record = await VerificationCode.findOne({ destination });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Code expired or not found. Request a new one." });
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      await VerificationCode.deleteOne({ _id: record._id });
      return res.status(429).json({ error: "Too many attempts. Request a new code." });
    }

    const ok = await bcrypt.compare(code, record.codeHash);
    if (!ok) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ error: "Invalid code", attemptsLeft: MAX_ATTEMPTS - record.attempts });
    }

    // Mark the matching user verified, if one exists for this destination.
    const field = record.channel === "email" ? { emailVerified: true } : { phoneVerified: true };
    const query = record.channel === "email" ? { email: destination.toLowerCase() } : { phone: destination };
    await User.updateOne(query, { $set: field });
    await VerificationCode.deleteOne({ _id: record._id });

    res.json({ verified: true, channel: record.channel });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError")
      return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
