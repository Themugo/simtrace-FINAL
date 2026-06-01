// services/billing.ts — SimTrace monetisation engine
import { Plan, Subscription, Payment, Device, Ad } from "../db/index.js";

// ── Plan definitions (seeded once on startup) ─────────────────────────────────
export interface PlanDefinition {
  id: string;
  name: string;
  priceKES: number;
  priceUSD: number;
  deviceLimit: number;
  extraDeviceKES: number;
  features: string[];
  imeiChecksPerDay: number;
  aiReportsPerMonth: number;
  slaHours: number | null;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceKES: 0,
    priceUSD: 0,
    deviceLimit: 2,
    extraDeviceKES: 150,
    features: ["2 devices", "Basic IMEI checks", "Email alerts", "Community support"],
    imeiChecksPerDay: 5,
    aiReportsPerMonth: 3,
    slaHours: null,
  },
  {
    id: "pro",
    name: "Pro",
    priceKES: 799,
    priceUSD: 6,
    deviceLimit: 10,
    extraDeviceKES: 80,
    features: ["10 devices", "Unlimited IMEI checks", "SMS + email alerts", "AI security reports", "Priority support", "No ads"],
    imeiChecksPerDay: 0,
    aiReportsPerMonth: 50,
    slaHours: 24,
  },
  {
    id: "business",
    name: "Business",
    priceKES: 3499,
    priceUSD: 27,
    deviceLimit: 50,
    extraDeviceKES: 50,
    features: ["50 devices", "Unlimited everything", "Marketplace API access", "Webhook integrations", "Dedicated account manager", "No ads"],
    imeiChecksPerDay: 0,
    aiReportsPerMonth: 0,
    slaHours: 4,
  },
  {
    id: "enterprise",
    name: "Enterprise / Telecom",
    priceKES: 0,
    priceUSD: 0,
    deviceLimit: 999,
    extraDeviceKES: 0,
    features: ["Unlimited devices", "Full API suite", "Bulk IMEI ingestion", "Custom SLA", "Dedicated infra", "Law enforcement portal"],
    imeiChecksPerDay: 0,
    aiReportsPerMonth: 0,
    slaHours: 1,
  },
];

export async function seedPlans(): Promise<void> {
  for (const p of PLANS) {
    await Plan.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
  }
  console.log("Plans seeded");
}

// ── Subscription helpers ──────────────────────────────────────────────────────
export async function getUserSubscription(userId: string) {
  let sub = await Subscription.findOne({ user: userId });
  if (!sub) {
    sub = await Subscription.create({ user: userId, plan: "free", status: "active" });
  }
  return sub;
}

export async function getPlan(planId: string) {
  const doc = await Plan.findOne({ id: planId });
  return doc || PLANS.find(p => p.id === planId);
}

// ── Device limit enforcement ──────────────────────────────────────────────────
export async function checkDeviceLimit(userId: string) {
  const [sub, deviceCount] = await Promise.all([
    getUserSubscription(userId),
    Device.countDocuments({ owner: userId }),
  ]);

  const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
  const totalAllowed = plan.deviceLimit + (sub.extraDevices || 0);
  const canAdd = deviceCount < totalAllowed;
  const isOverFreeLimit = sub.plan === "free" && deviceCount >= 2;

  return {
    canAdd,
    deviceCount,
    totalAllowed,
    plan: sub.plan,
    extraDeviceKES: plan.extraDeviceKES,
    isOverFreeLimit,
    slotsUsed: deviceCount,
    slotsRemaining: Math.max(0, totalAllowed - deviceCount),
  };
}

