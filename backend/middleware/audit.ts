// middleware/audit.ts - Audit Log & Compliance Middleware
// Logs all user actions for compliance and security auditing

import { Request, Response, NextFunction } from 'express';
import { AuditLog } from "../db/index.js";

export async function auditLog(req: Request, res: Response, next: NextFunction) {
  // Store original res.json to intercept responses
  const originalJson = res.json;

  res.json = function(data: Record<string, unknown>) {
    // Log the response after it's sent
    setImmediate(async () => {
      try {
        const userId = (req as any).user?.id || null;
        const userEmail = (req as any).user?.email || null;
        const userRole = (req as any).user?.role || null;

        // Determine action based on method and path
        const action = getActionFromRequest(req);
        const resource = getResourceFromPath(req.path);
        const resourceId = getResourceIdFromPath(req.path);

        // Log the audit entry
        await AuditLog.create({
          userId,
          action,
          resource,
          resourceId,
          method: req.method,
          path: req.path,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.get("user-agent"),
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          errorMessage: res.statusCode >= 400 ? ((data?.error || data?.message) as string) : undefined,
          metadata: {
            userEmail,
            userRole,
          },
          timestamp: new Date(),
        });
      } catch (err) {
        console.error("Audit log error:", err);
      }
    });

    // Call original json
    return originalJson.call(this, data);
  };

  next();
}

function getActionFromRequest(req: Request): string {
  const method = req.method;
  const path = req.path;

  if (method === "GET") return "read";
  if (method === "POST") return "create";
  if (method === "PUT" || method === "PATCH") return "update";
  if (method === "DELETE") return "delete";

  // More specific actions based on path
  if (path.includes("/login")) return "login";
  if (path.includes("/logout")) return "logout";
  if (path.includes("/register")) return "register";
  if (path.includes("/password")) return "password_change";

  return method.toLowerCase();
}

function getResourceFromPath(path: string): string {
  // Extract resource from path
  const segments = path.split("/").filter(s => s);
  if (segments.length === 0) return "system";

  // Skip API prefix
  if (segments[0] === "api") {
    if (segments[1]) return segments[1];
  }

  return segments[0];
}

function getResourceIdFromPath(path: string): string | null {
  // Extract ID from path (e.g., /api/devices/123)
  const segments = path.split("/").filter(s => s);
  const lastSegment = segments[segments.length - 1];

  // Check if last segment is a MongoDB ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(lastSegment)) {
    return lastSegment;
  }

  return null;
}

// ── Compliance Check Middleware ─────────────────────────────────────────────────
export function complianceCheck(req: Request, _res: Response, next: NextFunction) {
  // Add compliance metadata to request
  (req as any).compliance = {
    checked: true,
    region: detectRegion(req),
    gdprApplies: isGdprRegion(req),
    dataRetention: 365, // days
  };

  next();
}

function detectRegion(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress;
  // Simplified region detection
  if (ip?.startsWith("192.168.") || ip?.startsWith("10.") || ip?.startsWith("172.")) {
    return "local";
  }
  return "unknown";
}

function isGdprRegion(req: Request): boolean {
  // Simplified GDPR region check
  const region = detectRegion(req);
  const gdprRegions = ["EU", "GB", "DE", "FR", "IT", "ES"];
  return gdprRegions.includes(region);
}

// ── Sensitive Action Logging ────────────────────────────────────────────────────
export async function logSensitiveAction(data: Record<string, unknown>) {
  const userId = data.userId as string;
  const userEmail = data.userEmail as string;
  const userRole = data.userRole as string;
  const action = data.action as string;
  const resource = data.resource as string;
  const resourceId = data.resourceId as string | undefined;
  const changes = data.changes as Record<string, unknown> | undefined;
  const ipAddress = data.ipAddress as string;
  const userAgent = data.userAgent as string | undefined;

  await AuditLog.create({
    userId,
    action,
    resource,
    resourceId,
    method: "SENSITIVE",
    path: "sensitive_action",
    ip: ipAddress,
    userAgent,
    success: true,
    metadata: {
      userEmail,
      userRole,
      changes,
      complianceCheck: true,
      complianceNotes: "Sensitive action logged for compliance",
    },
    timestamp: new Date(),
  });
}

// ── Audit Log Query Helpers ─────────────────────────────────────────────────────
export async function getAuditLogsByUser(userId: string, limit: number = 100): Promise<any[]> {
  const logs = await AuditLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);

  return logs;
}

export async function getAuditLogsByAction(action: string, limit: number = 100): Promise<any[]> {
  const logs = await AuditLog.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit);

  return logs;
}

export async function getAuditLogsByResource(resource: string, limit: number = 100): Promise<any[]> {
  const logs = await AuditLog.find({ resource })
    .sort({ timestamp: -1 })
    .limit(limit);

  return logs;
}

export async function getAuditLogsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
  const logs = await AuditLog.find({
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .sort({ timestamp: -1 });

  return logs;
}

export async function getFailedAuditLogs(limit: number = 100): Promise<any[]> {
  const logs = await AuditLog.find({ success: false })
    .sort({ timestamp: -1 })
    .limit(limit);

  return logs;
}

export async function getAuditStatistics() {
  const [
    totalLogs,
    successLogs,
    failureLogs,
    unauthorizedLogs,
    logsByAction,
    logsByResource,
    logsByUser,
  ] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.countDocuments({ status: "success" }),
    AuditLog.countDocuments({ status: "failure" }),
    AuditLog.countDocuments({ status: "unauthorized" }),
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
    ]),
  ]);

  return {
    totalLogs,
    successLogs,
    failureLogs,
    unauthorizedLogs,
    successRate: totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(2) : 0,
    logsByAction: logsByAction.map((l) => ({ action: l._id, count: l.count })),
    logsByResource: logsByResource.map((l) => ({ resource: l._id, count: l.count })),
    logsByUser: logsByUser.map((l) => ({ userId: l._id, count: l.count })),
  };
}
