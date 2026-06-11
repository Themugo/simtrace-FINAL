// services/adsEnhanced.ts - Enhanced Advertisement Board
// Advanced monetization and partnership platform

import { AdCampaign, AdEvent, User, WhiteLabelInstance } from "../db/index.js";

// ── Local type definitions ─────────────────────────────────────────────────────────

interface CampaignDoc {
  targeting: { locations?: string[]; userRoles?: string[]; imeiStatuses?: string[] };
  metrics: { spend: number; impressions: number; clicks: number; conversions: number; ctr: number; cpa: number; roi: number };
  budget: { total: number; daily: number; currency?: string };
  bidding: { currentBid: number; maxBid: number };
  creatives: unknown[];
}

interface AdEventDoc {
  type: string;
  revenue?: number;
  flagged?: boolean;
  timestamp: Date;
}

interface CampaignEditable {
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  schedule: { startDate?: Date; endDate?: Date | null };
  metrics: Record<string, number>;
  budget: { total: number; daily: number };
  bidding: { currentBid: number; maxBid: number };
  creatives: unknown[];
  optimization: {
    autoOptimize: boolean;
    learningModel: string | null;
    lastOptimized: Date | null;
  };
}

// ── Campaign Management ─────────────────────────────────────────────────────────────
export async function createAdCampaign(data: Record<string, unknown>) {
  const name = data.name as string | undefined;
  const advertiser = data.advertiser as string | undefined;
  const whiteLabel = data.whiteLabel as string | undefined;
  const budget = data.budget as { total?: number; daily?: number; currency?: string } | undefined;
  const bidding = data.bidding as { strategy?: string; maxBid?: number; currentBid?: number } | undefined;
  const targeting = data.targeting as Record<string, unknown> | undefined;
  const creatives = data.creatives as unknown[] | undefined;
  const placements = data.placements as unknown[] | undefined;
  const schedule = data.schedule as Record<string, unknown> | undefined;

  const user = await User.findById(advertiser);
  if (!user) throw new Error("Advertiser not found");

  const whiteLabelInstance = whiteLabel 
    ? await WhiteLabelInstance.findById(whiteLabel)
    : null;

  const campaign = await AdCampaign.create({
    name,
    advertiser,
    whiteLabel,
    status: "draft",
    budget: {
      total: budget?.total || 10000,
      daily: budget?.daily || 500,
      currency: budget?.currency || "KES",
    },
    bidding: {
      strategy: bidding?.strategy || "cpc",
      maxBid: bidding?.maxBid || 10,
      currentBid: bidding?.currentBid || bidding?.maxBid || 10,
    },
    targeting: targeting || {},
    creatives: creatives || [],
    placements: placements || [],
    schedule: schedule || {},
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      ctr: 0,
      cpa: 0,
      roi: 0,
    },
    optimization: {
      autoOptimize: false,
      learningModel: null,
      lastOptimized: null,
    },
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  });

  return campaign;
}

export async function submitCampaignForReview(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const c = campaign as unknown as CampaignEditable;
  if (c.status !== "draft") {
    throw new Error("Only draft campaigns can be submitted");
  }

  c.status = "pending";
  c.submittedAt = new Date();
  await campaign.save();

  return campaign;
}

export async function reviewCampaign(campaignId: string, approved: boolean, rejectionReason: string | null = null) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const c = campaign as unknown as CampaignEditable;
  if (c.status !== "pending") {
    throw new Error("Only pending campaigns can be reviewed");
  }

  c.status = approved ? "active" : "rejected";
  c.reviewedAt = new Date();
  c.rejectionReason = rejectionReason;

  if (approved) {
    c.schedule.startDate = c.schedule.startDate || new Date();
  }

  await campaign.save();

  return campaign;
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const c = campaign as unknown as CampaignEditable;
  const validTransitions: Record<string, string[]> = {
    draft: ["pending", "paused"],
    pending: ["active", "rejected"],
    active: ["paused", "completed", "exhausted"],
    paused: ["active"],
    rejected: [],
    completed: [],
    exhausted: [],
  };

  if (!validTransitions[c.status].includes(status)) {
    throw new Error(`Invalid status transition from ${c.status} to ${status}`);
  }

  c.status = status;
  campaign.updatedAt = new Date();
  await campaign.save();

  return campaign;
}

// ── Ad Event Tracking ─────────────────────────────────────────────────────────────
export async function trackAdEvent(data: Record<string, unknown>) {
  const campaignId = data.campaignId as string | undefined;
  const creativeId = data.creativeId as string | undefined;
  const userId = data.userId as string | undefined;
  const whiteLabelId = data.whiteLabelId as string | undefined;
  const type = data.type as string;
  const context = data.context as { ip?: string; userAgent?: string } | undefined;
  const attribution = data.attribution as Record<string, unknown> | undefined;
  const revenue = data.revenue as number | undefined;

  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Fraud detection
  const fraudScore = calculateFraudScore({ type, context, userId });
  const flagged = fraudScore > 70;

  const event = await AdEvent.create({
    campaign: campaignId,
    creative: creativeId,
    user: userId,
    whiteLabel: whiteLabelId,
    type,
    context,
    attribution,
    revenue: revenue || 0,
    fraudScore,
    flagged,
    flagReason: flagged ? "High fraud score detected" : null,
    ip: context?.ip,
    userAgent: context?.userAgent,
    timestamp: new Date(),
  });

  // Update campaign metrics (excluding flagged events)
  if (!flagged) {
    await updateCampaignMetrics(campaignId ?? '', type, revenue);
  }

  return event;
}

