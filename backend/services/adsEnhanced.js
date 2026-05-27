// services/adsEnhanced.js - Enhanced Advertisement Board
// Advanced monetization and partnership platform

import { AdCampaign, AdEvent, User, WhiteLabelInstance } from "../db/index.js";

// ── Campaign Management ─────────────────────────────────────────────────────────────
export async function createAdCampaign(data) {
  const {
    name,
    advertiser,
    whiteLabel,
    budget,
    bidding,
    targeting,
    creatives,
    placements,
    schedule,
  } = data;

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

export async function submitCampaignForReview(campaignId) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (campaign.status !== "draft") {
    throw new Error("Only draft campaigns can be submitted");
  }

  campaign.status = "pending";
  campaign.submittedAt = new Date();
  await campaign.save();

  return campaign;
}

export async function reviewCampaign(campaignId, approved, rejectionReason = null) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (campaign.status !== "pending") {
    throw new Error("Only pending campaigns can be reviewed");
  }

  campaign.status = approved ? "active" : "rejected";
  campaign.reviewedAt = new Date();
  campaign.rejectionReason = rejectionReason;

  if (approved) {
    campaign.schedule.startDate = campaign.schedule.startDate || new Date();
  }

  await campaign.save();

  return campaign;
}

export async function updateCampaignStatus(campaignId, status) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  const validTransitions = {
    draft: ["pending", "paused"],
    pending: ["active", "rejected"],
    active: ["paused", "completed", "exhausted"],
    paused: ["active"],
    rejected: [],
    completed: [],
    exhausted: [],
  };

  if (!validTransitions[campaign.status].includes(status)) {
    throw new Error(`Invalid status transition from ${campaign.status} to ${status}`);
  }

  campaign.status = status;
  campaign.updatedAt = new Date();
  await campaign.save();

  return campaign;
}

// ── Ad Event Tracking ─────────────────────────────────────────────────────────────
export async function trackAdEvent(data) {
  const {
    campaignId,
    creativeId,
    userId,
    whiteLabelId,
    type,
    context,
    attribution,
    revenue,
  } = data;

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
    await updateCampaignMetrics(campaignId, type, revenue);
  }

  return event;
}

function calculateFraudScore({ type, context, userId }) {
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

async function updateCampaignMetrics(campaignId, eventType, revenue) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) return;

  switch (eventType) {
    case "impression":
      campaign.metrics.impressions += 1;
      break;
    case "click":
      campaign.metrics.clicks += 1;
      break;
    case "conversion":
      campaign.metrics.conversions += 1;
      if (revenue) {
        campaign.metrics.spend += revenue;
      }
      break;
  }

  // Recalculate derived metrics
  if (campaign.metrics.impressions > 0) {
    campaign.metrics.ctr = (campaign.metrics.clicks / campaign.metrics.impressions) * 100;
  }

  if (campaign.metrics.conversions > 0 && campaign.metrics.spend > 0) {
    campaign.metrics.cpa = campaign.metrics.spend / campaign.metrics.conversions;
  }

  // Check budget exhaustion
  if (campaign.metrics.spend >= campaign.budget.total) {
    campaign.status = "exhausted";
  }

  campaign.updatedAt = new Date();
  await campaign.save();
}

// ── Campaign Queries ─────────────────────────────────────────────────────────────
export async function getCampaign(campaignId) {
  const campaign = await AdCampaign.findById(campaignId)
    .populate("advertiser", "name email")
    .populate("whiteLabel");

  return campaign;
}

export async function getCampaignsByAdvertiser(advertiserId) {
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

export async function getCampaignsByPlacement(placementType) {
  const campaigns = await AdCampaign.find({
    status: "active",
    "placements.type": placementType,
  })
    .populate("advertiser")
    .sort({ "bidding.currentBid": -1 });

  return campaigns;
}

// ── Ad Selection & Delivery ───────────────────────────────────────────────────────
export async function selectAdForPlacement(context) {
  const { placement, user, location, imeiStatus } = context;

  // Get active campaigns for this placement
  const campaigns = await getCampaignsByPlacement(placement);

  // Filter by targeting
  const targetedCampaigns = campaigns.filter(campaign => {
    const targeting = campaign.targeting;

    // Location targeting
    if (targeting.locations?.length > 0) {
      if (!location || !targeting.locations.includes(location.country)) {
        return false;
      }
    }

    // User role targeting
    if (targeting.userRoles?.length > 0) {
      if (!user || !targeting.userRoles.includes(user.role)) {
        return false;
      }
    }

    // IMEI status targeting
    if (targeting.imeiStatuses?.length > 0) {
      if (!imeiStatus || !targeting.imeiStatuses.includes(imeiStatus)) {
        return false;
      }
    }

    // Budget check
    if (campaign.metrics.spend >= campaign.budget.total) {
      return false;
    }

    // Daily budget check
    if (campaign.metrics.spend >= campaign.budget.daily) {
      return false;
    }

    return true;
  });

  // Sort by bid (simplified - in production, use more sophisticated auction)
  targetedCampaigns.sort((a, b) => b.bidding.currentBid - a.bidding.currentBid);

  // Return top campaign
  return targetedCampaigns[0] || null;
}

export async function deliverAd(campaignId, context) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  // Track impression
  await trackAdEvent({
    campaignId,
    type: "impression",
    context,
  });

  // Select creative (rotate through creatives)
  const creativeIndex = campaign.metrics.impressions % campaign.creatives.length;
  const creative = campaign.creatives[creativeIndex];

  return {
    campaignId,
    creative,
    trackingPixel: `/api/ads/track/${campaignId}/impression`,
  };
}

// ── Campaign Optimization ─────────────────────────────────────────────────────────
export async function optimizeCampaign(campaignId) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  if (!campaign.optimization.autoOptimize) {
    throw new Error("Auto-optimization is not enabled for this campaign");
  }

  // Get recent performance data
  const recentEvents = await AdEvent.find({
    campaign: campaignId,
    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  const impressions = recentEvents.filter(e => e.type === "impression").length;
  const clicks = recentEvents.filter(e => e.type === "click").length;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  // Adjust bid based on performance
  if (ctr > 2) {
    // Good performance, increase bid
    campaign.bidding.currentBid = Math.min(
      campaign.bidding.currentBid * 1.1,
      campaign.bidding.maxBid
    );
  } else if (ctr < 0.5) {
    // Poor performance, decrease bid
    campaign.bidding.currentBid = Math.max(
      campaign.bidding.currentBid * 0.9,
      campaign.bidding.maxBid * 0.5
    );
  }

  campaign.optimization.lastOptimized = new Date();
  campaign.updatedAt = new Date();
  await campaign.save();

  return campaign;
}

export async function enableAutoOptimization(campaignId) {
  const campaign = await AdCampaign.findById(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  campaign.optimization.autoOptimize = true;
  campaign.optimization.learningModel = "v1";
  campaign.optimization.lastOptimized = new Date();
  await campaign.save();

  return campaign;
}

// ── Revenue & Analytics ───────────────────────────────────────────────────────────
export async function getCampaignAnalytics(campaignId, period = "7d") {
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
  });

  const impressions = events.filter(e => e.type === "impression").length;
  const clicks = events.filter(e => e.type === "click").length;
  const conversions = events.filter(e => e.type === "conversion").length;
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const flaggedEvents = events.filter(e => e.flagged).length;

  // Daily breakdown
  const dailyData = {};
  events.forEach(event => {
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
  });

  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);

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
    AdCampaign.distinct("advertiser").then(ids => ids.length),
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
