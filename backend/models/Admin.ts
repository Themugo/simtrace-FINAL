import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true, sparse: true, index: true },
  managedBy: { type: oid, ref: 'SuperAdmin', index: true },
  status: { type: String, default: 'active', index: true }, verified: { type: Boolean, default: false },
}, opts);
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const superAdminSchema = new mongoose.Schema({
  superAdminId: { type: String, unique: true, sparse: true, index: true },
  managedAdmins: [oid], immutable: { type: Boolean, default: false },
  status: { type: String, default: 'active', index: true },
}, opts);
export const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', superAdminSchema);

const adminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const AdminDashboard = mongoose.models.AdminDashboard || mongoose.model('AdminDashboard', adminDashboardSchema);

const adminRolePermissionSchema = new mongoose.Schema({
  role: { type: String, index: true }, permissions: [Mixed],
  status: { type: String, default: 'active', index: true },
}, opts);
export const AdminRolePermission = mongoose.models.AdminRolePermission || mongoose.model('AdminRolePermission', adminRolePermissionSchema);

const officialEmailSchema = new mongoose.Schema({
  emailId: { type: String, unique: true, sparse: true, index: true },
  officialEmail: { type: String, index: true }, verificationToken: String, verificationExpiresAt: Date,
  verified: { type: Boolean, default: false }, status: { type: String, default: 'pending', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const OfficialEmail = mongoose.models.OfficialEmail || mongoose.model('OfficialEmail', officialEmailSchema);

const securityOtpSchema = new mongoose.Schema({
  otpId: { type: String, unique: true, sparse: true, index: true },
  otpNumber: String, holderName: String, purpose: String, expiresAt: Date,
  used: { type: Boolean, default: false }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const SecurityOtp = mongoose.models.SecurityOtp || mongoose.model('SecurityOtp', securityOtpSchema);

const superAdminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true },
}, opts);
export const SuperAdminDashboard = mongoose.models.SuperAdminDashboard || mongoose.model('SuperAdminDashboard', superAdminDashboardSchema);

const ministerDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  ministerId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const MinisterDashboard = mongoose.models.MinisterDashboard || mongoose.model('MinisterDashboard', ministerDashboardSchema);

const policeGeneralDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  policeGeneralId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const PoliceGeneralDashboard = mongoose.models.PoliceGeneralDashboard || mongoose.model('PoliceGeneralDashboard', policeGeneralDashboardSchema);

const stationAdminDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  stationAdminId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const StationAdminDashboard = mongoose.models.StationAdminDashboard || mongoose.model('StationAdminDashboard', stationAdminDashboardSchema);

const userDashboardSchema = new mongoose.Schema({
  dashboardId: { type: String, unique: true, sparse: true, index: true },
  userId: { type: String, index: true }, createdBy: String, updatedBy: String,
}, opts);
export const UserDashboard = mongoose.models.UserDashboard || mongoose.model('UserDashboard', userDashboardSchema);
