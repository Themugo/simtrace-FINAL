export interface FactInvestigation {
  caseId: string;
  organizationId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "ESCALATED";
  durationDays: number;
  evidenceItemsCount: number;
  linkedDevicesCount: number;
  closedAt?: string;
  createdAt: string;
}

export interface FactAlert {
  alertId: string;
  organizationId: string;
  type: "SIM_SWAP" | "GEOFENCE_BREACH" | "ANOMALOUS_TOWER" | "BEHAVIORAL_BIOMETRIC";
  riskScore: number;
  responseStatus: "PENDING" | "ACKNOWLEDGED" | "RESOLVED";
  resolutionTimeMinutes: number;
  timestamp: string;
}

export interface PlatformKPI {
  kpiKey: string;
  name: string;
  category: "OPERATIONAL" | "PLATFORM" | "COMMERCIAL";
  currentValue: number;
  targetValue: number;
  unit: string;
  trendPercent: number; // e.g. +12.5%
  status: "HEALTHY" | "WARNING" | "CRITICAL";
}

export interface PredictiveForecast {
  metricName: string;
  historicalBaseline: number;
  projectedValue30Days: number;
  projectedValue90Days: number;
  confidenceIntervalPercent: number;
  underlyingAssumptions: string[];
  disclaimer: string;
}

export interface CustomReportQuery {
  dimensions: string[];
  measures: string[];
  filterStatus?: string;
  dateRangeDays: number;
}

export interface CustomReportResult {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  generatedAt: string;
}

export class AnalyticsEngineService {
  /**
   * Get Executive Summary KPI Dashboard Data
   */
  public static getExecutiveKPIs(): PlatformKPI[] {
    return [
      {
        kpiKey: "active_investigations",
        name: "Active High-Priority Investigations",
        category: "OPERATIONAL",
        currentValue: 18,
        targetValue: 15,
        unit: "cases",
        trendPercent: -8.5,
        status: "HEALTHY",
      },
      {
        kpiKey: "avg_resolution_time",
        name: "Average Case Resolution Time",
        category: "OPERATIONAL",
        currentValue: 4.2,
        targetValue: 5.0,
        unit: "days",
        trendPercent: -15.2,
        status: "HEALTHY",
      },
      {
        kpiKey: "mrr_commercial",
        name: "Monthly Recurring Revenue (MRR)",
        category: "COMMERCIAL",
        currentValue: 128500,
        targetValue: 120000,
        unit: "USD",
        trendPercent: +18.4,
        status: "HEALTHY",
      },
      {
        kpiKey: "api_sla_availability",
        name: "Platform Telemetry API Uptime SLA",
        category: "PLATFORM",
        currentValue: 99.98,
        targetValue: 99.9,
        unit: "%",
        trendPercent: +0.02,
        status: "HEALTHY",
      },
    ];
  }

  /**
   * Get Predictive Capacity & Intelligence Workload Forecasts
   */
  public static getPredictiveForecasts(): PredictiveForecast[] {
    return [
      {
        metricName: "Monthly SIM Swap Alert Volume",
        historicalBaseline: 1420,
        projectedValue30Days: 1680,
        projectedValue90Days: 2150,
        confidenceIntervalPercent: 92,
        underlyingAssumptions: [
          "Expansion of Safaricom & Airtel 5G network telemetry ingestion.",
          "Seasonal uptick in mobile financial transfer activity during Q3.",
        ],
        disclaimer: "Forecasts are statistical projections based on historical time-series trends and subject to field operational variations.",
      },
      {
        metricName: "Storage & Evidence Vault Capacity Requirement",
        historicalBaseline: 4.2, // TB
        projectedValue30Days: 5.1,
        projectedValue90Days: 7.8,
        confidenceIntervalPercent: 95,
        underlyingAssumptions: [
          "Increased adoption of 4K drone video evidence and mobile forensic dumps.",
        ],
        disclaimer: "Projections assist with cloud storage quota planning.",
      },
    ];
  }

  /**
   * AI Business Intelligence Copilot Query Handler
   */
  public static queryAnalyticsCopilot(question: string): {
    summary: string;
    keyInsights: string[];
    recommendedExecActions: string[];
  } {
    const q = question.toLowerCase();

    if (q.includes("mrr") || q.includes("revenue") || q.includes("growth")) {
      return {
        summary: "SimTrace platform commercial MRR grew by 18.4% month-over-month to $128,500, driven by National Police and Regional Telecom tier upgrades.",
        keyInsights: [
          "Enterprise law enforcement contract renewals achieved 100% net retention.",
          "API usage overage from Telecom SIM Swap monitoring contributed +$12,400 in elastic billing.",
        ],
        recommendedExecActions: [
          "Allocate additional cloud infrastructure quota for Q4 telecom ingestion scale.",
        ],
      };
    }

    return {
      summary: "Across all active law enforcement tenants, case resolution speed improved by 15.2% following the deployment of Phase 14 AI Copilot and Phase 15 GEOINT route reconstruction.",
      keyInsights: [
        "Average time to identify suspect SIM swap hubs decreased from 14 hours to 45 minutes.",
        "Evidence Vault processing throughput reached 98.4% SLA compliance.",
      ],
      recommendedExecActions: [
        "Expand GEOINT cell tower handover logging to secondary regional carriers.",
        "Schedule quarterly executive cybersecurity compliance audit.",
      ],
    };
  }

  /**
   * Execute Custom Drag-and-Drop Report Query
   */
  public static buildCustomReport(query: CustomReportQuery): CustomReportResult {
    return {
      title: "Custom Executive Intelligence Report",
      headers: ["Organization / Unit", "Active Cases", "Resolved SIM Swaps", "Risk Score Index", "SLA Status"],
      rows: [
        ["Kenya National Police Anti-Cybercrime", 12, 142, "88 / 100 (HIGH)", "COMPLIANT"],
        ["Safaricom Telecom Fraud Ops", 5, 389, "92 / 100 (CRITICAL)", "COMPLIANT"],
        ["Airtel Kenya Security Taskforce", 3, 98, "65 / 100 (MEDIUM)", "COMPLIANT"],
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
