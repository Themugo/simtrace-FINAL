// services/configurationManagement.ts - Agency, Country, and Policy Configuration Management
import crypto from "crypto";
import {
  AgencyConfig,
  CountryConfig,
  PolicyRule,
  User,
} from "../db/index.js";
import { getIO } from "./socket.js";

// ── Type Definitions ────────────────────────────────────────────────────────────

interface ApiKey {
  name: string;
  key: string;
  permissions: string[];
  rateLimitOverride?: number;
  expiresAt?: Date;
  lastUsed: Date;
  status: "active" | "revoked" | "expired";
}

interface CreateApiKeyInput {
  name: string;
  permissions?: string[];
  rateLimitOverride?: number;
  expiresAt?: Date;
}

interface EndpointLimit {
  path: string;
  requestsPerMinute: number;
}

interface MaskingRule {
  field: string;
  maskPattern?: string;
  showFirst: number;
  showLast: number;
}

interface WebhookEndpoint {
  url: string;
  events: string[];
}

interface Integration {
  provider: string;
  enabled: boolean;
  [key: string]: unknown;
}

interface Condition {
  field: string;
  operator: "===" | "!==" | ">" | "<" | ">=" | "<=" | "in" | "contains";
  value: unknown;
}

interface PolicyRuleScope {
  agencyId?: string | null;
  countryCode?: string | null;
  roleLevel?: string;
}

interface CreateAgencyConfigInput {
  agencyId: string;
  status?: "active" | "inactive";
  createdBy: string;
  api?: { keys?: ApiKey[] };
  rateLimiting?: {
    enabled: boolean;
    endpoints?: EndpointLimit[];
    requestsPerMinute?: number;
  };
  security?: {
    ipWhitelist?: string[];
    ipBlacklist?: string[];
    timeBasedAccess?: TimeBasedAccessRule[];
    passwordPolicy?: PasswordPolicy;
  };
  dataRetention?: Record<string, unknown>;
  notifications?: { webhookEndpoints?: WebhookEndpoint[] };
  integrations?: Integration[];
  dataMasking?: { enabled: boolean; rules?: MaskingRule[] };
  consent?: Record<string, unknown>;
  workflows?: Record<string, unknown>;
  compliance?: Record<string, unknown>;
}

