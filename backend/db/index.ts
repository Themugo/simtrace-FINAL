import mongoose from 'mongoose';
export { PricingConfig } from '../models/PricingConfig.js';
import { PricingConfig } from '../models/PricingConfig.js';

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
  role: 'user' | 'admin' | 'super_admin' | 'telecom' | 'law_enforcement';
  phone?: string;
  apiKey?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  mustChangePassword?: boolean;
  tokenVersion?: number;
  authProvider?: 'local' | 'google';
  providerId?: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin', 'super_admin', 'telecom', 'law_enforcement'], default: 'user' },
  phone: { type: String },
  apiKey: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  twoFactorBackupCodes: [String],
  tokenVersion: { type: Number, default: 0 },
  mustChangePassword: { type: Boolean, default: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  providerId: { type: String, index: true, sparse: true },
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
  status: 'active' | 'stolen' | 'recovered' | 'blacklisted' | 'inactive';
  locked?: boolean;
  deviceKey?: string;
  fingerprint?: IDeviceFingerprint;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

const deviceSchema = new mongoose.Schema<IDevice>({
  imei: { type: String, required: true, unique: true, index: true },
  serialNumber: { type: String },
  make: { type: String },
  model: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'stolen', 'recovered', 'blacklisted', 'inactive'], default: 'active' },
  locked: { type: Boolean, default: false },
  updatedAt: { type: Date },
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

// ────────────────────────────────────────────────────────────────────────────
// TELEMETRY COLLECTIONS
// ────────────────────────────────────────────────────────────────────────────

// ── Tracking Events ─────────────────────────────────────────────────────────
interface ITrackingEvent {
  imei: string;
  eventType: 'location_update' | 'network_change' | 'sim_change' | 'device_boot' | 'app_install' | 'app_uninstall' | 'suspicious_activity';
  data: Record<string, any>;
  timestamp: Date;
  riskScore?: number;
  threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const trackingEventSchema = new mongoose.Schema<ITrackingEvent>({
  imei: { type: String, required: true, index: true },
  eventType: { type: String, required: true, enum: ['location_update', 'network_change', 'sim_change', 'device_boot', 'app_install', 'app_uninstall', 'suspicious_activity'] },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});
trackingEventSchema.index({ imei: 1, timestamp: -1 });
trackingEventSchema.index({ eventType: 1, timestamp: -1 });
trackingEventSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL
export const TrackingEvent = mongoose.model<ITrackingEvent>('TrackingEvent', trackingEventSchema);

// ── Device Sessions ─────────────────────────────────────────────────────────
interface IDeviceSession {
  imei: string;
  userId?: mongoose.Types.ObjectId;
  deviceKey?: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  eventsCount: number;
}

const deviceSessionSchema = new mongoose.Schema<IDeviceSession>({
  imei: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceKey: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  eventsCount: { type: Number, default: 0 },
});
deviceSessionSchema.index({ imei: 1, startTime: -1 });
deviceSessionSchema.index({ userId: 1, startTime: -1 });
deviceSessionSchema.index({ startTime: -1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 }); // 180 days TTL
export const DeviceSession = mongoose.model<IDeviceSession>('DeviceSession', deviceSessionSchema);

// ── Device Locations ────────────────────────────────────────────────────────
interface IDeviceLocation {
  imei: string;
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: 'gps' | 'network' | 'passive' | 'manual';
}

const deviceLocationSchema = new mongoose.Schema<IDeviceLocation>({
  imei: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: { type: Number },
  altitude: { type: Number },
  heading: { type: Number },
  speed: { type: Number },
  timestamp: { type: Date, required: true, index: true },
  source: { type: String, enum: ['gps', 'network', 'passive', 'manual'], default: 'gps' },
});
deviceLocationSchema.index({ imei: 1, timestamp: -1 });
deviceLocationSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL
deviceLocationSchema.index({ lat: 1, lng: 1 }); // Geospatial queries
export const DeviceLocation = mongoose.model<IDeviceLocation>('DeviceLocation', deviceLocationSchema);

// ────────────────────────────────────────────────────────────────────────────
// ORGANIZATION / MULTI-TENANT COLLECTIONS
// ────────────────────────────────────────────────────────────────────────────

// ── Organization ─────────────────────────────────────────────────────────────
interface IOrganization {
  name: string;
  slug: string;
  type: 'personal' | 'telecom' | 'law_enforcement' | 'insurance' | 'enterprise' | 'reseller';
  plan: 'free' | 'pro' | 'enterprise' | 'telecom' | 'law_enforcement';
  owner: mongoose.Types.ObjectId;
  settings: {
    branding?: {
      logo?: string;
      primaryColor?: string;
      customDomain?: string;
    };
    features?: {
      aiReports?: boolean;
      advancedAnalytics?: boolean;
      apiAccess?: boolean;
      webhookNotifications?: boolean;
    };
    limits?: {
      devices?: number;
      users?: number;
      apiCallsPerDay?: number;
      storageGB?: number;
    };
  };
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new mongoose.Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['personal', 'telecom', 'law_enforcement', 'insurance', 'enterprise', 'reseller'], default: 'personal' },
  plan: { type: String, enum: ['free', 'pro', 'enterprise', 'telecom', 'law_enforcement'], default: 'free' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  settings: {
    branding: {
      logo: String,
      primaryColor: String,
      customDomain: String,
    },
    features: {
      aiReports: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      webhookNotifications: { type: Boolean, default: false },
    },
    limits: {
      devices: { type: Number, default: 5 },
      users: { type: Number, default: 3 },
      apiCallsPerDay: { type: Number, default: 100 },
      storageGB: { type: Number, default: 1 },
    },
  },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
organizationSchema.index({ owner: 1 });
organizationSchema.index({ type: 1, status: 1 });
export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

// ── Organization Member ──────────────────────────────────────────────────────
interface IOrganizationMember {
  organization: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  invitedBy?: mongoose.Types.ObjectId;
  joinedAt: Date;
  status: 'active' | 'pending' | 'invited' | 'removed';
}

const organizationMemberSchema = new mongoose.Schema<IOrganizationMember>({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  permissions: [{ type: String }],
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'pending', 'invited', 'removed'], default: 'pending' },
});
organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });
organizationMemberSchema.index({ user: 1 });
organizationMemberSchema.index({ organization: 1, status: 1 });
export const OrganizationMember = mongoose.model<IOrganizationMember>('OrganizationMember', organizationMemberSchema);

