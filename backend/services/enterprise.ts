// services/enterprise.ts - Enterprise Organization Management
// Corporate device fleet management and enterprise features

import { Organization, OrganizationMember, DeviceFleet, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Organization Management ───────────────────────────────────────────────────────
export async function createOrganization(data: any) {
  const {
    name,
    slug,
    email,
    phone,
    address,
    industry,
    size,
    plan,
    ownerId,
  } = data;

  // Check if slug is unique
  const existing = await Organization.findOne({ slug });
  if (existing) throw new Error("Organization slug already exists");

  const organization = await Organization.create({
    name,
    slug,
    email,
    phone,
    address,
    industry,
    size,
    plan: plan || "enterprise_basic",
    status: "trial",
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
  });

  // Add owner as member
  await addOrganizationMember({
    organizationId: organization._id,
    userId: ownerId,
    role: "owner",
    invitedBy: ownerId,
  });

  return organization;
}

export async function getOrganization(organizationId: string) {
  const organization = await Organization.findById(organizationId)
    .populate("accountManager", "name email");

  return organization;
}

export async function getOrganizationBySlug(slug: string) {
  const organization = await Organization.findOne({ slug })
    .populate("accountManager", "name email");

  return organization;
}

export async function updateOrganization(organizationId: string, updates: any) {
  const organization = await Organization.findById(organizationId);
  if (!organization) throw new Error("Organization not found");

  const allowedUpdates = ["name", "email", "phone", "address", "industry", "size", "plan", "customSla", "status", "accountManager"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (organization as any)[key] = updates[key];
    }
  }

  organization.updatedAt = new Date();
  await organization.save();

  return organization;
}

export async function upgradePlan(organizationId: string, newPlan: string) {
  const organization = await Organization.findById(organizationId);
  if (!organization) throw new Error("Organization not found");

  (organization as any).plan = newPlan;
  (organization as any).status = "active";
  (organization as any).trialEndsAt = null;
  organization.updatedAt = new Date();
  await organization.save();

  return organization;
}

// ── Organization Members ─────────────────────────────────────────────────────────
export async function addOrganizationMember(data: any) {
  const {
    organizationId,
    userId,
    role,
    permissions,
    invitedBy,
  } = data;

  const organization = await Organization.findById(organizationId);
  if (!organization) throw new Error("Organization not found");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Check if user is already a member
  const existing = await OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
  });

  if (existing) {
    if (existing.status === "removed") {
      existing.status = "active";
      (existing as any).role = role || (existing as any).role;
      (existing as any).permissions = permissions || (existing as any).permissions;
      (existing as any).joinedAt = new Date();
      await existing.save();
      return existing;
    }
    throw new Error("User is already a member of this organization");
  }

  const member = await OrganizationMember.create({
    organization: organizationId,
    user: userId,
    role: role || "member",
    permissions: permissions || [],
    status: "active",
    invitedBy,
    joinedAt: new Date(),
  });

  // Notify user
  getIO().to(`user:${userId}`).emit("organization_invite", {
    organizationId,
    organizationName: organization.name,
    role,
  });

  return member;
}

export async function removeOrganizationMember(organizationId: string, userId: string) {
  const member = await OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
  });

  if (!member) throw new Error("Member not found");

  if ((member as any).role === "owner") {
    throw new Error("Cannot remove organization owner");
  }

  member.status = "removed";
  (member as any).updatedAt = new Date();
  await member.save();

  return member;
}

export async function updateMemberRole(organizationId: string, userId: string, role: string, permissions: any) {
  const member = await OrganizationMember.findOne({
    organization: organizationId,
    user: userId,
  });

  if (!member) throw new Error("Member not found");

  (member as any).role = role;
  (member as any).permissions = permissions || [];
  (member as any).updatedAt = new Date();
  await member.save();

  return member;
}

export async function getOrganizationMembers(organizationId: string) {
  const members = await OrganizationMember.find({ organization: organizationId })
    .populate("user", "name email")
    .populate("invitedBy", "name email")
    .sort({ joinedAt: -1 });

  return members;
}

export async function getUserOrganizations(userId: string) {
  const memberships = await OrganizationMember.find({
    user: userId,
    status: "active",
  })
    .populate("organization")
    .sort({ joinedAt: -1 });

  return memberships.map((m: any) => m.organization);
}

