// routes/enterpriseAdvanced.ts - API endpoints for Phase 6 enterprise services
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { multiTenantService } from "../services/enterprise/multiTenant.js";
import { ssoIntegrationService } from "../services/enterprise/ssoIntegration.js";
import { rbacService } from "../services/enterprise/rbac.js";
import { apiRateLimitingService } from "../services/enterprise/apiRateLimiting.js";
import { enterpriseReportingService } from "../services/enterprise/enterpriseReporting.js";
import { whiteLabelService } from "../services/enterprise/whiteLabel.js";
import { slaMonitoringService } from "../services/enterprise/slaMonitoring.js";

const router = Router();

// ── Multi-Tenant Architecture ─────────────────────────────────────────────────────

router.post("/tenants", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      slug: z.string(),
      domain: z.string(),
      plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional()
    });
    const data = schema.parse(req.body);

    const tenant = multiTenantService.createTenant(data.name, data.slug, data.domain, data.plan || 'free');
    res.json({ tenant });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/tenants", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const tenants = multiTenantService.getAllTenants();
    res.json({ tenants });
  } catch (err) {
    next(err);
  }
});

router.get("/tenants/:tenantId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const tenant = multiTenantService.getTenant(tenantId as string);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json({ tenant });
  } catch (err) {
    next(err);
  }
});

router.put("/tenants/:tenantId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    const tenant = multiTenantService.updateTenant(tenantId as string, updates);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json({ tenant });
  } catch (err) {
    next(err);
  }
});

router.delete("/tenants/:tenantId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const success = multiTenantService.deleteTenant(tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/tenants/:tenantId/users", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const schema = z.object({
      userId: z.string(),
      email: z.string(),
      role: z.enum(['owner', 'admin', 'user', 'viewer']).optional()
    });
    const data = schema.parse(req.body);

    const user = multiTenantService.addUserToTenant(data.userId, tenantId as string, data.email, data.role || 'user');
    res.json({ user });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.delete("/tenants/:tenantId/users/:userId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId, userId } = req.params;
    const success = multiTenantService.removeUserFromTenant(userId as string, tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: "User not found in tenant" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/tenants/:tenantId/quota", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const quota = multiTenantService.getQuota(tenantId as string);
    
    if (!quota) {
      return res.status(404).json({ error: "Quota not found" });
    }

    res.json({ quota });
  } catch (err) {
    next(err);
  }
});

router.get("/tenants/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = multiTenantService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── SSO Integration ────────────────────────────────────────────────────────────────

router.post("/sso/providers", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      providerType: z.enum(['saml', 'oauth2', 'oidc']),
      name: z.string(),
      entityId: z.string().optional(),
      ssoUrl: z.string().optional(),
      sloUrl: z.string().optional(),
      certificate: z.string().optional(),
      authorizationUrl: z.string().optional(),
      tokenUrl: z.string().optional(),
      userInfoUrl: z.string().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      scopes: z.array(z.string()).optional()
    });
    const data = schema.parse(req.body);

    const provider = ssoIntegrationService.registerProvider(data);
    res.json({ provider });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/sso/providers/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const providers = ssoIntegrationService.getProvidersForTenant(tenantId as string);
    res.json({ providers });
  } catch (err) {
    next(err);
  }
});

router.put("/sso/providers/:providerId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const updates = req.body;

    const provider = ssoIntegrationService.updateProvider(providerId as string, updates);
    
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({ provider });
  } catch (err) {
    next(err);
  }
});

