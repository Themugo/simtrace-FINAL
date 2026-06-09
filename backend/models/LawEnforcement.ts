import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

// ── Law Enforcement Case ───────────────────────────────────────────────────────
interface ILawEnforcementCase {
  caseNumber: string;
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  agency: string;
  status: 'open' | 'investigating' | 'evidence_collection' | 'prosecution' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedImeis: string[];
  relatedDevices: mongoose.Types.ObjectId[];
  evidence: Array<{
    id: string;
    type: string;
    description: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
    chainOfCustody: Array<{
      handler: string;
      action: string;
      timestamp: Date;
      notes?: string;
    }>;
  }>;
  notes: Array<{
    addedBy: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    isInternal: boolean;
  }>;
  collaborators: Array<{
    userId: mongoose.Types.ObjectId;
    role: string;
    agency: string;
    addedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const lawEnforcementCaseSchema = new mongoose.Schema<ILawEnforcementCase>({
  caseNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: oid, ref: 'User', required: true },
  agency: { type: String, required: true },
  status: { type: String, enum: ['open', 'investigating', 'evidence_collection', 'prosecution', 'closed', 'archived'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  relatedImeis: [{ type: String }],
  relatedDevices: [{ type: oid, ref: 'Device' }],
  evidence: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
    uploadedBy: { type: oid, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    chainOfCustody: [{
      handler: { type: String, required: true },
      action: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      notes: String,
    }],
  }],
  notes: [{
    addedBy: { type: oid, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false },
  }],
  collaborators: [{
    userId: { type: oid, ref: 'User', required: true },
    role: { type: String, required: true },
    agency: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  closedAt: Date,
});
lawEnforcementCaseSchema.index({ assignedTo: 1, status: 1 });
lawEnforcementCaseSchema.index({ agency: 1, status: 1 });
lawEnforcementCaseSchema.index({ relatedImeis: 1 });
export const LawEnforcementCase = mongoose.model<ILawEnforcementCase>('LawEnforcementCase', lawEnforcementCaseSchema);

// ── Law enforcement structural models ──────────────────────────────────────────
const lawEnforcementAgencySchema = new mongoose.Schema({
  agencyId: { type: String, unique: true, index: true },
  name: String, country: String, type: String, createdBy: String, updatedBy: String,
}, opts);
export const LawEnforcementAgency = mongoose.models.LawEnforcementAgency || mongoose.model('LawEnforcementAgency', lawEnforcementAgencySchema);

const policeStationSchema = new mongoose.Schema({
  stationId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, county: String, code: String, contact: Mixed,
}, opts);
export const PoliceStation = mongoose.models.PoliceStation || mongoose.model('PoliceStation', policeStationSchema);

const policeRoleSchema = new mongoose.Schema({
  roleId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, level: Number, permissions: [Mixed],
}, opts);
export const PoliceRole = mongoose.models.PoliceRole || mongoose.model('PoliceRole', policeRoleSchema);

const policeHierarchySchema = new mongoose.Schema({
  unitId: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, index: true }, parentUnit: { type: oid, ref: 'PoliceHierarchy' }, level: Number,
}, opts);
export const PoliceHierarchy = mongoose.models.PoliceHierarchy || mongoose.model('PoliceHierarchy', policeHierarchySchema);

const lawEnforcementDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const LawEnforcementDashboard = mongoose.models.LawEnforcementDashboard || mongoose.model('LawEnforcementDashboard', lawEnforcementDashboardSchema);

const missingPersonRuleSchema = new mongoose.Schema({
  name: { type: String, index: true }, active: { type: Boolean, default: true }, criteria: Mixed,
}, opts);
export const MissingPersonRule = mongoose.models.MissingPersonRule || mongoose.model('MissingPersonRule', missingPersonRuleSchema);

const policeUserAssignmentSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  role: { type: oid, ref: 'PoliceRole' }, hierarchyUnit: { type: oid, ref: 'PoliceHierarchy' },
  assignedBy: String, validFrom: Date, validUntil: Date,
  status: { type: String, default: 'active', index: true },
}, opts);
export const PoliceUserAssignment = mongoose.models.PoliceUserAssignment || mongoose.model('PoliceUserAssignment', policeUserAssignmentSchema);

const recoveryWorkflowSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  station: { type: oid, ref: 'PoliceStation' },
  currentStage: { type: String, default: 'reported', index: true },
  status: { type: String, default: 'active', index: true },
  stageHistory: [Mixed],
}, opts);
export const RecoveryWorkflow = mongoose.models.RecoveryWorkflow || mongoose.model('RecoveryWorkflow', recoveryWorkflowSchema);

const nationwideAlertSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  policeReport: { type: oid, ref: 'PoliceReport' },
  alertType: String, alertLevel: { type: String, index: true },
  deviceDescription: String, devicePhoto: String, uniqueFeatures: Mixed, lastKnownLocation: Mixed,
  status: { type: String, default: 'active', index: true }, notifiedStations: [oid],
}, opts);
export const NationwideAlert = mongoose.models.NationwideAlert || mongoose.model('NationwideAlert', nationwideAlertSchema);

const cooperationAlertSchema = new mongoose.Schema({
  caseId: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  requestingUnit: { type: oid, ref: 'PoliceHierarchy' }, respondingUnit: { type: oid, ref: 'PoliceHierarchy' },
  requestType: String, requestedAt: Date, expectedResponseBy: Date,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const CooperationAlert = mongoose.models.CooperationAlert || mongoose.model('CooperationAlert', cooperationAlertSchema);

const seniorConfirmationSchema = new mongoose.Schema({
  caseId: { type: String, index: true },
  device: { type: oid, ref: 'Device' },
  originalRequest: Mixed, seniorOfficer: { type: oid, ref: 'User' }, seniorUnit: { type: oid, ref: 'PoliceHierarchy' },
  status: { type: String, default: 'pending', index: true },
}, opts);
export const SeniorConfirmation = mongoose.models.SeniorConfirmation || mongoose.model('SeniorConfirmation', seniorConfirmationSchema);

// ── Police Report [SENSITIVE] ──────────────────────────────────────────────────
const policeReportSchema = new mongoose.Schema({
  device: { type: oid, ref: 'Device', index: true },
  user: { type: oid, ref: 'User', index: true },
  station: { type: oid, ref: 'PoliceStation', index: true },
  obNumber: { type: String, unique: true, sparse: true, index: true, immutable: true },
  reportDate: Date, incidentDate: Date, incidentLocation: Mixed,
  incidentType: String, incidentDescription: String,
  abstractNumber: String, abstractFile: String,
  status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const PoliceReport = mongoose.models.PoliceReport || mongoose.model('PoliceReport', policeReportSchema);

// ── Court Case [SENSITIVE] ─────────────────────────────────────────────────────
const courtCaseSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  courtName: String, courtType: String, courtLocation: String,
  caseNumber: { type: String, unique: true, sparse: true, index: true, immutable: true },
  caseType: String, charges: [Mixed], prosecutor: String, defenseLawyer: String, judge: String,
  status: { type: String, default: 'filed', index: true },
}, opts);
export const CourtCase = mongoose.models.CourtCase || mongoose.model('CourtCase', courtCaseSchema);

// ── Interpol Notice [SENSITIVE] ────────────────────────────────────────────────
const interpolCaseSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  interpolNotice: String, noticeNumber: { type: String, index: true },
  originatingCountry: String, targetCountries: [String], noticeType: String, description: String,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const InterpolCase = mongoose.models.InterpolCase || mongoose.model('InterpolCase', interpolCaseSchema);

// ── Case Transfer [SENSITIVE] ──────────────────────────────────────────────────
const caseTransferSchema = new mongoose.Schema({
  policeReport: { type: oid, ref: 'PoliceReport', index: true },
  device: { type: oid, ref: 'Device' },
  fromStation: { type: oid, ref: 'PoliceStation' }, toStation: { type: oid, ref: 'PoliceStation' },
  transferReason: String, transferNotes: String, requestedBy: { type: oid, ref: 'User' },
  status: { type: String, default: 'pending', index: true },
}, opts);
export const CaseTransfer = mongoose.models.CaseTransfer || mongoose.model('CaseTransfer', caseTransferSchema);

// ── Data Access Control [SENSITIVE] ────────────────────────────────────────────
const dataAccessControlSchema = new mongoose.Schema({
  entityType: { type: String, index: true }, entityId: { type: String, index: true },
  requestedBy: { type: oid, ref: 'User' }, requestedRole: { type: oid, ref: 'PoliceRole' }, requestedUnit: { type: oid, ref: 'PoliceHierarchy' },
  caseId: { type: String, index: true }, accessType: String, accessReason: String,
  grantedAt: Date, expiresAt: Date,
  status: { type: String, default: 'pending', index: true },
}, opts);
export const DataAccessControl = mongoose.models.DataAccessControl || mongoose.model('DataAccessControl', dataAccessControlSchema);

// ── Encrypted Data [SENSITIVE] ─────────────────────────────────────────────────
const encryptedDataSchema = new mongoose.Schema({
  entityType: { type: String, index: true }, entityId: { type: String, index: true },
  dataType: String, originalHash: String, encryptedData: String,
  encryptionKey: String, iv: String, authTag: String, encryptionAlgorithm: String, owner: { type: oid, ref: 'User' },
  status: { type: String, default: 'encrypted', index: true },
}, opts);
export const EncryptedData = mongoose.models.EncryptedData || mongoose.model('EncryptedData', encryptedDataSchema);
