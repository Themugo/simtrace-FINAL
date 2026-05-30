// services/telecomDashboard.ts - Telecom dashboard services
import crypto from "crypto";
import {
  TelecomDashboard,
  TelecomCompany,
} from "../db/index.js";

// ── Telecom Dashboard Management ─────────────────────────────────────────────────────
export async function createTelecomDashboard(data: any) {
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

export async function getTelecomDashboard(dashboardId: string) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function getTelecomDashboardByCompany(companyId: string) {
  const dashboard = await TelecomDashboard.findOne({ companyId, status: "active" });
  return dashboard;
}

export async function updateTelecomDashboard(dashboardId: string, updates: any, updatedBy: string) {
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

export async function updateDashboardWidgets(dashboardId: string, widgets: any, updatedBy: string) {
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

export async function updateDashboardSettings(dashboardId: string, settings: any, updatedBy: string) {
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

export async function addDashboardUser(dashboardId: string, userId: string, updatedBy: string) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");

  if (!(dashboard as any).allowedUsers.includes(userId)) {
    (dashboard as any).allowedUsers.push(userId);
    (dashboard as any).updatedBy = updatedBy;
    dashboard.updatedAt = new Date();
    await dashboard.save();
  }

  return dashboard;
}

export async function removeDashboardUser(dashboardId: string, userId: string, updatedBy: string) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");

  (dashboard as any).allowedUsers = (dashboard as any).allowedUsers.filter((id: string) => id.toString() !== userId.toString());
  (dashboard as any).updatedBy = updatedBy;
  dashboard.updatedAt = new Date();
  await dashboard.save();

  return dashboard;
}

export async function deleteTelecomDashboard(dashboardId: string, deletedBy: string) {
  const dashboard = await TelecomDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");
  return dashboard;
}

export async function getAllTelecomDashboards() {
  const dashboards = await TelecomDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getDashboardData(dashboardId: string) {
  const dashboard = await TelecomDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Telecom dashboard not found");

  const company = await TelecomCompany.findById((dashboard as any).companyId);
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
