// services/financials.ts - Financial Projections & Revenue Tracking
// Business analytics and financial forecasting

import { FinancialProjection, User, Device, Payment, AdEvent } from "../db/index.js";

interface ProjectionMetrics {
  totalUsers: number; newUsers: number; churnedUsers: number;
  totalDevices: number; newDevices: number;
  subscriptionRevenue: number; adRevenue: number; verificationRevenue: number;
  partnerApiRevenue: number; insuranceRevenue: number;
  totalRevenue: number; infrastructureCost: number; marketingCost: number;
  operationalCost: number; totalCost: number; grossProfit: number;
  netProfit: number; profitMargin: number;
  revenueAchieved: boolean | null; targetRevenue: number;
}

interface DashboardProjections {
  monthly: {
    subscriptionRevenue: number; adRevenue: number; verificationRevenue: number;
    partnerApiRevenue: number; insuranceRevenue: number;
    infrastructureCost: number; marketingCost: number; operationalCost: number;
  };
  quarterly: unknown;
  yearly: unknown;
}

// ── Projection Management ─────────────────────────────────────────────────────────
export async function createFinancialProjection(data: Record<string, unknown>) {
  const {
    period,
    startDate,
    endDate,
    targetRevenue,
    targetUsers,
  } = data;

  const projection = await FinancialProjection.create({
    period,
    startDate,
    endDate,
    targetRevenue,
    targetUsers,
    totalUsers: 0,
    newUsers: 0,
    churnedUsers: 0,
    totalDevices: 0,
    newDevices: 0,
    subscriptionRevenue: 0,
    adRevenue: 0,
    verificationRevenue: 0,
    partnerApiRevenue: 0,
    insuranceRevenue: 0,
    totalRevenue: 0,
    infrastructureCost: 0,
    marketingCost: 0,
    operationalCost: 0,
    totalCost: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
  });

  return projection;
}

export async function getFinancialProjection(projectionId: string) {
  const projection = await FinancialProjection.findById(projectionId);
  return projection;
}

export async function getProjectionsByPeriod(period: string) {
  const projections = await FinancialProjection.find({ period })
    .sort({ startDate: -1 });

  return projections;
}

export async function getCurrentProjection(period = "monthly") {
  const now = new Date();
  let startDate: Date, endDate: Date;

  if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "quarterly") {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  } else if (period === "yearly") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  let projection = await FinancialProjection.findOne({
    period,
    startDate,
    endDate,
  });

  if (!projection) {
    projection = await createFinancialProjection({
      period,
      startDate,
      endDate,
    });
  }

  return projection;
}

