import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const gdprRequestSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  requestType: { type: String, index: true },
  status: { type: String, default: 'pending', index: true },
  gdprArticle: String,
  processedBy: { type: oid, ref: 'User' },
  processedAt: Date,
  rejectionReason: String,
  exportData: Mixed,
  completedAt: Date,
}, opts);
export const GdprRequest = mongoose.models.GdprRequest || mongoose.model('GdprRequest', gdprRequestSchema);

const dataResidencySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  region: { type: String, index: true },
  storageLocations: [Mixed],
  gdprCompliant: { type: Boolean, default: false },
  ccpaCompliant: { type: Boolean, default: false },
}, opts);
export const DataResidency = mongoose.models.DataResidency || mongoose.model('DataResidency', dataResidencySchema);

const regulatoryBlockSchema = new mongoose.Schema({
  imei: { type: String, index: true }, device: { type: oid, ref: 'Device', index: true },
  authority: String, authorityId: String, country: String,
  blockType: String, blockReason: String, blockReference: String, blockedAt: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const RegulatoryBlock = mongoose.models.RegulatoryBlock || mongoose.model('RegulatoryBlock', regulatoryBlockSchema);
