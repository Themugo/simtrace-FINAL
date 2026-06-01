// services/telecomCompany.ts - Telecom company layer services
import crypto from "crypto";
import {
  TelecomCompany,
  TelecomDashboard,
  SimCardTracking,
  NetworkActivity,
  Device,
  CellTower,
} from "../db/index.js";

// ── Telecom Company Management ───────────────────────────────────────────────────────
export async function createTelecomCompany(data: any) {
  const companyId = `telecom_${crypto.randomBytes(16).toString("hex")}`;

  const company = await TelecomCompany.create({
    ...data,
    companyId,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return company;
}

export async function getTelecomCompany(companyId: string) {
  const company = await TelecomCompany.findOne({ companyId, status: "active" });
  if (!company) throw new Error("Telecom company not found");
  return company;
}

export async function getTelecomCompanyByEmail(officialEmail: string) {
  const company = await TelecomCompany.findOne({ officialEmail, status: "active" });
  return company;
}

export async function updateTelecomCompany(companyId: string, updates: any, updatedBy: string) {
  const company = await TelecomCompany.findOneAndUpdate(
    { companyId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!company) throw new Error("Telecom company not found");
  return company;
}

export async function suspendTelecomCompany(companyId: string, suspendedBy: string) {
  const company = await TelecomCompany.findOneAndUpdate(
    { companyId },
    {
      status: "suspended",
      updatedBy: suspendedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!company) throw new Error("Telecom company not found");
  return company;
}

export async function verifyTelecomCompany(companyId: string, verifiedBy: string) {
  const company = await TelecomCompany.findOneAndUpdate(
    { companyId },
    {
      verified: true,
      updatedBy: verifiedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!company) throw new Error("Telecom company not found");
  return company;
}

export async function getTelecomCompaniesByCountry(countryCode: string) {
  const companies = await TelecomCompany.find({ countryCode, status: "active" });
  return companies;
}

export async function getTelecomCompaniesByRegion(countryCode: string, region: string) {
  const companies = await TelecomCompany.find({ countryCode, region, status: "active" });
  return companies;
}

// ── API Key Management ─────────────────────────────────────────────────────────────
export async function generateApiKey(companyId: string, permissions: any, expiresAt?: Date) {
  const company = await TelecomCompany.findOne({ companyId });
  if (!company) throw new Error("Telecom company not found");

  const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

  (company as any).apiKeys.push({
    key: apiKey,
    permissions,
    expiresAt,
    lastUsed: null,
  });

  company.updatedAt = new Date();
  await company.save();

  return apiKey;
}

export async function revokeApiKey(companyId: string, apiKey: string) {
  const company = await TelecomCompany.findOne({ companyId });
  if (!company) throw new Error("Telecom company not found");

  (company as any).apiKeys = (company as any).apiKeys.filter((k: any) => k.key !== apiKey);
  company.updatedAt = new Date();
  await company.save();

  return company;
}

export async function validateApiKey(apiKey: string) {
  const company = await TelecomCompany.findOne({
    "apiKeys.key": apiKey,
    status: "active",
  });

  if (!company) return { valid: false };

  const keyObj = (company as any).apiKeys.find((k: any) => k.key === apiKey);
  if (!keyObj) return { valid: false };

  // Check expiration
  if (keyObj.expiresAt && keyObj.expiresAt < new Date()) {
    return { valid: false, reason: "API key expired" };
  }

  // Update last used
  keyObj.lastUsed = new Date();
  await company.save();

  return {
    valid: true,
    company,
    permissions: keyObj.permissions,
  };
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkTelecomPermission(companyId: string, permission: string) {
  const company = await TelecomCompany.findOne({ companyId, status: "active" });
  if (!company) return { allowed: false, reason: "Telecom company not found or inactive" };

  if (!(company as any).permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, company };
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getTelecomStatistics(companyId: string) {
  const company = await TelecomCompany.findById(companyId);
  if (!company) throw new Error("Telecom company not found");

  const simCards = await SimCardTracking.countDocuments({ companyId });
  const networkActivities = await NetworkActivity.countDocuments({ companyId });
  const flaggedSimCards = await SimCardTracking.countDocuments({ companyId, flaggedAsStolen: true });

  return {
    totalTracked: (company as any).totalTracked,
    totalRecovered: (company as any).totalRecovered,
    totalCommission: (company as any).totalCommission,
    simCardsTracked: simCards,
    networkActivities: networkActivities,
    flaggedSimCards: flaggedSimCards,
    commissionTier: (company as any).commission.tier,
    verified: (company as any).verified,
    status: (company as any).status,
  };
}

export async function getTelecomCompanyStatistics() {
  const [
    totalCompanies,
    activeCompanies,
    totalSimCards,
    totalActivities,
    totalTracked,
    totalRecovered,
    totalCommission,
  ] = await Promise.all([
    TelecomCompany.countDocuments(),
    TelecomCompany.countDocuments({ status: "active" }),
    SimCardTracking.countDocuments(),
    NetworkActivity.countDocuments(),
    TelecomCompany.aggregate([{ $group: { _id: null, total: { $sum: "$totalTracked" } } }]),
    TelecomCompany.aggregate([{ $group: { _id: null, total: { $sum: "$totalRecovered" } } }]),
    TelecomCompany.aggregate([{ $group: { _id: null, total: { $sum: "$totalCommission" } } }]),
  ]);

  const flaggedSimCards = await SimCardTracking.countDocuments({ flaggedAsStolen: true });

  return {
    companies: {
      total: totalCompanies,
      active: activeCompanies,
    },
    tracking: {
      simCards: totalSimCards,
      activities: totalActivities,
      flaggedSimCards,
    },
    performance: {
      totalTracked: totalTracked[0]?.total || 0,
      totalRecovered: totalRecovered[0]?.total || 0,
      totalCommission: totalCommission[0]?.total || 0,
    },
  };
}
