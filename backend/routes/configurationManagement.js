// routes/configurationManagement.js - Agency, Country, and Policy Configuration API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createAgencyConfig,
  getAgencyConfig,
  getAgencyConfigByCountry,
  updateAgencyConfig,
  generateApiKey,
  revokeApiKey,
  validateApiKey,
  createCountryConfig,
  getCountryConfig,
  getAllCountryConfigs,
  updateCountryConfig,
  createPolicyRule,
  getPolicyRules,
  getPolicyRulesByScope,
  evaluatePolicy,
  updatePolicyRule,
  enablePolicyRule,
  disablePolicyRule,
  getEffectiveConfig,
  checkRateLimit,
  checkIPAccess,
  checkTimeBasedAccess,
  maskData,
  validatePassword,
  triggerWebhooks,
  getIntegrationConfig,
  mapFields,
  getConfigurationStatistics,
} from "../services/configurationManagement.js";

const router = Router();

// ── Agency Configuration Management ─────────────────────────────────────────────────
router.post("/agency", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
      agencyName: z.string(),
      agencyType: z.enum(["police", "government", "private", "ngo", "international"]),
      country: z.string(),
      security: z.object({
        encryptionKey: z.string().optional(),
        encryptionAlgorithm: z.string().optional(),
        hashingAlgorithm: z.string().optional(),
        requireMFA: z.boolean().optional(),
        mfaMethods: z.array(z.string()).optional(),
        sessionTimeout: z.number().optional(),
        maxConcurrentSessions: z.number().optional(),
        passwordPolicy: z.object({
          minLength: z.number().optional(),
          requireUppercase: z.boolean().optional(),
          requireLowercase: z.boolean().optional(),
          requireNumbers: z.boolean().optional(),
          requireSpecialChars: z.boolean().optional(),
          passwordHistory: z.number().optional(),
          passwordExpiryDays: z.number().optional(),
        }).optional(),
        ipWhitelist: z.array(z.string()).optional(),
        ipBlacklist: z.array(z.string()).optional(),
        allowedDomains: z.array(z.string()).optional(),
        timeBasedAccess: z.array(z.object({
          dayOfWeek: z.array(z.number()),
          startTime: z.string(),
          endTime: z.string(),
        })).optional(),
      }).optional(),
      rateLimiting: z.object({
        enabled: z.boolean().optional(),
        requestsPerMinute: z.number().optional(),
        requestsPerHour: z.number().optional(),
        requestsPerDay: z.number().optional(),
        burstLimit: z.number().optional(),
        endpoints: z.array(z.object({
          path: z.string(),
          requestsPerMinute: z.number().optional(),
          requestsPerHour: z.number().optional(),
        })).optional(),
      }).optional(),
      dataRetention: z.object({
        auditLogRetentionDays: z.number().optional(),
        encryptedDataRetentionDays: z.number().optional(),
        caseDataRetentionDays: z.number().optional(),
        pingDataRetentionDays: z.number().optional(),
        notificationRetentionDays: z.number().optional(),
        autoDeleteExpired: z.boolean().optional(),
      }).optional(),
      notifications: z.object({
        channels: z.array(z.object({
          type: z.enum(["email", "sms", "push", "webhook", "in_app"]),
          enabled: z.boolean().optional(),
          config: z.any().optional(),
        })).optional(),
        templates: z.object({
          caseCreated: z.string().optional(),
          caseUpdated: z.string().optional(),
          caseResolved: z.string().optional(),
          alertTriggered: z.string().optional(),
          cooperationRequest: z.string().optional(),
          cooperationDelayed: z.string().optional(),
          seniorConfirmation: z.string().optional(),
        }).optional(),
        webhookEndpoints: z.array(z.object({
          url: z.string(),
          events: z.array(z.string()),
          secret: z.string().optional(),
          retryAttempts: z.number().optional(),
          retryDelay: z.number().optional(),
        })).optional(),
      }).optional(),
      api: z.object({
        allowedOrigins: z.array(z.string()).optional(),
        corsEnabled: z.boolean().optional(),
        apiVersion: z.string().optional(),
      }).optional(),
      integrations: z.array(z.object({
        provider: z.string(),
        type: z.enum(["telecom", "payment", "court", "interpol", "custom"]),
        enabled: z.boolean().optional(),
        config: z.any().optional(),
        endpoints: z.object({
          baseUrl: z.string().optional(),
          auth: z.any().optional(),
          endpoints: z.array(z.object({
            name: z.string(),
            path: z.string(),
            method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
            timeout: z.number().optional(),
          })).optional(),
        }).optional(),
        mapping: z.any().optional(),
        retryPolicy: z.object({
          maxRetries: z.number().optional(),
          retryDelay: z.number().optional(),
          backoffMultiplier: z.number().optional(),
        }).optional(),
      })).optional(),
      dataMasking: z.object({
        enabled: z.boolean().optional(),
        rules: z.array(z.object({
          field: z.string(),
          maskPattern: z.string().optional(),
          showFirst: z.number().optional(),
          showLast: z.number().optional(),
        })).optional(),
      }).optional(),
      consent: z.object({
        requireConsent: z.boolean().optional(),
        consentVersion: z.string().optional(),
        consentText: z.string().optional(),
        dataProcessingConsent: z.string().optional(),
        locationTrackingConsent: z.string().optional(),
        thirdPartySharingConsent: z.string().optional(),
      }).optional(),
      workflows: z.object({
        caseApproval: z.object({
          requireApproval: z.boolean().optional(),
          approvalLevels: z.array(z.string()).optional(),
          autoApproveAfter: z.number().optional(),
        }).optional(),
        dataAccess: z.object({
          requireApproval: z.boolean().optional(),
          defaultDuration: z.number().optional(),
          maxDuration: z.number().optional(),
        }).optional(),
        cooperation: z.object({
          defaultResponseTime: z.number().optional(),
          escalationThreshold: z.number().optional(),
          autoEscalate: z.boolean().optional(),
        }).optional(),
        missingPerson: z.object({
          adultThreshold: z.number().optional(),
          childThreshold: z.number().optional(),
          elderlyThreshold: z.number().optional(),
        }).optional(),
      }).optional(),
      compliance: z.object({
        gdprCompliant: z.boolean().optional(),
        hipaaCompliant: z.boolean().optional(),
        iso27001Compliant: z.boolean().optional(),
        dataResidency: z.string().optional(),
        dataSovereignty: z.string().optional(),
      }).optional(),
    });

    const data = schema.parse(req.body);
    const config = await createAgencyConfig({ ...data, createdBy: req.user.id });
    res.status(201).json(config);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/agency/:agencyId", authenticate, async (req, res, next) => {
  try {
    const { agencyId } = req.params;
    const config = await getAgencyConfig(agencyId);
    res.json(config);
  } catch (err) { next(err); }
});

