// services/telecomDashboard.js - Telecom dashboard services
import crypto from "crypto";
import {
  TelecomDashboard,
  TelecomCompany,
} from "../db/index.js";

// ── Telecom Dashboard Management ─────────────────────────────────────────────────────
export async function createTelecomDashboard(data) {
  const dashboardId = `tdash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify telecom company exists
  const company = await TelecomCompany.findById(data.companyId);
  if (!company) throw new Error("Telecom company not found");

  const dashboard = await TelecomDashboard.create({
    ...data,
    dashboardId,
    status: "active",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return dashboard;
}

export async function getTelecomDashboard(dashboardId) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function getTelecomDashboardByCompany(companyId) {
  const dashboard = await TelecomDashboard.findOne({ companyId, status: "active" });
  return dashboard;
}

export async function updateTelecomDashboard(dashboardId, updates, updatedBy) {
  const dashboard = await TelecomDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function updateDashboardWidgets(dashboardId, widgets, updatedBy) {
  const dashboard = await TelecomDashboard.findOneAndUpdate(
    { dashboardId },
    {
      widgets,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function updateDashboardSettings(dashboardId, settings, updatedBy) {
  const dashboard = await TelecomDashboard.findOneAndUpdate(
    { dashboardId },
    {
      settings,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function addDashboardUser(dashboardId, userId, updatedBy) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");

  if (!dashboard.allowedUsers.includes(userId)) {
    dashboard.allowedUsers.push(userId);
    dashboard.updatedBy = updatedBy;
    dashboard.updatedAt = new Date();
    await dashboard.save();
  }

  return dashboard;
}

export async function removeDashboardUser(dashboardId, userId, updatedBy) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");

  dashboard.allowedUsers = dashboard.allowedUsers.filter((id) => id.toString() !== userId.toString());
  dashboard.updatedBy = updatedBy;
  dashboard.updatedAt = new Date();
  await dashboard.save();

  return dashboard;
}

export async function deleteTelecomDashboard(dashboardId, deletedBy) {
  const dashboard = await TelecomDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function getAllTelecomDashboards() {
  const dashboards = await TelecomDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getDashboardData(dashboardId) {
  const dashboard = await TelecomDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Telecom dashboard not found");

  const company = await TelecomCompany.findById(dashboard.companyId);
  if (!company) throw new Error("Telecom company not found");

  // TODO: Aggregate data based on widgets
  // This would fetch data for each widget type:
  // - device-tracking: Get device tracking stats
  // - network-status: Get network status
  // - alerts: Get alerts
  // - statistics: Get statistics

  return {
    dashboard,
    company,
    // Widget data would be added here
  };
}
