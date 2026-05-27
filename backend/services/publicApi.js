// services/publicApi.js - Public API Key Management
// Developer ecosystem for third-party integrations

import { PublicApiKey, User, Organization } from "../db/index.js";
import crypto from "crypto";

// ── API Key Generation ───────────────────────────────────────────────────────────
function generateApiKey() {
  const prefix = "sk_simtrace_";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `${prefix}${randomBytes}`;
}

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

// ── API Key Management ───────────────────────────────────────────────────────────
export async function createApiKey(data) {
  const {
    userId,
    organizationId,
    keyName,
    scopes,
    rateLimit,
    expiresAt,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (organizationId) {
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new Error("Organization not found");
  }

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = apiKey.substring(0, 12);

  const key = await PublicApiKey.create({
    user: userId,
    organization: organizationId,
    keyName,
    keyHash,
    keyPrefix,
    scopes: scopes || ["read:devices"],
    rateLimit: rateLimit || 1000,
    expiresAt,
    active: true,
  });

  return {
    key,
    keyId: key._id,
    keyPrefix,
  };
}

export async function getApiKey(keyId) {
  const key = await PublicApiKey.findById(keyId)
    .populate("user", "name email")
    .populate("organization", "name slug");

  return key;
}

export async function getApiKeysByUser(userId) {
  const keys = await PublicApiKey.find({ user: userId })
    .populate("organization", "name slug")
    .sort({ createdAt: -1 });

  return keys;
}

export async function getApiKeysByOrganization(organizationId) {
  const keys = await PublicApiKey.find({ organization: organizationId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return keys;
}

export async function updateApiKey(keyId, updates) {
  const key = await PublicApiKey.findById(keyId);
  if (!key) throw new Error("API key not found");

  const allowedUpdates = ["keyName", "scopes", "rateLimit", "expiresAt", "active"];
  for (const field of allowedUpdates) {
    if (updates[field] !== undefined) {
      key[field] = updates[field];
    }
  }

  key.updatedAt = new Date();
  await key.save();

  return key;
}

export async function revokeApiKey(keyId) {
  const key = await PublicApiKey.findById(keyId);
  if (!key) throw new Error("API key not found");

  key.active = false;
  key.updatedAt = new Date();
  await key.save();

  return key;
}

export async function deleteApiKey(keyId) {
  const key = await PublicApiKey.findByIdAndDelete(keyId);
  if (!key) throw new Error("API key not found");

  return key;
}

// ── API Key Authentication ───────────────────────────────────────────────────────
export async function authenticateApiKey(apiKey) {
  const keyHash = hashApiKey(apiKey);

  const key = await PublicApiKey.findOne({
    keyHash,
    active: true,
  })
    .populate("user")
    .populate("organization");

  if (!key) {
    return null;
  }

  // Check expiration
  if (key.expiresAt && key.expiresAt < new Date()) {
    key.active = false;
    await key.save();
    return null;
  }

  // Update usage
  key.totalRequests += 1;
  key.lastUsedAt = new Date();
  await key.save();

  return key;
}

export async function checkApiKeyRateLimit(apiKey) {
  const key = await authenticateApiKey(apiKey);
  if (!key) return false;

  // Simple rate limiting - in production use Redis
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // This is a simplified check - in production use a proper rate limiter
  // For now, we'll just check if the key is active
  return key.active;
}

export async function checkApiKeyScope(apiKey, requiredScope) {
  const key = await authenticateApiKey(apiKey);
  if (!key) return false;

  return key.scopes.includes(requiredScope) || key.scopes.includes("*");
}

// ── API Key Statistics ───────────────────────────────────────────────────────────
export async function getApiKeyStatistics() {
  const [
    totalKeys,
    activeKeys,
    expiredKeys,
    totalRequests,
    keysByScope,
  ] = await Promise.all([
    PublicApiKey.countDocuments(),
    PublicApiKey.countDocuments({ active: true }),
    PublicApiKey.countDocuments({ active: false, expiresAt: { $lt: new Date() } }),
    PublicApiKey.aggregate([
      { $group: { _id: null, total: { $sum: "$totalRequests" } } },
    ]),
    PublicApiKey.aggregate([
      { $unwind: "$scopes" },
      { $group: { _id: "$scopes", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalKeys,
    activeKeys,
    expiredKeys,
    totalRequests: totalRequests[0]?.total || 0,
    keysByScope: keysByScope.map(k => ({ scope: k._id, count: k.count })),
  };
}

// ── Scopes Definition ───────────────────────────────────────────────────────────
export const API_SCOPES = {
  "read:devices": "Read device information",
  "write:devices": "Create and update devices",
  "read:alerts": "Read security alerts",
  "write:alerts": "Create and manage alerts",
  "read:location": "Read device location data",
  "read:theft": "Read theft reports",
  "write:theft": "Create theft reports",
  "read:recovery": "Read recovery cases",
  "write:recovery": "Manage recovery cases",
  "read:insurance": "Read insurance policies and claims",
  "write:insurance": "Manage insurance policies and claims",
  "read:financials": "Read financial data",
  "read:analytics": "Read analytics data",
  "*": "Full access to all resources",
};
