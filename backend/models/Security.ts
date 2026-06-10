import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

// ── Device Lock ──────────────────────────────────────────────────────────────
const deviceLockSchema = new mongoose.Schema({
  lockId: { type: String, unique: true, index: true },
  deviceId: { type: String, index: true },
  userId: { type: String, index: true },
  status: { type: String, default: 'active', index: true },
  lockType: String, reason: String, message: String,
  temporary: { type: Boolean, default: false },
  expiresAt: Date,
  failedAttempts: { type: Number, default: 0 },
  wiped: { type: Boolean, default: false },
  createdBy: String, updatedBy: String,
}, opts);
export const DeviceLock = mongoose.models.DeviceLock || mongoose.model('DeviceLock', deviceLockSchema);

// ── Device Transfer ──────────────────────────────────────────────────────────
const deviceTransferSchema = new mongoose.Schema({
  transferId: { type: String, unique: true, index: true },
  deviceId: { type: String, index: true },
  userId: { type: String, index: true },
  toUserId: { type: String, index: true },
  status: { type: String, default: 'pending', index: true },
  reason: String, disputeReason: String, resolution: String,
  createdBy: String, updatedBy: String,
}, opts);
export const DeviceTransfer = mongoose.models.DeviceTransfer || mongoose.model('DeviceTransfer', deviceTransferSchema);

// ── Guardian ─────────────────────────────────────────────────────────────────
const guardianSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  guardian: { type: oid, ref: 'User', index: true },
  name: String, phone: String, email: String, relationship: String,
  permissions: [Mixed], canReportTheft: { type: Boolean, default: true },
  emergencyOnly: { type: Boolean, default: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const Guardian = mongoose.models.Guardian || mongoose.model('Guardian', guardianSchema);

// ── ParentChild [SENSITIVE] ──────────────────────────────────────────────────
const parentChildSchema = new mongoose.Schema({
  parent: { type: oid, ref: 'User', index: true },
  child: { type: oid, ref: 'User', index: true },
  childName: String, childAge: Number, school: String,
  canTrack: { type: Boolean, default: true }, canManageDevice: { type: Boolean, default: true },
  canReceiveAlerts: { type: Boolean, default: true },
  guardianConsent: { type: Boolean, default: false }, consentRecordedAt: Date, dataRetentionUntil: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const ParentChild = mongoose.models.ParentChild || mongoose.model('ParentChild', parentChildSchema);

// ── Panic Mode ───────────────────────────────────────────────────────────────
const panicModeSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  device: { type: oid, ref: 'Device', index: true },
  panicType: String, description: String, location: Mixed, authorizedTrackers: [Mixed],
  status: { type: String, default: 'active', index: true },
}, opts);
export const PanicMode = mongoose.models.PanicMode || mongoose.model('PanicMode', panicModeSchema);

// ── Selfie Capture ───────────────────────────────────────────────────────────
const selfieCaptureSchema = new mongoose.Schema({
  captureId: { type: String, unique: true, sparse: true, index: true },
  device: { type: oid, ref: 'Device', index: true }, user: { type: oid, ref: 'User' },
  imageHash: String, imageUrl: String, captureLocation: Mixed,
  unlockAttempt: Mixed, thiefReported: { type: Boolean, default: false },
  consentBasis: String, retentionUntil: Date,
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const SelfieCapture = mongoose.models.SelfieCapture || mongoose.model('SelfieCapture', selfieCaptureSchema);

// ── Thief Report ─────────────────────────────────────────────────────────────
const thiefReportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, sparse: true, index: true },
  selfieCaptureId: { type: oid, ref: 'SelfieCapture', index: true },
  device: { type: oid, ref: 'Device' },
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const ThiefReport = mongoose.models.ThiefReport || mongoose.model('ThiefReport', thiefReportSchema);

// ── Nearby Device Detection ──────────────────────────────────────────────────
const nearbyDeviceDetectionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  user: { type: oid, ref: 'User', index: true },
  timestamp: Date, location: Mixed, nearbyDevices: [Mixed],
  incidentType: String, incidentDescription: String,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const NearbyDeviceDetection = mongoose.models.NearbyDeviceDetection || mongoose.model('NearbyDeviceDetection', nearbyDeviceDetectionSchema);

// ── Anomaly Detection ────────────────────────────────────────────────────────
const anomalyDetectionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true }, imei: { type: String, index: true },
  anomalyType: { type: String, index: true }, severity: { type: String, index: true },
  baselineData: Mixed, observedData: Mixed, deviationScore: Number, location: Mixed,
  status: { type: String, default: 'detected', index: true },
}, opts);
export const AnomalyDetection = mongoose.models.AnomalyDetection || mongoose.model('AnomalyDetection', anomalyDetectionSchema);

// ── Risk Prediction ──────────────────────────────────────────────────────────
const riskPredictionSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true }, imei: { type: String, index: true },
  riskScore: Number, riskLevel: { type: String, index: true }, factors: [Mixed],
  predictedEvent: String, confidence: Number, recommendations: [Mixed], validUntil: Date,
}, opts);
export const RiskPrediction = mongoose.models.RiskPrediction || mongoose.model('RiskPrediction', riskPredictionSchema);

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
