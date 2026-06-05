// ── Enterprise Policy Engine ───────────────────────────────────────────────────────
// OPA-based policy evaluation for organization policies, allowed countries, risk thresholds, evidence retention

export interface Policy {
  id: string;
  organizationId: string;
  name: string;
  type: 'allowed_countries' | 'risk_threshold' | 'evidence_retention' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyEvaluationRequest {
  policyId: string;
  context: Record<string, any>;
  userId?: string;
  deviceId?: string;
  organizationId: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  allowed: boolean;
  reason?: string;
  details?: Record<string, any>;
  evaluatedAt: Date;
}

class PolicyEngine {
  private policies: Map<string, Policy> = new Map();
  private evaluationCache: Map<string, PolicyEvaluationResult> = new Map();

  // Create policy
  createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Policy {
    const newPolicy: Policy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  // Update policy
  updatePolicy(policyId: string, updates: Partial<Omit<Policy, 'id' | 'createdAt'>>): Policy | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updatedPolicy: Policy = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updatedPolicy);
    return updatedPolicy;
  }

  // Delete policy
  deletePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  // Get policy
  getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  // Get policies by organization
  getPoliciesByOrganization(organizationId: string): Policy[] {
    return Array.from(this.policies.values()).filter(
      p => p.organizationId === organizationId
    );
  }

  // Get enabled policies by organization
  getEnabledPolicies(organizationId: string): Policy[] {
    return this.getPoliciesByOrganization(organizationId).filter(p => p.enabled);
  }

  // Evaluate policy
  evaluatePolicy(request: PolicyEvaluationRequest): PolicyEvaluationResult {
    const policy = this.policies.get(request.policyId);
    if (!policy) {
      throw new Error(`Policy ${request.policyId} not found`);
    }

    if (!policy.enabled) {
      return {
        policyId: request.policyId,
        allowed: true,
        reason: 'Policy is disabled',
        evaluatedAt: new Date(),
      };
    }

    let result: PolicyEvaluationResult;

    switch (policy.type) {
      case 'allowed_countries':
        result = this.evaluateAllowedCountries(policy, request);
        break;
      case 'risk_threshold':
        result = this.evaluateRiskThreshold(policy, request);
        break;
      case 'evidence_retention':
        result = this.evaluateEvidenceRetention(policy, request);
        break;
      case 'custom':
        result = this.evaluateCustomPolicy(policy, request);
        break;
      default:
        result = {
          policyId: request.policyId,
          allowed: true,
          reason: 'Unknown policy type',
          evaluatedAt: new Date(),
        };
    }

    // Cache result
    const cacheKey = this.getCacheKey(request);
    this.evaluationCache.set(cacheKey, result);

    return result;
  }

  // Evaluate allowed countries policy
  private evaluateAllowedCountries(
    policy: Policy,
    request: PolicyEvaluationRequest
  ): PolicyEvaluationResult {
    const allowedCountries = policy.config.allowedCountries as string[] || [];
    const country = request.context.country as string;

    if (!country) {
      return {
        policyId: policy.id,
        allowed: false,
        reason: 'Country not specified in context',
        evaluatedAt: new Date(),
      };
    }

    const isAllowed = allowedCountries.includes(country);

    return {
      policyId: policy.id,
      allowed: isAllowed,
      reason: isAllowed ? 'Country is allowed' : 'Country is not allowed',
      details: {
        country,
        allowedCountries,
      },
      evaluatedAt: new Date(),
    };
  }

  // Evaluate risk threshold policy
  private evaluateRiskThreshold(
    policy: Policy,
    request: PolicyEvaluationRequest
  ): PolicyEvaluationResult {
    const threshold = policy.config.threshold as number || 50;
    const riskScore = request.context.riskScore as number || 0;

    const isAllowed = riskScore < threshold;

    return {
      policyId: policy.id,
      allowed: isAllowed,
      reason: isAllowed ? 'Risk score below threshold' : 'Risk score exceeds threshold',
      details: {
        riskScore,
        threshold,
      },
      evaluatedAt: new Date(),
    };
  }

  // Evaluate evidence retention policy
  private evaluateEvidenceRetention(
    policy: Policy,
    request: PolicyEvaluationRequest
  ): PolicyEvaluationResult {
    const retentionDays = policy.config.retentionDays as number || 30;
    const evidenceDate = request.context.evidenceDate as Date;
    const action = request.context.action as string;

    if (!evidenceDate) {
      return {
        policyId: policy.id,
        allowed: true,
        reason: 'No evidence date specified',
        evaluatedAt: new Date(),
      };
    }

    const ageInDays = (Date.now() - evidenceDate.getTime()) / (1000 * 60 * 60 * 24);

    if (action === 'delete' && ageInDays < retentionDays) {
      return {
        policyId: policy.id,
        allowed: false,
        reason: `Evidence is ${ageInDays.toFixed(0)} days old, retention period is ${retentionDays} days`,
        details: {
          ageInDays,
          retentionDays,
        },
        evaluatedAt: new Date(),
      };
    }

    return {
      policyId: policy.id,
      allowed: true,
      reason: 'Evidence retention policy satisfied',
      details: {
        ageInDays,
        retentionDays,
      },
      evaluatedAt: new Date(),
    };
  }

