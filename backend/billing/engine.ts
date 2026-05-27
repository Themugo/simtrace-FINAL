// ── Payment & Billing Maturity ───────────────────────────────────────────────────
// Usage metering, enterprise billing, invoices, tax support, seat-based pricing

export interface UsageMetric {
  id: string;
  organizationId: string;
  metricType: 'device_count' | 'api_calls' | 'storage_gb' | 'bandwidth_gb' | 'ai_tokens' | 'messages';
  value: number;
  unit: string;
  timestamp: Date;
  period: 'daily' | 'monthly';
}

export interface BillingPlan {
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
    storage: number; // GB
    bandwidth: number; // GB
    aiTokens: number;
    seats: number;
  };
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
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

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Subscription {
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

export interface TaxRate {
  id: string;
  country: string;
  region?: string;
  rate: number;
  type: 'vat' | 'gst' | 'sales_tax';
  description: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

class BillingEngine {
  private usageMetrics: Map<string, UsageMetric> = new Map();
  private billingPlans: Map<string, BillingPlan> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private taxRates: Map<string, TaxRate> = new Map();

  // Record usage metric
  recordUsageMetric(metric: Omit<UsageMetric, 'id'>): UsageMetric {
    const usageMetric: UsageMetric = {
      ...metric,
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.usageMetrics.set(usageMetric.id, usageMetric);
    return usageMetric;
  }

  // Get usage metrics for organization
  getUsageMetrics(organizationId: string, period?: 'daily' | 'monthly'): UsageMetric[] {
    let metrics = Array.from(this.usageMetrics.values()).filter(m => m.organizationId === organizationId);

    if (period) {
      metrics = metrics.filter(m => m.period === period);
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get aggregated usage
  getAggregatedUsage(organizationId: string, startDate: Date, endDate: Date): Record<string, number> {
    const metrics = Array.from(this.usageMetrics.values()).filter(
      m => m.organizationId === organizationId && m.timestamp >= startDate && m.timestamp <= endDate
    );

    const aggregated: Record<string, number> = {};

    for (const metric of metrics) {
      const key = metric.metricType;
      aggregated[key] = (aggregated[key] || 0) + metric.value;
    }

    return aggregated;
  }

  // Create billing plan
  createBillingPlan(plan: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>): BillingPlan {
    const billingPlan: BillingPlan = {
      ...plan,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.billingPlans.set(billingPlan.id, billingPlan);
    return billingPlan;
  }

  // Get billing plan
  getBillingPlan(planId: string): BillingPlan | undefined {
    return this.billingPlans.get(planId);
  }

  // Get all billing plans
  getAllBillingPlans(): BillingPlan[] {
    return Array.from(this.billingPlans.values());
  }

  // Get active billing plans
  getActiveBillingPlans(): BillingPlan[] {
    return Array.from(this.billingPlans.values()).filter(p => p.isActive);
  }

  // Create subscription
  createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription {
    const sub: Subscription = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(sub.id, sub);
    return sub;
  }

  // Update subscription
  updateSubscription(subscriptionId: string, updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>): Subscription | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return null;

    Object.assign(subscription, updates);
    subscription.updatedAt = new Date();
    return subscription;
  }

  // Get subscription
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  // Get subscription by organization
  getSubscriptionByOrganization(organizationId: string): Subscription | undefined {
    return Array.from(this.subscriptions.values()).find(s => s.organizationId === organizationId);
  }

  // Create invoice
  createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const inv: Invoice = {
      ...invoice,
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber,
      createdAt: new Date(),
    };

    this.invoices.set(inv.id, inv);
    return inv;
  }

  // Generate invoice from subscription
  generateInvoice(subscriptionId: string): Invoice | null {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return null;

    const plan = this.billingPlans.get(subscription.planId);
    if (!plan) return null;

    const billingPeriod = {
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // Calculate base price
    const basePrice = subscription.billingCycle === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;

    // Calculate overage charges
    const overageCharges = this.calculateOverageCharges(subscription, plan);

    // Calculate subtotal
    const subtotal = basePrice + overageCharges;

    // Calculate tax
    const tax = this.calculateTax(subscription.organizationId, subtotal);

    // Calculate total
    const total = subtotal + tax.amount;

    const items: InvoiceItem[] = [
      {
        id: `item_${Date.now()}_1`,
        description: `${plan.name} Plan (${subscription.billingCycle})`,
        quantity: 1,
        unitPrice: basePrice,
        amount: basePrice,
      },
    ];

    if (overageCharges > 0) {
      items.push({
        id: `item_${Date.now()}_2`,
        description: 'Overage Charges',
        quantity: 1,
        unitPrice: overageCharges,
        amount: overageCharges,
      });
    }

    const invoice = this.createInvoice({
      organizationId: subscription.organizationId,
      status: 'pending',
      billingPeriod,
      items,
      subtotal,
      tax,
      total,
      currency: plan.pricing.currency,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return invoice;
  }

  // Calculate overage charges
  private calculateOverageCharges(subscription: Subscription, plan: BillingPlan): number {
    let overage = 0;
    const overageRate = 0.1; // 10% of base price per unit over limit

    if (subscription.usage.devices > plan.limits.devices) {
      overage += (subscription.usage.devices - plan.limits.devices) * overageRate * plan.pricing.monthly;
    }

    if (subscription.usage.apiCalls > plan.limits.apiCalls) {
      overage += (subscription.usage.apiCalls - plan.limits.apiCalls) * 0.0001;
    }

    if (subscription.usage.storage > plan.limits.storage) {
      overage += (subscription.usage.storage - plan.limits.storage) * 0.5;
    }

    return overage;
  }

  // Calculate tax
  private calculateTax(_organizationId: string, amount: number): { rate: number; amount: number; country: string } {
    // In production, get organization country and apply appropriate tax rate
    const taxRate = 0.16; // 16% VAT (Kenya)
    return {
      rate: taxRate * 100,
      amount: amount * taxRate,
      country: 'KE',
    };
  }

  // Get invoice
  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  // Get invoices by organization
  getInvoicesByOrganization(organizationId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter(i => i.organizationId === organizationId);
  }

  // Mark invoice as paid
  markInvoiceAsPaid(invoiceId: string): Invoice | null {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return null;

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    return invoice;
  }

  // Add tax rate
  addTaxRate(taxRate: Omit<TaxRate, 'id'>): TaxRate {
    const rate: TaxRate = {
      ...taxRate,
      id: `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.taxRates.set(rate.id, rate);
    return rate;
  }

  // Get tax rate for country
  getTaxRate(country: string, region?: string): TaxRate | undefined {
    return Array.from(this.taxRates.values()).find(
      t => t.country === country && (!region || t.region === region) && (!t.effectiveTo || t.effectiveTo > new Date())
    );
  }

  // Get statistics
  getStatistics(): {
    totalUsageMetrics: number;
    totalBillingPlans: number;
    activeBillingPlans: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    totalRevenue: number;
  } {
    const activePlans = Array.from(this.billingPlans.values()).filter(p => p.isActive).length;
    const activeSubs = Array.from(this.subscriptions.values()).filter(s => s.status === 'active').length;
    const pendingInvoices = Array.from(this.invoices.values()).filter(i => i.status === 'pending').length;
    const paidInvoices = Array.from(this.invoices.values()).filter(i => i.status === 'paid').length;
    const totalRevenue = Array.from(this.invoices.values())
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);

    return {
      totalUsageMetrics: this.usageMetrics.size,
      totalBillingPlans: this.billingPlans.size,
      activeBillingPlans: activePlans,
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubs,
      totalInvoices: this.invoices.size,
      pendingInvoices,
      paidInvoices,
      totalRevenue,
    };
  }

  // Initialize default billing plans
  initializeDefaultPlans(): void {
    this.createBillingPlan({
      name: 'Free',
      description: 'Basic plan for individuals',
      type: 'free',
      pricing: { monthly: 0, yearly: 0, currency: 'USD' },
      limits: { devices: 5, apiCalls: 1000, storage: 1, bandwidth: 10, aiTokens: 10000, seats: 1 },
      features: ['Basic tracking', 'Email support'],
      isActive: true,
    });

    this.createBillingPlan({
      name: 'Starter',
      description: 'For small teams',
      type: 'starter',
      pricing: { monthly: 29, yearly: 290, currency: 'USD' },
      limits: { devices: 50, apiCalls: 10000, storage: 10, bandwidth: 100, aiTokens: 100000, seats: 5 },
      features: ['Advanced tracking', 'Priority support', 'API access'],
      isActive: true,
    });

    this.createBillingPlan({
      name: 'Professional',
      description: 'For growing businesses',
      type: 'professional',
      pricing: { monthly: 99, yearly: 990, currency: 'USD' },
      limits: { devices: 500, apiCalls: 100000, storage: 100, bandwidth: 1000, aiTokens: 1000000, seats: 20 },
      features: ['All features', 'Dedicated support', 'Custom integrations'],
      isActive: true,
    });

    this.createBillingPlan({
      name: 'Enterprise',
      description: 'For large organizations',
      type: 'enterprise',
      pricing: { monthly: 499, yearly: 4990, currency: 'USD' },
      limits: { devices: -1, apiCalls: -1, storage: -1, bandwidth: -1, aiTokens: -1, seats: -1 }, // Unlimited
      features: ['Unlimited everything', '24/7 support', 'SLA guarantee', 'On-premise option'],
      isActive: true,
    });

    // Add tax rates
    this.addTaxRate({
      country: 'KE',
      rate: 0.16,
      type: 'vat',
      description: 'Kenya VAT',
      effectiveFrom: new Date('2021-01-01'),
    });

    this.addTaxRate({
      country: 'US',
      rate: 0.08,
      type: 'sales_tax',
      description: 'US Sales Tax (average)',
      effectiveFrom: new Date('2021-01-01'),
    });
  }
}

// Singleton instance
export const billingEngine = new BillingEngine();

// Initialize default plans
billingEngine.initializeDefaultPlans();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function recordUsageMetric(metric: Omit<UsageMetric, 'id'>): UsageMetric {
  return billingEngine.recordUsageMetric(metric);
}

export function getUsageMetrics(organizationId: string, period?: 'daily' | 'monthly'): UsageMetric[] {
  return billingEngine.getUsageMetrics(organizationId, period);
}

export function createBillingPlan(plan: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>): BillingPlan {
  return billingEngine.createBillingPlan(plan);
}

export function createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Subscription {
  return billingEngine.createSubscription(subscription);
}

export function generateInvoice(subscriptionId: string): Invoice | null {
  return billingEngine.generateInvoice(subscriptionId);
}

export function markInvoiceAsPaid(invoiceId: string): Invoice | null {
  return billingEngine.markInvoiceAsPaid(invoiceId);
}

export function getBillingStatistics() {
  return billingEngine.getStatistics();
}
