import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

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

const deviceDnaSchema = new mongoose.Schema({
  imei: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  chipset: Mixed, radio: Mixed, sensors: Mixed, entropy: Mixed,
  verified: { type: Boolean, default: false }, cloneDetected: { type: Boolean, default: false },
  cloneCount: { type: Number, default: 0 },
}, opts);
export const DeviceDna = mongoose.models.DeviceDna || mongoose.model('DeviceDna', deviceDnaSchema);