router.delete("/sso/providers/:providerId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const success = ssoIntegrationService.deleteProvider(providerId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/sso/saml/:providerId/url", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const { relayState } = req.body;

    const url = ssoIntegrationService.generateSAMLSSOUrl(providerId as string, relayState);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

router.post("/sso/oauth2/:providerId/url", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const schema = z.object({
      redirectUri: z.string(),
      state: z.string().optional()
    });
    const data = schema.parse(req.body);

    const url = ssoIntegrationService.generateOAuth2Url(providerId as string, data.redirectUri, data.state);
    res.json({ url });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.post("/sso/oauth2/:providerId/token", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const schema = z.object({
      code: z.string(),
      redirectUri: z.string()
    });
    const data = schema.parse(req.body);

    const tokens = await ssoIntegrationService.exchangeOAuth2Code(providerId as string, data.code, data.redirectUri);
    res.json({ tokens });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/sso/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = ssoIntegrationService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── RBAC ─────────────────────────────────────────────────────────────────────────

router.post("/rbac/roles", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      name: z.string(),
      description: z.string(),
      permissions: z.array(z.string())
    });
    const data = schema.parse(req.body);

    const role = rbacService.createRole(data.tenantId, data.name, data.description, data.permissions);
    res.json({ role });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/rbac/roles/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const roles = rbacService.getRolesForTenant(tenantId as string);
    res.json({ roles });
  } catch (err) {
    next(err);
  }
});

router.put("/rbac/roles/:roleId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { roleId } = req.params;
    const updates = req.body;

    const role = rbacService.updateRole(roleId as string, updates);
    
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({ role });
  } catch (err) {
    next(err);
  }
});

router.delete("/rbac/roles/:roleId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { roleId } = req.params;
    const success = rbacService.deleteRole(roleId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Role not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/rbac/assign", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      tenantId: z.string(),
      roleId: z.string()
    });
    const data = schema.parse(req.body);

    const userRole = rbacService.assignRole(data.userId, data.tenantId, data.roleId, req.user!.id);
    res.json({ userRole });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.delete("/rbac/assign/:userId/:tenantId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId } = req.params;
    const success = rbacService.removeRole(userId as string, tenantId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Role assignment not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/rbac/permissions", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = rbacService.getAllPermissions();
    res.json({ permissions });
  } catch (err) {
    next(err);
  }
});

router.get("/rbac/check/:userId/:tenantId/:permissionId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { userId, tenantId, permissionId } = req.params;
    const hasPermission = rbacService.hasPermission(userId as string, tenantId as string, permissionId as string);
    res.json({ hasPermission });
  } catch (err) {
    next(err);
  }
});

router.get("/rbac/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = rbacService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── API Rate Limiting ─────────────────────────────────────────────────────────────

router.post("/rate-limits/rules", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      endpoint: z.string(),
      method: z.string(),
      requestsPerMinute: z.number(),
      requestsPerHour: z.number(),
      requestsPerDay: z.number(),
      burstLimit: z.number().optional()
    });
    const data = schema.parse(req.body);

    const rule = apiRateLimitingService.createRule(
      data.tenantId,
      data.endpoint,
      data.method,
      data.requestsPerMinute,
      data.requestsPerHour,
      data.requestsPerDay,
      data.burstLimit
    );
    res.json({ rule });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/rate-limits/rules/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const rules = apiRateLimitingService.getRulesForTenant(tenantId as string);
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

router.put("/rate-limits/rules/:ruleId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = apiRateLimitingService.updateRule(ruleId as string, updates);
    
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({ rule });
  } catch (err) {
    next(err);
  }
});

router.delete("/rate-limits/rules/:ruleId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const success = apiRateLimitingService.deleteRule(ruleId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/rate-limits/usage/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const usage = apiRateLimitingService.getUsageForTenant(tenantId as string);
    res.json({ usage });
  } catch (err) {
    next(err);
  }
});

router.get("/rate-limits/violations/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const violations = apiRateLimitingService.getViolationsForTenant(tenantId as string, limit);
    res.json({ violations });
  } catch (err) {
    next(err);
  }
});

router.post("/rate-limits/reset/:tenantId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const reset = apiRateLimitingService.resetUsage(tenantId as string);
    res.json({ reset });
  } catch (err) {
    next(err);
  }
});

