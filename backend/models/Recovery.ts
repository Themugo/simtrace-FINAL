import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

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

const recoveryRewardSchema = new mongoose.Schema({
  recoveryCase: { type: oid, ref: 'RecoveryCase', index: true }, device: { type: oid, ref: 'Device' },
  imei: { type: String, index: true }, rewardAmount: Number, currency: { type: String, default: 'USD' },
  expiresAt: Date, terms: String, status: { type: String, default: 'offered', index: true },
}, opts);
export const RecoveryReward = mongoose.models.RecoveryReward || mongoose.model('RecoveryReward', recoveryRewardSchema);