function calculateFraudScore({ type, context, userId }: { type: string; context?: { userAgent?: string }; userId?: string }): number {
  let score = 0;

  // High frequency from same user
  if (userId) {
    // In production, check recent events from this user
    score += 10;
  }

  // Suspicious user agent
  if (context?.userAgent?.includes("bot")) {
    score += 50;
  }

  // Unusual timing patterns
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    score += 15;
  }

  return Math.min(score, 100);
}

async function updateCampaignMetrics(campaignId: string, eventType: string, revenue?: number) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) return;

  const c = campaign as unknown as CampaignEditable;
  switch (eventType) {
    case "impression":
      c.metrics.impressions += 1;
      break;
    case "click":
      c.metrics.clicks += 1;
      break;
    case "conversion":
      c.metrics.conversions += 1;
      if (revenue) {
        c.metrics.spend += revenue;
      }
      break;
  }

  // Recalculate derived metrics
  if (c.metrics.impressions > 0) {
    c.metrics.ctr = (c.metrics.clicks / c.metrics.impressions) * 100;
  }

  if (c.metrics.conversions > 0 && c.metrics.spend > 0) {
    c.metrics.cpa = c.metrics.spend / c.metrics.conversions;
  }

  // Check budget exhaustion
  if (c.metrics.spend >= c.budget.total) {
    c.status = "exhausted";
  }

  campaign.updatedAt = new Date();
  await campaign.save();
}

// ── Campaign Queries ─────────────────────────────────────────────────────────────
export async function getCampaign(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId)
    .populate("advertiser", "name email")
    .populate("whiteLabel");

  return campaign;
}

export async function getCampaignsByAdvertiser(advertiserId: string) {
  const campaigns = await AdCampaign.find({ advertiser: advertiserId })
    .populate("whiteLabel")
    .sort({ createdAt: -1 });

  return campaigns;
}

export async function getActiveCampaigns() {
  const now = new Date();
  const campaigns = await AdCampaign.find({
    status: "active",
    "schedule.startDate": { $lte: now },
    $or: [
      { "schedule.endDate": { $gte: now } },
      { "schedule.endDate": null },
    ],
  })
    .populate("advertiser", "name email")
    .sort({ "metrics.impressions": -1 });

  return campaigns;
}

export async function getCampaignsByPlacement(placementType: string) {
  const campaigns = await AdCampaign.find({
    status: "active",
    "placements.type": placementType,
  })
    .populate("advertiser")
    .sort({ "bidding.currentBid": -1 });

  return campaigns;
}

// ── Ad Selection & Delivery ───────────────────────────────────────────────────────
export async function selectAdForPlacement(context: { placement?: string; user?: { role?: string }; location?: { country?: string }; imeiStatus?: string }) {
  const { placement, user, location, imeiStatus } = context;

  const campaigns = await getCampaignsByPlacement(placement ?? '');

  const targetedCampaigns = campaigns.filter((campaign: CampaignDoc) => {
    const targeting = campaign.targeting;

    if (targeting.locations?.length && location?.country && !targeting.locations.includes(location.country)) {
      return false;
    }

    if (targeting.userRoles?.length && user?.role && !targeting.userRoles.includes(user.role)) {
      return false;
    }

    if (targeting.imeiStatuses?.length && imeiStatus && !targeting.imeiStatuses.includes(imeiStatus)) {
      return false;
    }

    if (campaign.metrics.spend >= campaign.budget.total) {
      return false;
    }

    if (campaign.metrics.spend >= campaign.budget.daily) {
      return false;
    }

    return true;
  });

  targetedCampaigns.sort((a: CampaignDoc, b: CampaignDoc) => b.bidding.currentBid - a.bidding.currentBid);

  return targetedCampaigns[0] || null;
}

export async function deliverAd(campaignId: string, context: Record<string, unknown>) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Track impression
  await trackAdEvent({
    campaignId,
    type: "impression",
    context,
  });

  // Select creative (rotate through creatives)
  const c = campaign as unknown as CampaignEditable;
  const creativeIndex = c.metrics.impressions % c.creatives.length;
  const creative = c.creatives[creativeIndex];

  return {
    campaignId,
    creative,
    trackingPixel: `/api/ads/track/${campaignId}/impression`,
  };
}

