# Cost Optimization System

Cost optimization system for tracking AI token costs, DB growth, storage growth, websocket usage, bandwidth, and providing a cost dashboard.

## Features

- **Cost Metrics**: Track costs across AI tokens, database, storage, websocket, bandwidth, and compute
- **Cost Alerts**: Budget exceeded alerts, anomaly detection, cost spikes, forecast exceeded
- **Cost Forecasts**: Predict future costs based on historical data
- **Cost Budgets**: Set and monitor budgets by category and period
- **Cost Recommendations**: Generate optimization recommendations with estimated savings
- **Cost Dashboard**: Comprehensive dashboard with cost trends, alerts, budgets, and forecasts
- **Anomaly Detection**: Statistical anomaly detection for cost spikes

## Usage

### Record Cost Metric

```typescript
import { recordCostMetric } from './costs/index.js';

const metric = recordCostMetric({
  category: 'ai_tokens',
  metricName: 'GPT-4 tokens',
  value: 1000000,
  unit: 'tokens',
  currency: 'USD',
  timestamp: new Date(),
  organizationId: 'org_123',
});
```

### Get Cost Dashboard Data

```typescript
import { getCostDashboardData } from './costs/index.js';

const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const dashboard = getCostDashboardData(startDate, endDate);

console.log('Total cost:', dashboard.totalCost);
console.log('Cost by category:', dashboard.costByCategory);
console.log('Cost trend:', dashboard.costTrend);
console.log('Active alerts:', dashboard.alerts);
```

### Generate Cost Recommendations

```typescript
import { generateCostRecommendations } from './costs/index.js';

const recommendations = generateCostRecommendations();
for (const rec of recommendations) {
  console.log(`${rec.title}: Save $${rec.estimatedSavings.toFixed(2)}`);
}
```

### Get Cost Statistics

```typescript
import { getCostStatistics } from './costs/index.js';

const stats = getCostStatistics();
console.log('Total cost:', stats.totalCost);
console.log('Active alerts:', stats.activeAlerts);
console.log('Estimated savings:', stats.estimatedSavings);
```

### Create Cost Budget

```typescript
import { costOptimizer } from './costs/index.js';

const budget = costOptimizer.createBudget({
  category: 'ai_tokens',
  period: 'monthly',
  budget: 100,
  currency: 'USD',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  alertThreshold: 80,
});
```

### Generate Cost Forecast

```typescript
import { costOptimizer } from './costs/index.js';

const forecast = costOptimizer.generateForecast('ai_tokens', 'monthly');
console.log('Forecast:', forecast.forecast);
console.log('Confidence:', forecast.confidence);
```

## Data Structures

### CostMetric

```typescript
interface CostMetric {
  id: string;
  category: 'ai_tokens' | 'database' | 'storage' | 'websocket' | 'bandwidth' | 'compute';
  metricName: string;
  value: number;
  unit: string;
  cost: number;
  currency: string;
  timestamp: Date;
  resourceId?: string;
  organizationId?: string;
}
```

### CostAlert

```typescript
interface CostAlert {
  id: string;
  type: 'budget_exceeded' | 'anomaly_detected' | 'cost_spike' | 'forecast_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: CostMetric['category'];
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}
```

### CostForecast

```typescript
interface CostForecast {
  id: string;
  category: CostMetric['category'];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  forecast: number;
  actual?: number;
  variance?: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  confidence: number;
}
```

### CostBudget

```typescript
interface CostBudget {
  id: string;
  category: CostMetric['category'];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  budget: number;
  spent: number;
  remaining: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  alertThreshold: number;
}
```

### CostRecommendation

```typescript
interface CostRecommendation {
  id: string;
  type: 'optimize_query' | 'reduce_storage' | 'compress_data' | 'cache_improvement' | 'scale_down';
  category: CostMetric['category'];
  title: string;
  description: string;
  estimatedSavings: number;
  currency: string;
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: Date;
}
```

## Cost Categories

### AI Tokens
- GPT-4, GPT-3.5, Claude tokens
- Per-token pricing
- Model-specific tracking

### Database
- Read/write operations
- Query execution time
- Connection pool usage

### Storage
- S3/Cloud storage
- Database storage
- CDN storage

### Websocket
- Connection minutes
- Message throughput
- Concurrent connections

### Bandwidth
- Data transfer in/out
- CDN bandwidth
- API response size

### Compute
- CPU hours
- Memory usage
- GPU usage

## Pricing Rates

Default pricing rates (per unit):
- AI Tokens: $0.00002 per token
- Database: $0.0001 per operation
- Storage: $0.023 per GB/month
- Websocket: $0.0005 per minute
- Bandwidth: $0.09 per GB
- Compute: $0.05 per hour

## Production Integration

### Cloud Provider Integration

```typescript
import AWS from 'aws-sdk';

// Track AWS costs
const cloudwatch = new AWS.CloudWatch();

async function trackAWSCosts() {
  const metrics = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/Billing',
    MetricName: 'EstimatedCharges',
    Dimensions: [{ Name: 'Currency', Value: 'USD' }],
    StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    EndTime: new Date(),
    Period: 3600,
    Statistics: ['Sum'],
  }).promise();

  for (const datapoint of metrics.Datapoints || []) {
    recordCostMetric({
      category: 'compute',
      metricName: 'AWS Compute',
      value: datapoint.Sum || 0,
      unit: 'USD',
      currency: 'USD',
      timestamp: datapoint.Timestamp || new Date(),
    });
  }
}
```

### AI Token Tracking

```typescript
async function trackAITokens(model: string, tokens: number) {
  recordCostMetric({
    category: 'ai_tokens',
    metricName: `${model} tokens`,
    value: tokens,
    unit: 'tokens',
    currency: 'USD',
    timestamp: new Date(),
  });
}

// Track after AI API call
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }],
});

const totalTokens = response.usage.total_tokens;
trackAITokens('GPT-4', totalTokens);
```

### Database Query Tracking

```typescript
function trackDatabaseQuery(query: string, executionTime: number) {
  recordCostMetric({
    category: 'database',
    metricName: 'DB query',
    value: 1,
    unit: 'operation',
    currency: 'USD',
    timestamp: new Date(),
  });
}
```

### Storage Tracking

```typescript
async function trackStorageUsage(bucket: string, size: number) {
  recordCostMetric({
    category: 'storage',
    metricName: `${bucket} storage`,
    value: size / (1024 * 1024 * 1024), // Convert to GB
    unit: 'GB',
    currency: 'USD',
    timestamp: new Date(),
  });
}
```

## Best Practices

1. **Regular Tracking**: Track costs at regular intervals
2. **Budget Alerts**: Set appropriate budget thresholds
3. **Anomaly Detection**: Monitor for cost anomalies
4. **Forecasting**: Use forecasts to plan ahead
5. **Recommendations**: Act on cost optimization recommendations
6. **Granularity**: Track costs at appropriate granularity
7. **Review**: Regularly review cost trends and patterns

## Performance Considerations

1. **Batch Recording**: Batch metric recording for efficiency
2. **Aggregation**: Pre-aggregate metrics for faster queries
3. **Caching**: Cache dashboard data
4. **Indexes**: Index metrics by category and timestamp
5. **Archiving**: Archive old metrics to reduce storage

## Future Enhancements

- Add real-time cost monitoring
- Implement cost allocation by team/project
- Add cost prediction with ML models
- Implement automated cost optimization
- Add multi-cloud provider support
- Implement cost anomaly detection with ML
