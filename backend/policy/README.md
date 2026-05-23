# Enterprise Policy Engine

OPA-based policy evaluation for organization policies, allowed countries, risk thresholds, and evidence retention.

## Features

- **Policy Management**: Create, update, delete, and retrieve policies
- **Policy Types**: Allowed countries, risk threshold, evidence retention, custom policies
- **Policy Evaluation**: Evaluate policies against context
- **Organization Scoping**: Policies are scoped to organizations
- **Caching**: Evaluation results are cached for performance
- **Default Policies**: Create default policies for new organizations

## Usage

### Create Policy

```typescript
import { createPolicy } from './policy/index.js';

const policy = createPolicy({
  organizationId: 'org123',
  name: 'Allowed Countries',
  type: 'allowed_countries',
  enabled: true,
  config: {
    allowedCountries: ['KE', 'UG', 'TZ', 'RW', 'BI'],
  },
});
```

### Evaluate Policy

```typescript
import { evaluatePolicy } from './policy/index.js';

const result = evaluatePolicy({
  policyId: 'policy_123',
  context: {
    country: 'KE',
    riskScore: 45,
  },
  organizationId: 'org123',
});

if (result.allowed) {
  console.log('Action allowed');
} else {
  console.log('Action denied:', result.reason);
}
```

### Evaluate All Policies

```typescript
import { evaluateAllPolicies } from './policy/index.js';

const results = evaluateAllPolicies('org123', {
  country: 'KE',
  riskScore: 45,
  action: 'delete',
  evidenceDate: new Date(),
});

for (const result of results) {
  console.log(`Policy ${result.policyId}: ${result.allowed ? 'ALLOWED' : 'DENIED'}`);
  if (!result.allowed) {
    console.log('Reason:', result.reason);
  }
}
```

### Check if Action is Allowed

```typescript
import { isActionAllowed } from './policy/index.js';

const allowed = isActionAllowed('org123', {
  country: 'KE',
  riskScore: 45,
});

if (allowed) {
  // Proceed with action
}
```

### Create Default Policies

```typescript
import { createDefaultPolicies } from './policy/index.js';

const policies = createDefaultPolicies('org123');
console.log('Created default policies:', policies);
```

## Policy Types

### Allowed Countries

Restricts actions based on geographic location.

```typescript
{
  type: 'allowed_countries',
  config: {
    allowedCountries: ['KE', 'UG', 'TZ', 'RW', 'BI'],
  },
}
```

Context:
```typescript
{
  country: 'KE',
}
```

### Risk Threshold

Restricts actions based on risk score.

```typescript
{
  type: 'risk_threshold',
  config: {
    threshold: 70,
  },
}
```

Context:
```typescript
{
  riskScore: 45,
}
```

### Evidence Retention

Controls evidence deletion based on age.

```typescript
{
  type: 'evidence_retention',
  config: {
    retentionDays: 90,
  },
}
```

Context:
```typescript
{
  action: 'delete',
  evidenceDate: new Date('2024-01-01'),
}
```

### Custom Policy

Custom rules using condition expressions.

```typescript
{
  type: 'custom',
  config: {
    rules: [
      {
        condition: 'context.riskScore < 50 && context.country === "KE"',
        action: 'allow',
      },
    ],
  },
}
```

## Policy Structure

```typescript
interface Policy {
  id: string;
  organizationId: string;
  name: string;
  type: 'allowed_countries' | 'risk_threshold' | 'evidence_retention' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Evaluation Result Structure

```typescript
interface PolicyEvaluationResult {
  policyId: string;
  allowed: boolean;
  reason?: string;
  details?: Record<string, any>;
  evaluatedAt: Date;
}
```

## OPA Integration

For production deployments, integrate with Open Policy Agent (OPA):

```typescript
import axios from 'axios';

async function evaluateWithOPA(policyId: string, context: Record<string, any>) {
  const response = await axios.post('http://opa:8181/v1/data/simtrace/allow', {
    input: {
      policyId,
      context,
    },
  });

  return response.data.result;
}
```

OPA Rego policy example:

```rego
package simtrace

allow {
    input.context.riskScore < data.policies[input.policyId].config.threshold
}

allow {
    input.context.country in data.policies[input.policyId].config.allowedCountries
}
```

## Best Practices

1. **Policy Naming**: Use descriptive names for policies
2. **Organization Scoping**: Always scope policies to organizations
3. **Default Policies**: Create default policies for new organizations
4. **Policy Testing**: Test policies thoroughly before enabling
5. **Cache Management**: Clear cache when policies are updated
6. **Audit Logging**: Log all policy evaluations for compliance

## Performance Considerations

1. **Caching**: Evaluation results are cached for 5 minutes by default
2. **Batch Evaluation**: Evaluate all policies at once for efficiency
3. **Policy Order**: Order policies by priority if needed
4. **OPA Integration**: Use OPA for complex policy evaluation
5. **Database Persistence**: Store policies in database for persistence

## Future Enhancements

- Add database persistence for policies
- Integrate with OPA for complex policy evaluation
- Add policy versioning
- Implement policy templates
- Add policy testing framework
- Implement policy approval workflow
