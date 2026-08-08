export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "SUSPENDED";
export type BillingCycle = "MONTHLY" | "ANNUAL";
export type PlanTier = "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM_GOVERNMENT";

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  limits: {
    maxDevices: number;
    maxUsers: number;
    maxReportsPerMonth: number;
    maxApiCallsPerMonth: number;
    storageGb: number;
  };
  features: string[];
  status: "ACTIVE" | "ARCHIVED";
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  renewalDate: string;
  paymentProvider: "STRIPE" | "MPESA" | "BANK_WIRE" | "ENTERPRISE_INVOICE";
  externalSubscriptionId: string;
}

export interface OrganizationSettings {
  id: string;
  organizationId: string;
  timezone: string;
  country: string;
  industry: string;
  securityLevel: "STANDARD" | "ENHANCED" | "HIGH_ASSURANCE" | "SOVEREIGN";
  dataRetentionPeriodDays: number;
  mfaEnforced: boolean;
  createdAt: string;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  metric: "SEARCHES" | "REPORTS" | "API_CALLS" | "TRACKED_DEVICES" | "STORAGE_MB";
  quantity: number;
  period: string; // e.g. "2026-08"
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface CustomerTicket {
  id: string;
  organizationId: string;
  createdBy: string;
  subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  assignedTo?: string;
  createdAt: string;
}

// Global In-Memory Commercial Store
const PLANS: SubscriptionPlan[] = [
  {
    id: "plan-starter",
    name: "Starter Intelligence",
    tier: "STARTER",
    description: "Ideal for small security teams and local investigative units.",
    priceMonthly: 499,
    priceAnnual: 4990,
    limits: { maxDevices: 100, maxUsers: 5, maxReportsPerMonth: 50, maxApiCallsPerMonth: 1000, storageGb: 10 },
    features: ["Basic Searches", "Device Telemetry", "Standard Reports", "Email Support"],
    status: "ACTIVE",
  },
  {
    id: "plan-pro",
    name: "Professional Command",
    tier: "PROFESSIONAL",
    description: "Full AI risk scoring, graph relationship explorer, and evidence audit tools.",
    priceMonthly: 2499,
    priceAnnual: 24990,
    limits: { maxDevices: 2500, maxUsers: 25, maxReportsPerMonth: 500, maxApiCallsPerMonth: 50000, storageGb: 200 },
    features: ["AI Risk Engine", "Graph Relationship Explorer", "Evidence Chain of Custody", "24/7 Priority Support", "API Access"],
    status: "ACTIVE",
  },
  {
    id: "plan-enterprise",
    name: "Enterprise Global",
    tier: "ENTERPRISE",
    description: "Unlimited scale, dedicated account manager, custom integrations, and SLA guarantees.",
    priceMonthly: 9999,
    priceAnnual: 99990,
    limits: { maxDevices: 25000, maxUsers: 250, maxReportsPerMonth: 5000, maxApiCallsPerMonth: 1000000, storageGb: 2000 },
    features: ["Unlimited Intelligence Graph", "Custom ML Fraud Models", "Dedicated Account Manager", "Multi-Org Data Isolation", "Custom SLAs"],
    status: "ACTIVE",
  },
  {
    id: "plan-gov",
    name: "Sovereign Government",
    tier: "CUSTOM_GOVERNMENT",
    description: "Private sovereign Cloud Run / on-premise deployment for national security and law enforcement.",
    priceMonthly: 25000,
    priceAnnual: 250000,
    limits: { maxDevices: 1000000, maxUsers: 1000, maxReportsPerMonth: 100000, maxApiCallsPerMonth: 10000000, storageGb: 10000 },
    features: ["Sovereign Data Storage", "Air-Gapped Deployment", "CJIS & ISO 27001 Certified", "Custom Encryption Keys"],
    status: "ACTIVE",
  },
];

const ORG_SUBSCRIPTIONS: OrganizationSubscription[] = [
  {
    id: "sub-101",
    organizationId: "org-police-01",
    planId: "plan-enterprise",
    status: "ACTIVE",
    billingCycle: "ANNUAL",
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    renewalDate: "2026-12-31T23:59:59Z",
    paymentProvider: "ENTERPRISE_INVOICE",
    externalSubscriptionId: "INV-2026-88910",
  },
];

const ORG_SETTINGS: OrganizationSettings[] = [
  {
    id: "set-101",
    organizationId: "org-police-01",
    timezone: "Africa/Nairobi",
    country: "Kenya",
    industry: "Law Enforcement & National Security",
    securityLevel: "HIGH_ASSURANCE",
    dataRetentionPeriodDays: 3650,
    mfaEnforced: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const USAGE_RECORDS: UsageRecord[] = [
  { id: "u-1", organizationId: "org-police-01", metric: "TRACKED_DEVICES", quantity: 384, period: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "u-2", organizationId: "org-police-01", metric: "SEARCHES", quantity: 12450, period: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "u-3", organizationId: "org-police-01", metric: "REPORTS", quantity: 42, period: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
  { id: "u-4", organizationId: "org-police-01", metric: "API_CALLS", quantity: 89120, period: "2026-08", createdAt: "2026-08-01T00:00:00Z" },
];

const API_KEYS: ApiKeyRecord[] = [
  {
    id: "key-1",
    organizationId: "org-police-01",
    name: "NPS Telemetry Ingest Key",
    keyPrefix: "st_live_89a1",
    keyHash: "d8e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
    permissions: ["READ_DEVICES", "WRITE_EVIDENCE", "QUERY_GRAPH"],
    lastUsedAt: "2026-08-01T02:00:00Z",
    createdAt: "2026-01-15T00:00:00Z",
  },
];

const TICKETS: CustomerTicket[] = [
  {
    id: "tkt-1",
    organizationId: "org-police-01",
    createdBy: "Inspector Jane Doe",
    subject: "Requesting custom ML feature weights for SIM swap alerts",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTo: "SimTrace Support Engineer",
    createdAt: "2026-07-30T10:00:00Z",
  },
];

export class SaaSManagementService {
  public static getPlans(): SubscriptionPlan[] {
    return PLANS;
  }

  public static getSubscription(organizationId: string): OrganizationSubscription | undefined {
    return ORG_SUBSCRIPTIONS.find((s) => s.organizationId === organizationId);
  }

  public static getOrgSettings(organizationId: string): OrganizationSettings | undefined {
    return ORG_SETTINGS.find((s) => s.organizationId === organizationId);
  }

  public static getUsage(organizationId: string, period: string = "2026-08"): UsageRecord[] {
    return USAGE_RECORDS.filter((u) => u.organizationId === organizationId && u.period === period);
  }

  public static recordUsage(organizationId: string, metric: UsageRecord["metric"], amount: number): UsageRecord {
    const period = new Date().toISOString().substring(0, 7);
    const existing = USAGE_RECORDS.find((u) => u.organizationId === organizationId && u.metric === metric && u.period === period);
    if (existing) {
      existing.quantity += amount;
      return existing;
    }

    const newRecord: UsageRecord = {
      id: `u-${Date.now()}`,
      organizationId,
      metric,
      quantity: amount,
      period,
      createdAt: new Date().toISOString(),
    };
    USAGE_RECORDS.push(newRecord);
    return newRecord;
  }

  public static getApiKeys(organizationId: string): ApiKeyRecord[] {
    return API_KEYS.filter((k) => k.organizationId === organizationId);
  }

  public static createApiKey(organizationId: string, name: string, permissions: string[]): { apiKey: ApiKeyRecord; rawSecret: string } {
    const rawSecret = `st_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      organizationId,
      name,
      keyPrefix: rawSecret.substring(0, 12),
      keyHash: `hash_${Date.now()}`,
      permissions,
      createdAt: new Date().toISOString(),
    };
    API_KEYS.push(newKey);
    return { apiKey: newKey, rawSecret };
  }

  public static getTickets(organizationId: string): CustomerTicket[] {
    return TICKETS.filter((t) => t.organizationId === organizationId);
  }

  public static createTicket(organizationId: string, createdBy: string, subject: string, priority: CustomerTicket["priority"]): CustomerTicket {
    const tkt: CustomerTicket = {
      id: `tkt-${Date.now()}`,
      organizationId,
      createdBy,
      subject,
      priority,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    TICKETS.push(tkt);
    return tkt;
  }

  public static updateSubscription(organizationId: string, planId: string, cycle: BillingCycle, paymentProvider: OrganizationSubscription["paymentProvider"]): OrganizationSubscription {
    let sub = ORG_SUBSCRIPTIONS.find((s) => s.organizationId === organizationId);
    if (sub) {
      sub.planId = planId;
      sub.billingCycle = cycle;
      sub.paymentProvider = paymentProvider;
      sub.status = "ACTIVE";
    } else {
      sub = {
        id: `sub-${Date.now()}`,
        organizationId,
        planId,
        status: "ACTIVE",
        billingCycle: cycle,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        renewalDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentProvider,
        externalSubscriptionId: `EXT-${Date.now()}`,
      };
      ORG_SUBSCRIPTIONS.push(sub);
    }
    return sub;
  }
}