interface TimeBasedAccessRule {
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

interface CreateCountryConfigInput {
  countryCode: string;
  status?: "active" | "inactive";
  createdBy: string;
  legal?: Record<string, unknown>;
  missingPerson?: Record<string, unknown>;
}

interface CreatePolicyRuleInput {
  policyId?: string;
  name: string;
  enabled?: boolean;
  priority?: number;
  executeOn: string[];
  scope: PolicyRuleScope;
  rule: { condition: Condition; action: string };
  policyName?: string;
  createdBy: string;
}

interface PolicyEvaluationContext {
  agencyId?: string;
  countryCode?: string;
  roleLevel?: string;
  [key: string]: unknown;
}

// Mongoose models use strict: false — document fields are untyped at the TS level
// These helper types cast the loose Mongoose document into our known shapes
type AgencyConfigFields = CreateAgencyConfigInput & { updatedAt: Date };
type CountryConfigFields = CreateCountryConfigInput & { updatedAt: Date };
type PolicyRuleFields = CreatePolicyRuleInput & { updatedAt: Date; status: string };

// ── Agency Configuration Management ─────────────────────────────────────────────────
export async function createAgencyConfig(data: CreateAgencyConfigInput) {
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

export async function updateAgencyConfig(agencyId: string, updates: Partial<CreateAgencyConfigInput>, updatedBy: string) {
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

export async function generateApiKey(agencyId: string, keyData: CreateApiKeyInput) {
  const config = await AgencyConfig.findOne({ agencyId });
  if (!config) throw new Error("Agency configuration not found");

  const apiKey = `sk_${crypto.randomBytes(32).toString("hex")}`;
  const cfg = config as unknown as AgencyConfigFields;
  
  if (!cfg.api) cfg.api = { keys: [] };
  cfg.api.keys!.push({
    name: keyData.name,
    key: apiKey,
    permissions: keyData.permissions || [],
    rateLimitOverride: keyData.rateLimitOverride,
    expiresAt: keyData.expiresAt,
    lastUsed: new Date(),
    status: "active",
  });
  
  cfg.updatedAt = new Date();
  await config.save();

  const keys = cfg.api?.keys ?? [];
  return { apiKey, key: keys[keys.length - 1] };
}

export async function revokeApiKey(agencyId: string, keyId: string, revokedBy: string) {
  const config = await AgencyConfig.findOne({ agencyId });
  if (!config) throw new Error("Agency configuration not found");

  const cfg = config as unknown as AgencyConfigFields;
  const key = cfg.api?.keys?.find((k: ApiKey) => k.key === keyId);
  if (!key) throw new Error("API key not found");

  key.status = "revoked";
  cfg.updatedAt = new Date();
  await config.save();

  return key;
}

export async function validateApiKey(apiKey: string) {
  const configs = await AgencyConfig.find({ "api.keys.key": apiKey, status: "active" });
  
  for (const config of configs) {
    const cfg = config as unknown as AgencyConfigFields;
    const key = cfg.api?.keys?.find((k: ApiKey) => k.key === apiKey);
    if (key && key.status === "active") {
      if (key.expiresAt && key.expiresAt < new Date()) {
        key.status = "expired";
        await config.save();
        continue;
      }
      
      key.lastUsed = new Date();
      await config.save();
      
      return {
        valid: true,
        agencyId: cfg.agencyId,
        permissions: key.permissions,
        rateLimitOverride: key.rateLimitOverride,
      };
    }
  }
  
  return { valid: false };
}

// ── Country Configuration Management ───────────────────────────────────────────────
export async function createCountryConfig(data: CreateCountryConfigInput) {
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

export async function updateCountryConfig(countryCode: string, updates: Partial<CreateCountryConfigInput>, updatedBy: string) {
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
export async function createPolicyRule(data: CreatePolicyRuleInput) {
  const rule = await PolicyRule.create({
    ...data,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });
  return rule;
}

export async function getPolicyRules(filters: Record<string, unknown> = {}) {
  const rules = await PolicyRule.find({ ...filters, enabled: true })
    .sort({ priority: -1 });
  return rules;
}

export async function getPolicyRulesByScope(scope: PolicyRuleScope) {
  const rules = await PolicyRule.find({
    enabled: true,
    $or: [
      { "scope.agencyId": null, "scope.countryCode": null },
      { "scope.agencyId": scope.agencyId },
      { "scope.countryCode": scope.countryCode },
      { "scope.roleLevel": scope.roleLevel },
    ],
  }).sort({ priority: -1 });
  return rules;
}

export async function evaluatePolicy(context: PolicyEvaluationContext, eventType: string) {
  const rules = await getPolicyRulesByScope({
    agencyId: context.agencyId,
    countryCode: context.countryCode,
    roleLevel: context.roleLevel,
  });

  const applicableRules = rules.filter((rule) =>
    rule.executeOn.includes(eventType)
  );

  for (const rule of applicableRules) {
    const result = evaluateCondition(rule.rule.condition, context);
    if (result) {
      return {
        action: rule.rule.action,
        policyId: rule.policyId,
        policyName: rule.policyName,
      };
    }
  }

  return null;
}

function evaluateCondition(condition: Condition, context: Record<string, unknown>): boolean {
  const { field, operator, value } = condition;
  const contextValue = getNestedValue(context, field);

  switch (operator) {
    case "===":
      return contextValue === value;
    case "!==":
      return contextValue !== value;
    case ">":
      return (contextValue as number) > (value as number);
    case "<":
      return (contextValue as number) < (value as number);
    case ">=":
      return (contextValue as number) >= (value as number);
    case "<=":
      return (contextValue as number) <= (value as number);
    case "in":
      return Array.isArray(value) && value.includes(contextValue);
    case "contains":
      return Array.isArray(contextValue) && contextValue.includes(value);
    default:
      return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o: unknown, key: string) => {
    if (o && typeof o === "object" && key in o) {
      return (o as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export async function updatePolicyRule(policyId: string, updates: Partial<CreatePolicyRuleInput>, updatedBy: string) {
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
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] No agency config for ${agencyId}`); return null; });
  const countryDoc = await getCountryConfig(countryCode).catch(() => { console.warn(`[Config] No country config for ${countryCode}`); return null; });

  const agencyConfig = doc ? (doc as unknown as AgencyConfigFields) : null;
  const countryConfig = countryDoc ? (countryDoc as unknown as CountryConfigFields) : null;

  const effectiveConfig = {
    security: {
      ...(countryConfig?.legal ?? {}),
      ...(agencyConfig?.security ?? {}),
    },
    rateLimiting: agencyConfig?.rateLimiting || {},
    dataRetention: agencyConfig?.dataRetention || {},
    notifications: agencyConfig?.notifications || {},
    api: agencyConfig?.api || {},
    integrations: agencyConfig?.integrations || [],
    dataMasking: agencyConfig?.dataMasking || {},
    consent: agencyConfig?.consent || {},
    workflows: {
      ...(countryConfig?.missingPerson ?? {}),
      ...(agencyConfig?.workflows ?? {}),
    },
    compliance: agencyConfig?.compliance || {},
  };

  return effectiveConfig;
}

export async function checkRateLimit(agencyId: string, endpoint: string, userIp: string) {
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Rate limit check — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;

  if (!config || !config.rateLimiting?.enabled) return { allowed: true };

  const rateLimit = config.rateLimiting;
  const endpointLimit = rateLimit.endpoints?.find((e: EndpointLimit) => endpoint.includes(e.path));
  const limit = endpointLimit || rateLimit;

  return { allowed: true, limit: limit.requestsPerMinute };
}

export async function checkIPAccess(agencyId: string, userIp: string) {
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] IP access check — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  if (!config) return { allowed: true };

  const { ipWhitelist, ipBlacklist } = config.security || {};

  if (ipBlacklist && ipBlacklist.length > 0) {
    if (ipBlacklist.some((ip: string) => userIp.startsWith(ip))) {
      return { allowed: false, reason: "IP blacklisted" };
    }
  }

  if (ipWhitelist && ipWhitelist.length > 0) {
    if (!ipWhitelist.some((ip: string) => userIp.startsWith(ip))) {
      return { allowed: false, reason: "IP not whitelisted" };
    }
  }

  return { allowed: true };
}

export async function checkTimeBasedAccess(agencyId: string) {
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Time-based access — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  if (!config || !config.security?.timeBasedAccess?.length) return { allowed: true };

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const timeRules = config.security.timeBasedAccess;
  
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

export async function maskData(data: Record<string, unknown>, agencyId: string) {
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Mask data — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  if (!config || !config.dataMasking?.enabled) return data;

  const rules = config.dataMasking.rules || [];
  const maskedData = { ...data };

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

function applyMask(value: unknown, pattern: string | undefined, showFirst: number, showLast: number): string {
  const str = String(value);
  const length = str.length;
  
  if (pattern) {
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
    if (showFirst > 0 && showLast > 0) {
      if (length <= showFirst + showLast) {
        return str;
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
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Password validation — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  const policy = config?.security?.passwordPolicy || {
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
export async function triggerWebhooks(agencyId: string, event: string, payload: Record<string, unknown>) {
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Webhook trigger — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  if (!config || !config.notifications?.webhookEndpoints) return;

  const webhooks = config.notifications.webhookEndpoints.filter(
    (w: WebhookEndpoint) => w.events.includes(event)
  );

  for (const webhook of webhooks) {
    try {
      console.log(`Triggering webhook ${webhook.url} for event ${event}`);
      
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
  const doc = await getAgencyConfig(agencyId).catch(() => { console.warn(`[Config] Integration config — no config for ${agencyId}`); return null; });
  const config = doc ? (doc as unknown as AgencyConfigFields) : null;
  if (!config) return null;

  const integration = config.integrations?.find((i: Integration) => i.provider === provider && i.enabled);
  return integration || null;
}

export async function mapFields(data: Record<string, unknown>, mapping: Record<string, string>) {
  if (!mapping) return data;

  const mapped: Record<string, unknown> = {};
  for (const [sourceField, targetField] of Object.entries(mapping)) {
    const value = getNestedValue(data, sourceField);
    if (value !== undefined) {
      setNestedValue(mapped, targetField, value);
    }
  }

  return mapped;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
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
    ]).then((result: { total?: number }[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$api.keys" },
      { $match: { "api.keys.status": "active" } },
      { $count: "total" },
    ]).then((result: { total?: number }[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $project: { integrationCount: { $size: "$integrations" } } },
      { $group: { _id: null, total: { $sum: "$integrationCount" } } },
    ]).then((result: { total?: number }[]) => result[0]?.total || 0),
    AgencyConfig.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$integrations" },
      { $match: { "integrations.enabled": true } },
      { $count: "total" },
    ]).then((result: { total?: number }[]) => result[0]?.total || 0),
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
