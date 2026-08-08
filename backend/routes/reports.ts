import { Router, Request, Response, NextFunction } from "express";
import { } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { Device, User, Partner, TheftReport, Alert, Subscription } from "../db/index.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── GET /api/reports/stats — Get real statistics for reports tab ─────────────────────
router.get("/stats", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalDevices,
      activeDevices,
      stolenDevices,
      recoveredDevices,
      totalPartners,
      activePartners,
      pendingPartners,
      totalUsers,
      activeSubscriptions,
      totalTheftReports,
      openTheftReports,
      resolvedTheftReports,
      recentAlerts,
    ] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'active' }),
      Device.countDocuments({ status: 'stolen' }),
      Device.countDocuments({ status: 'recovered' }),
      Partner.countDocuments(),
      Partner.countDocuments({ status: 'approved' }),
      Partner.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      TheftReport.countDocuments(),
      TheftReport.countDocuments({ status: { $in: ['open', 'investigating'] } }),
      TheftReport.countDocuments({ status: 'recovered' }),
      Alert.countDocuments({ read: false }),
    ]);

    // Get device trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const devicesLast30Days = await Device.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const theftReportsLast30Days = await TheftReport.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      devices: {
        total: totalDevices,
        active: activeDevices,
        stolen: stolenDevices,
        recovered: recoveredDevices,
        newLast30Days: devicesLast30Days,
      },
      partners: {
        total: totalPartners,
        active: activePartners,
        pending: pendingPartners,
      },
      users: {
        total: totalUsers,
        activeSubscriptions: activeSubscriptions,
      },
      theftReports: {
        total: totalTheftReports,
        open: openTheftReports,
        resolved: resolvedTheftReports,
        newLast30Days: theftReportsLast30Days,
      },
      alerts: {
        unread: recentAlerts,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/reports/devices — Get device statistics breakdown ───────────────────────
router.get("/devices", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const devicesByStatus = await Device.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const devicesByMake = await Device.aggregate([
      { $group: { _id: "$make", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentDevices = await Device.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('owner', 'name email')
      .lean();

    res.json({
      byStatus: devicesByStatus,
      byMake: devicesByMake,
      recent: recentDevices,
    });
  } catch (err) { next(err); }
});

// ── GET /api/reports/theft — Get theft report statistics ─────────────────────────────
router.get("/theft", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const theftReportsByStatus = await TheftReport.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const recentTheftReports = await TheftReport.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reportedBy', 'name email')
      .lean();

    // Recovery rate calculation
    const total = await TheftReport.countDocuments();
    const recovered = await TheftReport.countDocuments({ status: 'recovered' });
    const recoveryRate = total > 0 ? ((recovered / total) * 100).toFixed(1) : '0.0';

    res.json({
      byStatus: theftReportsByStatus,
      recent: recentTheftReports,
      recoveryRate: parseFloat(recoveryRate),
    });
  } catch (err) { next(err); }
});

// ── GET /api/reports/partners — Get partner statistics ───────────────────────────────
router.get("/partners", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partnersByType = await Partner.aggregate([
      { $group: { _id: "$orgType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const partnersByStatus = await Partner.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const recentPartners = await Partner.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .lean();

    res.json({
      byType: partnersByType,
      byStatus: partnersByStatus,
      recent: recentPartners,
    });
  } catch (err) { next(err); }
});

// ── GET /api/reports/alerts — Get alert statistics ───────────────────────────────────
router.get("/alerts", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const alertsByType = await Alert.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentAlerts = await Alert.find()
      .sort({ ts: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Alert.countDocuments({ read: false });

    res.json({
      byType: alertsByType,
      recent: recentAlerts,
      unreadCount,
    });
  } catch (err) { next(err); }
});

// ── GET /api/reports/admin/summary — Admin: Get comprehensive report summary ─────────
router.get("/admin/summary", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ message: "Summary endpoint" });
  } catch (err) { next(err); }
});

export default router;

