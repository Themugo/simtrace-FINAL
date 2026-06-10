// services/lawEnforcement.ts - Law enforcement agency layer services
import crypto from "crypto";
import {
  LawEnforcementAgency,
  LawEnforcementDashboard,
  PoliceHierarchy,
  PoliceReport,
  InterpolCase,
  CourtCase,
  Device,
} from "../db/index.js";

// ── Law Enforcement Agency Management ───────────────────────────────────────────────────
export async function createLawEnforcementAgency(data: Record<string, unknown>) {
  const agencyId = `agency_${crypto.randomBytes(16).toString("hex")}`;

  const agency = await LawEnforcementAgency.create({
    ...data,
    agencyId,
    createdBy: data.createdBy as string,
    updatedBy: data.createdBy as string,
  });

  return agency;
}

export async function getLawEnforcementAgency(agencyId: string) {
  const agency = await LawEnforcementAgency.findOne({ agencyId, status: "active" });
  if (!agency) throw new Error("Law enforcement agency not found");
  return agency;
}

export async function getLawEnforcementAgencyByEmail(officialEmail: string) {
  const agency = await LawEnforcementAgency.findOne({ officialEmail, status: "active" });
  return agency;
}

export async function updateLawEnforcementAgency(agencyId: string, updates: Record<string, unknown>, updatedBy: string) {
  const agency = await LawEnforcementAgency.findOneAndUpdate(
    { agencyId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!agency) throw new Error("Law enforcement agency not found");
  return agency;
}

export async function suspendLawEnforcementAgency(agencyId: string, suspendedBy: string) {
  const agency = await LawEnforcementAgency.findOneAndUpdate(
    { agencyId },
    {
      status: "suspended",
      updatedBy: suspendedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!agency) throw new Error("Law enforcement agency not found");
  return agency;
}

export async function verifyLawEnforcementAgency(agencyId: string, verifiedBy: string) {
  const agency = await LawEnforcementAgency.findOneAndUpdate(
    { agencyId },
    {
      verified: true,
      updatedBy: verifiedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!agency) throw new Error("Law enforcement agency not found");
  return agency;
}

export async function getLawEnforcementAgenciesByCountry(countryCode: string) {
  const agencies = await LawEnforcementAgency.find({ countryCode, status: "active" });
  return agencies;
}

export async function getLawEnforcementAgenciesByRegion(countryCode: string, region: string) {
  const agencies = await LawEnforcementAgency.find({ countryCode, region, status: "active" });
  return agencies;
}

export async function getLawEnforcementAgenciesByType(agencyType: string) {
  const agencies = await LawEnforcementAgency.find({ agencyType, status: "active" });
  return agencies;
}

// ── API Key Management ─────────────────────────────────────────────────────────────
export async function generateLawEnforcementApiKey(agencyId: string, permissions: unknown, expiresAt?: Date) {
  const agency = await LawEnforcementAgency.findOne({ agencyId });
  if (!agency) throw new Error("Law enforcement agency not found");

  const apiKey = `sk_le_${crypto.randomBytes(32).toString("hex")}`;

  (agency as any).apiKeys.push({
    key: apiKey,
    permissions,
    expiresAt,
    lastUsed: null,
  });

  agency.updatedAt = new Date();
  await agency.save();

  return apiKey;
}

export async function revokeLawEnforcementApiKey(agencyId: string, apiKey: string) {
  const agency = await LawEnforcementAgency.findOne({ agencyId });
  if (!agency) throw new Error("Law enforcement agency not found");

  (agency as any).apiKeys = (agency as any).apiKeys.filter((k: { key: string }) => k.key !== apiKey);
  agency.updatedAt = new Date();
  await agency.save();

  return agency;
}

export async function validateLawEnforcementApiKey(apiKey: string) {
  const agency = await LawEnforcementAgency.findOne({
    "apiKeys.key": apiKey,
    status: "active",
  });

  if (!agency) return { valid: false };

  const keyObj = (agency as any).apiKeys.find((k: { key: string }) => k.key === apiKey);
  if (!keyObj) return { valid: false };

  // Check expiration
  if (keyObj.expiresAt && keyObj.expiresAt < new Date()) {
    return { valid: false, reason: "API key expired" };
  }

  // Update last used
  keyObj.lastUsed = new Date();
  await agency.save();

  return {
    valid: true,
    agency,
    permissions: keyObj.permissions,
  };
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkLawEnforcementPermission(agencyId: string, permission: string) {
  const agency = await LawEnforcementAgency.findOne({ agencyId, status: "active" });
  if (!agency) return { allowed: false, reason: "Law enforcement agency not found or inactive" };

  if (!(agency as any).permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, agency };
}

// ── Police Hierarchy Integration ───────────────────────────────────────────────────────
export async function linkHierarchyUnit(agencyId: string, hierarchyUnitId: string, linkedBy: string) {
  const agency = await LawEnforcementAgency.findOne({ agencyId });
  if (!agency) throw new Error("Law enforcement agency not found");

  const hierarchyUnit = await PoliceHierarchy.findById(hierarchyUnitId);
  if (!hierarchyUnit) throw new Error("Police hierarchy unit not found");

  if (!(agency as any).hierarchyUnits.includes(hierarchyUnitId)) {
    (agency as any).hierarchyUnits.push(hierarchyUnitId);
    agency.updatedBy = linkedBy;
    agency.updatedAt = new Date();
    await agency.save();
  }

  return agency;
}

export async function unlinkHierarchyUnit(agencyId: string, hierarchyUnitId: string, unlinkedBy: string) {
  const agency = await LawEnforcementAgency.findOne({ agencyId });
  if (!agency) throw new Error("Law enforcement agency not found");

  (agency as any).hierarchyUnits = (agency as any).hierarchyUnits.filter(
    (id: string) => id.toString() !== hierarchyUnitId.toString()
  );
  agency.updatedBy = unlinkedBy;
  agency.updatedAt = new Date();
  await agency.save();

  return agency;
}

// ── Case Management ───────────────────────────────────────────────────────────────────
export async function getAgencyCases(agencyId: string) {
  const agency = await LawEnforcementAgency.findById(agencyId);
  if (!agency) throw new Error("Law enforcement agency not found");

  const policeReports = await PoliceReport.find({ reportedBy: agencyId }).sort({ reportDate: -1 });
  const interpolCases = await InterpolCase.find({ agencyId }).sort({ createdAt: -1 });
  const courtCases = await CourtCase.find({ agencyId }).sort({ filingDate: -1 });

  return {
    policeReports,
    interpolCases,
    courtCases,
  };
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getLawEnforcementStatistics(agencyId: string) {
  const agency = await LawEnforcementAgency.findById(agencyId);
  if (!agency) throw new Error("Law enforcement agency not found");

  return {
    totalCases: (agency as any).totalCases,
    activeCases: (agency as any).activeCases,
    resolvedCases: (agency as any).resolvedCases,
    arrestsMade: (agency as any).arrestsMade,
    verified: (agency as any).verified,
    status: agency.status,
  };
}

export async function getLawEnforcementAgencyStatistics() {
  const [
    totalAgencies,
    activeAgencies,
    totalCases,
    activeCases,
    resolvedCases,
    arrestsMade,
  ] = await Promise.all([
    LawEnforcementAgency.countDocuments(),
    LawEnforcementAgency.countDocuments({ status: "active" }),
    LawEnforcementAgency.aggregate([{ $group: { _id: null, total: { $sum: "$totalCases" } } }]),
    LawEnforcementAgency.aggregate([{ $group: { _id: null, total: { $sum: "$activeCases" } } }]),
    LawEnforcementAgency.aggregate([{ $group: { _id: null, total: { $sum: "$resolvedCases" } } }]),
    LawEnforcementAgency.aggregate([{ $group: { _id: null, total: { $sum: "$arrestsMade" } } }]),
  ]);

  return {
    agencies: {
      total: totalAgencies,
      active: activeAgencies,
    },
    cases: {
      total: totalCases[0]?.total || 0,
      active: activeCases[0]?.total || 0,
      resolved: resolvedCases[0]?.total || 0,
    },
    arrests: arrestsMade[0]?.total || 0,
  };
}
