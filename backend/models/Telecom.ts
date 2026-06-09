import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const opts = { strict: false as const, timestamps: true };

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