// ── Campaign Optimization ─────────────────────────────────────────────────────────
export async function optimizeCampaign(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const c = campaign as unknown as CampaignEditable;
  if (!c.optimization.autoOptimize) {
    throw new Error("Auto-optimization is not enabled for this campaign");
  }

  // Get recent performance data
  const recentEvents = await AdEvent.find({
    campaign: campaignId,
    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  }).lean() as unknown as AdEventDoc[];

  const impressions = recentEvents.filter((e: AdEventDoc) => e.type === "impression").length;
  const clicks = recentEvents.filter((e: AdEventDoc) => e.type === "click").length;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  // Adjust bid based on performance
  if (ctr > 2) {
    c.bidding.currentBid = Math.min(
      c.bidding.currentBid * 1.1,
      c.bidding.maxBid
    );
  } else if (ctr < 0.5) {
    c.bidding.currentBid = Math.max(
      c.bidding.currentBid * 0.9,
      c.bidding.maxBid * 0.5
    );
  }

  c.optimization.lastOptimized = new Date();
  campaign.updatedAt = new Date();
  await campaign.save();

  return campaign;
}

export async function enableAutoOptimization(campaignId: string) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const c = campaign as unknown as CampaignEditable;
  c.optimization.autoOptimize = true;
  c.optimization.learningModel = "v1";
  c.optimization.lastOptimized = new Date();
  await campaign.save();

  return campaign;
}

// ── Revenue & Analytics ───────────────────────────────────────────────────────────
export async function getCampaignAnalytics(campaignId: string, period = "7d") {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const startDate = new Date();
  if (period === "7d") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === "90d") {
    startDate.setDate(startDate.getDate() - 90);
  }

  const events = await AdEvent.find({
    campaign: campaignId,
    timestamp: { $gte: startDate },
  }).lean() as unknown as AdEventDoc[];

  const impressions = events.filter((e: AdEventDoc) => e.type === "impression").length;
  const clicks = events.filter((e: AdEventDoc) => e.type === "click").length;
  const conversions = events.filter((e: AdEventDoc) => e.type === "conversion").length;
  const totalRevenue = events.reduce((sum: number, e: AdEventDoc) => sum + (e.revenue || 0), 0);
  const flaggedEvents = events.filter((e: AdEventDoc) => e.flagged).length;

  const dailyData: Record<string, { impressions: number; clicks: number; conversions: number; revenue: number }> = {};
  events.forEach((event: AdEventDoc) => {
    const date = event.timestamp.toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    dailyData[date][event.type === "impression" ? "impressions" : 
                   event.type === "click" ? "clicks" : "conversions"]++;
    dailyData[date].revenue += event.revenue || 0;
  });

  return {
    period,
    startDate,
    endDate: new Date(),
    summary: {
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0,
      conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0,
      totalRevenue,
      avgCpc: clicks > 0 ? (totalRevenue / clicks).toFixed(2) : 0,
      fraudRate: events.length > 0 ? ((flaggedEvents / events.length) * 100).toFixed(2) : 0,
    },
    dailyBreakdown: Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    })),
  };
}

export async function getPlatformRevenue(period = "month") {
  const startDate = new Date();
  if (period === "month") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  const events = await AdEvent.find({
    type: "conversion",
    timestamp: { $gte: startDate },
    flagged: false,
  }).lean() as unknown as AdEventDoc[];

  const totalRevenue = events.reduce((sum: number, e: AdEventDoc) => sum + (e.revenue || 0), 0);

  // Revenue by campaign
  const revenueByCampaign = await AdEvent.aggregate([
    {
      $match: {
        type: "conversion",
        timestamp: { $gte: startDate },
        flagged: false,
      },
    },
    {
      $group: {
        _id: "$campaign",
        revenue: { $sum: "$revenue" },
        conversions: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  return {
    period,
    startDate,
    endDate: new Date(),
    totalRevenue,
    totalConversions: events.length,
    topCampaigns: revenueByCampaign,
  };
}

// ── Ad Board Statistics ─────────────────────────────────────────────────────────
export async function getAdBoardStatistics() {
  const [
    totalCampaigns,
    activeCampaigns,
    pendingCampaigns,
    pausedCampaigns,
    completedCampaigns,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalRevenue,
    activeAdvertisers,
  ] = await Promise.all([
    AdCampaign.countDocuments(),
    AdCampaign.countDocuments({ status: "active" }),
    AdCampaign.countDocuments({ status: "pending" }),
    AdCampaign.countDocuments({ status: "paused" }),
    AdCampaign.countDocuments({ status: "completed" }),
    AdEvent.countDocuments({ type: "impression", flagged: false }),
    AdEvent.countDocuments({ type: "click", flagged: false }),
    AdEvent.countDocuments({ type: "conversion", flagged: false }),
    AdEvent.aggregate([
      { $match: { type: "conversion", flagged: false } },
      { $group: { _id: null, total: { $sum: "$revenue" } } },
    ]),
    AdCampaign.distinct("advertiser").then((ids: string[]) => ids.length),
  ]);

  const avgCtr = totalImpressions > 0 
    ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
    : 0;

  return {
    totalCampaigns,
    activeCampaigns,
    pendingCampaigns,
    pausedCampaigns,
    completedCampaigns,
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCtr,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeAdvertisers,
  };
}
