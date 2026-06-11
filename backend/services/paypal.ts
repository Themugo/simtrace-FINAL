// services/paypal.ts - PayPal Payment Integration
// PayPal payment processing for global markets

import { PayPalPayment, User } from "../db/index.js";

interface PayPalPaymentDoc {
  status: string;
  paypalCaptureId?: string;
  paypalPayerId?: string;
  paypalEmail?: string;
  updatedAt?: Date;
  save(): Promise<PayPalPaymentDoc>;
}

interface CurrencyRateDoc {
  rate: number;
  save(): Promise<CurrencyRateDoc>;
}

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
}

// ── PayPal Configuration ─────────────────────────────────────────────────────────
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // sandbox or live

const PAYPAL_API_BASE = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// ── PayPal Authentication ───────────────────────────────────────────────────────
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json() as Record<string, unknown>;
  return data.access_token as string;
}

// ── Payment Creation ─────────────────────────────────────────────────────────────
export async function createPayPalOrder(data: Record<string, unknown>) {
  const { userId, amount, currency, description, type, relatedId } = data as { userId: string; amount: number; currency: string; description?: string; type?: string; relatedId?: string };

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const accessToken = await getPayPalAccessToken();

  const orderData: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
      description: description || "SIMTrace payment",
    }],
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderData),
  });

  const order = await response.json() as Record<string, unknown>;

  if (response.status !== 201) {
    throw new Error(`PayPal order creation failed: ${order.message as string}`);
  }

  // Save payment record
  const payment = await PayPalPayment.create({
    user: userId,
    paymentId: order.id as string,
    amount,
    currency,
    description,
    paypalOrderId: order.id as string,
    status: "created",
    type,
    relatedId,
  });

  return {
    paymentId: payment._id,
    paypalOrderId: order.id as string,
    approvalUrl: (order.links as Array<{ rel: string; href: string }>).find((link) => link.rel === "approve")!.href,
  };
}

// ── Payment Capture ─────────────────────────────────────────────────────────────
export async function capturePayPalPayment(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  const capture = await response.json() as Record<string, unknown>;

  if (response.status !== 201) {
    throw new Error(`PayPal payment capture failed: ${capture.message as string}`);
  }

  // Update payment record
  const payment = await PayPalPayment.findOne({ paypalOrderId: orderId });
  if (!payment) throw new Error("Payment not found");

  (payment as unknown as PayPalPaymentDoc).status = "captured";
  (payment as unknown as PayPalPaymentDoc).paypalCaptureId = (((capture.purchase_units as Array<Record<string, unknown>>)[0].payments as Record<string, unknown>).captures as Array<Record<string, unknown>>)[0].id as string;
  (payment as unknown as PayPalPaymentDoc).paypalPayerId = (capture.payer as Record<string, unknown>).payer_id as string;
  (payment as unknown as PayPalPaymentDoc).paypalEmail = (capture.payer as Record<string, unknown>).email_address as string;
  payment.updatedAt = new Date();
  await payment.save();

  return payment;
}

// ── Payment Retrieval ───────────────────────────────────────────────────────────
export async function getPayPalPayment(paymentId: string) {
  const payment = await PayPalPayment.findById(paymentId)
    .populate("user", "name email");

  return payment;
}

export async function getPayPalPaymentsByUser(userId: string) {
  const payments = await PayPalPayment.find({ user: userId })
    .sort({ createdAt: -1 });

  return payments;
}

// ── Payment Refund ─────────────────────────────────────────────────────────────
export async function refundPayPalPayment(paymentId: string, reason: string) {
  const payment = await PayPalPayment.findById(paymentId);
  if (!payment) throw new Error("Payment not found");

  if ((payment as unknown as PayPalPaymentDoc).status !== "captured") {
    throw new Error("Only captured payments can be refunded");
  }

  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/payments/captures/${(payment as unknown as PayPalPaymentDoc).paypalCaptureId}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ note: reason }),
    }
  );

  const refund = await response.json() as Record<string, unknown>;

  if (response.status !== 201) {
    throw new Error(`PayPal refund failed: ${refund.message as string}`);
  }

  (payment as unknown as PayPalPaymentDoc).status = "refunded";
  payment.updatedAt = new Date();
  await payment.save();

  return payment;
}

