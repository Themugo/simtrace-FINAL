import crypto from 'crypto';
import { Organization, OrganizationMember, OrganizationRole, OrganizationInvite, Team, TeamMember } from '../../db/index.js';

// ── Organization Operations ────────────────────────────────────────────────────
export async function createOrganization(data: {
  name: string;
  slug: string;
  type: 'personal' | 'telecom' | 'law_enforcement' | 'insurance' | 'enterprise' | 'reseller';
  plan: 'free' | 'pro' | 'enterprise' | 'telecom' | 'law_enforcement';
  owner: string;
}) {
  const organization = await Organization.create(data);
  
  // Add owner as first member
  await OrganizationMember.create({
    organization: organization._id,
    user: data.owner,
    role: 'owner',
    permissions: ['*'], // Full permissions for owner
    joinedAt: new Date(),
    status: 'active',
  });
  
  return organization;
}

export async function getUserOrganizations(userId: string) {
  const memberships = await OrganizationMember.find({ user: userId, status: 'active' })
    .populate('organization')
    .lean();
  
  return memberships.map(m => ({
    ...m.organization,
    role: m.role,
    permissions: m.permissions,
  }));
}

export async function getOrganizationById(organizationId: string) {
  return Organization.findById(organizationId).lean();
}

export async function updateOrganization(organizationId: string, updates: Record<string, unknown>) {
  return Organization.findByIdAndUpdate(organizationId, updates, { new: true }).lean();
}

// ── Organization Member Operations ─────────────────────────────────────────────
export async function addOrganizationMember(data: {
  organization: string;
  user: string;
  role: 'admin' | 'member' | 'viewer';
  permissions: string[];
  invitedBy: string;
}) {
  return OrganizationMember.create({
    ...data,
    joinedAt: new Date(),
    status: 'active',
  });
}

export async function removeOrganizationMember(organizationId: string, userId: string) {
  return OrganizationMember.findOneAndUpdate(
    { organization: organizationId, user: userId },
    { status: 'removed' }
  );
}

export async function updateOrganizationMemberRole(organizationId: string, userId: string, role: string, permissions: string[]) {
  return OrganizationMember.findOneAndUpdate(
    { organization: organizationId, user: userId },
    { role, permissions }
  );
}

// ── Organization Invite Operations ───────────────────────────────────────────────
export async function createOrganizationInvite(data: {
  organization: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invitedBy: string;
}) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return OrganizationInvite.create({
    ...data,
    token,
    expiresAt,
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await OrganizationInvite.findOne({ token, status: 'pending' });
  
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error('Invalid or expired invite');
  }
  
  // Create organization member
  await OrganizationMember.create({
    organization: invite.organization,
    user: userId,
    role: invite.role,
    permissions: [],
    invitedBy: invite.invitedBy,
    joinedAt: new Date(),
    status: 'active',
  });
  
  // Mark invite as accepted
  await OrganizationInvite.findByIdAndUpdate(invite._id, {
    status: 'accepted',
    acceptedAt: new Date(),
  });
  
  return invite.organization;
}

export async function getPendingInvites(organizationId: string) {
  return OrganizationInvite.find({ organization: organizationId, status: 'pending' })
    .populate('invitedBy', 'name email')
    .lean();
}

// ── Team Operations ─────────────────────────────────────────────────────────────
export async function createTeam(data: {
  organization: string;
  name: string;
  description?: string;
  lead?: string;
  parentTeam?: string;
}) {
  return Team.create(data);
}

export async function getOrganizationTeams(organizationId: string) {
  return Team.find({ organization: organizationId })
    .populate('lead', 'name email')
    .populate('parentTeam', 'name')
    .lean();
}

export async function addTeamMember(data: {
  team: string;
  user: string;
  role: 'lead' | 'member';
}) {
  return TeamMember.create(data);
}

export async function removeTeamMember(teamId: string, userId: string) {
  return TeamMember.findOneAndDelete({ team: teamId, user: userId });
}

export async function getUserTeams(userId: string) {
  const teamMemberships = await TeamMember.find({ user: userId })
    .populate('team')
    .lean();
  
  return teamMemberships.map(tm => ({
    ...tm.team,
    role: tm.role,
    joinedAt: tm.joinedAt,
  }));
}

// ── Organization Role Operations ─────────────────────────────────────────────────
export async function createOrganizationRole(data: {
  organization: string;
  name: string;
  description?: string;
  permissions: string[];
}) {
  return OrganizationRole.create({
    ...data,
    isSystem: false,
  });
}

export async function getOrganizationRoles(organizationId: string) {
  return OrganizationRole.find({ organization: organizationId }).lean();
}

export async function deleteOrganizationRole(organizationId: string, roleId: string) {
  const role = await OrganizationRole.findOne({ _id: roleId, organization: organizationId });
  
  if (!role) {
    throw new Error('Role not found');
  }
  
  if (role.isSystem) {
    throw new Error('Cannot delete system roles');
  }
  
  return OrganizationRole.findByIdAndDelete(roleId);
}
