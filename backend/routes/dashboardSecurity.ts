// routes/dashboardSecurity.ts - Hierarchical Security Dashboard API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createOfficialEmail,
  verifyOfficialEmail,
  getOfficialEmail,
  getOfficialEmailByUser,
  updateOfficialEmail,
  revokeOfficialEmail,
  createSecurityOtp,
  verifySecurityOtp,
  getSecurityOtp,
  getSecurityOtpByUser,
  updateSecurityOtp,
  reportLostOtp,
  initiatePasswordReset,
  verifyPasswordReset,
  approvePasswordReset,
  rejectPasswordReset,
  completePasswordReset,
  getPasswordResetRequest,
  getPasswordResetRequestsByUser,
  initiateNetworkChange,
  verifyNetworkChange,
  approveNetworkChange,
  rejectNetworkChange,
  executeNetworkChange,
  rollbackNetworkChange,
  getNetworkChangeRequest,
  getNetworkChangeRequestsByAgency,
  logDashboardAccess,
  getDashboardAccessLogs,
  getDashboardAccessLogsByLevel,
  getSuspiciousActivityLogs,
  createMinisterDashboard,
  getMinisterDashboard,
  updateMinisterDashboard,
  createPoliceGeneralDashboard,
  getPoliceGeneralDashboard,
  updatePoliceGeneralDashboard,
  createStationAdminDashboard,
  getStationAdminDashboard,
  updateStationAdminDashboard,
  createUserDashboard,
  getUserDashboard,
  updateUserDashboard,
  checkDashboardAccess,
  getDashboardStatistics,
} from "../services/dashboardSecurity.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Official Email Management ───────────────────────────────────────────────────────
router.post("/official-emails", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      officialEmail: z.string().email(),
      holderName: z.string(),
      holderPosition: z.string(),
      agencyId: z.string(),
      hierarchyUnitId: z.string(),
      countryCode: z.string(),
    });

    const data = schema.parse(req.body);
    const officialEmail = await createOfficialEmail({ ...data, createdBy: req.user!.id });
    res.status(201).json(officialEmail);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/official-emails/:emailId/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      token: z.string(),
    });

    const { emailId } = req.params;
    const data = schema.parse(req.body);
    const officialEmail = await verifyOfficialEmail(emailId, data.token);
    res.json(officialEmail);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/official-emails/:emailId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.params;
    const officialEmail = await getOfficialEmail(emailId);
    res.json(officialEmail);
  } catch (err) { next(err); }
});

router.get("/official-emails/user/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const officialEmail = await getOfficialEmailByUser(userId);
    res.json(officialEmail);
  } catch (err) { next(err); }
});

router.patch("/official-emails/:emailId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.params;
    const officialEmail = await updateOfficialEmail(emailId, req.body, req.user!.id);
    res.json(officialEmail);
  } catch (err) { next(err); }
});

router.post("/official-emails/:emailId/revoke", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { emailId } = req.params;
    const officialEmail = await revokeOfficialEmail(emailId, req.user!.id);
    res.json(officialEmail);
  } catch (err) { next(err); }
});

// ── Security OTP Management ─────────────────────────────────────────────────────────
router.post("/security-otps", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      holderName: z.string(),
      holderPosition: z.string(),
      agencyId: z.string(),
      hierarchyUnitId: z.string(),
      countryCode: z.string(),
      isHardwareToken: z.boolean().optional(),
      tokenSerial: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const securityOtp = await createSecurityOtp({ ...data, createdBy: req.user!.id });
    res.status(201).json(securityOtp);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/security-otps/:otpId/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      otpNumber: z.string(),
    });

    const { otpId } = req.params;
    const data = schema.parse(req.body);
    const securityOtp = await verifySecurityOtp(otpId, data.otpNumber);
    res.json(securityOtp);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/security-otps/:otpId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { otpId } = req.params;
    const securityOtp = await getSecurityOtp(otpId);
    res.json(securityOtp);
  } catch (err) { next(err); }
});

router.get("/security-otps/user/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const securityOtp = await getSecurityOtpByUser(userId);
    res.json(securityOtp);
  } catch (err) { next(err); }
});

router.patch("/security-otps/:otpId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { otpId } = req.params;
    const securityOtp = await updateSecurityOtp(otpId, req.body, req.user!.id);
    res.json(securityOtp);
  } catch (err) { next(err); }
});

router.post("/security-otps/:otpId/report-lost", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { otpId } = req.params;
    const securityOtp = await reportLostOtp(otpId, req.user!.id);
    res.json(securityOtp);
  } catch (err) { next(err); }
});

