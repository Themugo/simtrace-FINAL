// services/whiteLabel.js - White Label Solutions Infrastructure
// Multi-tenant white-label instances for partners

import crypto from "crypto";
import { WhiteLabelInstance, User, Partner, Device, Subscription } from "../db/index.js";

// ── Instance ID Generation ─────────────────────────────────────────────────────────
function generateInstanceId() {
  const prefix = "wl";
  const random = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

function generateApiKey() {
  return `wl_${crypto.randomBytes(32).toString("hex")}`;
}

// ── Create White Label Instance ─────────────────────────────────────────────────────
export async function createWhiteLabelInstance(data) {
  const {
    name,
    owner,
    partner,
    branding = {},
    config = {},
    plan = "starter",
    billingCycle = "monthly",
  } = data;

  const user = await User.findById(owner);
  if (!user) throw new Error("User not found");

  const partnerOrg = partner ? await Partner.findById(partner) : null;

  const instanceId = generateInstanceId();
  const apiKey = generateApiKey();

  // Set default branding
  const defaultBranding = {
    logo: null,
    primaryColor: "#0ea5e9",
    secondaryColor: "#6366f1",
    domain: `${instanceId.toLowerCase()}.simtrace.site`,
    customDomain: null,
    companyName: name,
    supportEmail: `support@${instanceId.toLowerCase()}.simtrace.site`,
    supportPhone: null,
  };

  // Set default config
  const defaultConfig = {
    enabledFeatures: ["imei_check", "device_tracking", "basic_alerts"],
    disabledFeatures: [],
    customPricing: false,
    customIntegrations: [],
    apiRateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
    },
  };

  // Set pricing based on plan
  const pricing = {
    starter: { monthlyFee: 99, revenueShare: 10 },
    professional: { monthlyFee: 299, revenueShare: 15 },
    enterprise: { monthlyFee: 999, revenueShare: 20 },
  };

  const instance = await WhiteLabelInstance.create({
    instanceId,
    name,
    owner,
    partner,
    branding: { ...defaultBranding, ...branding },
    config: { ...defaultConfig, ...config },
    status: "pending",
    metrics: {
      totalUsers: 0,
      totalDevices: 0,
      totalApiCalls: 0,
      monthlyRevenue: 0,
    },
    plan,
    billingCycle,
    monthlyFee: pricing[plan].monthlyFee,
    revenueShare: pricing[plan].revenueShare,
    apiKey,
    webhookUrl: null,
    webhookSecret: crypto.randomBytes(32).toString("hex"),
  });

  return instance;
}

// ── Update White Label Instance ─────────────────────────────────────────────────────
export async function updateWhiteLabelInstance(instanceId, updates) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  const allowedUpdates = [
    "name",
    "branding",
    "config",
    "plan",
    "billingCycle",
    "webhookUrl",
  ];

  const filteredUpdates = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  // Update pricing if plan changed
  if (updates.plan) {
    const pricing = {
      starter: { monthlyFee: 99, revenueShare: 10 },
      professional: { monthlyFee: 299, revenueShare: 15 },
      enterprise: { monthlyFee: 999, revenueShare: 20 },
    };
    filteredUpdates.monthlyFee = pricing[updates.plan].monthlyFee;
    filteredUpdates.revenueShare = pricing[updates.plan].revenueShare;
  }

  Object.assign(instance, filteredUpdates);
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

// ── Instance Status Management ─────────────────────────────────────────────────────
export async function activateInstance(instanceId) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.status = "active";
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

export async function suspendInstance(instanceId, reason) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.status = "suspended";
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

export async function terminateInstance(instanceId) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.status = "terminated";
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

// ── API Key Management ─────────────────────────────────────────────────────────────
export async function regenerateApiKey(instanceId) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  const newApiKey = generateApiKey();
  instance.apiKey = newApiKey;
  instance.updatedAt = new Date();
  await instance.save();

  return { apiKey: newApiKey, instanceId };
}

export async function validateApiKey(apiKey) {
  const instance = await WhiteLabelInstance.findOne({ apiKey });
  if (!instance) return null;

  if (instance.status !== "active") {
    throw new Error("Instance is not active");
  }

  return instance;
}

// ── Metrics Tracking ─────────────────────────────────────────────────────────────
export async function updateInstanceMetrics(instanceId, metrics) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  if (metrics.users !== undefined) instance.metrics.totalUsers = metrics.users;
  if (metrics.devices !== undefined) instance.metrics.totalDevices = metrics.devices;
  if (metrics.apiCalls !== undefined) instance.metrics.totalApiCalls += metrics.apiCalls;
  if (metrics.revenue !== undefined) instance.metrics.monthlyRevenue += metrics.revenue;

  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

// ── Query Instances ─────────────────────────────────────────────────────────────
export async function getWhiteLabelInstance(instanceId) {
  const instance = await WhiteLabelInstance.findOne({ instanceId })
    .populate("owner", "name email")
    .populate("partner");

  return instance;
}

export async function getInstancesByOwner(ownerId) {
  const instances = await WhiteLabelInstance.find({ owner: ownerId })
    .populate("partner")
    .sort({ createdAt: -1 });

  return instances;
}

export async function getInstancesByPartner(partnerId) {
  const instances = await WhiteLabelInstance.find({ partner: partnerId })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  return instances;
}

export async function getActiveInstances() {
  const instances = await WhiteLabelInstance.find({ status: "active" })
    .populate("owner", "name email")
    .sort({ metrics: { monthlyRevenue: -1 } });

  return instances;
}

