import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import { Device, Alert, Ping, Partner } from "../db/index.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/telecom-analytics/overview — telecom analytics overview
router.get("/overview", authenticate, requireRole("telecom"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ user: req.user!.id });
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ error: "Not an active telecom partner" });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get fraud pattern stats
    const fraudAlerts = await Alert.countDocuments({
      type: "fraud_pattern",
      ts: { $gte: thirtyDaysAgo }
    });

    const simSwapAlerts = await Alert.countDocuments({
      type: "sim_swap",
      ts: { $gte: thirtyDaysAgo }
    });

    const theftReports = await Alert.countDocuments({
      type: "theft_report",
      ts: { $gte: thirtyDaysAgo }
    });

    // Get blacklist stats
    const blacklistedDevices = await Device.countDocuments({
      status: "blacklisted",
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get geographic distribution
    const pings = await Ping.find({
      ts: { $gte: thirtyDaysAgo }
    }).select("lat lng ts");

    // Group by region (simplified - in production use proper geospatial aggregation)
    const regionCounts: Record<string, number> = {};
    pings.forEach(ping => {
      const lat = Math.floor(ping.lat);
      const lng = Math.floor(ping.lng);
      const region = `${lat},${lng}`;
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    // Get daily trend data
    const dailyTrend: Array<{ date: string; fraud: number; simSwap: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayFraud = await Alert.countDocuments({
        type: "fraud_pattern",
        ts: { $gte: dayStart, $lte: dayEnd }
      });

      const daySimSwap = await Alert.countDocuments({
        type: "sim_swap",
        ts: { $gte: dayStart, $lte: dayEnd }
      });

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        fraud: dayFraud,
        simSwap: daySimSwap,
      });
    }

    res.json({
      overview: {
        totalFraudAlerts: fraudAlerts,
        totalSimSwaps: simSwapAlerts,
        totalTheftReports: theftReports,
        totalBlacklisted: blacklistedDevices,
        apiCallsThisMonth: partner.apiCallsMonth,
        apiCallsLimit: partner.apiCallsLimit,
      },
      geographic: {
        hotspots: Object.entries(regionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([region, count]) => ({
            region,
            count,
            lat: parseFloat(region.split(',')[0]),
            lng: parseFloat(region.split(',')[1]),
          })),
      },
      trends: {
        daily: dailyTrend,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/telecom-analytics/fraud-patterns — fraud pattern analysis
router.get("/fraud-patterns", authenticate, requireRole("telecom"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ user: req.user!.id });
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ error: "Not an active telecom partner" });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get fraud patterns by type
    const fraudAlerts = await Alert.find({
      type: "fraud_pattern",
      ts: { $gte: thirtyDaysAgo }
    }).select("payload ts");

    // Analyze patterns
    const patternTypes: Record<string, number> = {};
    fraudAlerts.forEach(alert => {
      const pattern = alert.payload?.pattern || "unknown";
      patternTypes[pattern] = (patternTypes[pattern] || 0) + 1;
    });

    // Get top fraud patterns
    const topPatterns = Object.entries(patternTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    res.json({
      totalFraudPatterns: fraudAlerts.length,
      topPatterns,
      recentFraudAlerts: fraudAlerts.slice(-10).map(alert => ({
        type: alert.payload?.pattern,
        severity: alert.payload?.severity,
        timestamp: alert.ts,
      })),
    });
  } catch (err) { next(err); }
});

// GET /api/telecom-analytics/sim-swaps — SIM swap trend analysis
router.get("/sim-swaps", authenticate, requireRole("telecom"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ user: req.user!.id });
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ error: "Not an active telecom partner" });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get SIM swap alerts
    const simSwapAlerts = await Alert.find({
      type: "sim_swap",
      ts: { $gte: thirtyDaysAgo }
    }).select("payload ts");

    // Group by network operator
    const networkCounts: Record<string, number> = {};
    simSwapAlerts.forEach(alert => {
      const network = alert.payload?.networkOp || "unknown";
      networkCounts[network] = (networkCounts[network] || 0) + 1;
    });

    // Get daily trend
    const dailyTrend: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayCount = await Alert.countDocuments({
        type: "sim_swap",
        ts: { $gte: dayStart, $lte: dayEnd }
      });

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        count: dayCount,
      });
    }

    res.json({
      totalSimSwaps: simSwapAlerts.length,
      byNetwork: Object.entries(networkCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([network, count]) => ({ network, count })),
      dailyTrend,
      recentSwaps: simSwapAlerts.slice(-10).map(alert => ({
        network: alert.payload?.networkOp,
        previousIccid: alert.payload?.previousIccid,
        newIccid: alert.payload?.newIccid,
        timestamp: alert.ts,
      })),
    });
  } catch (err) { next(err); }
});

// GET /api/telecom-analytics/geographic — geographic heatmap data
router.get("/geographic", authenticate, requireRole("telecom"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findOne({ user: req.user!.id });
    if (!partner || partner.status !== "active") {
      return res.status(403).json({ error: "Not an active telecom partner" });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get stolen device locations
    const stolenDevices = await Device.find({
      status: "stolen",
      createdAt: { $gte: thirtyDaysAgo }
    }).select("imei createdAt");

    // Get recent pings for stolen devices
    const imeis = stolenDevices.map(d => d.imei);
    const recentPings = await Ping.find({
      imei: { $in: imeis },
      ts: { $gte: thirtyDaysAgo }
    }).select("lat lng imei ts");

    // Group by region (grid-based for heatmap)
    const gridSize = 0.5; // degrees
    const heatmapData: Record<string, { lat: number; lng: number; count: number }> = {};

    recentPings.forEach(ping => {
      const latGrid = Math.floor(ping.lat / gridSize) * gridSize;
      const lngGrid = Math.floor(ping.lng / gridSize) * gridSize;
      const key = `${latGrid.toFixed(2)},${lngGrid.toFixed(2)}`;

      if (!heatmapData[key]) {
        heatmapData[key] = { lat: latGrid, lng: lngGrid, count: 0 };
      }
      heatmapData[key].count++;
    });

    // Convert to array and sort by count
    const heatmapArray = Object.values(heatmapData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);

    res.json({
      totalStolenDevices: stolenDevices.length,
      totalRecentPings: recentPings.length,
      heatmap: heatmapArray,
    });
  } catch (err) { next(err); }
});

export default router;
