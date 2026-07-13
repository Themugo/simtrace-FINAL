// services/otp.ts — shared OTP generation/send, extracted from
// routes/verification.ts so other flows (e.g. registration) can trigger the
// same email/SMS verification code without duplicating the SendGrid/Africa's
// Talking/Twilio wiring. routes/verification.ts's /send endpoint now just
// calls sendOtpCode(); behavior/response shape is unchanged.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { sendEmail, sendSMS } from "./notify.js";
import { twilioConfigured, placeVerificationCall, sendTwilioSms } from "./twilio.js";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

const verificationSchema = new mongoose.Schema({
  destination: { type: String, required: true, index: true },
  channel: { type: String, enum: ["email", "sms", "call"], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const VerificationCode =
  mongoose.models.VerificationCode || mongoose.model("VerificationCode", verificationSchema);

export function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export type OtpChannel = "email" | "sms" | "call";

export async function sendOtpCode(channel: OtpChannel, destination: string) {
  if (channel === "call" && !twilioConfigured()) {
    return { ok: false as const, status: 501, error: "Call verification is not configured. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER, or use email/SMS." };
  }

  const code = genCode();
  const codeHash = await bcrypt.hash(code, 10);
  await VerificationCode.findOneAndUpdate(
    { destination, channel },
    { destination, channel, codeHash, attempts: 0, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    { upsert: true }
  );

  const body = `Your SimTrace verification code is ${code}. It expires in 10 minutes.`;
  let providerConfigured = false;
  if (channel === "email") {
    providerConfigured = !!process.env.SENDGRID_API_KEY;
    await sendEmail(destination, "SimTrace verification code", body);
  } else if (channel === "sms") {
    providerConfigured = !!process.env.AT_API_KEY || twilioConfigured();
    if (process.env.AT_API_KEY) await sendSMS(destination, body);
    else if (twilioConfigured()) await sendTwilioSms(destination, body);
  } else if (channel === "call") {
    providerConfigured = twilioConfigured();
    await placeVerificationCall(destination, code);
  }

  const devEcho = process.env.NODE_ENV !== "production" && !providerConfigured ? { devCode: code } : {};
  if ((devEcho as { devCode?: string }).devCode) console.log(`[verify] ${channel} code for ${destination}: ${code}`);

  return { ok: true as const, channel, ttlSeconds: CODE_TTL_MS / 1000, ...devEcho };
}
