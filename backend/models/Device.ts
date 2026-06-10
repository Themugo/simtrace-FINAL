import mongoose from 'mongoose';

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
