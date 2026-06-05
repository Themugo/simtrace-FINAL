// ── Feature Flags System ───────────────────────────────────────────────────────
// Gradual rollouts, beta features, enterprise-only modules, A/B testing

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'multivariate';
  enabled: boolean;
  value?: boolean | number | string;
  percentage?: number; // 0-100
  variants?: FeatureVariant[];
  targetingRules?: TargetingRule[];
  strategy: 'all' | 'beta' | 'enterprise' | 'gradual' | 'ab_test';
  rolloutPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FeatureVariant {
  id: string;
  name: string;
  value: any;
  percentage: number;
}

export interface TargetingRule {
  id: string;
  attribute: 'userId' | 'organizationId' | 'email' | 'country' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'regex';
  values: any[];
  enabled: boolean;
}

export interface ABTest {
  id: string;
  featureFlagId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  trafficAllocation: number; // 0-100
  metrics: ABTestMetric[];
  results?: ABTestResult[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  percentage: number;
  data: Record<string, any>;
}

export interface ABTestMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement' | 'custom';
  description: string;
}

export interface ABTestResult {
  variantId: string;
  metricId: string;
  value: number;
  sampleSize: number;
  confidence: number;
  winner?: boolean;
}

class FeatureFlagsSystem {
  private flags: Map<string, FeatureFlag> = new Map();
  private abTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> flagKey -> variantId

  // Create feature flag
  createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
    const featureFlag: FeatureFlag = {
      ...flag,
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.flags.set(featureFlag.key, featureFlag);
    return featureFlag;
  }

  // Update feature flag
  updateFeatureFlag(key: string, updates: Partial<Omit<FeatureFlag, 'id' | 'key' | 'createdAt'>>): FeatureFlag | null {
    const flag = this.flags.get(key);
    if (!flag) return null;

    Object.assign(flag, updates);
    flag.updatedAt = new Date();
    return flag;
  }

  // Get feature flag
  getFeatureFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  // Get all feature flags
  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Get feature flags by strategy
  getFeatureFlagsByStrategy(strategy: FeatureFlag['strategy']): FeatureFlag[] {
    return Array.from(this.flags.values()).filter(f => f.strategy === strategy);
  }

  // Check if feature is enabled for user
  isFeatureEnabled(key: string, context: {
    userId?: string;
    organizationId?: string;
    email?: string;
    country?: string;
    customAttributes?: Record<string, any>;
  }): boolean | string | number {
    const flag = this.flags.get(key);
    if (!flag || !flag.enabled) return false;

    // Check targeting rules
    if (flag.targetingRules && flag.targetingRules.length > 0) {
      const matchesTargeting = this.checkTargetingRules(flag.targetingRules, context);
      if (!matchesTargeting) return false;
    }

    switch (flag.strategy) {
      case 'all':
        return flag.value !== undefined ? flag.value : true;

      case 'beta':
        // Beta features for specific users
        if (context.userId && this.isBetaUser(context.userId)) {
          return flag.value !== undefined ? flag.value : true;
        }
        return false;

      case 'enterprise':
        // Enterprise features for enterprise organizations
        if (context.organizationId && this.isEnterpriseOrganization(context.organizationId)) {
          return flag.value !== undefined ? flag.value : true;
        }
        return false;

      case 'gradual':
        // Gradual rollout based on percentage
        if (flag.rolloutPercentage !== undefined) {
          const hash = this.hashUserId(context.userId || 'anonymous');
          const bucket = hash % 100;
          return bucket < flag.rolloutPercentage;
        }
        return false;

      case 'ab_test':
        // A/B test - return assigned variant
        if (context.userId && flag.variants) {
          const variant = this.getAssignedVariant(flag, context.userId);
          return variant.value;
        }
        return false;

      default:
        return flag.value !== undefined ? flag.value : true;
    }
  }

