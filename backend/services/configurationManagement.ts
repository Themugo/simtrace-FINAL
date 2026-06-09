// services/configurationManagement.ts - Agency, Country, and Policy Configuration Management
import crypto from "crypto";
import {
  AgencyConfig,
  CountryConfig,
  PolicyRule,
  User,
} from "../db/index.js";
import { getIO } from "./socket.js";

// ── Agency Configuration Management ─────────────────────────────────────────────────
export async function createAgencyConfig(data: any) {
  const config = await AgencyConfig.create({
    ...data,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });
  return config;
}

export async function getAgencyConfig(agencyId: string) {
  const config = await AgencyConfig.findOne({ agencyId, status: "active" });
  if (!config) throw new Error("Agency configuration not found");
  return config;
}

export async function getAgencyConfigByCountry(country: string) {
  const configs = await AgencyConfig.find({ country, status: "active" });
  return configs;
}

export async function updateAgencyConfig(agencyId: string, updates: any, updatedBy: string) {
  const config = await AgencyConfig.findOneAndUpdate(
    { agencyId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true, upsert: false }
  );
  if (!config) throw new Error("Agency configuration not found");
  return config;
}

export async function generateApiKey(agencyId: string, keyData: any) {
  const config = await AgencyConfig.findOne({ agencyId });
  if (!config) throw new Error("Agency configuration not found");

  const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
  
  (config as any).api.keys.push({
    name: keyData.name,
    key: apiKey,
    permissions: keyData.permissions || [],
    rateLimitOverride: keyData.rateLimitOverride,
    expiresAt: keyData.expiresAt,
    lastUsed: new Date(),
    status: "active",
  });
  
  config.updatedAt = new Date();
  await config.save();

  return { apiKey, key: (config as any).api.keys[(config as any).api.keys.length - 1] };
}

export async function revokeApiKey(agencyId: string, keyId: string, revokedBy: string) {
  const config = await AgencyConfig.findOne({ agencyId });
  if (!config) throw new Error("Agency configuration not found");

  const key = (config as any).api.keys.id(keyId);
  if (!key) throw new Error("API key not found");

  key.status = "revoked";
  config.updatedAt = new Date();
  await config.save();

  return key;
}

export async function validateApiKey(apiKey: string) {
  const configs = await AgencyConfig.find({ "api.keys.key": apiKey, status: "active" });
  
  for (const config of configs) {
    const key = (config as any).api.keys.find((k: any) => k.key === apiKey);
    if (key && key.status === "active") {
      // Check expiration
      if (key.expiresAt && key.expiresAt < new Date()) {
        key.status = "expired";
        await config.save();
        continue;
      }
      
      // Update last used
      key.lastUsed = new Date();
      await config.save();
      
      return {
        valid: true,
        agencyId: (config as any).agencyId,
        permissions: key.permissions,
        rateLimitOverride: key.rateLimitOverride,
      };
    }
  }
  
  return { valid: false };
}

// ── Country Configuration Management ───────────────────────────────────────────────
export async function createCountryConfig(data: any) {
  const config = await CountryConfig.create({
    ...data,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });
  return config;
}

export async function getCountryConfig(countryCode: string) {
  const config = await CountryConfig.findOne({ countryCode, status: "active" });
  if (!config) throw new Error("Country configuration not found");
  return config;
}

export async function getAllCountryConfigs() {
  const configs = await CountryConfig.find({ status: "active" });
  return configs;
}

export async function updateCountryConfig(countryCode: string, updates: any, updatedBy: string) {
  const config = await CountryConfig.findOneAndUpdate(
    { countryCode },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true, upsert: false }
  );
  if (!config) throw new Error("Country configuration not found");
  return config;
}

// ── Policy Engine ───────────────────────────────────────────────────────────────────
export async function createPolicyRule(data: any) {
  const rule = await PolicyRule.create({
    ...data,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });
  return rule;
}

export async function getPolicyRules(filters: any = {}) {
  const rules = await PolicyRule.find({ ...filters, enabled: true })
    .sort({ priority: -1 });
  return rules;
}

export async function getPolicyRulesByScope(scope: any) {
  const rules = await PolicyRule.find({
    enabled: true,
    $or: [
      { "scope.agencyId": null, "scope.countryCode": null }, // Global rules
      { "scope.agencyId": scope.agencyId },
      { "scope.countryCode": scope.countryCode },
      { "scope.roleLevel": scope.roleLevel },
    ],
  }).sort({ priority: -1 });
  return rules;
}

export async function evaluatePolicy(context: any, eventType: string) {
  // Get rules for the context
  const rules = await getPolicyRulesByScope({
    agencyId: context.agencyId,
    countryCode: context.countryCode,
    roleLevel: context.roleLevel,
  });

  // Filter rules that execute on this event
  const applicableRules = rules.filter((rule: any) => 
    (rule as any).executeOn.includes(eventType)
  );

  // Evaluate rules in priority order
  for (const rule of applicableRules) {
    const result = evaluateCondition((rule as any).rule.condition, context);
    if (result) {
      return {
        action: (rule as any).rule.action,
        policyId: (rule as any).policyId,
        policyName: (rule as any).policyName,
      };
    }
  }

  return null; // No policy matched
}