export async function getPendingInstances() {
  const instances = await WhiteLabelInstance.find({ status: "pending" })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  return instances;
}

// ── Instance Configuration Helpers ───────────────────────────────────────────────
export async function enableFeature(instanceId, feature) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  if (!instance.config.enabledFeatures.includes(feature)) {
    instance.config.enabledFeatures.push(feature);
  }

  instance.config.disabledFeatures = instance.config.disabledFeatures.filter(f => f !== feature);
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

export async function disableFeature(instanceId, feature) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.config.enabledFeatures = instance.config.enabledFeatures.filter(f => f !== feature);

  if (!instance.config.disabledFeatures.includes(feature)) {
    instance.config.disabledFeatures.push(feature);
  }

  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

export async function updateRateLimits(instanceId, limits) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.config.apiRateLimits = {
    ...instance.config.apiRateLimits,
    ...limits,
  };
  instance.updatedAt = new Date();
  await instance.save();

  return instance;
}

// ── Revenue Calculation ─────────────────────────────────────────────────────────
export async function calculateInstanceRevenue(instanceId, period = "month") {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  const now = new Date();
  const startDate = new Date();

  if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // Calculate revenue from subscriptions
  const subscriptions = await Subscription.find({
    createdAt: { $gte: startDate },
  });

  let subscriptionRevenue = 0;
  for (const sub of subscriptions) {
    const user = await User.findById(sub.user);
    if (user && user.apiKey) {
      // Check if user belongs to this instance
      // This is a simplified check - in production, you'd have proper user-instance mapping
      subscriptionRevenue += 10; // Placeholder calculation
    }
  }

  // Calculate platform fee (revenue share)
  const platformFee = subscriptionRevenue * (instance.revenueShare / 100);
  const instanceRevenue = subscriptionRevenue - platformFee;

  return {
    period,
    startDate,
    endDate: now,
    totalRevenue: subscriptionRevenue,
    platformFee,
    instanceRevenue,
    revenueShare: instance.revenueShare,
  };
}

// ── White Label Statistics ───────────────────────────────────────────────────────
export async function getWhiteLabelStatistics() {
  const [
    totalInstances,
    activeInstances,
    pendingInstances,
    suspendedInstances,
    terminatedInstances,
    instancesByPlan,
    totalRevenue,
  ] = await Promise.all([
    WhiteLabelInstance.countDocuments(),
    WhiteLabelInstance.countDocuments({ status: "active" }),
    WhiteLabelInstance.countDocuments({ status: "pending" }),
    WhiteLabelInstance.countDocuments({ status: "suspended" }),
    WhiteLabelInstance.countDocuments({ status: "terminated" }),
    WhiteLabelInstance.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]),
    WhiteLabelInstance.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, totalRevenue: { $sum: "$metrics.monthlyRevenue" } } },
    ]),
  ]);

  const totalUsers = await WhiteLabelInstance.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: null, totalUsers: { $sum: "$metrics.totalUsers" } } },
  ]);

  const totalDevices = await WhiteLabelInstance.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: null, totalDevices: { $sum: "$metrics.totalDevices" } } },
  ]);

  return {
    totalInstances,
    activeInstances,
    pendingInstances,
    suspendedInstances,
    terminatedInstances,
    instancesByPlan: instancesByPlan.map(i => ({
      plan: i._id,
      count: i.count,
    })),
    totalRevenue: totalRevenue[0]?.totalRevenue || 0,
    totalUsers: totalUsers[0]?.totalUsers || 0,
    totalDevices: totalDevices[0]?.totalDevices || 0,
    avgRevenuePerInstance: activeInstances > 0 
      ? (totalRevenue[0]?.totalRevenue || 0) / activeInstances 
      : 0,
  };
}

// ── Webhook Management ───────────────────────────────────────────────────────────
export async function updateWebhook(instanceId, webhookUrl) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  instance.webhookUrl = webhookUrl;
  instance.webhookSecret = crypto.randomBytes(32).toString("hex");
  instance.updatedAt = new Date();
  await instance.save();

  return {
    webhookUrl: instance.webhookUrl,
    webhookSecret: instance.webhookSecret,
  };
}

export async function testWebhook(instanceId) {
  const instance = await WhiteLabelInstance.findOne({ instanceId });
  if (!instance) throw new Error("White label instance not found");

  if (!instance.webhookUrl) {
    throw new Error("No webhook URL configured");
  }

  const testPayload = {
    event: "test.ping",
    instanceId: instance.instanceId,
    timestamp: new Date().toISOString(),
    data: {
      message: "This is a test webhook from SimTrace Central Shield",
    },
  };

  const signature = crypto
    .createHmac("sha256", instance.webhookSecret)
    .update(JSON.stringify(testPayload))
    .digest("hex");

  try {
    const response = await fetch(instance.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SimTrace-Signature": `sha256=${signature}`,
        "X-SimTrace-Instance": instance.instanceId,
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? "Webhook delivered successfully" : `Server returned ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// ── Instance Clone/Template ─────────────────────────────────────────────────────
export async function createInstanceFromTemplate(templateInstanceId, newOwner, newName) {
  const template = await WhiteLabelInstance.findOne({ instanceId: templateInstanceId });
  if (!template) throw new Error("Template instance not found");

  const newInstance = await createWhiteLabelInstance({
    name: newName,
    owner: newOwner,
    partner: template.partner,
    branding: template.branding,
    config: template.config,
    plan: template.plan,
    billingCycle: template.billingCycle,
  });

  return newInstance;
}