// ── M-Pesa STK Push ───────────────────────────────────────────────────────────
async function getMpesaToken(): Promise<{ token: string; baseUrl: string }> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-Pesa credentials not configured");

  const creds = Buffer.from(`${key}:${secret}`).toString("base64");
  const isProd = process.env.MPESA_ENV === "production";
  const baseUrl = isProd
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

  const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` } }
  );
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("M-Pesa auth failed");
  return { token: data.access_token, baseUrl };
}

export async function initiateMpesaSTK({ phone, amountKES, description, reference, userId, paymentType }: {
  phone: string;
  amountKES: number;
  description?: string;
  reference?: string;
  userId: string;
  paymentType?: string;
}) {
  const { token, baseUrl } = await getMpesaToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = `${process.env.BACKEND_URL}/api/billing/mpesa-callback`;

  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const pwd = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const normPhone = phone.replace(/^0/, "254").replace(/^\+/, "");

  const body = {
    BusinessShortCode: shortcode,
    Password: pwd,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(amountKES),
    PartyA: normPhone,
    PartyB: shortcode,
    PhoneNumber: normPhone,
    CallBackURL: callbackUrl,
    AccountReference: reference || "SimTrace",
    TransactionDesc: description || "SimTrace payment",
  };

  const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { ResponseCode?: string; ResponseDescription?: string; CheckoutRequestID?: string };

  if (data.ResponseCode !== "0") throw new Error(data.ResponseDescription || "STK push failed");

  const payment = await Payment.create({
    user: userId,
    type: paymentType || "subscription",
    amountKES,
    method: "mpesa",
    status: "pending",
    reference: data.CheckoutRequestID,
    description,
  });

  return { checkoutRequestId: data.CheckoutRequestID, paymentId: payment._id };
}

// ── M-Pesa STK Query — check payment status from Daraja ──────────────────────
export async function queryMpesaSTK(checkoutRequestId: string) {
  const { token, baseUrl } = await getMpesaToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const pwd = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: pwd,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json();
  return data;
}

// ── M-Pesa callback ───────────────────────────────────────────────────────────
export async function processMpesaCallback(body: any): Promise<void> {
  const stk = body?.Body?.stkCallback;
  if (!stk) return;

  const checkoutId = stk.CheckoutRequestID;
  const resultCode = stk.ResultCode;

  const payment = await Payment.findOne({ reference: checkoutId });
  if (!payment) return;

  if (resultCode === 0) {
    const items = stk.CallbackMetadata?.Item || [];
    const receipt = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;

    payment.status = "completed";
    payment.mpesaReceipt = receipt;
    payment.paidAt = new Date();
    await payment.save();

    await activateSubscriptionAfterPayment(payment);
  } else {
    payment.status = "failed";
    await payment.save();
  }
}

async function activateSubscriptionAfterPayment(payment: any): Promise<void> {
  if (payment.type === "subscription") {
    const period = new Date();
    period.setMonth(period.getMonth() + 1);
    await Subscription.findOneAndUpdate(
      { user: payment.user },
      { status: "active", currentPeriodEnd: period, updatedAt: new Date() },
      { upsert: true }
    );
  } else if (payment.type === "extra_device") {
    await Subscription.findOneAndUpdate(
      { user: payment.user },
      { $inc: { extraDevices: 1 }, updatedAt: new Date() }
    );
  }
}

// ── Stripe ────────────────────────────────────────────────────────────────────
export async function createStripeIntent({ amountUSD, userId, description, planId }: {
  amountUSD: number;
  userId: string;
  description?: string;
  planId?: string;
}) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe not configured");

  const amountCents = Math.round(amountUSD * 100);
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: String(amountCents),
      currency: "usd",
      "metadata[userId]": userId,
      "metadata[planId]": planId || "",
      description: description || "SimTrace subscription",
    }),
  });

  const intent = await res.json() as { error?: { message?: string }; id?: string; client_secret?: string };
  if (intent.error) throw new Error(intent.error.message);

  await Payment.create({
    user: userId,
    type: "subscription",
    amountUSD,
    method: "stripe",
    status: "pending",
    reference: intent.id,
    description,
  });

  return { clientSecret: intent.client_secret, intentId: intent.id };
}

// ── Revenue stats for admin ── NOW includes ad revenue ────────────────────────
export async function getRevenueStats() {
  const since30 = new Date(Date.now() - 30 * 24 * 3600000);
  const since7 = new Date(Date.now() - 7 * 24 * 3600000);

  const [
    monthlyRevKES,
    monthlyRevUSD,
    weeklyRevKES,
    subCounts,
    totalPayments,
    adRevKES,
    recentPayments,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "completed", paidAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: "$amountKES" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "completed", paidAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: "$amountUSD" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "completed", paidAt: { $gte: since7 } } },
      { $group: { _id: null, total: { $sum: "$amountKES" } } },
    ]),
    Subscription.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: "completed" }),
    // Ad revenue = sum of spentKES across active/exhausted ads
    Ad.aggregate([
      { $match: { status: { $in: ["active", "paused", "exhausted"] } } },
      { $group: { _id: null, total: { $sum: "$spentKES" } } },
    ]),
    // Most recent 5 payments for activity feed
    Payment.find({ status: "completed" }).sort({ paidAt: -1 }).limit(5)
      .populate("user", "name email").lean(),
  ]);

  return {
    monthlyRevKES: (monthlyRevKES[0]?.total || 0) + (adRevKES[0]?.total || 0),
    monthlyRevUSD: monthlyRevUSD[0]?.total || 0,
    weeklyRevKES: weeklyRevKES[0]?.total || 0,
    adRevKES: adRevKES[0]?.total || 0,
    subscriptions: subCounts,
    totalPayments,
    recentPayments,
  };
}
