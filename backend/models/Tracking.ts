import mongoose from 'mongoose';

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
trackingEventSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
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
deviceSessionSchema.index({ startTime: -1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
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
deviceLocationSchema.index({ timestamp: -1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
deviceLocationSchema.index({ lat: 1, lng: 1 });
export const DeviceLocation = mongoose.model<IDeviceLocation>('DeviceLocation', deviceLocationSchema);
