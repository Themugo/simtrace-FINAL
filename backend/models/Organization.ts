import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;

// ── Organization ─────────────────────────────────────────────────────────────
interface IOrganization {
  name: string;
  slug: string;
  type: 'personal' | 'telecom' | 'law_enforcement' | 'insurance' | 'enterprise' | 'reseller';
  plan: 'free' | 'pro' | 'enterprise' | 'telecom' | 'law_enforcement';
  owner: mongoose.Types.ObjectId;
  settings: {
    branding?: {
      logo?: string;
      primaryColor?: string;
      customDomain?: string;
    };
    features?: {
      aiReports?: boolean;
      advancedAnalytics?: boolean;
      apiAccess?: boolean;
      webhookNotifications?: boolean;
    };
    limits?: {
      devices?: number;
      users?: number;
      apiCallsPerDay?: number;
      storageGB?: number;
    };
  };
  status: 'active' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new mongoose.Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['personal', 'telecom', 'law_enforcement', 'insurance', 'enterprise', 'reseller'], default: 'personal' },
  plan: { type: String, enum: ['free', 'pro', 'enterprise', 'telecom', 'law_enforcement'], default: 'free' },
  owner: { type: oid, ref: 'User', required: true },
  settings: {
    branding: { logo: String, primaryColor: String, customDomain: String },
    features: {
      aiReports: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      webhookNotifications: { type: Boolean, default: false },
    },
    limits: {
      devices: { type: Number, default: 5 },
      users: { type: Number, default: 3 },
      apiCallsPerDay: { type: Number, default: 100 },
      storageGB: { type: Number, default: 1 },
    },
  },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
organizationSchema.index({ owner: 1 });
organizationSchema.index({ type: 1, status: 1 });
export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

// ── Organization Member ──────────────────────────────────────────────────────
interface IOrganizationMember {
  organization: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  invitedBy?: mongoose.Types.ObjectId;
  joinedAt: Date;
  status: 'active' | 'pending' | 'invited' | 'removed';
}

const organizationMemberSchema = new mongoose.Schema<IOrganizationMember>({
  organization: { type: oid, ref: 'Organization', required: true },
  user: { type: oid, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
  permissions: [{ type: String }],
  invitedBy: { type: oid, ref: 'User' },
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'pending', 'invited', 'removed'], default: 'pending' },
});
organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });
organizationMemberSchema.index({ user: 1 });
organizationMemberSchema.index({ organization: 1, status: 1 });
export const OrganizationMember = mongoose.model<IOrganizationMember>('OrganizationMember', organizationMemberSchema);

// ── Organization Role ───────────────────────────────────────────────────────────
interface IOrganizationRole {
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
}

const organizationRoleSchema = new mongoose.Schema<IOrganizationRole>({
  organization: { type: oid, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
organizationRoleSchema.index({ organization: 1, name: 1 });
export const OrganizationRole = mongoose.model<IOrganizationRole>('OrganizationRole', organizationRoleSchema);

// ── Team ─────────────────────────────────────────────────────────────────────
interface ITeam {
  organization: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  lead?: mongoose.Types.ObjectId;
  parentTeam?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new mongoose.Schema<ITeam>({
  organization: { type: oid, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  lead: { type: oid, ref: 'User' },
  parentTeam: { type: oid, ref: 'Team' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
teamSchema.index({ organization: 1 });
teamSchema.index({ lead: 1 });
teamSchema.index({ parentTeam: 1 });
export const Team = mongoose.model<ITeam>('Team', teamSchema);

// ── Team Member ───────────────────────────────────────────────────────────────
interface ITeamMember {
  team: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  role: 'lead' | 'member';
  joinedAt: Date;
}

const teamMemberSchema = new mongoose.Schema<ITeamMember>({
  team: { type: oid, ref: 'Team', required: true },
  user: { type: oid, ref: 'User', required: true },
  role: { type: String, enum: ['lead', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});
teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });
teamMemberSchema.index({ user: 1 });
export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema);

// ── Organization Invite ─────────────────────────────────────────────────────────
interface IOrganizationInvite {
  organization: mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
}

const organizationInviteSchema = new mongoose.Schema<IOrganizationInvite>({
  organization: { type: oid, ref: 'Organization', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  invitedBy: { type: oid, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: Date,
  status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
organizationInviteSchema.index({ organization: 1, email: 1 });
organizationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OrganizationInvite = mongoose.model<IOrganizationInvite>('OrganizationInvite', organizationInviteSchema);
