import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const insurancePolicySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  policyNumber: { type: String, unique: true, sparse: true },
  provider: String, providerId: String, coverageType: String,
  devices: [Mixed], premium: Number, currency: String, deductible: Number,
  coverageLimit: Number, startDate: Date, endDate: Date, renewalDate: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const InsurancePolicy = mongoose.models.InsurancePolicy || mongoose.model('InsurancePolicy', insurancePolicySchema);

const insuranceClaimSchema = new mongoose.Schema({
  policy: { type: oid, ref: 'InsurancePolicy', index: true },
  user: { type: oid, ref: 'User', index: true },
  device: { type: oid, ref: 'Device' },
  claimNumber: { type: String, unique: true, sparse: true },
  claimType: String, incidentDate: Date, incidentLocation: Mixed, description: String,
  evidence: [Mixed], policeReportNumber: String, policeStation: String,
  claimedAmount: Number, currency: String,
  status: { type: String, default: 'submitted', index: true },
}, opts);
export const InsuranceClaim = mongoose.models.InsuranceClaim || mongoose.model('InsuranceClaim', insuranceClaimSchema);
