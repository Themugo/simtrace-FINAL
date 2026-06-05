# Payment & Billing Maturity

Payment and billing system with usage metering, enterprise billing, invoices, tax support, and seat-based pricing.

## Features

- **Usage Metering**: Track device count, API calls, storage, bandwidth, AI tokens, messages
- **Billing Plans**: Free, Starter, Professional, Enterprise plans with limits and features
- **Subscriptions**: Monthly/yearly billing cycles with seat-based pricing
- **Invoice Generation**: Automatic invoice generation with line items
- **Tax Support**: Country-specific tax rates (VAT, GST, sales tax)
- **Overage Charges**: Calculate charges for usage beyond plan limits
- **Statistics**: Track revenue, subscriptions, invoices, and usage metrics

## Usage

### Record Usage Metric

```typescript
import { recordUsageMetric } from './billing/index.js';

const metric = recordUsageMetric({
  organizationId: 'org_123',
  metricType: 'device_count',
  value: 50,
  unit: 'devices',
  timestamp: new Date(),
  period: 'daily',
});
```

### Get Usage Metrics

```typescript
import { getUsageMetrics } from './billing/index.js';

const metrics = getUsageMetrics('org_123', 'monthly');
```

### Get Aggregated Usage

```typescript
import { billingEngine } from './billing/index.js';

const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const aggregated = billingEngine.getAggregatedUsage('org_123', startDate, endDate);
console.log('Total devices:', aggregated.device_count);
console.log('Total API calls:', aggregated.api_calls);
```

### Create Billing Plan

```typescript
import { createBillingPlan } from './billing/index.js';

const plan = createBillingPlan({
  name: 'Custom Plan',
  description: 'Custom enterprise plan',
  type: 'custom',
  pricing: { monthly: 999, yearly: 9990, currency: 'USD' },
  limits: { devices: 1000, apiCalls: 1000000, storage: 1000, bandwidth: 10000, aiTokens: 10000000, seats: 100 },
  features: ['Custom features', 'Dedicated support'],
  isActive: true,
});
```

### Create Subscription

```typescript
import { createSubscription } from './billing/index.js';

const subscription = createSubscription({
  organizationId: 'org_123',
  planId: 'plan_123',
  status: 'active',
  billingCycle: 'monthly',
  seats: 10,
  startDate: new Date(),
  usage: { devices: 50, apiCalls: 50000, storage: 50, bandwidth: 500, aiTokens: 500000 },
});
```

### Generate Invoice

```typescript
import { generateInvoice } from './billing/index.js';

const invoice = generateInvoice('sub_123');
console.log('Invoice total:', invoice?.total);
console.log('Invoice items:', invoice?.items);
```

### Mark Invoice as Paid

```typescript
import { markInvoiceAsPaid } from './billing/index.js';

const paidInvoice = markInvoiceAsPaid('invoice_123');
```

### Get Statistics

```typescript
import { getBillingStatistics } from './billing/index.js';

const stats = getBillingStatistics();
console.log('Total revenue:', stats.totalRevenue);
console.log('Active subscriptions:', stats.activeSubscriptions);
console.log('Pending invoices:', stats.pendingInvoices);
```

## Data Structures

### UsageMetric

```typescript
interface UsageMetric {
  id: string;
  organizationId: string;
  metricType: 'device_count' | 'api_calls' | 'storage_gb' | 'bandwidth_gb' | 'ai_tokens' | 'messages';
  value: number;
  unit: string;
  timestamp: Date;
  period: 'daily' | 'monthly';
}
```

### BillingPlan

```typescript
interface BillingPlan {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  pricing: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    devices: number;
    apiCalls: number;
    storage: number;
    bandwidth: number;
    aiTokens: number;
    seats: number;
  };
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice

```typescript
interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  billingPeriod: {
    start: Date;
    end: Date;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: {
    rate: number;
    amount: number;
    country: string;
  };
  total: number;
  currency: string;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}
```

### Subscription

```typescript
interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired';
  billingCycle: 'monthly' | 'yearly';
  seats: number;
  startDate: Date;
  endDate?: Date;
  cancelAt?: Date;
  usage: {
    devices: number;
    apiCalls: number;
    storage: number;
    bandwidth: number;
    aiTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Billing Plans

### Free
- 5 devices
- 1,000 API calls
- 1 GB storage
- 10 GB bandwidth
- 10,000 AI tokens
- 1 seat
- $0/month

### Starter
- 50 devices
- 10,000 API calls
- 10 GB storage
- 100 GB bandwidth
- 100,000 AI tokens
- 5 seats
- $29/month ($290/year)

### Professional
- 500 devices
- 100,000 API calls
- 100 GB storage
- 1,000 GB bandwidth
- 1,000,000 AI tokens
- 20 seats
- $99/month ($990/year)

### Enterprise
- Unlimited everything
- 24/7 support
- SLA guarantee
- On-premise option
- $499/month ($4,990/year)

## Tax Support

### VAT (Value Added Tax)
- Kenya: 16%
- EU countries: Various rates

### GST (Goods and Services Tax)
- India: 18%
- Australia: 10%
- Canada: 5%

### Sales Tax
- US: State-specific rates (average 8%)

## Production Integration

### Stripe Integration

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create customer
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'Customer Name',
});

// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_id' }],
});

// Create invoice
const invoice = await stripe.invoices.create({
  customer: customer.id,
  subscription: subscription.id,
});
```

### Usage Tracking Middleware

```typescript
import express from 'express';

function trackUsage(metricType: UsageMetric['metricType']) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Record usage after response
    res.on('finish', () => {
      recordUsageMetric({
        organizationId: req.user.organizationId,
        metricType,
        value: 1,
        unit: 'request',
        timestamp: new Date(),
        period: 'daily',
      });
    });
    next();
  };
}

app.use('/api', trackUsage('api_calls'));
```

### Scheduled Invoice Generation

```typescript
import cron from 'node-cron';

// Generate invoices on the 1st of each month
cron.schedule('0 0 1 * *', async () => {
  const subscriptions = billingEngine.getAllSubscriptions();
  
  for (const subscription of subscriptions) {
    if (subscription.status === 'active') {
      const invoice = billingEngine.generateInvoice(subscription.id);
      // Send invoice to customer
    }
  }
});
```

## Best Practices

1. **Usage Tracking**: Track usage at appropriate granularity
2. **Billing Cycles**: Align billing cycles with customer expectations
3. **Notifications**: Send invoice notifications before due date
4. **Overage**: Set reasonable overage rates
5. **Tax**: Keep tax rates up to date
6. **Prorating**: Prorate charges for mid-cycle plan changes
7. **Retention**: Offer discounts for annual billing

## Performance Considerations

1. **Aggregation**: Pre-aggregate usage metrics for faster queries
2. **Caching**: Cache billing plan and subscription data
3. **Batching**: Batch invoice generation
4. **Indexes**: Index usage metrics by organization and timestamp
5. **Archiving**: Archive old invoices and usage data

## Future Enhancements

- Add payment gateway integration (Stripe, PayPal)
- Implement proration for plan changes
- Add discount and coupon system
- Implement multi-currency support
- Add payment method management
- Implement dunning management for failed payments
- Add usage alerts and notifications
