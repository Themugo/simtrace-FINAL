import mongoose from 'mongoose';

// ── Plan ──────────────────────────────────────────────────────────────────────
interface IPlan {
  id: string;
  name?: string;
  priceKES?: number;
  priceUSD?: number;
  deviceLimit?: number;
  extraDeviceKES?: number;
  features?: string[];
  imeiChecksPerDay?: number;
  aiReportsPerMonth?: number;
  slaHours?: number;
}

const planSchema = new mongoose.Schema<IPlan>({
  id: { type: String, unique: true },
  name: String,
  priceKES: Number,
  priceUSD: Number,
  deviceLimit: Number,
  extraDeviceKES: Number,
  features: [String],
  imeiChecksPerDay: Number,
  aiReportsPerMonth: Number,
  slaHours: Number,
});
export const Plan = mongoose.model<IPlan>('Plan', planSchema);

// ── User subscription ─────────────────────────────────────────────────────────
interface ISubscription {
  user: mongoose.Types.ObjectId;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd?: Date;
  stripeSubId?: string;
  mpesaPhone?: string;
  extraDevices: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new mongoose.Schema<ISubscription>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  plan: { type: String, default: 'free' },
  status: { type: String, enum: ['active', 'past_due', 'cancelled', 'trialing'], default: 'active' },
  currentPeriodEnd: Date,
  stripeSubId: String,
  mpesaPhone: String,
  extraDevices: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

// ── Payment ───────────────────────────────────────────────────────────────────
interface IPayment {
  user?: mongoose.Types.ObjectId;
  type: 'subscription' | 'extra_device' | 'imei_check' | 'api_call';
  amountKES?: number;
  amountUSD?: number;
  method: 'mpesa' | 'stripe' | 'bank' | 'free';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  mpesaReceipt?: string;
  description?: string;
  paidAt?: Date;
  createdAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['subscription', 'extra_device', 'imei_check', 'api_call'] },
  amountKES: Number,
  amountUSD: Number,
  method: { type: String, enum: ['mpesa', 'stripe', 'bank', 'free'] },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  reference: String,
  mpesaReceipt: String,
  description: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
});
export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