// ── Webhook Handling ────────────────────────────────────────────────────────────
export async function verifyPayPalWebhook(headers: Record<string, unknown>, body: Record<string, unknown>): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  // No webhook id configured: fail-closed in production, allow in dev for local testing
  if (!webhookId) return process.env.NODE_ENV !== "production";
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        transmission_id: headers["paypal-transmission-id"] as string,
        transmission_time: headers["paypal-transmission-time"] as string,
        cert_url: headers["paypal-cert-url"] as string,
        auth_algo: headers["paypal-auth-algo"] as string,
        transmission_sig: headers["paypal-transmission-sig"] as string,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });
    const data = await response.json() as Record<string, unknown>;
    return data.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal] Verification failed:", err);
    return false;
  }
}

export async function handlePayPalWebhook(event: PayPalWebhookEvent) {
  const eventType = event.event_type;
  const resource = event.resource;

  switch (eventType) {
    case "PAYMENT.CAPTURE.COMPLETED":
      await capturePayPalPayment(resource.supplementary_data!.related_ids!.order_id!);
      break;
    case "PAYMENT.CAPTURE.DENIED":
      const payment = await PayPalPayment.findOne({ paypalOrderId: resource.supplementary_data!.related_ids!.order_id! });
      if (payment) {
        (payment as unknown as PayPalPaymentDoc).status = "failed";
        payment.updatedAt = new Date();
        await payment.save();
      }
      break;
    default:
      console.log(`Unhandled PayPal webhook event: ${eventType}`);
  }

  return { received: true };
}

// ── Currency Conversion ─────────────────────────────────────────────────────────
export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const { CurrencyRate } = await import("../db/index.js");

  // Get latest rate
  const rate = await CurrencyRate.findOne({
    fromCurrency,
    toCurrency,
    validFrom: { $lte: new Date() },
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null },
    ],
  }).sort({ validFrom: -1 });

  if (!rate) {
    throw new Error(`Currency rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  return amount * (rate as unknown as CurrencyRateDoc).rate;
}

export async function setCurrencyRate(fromCurrency: string, toCurrency: string, rate: number, source = "manual") {
  const { CurrencyRate } = await import("../db/index.js");

  const currencyRate = await CurrencyRate.create({
    fromCurrency,
    toCurrency,
    rate,
    source,
    validFrom: new Date(),
  });

  return currencyRate;
}

export async function getCurrencyRates() {
  const { CurrencyRate } = await import("../db/index.js");

  const rates = await CurrencyRate.find({
    validFrom: { $lte: new Date() },
    $or: [
      { validUntil: { $gte: new Date() } },
      { validUntil: null },
    ],
  }).sort({ validFrom: -1 });

  return rates;
}

// ── Statistics ─────────────────────────────────────────────────────────────────
export async function getPayPalStatistics() {
  const [
    totalPayments,
    capturedPayments,
    failedPayments,
    refundedPayments,
    totalAmount,
    capturedAmount,
  ] = await Promise.all([
    PayPalPayment.countDocuments(),
    PayPalPayment.countDocuments({ status: "captured" }),
    PayPalPayment.countDocuments({ status: "failed" }),
    PayPalPayment.countDocuments({ status: "refunded" }),
    PayPalPayment.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PayPalPayment.aggregate([
      { $match: { status: "captured" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    totalPayments,
    capturedPayments,
    failedPayments,
    refundedPayments,
    successRate: totalPayments > 0 ? ((capturedPayments / totalPayments) * 100).toFixed(2) : 0,
    totalAmount: totalAmount[0]?.total || 0,
    capturedAmount: capturedAmount[0]?.total || 0,
  };
}