  // Check targeting rules
  private checkTargetingRules(rules: TargetingRule[], context: any): boolean {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      const value = context[rule.attribute];
      if (value === undefined) continue;

      let matches = false;

      switch (rule.operator) {
        case 'equals':
          matches = value === rule.values[0];
          break;
        case 'contains':
          matches = String(value).includes(rule.values[0]);
          break;
        case 'in':
          matches = rule.values.includes(value);
          break;
        case 'not_in':
          matches = !rule.values.includes(value);
          break;
        case 'regex':
          matches = new RegExp(rule.values[0]).test(String(value));
          break;
      }

      if (matches) return true;
    }

    return false;
  }

  // Check if user is beta user
  private isBetaUser(userId: string): boolean {
    // In production, check against beta user list
    const betaUsers = ['user_beta_1', 'user_beta_2'];
    return betaUsers.includes(userId);
  }

  // Check if organization is enterprise
  private isEnterpriseOrganization(organizationId: string): boolean {
    // In production, check against enterprise organization list
    const enterpriseOrgs = ['org_enterprise_1', 'org_enterprise_2'];
    return enterpriseOrgs.includes(organizationId);
  }

  // Hash user ID for consistent bucketing
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Get assigned variant for A/B test
  private getAssignedVariant(flag: FeatureFlag, userId: string): FeatureVariant {
    if (!flag.variants || flag.variants.length === 0) {
      return { id: 'default', name: 'default', value: true, percentage: 100 };
    }

    // Check if user already has assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }

    const userAssignments = this.userAssignments.get(userId)!;
    const existingAssignment = userAssignments.get(flag.key);

    if (existingAssignment) {
      const variant = flag.variants.find(v => v.id === existingAssignment);
      if (variant) return variant;
    }

    // Assign new variant based on hash
    const hash = this.hashUserId(userId);
    let cumulative = 0;
    const bucket = hash % 100;

    for (const variant of flag.variants) {
      cumulative += variant.percentage;
      if (bucket < cumulative) {
        userAssignments.set(flag.key, variant.id);
        return variant;
      }
    }

    // Fallback to first variant
    userAssignments.set(flag.key, flag.variants[0].id);
    return flag.variants[0];
  }

  // Create A/B test
  createABTest(test: Omit<ABTest, 'id'>): ABTest {
    const abTest: ABTest = {
      ...test,
      id: `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.abTests.set(abTest.id, abTest);
    return abTest;
  }

  // Update A/B test status
  updateABTestStatus(testId: string, status: ABTest['status']): ABTest | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    test.status = status;
    return test;
  }

  // Get A/B test
  getABTest(testId: string): ABTest | undefined {
    return this.abTests.get(testId);
  }

  // Get all A/B tests
  getAllABTests(): ABTest[] {
    return Array.from(this.abTests.values());
  }

  // Get running A/B tests
  getRunningABTests(): ABTest[] {
    return Array.from(this.abTests.values()).filter(t => t.status === 'running');
  }

  // Record A/B test result
  recordABTestResult(testId: string, variantId: string, metricId: string, value: number): ABTest | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    if (!test.results) {
      test.results = [];
    }

    const existingResult = test.results.find(r => r.variantId === variantId && r.metricId === metricId);
    if (existingResult) {
      existingResult.value = (existingResult.value * existingResult.sampleSize + value) / (existingResult.sampleSize + 1);
      existingResult.sampleSize++;
    } else {
      test.results.push({
        variantId,
        metricId,
        value,
        sampleSize: 1,
        confidence: 0,
      });
    }

    return test;
  }

  // Calculate A/B test winner
  calculateABTestWinner(testId: string): ABTestResult | null {
    const test = this.abTests.get(testId);
    if (!test || !test.results) return null;

    // Simple implementation: pick variant with highest value for first metric
    const metricId = test.metrics[0].id;
    const results = test.results.filter(r => r.metricId === metricId);

    if (results.length === 0) return null;

    const winner = results.reduce((best, current) => 
      current.value > best.value ? current : best
    );

    // Mark as winner
    for (const result of test.results) {
      result.winner = result.variantId === winner.variantId;
    }

    return winner;
  }

  // Get statistics
  getStatistics(): {
    totalFlags: number;
    enabledFlags: number;
    byStrategy: Record<string, number>;
    byType: Record<string, number>;
    totalABTests: number;
    runningABTests: number;
    totalUserAssignments: number;
  } {
    const byStrategy: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const flag of this.flags.values()) {
      byStrategy[flag.strategy] = (byStrategy[flag.strategy] || 0) + 1;
      byType[flag.type] = (byType[flag.type] || 0) + 1;
    }

    return {
      totalFlags: this.flags.size,
      enabledFlags: Array.from(this.flags.values()).filter(f => f.enabled).length,
      byStrategy,
      byType,
      totalABTests: this.abTests.size,
      runningABTests: this.getRunningABTests().length,
      totalUserAssignments: this.userAssignments.size,
    };
  }

  // Initialize default feature flags
  initializeDefaultFeatureFlags(): void {
    // Beta feature
    this.createFeatureFlag({
      key: 'beta_dashboard',
      name: 'Beta Dashboard',
      description: 'New dashboard design for beta users',
      type: 'boolean',
      enabled: true,
      value: true,
      strategy: 'beta',
      createdBy: 'system',
    });

    // Enterprise feature
    this.createFeatureFlag({
      key: 'enterprise_analytics',
      name: 'Enterprise Analytics',
      description: 'Advanced analytics for enterprise customers',
      type: 'boolean',
      enabled: true,
      value: true,
      strategy: 'enterprise',
      createdBy: 'system',
    });

    // Gradual rollout
    this.createFeatureFlag({
      key: 'new_search',
      name: 'New Search',
      description: 'Improved search experience',
      type: 'boolean',
      enabled: true,
      value: true,
      strategy: 'gradual',
      rolloutPercentage: 20,
      createdBy: 'system',
    });

    // A/B test
    this.createFeatureFlag({
      key: 'button_color_test',
      name: 'Button Color Test',
      description: 'A/B test for button colors',
      type: 'multivariate',
      enabled: true,
      strategy: 'ab_test',
      variants: [
        { id: 'variant_blue', name: 'Blue', value: 'blue', percentage: 50 },
        { id: 'variant_green', name: 'Green', value: 'green', percentage: 50 },
      ],
      createdBy: 'system',
    });
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsSystem();

// Initialize default feature flags
featureFlags.initializeDefaultFeatureFlags();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
  return featureFlags.createFeatureFlag(flag);
}

export function updateFeatureFlag(key: string, updates: Partial<Omit<FeatureFlag, 'id' | 'key' | 'createdAt'>>): FeatureFlag | null {
  return featureFlags.updateFeatureFlag(key, updates);
}

export function getFeatureFlag(key: string): FeatureFlag | undefined {
  return featureFlags.getFeatureFlag(key);
}

export function isFeatureEnabled(key: string, context: {
  userId?: string;
  organizationId?: string;
  email?: string;
  country?: string;
  customAttributes?: Record<string, any>;
}): boolean | string | number {
  return featureFlags.isFeatureEnabled(key, context);
}

export function createABTest(test: Omit<ABTest, 'id'>): ABTest {
  return featureFlags.createABTest(test);
}

export function updateABTestStatus(testId: string, status: ABTest['status']): ABTest | null {
  return featureFlags.updateABTestStatus(testId, status);
}

export function recordABTestResult(testId: string, variantId: string, metricId: string, value: number): ABTest | null {
  return featureFlags.recordABTestResult(testId, variantId, metricId, value);
}

export function calculateABTestWinner(testId: string): ABTestResult | null {
  return featureFlags.calculateABTestWinner(testId);
}

export function getFeatureFlagsStatistics() {
  return featureFlags.getStatistics();
}