export async function updateProjectionMetrics(projectionId: string, metrics: Record<string, unknown>) {
  const projection = await FinancialProjection.findById(projectionId);
  if (!projection) throw new Error("Projection not found");

  if (metrics.totalUsers !== undefined) (projection as unknown as ProjectionMetrics).totalUsers = metrics.totalUsers as number;
  if (metrics.newUsers !== undefined) (projection as unknown as ProjectionMetrics).newUsers = metrics.newUsers as number;
  if (metrics.churnedUsers !== undefined) (projection as unknown as ProjectionMetrics).churnedUsers = metrics.churnedUsers as number;
  if (metrics.totalDevices !== undefined) (projection as unknown as ProjectionMetrics).totalDevices = metrics.totalDevices as number;
  if (metrics.newDevices !== undefined) (projection as unknown as ProjectionMetrics).newDevices = metrics.newDevices as number;
  if (metrics.subscriptionRevenue !== undefined) (projection as unknown as ProjectionMetrics).subscriptionRevenue = metrics.subscriptionRevenue as number;
  if (metrics.adRevenue !== undefined) (projection as unknown as ProjectionMetrics).adRevenue = metrics.adRevenue as number;
  if (metrics.verificationRevenue !== undefined) (projection as unknown as ProjectionMetrics).verificationRevenue = metrics.verificationRevenue as number;
  if (metrics.partnerApiRevenue !== undefined) (projection as unknown as ProjectionMetrics).partnerApiRevenue = metrics.partnerApiRevenue as number;
  if (metrics.insuranceRevenue !== undefined) (projection as unknown as ProjectionMetrics).insuranceRevenue = metrics.insuranceRevenue as number;
  if (metrics.infrastructureCost !== undefined) (projection as unknown as ProjectionMetrics).infrastructureCost = metrics.infrastructureCost as number;
  if (metrics.marketingCost !== undefined) (projection as unknown as ProjectionMetrics).marketingCost = metrics.marketingCost as number;
  if (metrics.operationalCost !== undefined) (projection as unknown as ProjectionMetrics).operationalCost = metrics.operationalCost as number;

  // Recalculate totals
  (projection as unknown as ProjectionMetrics).totalRevenue = (projection as unknown as ProjectionMetrics).subscriptionRevenue + 
                          (projection as unknown as ProjectionMetrics).adRevenue + 
                          (projection as unknown as ProjectionMetrics).verificationRevenue + 
                          (projection as unknown as ProjectionMetrics).partnerApiRevenue + 
                          (projection as unknown as ProjectionMetrics).insuranceRevenue;

  (projection as unknown as ProjectionMetrics).totalCost = (projection as unknown as ProjectionMetrics).infrastructureCost + 
                       (projection as unknown as ProjectionMetrics).marketingCost + 
                       (projection as unknown as ProjectionMetrics).operationalCost;

  (projection as unknown as ProjectionMetrics).grossProfit = (projection as unknown as ProjectionMetrics).totalRevenue - (projection as unknown as ProjectionMetrics).totalCost;
  (projection as unknown as ProjectionMetrics).netProfit = (projection as unknown as ProjectionMetrics).grossProfit; // Simplified
  (projection as unknown as ProjectionMetrics).profitMargin = (projection as unknown as ProjectionMetrics).totalRevenue > 0 
    ? ((projection as unknown as ProjectionMetrics).netProfit / (projection as unknown as ProjectionMetrics).totalRevenue) * 100 
    : 0;

  (projection as unknown as ProjectionMetrics).revenueAchieved = (projection as unknown as ProjectionMetrics).targetRevenue 
    ? (projection as unknown as ProjectionMetrics).totalRevenue >= (projection as unknown as ProjectionMetrics).targetRevenue 
    : null;

  projection.updatedAt = new Date();
  await projection.save();

  return projection;
}

// ── Revenue Calculation ─────────────────────────────────────────────────────────
export async function calculateRevenue(startDate: Date, endDate: Date) {
  // Subscription revenue
  const subscriptionPayments = await Payment.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: "completed",
    type: "subscription",
  });

  const subscriptionRevenue = subscriptionPayments.reduce((sum: number, p) => sum + ((p as unknown as { amount: number }).amount || 0), 0);

  // Ad revenue
  const adConversions = await AdEvent.find({
    type: "conversion",
    timestamp: { $gte: startDate, $lte: endDate },
    flagged: false,
  });

  const adRevenue = adConversions.reduce((sum: number, e) => sum + ((e as unknown as { revenue: number }).revenue || 0), 0);

  // Verification revenue (simplified - would need dedicated tracking)
  const verificationRevenue = 0;

  // Partner API revenue (simplified - would need dedicated tracking)
  const partnerApiRevenue = 0;

  // Insurance revenue (simplified - would need dedicated tracking)
  const insuranceRevenue = 0;

  const totalRevenue = subscriptionRevenue + adRevenue + verificationRevenue + partnerApiRevenue + insuranceRevenue;

  return {
    subscriptionRevenue,
    adRevenue,
    verificationRevenue,
    partnerApiRevenue,
    insuranceRevenue,
    totalRevenue,
  };
}

// ── User Metrics ───────────────────────────────────────────────────────────────
export async function calculateUserMetrics(startDate: Date, endDate: Date) {
  const totalUsers = await User.countDocuments();
  
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  // Churned users (simplified - would need activity tracking)
  const churnedUsers = 0;

  const totalDevices = await Device.countDocuments();
  
  const newDevices = await Device.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  return {
    totalUsers,
    newUsers,
    churnedUsers,
    totalDevices,
    newDevices,
  };
}

// ── Cost Estimation ───────────────────────────────────────────────────────────
export async function estimateCosts(_period: string) {
  // Simplified cost estimation based on user count
  const totalUsers = await User.countDocuments();
  
  // Infrastructure: $0.10 per user per month
  const infrastructureCost = totalUsers * 0.10;

  // Marketing: 30% of projected revenue (from business plan)
  const marketingCost = 0; // Would be calculated based on actual spend

  // Operational: Fixed costs + variable costs
  const operationalCost = 1000; // Base operational cost

  const totalCost = infrastructureCost + marketingCost + operationalCost;

  return {
    infrastructureCost,
    marketingCost,
    operationalCost,
    totalCost,
  };
}

