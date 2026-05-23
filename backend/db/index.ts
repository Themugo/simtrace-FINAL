import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI environment variable is not set');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected — Mongoose will auto-reconnect');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  console.log('MongoDB connected →', mongoose.connection.host);
}

// ── User ──────────────────────────────────────────────────────────────────────
interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'telecom' | 'law_enforcement';
  phone?: string;
  apiKey?: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'telecom', 'law_enforcement'], default: 'user' },
  phone: { type: String },
  apiKey: { type: String, index: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});
export const User = mongoose.model<IUser>('User', userSchema);

// ── Device ────────────────────────────────────────────────────────────────────
interface IDeviceFingerprint {
  networkMac?: string;
  bluetoothMac?: string;
  screenRes?: string;
  osVersion?: string;
  buildId?: string;
}

interface IDevice {
  imei: string;
  serialNumber?: string;
  make?: string;
  model?: string;
  owner?: mongoose.Types.ObjectId;
  status: 'active' | 'stolen' | 'recovered' | 'blacklisted';
  deviceKey?: string;
  fingerprint?: IDeviceFingerprint;
  lastSeen?: Date;
  createdAt: Date;
}

const deviceSchema = new mongoose.Schema<IDevice>({
  imei: { type: String, required: true, unique: true, index: true },
  serialNumber: { type: String },
  make: { type: String },
  model: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'stolen', 'recovered', 'blacklisted'], default: 'active' },
  deviceKey: { type: String, index: true, sparse: true },
  fingerprint: {
    networkMac: String,
    bluetoothMac: String,
    screenRes: String,
    osVersion: String,
    buildId: String,
  },
  lastSeen: Date,
  createdAt: { type: Date, default: Date.now },
});
deviceSchema.index({ owner: 1, status: 1 });
deviceSchema.index({ status: 1 });
export const Device = mongoose.model<IDevice>('Device', deviceSchema);

// ── Location ping ─────────────────────────────────────────────────────────────
interface IPing {
  imei: string;
  lat: number;
  lng: number;
  accuracy?: number;
  simIccid?: string;
  networkOp?: string;
  ipAddress?: string;
  verified: boolean;
  imageUrl?: string;
  ts: Date;
}

const pingSchema = new mongoose.Schema<IPing>({
  imei: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: Number,
  simIccid: String,
  networkOp: String,
  ipAddress: String,
  verified: { type: Boolean, default: false },
  imageUrl: { type: String },
  ts: { type: Date, default: Date.now, index: true },
});
pingSchema.index({ imei: 1, ts: -1 });
pingSchema.index({ imei: 1, simIccid: 1 });
export const Ping = mongoose.model<IPing>('Ping', pingSchema);

// ── Theft report ──────────────────────────────────────────────────────────────
interface ITheftReport {
  imei: string;
  reportedBy: mongoose.Types.ObjectId;
  description?: string;
  policeRef?: string;
  status: 'open' | 'investigating' | 'recovered' | 'closed';
  createdAt: Date;
  resolvedAt?: Date;
}

const reportSchema = new mongoose.Schema<ITheftReport>({
  imei: { type: String, required: true, index: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  policeRef: String,
  status: { type: String, enum: ['open', 'investigating', 'recovered', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});
export const TheftReport = mongoose.model<ITheftReport>('TheftReport', reportSchema);

// ── Alert ─────────────────────────────────────────────────────────────────────
interface IAlert {
  imei: string;
  type: 'blacklist_ping' | 'sim_swap' | 'location_jump' | 'fraud_pattern' | 'theft_report';
  payload: any;
  narrative?: string;
  read: boolean;
  ts: Date;
}

const alertSchema = new mongoose.Schema<IAlert>({
  imei: { type: String, required: true, index: true },
  type: { type: String, enum: ['blacklist_ping', 'sim_swap', 'location_jump', 'fraud_pattern', 'theft_report'], required: true },
  payload: mongoose.Schema.Types.Mixed,
  narrative: { type: String },
  read: { type: Boolean, default: false },
  ts: { type: Date, default: Date.now },
});
alertSchema.index({ imei: 1, ts: -1 });
alertSchema.index({ read: 1, ts: -1 });
export const Alert = mongoose.model<IAlert>('Alert', alertSchema);

// ────────────────────────────────────────────────────────────────────────────
// MONETISATION SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

// ── Plan / Tier definition (seeded at startup) ────────────────────────────────
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

// ── Payment / Invoice record ──────────────────────────────────────────────────
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

// ── Advertisement ─────────────────────────────────────────────────────────────
interface IAd {
  advertiser?: mongoose.Types.ObjectId;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  placement: 'dashboard_banner' | 'imei_sidebar' | 'devices_footer' | 'alert_feed';
  targetRoles: string[];
  targetPlans: string[];
  budgetKES: number;
  spentKES: number;
  cpcKES: number;
  impressions: number;
  clicks: number;
  status: 'pending' | 'active' | 'paused' | 'exhausted' | 'rejected';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

const adSchema = new mongoose.Schema<IAd>({
  advertiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, maxlength: 80 },
  body: { type: String, required: true, maxlength: 200 },
  ctaText: { type: String, default: 'Learn More' },
  ctaUrl: { type: String, required: true },
  imageUrl: String,
  placement: { type: String, enum: ['dashboard_banner', 'imei_sidebar', 'devices_footer', 'alert_feed'], default: 'dashboard_banner' },
  targetRoles: [{ type: String }],
  targetPlans: [{ type: String }],
  budgetKES: { type: Number, required: true },
  spentKES: { type: Number, default: 0 },
  cpcKES: { type: Number, default: 5 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'paused', 'exhausted', 'rejected'], default: 'pending' },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
});
export const Ad = mongoose.model<IAd>('Ad', adSchema);

// ── Telecom / Agency partner ──────────────────────────────────────────────────
interface IPartner {
  user?: mongoose.Types.ObjectId;
  orgName: string;
  orgType: 'telecom' | 'law_enforcement' | 'marketplace' | 'insurance';
  country: string;
  apiKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
  tier: 'basic' | 'standard' | 'premium';
  apiCallsMonth: number;
  apiCallsLimit: number;
  lastReset: Date;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
}

const partnerSchema = new mongoose.Schema<IPartner>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orgName: { type: String, required: true },
  orgType: { type: String, enum: ['telecom', 'law_enforcement', 'marketplace', 'insurance'], required: true },
  country: { type: String, default: 'KE' },
  apiKey: { type: String, unique: true, index: true },
  webhookUrl: String,
  webhookSecret: String,
  tier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
  apiCallsMonth: { type: Number, default: 0 },
  apiCallsLimit: { type: Number, default: 1000 },
  lastReset: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
export const Partner = mongoose.model<IPartner>('Partner', partnerSchema);

// ── Ad click / impression event ───────────────────────────────────────────────
interface IAdEvent {
  ad: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  type: 'impression' | 'click';
  ip?: string;
  ts: Date;
}

const adEventSchema = new mongoose.Schema<IAdEvent>({
  ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['impression', 'click'] },
  ip: String,
  ts: { type: Date, default: Date.now },
});
adEventSchema.index({ ad: 1, ts: -1 });
export const AdEvent = mongoose.model<IAdEvent>('AdEvent', adEventSchema);

// Password reset tokens
interface IPasswordReset {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
}

const resetSchema = new mongoose.Schema<IPasswordReset>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});
resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', resetSchema);