router.get("/agency/country/:country", authenticate, async (req, res, next) => {
  try {
    const { country } = req.params;
    const configs = await getAgencyConfigByCountry(country);
    res.json({ configs, count: configs.length });
  } catch (err) { next(err); }
});

router.patch("/agency/:agencyId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { agencyId } = req.params;
    const config = await updateAgencyConfig(agencyId, req.body, req.user.id);
    res.json(config);
  } catch (err) { next(err); }
});

router.post("/agency/:agencyId/api-keys", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string(),
      permissions: z.array(z.string()).optional(),
      rateLimitOverride: z.number().optional(),
      expiresAt: z.date().optional(),
    });

    const { agencyId } = req.params;
    const data = schema.parse(req.body);
    const result = await generateApiKey(agencyId, data);
    res.status(201).json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.delete("/agency/:agencyId/api-keys/:keyId", authenticate, async (req, res, next) => {
  try {
    const { agencyId, keyId } = req.params;
    const key = await revokeApiKey(agencyId, keyId);
    res.json(key);
  } catch (err) { next(err); }
});

router.get("/agency/:agencyId/effective-config", authenticate, async (req, res, next) => {
  try {
    const { agencyId } = req.params;
    const config = await getAgencyConfig(agencyId);
    const effectiveConfig = await getEffectiveConfig(agencyId, config.country);
    res.json(effectiveConfig);
  } catch (err) { next(err); }
});

// ── Country Configuration Management ───────────────────────────────────────────────
router.post("/country", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      countryCode: z.string(),
      countryName: z.string(),
      legal: z.object({
        dataProtectionLaw: z.string().optional(),
        dataRetentionRequirement: z.number().optional(),
        requiresDataResidency: z.boolean().optional(),
        dataResidencyLocation: z.string().optional(),
        encryptionRequired: z.boolean().optional(),
        auditLoggingRequired: z.boolean().optional(),
        consentRequired: z.boolean().optional(),
        rightToBeForgotten: z.boolean().optional(),
        dataPortability: z.boolean().optional(),
      }).optional(),
      police: z.object({
        hierarchyStructure: z.array(z.string()).optional(),
        obNumberFormat: z.string().optional(),
        reportConfirmationRequired: z.boolean().optional(),
        nationwideAlertEnabled: z.boolean().optional(),
        caseTransferEnabled: z.boolean().optional(),
        interpolIntegration: z.boolean().optional(),
      }).optional(),
      missingPerson: z.object({
        adultThreshold: z.number().optional(),
        childThreshold: z.number().optional(),
        elderlyThreshold: z.number().optional(),
        immediateDeclarationConditions: z.array(z.string()).optional(),
        requiresPoliceReport: z.boolean().optional(),
        notifyFamily: z.boolean().optional(),
        notifyEmbassy: z.boolean().optional(),
      }).optional(),
      emergency: z.object({
        emergencyNumber: z.string().optional(),
        panicModeEnabled: z.boolean().optional(),
        guardianSystemEnabled: z.boolean().optional(),
        parentChildTrackingEnabled: z.boolean().optional(),
      }).optional(),
      telecom: z.object({
        defaultProvider: z.string().optional(),
        supportedProviders: z.array(z.string()).optional(),
        locationAccuracy: z.enum(["low", "medium", "high"]).optional(),
        locationRefreshInterval: z.number().optional(),
        requiresWarrant: z.boolean().optional(),
      }).optional(),
      court: z.object({
        courtTypes: z.array(z.string()).optional(),
        caseTypes: z.array(z.string()).optional(),
        integrationEnabled: z.boolean().optional(),
        apiEndpoint: z.string().optional(),
      }).optional(),
      currency: z.object({
        code: z.string().optional(),
        symbol: z.string().optional(),
        paymentMethods: z.array(z.string()).optional(),
      }).optional(),
      language: z.object({
        default: z.string().optional(),
        supported: z.array(z.string()).optional(),
      }).optional(),
      timezone: z.string(),
    });

    const data = schema.parse(req.body);
    const config = await createCountryConfig({ ...data, createdBy: req.user.id });
    res.status(201).json(config);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/country/:countryCode", authenticate, async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const config = await getCountryConfig(countryCode);
    res.json(config);
  } catch (err) { next(err); }
});