// ── Auto-Update Projections ─────────────────────────────────────────────────────
export async function updateCurrentProjections() {
  const monthly = await getCurrentProjection("monthly");
  const quarterly = await getCurrentProjection("quarterly");
  const yearly = await getCurrentProjection("yearly");

  const now = new Date();

  // Update monthly
  const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthlyRevenue = await calculateRevenue(monthlyStart, monthlyEnd);
  const monthlyUsers = await calculateUserMetrics(monthlyStart, monthlyEnd);
  const monthlyCosts = await estimateCosts("monthly");

  await updateProjectionMetrics(monthly._id.toString(), {
    ...monthlyRevenue,
    ...monthlyUsers,
    ...monthlyCosts,
  });

  // Update quarterly
  const quarter = Math.floor(now.getMonth() / 3);
  const quarterlyStart = new Date(now.getFullYear(), quarter * 3, 1);
  const quarterlyEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
  const quarterlyRevenue = await calculateRevenue(quarterlyStart, quarterlyEnd);
  const quarterlyUsers = await calculateUserMetrics(quarterlyStart, quarterlyEnd);
  const quarterlyCosts = await estimateCosts("quarterly");

  await updateProjectionMetrics(quarterly._id.toString(), {
    ...quarterlyRevenue,
    ...quarterlyUsers,
    ...quarterlyCosts,
  });

  // Update yearly
  const yearlyStart = new Date(now.getFullYear(), 0, 1);
  const yearlyEnd = new Date(now.getFullYear(), 11, 31);
  const yearlyRevenue = await calculateRevenue(yearlyStart, yearlyEnd);
  const yearlyUsers = await calculateUserMetrics(yearlyStart, yearlyEnd);
  const yearlyCosts = await estimateCosts("yearly");

  await updateProjectionMetrics(yearly._id.toString(), {
    ...yearlyRevenue,
    ...yearlyUsers,
    ...yearlyCosts,
  });

  return {
    monthly: await getFinancialProjection(monthly._id.toString()),
    quarterly: await getFinancialProjection(quarterly._id.toString()),
    yearly: await getFinancialProjection(yearly._id.toString()),
  };
}

// ── Financial Dashboard Data ─────────────────────────────────────────────────────
export async function getFinancialDashboard() {
  const projections = await updateCurrentProjections();
  
  const revenueTrend = await FinancialProjection.find({
    period: "monthly",
  })
    .sort({ startDate: -1 })
    .limit(12);

  const revenueTrendData = revenueTrend.map((p) => ({
    month: p.startDate.toLocaleString("default", { month: "short" }),
    year: p.startDate.getFullYear(),
    revenue: p.totalRevenue,
    users: p.totalUsers,
    profit: p.netProfit,
  })).reverse();

  const revenueBreakdown = {
    subscription: (projections as unknown as DashboardProjections).monthly.subscriptionRevenue,
    ads: (projections as unknown as DashboardProjections).monthly.adRevenue,
    verification: (projections as unknown as DashboardProjections).monthly.verificationRevenue,
    partnerApi: (projections as unknown as DashboardProjections).monthly.partnerApiRevenue,
    insurance: (projections as unknown as DashboardProjections).monthly.insuranceRevenue,
  };

  const costBreakdown = {
    infrastructure: (projections as unknown as DashboardProjections).monthly.infrastructureCost,
    marketing: (projections as unknown as DashboardProjections).monthly.marketingCost,
    operational: (projections as unknown as DashboardProjections).monthly.operationalCost,
  };

  return {
    current: projections,
    revenueTrend: revenueTrendData,
    revenueBreakdown,
    costBreakdown,
  };
}

// ── Business Plan Projections ───────────────────────────────────────────────────
export async function generateBusinessPlanProjections() {
  const projections: unknown[] = [];
  const baseDate = new Date();

  // Generate 12-month projections based on business plan
  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    const endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i + 1, 0);

    // Business plan targets
    let targetUsers, targetRevenue;
    if (month <= 3) {
      targetUsers = 1000;
      targetRevenue = 10000;
    } else if (month <= 6) {
      targetUsers = 5000;
      targetRevenue = 50000;
    } else {
      targetUsers = 20000;
      targetRevenue = 200000;
    }

    const projection = await FinancialProjection.create({
      period: "monthly",
      startDate,
      endDate,
      targetUsers,
      targetRevenue,
    });

    projections.push(projection);
  }

  return projections;
}