// ── Password Reset Workflow ─────────────────────────────────────────────────────────
router.post("/password-resets", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      requesterId: z.string(),
      verificationMethod: z.enum(["official_email", "security_otp", "both"]),
      reason: z.string(),
      notes: z.string().optional(),
      ipAddress: z.string(),
      userAgent: z.string(),
    });

    const data = schema.parse(req.body);
    const resetRequest = await initiatePasswordReset(data);
    res.status(201).json(resetRequest);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/password-resets/:requestId/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      verificationMethod: z.enum(["official_email", "security_otp", "both"]),
      code: z.string().optional(),
      otpNumber: z.string().optional(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const resetRequest = await verifyPasswordReset(requestId, data.verificationMethod, data.code, data.otpNumber);
    res.json(resetRequest);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/password-resets/:requestId/approve", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      approvalReason: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const resetRequest = await approvePasswordReset(requestId, req.user!.id, data.approvalReason);
    res.json(resetRequest);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/password-resets/:requestId/reject", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rejectionReason: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const resetRequest = await rejectPasswordReset(requestId, req.user!.id, data.rejectionReason);
    res.json(resetRequest);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/password-resets/:requestId/complete", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      newPassword: z.string().min(8),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const resetRequest = await completePasswordReset(requestId, data.newPassword);
    res.json(resetRequest);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/password-resets/:requestId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const resetRequest = await getPasswordResetRequest(requestId);
    res.json(resetRequest);
  } catch (err) { next(err); }
});

router.get("/password-resets/user/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const resetRequests = await getPasswordResetRequestsByUser(userId);
    res.json({ resetRequests, count: resetRequests.length });
  } catch (err) { next(err); }
});

// ── Network Change Workflow ────────────────────────────────────────────────────────
router.post("/network-changes", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      requesterId: z.string(),
      currentProvider: z.string(),
      currentConfig: z.any(),
      newProvider: z.string(),
      newConfig: z.any(),
      changeReason: z.string(),
      expectedDowntimeStart: z.date().optional(),
      expectedDowntimeEnd: z.date().optional(),
      downtimeReason: z.string().optional(),
      approvalLevel: z.enum(["station", "region", "division", "national", "minister"]),
      verificationMethod: z.enum(["official_email", "security_otp", "both"]),
      agencyId: z.string(),
      hierarchyUnitId: z.string(),
      countryCode: z.string(),
      ipAddress: z.string(),
      userAgent: z.string(),
    });

    const data = schema.parse(req.body);
    const networkChange = await initiateNetworkChange(data);
    res.status(201).json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/network-changes/:requestId/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      verificationMethod: z.enum(["official_email", "security_otp", "both"]),
      otpNumber: z.string().optional(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const networkChange = await verifyNetworkChange(requestId, data.verificationMethod, data.otpNumber);
    res.json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/network-changes/:requestId/approve", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      approverEmailId: z.string().optional(),
      approverOtpId: z.string().optional(),
      comment: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const networkChange = await approveNetworkChange(requestId, req.user!.id, data.approverEmailId, data.approverOtpId, data.comment);
    res.json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/network-changes/:requestId/reject", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rejectionReason: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const networkChange = await rejectNetworkChange(requestId, req.user!.id, data.rejectionReason);
    res.json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/network-changes/:requestId/execute", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      executionLog: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const networkChange = await executeNetworkChange(requestId, req.user!.id, data.executionLog);
    res.json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/network-changes/:requestId/rollback", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rollbackReason: z.string(),
    });

    const { requestId } = req.params;
    const data = schema.parse(req.body);
    const networkChange = await rollbackNetworkChange(requestId, data.rollbackReason);
    res.json(networkChange);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/network-changes/:requestId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const networkChange = await getNetworkChangeRequest(requestId);
    res.json(networkChange);
  } catch (err) { next(err); }
});

router.get("/network-changes/agency/:agencyId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const networkChanges = await getNetworkChangeRequestsByAgency(agencyId);
    res.json({ networkChanges, count: networkChanges.length });
  } catch (err) { next(err); }
});

