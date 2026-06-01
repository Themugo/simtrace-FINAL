// routes/verification.ts — OTP verification for email / SMS (and call, once a
// voice provider is configured). Codes are hashed at rest, expire in 10 min,
// and are rate/attempt limited.
import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail, sendSMS } from "../services/notify.js";
import { User } from "../db/index.js";

const router = Router();

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const verificationSchema = new mongoose.Schema({
  destination: { type: String, required: true, index: true },
  channel: { type: String, enum: ["email", "sms", "call"], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
// TTL index — Mongo auto-removes expired codes.
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const VerificationCode =
  mongoose.models.VerificationCode ||
  mongoose.model("VerificationCode", verificationSchema);

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// ── POST /api/verify/send ─────────────────────────────────────────────────────
router.post("/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channel, destination } = z
      .object({
        channel: z.enum(["email", "sms", "call"]),
        destination: z.string().min(3),
      })
      .parse(req.body);

    // Voice/call OTP requires a voice provider (e.g. Twilio Voice) — not yet wired.
    if (channel === "call" && !process.env.VOICE_OTP_PROVIDER) {
      return res.status(501).json({
        error: "Call verification is not configured. Set up a voice provider, or use email/SMS.",
      });
    }

    const code = genCode();
    const codeHash = await bcrypt.hash(code, 10);
    await VerificationCode.findOneAndUpdate(
      { destination, channel },
      { destination, channel, codeHash, attempts: 0, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
      { upsert: true }
    );

    const body = `Your SimTrace verification code is ${code}. It expires in 10 minutes.`;
    const providerConfigured =
      channel === "email" ? !!process.env.SENDGRID_API_KEY : !!process.env.AT_API_KEY;

    if (channel === "email") await sendEmail(destination, "SimTrace verification code", body);
    else await sendSMS(destination, body);

    // In non-production with no provider configured, surface the code so devs can test.
    const devEcho =
      process.env.NODE_ENV !== "production" && !providerConfigured ? { devCode: code } : {};
    if ((devEcho as any).devCode) console.log(`[verify] ${channel} code for ${destination}: ${code}`);

    res.json({ sent: true, channel, ttlSeconds: CODE_TTL_MS / 1000, ...devEcho });
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
