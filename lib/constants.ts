import { DeviceStatus, UserRole } from './types';

export const APP_CONFIG = {
  appName: 'SimTrace',
  tagline: 'Global IMEI & SIM Tracking, Device Security & Telecom Recovery Platform',
  version: '2.4.0-enterprise',
  supportEmail: 'support@simtrace.io',
  defaultApiBase: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
};

export const STATUS_COLOR: Record<DeviceStatus | string, string> = {
  ACTIVE: 'var(--emerald, #34d399)',
  FLAGGED: 'var(--amber, #fbbf24)',
  STOLEN: 'var(--rose, #f43f5e)',
  RECOVERED: 'var(--sky, #38bdf8)',
  BLACKLISTED: 'var(--rose, #e11d48)',
  PENDING: 'var(--amber, #f59e0b)',
  BLOCKED: 'var(--purple, #c084fc)',
};

export const STATUS_BG: Record<DeviceStatus | string, string> = {
  ACTIVE: 'rgba(52, 211, 153, 0.12)',
  FLAGGED: 'rgba(251, 191, 36, 0.12)',
  STOLEN: 'rgba(244, 63, 94, 0.12)',
  RECOVERED: 'rgba(56, 189, 248, 0.12)',
  BLACKLISTED: 'rgba(225, 29, 72, 0.15)',
  PENDING: 'rgba(245, 158, 11, 0.12)',
  BLOCKED: 'rgba(192, 132, 252, 0.12)',
};

export const STATUS_LABEL: Record<DeviceStatus | string, string> = {
  ACTIVE: 'Active & Verified',
  FLAGGED: 'Flagged / Suspicious',
  STOLEN: 'Reported Stolen',
  RECOVERED: 'Recovered & Cleared',
  BLACKLISTED: 'Global Blacklist',
  PENDING: 'Verification Pending',
  BLOCKED: 'Remote Locked',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  CITIZEN: 'Device Owner / Citizen',
  POLICE: 'Law Enforcement Officer',
  TELECOM: 'Telecom Operator Specialist',
  INSURANCE: 'Insurance Adjuster',
  ADMIN: 'System Administrator',
  RESELLER: 'Verified Reseller',
};

export const DEFAULT_HARDWARE_TELEMETRY = {
  batteryLevel: 84,
  batteryHealth: 'Optimal (96% capacity)',
  storageTotalGB: 128,
  storageUsedGB: 68,
  osVersion: 'Android 14 (API 34)',
  buildId: 'UP1A.231005.007',
  screenRes: '1080 x 2400 (420 ppi)',
  networkMac: 'A4:C3:F0:89:12:DE',
  bluetoothMac: 'A4:C3:F0:89:12:DF',
  ramGB: '8 GB LPDDR5',
  cpuModel: 'Octa-core 2.8 GHz',
};