// ── Organization Role (Custom Roles) ───────────────────────────────────────────
interface IOrganizationRole {
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
}

const organizationRoleSchema = new mongoose.Schema<IOrganizationRole>({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
organizationRoleSchema.index({ organization: 1, name: 1 });
export const OrganizationRole = mongoose.model<IOrganizationRole>('OrganizationRole', organizationRoleSchema);

// ── Team ─────────────────────────────────────────────────────────────────────
interface ITeam {
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  lead?: mongoose.Types.ObjectId;
  parentTeam?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new mongoose.Schema<ITeam>({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
teamSchema.index({ organization: 1 });
teamSchema.index({ lead: 1 });
teamSchema.index({ parentTeam: 1 });
export const Team = mongoose.model<ITeam>('Team', teamSchema);

// ── Team Member ───────────────────────────────────────────────────────────────
interface ITeamMember {
  team: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'lead' | 'member';
  joinedAt: Date;
}

const teamMemberSchema = new mongoose.Schema<ITeamMember>({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['lead', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});
teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });
teamMemberSchema.index({ user: 1 });
export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);

// ── Organization Invite ─────────────────────────────────────────────────────────
interface IOrganizationInvite {
  organization: mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
}

const organizationInviteSchema = new mongoose.Schema<IOrganizationInvite>({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: Date,
  status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
organizationInviteSchema.index({ organization: 1, email: 1 });
organizationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OrganizationInvite = mongoose.model<IOrganizationInvite>('OrganizationInvite', organizationInviteSchema);

// ── Notification Preferences ─────────────────────────────────────────────────────
interface INotificationPreferences {
  user: mongoose.Types.ObjectId;
  channels: {
    sms: boolean;
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  alertTypes: {
    theft_report: boolean;
    sim_swap: boolean;
    location_jump: boolean;
    fraud_pattern: boolean;
    blacklist_ping: boolean;
    recovery_update: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferencesSchema = new mongoose.Schema<INotificationPreferences>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  channels: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },
  alertTypes: {
    theft_report: { type: Boolean, default: true },
    sim_swap: { type: Boolean, default: true },
    location_jump: { type: Boolean, default: true },
    fraud_pattern: { type: Boolean, default: true },
    blacklist_ping: { type: Boolean, default: true },
    recovery_update: { type: Boolean, default: true },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '08:00' },
    timezone: { type: String, default: 'Africa/Nairobi' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const NotificationPreferences = mongoose.model<INotificationPreferences>('NotificationPreferences', notificationPreferencesSchema);

// ── Audit Log ───────────────────────────────────────────────────────────────
interface IAuditLog {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  method: { type: String, required: true },
  path: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  statusCode: { type: Number },
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year retention
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

// ── Law Enforcement Case ───────────────────────────────────────────────────────
interface ILawEnforcementCase {
  caseNumber: string;
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  agency: string;
  status: 'open' | 'investigating' | 'evidence_collection' | 'prosecution' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedImeis: string[];
  relatedDevices: mongoose.Types.ObjectId[];
  evidence: Array<{
    id: string;
    type: string;
    description: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
    chainOfCustody: Array<{
      handler: string;
      action: string;
      timestamp: Date;
      notes?: string;
    }>;
  }>;
  notes: Array<{
    addedBy: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    isInternal: boolean;
  }>;
  collaborators: Array<{
    userId: mongoose.Types.ObjectId;
    role: string;
    agency: string;
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const lawEnforcementCaseSchema = new mongoose.Schema<ILawEnforcementCase>({
  caseNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agency: { type: String, required: true },
  status: { type: String, enum: ['open', 'investigating', 'evidence_collection', 'prosecution', 'closed', 'archived'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  relatedImeis: [{ type: String }],
  relatedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  evidence: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    chainOfCustody: [{
      handler: { type: String, required: true },
      action: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      notes: String,
    }],
  }],
  notes: [{
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false },
  }],
  collaborators: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    agency: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  closedAt: Date,
});
lawEnforcementCaseSchema.index({ assignedTo: 1, status: 1 });
lawEnforcementCaseSchema.index({ agency: 1, status: 1 });
lawEnforcementCaseSchema.index({ relatedImeis: 1 });
export const LawEnforcementCase = mongoose.model<ILawEnforcementCase>('LawEnforcementCase', lawEnforcementCaseSchema);

// ── Feature models (insurance, blockchain ledger, cross-border, device DNA,
//    financial projections, ad campaigns, recovery network). Schemas are
//    flexible (strict:false) so the service layer can evolve field shapes
//    without data loss; core query fields are typed/indexed below.
const opts = { strict: false as const, timestamps: true };
const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

const insurancePolicySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  policyNumber: { type: String, unique: true, sparse: true },
  provider: String, providerId: String, coverageType: String,
  devices: [Mixed], premium: Number, currency: String, deductible: Number,
  coverageLimit: Number, startDate: Date, endDate: Date, renewalDate: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const InsurancePolicy = mongoose.models.InsurancePolicy || mongoose.model('InsurancePolicy', insurancePolicySchema);

const insuranceClaimSchema = new mongoose.Schema({
  policy: { type: oid, ref: 'InsurancePolicy', index: true },
  user: { type: oid, ref: 'User', index: true },
  device: { type: oid, ref: 'Device' },
  claimNumber: { type: String, unique: true, sparse: true },
  claimType: String, incidentDate: Date, incidentLocation: Mixed, description: String,
  evidence: [Mixed], policeReportNumber: String, policeStation: String,
  claimedAmount: Number, currency: String,
  status: { type: String, default: 'submitted', index: true },
}, opts);
export const InsuranceClaim = mongoose.models.InsuranceClaim || mongoose.model('InsuranceClaim', insuranceClaimSchema);

const blockchainLedgerSchema = new mongoose.Schema({
  imei: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  transactionHash: { type: String, index: true }, blockNumber: Number, blockHash: String,
  timestamp: Date, eventType: { type: String, index: true }, eventData: Mixed,
  fromAddress: String, toAddress: String, initiator: String,
  verified: { type: Boolean, default: false }, confirmations: { type: Number, default: 0 },
  ceirSynced: { type: Boolean, default: false },
}, opts);
export const BlockchainLedger = mongoose.models.BlockchainLedger || mongoose.model('BlockchainLedger', blockchainLedgerSchema);

const crossBorderRequestSchema = new mongoose.Schema({
  imei: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  recoveryCase: { type: oid, ref: 'RecoveryCase' },
  requestingCountry: String, targetCountry: { type: String, index: true },
  requestType: String, treaty: String, referenceNumber: { type: String, unique: true, sparse: true },
  priority: String, requestingAuthority: Mixed, targetAuthority: Mixed, evidence: [Mixed],
  status: { type: String, default: 'pending', index: true }, submittedAt: Date, expiresAt: Date,
}, opts);
export const CrossBorderRequest = mongoose.models.CrossBorderRequest || mongoose.model('CrossBorderRequest', crossBorderRequestSchema);

const recoveryAgentSchema = new mongoose.Schema({
  name: String, type: { type: String, index: true }, email: String, phone: String,
  location: Mixed, capabilities: Mixed, partnerOrg: String,
  verified: { type: Boolean, default: false }, backgroundCheck: { type: Boolean, default: false },
  totalCases: { type: Number, default: 0 }, successfulRecoveries: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 }, avgResponseTime: { type: Number, default: 0 },
  available: { type: Boolean, default: true, index: true }, currentLoad: { type: Number, default: 0 },
}, opts);
export const RecoveryAgent = mongoose.models.RecoveryAgent || mongoose.model('RecoveryAgent', recoveryAgentSchema);

const recoveryCaseSchema = new mongoose.Schema({
  imei: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  reportedBy: Mixed, status: { type: String, default: 'open', index: true }, priority: String,
  lastKnownLocation: Mixed, currentLocation: Mixed, assignedAgents: [Mixed],
  workflowSteps: [Mixed], communications: [Mixed],
  recoveryFee: Number, rewardOffered: Number, rewardPaid: { type: Number, default: 0 },
  crossBorder: { type: Boolean, default: false },
}, opts);
export const RecoveryCase = mongoose.models.RecoveryCase || mongoose.model('RecoveryCase', recoveryCaseSchema);

const deviceDnaSchema = new mongoose.Schema({
  imei: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  chipset: Mixed, radio: Mixed, sensors: Mixed, entropy: Mixed,
  verified: { type: Boolean, default: false }, cloneDetected: { type: Boolean, default: false },
  cloneCount: { type: Number, default: 0 },
}, opts);
export const DeviceDna = mongoose.models.DeviceDna || mongoose.model('DeviceDna', deviceDnaSchema);

const financialProjectionSchema = new mongoose.Schema({
  period: { type: String, index: true }, startDate: Date, endDate: Date,
  targetRevenue: Number, targetUsers: Number,
}, opts);
export const FinancialProjection = mongoose.models.FinancialProjection || mongoose.model('FinancialProjection', financialProjectionSchema);

const adCampaignSchema = new mongoose.Schema({
  name: String, advertiser: Mixed, whiteLabel: Mixed,
  status: { type: String, default: 'draft', index: true },
  budget: Mixed, bidding: Mixed, targeting: Mixed,
  creatives: [Mixed], placements: [Mixed], schedule: Mixed, metrics: Mixed,
}, opts);
export const AdCampaign = mongoose.models.AdCampaign || mongoose.model('AdCampaign', adCampaignSchema);

// ── Compliance models (Kenya DPA / GDPR / CCPA) ──────────────────────────────
const gdprRequestSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  requestType: { type: String, index: true },           // access | erasure | portability | rectification | restriction
  status: { type: String, default: 'pending', index: true }, // pending | processing | completed | rejected
  gdprArticle: String,
  processedBy: { type: oid, ref: 'User' },
  processedAt: Date,
  rejectionReason: String,
  exportData: Mixed,
  completedAt: Date,
}, opts);
export const GdprRequest = mongoose.models.GdprRequest || mongoose.model('GdprRequest', gdprRequestSchema);

const dataResidencySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  region: { type: String, index: true },                // eu | us | ke | ...
  storageLocations: [Mixed],
  gdprCompliant: { type: Boolean, default: false },
  ccpaCompliant: { type: Boolean, default: false },
}, opts);
export const DataResidency = mongoose.models.DataResidency || mongoose.model('DataResidency', dataResidencySchema);

// ── Device control (remote lock + ownership transfer) ────────────────────────
const deviceLockSchema = new mongoose.Schema({
  lockId: { type: String, unique: true, index: true },
  deviceId: { type: String, index: true },
  userId: { type: String, index: true },
  status: { type: String, default: 'active', index: true }, // active | unlocked | wiped | expired
  lockType: String, reason: String, message: String,
  temporary: { type: Boolean, default: false },
  expiresAt: Date,
  failedAttempts: { type: Number, default: 0 },
  wiped: { type: Boolean, default: false },
  createdBy: String, updatedBy: String,
}, opts);
export const DeviceLock = mongoose.models.DeviceLock || mongoose.model('DeviceLock', deviceLockSchema);

const deviceTransferSchema = new mongoose.Schema({
  transferId: { type: String, unique: true, index: true },
  deviceId: { type: String, index: true },
  userId: { type: String, index: true },          // current owner / initiator
  toUserId: { type: String, index: true },         // recipient
  status: { type: String, default: 'pending', index: true }, // pending | accepted | confirmed | cancelled | disputed | resolved
  reason: String, disputeReason: String, resolution: String,
  createdBy: String, updatedBy: String,
}, opts);
export const DeviceTransfer = mongoose.models.DeviceTransfer || mongoose.model('DeviceTransfer', deviceTransferSchema);

// ── Law-enforcement / police cluster ─────────────────────────────────────────
// NOTE: schemas marked [SENSITIVE] hold crime-report PII, evidence, or access
// control and need legal/security review (Kenya DPA 2019 + criminal procedure)
// before go-live. Identifiers are immutable; sensitive records carry actor +
// timestamp audit fields.

// Structural / reference
const lawEnforcementAgencySchema = new mongoose.Schema({
  agencyId: { type: String, unique: true, index: true },
  name: String, country: String, type: String, createdBy: String, updatedBy: String,
}, opts);
export const LawEnforcementAgency = mongoose.models.LawEnforcementAgency || mongoose.model('LawEnforcementAgency', lawEnforcementAgencySchema);

const policeStationSchema = new mongoose.Schema({
  stationId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, county: String, code: String, contact: Mixed,
}, opts);
export const PoliceStation = mongoose.models.PoliceStation || mongoose.model('PoliceStation', policeStationSchema);

const policeRoleSchema = new mongoose.Schema({
  roleId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, level: Number, permissions: [Mixed],
}, opts);
export const PoliceRole = mongoose.models.PoliceRole || mongoose.model('PoliceRole', policeRoleSchema);

const policeHierarchySchema = new mongoose.Schema({
  unitId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, parentUnit: { type: oid, ref: 'PoliceHierarchy' }, level: Number,
}, opts);
export const PoliceHierarchy = mongoose.models.PoliceHierarchy || mongoose.model('PoliceHierarchy', policeHierarchySchema);

const lawEnforcementDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const LawEnforcementDashboard = mongoose.models.LawEnforcementDashboard || mongoose.model('LawEnforcementDashboard', lawEnforcementDashboardSchema);

const missingPersonRuleSchema = new mongoose.Schema({
  name: { type: String, index: true }, active: { type: Boolean, default: true }, criteria: Mixed,
}, opts);
export const MissingPersonRule = mongoose.models.MissingPersonRule || mongoose.model('MissingPersonRule', missingPersonRuleSchema);

// Process / workflow
const policeUserAssignmentSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  role: { type: oid, ref: 'PoliceRole' }, hierarchyUnit: { type: oid, ref: 'PoliceHierarchy' },
  assignedBy: String, validFrom: Date, validUntil: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const PoliceUserAssignment = mongoose.models.PoliceUserAssignment || mongoose.model('PoliceUserAssignment', policeUserAssignmentSchema);

const recoveryWorkflowSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  station: { type: oid, ref: 'PoliceStation' },
  currentStage: { type: String, default: 'reported', index: true },
  status: { type: String, default: 'active', index: true },
  stageHistory: [Mixed],
}, opts);
export const RecoveryWorkflow = mongoose.models.RecoveryWorkflow || mongoose.model('RecoveryWorkflow', recoveryWorkflowSchema);

const nationwideAlertSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  policeReport: { type: oid, ref: 'PoliceReport' },
  alertType: String, alertLevel: { type: String, index: true },
  deviceDescription: String, devicePhoto: String, uniqueFeatures: Mixed, lastKnownLocation: Mixed,
  status: { type: String, default: 'active', index: true }, notifiedStations: [oid],
}, opts);
export const NationwideAlert = mongoose.models.NationwideAlert || mongoose.model('NationwideAlert', nationwideAlertSchema);

const cooperationAlertSchema = new mongoose.Schema({
  caseId: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  requestingUnit: { type: oid, ref: 'PoliceHierarchy' }, respondingUnit: { type: oid, ref: 'PoliceHierarchy' },
  requestType: String, requestedAt: Date, expectedResponseBy: Date,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const CooperationAlert = mongoose.models.CooperationAlert || mongoose.model('CooperationAlert', cooperationAlertSchema);

const seniorConfirmationSchema = new mongoose.Schema({
  caseId: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  originalRequest: Mixed, seniorOfficer: { type: oid, ref: 'User' }, seniorUnit: { type: oid, ref: 'PoliceHierarchy' },
  status: { type: String, default: 'pending', index: true },
}, opts);
export const SeniorConfirmation = mongoose.models.SeniorConfirmation || mongoose.model('SeniorConfirmation', seniorConfirmationSchema);

// [SENSITIVE] crime report — PII + evidence; obNumber immutable
const policeReportSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  user: { type: oid, ref: 'User', index: true },
  station: { type: oid, ref: 'PoliceStation', index: true },
  obNumber: { type: String, unique: true, sparse: true, index: true, immutable: true },
  reportDate: Date, incidentDate: Date, incidentLocation: Mixed,
  incidentType: String, incidentDescription: String,
  abstractNumber: String, abstractFile: String,
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const PoliceReport = mongoose.models.PoliceReport || mongoose.model('PoliceReport', policeReportSchema);

// [SENSITIVE] court case — chain of custody; caseNumber immutable
const courtCaseSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  courtName: String, courtType: String, courtLocation: String,
  caseNumber: { type: String, unique: true, sparse: true, index: true, immutable: true },
  caseType: String, charges: [Mixed], prosecutor: String, defenseLawyer: String, judge: String,
  status: { type: String, default: 'filed', index: true },
}, opts);
export const CourtCase = mongoose.models.CourtCase || mongoose.model('CourtCase', courtCaseSchema);

// [SENSITIVE] Interpol notice
const interpolCaseSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  interpolNotice: String, noticeNumber: { type: String, index: true },
  originatingCountry: String, targetCountries: [String], noticeType: String, description: String,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const InterpolCase = mongoose.models.InterpolCase || mongoose.model('InterpolCase', interpolCaseSchema);

// [SENSITIVE] case transfer — chain of custody (who moved a case, when)
const caseTransferSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  fromStation: { type: oid, ref: 'PoliceStation' }, toStation: { type: oid, ref: 'PoliceStation' },
  transferReason: String, transferNotes: String, requestedBy: { type: oid, ref: 'User' },
  status: { type: String, default: 'pending', index: true },
}, opts);
export const CaseTransfer = mongoose.models.CaseTransfer || mongoose.model('CaseTransfer', caseTransferSchema);

