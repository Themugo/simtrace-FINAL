import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { AuditLog } from "../db/index.js";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/audit-logs — get audit logs (admin only)
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.string().optional(),
    });
    const { userId, action, resource, startDate, endDate, limit } = schema.parse(req.query);

    const query: Record<string, unknown> = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string) || 100)
      .populate("userId", "name email");

    res.json({ logs, total: logs.length });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/audit-logs/statistics — get audit log statistics (admin only)
router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalLogs,
      successLogs,
      failureLogs,
      logsByAction,
      logsByResource,
      logsByUser,
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ success: true }),
      AuditLog.countDocuments({ success: false }),
      AuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
      ]),
    ]);

    res.json({
      totalLogs,
      successLogs,
      failureLogs,
      successRate: totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(2) : 0,
      logsByAction: logsByAction.map((l) => ({ action: l._id, count: l.count })),
      logsByResource: logsByResource.map((l) => ({ resource: l._id, count: l.count })),
      logsByUser: logsByUser.map((l) => ({ 
        userId: l._id, 
        userName: l.user?.name || "Unknown",
        userEmail: l.user?.email || "Unknown",
        count: l.count 
      })),
    });
  } catch (err) { next(err); }
});

// GET /api/audit-logs/export — export audit logs as CSV (admin only)
router.get("/export", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    });
    const { startDate, endDate } = schema.parse(req.query);

    const query: Record<string, unknown> = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10000)
      .populate("userId", "name email");

    const header = "Timestamp,User,Email,Action,Resource,Method,Path,IP,Success,StatusCode\n";
    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      (log.userId as any)?.name || "System",
      (log.userId as any)?.email || "",
      log.action,
      log.resource,
      log.method,
      log.path,
      log.ip || "",
      log.success,
      log.statusCode || "",
    ].join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(header + rows);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
