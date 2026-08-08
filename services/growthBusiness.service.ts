export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  userId: string;
  event: string;
  module: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CustomerHealthRecord {
  id: string;
  organizationId: string;
  organizationName: string;
  planTier: "COMMUNITY" | "PRO" | "ENTERPRISE" | "SOVEREIGN";
  healthScore: number; // 0 - 100
  onboardingProgress: number; // 0 - 100%
  activeUsersCount: number;
  monthlyInvestigationCount: number;
  churnRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expansionOpportunity: boolean;
  assignedCSM: string;
  lastActive: string;
}

export interface PartnerProfile {
  id: string;
  name: string;
  type: "TECHNOLOGY" | "TELECOM" | "GOVERNMENT" | "RESELLER" | "CONSULTING" | "INTEGRATION";
  country: string;
  referralCode: string;
  status: "APPLIED" | "ACTIVE" | "CERTIFIED" | "INACTIVE";
  activeDealsCount: number;
  revenueGenerated: number;
  joinedAt: string;
}

export interface CustomerFeedback {
  id: string;
  organizationId: string;
  type: "NPS" | "FEATURE_REQUEST" | "BUG_REPORT" | "SATISFACTION";
  rating?: number; // 1-10
  message: string;
  status: "NEW" | "IN_REVIEW" | "ADDRESSED";
  createdAt: string;
}

export interface BusinessIntelligenceMetrics {
  mrr: number;
  arr: number;
  totalCustomers: number;
  trialConversionsCount: number;
  conversionRatePercent: number;
  churnRatePercent: number;
  topUsedModules: { module: string; usageCount: number }[];
  geographicDistribution: { country: string; customerCount: number }[];
}

const ANALYTICS_STORE: AnalyticsEvent[] = [
  {
    id: "evt-001",
    organizationId: "org-police-01",
    userId: "user-inspect-doe",
    event: "INVESTIGATION_LAUNCHED",
    module: "FORENSICS",
    metadata: { caseId: "case-ke-2026-0891" },
    timestamp: "2026-08-02T10:00:00Z",
  },
  {
    id: "evt-002",
    organizationId: "org-police-01",
    userId: "user-inspect-doe",
    event: "SIM_SWAP_ANALYZED",
    module: "GRAPH_ANALYTICS",
    metadata: { nodesExplored: 42 },
    timestamp: "2026-08-02T10:30:00Z",
  },
];

const CUSTOMER_HEALTH_STORE: CustomerHealthRecord[] = [
  {
    id: "cs-001",
    organizationId: "org-police-01",
    organizationName: "Kenya National Police Forensics",
    planTier: "SOVEREIGN",
    healthScore: 94,
    onboardingProgress: 100,
    activeUsersCount: 38,
    monthlyInvestigationCount: 420,
    churnRisk: "LOW",
    expansionOpportunity: true,
    assignedCSM: "Sarah Jenkins (Enterprise Success)",
    lastActive: "2026-08-02T11:45:00Z",
  },
  {
    id: "cs-002",
    organizationId: "org-carrier-safaricom",
    organizationName: "Safaricom Anti-Fraud Division",
    planTier: "ENTERPRISE",
    healthScore: 88,
    onboardingProgress: 90,
    activeUsersCount: 15,
    monthlyInvestigationCount: 180,
    churnRisk: "LOW",
    expansionOpportunity: true,
    assignedCSM: "Sarah Jenkins (Enterprise Success)",
    lastActive: "2026-08-01T16:20:00Z",
  },
  {
    id: "cs-003",
    organizationId: "org-temp-trial",
    organizationName: "Regional Investigation Tech Ltd",
    planTier: "PRO",
    healthScore: 62,
    onboardingProgress: 40,
    activeUsersCount: 2,
    monthlyInvestigationCount: 8,
    churnRisk: "MEDIUM",
    expansionOpportunity: false,
    assignedCSM: "Growth Onboarding Bot",
    lastActive: "2026-07-28T09:10:00Z",
  },
];