function evaluateCondition(condition: any, context: any): boolean {
  // Simple condition evaluation
  // Can be extended with a more sophisticated expression evaluator
  const { field, operator, value } = condition;
  const contextValue = getNestedValue(context, field);

  switch (operator) {
    case "===":
      return contextValue === value;
    case "!==":
      return contextValue !== value;
    case ">":
      return contextValue > value;
    case "<":
      return contextValue < value;
    case ">=":
      return contextValue >= value;
    case "<=":
      return contextValue <= value;
    case "in":
      return Array.isArray(value) && value.includes(contextValue);
    case "contains":
      return Array.isArray(contextValue) && contextValue.includes(value);
    default:
      return false;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o: any, key: string) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
}

export async function updatePolicyRule(policyId: string, updates: any, updatedBy: string) {
  const rule = await PolicyRule.findOneAndUpdate(
    { policyId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true, upsert: false }
  );
  if (!rule) throw new Error("Policy rule not found");
  return rule;
}

export async function enablePolicyRule(policyId: string) {
  const rule = await PolicyRule.findOneAndUpdate(
    { policyId },
    { enabled: true, updatedAt: new Date() },
    { new: true }
  );
  if (!rule) throw new Error("Policy rule not found");
  return rule;
}

export async function disablePolicyRule(policyId: string) {
  const rule = await PolicyRule.findOneAndUpdate(
    { policyId },
    { enabled: false, updatedAt: new Date() },
    { new: true }
  );
  if (!rule) throw new Error("Policy rule not found");
  return rule;
}

// ── Configuration Helpers ─────────────────────────────────────────────────────────
export async function getEffectiveConfig(agencyId: string, countryCode: string) {
  const agencyConfig = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] No agency config for ${agencyId}`); return null; });
  const countryConfig = await getCountryConfig(countryCode).catch(() => { console.warn(`[Config] No country config for ${countryCode}`); return null; });

  // Merge configurations (agency config takes precedence)
  const effectiveConfig = {
    security: {
      ...(countryConfig as any)?.legal,
      ...(agencyConfig as any)?.security,
    },
    rateLimiting: (agencyConfig as any)?.rateLimiting || {},
    dataRetention: (agencyConfig as any)?.dataRetention || {},
    notifications: (agencyConfig as any)?.notifications || {},
    api: (agencyConfig as any)?.api || {},
    integrations: (agencyConfig as any)?.integrations || [],
    dataMasking: (agencyConfig as any)?.dataMasking || {},
    consent: (agencyConfig as any)?.consent || {},
    workflows: {
      ...(countryConfig as any)?.missingPerson,
      ...(agencyConfig as any)?.workflows,
    },
    compliance: (agencyConfig as any)?.compliance || {},
  };

  return effectiveConfig;
}

export async function checkRateLimit(agencyId: string, endpoint: string, userIp: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Rate limit check — no config for ${agencyId}`); return null; });

  if (!config || !(config as any).rateLimiting?.enabled) return { allowed: true };
  // This is a simplified rate limit check
  // In production, use Redis or a dedicated rate limiter
  const rateLimit = (config as any).rateLimiting;
  
  // Check endpoint-specific limits
  const endpointLimit = rateLimit.endpoints?.find((e: any) => endpoint.includes(e.path));
  const limit = endpointLimit || rateLimit;

  // TODO: Implement actual rate limiting with Redis
  // For now, return allowed
  return { allowed: true, limit: limit.requestsPerMinute };
}

export async function checkIPAccess(agencyId: string, userIp: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] IP access check — no config for ${agencyId}`); return null; });
  if (!config) return { allowed: true };

  const { ipWhitelist, ipBlacklist } = (config as any).security || {};

  // Check blacklist first
  if (ipBlacklist && ipBlacklist.length > 0) {
    if (ipBlacklist.some((ip: string) => userIp.startsWith(ip))) {
      return { allowed: false, reason: "IP blacklisted" };
    }
  }

  // Check whitelist
  if (ipWhitelist && ipWhitelist.length > 0) {
    if (!ipWhitelist.some((ip: string) => userIp.startsWith(ip))) {
      return { allowed: false, reason: "IP not whitelisted" };
    }
  }

  return { allowed: true };
}

export async function checkTimeBasedAccess(agencyId: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Time-based access — no config for ${agencyId}`); return null; });
  if (!config || !(config as any).security?.timeBasedAccess?.length) return { allowed: true };

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const timeRules = (config as any).security.timeBasedAccess;
  
  for (const rule of timeRules) {
    if (rule.dayOfWeek.includes(dayOfWeek)) {
      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime <= endTime) {
        return { allowed: true };
      }
    }
  }

  return { allowed: false, reason: "Outside allowed time" };
}

