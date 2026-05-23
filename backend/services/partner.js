// services/partner.js — SimTrace Telecom & Agency Integration Engine
import crypto from "crypto";
import { Partner, Device, Alert, TheftReport } from "../db/index.js";

// ── Generate a secure API key ─────────────────────────────────────────────────
export function generateApiKey() {
  return "st_" + crypto.randomBytes(28).toString("hex");
}

// ── Validate partner API key + track usage ────────────────────────────────────
export async function validatePartnerKey(apiKey) {
  const partner = await Partner.findOne({ apiKey, status: "active" });
  if (!partner) return null;

  // Reset monthly counter on new month
  const now      = new Date();
  const lastReset = new Date(partner.lastReset);
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    partner.apiCallsMonth = 0;
    partner.lastReset     = now;
  }

  // Enforce rate limit
  if (partner.apiCallsMonth >= partner.apiCallsLimit) {
    throw new Error("Monthly API quota exceeded");
  }

  // Atomic increment — safe under concurrent requests
  const updated = await Partner.findOneAndUpdate(
    { _id: partner._id, apiCallsMonth: { $lt: partner.apiCallsLimit } },
    { $inc: { apiCallsMonth: 1 } },
    { new: true }
  );
  if (!updated) throw new Error("Monthly API quota exceeded");
  return updated;
}

// ── Bulk IMEI check (for telecoms ingesting subscriber devices) ───────────────
export async function bulkImeiCheck(imeis) {
  const results = await Device.find({ imei: { $in: imeis } })
    .select("imei status lastSeen")
    .lean();

  const map = Object.fromEntries(results.map(d => [d.imei, d]));

  return imeis.map(imei => ({
    imei,
    registered: !!map[imei],
    status:     map[imei]?.status || "unknown",
    lastSeen:   map[imei]?.lastSeen || null,
    risk:       map[imei]?.status === "stolen" || map[imei]?.status === "blacklisted" ? "HIGH" : "LOW",
  }));
}

// ── Webhook delivery to partner ───────────────────────────────────────────────
export async function deliverWebhook(partner, event) {
  if (!partner.webhookUrl) return;

  const body    = JSON.stringify({ event, ts: new Date().toISOString() });
  const sig     = crypto
    .createHmac("sha256", partner.webhookSecret || "")
    .update(body)
    .digest("hex");

  try {
    const res = await fetch(partner.webhookUrl, {
      method:  "POST",
      headers: {
        "Content-Type":       "application/json",
        "X-SimTrace-Sig":     sig,
        "X-SimTrace-Partner": partner._id.toString(),
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    console.log(`[Webhook] ${partner.orgName} → ${res.status}`);
  } catch (err) {
    console.error(`[Webhook] ${partner.orgName} failed:`, err.message);
  }
}

// ── Broadcast blacklist/recovery events to all active partners ────────────────
export async function broadcastToPartners(eventType, payload) {
  const partners = await Partner.find({ status: "active", webhookUrl: { $exists: true, $ne: "" } });
  await Promise.allSettled(
    partners.map(p => deliverWebhook(p, { type: eventType, data: payload }))
  );
}

// ── Partner dashboard stats ───────────────────────────────────────────────────
export async function getPartnerStats(partnerId) {
  const partner = await Partner.findById(partnerId).populate("user", "name email");
  if (!partner) return null;

  const stolen = await Device.countDocuments({ status: { $in: ["stolen", "blacklisted"] } });
  const recentAlerts = await Alert.find({}).sort({ ts: -1 }).limit(10).lean();

  return {
    partner: {
      orgName:       partner.orgName,
      orgType:       partner.orgType,
      tier:          partner.tier,
      apiCallsMonth: partner.apiCallsMonth,
      apiCallsLimit: partner.apiCallsLimit,
      status:        partner.status,
    },
    stats: { totalBlacklisted: stolen },
    recentAlerts,
  };
}
