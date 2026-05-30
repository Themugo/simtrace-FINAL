// services/ads.ts — SimTrace Ad Engine
import { Ad, AdEvent, Subscription } from "../db/index.js";
import crypto from "crypto";

// ── Serve ads for a placement ─────────────────────────────────────────────────
// Only shows ads to free/unauth users (paid users are ad-free)
export async function serveAd({ placement, userId }: { placement: string; userId?: string }) {
  // Check if user is on paid plan — if so, no ads
  if (userId) {
    const sub = await Subscription.findOne({ user: userId });
    if (sub && sub.plan !== "free") return null;
  }

  const now = new Date();
  const ads = await Ad.find({
    placement,
    status: "active",
    $and: [
      { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
      { $or: [{ endDate:   { $gte: now } }, { endDate:   null }] },
    ],
    $expr: { $lt: ["$spentKES", "$budgetKES"] },   // still has budget
  }).lean();

  if (!ads.length) return null;

  // Weighted random selection (higher CPC = higher weight)
  const totalWeight = ads.reduce((s, a) => s + a.cpcKES, 0);
  let r = Math.random() * totalWeight;
  let selected = ads[0];
  for (const ad of ads) {
    r -= ad.cpcKES;
    if (r <= 0) { selected = ad; break; }
  }

  // Record impression (fire-and-forget)
  recordAdEvent({ adId: selected._id, userId, type: "impression" }).catch(() => {});

  return {
    id:       selected._id,
    title:    selected.title,
    body:     selected.body,
    ctaText:  selected.ctaText,
    ctaUrl:   selected.ctaUrl,
    imageUrl: selected.imageUrl,
  };
}

// ── Record impression or click ────────────────────────────────────────────────
export async function recordAdEvent({ adId, userId, type, ip }: { adId: string; userId?: string; type: string; ip?: string }) {
  await AdEvent.create({ ad: adId, user: userId, type, ip });

  // Fetch cpcKES before incrementing so we charge the correct amount
  const adDoc = await Ad.findById(adId).select("cpcKES").lean();
  const cpc   = (adDoc as any)?.cpcKES || 5;
  await Ad.findByIdAndUpdate(adId, {
    $inc: {
      impressions: type === "impression" ? 1 : 0,
      clicks:      type === "click"      ? 1 : 0,
      spentKES:    type === "click"      ? cpc : 0,  // charge actual CPC per click
    },
  });

  // Auto-pause if budget exhausted
  const ad = await Ad.findById(adId);
  if (ad && ad.spentKES >= ad.budgetKES) {
    await Ad.findByIdAndUpdate(adId, { status: "exhausted" });
  }
}

// ── Ad analytics for advertiser ───────────────────────────────────────────────
export async function getAdStats(adId: string, advertiserId: string) {
  const ad = await Ad.findOne({ _id: adId, advertiser: advertiserId });
  if (!ad) return null;

  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";

  return {
    title:       ad.title,
    status:      ad.status,
    impressions: ad.impressions,
    clicks:      ad.clicks,
    ctr:         `${ctr}%`,
    spentKES:    ad.spentKES,
    budgetKES:   ad.budgetKES,
    remainingKES: Math.max(0, ad.budgetKES - ad.spentKES),
  };
}

// ── Generate unique ad token for click tracking ───────────────────────────────
export function signAdClick(adId: string): string {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "ads")
    .update(`${adId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16);
}