// ── Dashboard Access Logging ────────────────────────────────────────────────────────
router.post("/access-logs", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      dashboardLevel: z.enum(["minister", "police_general", "regional_commissioner", "division_commander", "station_oc", "station_admin", "user"]),
      accessType: z.enum(["login", "logout", "view", "action", "export", "admin"]),
      actionType: z.string().optional(),
      resourceType: z.string().optional(),
      resourceId: z.string().optional(),
      verifiedVia: z.enum(["official_email", "security_otp", "both", "none"]),
      emailVerified: z.boolean().optional(),
      otpVerified: z.boolean().optional(),
      sessionId: z.string().optional(),
      ipAddress: z.string(),
      userAgent: z.string(),
      location: z.object({
        country: z.string().optional(),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional(),
      agencyId: z.string().optional(),
      hierarchyUnitId: z.string().optional(),
      countryCode: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const accessLog = await logDashboardAccess(data);
    res.status(201).json(accessLog);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/access-logs/user/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const limit = parseInt((req.query.limit as string) || "50");
    const logs = await getDashboardAccessLogs(userId, limit);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

router.get("/access-logs/level/:dashboardLevel", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardLevel } = req.params;
    const limit = parseInt((req.query.limit as string) || "100");
    const logs = await getDashboardAccessLogsByLevel(dashboardLevel, limit);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

router.get("/access-logs/suspicious", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) || "50");
    const logs = await getSuspiciousActivityLogs(limit);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

// ── Minister Dashboard Management ─────────────────────────────────────────────────
router.post("/dashboards/minister", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      ministerId: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string().optional(),
      countryScope: z.array(z.string()).optional(),
      agencyScope: z.array(z.string()).optional(),
      widgets: z.array(z.object({
        type: z.enum(["national_statistics", "crime_trends", "agency_performance", "security_alerts", "pending_approvals", "network_status"]),
        position: z.number(),
        enabled: z.boolean().optional(),
        config: z.any().optional(),
      })).optional(),
      notifications: z.object({
        criticalAlerts: z.boolean().optional(),
        pendingApprovals: z.boolean().optional(),
        networkChanges: z.boolean().optional(),
        securityIncidents: z.boolean().optional(),
      }).optional(),
      allowedIPs: z.array(z.string()).optional(),
      allowedTimeRanges: z.array(z.object({
        dayOfWeek: z.array(z.number()),
        startTime: z.string(),
        endTime: z.string(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const dashboard = await createMinisterDashboard(data);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/dashboards/minister/:ministerId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ministerId } = req.params;
    const dashboard = await getMinisterDashboard(ministerId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/dashboards/minister/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateMinisterDashboard(dashboardId, req.body, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

// ── Police General Dashboard Management ───────────────────────────────────────────
router.post("/dashboards/police-general", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      policeGeneralId: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string().optional(),
      countryScope: z.array(z.string()).optional(),
      divisionScope: z.array(z.string()).optional(),
      widgets: z.array(z.object({
        type: z.enum(["division_statistics", "crime_trends", "station_performance", "officer_statistics", "pending_approvals", "security_alerts"]),
        position: z.number(),
        enabled: z.boolean().optional(),
        config: z.any().optional(),
      })).optional(),
      notifications: z.object({
        criticalAlerts: z.boolean().optional(),
        pendingApprovals: z.boolean().optional(),
        stationAlerts: z.boolean().optional(),
        officerIssues: z.boolean().optional(),
      }).optional(),
      allowedIPs: z.array(z.string()).optional(),
      allowedTimeRanges: z.array(z.object({
        dayOfWeek: z.array(z.number()),
        startTime: z.string(),
        endTime: z.string(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const dashboard = await createPoliceGeneralDashboard(data);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/dashboards/police-general/:policeGeneralId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { policeGeneralId } = req.params;
    const dashboard = await getPoliceGeneralDashboard(policeGeneralId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/dashboards/police-general/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updatePoliceGeneralDashboard(dashboardId, req.body, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

// ── Station Admin Dashboard Management ────────────────────────────────────────────
router.post("/dashboards/station-admin", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      stationAdminId: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string().optional(),
      stationId: z.string(),
      regionId: z.string().optional(),
      divisionId: z.string().optional(),
      widgets: z.array(z.object({
        type: z.enum(["station_statistics", "active_cases", "pending_reports", "officer_status", "evidence_management", "recovery_status"]),
        position: z.number(),
        enabled: z.boolean().optional(),
        config: z.any().optional(),
      })).optional(),
      notifications: z.object({
        newCases: z.boolean().optional(),
        caseUpdates: z.boolean().optional(),
        alerts: z.boolean().optional(),
        cooperationRequests: z.boolean().optional(),
      }).optional(),
      allowedIPs: z.array(z.string()).optional(),
      allowedTimeRanges: z.array(z.object({
        dayOfWeek: z.array(z.number()),
        startTime: z.string(),
        endTime: z.string(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const dashboard = await createStationAdminDashboard(data);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/dashboards/station-admin/:stationAdminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stationAdminId } = req.params;
    const dashboard = await getStationAdminDashboard(stationAdminId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/dashboards/station-admin/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateStationAdminDashboard(dashboardId, req.body, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

// ── User Dashboard Management ───────────────────────────────────────────────────────
router.post("/dashboards/user", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      officialEmailId: z.string().optional(),
      securityOtpId: z.string().optional(),
      role: z.enum(["investigator", "officer", "admin", "staff"]).optional(),
      stationId: z.string().optional(),
      widgets: z.array(z.object({
        type: z.enum(["my_cases", "assigned_tasks", "recent_activity", "notifications", "quick_actions"]),
        position: z.number(),
        enabled: z.boolean().optional(),
        config: z.any().optional(),
      })).optional(),
      notifications: z.object({
        caseAssignments: z.boolean().optional(),
        taskUpdates: z.boolean().optional(),
        alerts: z.boolean().optional(),
        messages: z.boolean().optional(),
      }).optional(),
    });

    const data = schema.parse(req.body);
    const dashboard = await createUserDashboard(data);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/dashboards/user/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const dashboard = await getUserDashboard(userId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/dashboards/user/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateUserDashboard(dashboardId, req.body, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

// ── Dashboard Access Control ────────────────────────────────────────────────────────
router.post("/dashboards/check-access", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      dashboardLevel: z.enum(["minister", "police_general", "regional_commissioner", "division_commander", "station_oc", "station_admin", "user"]),
      ipAddress: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await checkDashboardAccess(data.userId, data.dashboardLevel, data.ipAddress);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getDashboardStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