router.get("/rate-limits/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = apiRateLimitingService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Enterprise Reporting ─────────────────────────────────────────────────────────

router.post("/reports", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      name: z.string(),
      description: z.string(),
      reportType: z.enum(['device_summary', 'usage_analytics', 'security_audit', 'cost_analysis', 'performance', 'custom']),
      filters: z.any(),
      format: z.enum(['pdf', 'excel', 'csv', 'json']),
      schedule: z.object({
        frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        time: z.string()
      }).optional()
    });
    const data = schema.parse(req.body);

    const report = enterpriseReportingService.createReport(
      data.tenantId,
      data.name,
      data.description,
      data.reportType,
      data.filters,
      data.format,
      req.user!.id,
      data.schedule
    );
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/reports/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const reports = enterpriseReportingService.getReportsForTenant(tenantId as string);
    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

router.put("/reports/:reportId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;

    const report = enterpriseReportingService.updateReport(reportId as string, updates);
    
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ report });
  } catch (err) {
    next(err);
  }
});

router.delete("/reports/:reportId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const success = enterpriseReportingService.deleteReport(reportId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/reports/:reportId/generate", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const generation = await enterpriseReportingService.generateReport(reportId as string);
    res.json({ generation });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/:reportId/generations", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const generations = enterpriseReportingService.getReportGenerations(reportId as string, limit);
    res.json({ generations });
  } catch (err) {
    next(err);
  }
});

router.post("/reports/templates", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      name: z.string(),
      description: z.string(),
      layout: z.object({
        sections: z.array(z.any())
      })
    });
    const data = schema.parse(req.body);

    const template = enterpriseReportingService.createTemplate(data.tenantId, data.name, data.description, data.layout);
    res.json({ template });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/reports/templates/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const templates = enterpriseReportingService.getTemplatesForTenant(tenantId as string);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

router.get("/reports/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = enterpriseReportingService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── White-Label Customization ─────────────────────────────────────────────────────

router.post("/white-label/config", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      branding: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        accentColor: z.string(),
        backgroundColor: z.string(),
        textColor: z.string(),
        fontFamily: z.string()
      }),
      domain: z.object({
        customDomain: z.string().optional(),
        subdomain: z.string().optional(),
        sslEnabled: z.boolean()
      }),
      email: z.object({
        fromName: z.string(),
        fromEmail: z.string(),
        customTemplates: z.boolean().optional()
      }),
      mobile: z.object({
        appName: z.string(),
        appIcon: z.string().optional(),
        splashScreen: z.string().optional(),
        theme: z.enum(['light', 'dark', 'auto'])
      })
    });
    const data = schema.parse(req.body);

    const config = whiteLabelService.createConfig(
      data.tenantId,
      data.branding,
      data.domain,
      data.email,
      data.mobile
    );
    res.json({ config });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/white-label/config/:tenantId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const config = whiteLabelService.getConfig(tenantId as string);
    
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json({ config });
  } catch (err) {
    next(err);
  }
});

router.put("/white-label/config/:configId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { configId } = req.params;
    const updates = req.body;

    const config = whiteLabelService.updateConfig(configId as string, updates);
    
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }

    res.json({ config });
  } catch (err) {
    next(err);
  }
});

router.post("/white-label/assets", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      assetType: z.enum(['logo', 'favicon', 'app_icon', 'splash_screen', 'background']),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string()
    });
    const data = schema.parse(req.body);

    const asset = whiteLabelService.uploadAsset(
      data.tenantId,
      data.assetType,
      data.fileName,
      data.fileSize,
      data.mimeType
    );
    res.json({ asset });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/white-label/assets/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const assets = whiteLabelService.getAssetsForTenant(tenantId as string);
    res.json({ assets });
  } catch (err) {
    next(err);
  }
});

