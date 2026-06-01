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
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mustChangePassword?: boolean;
  authProvider?: 'local' | 'google';
  providerId?: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin', 'telecom', 'law_enforcement'], default: 'user' },
  phone: { type: String },
  apiKey: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
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