export async function maskData(data: any, agencyId: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Mask data — no config for ${agencyId}`); return null; });
  if (!config || !(config as any).dataMasking?.enabled) return data;

  const rules = (config as any).dataMasking.rules || [];
  let maskedData = { ...data };

  for (const rule of rules) {
    if (maskedData[rule.field]) {
      maskedData[rule.field] = applyMask(
        maskedData[rule.field],
        rule.maskPattern,
        rule.showFirst,
        rule.showLast
      );
    }
  }

  return maskedData;
}

function applyMask(value: any, pattern: string, showFirst: number, showLast: number): string {
  const str = String(value);
  const length = str.length;
  
  if (pattern) {
    // Use custom pattern
    let result = "";
    let patternIndex = 0;
    let valueIndex = 0;
    
    while (patternIndex < pattern.length && valueIndex < length) {
      if (pattern[patternIndex] === "#") {
        result += str[valueIndex];
        valueIndex++;
      } else {
        result += pattern[patternIndex];
      }
      patternIndex++;
    }
    
    return result;
  } else {
    // Simple masking
    if (showFirst > 0 && showLast > 0) {
      if (length <= showFirst + showLast) {
        return str; // Too short to mask
      }
      const first = str.substring(0, showFirst);
      const last = str.substring(length - showLast);
      const middle = "*".repeat(length - showFirst - showLast);
      return first + middle + last;
    } else if (showFirst > 0) {
      return str.substring(0, showFirst) + "*".repeat(length - showFirst);
    } else if (showLast > 0) {
      return "*".repeat(length - showLast) + str.substring(length - showLast);
    } else {
      return "*".repeat(length);
    }
  }
}

export async function validatePassword(password: string, agencyId: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Password validation — no config for ${agencyId}`); return null; });
  const policy = (config as any)?.security?.passwordPolicy || {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}

// ── Webhook System ───────────────────────────────────────────────────────────────────
export async function triggerWebhooks(agencyId: string, event: string, payload: any) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Webhook trigger — no config for ${agencyId}`); return null; });
  if (!config || !(config as any).notifications?.webhookEndpoints) return;

  const webhooks = (config as any).notifications.webhookEndpoints.filter(
    (w: any) => w.events.includes(event)
  );

  for (const webhook of webhooks) {
    try {
      // TODO: Implement actual webhook call with retry logic
      console.log(`Triggering webhook ${webhook.url} for event ${event}`);
      
      // Emit via Socket.io for real-time notification
      getIO().to(`agency:${agencyId}`).emit("webhook_event", {
        event,
        payload,
        webhookUrl: webhook.url,
      });
    } catch (error) {
      console.error(`Webhook failed: ${webhook.url}`, error);
    }
  }
}

// ── Integration Helper ───────────────────────────────────────────────────────────────
export async function getIntegrationConfig(agencyId: string, provider: string) {
  const config = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Integration config — no config for ${agencyId}`); return null; });
  if (!config) return null;

  const integration = (config as any).integrations?.find((i: any) => i.provider === provider && i.enabled);
  return integration || null;
}

export async function mapFields(data: any, mapping: any) {
  if (!mapping) return data;

  const mapped: any = {};
  for (const [sourceField, targetField] of Object.entries(mapping)) {
    const value = getNestedValue(data, sourceField);
    if (value !== undefined) {
      setNestedValue(mapped, String(targetField), value);
    }
  }

  return mapped;
}

function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
}

// ── Statistics ─────────────────────────────────────────────────────────────────────
export async function getConfigurationStatistics() {
  const [
    totalAgencyConfigs,
    activeAgencyConfigs,
    totalCountryConfigs,
    activeCountryConfigs,
    totalPolicyRules,
    activePolicyRules,
    totalApiKeys,
    activeApiKeys,
    totalIntegrations,
    activeIntegrations,
  ] = await Promise.all([
    AgencyConfig.countDocuments(),
    AgencyConfig.countDocuments({ status: "active" }),
    CountryConfig.countDocuments(),
    CountryConfig.countDocuments({ status: "active" }),
    PolicyRule.countDocuments(),
    PolicyRule.countDocuments({ enabled: true }),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $project: { keyCount: { $size: "$api.keys" } } },
      { $group: { _id: null, total: { $sum: "$keyCount" } } },
    ]).then((result: any[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$api.keys" },
      { $match: { "api.keys.status": "active" } },
      { $count: "total" },
    ]).then((result: any[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $project: { integrationCount: { $size: "$integrations" } } },
      { $group: { _id: null, total: { $sum: "$integrationCount" } } },
    ]).then((result: any[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$integrations" },
      { $match: { "integrations.enabled": true } },
      { $count: "total" },
    ]).then((result: any[]) => result[0]?.total || 0),
  ]);

  return {
    agencyConfigs: {
      total: totalAgencyConfigs,
      active: activeAgencyConfigs,
    },
    countryConfigs: {
      total: totalCountryConfigs,
      active: activeCountryConfigs,
    },
    policyRules: {
      total: totalPolicyRules,
      active: activePolicyRules,
    },
    apiKeys: {
      total: totalApiKeys,
      active: activeApiKeys,
    },
    integrations: {
      total: totalIntegrations,
      active: activeIntegrations,
    },
  };
}
