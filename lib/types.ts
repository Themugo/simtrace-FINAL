export type DeviceStatus = 'ACTIVE' | 'FLAGGED' | 'STOLEN' | 'RECOVERED' | 'BLACKLISTED' | 'PENDING' | 'BLOCKED';

export type UserRole = 'CITIZEN' | 'POLICE' | 'TELECOM' | 'INSURANCE' | 'ADMIN' | 'RESELLER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  phone?: string;
  nationalId?: string;
  createdAt?: string;
}

export interface HardwareFingerprint {
  batteryLevel?: number | string;
  batteryHealth?: string;
  isCharging?: boolean;
  storageTotalGB?: number | string;
  storageUsedGB?: number | string;
  osVersion?: string;
  buildId?: string;
  screenRes?: string;
  networkMac?: string;
  bluetoothMac?: string;
  ramGB?: number | string;
  cpuModel?: string;
  deviceModel?: string;
  manufacturer?: string;
  [key: string]: any;
}

export interface PingLocation {
  id?: string;
  lat: number;
  lng: number;
  ts: string | Date;
  networkOp?: string;
  ipAddress?: string;
  cellTowerId?: string;
  accuracyMeters?: number;
}

export interface TheftReport {
  id: string;
  imei: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RECOVERED' | 'CLOSED';
  incidentDate: string;
  location?: string;
  policeObNumber?: string;
  description?: string;
  createdAt: string;
  reporterName?: string;
}

export interface Device {
  id: string;
  imei: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  status: DeviceStatus;
  riskScore?: number;
  lastSeen?: string | Date;
  ownerId?: string;
  ownerName?: string;
  fingerprint?: HardwareFingerprint;
  lastPings?: PingLocation[];
  reports?: TheftReport[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: string;
  imei: string;
  type: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  narrative?: string;
  read: boolean;
  ts: string | Date;
  location?: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
