import { Router, Request, Response, NextFunction } from "express";
import { User, Subscription } from "../db/index.js";
import { signToken } from "../middleware/auth.js";
import { getRedisClient } from "../services/redis.js";
import { z } from "zod";

const router = Router();

// Verification codes live in Redis (5 min TTL), not in-process memory: an
// in-memory Map breaks as soon as there's more than one server instance (the
// code generated on instance A is invisible to instance B handling the confirm
// request) and loses all pending codes on every restart/deploy.
const CODE_TTL_SECONDS = 5 * 60;
const codeKey = (phoneNumber: string) => `phone-verify:${phoneNumber}`;

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Africa's Talking
async function sendSMS(phoneNumber: string, code: string): Promise<void> {
  const AT_API_KEY = process.env.AT_API_KEY;
  const AT_USERNAME = process.env.AT_USERNAME;
  const AT_SENDER_ID = process.env.AT_SENDER_ID || "SIMTRACE";

  if (!AT_API_KEY || !AT_USERNAME) {
    console.log(`[SMS] Verification code for ${phoneNumber}: ${code}`);
    return;
  }

  const message = `Your SIMTRACE verification code is: ${code}. Valid for 5 minutes.`;

  try {
    const response = await fetch(
      `https://api.africastalking.com/version1/messaging`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${AT_USERNAME}:${AT_API_KEY}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          username: AT_USERNAME,
          to: phoneNumber,
          message: message,
          from: AT_SENDER_ID,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }
  } catch (error) {
    console.error("[SMS] Error:", error);
    throw error;
  }
}

// POST /api/auth/verify-phone - Send verification code
router.post(
  "/verify-phone",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber } = z
        .object({
          phoneNumber: z.string().min(10),
        })
        .parse(req.body);

      // Check if phone number already has a recent code
      const redis = getRedisClient();
      const existing = await redis.get(codeKey(phoneNumber));
      if (existing) {
        return res.status(429).json({
          error: "Verification code already sent. Please wait 5 minutes.",
        });
      }

      // Generate and store verification code (Redis TTL handles expiry)
      const code = generateVerificationCode();
      await redis.set(codeKey(phoneNumber), code, "EX", CODE_TTL_SECONDS);
      const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

      // Send SMS
      await sendSMS(phoneNumber, code);

      res.json({
        message: "Verification code sent successfully",
        expiresAt: expiresAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof Error && err.name === "ZodError") {
        return res.status(400).json({ error: (err as any).errors });
      }
      next(err);
    }
  }
);

// POST /api/auth/confirm-phone - Verify code and create account
router.post(
  "/confirm-phone",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber, code } = z
        .object({
          phoneNumber: z.string().min(10),
          code: z.string().length(6),
        })
        .parse(req.body);

      // Verify code
      const redis = getRedisClient();
      const stored = await redis.get(codeKey(phoneNumber));
      if (!stored) {
        return res.status(400).json({
          error: "No verification code found or it has expired. Please request a new code.",
        });
      }

      if (stored !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Check if user already exists
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        // Create new user
        user = await User.create({
          name: `User ${phoneNumber.slice(-4)}`,
          phoneNumber,
          email: `${phoneNumber}@${process.env.PHONE_EMAIL_DOMAIN || "phone.local"}`,
          role: "user",
          phoneVerified: true,
        });

        // Create subscription
        await Subscription.create({
          user: user._id,
          plan: "free",
          status: "active",
        });
      } else {
        // Update phone verification status
        user.phoneVerified = true;
        await user.save();
      }

      // Clear verification code
      await redis.del(codeKey(phoneNumber));

      // Generate token
      const token = signToken(user as unknown as { _id: string; role: string; email: string; tokenVersion?: number });

      res.json({
        message: "Phone verified successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: (user as any).phoneNumber,
          email: user.email,
          role: user.role,
          phoneVerified: user.phoneVerified,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "ZodError") {
        return res.status(400).json({ error: (err as any).errors });
      }
      next(err);
    }
  }
);

export default router;