router.post("/white-label/themes", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      name: z.string(),
      description: z.string(),
      colors: z.any(),
      typography: z.any(),
      spacing: z.any(),
      borderRadius: z.any(),
      shadows: z.any()
    });
    const data = schema.parse(req.body);

    const theme = whiteLabelService.createTheme(
      data.tenantId,
      data.name,
      data.description,
      data.colors,
      data.typography,
      data.spacing,
      data.borderRadius,
      data.shadows
    );
    res.json({ theme });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/white-label/themes/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const themes = whiteLabelService.getThemesForTenant(tenantId as string);
    res.json({ themes });
  } catch (err) {
    next(err);
  }
});

router.get("/white-label/themes/:themeId/css", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { themeId } = req.params;
    const css = whiteLabelService.exportThemeAsCSS(themeId as string);
    
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (err) {
    next(err);
  }
});

router.get("/white-label/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = whiteLabelService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── SLA Monitoring ────────────────────────────────────────────────────────────────

router.post("/sla", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      name: z.string(),
      description: z.string(),
      serviceType: z.enum(['api', 'storage', 'bandwidth', 'support', 'uptime']),
      metrics: z.object({
        uptimeTarget: z.number(),
        responseTimeTarget: z.number(),
        errorRateTarget: z.number(),
        availabilityTarget: z.number()
      }),
      billingPeriod: z.enum(['monthly', 'quarterly', 'yearly']),
      penalties: z.object({
        uptimeBelowThreshold: z.number(),
        responseTimeAboveThreshold: z.number(),
        errorRateAboveThreshold: z.number()
      }),
      startDate: z.number(),
      endDate: z.number().optional()
    });
    const data = schema.parse(req.body);

    const sla = slaMonitoringService.createSLA(
      data.tenantId,
      data.name,
      data.description,
      data.serviceType,
      data.metrics,
      data.billingPeriod,
      data.penalties,
      data.startDate,
      data.endDate
    );
    res.json({ sla });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/sla/:tenantId", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const slas = slaMonitoringService.getSLAsForTenant(tenantId as string);
    res.json({ slas });
  } catch (err) {
    next(err);
  }
});

router.put("/sla/:slaId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { slaId } = req.params;
    const updates = req.body;

    const sla = slaMonitoringService.updateSLA(slaId as string, updates);
    
    if (!sla) {
      return res.status(404).json({ error: "SLA not found" });
    }

    res.json({ sla });
  } catch (err) {
    next(err);
  }
});

router.delete("/sla/:slaId", authenticate, requireAdmin, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { slaId } = req.params;
    const success = slaMonitoringService.deleteSLA(slaId as string);
    
    if (!success) {
      return res.status(404).json({ error: "SLA not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/sla/:slaId/metrics", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { slaId } = req.params;
    const schema = z.object({
      uptime: z.number(),
      responseTime: z.number(),
      errorRate: z.number(),
      availability: z.number(),
      requests: z.number(),
      errors: z.number()
    });
    const data = schema.parse(req.body);

    const metric = slaMonitoringService.recordMetric(
      slaId as string,
      data.uptime,
      data.responseTime,
      data.errorRate,
      data.availability,
      data.requests,
      data.errors
    );
    res.json({ metric });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/sla/:slaId/violations", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { slaId } = req.params;
    const includeResolved = req.query.includeResolved === 'true';
    const violations = slaMonitoringService.getViolationsForSLA(slaId as string, includeResolved);
    res.json({ violations });
  } catch (err) {
    next(err);
  }
});

router.post("/sla/violations/:violationId/resolve", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { violationId } = req.params;
    const success = slaMonitoringService.resolveViolation(violationId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Violation not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/sla/:slaId/report", authenticate, async (req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const { slaId } = req.params;
    const schema = z.object({
      start: z.number(),
      end: z.number()
    });
    const data = schema.parse(req.body);

    const report = slaMonitoringService.generateSLAReport(slaId as string, data);
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as Record<string, unknown>).errors });
    next(err);
  }
});

router.get("/sla/statistics", authenticate, requireAdmin, async (_req: Request & { user?: { id: string; role: string } }, res: Response, next: NextFunction) => {
  try {
    const statistics = slaMonitoringService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
