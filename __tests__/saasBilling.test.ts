import { describe, it, expect } from "vitest";
import { SaaSManagementService } from "../services/saas.service";
import { BillingService } from "../services/billing.service";

describe("Phase 8: Multi-Tenant SaaS, Billing & Subscription Platform", () => {
  it("retrieves available subscription plans and checks plan tiers", () => {
    const plans = SaaSManagementService.getPlans();
    expect(plans.length).toBeGreaterThanOrEqual(4);
    const enterprise = plans.find((p) => p.tier === "ENTERPRISE");
    expect(enterprise).toBeDefined();
    expect(enterprise?.limits.maxDevices).toBe(25000);
  });

  it("manages tenant usage records and metering", () => {
    const orgId = "org-police-01";
    const initialUsage = SaaSManagementService.getUsage(orgId);
    expect(initialUsage.length).toBeGreaterThan(0);

    const updated = SaaSManagementService.recordUsage(orgId, "SEARCHES", 50);
    expect(updated.quantity).toBeGreaterThanOrEqual(12500);
  });

  it("provisions API keys with permissions and prefix masking", () => {
    const orgId = "org-police-01";
    const { apiKey, rawSecret } = SaaSManagementService.createApiKey(orgId, "Fraud Alert Webhook Key", ["WRITE_ALERTS"]);

    expect(apiKey.name).toBe("Fraud Alert Webhook Key");
    expect(rawSecret).toContain("st_live_");
    expect(apiKey.permissions).toContain("WRITE_ALERTS");
  });

  it("creates invoices and processes payments across gateways (Stripe & M-Pesa)", async () => {
    const orgId = "org-police-01";
    const invoice = BillingService.createInvoice({
      organizationId: orgId,
      subscriptionId: "sub-101",
      amount: 2499,
      gateway: "MPESA",
      lineItems: [{ description: "SimTrace Professional Monthly Renewal", amount: 2499 }],
    });

    expect(invoice.status).toBe("PENDING");

    const result = await BillingService.processPayment(invoice.id, "MPESA", { mpesaPhone: "+254700000000" });
    expect(result.success).toBe(true);
    expect(result.invoice.status).toBe("PAID");
    expect(result.transactionId).toContain("tx_mpesa_");
  });
});
