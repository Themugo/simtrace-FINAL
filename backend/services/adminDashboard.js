// services/adminDashboard.js - Admin dashboard services
import crypto from "crypto";
import {
  AdminDashboard,
  Admin,
} from "../db/index.js";

// ── Admin Dashboard Management ───────────────────────────────────────────────────────
export async function createAdminDashboard(data) {
  const dashboardId = `adash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify admin exists
  const admin = await Admin.findById(data.adminId);
  if (!admin) throw new Error("Admin not found");

  const dashboard = await AdminDashboard.create({
    ...data,
    dashboardId,
    status: "active",
  });

  return dashboard;
}

export async function getAdminDashboard(dashboardId) {
  const dashboard = await AdminDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Admin dashboard not found");
  return dashboard;
}

export async function getAdminDashboardByAdmin(adminId) {
  const dashboard = await AdminDashboard.findOne({ adminId, status: "active" });
  return dashboard;
}

export async function updateAdminDashboard(dashboardId, updates) {
  const dashboard = await AdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Admin dashboard not found");
  return dashboard;
}

export async function updateAdminDashboardWidgets(dashboardId, widgets) {
  const dashboard = await AdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      widgets,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Admin dashboard not found");
  return dashboard;
}

export async function updateAdminDashboardSettings(dashboardId, settings) {
  const dashboard = await AdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      settings,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Admin dashboard not found");
  return dashboard;
}

export async function deleteAdminDashboard(dashboardId) {
  const dashboard = await AdminDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Admin dashboard not found");
  return dashboard;
}

export async function getAllAdminDashboards() {
  const dashboards = await AdminDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getAdminDashboardData(dashboardId) {
  const dashboard = await AdminDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Admin dashboard not found");

  const admin = await Admin.findById(dashboard.adminId);
  if (!admin) throw new Error("Admin not found");

  // TODO: Aggregate data based on widgets
  // This would fetch data for each widget type:
  // - layer-overview: Get statistics for layers admin has access to
  // - task-list: Get pending tasks and approvals
  // - approvals: Get pending approvals
  // - reports: Get reports relevant to admin's role
  // - statistics: Get general statistics

  return {
    dashboard,
    admin,
    layerAccess: admin.layerAccess,
  };
}
