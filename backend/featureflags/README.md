# Feature Flags System

Feature flags system for gradual rollouts, beta features, enterprise-only modules, and A/B testing.

## Features

- **Feature Flags**: Create and manage feature flags with different strategies
- **Targeting Rules**: Target specific users, organizations, or attributes
- **Gradual Rollouts**: Roll out features gradually based on percentage
- **Beta Features**: Enable features for beta users only
- **Enterprise Features**: Enable features for enterprise organizations
- **A/B Testing**: Run A/B tests with multiple variants
- **User Assignment**: Consistent user assignment for A/B tests
- **Statistics**: Track flag usage and test results

## Usage

### Create Feature Flag

```typescript
import { createFeatureFlag } from './featureflags/index.js';

const flag = createFeatureFlag({
  key: 'new_dashboard',
  name: 'New Dashboard',
  description: 'New dashboard design',
  type: 'boolean',
  enabled: true,
  value: true,
  strategy: 'all',
  createdBy: 'admin',
});
```

### Update Feature Flag

```typescript
import { updateFeatureFlag } from './featureflags/index.js';

const updated = updateFeatureFlag('new_dashboard', {
  enabled: false,
  rolloutPercentage: 50,
});
```

### Check if Feature is Enabled

```typescript
import { isFeatureEnabled } from './featureflags/index.js';

const enabled = isFeatureEnabled('new_dashboard', {
  userId: 'user_123',
  organizationId: 'org_456',
  email: 'user@example.com',
  country: 'KE',
  customAttributes: { plan: 'enterprise' },
});

if (enabled) {
  // Show new feature
}
```

### Create A/B Test

```typescript
import { createABTest } from './featureflags/index.js';

const test = createABTest({
  featureFlagId: 'flag_id',
  name: 'Button Color Test',
  description: 'Test blue vs green button',
  variants: [
    {
      id: 'variant_blue',
      name: 'Blue Button',
      description: 'Blue colored button',
      percentage: 50,
      data: { color: 'blue' },
    },
    {
      id: 'variant_green',
      name: 'Green Button',
      description: 'Green colored button',
      percentage: 50,
      data: { color: 'green' },
    },
  ],
  startDate: new Date(),
  status: 'draft',
  trafficAllocation: 100,
  metrics: [
    {
      id: 'click_rate',
      name: 'Click Rate',
      type: 'conversion',
      description: 'Percentage of users who clicked',
    },
  ],
});
```

### Update A/B Test Status

```typescript
import { updateABTestStatus } from './featureflags/index.js';

const updated = updateABTestStatus('test_id', 'running');
```

### Record A/B Test Result

```typescript
import { recordABTestResult } from './featureflags/index.js';

const result = recordABTestResult('test_id', 'variant_blue', 'click_rate', 0.15);
```

### Calculate A/B Test Winner

```typescript
import { calculateABTestWinner } from './featureflags/index.js';

const winner = calculateABTestWinner('test_id');
console.log('Winning variant:', winner?.variantId);
```

### Get Statistics

```typescript
import { getFeatureFlagsStatistics } from './featureflags/index.js';

const stats = getFeatureFlagsStatistics();
console.log('Total flags:', stats.totalFlags);
console.log('Enabled flags:', stats.enabledFlags);
console.log('By strategy:', stats.byStrategy);
console.log('By type:', stats.byType);
console.log('Total A/B tests:', stats.totalABTests);
console.log('Running A/B tests:', stats.runningABTests);
```

## Data Structures

### FeatureFlag

```typescript
interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: 'boolean' | 'percentage' | 'multivariate';
  enabled: boolean;
  value?: boolean | number | string;
  percentage?: number;
  variants?: FeatureVariant[];
  targetingRules?: TargetingRule[];
  strategy: 'all' | 'beta' | 'enterprise' | 'gradual' | 'ab_test';
  rolloutPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

### FeatureVariant

```typescript
interface FeatureVariant {
  id: string;
  name: string;
  value: any;
  percentage: number;
}
```

### TargetingRule

```typescript
interface TargetingRule {
  id: string;
  attribute: 'userId' | 'organizationId' | 'email' | 'country' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'regex';
  values: any[];
  enabled: boolean;
}
```

### ABTest

```typescript
interface ABTest {
  id: string;
  featureFlagId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed';
  trafficAllocation: number;
  metrics: ABTestMetric[];
  results?: ABTestResult[];
}
```

## Feature Flag Strategies

### All
- Feature is enabled for all users
- Simple on/off switch

### Beta
- Feature is enabled for beta users only
- Requires beta user list

### Enterprise
- Feature is enabled for enterprise organizations only
- Requires enterprise organization list

### Gradual
- Feature is rolled out gradually based on percentage
- Users are consistently assigned to buckets

### A/B Test
- Feature is used for A/B testing
- Users are assigned to variants

## Targeting Rules

### Operators
- `equals`: Exact match
- `contains`: String contains
- `in`: Value in list
- `not_in`: Value not in list
- `regex`: Regular expression match

### Attributes
- `userId`: User ID
- `organizationId`: Organization ID
- `email`: Email address
- `country`: Country code
- `custom`: Custom attributes

## A/B Testing

### Creating Tests
1. Create feature flag with `ab_test` strategy
2. Define variants with percentages
3. Create A/B test with metrics
4. Start test by setting status to `running`

### Recording Results
1. Track user interactions
2. Record results for each variant
3. Calculate winner based on metrics

### Best Practices
1. Use statistically significant sample sizes
2. Run tests for sufficient duration
3. Test one variable at a time
4. Document hypotheses and results

## Production Integration

### Express Middleware

```typescript
import express from 'express';
import { isFeatureEnabled } from './featureflags/index.js';

function featureFlagMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const context = {
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    email: req.user?.email,
    country: req.headers['cf-ipcountry'] as string,
  };

  req.featureFlags = {
    newDashboard: isFeatureEnabled('new_dashboard', context),
    enterpriseAnalytics: isFeatureEnabled('enterprise_analytics', context),
  };

  next();
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function useFeatureFlag(key: string, context: any) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function checkFlag() {
      const response = await fetch(`/api/feature-flags/${key}`, {
        method: 'POST',
        body: JSON.stringify(context),
      });
      const data = await response.json();
      setEnabled(data.enabled);
    }

    checkFlag();
  }, [key, context]);

  return enabled;
}
```

### Admin Dashboard

```typescript
// Feature flag management UI
function FeatureFlagAdmin() {
  const flags = getAllFeatureFlags();
  const tests = getAllABTests();

  return (
    <div>
      <h2>Feature Flags</h2>
      {flags.map(flag => (
        <FeatureFlagCard key={flag.id} flag={flag} />
      ))}

      <h2>A/B Tests</h2>
      {tests.map(test => (
        <ABTestCard key={test.id} test={test} />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Naming**: Use descriptive, consistent naming for flags
2. **Cleanup**: Remove old flags after full rollout
3. **Documentation**: Document purpose and rollout plan
4. **Testing**: Test flags in staging before production
5. **Monitoring**: Monitor flag usage and performance
6. **Rollback**: Have rollback plan for new features
7. **A/B Tests**: Use statistical significance for decisions

## Performance Considerations

1. **Caching**: Cache flag evaluations for users
2. **Batch**: Batch flag checks for multiple flags
3. **Async**: Use async for flag evaluation
4. **Database**: Use database for persistence
5. **CDN**: Cache flag configurations at edge

## Future Enhancements

- Add database persistence for flags and tests
- Implement real-time flag updates
- Add flag change history and audit trail
- Implement advanced targeting with segments
- Add automated winner detection
- Implement feature flag dependencies