  // Evaluate custom policy
  private evaluateCustomPolicy(
    policy: Policy,
    request: PolicyEvaluationRequest
  ): PolicyEvaluationResult {
    // In production, this would integrate with OPA (Open Policy Agent)
    // For now, we'll implement a simple custom evaluation

    const rules = policy.config.rules as Array<{
      condition: string;
      action: 'allow' | 'deny';
    }> || [];

    for (const rule of rules) {
      // Simplified condition evaluation
      // In production, use OPA's Rego language
      if (this.evaluateCondition(rule.condition, request.context)) {
        return {
          policyId: policy.id,
          allowed: rule.action === 'allow',
          reason: `Custom policy rule matched: ${rule.condition}`,
          evaluatedAt: new Date(),
        };
      }
    }

    return {
      policyId: policy.id,
      allowed: true,
      reason: 'No custom policy rules matched',
      evaluatedAt: new Date(),
    };
  }

  // Simple condition evaluator
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Very simplified - in production use OPA
    try {
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch {
      return false;
    }
  }

  // Evaluate all policies for organization
  evaluateAllPolicies(organizationId: string, context: Record<string, any>): PolicyEvaluationResult[] {
    const policies = this.getEnabledPolicies(organizationId);
    const results: PolicyEvaluationResult[] = [];

    for (const policy of policies) {
      const request: PolicyEvaluationRequest = {
        policyId: policy.id,
        context,
        organizationId,
      };

      try {
        const result = this.evaluatePolicy(request);
        results.push(result);
      } catch (error) {
        results.push({
          policyId: policy.id,
          allowed: false,
          reason: `Evaluation error: ${error}`,
          evaluatedAt: new Date(),
        });
      }
    }

    return results;
  }

  // Check if all policies allow an action
  isActionAllowed(organizationId: string, context: Record<string, any>): boolean {
    const results = this.evaluateAllPolicies(organizationId, context);
    return results.every(r => r.allowed);
  }

  // Get cache key
  private getCacheKey(request: PolicyEvaluationRequest): string {
    return `${request.policyId}_${JSON.stringify(request.context)}`;
  }

  // Clear evaluation cache
  clearCache(): void {
    this.evaluationCache.clear();
  }

  // Clear old cache entries
  clearOldCache(maxAgeMinutes = 5): void {
    const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;

    for (const [key, result] of this.evaluationCache) {
      if (result.evaluatedAt.getTime() < cutoff) {
        this.evaluationCache.delete(key);
      }
    }
  }

  // Create default policies for organization
  createDefaultPolicies(organizationId: string): Policy[] {
    const policies: Policy[] = [];

    // Allowed countries policy
    policies.push(this.createPolicy({
      organizationId,
      name: 'Allowed Countries',
      type: 'allowed_countries',
      enabled: true,
      config: {
        allowedCountries: ['KE', 'UG', 'TZ', 'RW', 'BI'], // East Africa
      },
    }));

    // Risk threshold policy
    policies.push(this.createPolicy({
      organizationId,
      name: 'Risk Threshold',
      type: 'risk_threshold',
      enabled: true,
      config: {
        threshold: 70,
      },
    }));

    // Evidence retention policy
    policies.push(this.createPolicy({
      organizationId,
      name: 'Evidence Retention',
      type: 'evidence_retention',
      enabled: true,
      config: {
        retentionDays: 90,
      },
    }));

    return policies;
  }
}

// Singleton instance
export const policyEngine = new PolicyEngine();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Policy {
  return policyEngine.createPolicy(policy);
}

export function updatePolicy(policyId: string, updates: Partial<Omit<Policy, 'id' | 'createdAt'>>): Policy | null {
  return policyEngine.updatePolicy(policyId, updates);
}

export function deletePolicy(policyId: string): boolean {
  return policyEngine.deletePolicy(policyId);
}

export function getPolicy(policyId: string): Policy | undefined {
  return policyEngine.getPolicy(policyId);
}

export function getPoliciesByOrganization(organizationId: string): Policy[] {
  return policyEngine.getPoliciesByOrganization(organizationId);
}

export function evaluatePolicy(request: PolicyEvaluationRequest): PolicyEvaluationResult {
  return policyEngine.evaluatePolicy(request);
}

export function evaluateAllPolicies(organizationId: string, context: Record<string, any>): PolicyEvaluationResult[] {
  return policyEngine.evaluateAllPolicies(organizationId, context);
}

export function isActionAllowed(organizationId: string, context: Record<string, any>): boolean {
  return policyEngine.isActionAllowed(organizationId, context);
}

export function createDefaultPolicies(organizationId: string): Policy[] {
  return policyEngine.createDefaultPolicies(organizationId);
}
