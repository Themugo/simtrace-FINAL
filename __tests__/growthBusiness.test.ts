import { describe, it, expect } from "vitest";
import { GrowthBusinessService } from "../services/growthBusiness.service";

describe("Phase 13: Growth Engine, Customer Acquisition, Partner Ecosystem & Platform Intelligence", () => {
  it("tracks product analytics telemetry events", () => {
    const evt = GrowthBusinessService.logAnalyticsEvent({
      organizationId: "org-police-01",
      userId: "user-test-01",
      event: "DEMO_WALKTHROUGH_STARTED",
      module: "ONBOARDING",
    });

    expect(evt.id).toContain("evt-");
    const allEvts = GrowthBusinessService.getAnalyticsEvents();
    expect(allEvts.some((e) => e.id === evt.id)).toBe(true);
  });

  it("retrieves customer success health scores and identifies risk accounts", () => {
    const records = GrowthBusinessService.getCustomerHealthRecords();
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].healthScore).toBeGreaterThan(0);
    expect(records[0].onboardingProgress).toBeGreaterThanOrEqual(0);
  });

  it("manages partner profiles and referral codes", () => {
    const partner = GrowthBusinessService.registerPartner({
      name: "Acme Cyber Reseller",
      type: "RESELLER",
      country: "Kenya",
    });

    expect(partner.id).toContain("part-");
    expect(partner.referralCode).toContain("PART-ACM-");
    expect(partner.status).toBe("ACTIVE");
  });

  it("calculates accurate enterprise sales ROI and cost savings", () => {
    const roi = GrowthBusinessService.calculateROI(10, 50);
    expect(roi.totalHoursSavedMonthly).toBe(325);
    expect(roi.monthlyCostSavingsUSD).toBe(14625);
    expect(roi.annualSavingsUSD).toBe(175500);
  });

  it("fetches business intelligence revenue & conversion metrics", () => {
    const bi = GrowthBusinessService.getBusinessIntelligenceMetrics();
    expect(bi.mrr).toBeGreaterThan(0);
    expect(bi.arr).toBe(bi.mrr * 12);
    expect(bi.conversionRatePercent).toBe(75);
  });
});
