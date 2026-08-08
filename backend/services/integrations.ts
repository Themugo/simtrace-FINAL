// services/integrations.ts — single source of truth for "is this integration
// plugged in?". Every integration is env-gated; add the keys and it activates.
export interface IntegrationStatus {
  key: string;
  name: string;
  category: "payments" | "messaging" | "ai" | "auth" | "media" | "infra" | "observability";
  configured: boolean;
  required: string[];   // env vars that must all be present
  optional?: string[];
  note?: string;
}

const has = (...vars: string[]) => vars.every((v) => !!process.env[v]);

export function integrationStatus(): IntegrationStatus[] {
  return [
    { key: "mongodb",   name: "MongoDB",            category: "infra",         required: ["MONGO_URI"],                                   configured: has("MONGO_URI") || has("MONGODB_URI") },
    { key: "redis",     name: "Redis",              category: "infra",         required: ["REDIS_URL"],                                   configured: has("REDIS_URL") || has("REDIS_HOST") },
    { key: "stripe",    name: "Stripe",             category: "payments",      required: ["STRIPE_SECRET_KEY"], optional: ["STRIPE_WEBHOOK_SECRET"], configured: has("STRIPE_SECRET_KEY") },
    { key: "mpesa",     name: "M-Pesa (Daraja)",    category: "payments",      required: ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY"], configured: has("MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY") },
    { key: "anthropic", name: "Anthropic (AI)",     category: "ai",            required: ["ANTHROPIC_API_KEY"],                           configured: has("ANTHROPIC_API_KEY") },
    { key: "sendgrid",  name: "SendGrid (email)",   category: "messaging",     required: ["SENDGRID_API_KEY"], optional: ["FROM_EMAIL"],  configured: has("SENDGRID_API_KEY") },
    { key: "africastalking", name: "Africa's Talking (SMS)", category: "messaging", required: ["AT_API_KEY"], optional: ["AT_USERNAME", "AT_SENDER_ID"], configured: has("AT_API_KEY") },
    { key: "twilio",    name: "Twilio (voice/SMS)", category: "messaging",     required: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], optional: ["TWILIO_FROM_NUMBER"], configured: has("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"), note: "Enables call (voice) OTP and Twilio SMS." },
    { key: "google",    name: "Google OAuth",       category: "auth",          required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], optional: ["GOOGLE_REDIRECT_URI"], configured: has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") },
    { key: "cloudinary",name: "Cloudinary (media)", category: "media",         required: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"], configured: has("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET") || has("CLOUDINARY_URL") },
    { key: "sentry",    name: "Sentry",             category: "observability", required: ["SENTRY_DSN"],                                  configured: has("SENTRY_DSN") },
  ];
}

export function integrationSummary() {
  const all = integrationStatus();
  return {
    ready: all.filter((i) => i.configured).map((i) => i.key),
    missing: all.filter((i) => !i.configured).map((i) => i.key),
    integrations: all,
  };
}