// [SENSITIVE — needs security review] who may access which record, time-boxed
const dataAccessControlSchema = new mongoose.Schema({
  entityType: { type: String, index: true }, entityId: { type: String, index: true },
  requestedBy: { type: oid, ref: 'User' }, requestedRole: { type: oid, ref: 'PoliceRole' }, requestedUnit: { type: oid, ref: 'PoliceHierarchy' },
  caseId: { type: String, index: true }, accessType: String, accessReason: String,
  grantedAt: Date, expiresAt: Date,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const DataAccessControl = mongoose.models.DataAccessControl || mongoose.model('DataAccessControl', dataAccessControlSchema);

// [SENSITIVE — needs security review] encrypted-at-rest payloads.
// WARNING: service stores `encryptionKey: iv` next to ciphertext — the real
// symmetric key must NOT be persisted here; this belongs in a KMS/secret store.
const encryptedDataSchema = new mongoose.Schema({
  entityType: { type: String, index: true }, entityId: { type: String, index: true },
  dataType: String, originalHash: String, encryptedData: String,
  encryptionKey: String, iv: String, authTag: String, encryptionAlgorithm: String, owner: { type: oid, ref: 'User' },
  status: { type: String, default: 'encrypted', index: true },
}, opts);
export const EncryptedData = mongoose.models.EncryptedData || mongoose.model('EncryptedData', encryptedDataSchema);

// ── Admin / super-admin cluster ──────────────────────────────────────────────
// Privileged surface — enforce role guards + DashboardAccessLog audit on every
// endpoint before exposure. SECURITY: OfficialEmail.verificationToken,
// SecurityOtp.otpNumber, and PasswordResetRequest.verificationCode are written
// in plaintext by the service — hash + short-TTL them before go-live.
const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true, sparse: true, index: true },
  managedBy: { type: oid, ref: 'SuperAdmin', index: true },
  status: { type: String, default: 'active', index: true }, verified: { type: Boolean, default: false },
}, opts);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const superAdminSchema = new mongoose.Schema({
  superAdminId: { type: String, unique: true, sparse: true, index: true },
  managedAdmins: [oid], immutable: { type: Boolean, default: false },
  status: { type: String, default: 'active', index: true },
}, opts);
export const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);

const adminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const AdminDashboard = mongoose.models.AdminDashboard || mongoose.model('AdminDashboard', adminDashboardSchema);

const adminRolePermissionSchema = new mongoose.Schema({
  role: { type: String, index: true }, permissions: [Mixed],
  status: { type: String, default: 'active', index: true },
}, opts);
export const AdminRolePermission = mongoose.models.AdminRolePermission || mongoose.model('AdminRolePermission', adminRolePermissionSchema);

const officialEmailSchema = new mongoose.Schema({
  emailId: { type: String, unique: true, sparse: true, index: true },
  officialEmail: { type: String, index: true }, verificationToken: String, verificationExpiresAt: Date,
  verified: { type: Boolean, default: false }, status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const OfficialEmail = mongoose.models.OfficialEmail || mongoose.model('OfficialEmail', officialEmailSchema);

const securityOtpSchema = new mongoose.Schema({
  otpId: { type: String, unique: true, sparse: true, index: true },
  otpNumber: String, holderName: String, purpose: String, expiresAt: Date,
  used: { type: Boolean, default: false }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const SecurityOtp = mongoose.models.SecurityOtp || mongoose.model('SecurityOtp', securityOtpSchema);

const superAdminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const SuperAdminDashboard = mongoose.models.SuperAdminDashboard || mongoose.model('SuperAdminDashboard', superAdminDashboardSchema);

const dashboardAccessLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true, sparse: true, index: true },
  user: { type: oid, ref: 'User', index: true }, dashboard: String, action: String,
  riskScore: { type: Number, default: 0 }, suspiciousActivity: { type: Boolean, default: false, index: true },
  ipAddress: String, userAgent: String,
}, opts);
export const DashboardAccessLog = mongoose.models.DashboardAccessLog || mongoose.model('DashboardAccessLog', dashboardAccessLogSchema);

const ministerDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  ministerId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const MinisterDashboard = mongoose.models.MinisterDashboard || mongoose.model('MinisterDashboard', ministerDashboardSchema);

const networkChangeRequestSchema = new mongoose.Schema({
  requestId: { type: String, unique: true, sparse: true, index: true },
  requesterId: { type: String, index: true }, requesterEmailId: String, requesterOtpId: String,
  requiredApprovals: Number, approvals: [Mixed], status: { type: String, default: 'requested', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const NetworkChangeRequest = mongoose.models.NetworkChangeRequest || mongoose.model('NetworkChangeRequest', networkChangeRequestSchema);

const passwordResetRequestSchema = new mongoose.Schema({
  requestId: { type: String, unique: true, sparse: true, index: true },
  requesterId: { type: String, index: true }, requesterEmailId: String, requesterOtpId: String,
  verificationCode: String, verificationExpiresAt: Date, status: { type: String, default: 'requested', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const PasswordResetRequest = mongoose.models.PasswordResetRequest || mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

const policeGeneralDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  policeGeneralId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const PoliceGeneralDashboard = mongoose.models.PoliceGeneralDashboard || mongoose.model('PoliceGeneralDashboard', policeGeneralDashboardSchema);

const stationAdminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  stationAdminId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const StationAdminDashboard = mongoose.models.StationAdminDashboard || mongoose.model('StationAdminDashboard', stationAdminDashboardSchema);

const userDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  userId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const UserDashboard = mongoose.models.UserDashboard || mongoose.model('UserDashboard', userDashboardSchema);

// ── Safety & family cluster ──────────────────────────────────────────────────
// SENSITIVE: ParentChild holds minors' data/location (consent + minimal
// retention required); SelfieCapture/ThiefReport capture a person's image and
// assert theft (consent + lawfulness + defamation risk). Consent/retention
// fields are modeled below but the services do not yet set/enforce them —
// enforce before go-live.
const guardianSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  guardian: { type: oid, ref: 'User', index: true },
  name: String, phone: String, email: String, relationship: String,   // PII
  permissions: [Mixed], canReportTheft: { type: Boolean, default: true },
  emergencyOnly: { type: Boolean, default: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const Guardian = mongoose.models.Guardian || mongoose.model('Guardian', guardianSchema);

const parentChildSchema = new mongoose.Schema({
  parent: { type: oid, ref: 'User', index: true },
  child: { type: oid, ref: 'User', index: true },
  childName: String, childAge: Number, school: String,                 // minor PII
  canTrack: { type: Boolean, default: true }, canManageDevice: { type: Boolean, default: true },
  canReceiveAlerts: { type: Boolean, default: true },
  guardianConsent: { type: Boolean, default: false }, consentRecordedAt: Date, dataRetentionUntil: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const ParentChild = mongoose.models.ParentChild || mongoose.model('ParentChild', parentChildSchema);

const panicModeSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  device: { type: oid, ref: 'Device', index: true },
  panicType: String, description: String, location: Mixed, authorizedTrackers: [Mixed],
  status: { type: String, default: 'active', index: true },
}, opts);
export const PanicMode = mongoose.models.PanicMode || mongoose.model('PanicMode', panicModeSchema);

const nearbyDeviceDetectionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  user: { type: oid, ref: 'User', index: true },
  timestamp: Date, location: Mixed, nearbyDevices: [Mixed],
  incidentType: String, incidentDescription: String,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const NearbyDeviceDetection = mongoose.models.NearbyDeviceDetection || mongoose.model('NearbyDeviceDetection', nearbyDeviceDetectionSchema);

const selfieCaptureSchema = new mongoose.Schema({
  captureId: { type: String, unique: true, sparse: true, index: true },
  device: { type: oid, ref: 'Device', index: true }, user: { type: oid, ref: 'User' },
  imageHash: String, imageUrl: String, captureLocation: Mixed,
  unlockAttempt: Mixed, thiefReported: { type: Boolean, default: false },
  consentBasis: String, retentionUntil: Date,                          // lawfulness/retention
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const SelfieCapture = mongoose.models.SelfieCapture || mongoose.model('SelfieCapture', selfieCaptureSchema);

const thiefReportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, sparse: true, index: true },
  selfieCaptureId: { type: oid, ref: 'SelfieCapture', index: true },
  device: { type: oid, ref: 'Device' },
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const ThiefReport = mongoose.models.ThiefReport || mongoose.model('ThiefReport', thiefReportSchema);

const anomalyDetectionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true }, imei: { type: String, index: true },
  anomalyType: { type: String, index: true }, severity: { type: String, index: true },
  baselineData: Mixed, observedData: Mixed, deviationScore: Number, location: Mixed,
  status: { type: String, default: 'detected', index: true },
}, opts);
export const AnomalyDetection = mongoose.models.AnomalyDetection || mongoose.model('AnomalyDetection', anomalyDetectionSchema);

const riskPredictionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true }, imei: { type: String, index: true },
  riskScore: Number, riskLevel: { type: String, index: true }, factors: [Mixed],
  predictedEvent: String, confidence: Number, recommendations: [Mixed], validUntil: Date,
}, opts);
export const RiskPrediction = mongoose.models.RiskPrediction || mongoose.model('RiskPrediction', riskPredictionSchema);

// ── Commercial cluster (payments, marketplace, resellers, webhooks, config) ──
// SECURITY/COMPLIANCE: PayPalPayment + RecoveryReward move money (verify
// webhook signatures + idempotency before live traffic); WebhookSubscription
// stores a signing secret and PublicApiKey a key hash (good — keep hashed);
// RegulatoryBlock blocks a device on an authority's behalf (verify authority);
// Reseller holds business PII.
const agencyConfigSchema = new mongoose.Schema({
  agencyId: { type: String, index: true }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const AgencyConfig = mongoose.models.AgencyConfig || mongoose.model('AgencyConfig', agencyConfigSchema);

const countryConfigSchema = new mongoose.Schema({
  countryCode: { type: String, index: true }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const CountryConfig = mongoose.models.CountryConfig || mongoose.model('CountryConfig', countryConfigSchema);

const deviceFleetSchema = new mongoose.Schema({
  organization: { type: oid, ref: 'Organization', index: true },
  name: String, description: String, autoRegister: { type: Boolean, default: false },
  deviceLimit: Number, monitoringEnabled: { type: Boolean, default: true }, alertThresholds: Mixed,
  status: { type: String, default: 'active', index: true },
}, opts);
export const DeviceFleet = mongoose.models.DeviceFleet || mongoose.model('DeviceFleet', deviceFleetSchema);

const deviceRegistrationSchema = new mongoose.Schema({
  registrationId: { type: String, unique: true, sparse: true, index: true },
  sellerId: { type: oid, ref: 'SellerReseller', index: true }, commissionAmount: Number,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const DeviceRegistration = mongoose.models.DeviceRegistration || mongoose.model('DeviceRegistration', deviceRegistrationSchema);

const partnerListingSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true }, organization: { type: oid, ref: 'Organization' },
  name: String, category: { type: String, index: true }, description: String,
  services: [Mixed], countries: [String], regions: [String], pricingModel: String,
  status: { type: String, default: 'active', index: true },
}, opts);
export const PartnerListing = mongoose.models.PartnerListing || mongoose.model('PartnerListing', partnerListingSchema);

const payPalPaymentSchema = new mongoose.Schema({   // financial
  user: { type: oid, ref: 'User', index: true }, paymentId: { type: String, index: true },
  amount: Number, currency: String, description: String,
  paypalOrderId: { type: String, index: true }, type: String, relatedId: String,
  status: { type: String, default: 'created', index: true },
}, opts);
export const PayPalPayment = mongoose.models.PayPalPayment || mongoose.model('PayPalPayment', payPalPaymentSchema);

const policyRuleSchema = new mongoose.Schema({
  name: { type: String, index: true }, enabled: { type: Boolean, default: true, index: true }, rule: Mixed,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const PolicyRule = mongoose.models.PolicyRule || mongoose.model('PolicyRule', policyRuleSchema);

const publicApiKeySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true }, organization: { type: oid, ref: 'Organization' },
  keyName: String, keyHash: { type: String, index: true }, keyPrefix: { type: String, index: true },
  scopes: [String], rateLimit: { type: Number, default: 1000 }, expiresAt: Date,
  active: { type: Boolean, default: true, index: true },
}, opts);
export const PublicApiKey = mongoose.models.PublicApiKey || mongoose.model('PublicApiKey', publicApiKeySchema);

const recoveryRewardSchema = new mongoose.Schema({   // financial
  recoveryCase: { type: oid, ref: 'RecoveryCase', index: true }, device: { type: oid, ref: 'Device' },
  imei: { type: String, index: true }, rewardAmount: Number, currency: { type: String, default: 'USD' },
  expiresAt: Date, terms: String, status: { type: String, default: 'offered', index: true },
}, opts);
export const RecoveryReward = mongoose.models.RecoveryReward || mongoose.model('RecoveryReward', recoveryRewardSchema);

const regulatoryBlockSchema = new mongoose.Schema({  // device blocking on authority's behalf
  imei: { type: String, index: true }, device: { type: oid, ref: 'Device', index: true },
  authority: String, authorityId: String, country: String,
  blockType: String, blockReason: String, blockReference: String, blockedAt: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const RegulatoryBlock = mongoose.models.RegulatoryBlock || mongoose.model('RegulatoryBlock', regulatoryBlockSchema);

const repairRecordSchema = new mongoose.Schema({
  repairId: { type: String, unique: true, sparse: true, index: true },
  shopId: { type: oid, ref: 'RepairShop', index: true }, commissionAmount: Number,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const RepairRecord = mongoose.models.RepairRecord || mongoose.model('RepairRecord', repairRecordSchema);

const repairShopSchema = new mongoose.Schema({
  shopId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const RepairShop = mongoose.models.RepairShop || mongoose.model('RepairShop', repairShopSchema);

const resellerSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  businessName: String, businessType: String, licenseNumber: String,   // business PII
  address: String, phone: String, email: String, services: [Mixed],
  verified: { type: Boolean, default: false }, status: { type: String, default: 'pending', index: true },
}, opts);
export const Reseller = mongoose.models.Reseller || mongoose.model('Reseller', resellerSchema);

const sellerResellerSchema = new mongoose.Schema({
  sellerId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const SellerReseller = mongoose.models.SellerReseller || mongoose.model('SellerReseller', sellerResellerSchema);

const webhookDeliveryLogSchema = new mongoose.Schema({
  webhook: { type: oid, ref: 'WebhookSubscription', index: true },
  event: { type: String, index: true }, payload: Mixed,
  status: { type: String, index: true }, statusCode: Number, response: String, timestamp: Date,
}, opts);
export const WebhookDeliveryLog = mongoose.models.WebhookDeliveryLog || mongoose.model('WebhookDeliveryLog', webhookDeliveryLogSchema);

const webhookSubscriptionSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  url: String, secret: String, events: [Mixed], active: { type: Boolean, default: true, index: true },
}, opts);
export const WebhookSubscription = mongoose.models.WebhookSubscription || mongoose.model('WebhookSubscription', webhookSubscriptionSchema);

const whiteLabelInstanceSchema = new mongoose.Schema({
  instanceId: { type: String, unique: true, sparse: true, index: true },
  name: String, owner: { type: oid, ref: 'User', index: true }, partner: { type: oid, ref: 'Partner' },
  branding: Mixed, config: Mixed, metrics: Mixed, status: { type: String, default: 'pending', index: true },
}, opts);
export const WhiteLabelInstance = mongoose.models.WhiteLabelInstance || mongoose.model('WhiteLabelInstance', whiteLabelInstanceSchema);

const currencyRateSchema = new mongoose.Schema({
  fromCurrency: { type: String, index: true }, toCurrency: { type: String, index: true },
  rate: Number, source: { type: String, default: 'manual' },
}, opts);
export const CurrencyRate = mongoose.models.CurrencyRate || mongoose.model('CurrencyRate', currencyRateSchema);

// Webhook idempotency: one row per provider event id (unique) so retries no-op
const processedWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, index: true }, eventId: String, eventType: String,
  processedAt: { type: Date, default: Date.now },
}, opts);
processedWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
export const ProcessedWebhookEvent = mongoose.models.ProcessedWebhookEvent || mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema);

// ── Telecom cluster (carrier integration + SIM/network/cell tracking) ────────
// NOTE: SimCardTracking + NetworkActivity are subscriber/location data —
// apply retention limits + access control (Kenya DPA) before go-live.
const telecomCompanySchema = new mongoose.Schema({
  companyId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, country: String, createdBy: String, updatedBy: String,
}, opts);
export const TelecomCompany = mongoose.models.TelecomCompany || mongoose.model('TelecomCompany', telecomCompanySchema);

const telecomDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const TelecomDashboard = mongoose.models.TelecomDashboard || mongoose.model('TelecomDashboard', telecomDashboardSchema);

const simCardTrackingSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, sparse: true, index: true },
  imei: { type: String, index: true }, iccid: { type: String, index: true }, msisdn: { type: String, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const SimCardTracking = mongoose.models.SimCardTracking || mongoose.model('SimCardTracking', simCardTrackingSchema);

const networkActivitySchema = new mongoose.Schema({
  activityId: { type: String, unique: true, sparse: true, index: true },
  imei: { type: String, index: true }, createdBy: String,
}, opts);
export const NetworkActivity = mongoose.models.NetworkActivity || mongoose.model('NetworkActivity', networkActivitySchema);

const cellTowerSchema = new mongoose.Schema({
  towerId: { type: String, unique: true, sparse: true, index: true },
  lat: Number, lng: Number, mcc: String, mnc: String, lac: String, cellId: String, operator: String,
}, opts);
export const CellTower = mongoose.models.CellTower || mongoose.model('CellTower', cellTowerSchema);

const satellitePingSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  imei: { type: String, index: true },
  latitude: Number, longitude: Number, accuracy: Number, altitude: Number,
  source: { type: String, default: 'gps' },
  satelliteProvider: String, satelliteId: String, signalStrength: Number,
  cellTowerId: String, cellTowerLat: Number, cellTowerLng: Number,
  timestamp: { type: Date, default: Date.now },
}, opts);
export const SatellitePing = mongoose.models.SatellitePing || mongoose.model('SatellitePing', satellitePingSchema);