// ── Device Fleet Management ───────────────────────────────────────────────────────
export async function createDeviceFleet(data: any) {
  const {
    organizationId,
    name,
    description,
    autoRegister,
    deviceLimit,
    monitoringEnabled,
    alertThresholds,
  } = data;

  const organization = await Organization.findById(organizationId);
  if (!organization) throw new Error("Organization not found");

  const fleet = await DeviceFleet.create({
    organization: organizationId,
    name,
    description,
    autoRegister: autoRegister || false,
    deviceLimit,
    monitoringEnabled: monitoringEnabled !== false,
    alertThresholds: alertThresholds || {},
    status: "active",
  });

  return fleet;
}

export async function getDeviceFleet(fleetId: string) {
  const fleet = await DeviceFleet.findById(fleetId)
    .populate("organization", "name slug")
    .populate("devices", "imei make model");

  return fleet;
}

export async function getOrganizationFleets(organizationId: string) {
  const fleets = await DeviceFleet.find({ organization: organizationId })
    .populate("devices", "imei make model")
    .sort({ createdAt: -1 });

  return fleets;
}

export async function addDeviceToFleet(fleetId: string, deviceId: string) {
  const fleet = await DeviceFleet.findById(fleetId);
  if (!fleet) throw new Error("Fleet not found");

  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  if ((fleet as any).devices.includes(deviceId)) {
    throw new Error("Device already in fleet");
  }

  if ((fleet as any).deviceLimit && (fleet as any).devices.length >= (fleet as any).deviceLimit) {
    throw new Error("Fleet device limit reached");
  }

  (fleet as any).devices.push(deviceId);
  fleet.updatedAt = new Date();
  await fleet.save();

  return fleet;
}

export async function removeDeviceFromFleet(fleetId: string, deviceId: string) {
  const fleet = await DeviceFleet.findById(fleetId);
  if (!fleet) throw new Error("Fleet not found");

  (fleet as any).devices.pull(deviceId);
  fleet.updatedAt = new Date();
  await fleet.save();

  return fleet;
}

export async function updateFleetSettings(fleetId: string, updates: any) {
  const fleet = await DeviceFleet.findById(fleetId);
  if (!fleet) throw new Error("Fleet not found");

  const allowedUpdates = ["name", "description", "autoRegister", "deviceLimit", "monitoringEnabled", "alertThresholds", "status"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (fleet as any)[key] = updates[key];
    }
  }

  fleet.updatedAt = new Date();
  await fleet.save();

  return fleet;
}

// ── Fleet Analytics ─────────────────────────────────────────────────────────────
export async function getFleetAnalytics(fleetId: string) {
  const fleet = await DeviceFleet.findById(fleetId)
    .populate("devices");

  if (!fleet) throw new Error("Fleet not found");

  const devices = (fleet as any).devices || [];

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d: any) => d.status === "active").length;
  const stolenDevices = devices.filter((d: any) => d.stolen).length;
  const blacklistedDevices = devices.filter((d: any) => d.status === "blacklisted").length;

  return {
    totalDevices,
    activeDevices,
    stolenDevices,
    blacklistedDevices,
    monitoringEnabled: (fleet as any).monitoringEnabled,
    alertThresholds: (fleet as any).alertThresholds,
  };
}

// ── Enterprise Statistics ───────────────────────────────────────────────────────
export async function getEnterpriseStatistics() {
  const [
    totalOrganizations,
    activeOrganizations,
    trialOrganizations,
    totalMembers,
    totalFleets,
    totalFleetDevices,
    organizationsBySize,
    organizationsByPlan,
  ] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: "active" }),
    Organization.countDocuments({ status: "trial" }),
    OrganizationMember.countDocuments({ status: "active" }),
    DeviceFleet.countDocuments(),
    DeviceFleet.aggregate([
      { $unwind: "$devices" },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]),
    Organization.aggregate([
      { $group: { _id: "$size", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Organization.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalOrganizations,
    activeOrganizations,
    trialOrganizations,
    totalMembers,
    totalFleets,
    totalFleetDevices: totalFleetDevices[0]?.total || 0,
    organizationsBySize: organizationsBySize.map((o: any) => ({ size: o._id, count: o.count })),
    organizationsByPlan: organizationsByPlan.map((o: any) => ({ plan: o._id, count: o.count })),
  };
}
