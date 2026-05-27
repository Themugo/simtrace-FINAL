// services/telecomCompany.js - Telecom company layer services
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
export async function createTelecomCompany(data) {
  const companyId = `telecom_${crypto.randomBytes(16).toString("hex")}`;

  const company = await TelecomCompany.create({
    ...data,
    companyId,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return company;
}

export async function getTelecomCompany(companyId) {
  const company = await TelecomCompany.findOne({ companyId, status: "active" });
  if (!company) throw new Error("Telecom company not found");
  return company;
}

export async function getTelecomCompanyByEmail(officialEmail) {
  const company = await TelecomCompany.findOne({ officialEmail, status: "active" });
  return company;
}

export async function updateTelecomCompany(companyId, updates, updatedBy) {
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

export async function suspendTelecomCompany(companyId, suspendedBy) {
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

export async function verifyTelecomCompany(companyId, verifiedBy) {
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

export async function getTelecomCompaniesByCountry(countryCode) {
  const companies = await TelecomCompany.find({ countryCode, status: "active" });
  return companies;
}

export async function getTelecomCompaniesByRegion(countryCode, region) {
  const companies = await TelecomCompany.find({ countryCode, region, status: "active" });
  return companies;
}

// ── API Key Management ─────────────────────────────────────────────────────────────
export async function generateApiKey(companyId, permissions, expiresAt) {
  const company = await TelecomCompany.findOne({ companyId });
  if (!company) throw new Error("Telecom company not found");

  const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;

  company.apiKeys.push({
    key: apiKey,
    permissions,
    expiresAt,
    lastUsed: null,
  });

  company.updatedAt = new Date();
  await company.save();

  return apiKey;
}

export async function revokeApiKey(companyId, apiKey) {
  const company = await TelecomCompany.findOne({ companyId });
  if (!company) throw new Error("Telecom company not found");

  company.apiKeys = company.apiKeys.filter((k) => k.key !== apiKey);
  company.updatedAt = new Date();
  await company.save();

  return company;
}

export async function validateApiKey(apiKey) {
  const company = await TelecomCompany.findOne({
    "apiKeys.key": apiKey,
    status: "active",
  });

  if (!company) return { valid: false };

  const keyObj = company.apiKeys.find((k) => k.key === apiKey);
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
export async function checkTelecomPermission(companyId, permission) {
  const company = await TelecomCompany.findOne({ companyId, status: "active" });
  if (!company) return { allowed: false, reason: "Telecom company not found or inactive" };

  if (!company.permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, company };
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getTelecomStatistics(companyId) {
  const company = await TelecomCompany.findById(companyId);
  if (!company) throw new Error("Telecom company not found");

  const simCards = await SimCardTracking.countDocuments({ companyId });
  const networkActivities = await NetworkActivity.countDocuments({ companyId });
  const flaggedSimCards = await SimCardTracking.countDocuments({ companyId, flaggedAsStolen: true });

  return {
    totalTracked: company.totalTracked,
    totalRecovered: company.totalRecovered,
    totalCommission: company.totalCommission,
    simCardsTracked: simCards,
    networkActivities: networkActivities,
    flaggedSimCards: flaggedSimCards,
    commissionTier: company.commission.tier,
    verified: company.verified,
    status: company.status,
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
