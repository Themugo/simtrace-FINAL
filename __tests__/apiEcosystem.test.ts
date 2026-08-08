import { describe, it, expect } from "vitest";
import { ApiGatewayService } from "../services/apiGateway.service";
import { WebhookService } from "../services/webhook.service";
import { IntegrationService } from "../services/integrations.service";

describe("Phase 10: API Ecosystem, Developer Portal, Webhooks & Marketplace", () => {
  it("provisions API keys with targeted permission scopes and returns secret once", () => {
    const orgId = "org-police-01";
    const scopes = ["devices.track", "cases.read"];
    const { apiKey, secretKey } = ApiGatewayService.createApiKey(orgId, "Field Operations Key", scopes);

    expect(apiKey.name).toBe("Field Operations Key");
    expect(secretKey).toContain("st_live_");
    expect(apiKey.permissions).toEqual(scopes);

    const keys = ApiGatewayService.getApiKeys(orgId);
    expect(keys.some((k) => k.id === apiKey.id)).toBe(true);
  });

  it("calculates API usage analytics and records request logs", () => {
    const orgId = "org-police-01";
    ApiGatewayService.logApiRequest({
      organizationId: orgId,
      apiKeyId: "key-101",
      endpoint: "/api/v1/devices/search",
      method: "GET",
      statusCode: 200,
      responseTimeMs: 35,
    });

    const analytics = ApiGatewayService.getUsageAnalytics(orgId);
    expect(analytics.totalRequests).toBeGreaterThan(0);
    expect(analytics.avgResponseTimeMs).toBeGreaterThan(0);
  });

  it("configures webhooks and triggers event delivery with signatures", () => {
    const orgId = "org-police-01";
    const sub = WebhookService.createWebhook(orgId, "https://partner.com/webhook", ["DEVICE_ALERT"]);

    expect(sub.status).toBe("ACTIVE");
    expect(sub.secret).toContain("whsec_live_");

    const deliveries = WebhookService.triggerEvent(orgId, "DEVICE_ALERT", { imei: "123456789012345", risk: 95 });
    expect(deliveries.length).toBeGreaterThan(0);
    expect(deliveries[0].status).toBe("SUCCESS");
    expect(deliveries[0].signature).toBeDefined();
  });

  it("manages third-party connectors and bulk data imports with deduplication", () => {
    const orgId = "org-police-01";
    const integrations = IntegrationService.getIntegrations(orgId);
    expect(integrations.length).toBeGreaterThan(0);

    const importJob = IntegrationService.runBulkImport(orgId, "DEVICE_TELEMETRY", "tower_dump.csv", 10000);
    expect(importJob.recordsProcessed).toBe(10000);
    expect(importJob.duplicateCount).toBe(200);
    expect(importJob.status).toBe("COMPLETED");

    const apps = IntegrationService.getMarketplaceApps();
    expect(apps.length).toBeGreaterThanOrEqual(4);
  });
});
