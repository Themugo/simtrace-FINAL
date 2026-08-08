import { describe, it, expect } from "vitest";
import { AnalyticsEngineService } from "../services/analyticsEngine.service";

describe("Phase 16: Enterprise Data Lake, Analytics, BI & Predictive Decision Support", () => {
  it("fetches executive KPIs with operational, commercial, and platform metrics", () => {
    const kpis = AnalyticsEngineService.getExecutiveKPIs();
    expect(kpis.length).toBeGreaterThan(0);
    const mrrKpi = kpis.find((k) => k.category === "COMMERCIAL");
    expect(mrrKpi).toBeDefined();
    expect(mrrKpi?.currentValue).toBeGreaterThan(0);
  });

  it("retrieves predictive capacity and volume forecasts with confidence intervals", () => {
    const forecasts = AnalyticsEngineService.getPredictiveForecasts();
    expect(forecasts.length).toBeGreaterThan(0);
    expect(forecasts[0].confidenceIntervalPercent).toBeGreaterThanOrEqual(80);
    expect(forecasts[0].projectedValue30Days).toBeGreaterThan(0);
    expect(forecasts[0].disclaimer).toBeDefined();
  });

  it("handles AI BI Copilot natural language queries for commercial and operational insights", () => {
    const result = AnalyticsEngineService.queryAnalyticsCopilot("What drove MRR growth this quarter?");
    expect(result.summary).toContain("MRR");
    expect(result.keyInsights.length).toBeGreaterThan(0);
    expect(result.recommendedExecActions.length).toBeGreaterThan(0);
  });

  it("executes custom drag-and-drop report queries across warehouse dimensions and measures", () => {
    const report = AnalyticsEngineService.buildCustomReport({
      dimensions: ["Organization", "Priority"],
      measures: ["Active Cases", "Resolved Swaps"],
      dateRangeDays: 30,
    });

    expect(report.title).toBeDefined();
    expect(report.headers.length).toBeGreaterThan(0);
    expect(report.rows.length).toBeGreaterThan(0);
  });
});