router.get("/country", authenticate, async (req, res, next) => {
  try {
    const configs = await getAllCountryConfigs();
    res.json({ configs, count: configs.length });
  } catch (err) { next(err); }
});

router.patch("/country/:countryCode", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const config = await updateCountryConfig(countryCode, req.body, req.user.id);
    res.json(config);
  } catch (err) { next(err); }
});

// ── Policy Engine Management ────────────────────────────────────────────────────────
router.post("/policies", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      policyId: z.string(),
      policyName: z.string(),
      policyType: z.enum(["security", "data", "workflow", "compliance", "custom"]),
      scope: z.object({
        agencyId: z.string().optional(),
        countryCode: z.string().optional(),
        roleLevel: z.string().optional(),
      }).optional(),
      rule: z.object({
        condition: z.any(),
        action: z.any(),
        priority: z.number().optional(),
      }),
      executeOn: z.array(z.string()),
      description: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const rule = await createPolicyRule({ ...data, createdBy: req.user.id });
    res.status(201).json(rule);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/policies", authenticate, async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.policyType) filters.policyType = req.query.policyType;
    if (req.query.agencyId) filters["scope.agencyId"] = req.query.agencyId;
    if (req.query.countryCode) filters["scope.countryCode"] = req.query.countryCode;

    const rules = await getPolicyRules(filters);
    res.json({ rules, count: rules.length });
  } catch (err) { next(err); }
});

router.get("/policies/scope", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string().optional(),
      countryCode: z.string().optional(),
      roleLevel: z.string().optional(),
    });

    const scope = schema.parse(req.query);
    const rules = await getPolicyRulesByScope(scope);
    res.json({ rules, count: rules.length });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/policies/evaluate", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      context: z.any(),
      eventType: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await evaluatePolicy(data.context, data.eventType);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.patch("/policies/:policyId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { policyId } = req.params;
    const rule = await updatePolicyRule(policyId, req.body, req.user.id);
    res.json(rule);
  } catch (err) { next(err); }
});

router.post("/policies/:policyId/enable", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { policyId } = req.params;
    const rule = await enablePolicyRule(policyId);
    res.json(rule);
  } catch (err) { next(err); }
});

router.post("/policies/:policyId/disable", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { policyId } = req.params;
    const rule = await disablePolicyRule(policyId);
    res.json(rule);
  } catch (err) { next(err); }
});

// ── Security Checks ─────────────────────────────────────────────────────────────────
router.post("/security/check-rate-limit", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
      endpoint: z.string(),
      userIp: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await checkRateLimit(data.agencyId, data.endpoint, data.userIp);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/security/check-ip-access", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
      userIp: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await checkIPAccess(data.agencyId, data.userIp);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/security/check-time-access", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await checkTimeBasedAccess(data.agencyId);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/security/validate-password", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      password: z.string(),
      agencyId: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await validatePassword(data.password, data.agencyId);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/security/mask-data", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      data: z.any(),
      agencyId: z.string(),
    });

    const data = schema.parse(req.body);
    const masked = await maskData(data.data, data.agencyId);
    res.json({ masked });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Integration Helpers ─────────────────────────────────────────────────────────────
router.get("/integration/:agencyId/:provider", authenticate, async (req, res, next) => {
  try {
    const { agencyId, provider } = req.params;
    const integration = await getIntegrationConfig(agencyId, provider);
    res.json(integration);
  } catch (err) { next(err); }
});

router.post("/integration/map-fields", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      data: z.any(),
      mapping: z.any(),
    });

    const data = schema.parse(req.body);
    const mapped = await mapFields(data.data, data.mapping);
    res.json({ mapped });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/webhooks/trigger", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
      event: z.string(),
      payload: z.any(),
    });

    const data = schema.parse(req.body);
    await triggerWebhooks(data.agencyId, data.event, data.payload);
    res.json({ success: true });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getConfigurationStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
