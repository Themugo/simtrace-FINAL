// services/superAdminDashboard.js - Super admin dashboard services
import crypto from "crypto";
import {
  SuperAdminDashboard,
  SuperAdmin,
  Admin,
} from "../db/index.js";

// ── Super Admin Dashboard Management ───────────────────────────────────────────────────
export async function createSuperAdminDashboard(data) {
  const dashboardId = `sdash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify super admin exists
  const superAdmin = await SuperAdmin.findById(data.superAdminId);
  if (!superAdmin) throw new Error("Super admin not found");

  const dashboard = await SuperAdminDashboard.create({
    ...data,
    dashboardId,
    status: "active",
  });

  return dashboard;
}

export async function getSuperAdminDashboard(dashboardId) {
  const dashboard = await SuperAdminDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Super admin dashboard not found");
  return dashboard;
}

export async function getSuperAdminDashboardBySuperAdmin(superAdminId) {
  const dashboard = await SuperAdminDashboard.findOne({ superAdminId, status: "active" });
  return dashboard;
}

export async function updateSuperAdminDashboard(dashboardId, updates) {
  const dashboard = await SuperAdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Super admin dashboard not found");
  return dashboard;
}

export async function updateSuperAdminDashboardWidgets(dashboardId, widgets) {
  const dashboard = await SuperAdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      widgets,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Super admin dashboard not found");
  return dashboard;
}

export async function updateSuperAdminDashboardSettings(dashboardId, settings) {
  const dashboard = await SuperAdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      settings,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Super admin dashboard not found");
  return dashboard;
}

export async function deleteSuperAdminDashboard(dashboardId) {
  const dashboard = await SuperAdminDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Super admin dashboard not found");
  return dashboard;
}

export async function getAllSuperAdminDashboards() {
  const dashboards = await SuperAdminDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getSuperAdminDashboardData(dashboardId) {
  const dashboard = await SuperAdminDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Super admin dashboard not found");

  const superAdmin = await SuperAdmin.findById(dashboard.superAdminId);
  if (!superAdmin) throw new Error("Super admin not found");

  // Get admin statistics
  const adminStats = await Admin.aggregate([
    { $match: { managedBy: dashboard.superAdminId } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      },
    },
  ]);

  // TODO: Aggregate data based on widgets
  // This would fetch data for each widget type:
  // - system-overview: Get overall system statistics
  // - admin-activity: Get admin activity logs
  // - layer-statistics: Get statistics for each layer
  // - financial-overview: Get financial data
  // - security-alerts: Get security alerts

  return {
    dashboard,
    superAdmin,
    adminStats: adminStats.reduce((acc, item) => {
      acc[item._id] = { count: item.count, active: item.active };
      return acc;
    }, {}),
  };
}
