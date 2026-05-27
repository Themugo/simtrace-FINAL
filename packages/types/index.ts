// ── Shared Types for SimTrace Platform ─────────────────────────────────────────
// This package contains shared TypeScript types used across frontend, backend, and SDKs

// ── User Types ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'telecom' | 'law_enforcement';
  phone?: string;
  apiKey?: string;
  createdAt: Date;
  organizationId?: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'telecom' | 'law_enforcement';
  phone?: string;
}

export interface UserUpdate {
  name?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'telecom' | 'law_enforcement';
}

// ── Device Types ───────────────────────────────────────────────────────────────
export interface Device {
  id: string;
  imei: string;
  serialNumber?: string;
  make?: string;
  model?: string;
  owner?: string;
  status: 'active' | 'stolen' | 'recovered' | 'blacklisted';
  deviceKey?: string;
  fingerprint?: DeviceFingerprint;
  lastSeen?: Date;
  createdAt: Date;
  organizationId?: string;
}

export interface DeviceFingerprint {
  networkMac?: string;
  bluetoothMac?: string;
  screenRes?: string;
  osVersion?: string;
  buildId?: string;
}

export interface DeviceCreate {
  imei: string;
  serialNumber?: string;
  make?: string;
  model?: string;
  deviceKey?: string;
  fingerprint?: DeviceFingerprint;
}

export interface DeviceUpdate {
  status?: 'active' | 'stolen' | 'recovered' | 'blacklisted';
  make?: string;
  model?: string;
  fingerprint?: DeviceFingerprint;
}

// ── Risk Score Types ───────────────────────────────────────────────────────────
export interface RiskSignal {
  type: 'sim_swap' | 'rooted_device' | 'impossible_travel' | 'vpn_detected' | 'imei_mismatch' | 'fake_gps' | 'emulator' | 'fingerprint_change';
  score: number;
  description: string;
  timestamp: Date;
  details?: any;
}

export interface RiskAssessment {
  deviceRisk: number; // 0-100
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: RiskSignal[];
  lastUpdated: Date;
  recommendations: string[];
}

// ── Tracking Event Types ──────────────────────────────────────────────────────
export interface TrackingEvent {
  id: string;
  imei: string;
  eventType: 'location_update' | 'network_change' | 'sim_change' | 'device_boot' | 'app_install' | 'app_uninstall' | 'suspicious_activity';
  data: Record<string, any>;
  timestamp: Date;
  organizationId?: string;
}

export interface DeviceLocation {
  id: string;
  imei: string;
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: 'gps' | 'network' | 'passive' | 'manual';
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  asn?: string;
  timezone?: string;
  riskProfile?: 'low' | 'medium' | 'high';
}

export interface DeviceSession {
  id: string;
  imei: string;
  userId?: string;
  deviceKey?: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  eventsCount: number;
}

// ── Organization Types ─────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'personal' | 'telecom' | 'law_enforcement' | 'insurance' | 'enterprise' | 'reseller';
  plan: 'free' | 'pro' | 'enterprise' | 'telecom' | 'law_enforcement';
  owner: string;
  settings: OrganizationSettings;
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
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
}

export interface OrganizationMember {
  id: string;
  organization: string;
  user: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  invitedBy?: string;
  joinedAt: Date;
  status: 'active' | 'pending' | 'invited' | 'removed';
}

export interface Team {
  id: string;
  organization: string;
  name: string;
  description?: string;
  lead?: string;
  parentTeam?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Case Types ─────────────────────────────────────────────────────────────────
export interface Case {
  id: string;
  imei: string;
  title: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface CaseNote {
  id: string;
  case: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface CaseEvidence {
  id: string;
  case: string;
  type: 'image' | 'document' | 'location' | 'log';
  url: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// ── Alert Types ────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  imei: string;
  type: 'blacklist_ping' | 'sim_swap' | 'location_jump' | 'fraud_pattern' | 'theft_report';
  payload: any;
  narrative?: string;
  read: boolean;
  ts: Date;
  organizationId?: string;
}

// ── API Response Types ─────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth Types ─────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionInfo {
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}

// ── Subscription Types ─────────────────────────────────────────────────────────
export interface Subscription {
  id: string;
  user: string;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodEnd?: Date;
  stripeSubId?: string;
  mpesaPhone?: string;
  extraDevices: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
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

// ── Payment Types ───────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  user?: string;
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

// ── Partner Types ──────────────────────────────────────────────────────────────
export interface Partner {
  id: string;
  user?: string;
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

// ── Evidence Types ─────────────────────────────────────────────────────────────
export interface Evidence {
  id: string;
  case?: string;
  imei?: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'location' | 'log';
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  uploadedBy: string;
  uploadedAt: Date;
  chain: EvidenceChainEntry[];
}

export interface EvidenceChainEntry {
  action: 'uploaded' | 'viewed' | 'downloaded' | 'modified' | 'deleted';
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  details?: any;
}