const PARTNERS_STORE: PartnerProfile[] = [
  {
    id: "part-101",
    name: "Safaricom Telecom Enterprise",
    type: "TELECOM",
    country: "Kenya",
    referralCode: "PART-SAF-01",
    status: "CERTIFIED",
    activeDealsCount: 4,
    revenueGenerated: 120000,
    joinedAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "part-102",
    name: "Global Cyber Forensics Solutions",
    type: "CONSULTING",
    country: "United Kingdom",
    referralCode: "PART-GCF-UK",
    status: "ACTIVE",
    activeDealsCount: 2,
    revenueGenerated: 45000,
    joinedAt: "2026-03-15T00:00:00Z",
  },
];

const CUSTOMER_FEEDBACK_STORE: CustomerFeedback[] = [
  {
    id: "fb-01",
    organizationId: "org-police-01",
    type: "NPS",
    rating: 10,
    message: "SimTrace has drastically cut down our SIM swap investigation times from days to minutes.",
    status: "ADDRESSED",
    createdAt: "2026-07-25T14:00:00Z",
  },
  {
    id: "fb-02",
    organizationId: "org-carrier-safaricom",
    type: "FEATURE_REQUEST",
    message: "Requesting automated PDF export customization with officer badge watermark.",
    status: "IN_REVIEW",
    createdAt: "2026-08-01T09:30:00Z",
  },
];

export class GrowthBusinessService {
  public static logAnalyticsEvent(params: Omit<AnalyticsEvent, "id" | "timestamp">): AnalyticsEvent {
    const event: AnalyticsEvent = {
      ...params,
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    ANALYTICS_STORE.unshift(event);
    return event;
  }

  public static getAnalyticsEvents(): AnalyticsEvent[] {
    return ANALYTICS_STORE;
  }

  public static getCustomerHealthRecords(): CustomerHealthRecord[] {
    return CUSTOMER_HEALTH_STORE;
  }

  public static getPartners(): PartnerProfile[] {
    return PARTNERS_STORE;
  }

  public static registerPartner(params: Omit<PartnerProfile, "id" | "referralCode" | "status" | "activeDealsCount" | "revenueGenerated" | "joinedAt">): PartnerProfile {
    const partner: PartnerProfile = {
      ...params,
      id: `part-${Date.now()}`,
      referralCode: `PART-${params.name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      status: "ACTIVE",
      activeDealsCount: 0,
      revenueGenerated: 0,
      joinedAt: new Date().toISOString(),
    };
    PARTNERS_STORE.unshift(partner);
    return partner;
  }

  public static getCustomerFeedback(): CustomerFeedback[] {
    return CUSTOMER_FEEDBACK_STORE;
  }

  public static submitFeedback(params: Omit<CustomerFeedback, "id" | "status" | "createdAt">): CustomerFeedback {
    const feedback: CustomerFeedback = {
      ...params,
      id: `fb-${Date.now()}`,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    CUSTOMER_FEEDBACK_STORE.unshift(feedback);
    return feedback;
  }

  public static getBusinessIntelligenceMetrics(): BusinessIntelligenceMetrics {
    return {
      mrr: 48500,
      arr: 582000,
      totalCustomers: 24,
      trialConversionsCount: 18,
      conversionRatePercent: 75,
      churnRatePercent: 1.8,
      topUsedModules: [
        { module: "SIM Swap Graph Analytics", usageCount: 1420 },
        { module: "Cell Tower Triangulation", usageCount: 980 },
        { module: "AI Chain of Custody", usageCount: 850 },
        { module: "Multi-Carrier Gateway", usageCount: 610 },
      ],
      geographicDistribution: [
        { country: "Kenya", customerCount: 14 },
        { country: "United Kingdom", customerCount: 6 },
        { country: "United States", customerCount: 4 },
      ],
    };
  }

  public static calculateROI(investigatorsCount: number, monthlyCasesCount: number) {
    const hoursSavedPerCase = 6.5; // Average manual analysis hours saved
    const officerHourlyRateUSD = 45;
    const totalHoursSavedMonthly = monthlyCasesCount * hoursSavedPerCase;
    const monthlyCostSavingsUSD = totalHoursSavedMonthly * officerHourlyRateUSD;
    const annualSavingsUSD = monthlyCostSavingsUSD * 12;

    return {
      totalHoursSavedMonthly,
      monthlyCostSavingsUSD,
      annualSavingsUSD,
      estimatedEfficiencyBoostPercent: 320,
    };
  }
}
