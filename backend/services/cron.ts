// services/cron.ts — SimTrace scheduled jobs
// Runs on server startup and repeats on interval.
// No external cron dependency — uses setInterval (adequate for single-instance Railway deployment).
// For multi-instance deployments, move to a dedicated worker or use BullMQ/Agenda.

import { Subscription, User, Ad, Partner } from "../db/index.js";
import pino, { Logger } from "pino";

const log: Logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(process.env.NODE_ENV !== "production" ? { transport: { target: "pino-pretty", options: { colorize: true } } } : {}),
}).child({ service: "cron" });

// ── Subscription expiry check ─────────────────────────────────────────────────
// Runs every hour. Downgrades users whose paid subscription has lapsed.
async function checkExpiredSubscriptions(): Promise<void> {
  try {
    const now = new Date();

    // Find paid subscriptions whose period has ended and are still marked active
    const expired = await Subscription.find({
      plan: { $nin: ["free", "enterprise"] },
      status: "active",
      currentPeriodEnd: { $lt: now },
    });

    if (!expired.length) return;

    log.info(`[Cron] Expiry check: ${expired.length} subscription(s) to downgrade`);

    for (const sub of expired) {
      sub.plan = "free";
      sub.status = "active";
      await sub.save();

      // Notify user
      try {
        const user = await User.findById(sub.user).select("email name");
        if (user) {
          log.info({ userId: sub.user, email: user.email }, "[Cron] Subscription expired — downgraded to free");
          // sendEmail(user.email, "Your SimTrace subscription has expired", ...) — extend here
        }
      } catch { log.warn("[Cron] Notification failure for expired subscription"); }
    }
  } catch (err) {
    log.error({ err }, "[Cron] checkExpiredSubscriptions failed");
  }
}

// ── Ad budget cleanup ─────────────────────────────────────────────────────────
// Marks any ad as exhausted if budget is depleted (safety net beyond the click-time check).
async function cleanupExhaustedAds(): Promise<void> {
  try {
    const result = await Ad.updateMany(
      { status: "active", $expr: { $gte: ["$spentKES", "$budgetKES"] } },
      { status: "exhausted" }
    );
    if (result.modifiedCount > 0) {
      log.info(`[Cron] Exhausted ${result.modifiedCount} over-budget ad(s)`);
    }
  } catch (err) {
    log.error({ err }, "[Cron] cleanupExhaustedAds failed");
  }
}

// ── Partner monthly quota reset ───────────────────────────────────────────────
// Resets apiCallsMonth on the 1st of each month (belt-and-suspenders alongside validatePartnerKey).
async function resetPartnerQuotas(): Promise<void> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await Partner.updateMany(
      { lastReset: { $lt: startOfMonth } },
      { apiCallsMonth: 0, lastReset: now }
    );
    if (result.modifiedCount > 0) {
      log.info(`[Cron] Reset quotas for ${result.modifiedCount} partner(s)`);
    }
  } catch (err) {
    log.error({ err }, "[Cron] resetPartnerQuotas failed");
  }
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
export function startCron(): void {
  // Run immediately on startup, then on schedule
  checkExpiredSubscriptions();
  cleanupExhaustedAds();
  resetPartnerQuotas();

  // Every hour
  setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);
  setInterval(cleanupExhaustedAds, 60 * 60 * 1000);

  // Every 6 hours
  setInterval(resetPartnerQuotas, 6 * 60 * 60 * 1000);

  log.info("[Cron] Scheduled jobs started");
}
