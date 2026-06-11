// services/telecomDashboard.ts - Telecom dashboard services
import crypto from "crypto";
import {
  TelecomDashboard,
  TelecomCompany,
} from "../db/index.js";

interface TelecomDashboardFields {
  allowedUsers: string[];
  updatedBy: string;
  companyId?: string;
}

// ── Telecom Dashboard Management ─────────────────────────────────────────────────────
export async function createTelecomDashboard(data: Record<string, unknown>) {
  const dashboardId = `tdash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify telecom company exists
  const company = await TelecomCompany.findById(data.companyId as string);
  if (!company) throw new Error("Telecom company not found");

  const dashboard = await TelecomDashboard.create({
    ...data,
    dashboardId,
    status: "active",
    createdBy: data.createdBy as string,
    updatedBy: data.createdBy as string,
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

export async function updateTelecomDashboard(dashboardId: string, updates: Record<string, unknown>, updatedBy: string) {
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

export async function updateDashboardWidgets(dashboardId: string, widgets: Record<string, unknown>, updatedBy: string) {
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

export async function updateDashboardSettings(dashboardId: string, settings: Record<string, unknown>, updatedBy: string) {
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

  if (!(dashboard as unknown as TelecomDashboardFields).allowedUsers.includes(userId)) {
    (dashboard as unknown as TelecomDashboardFields).allowedUsers.push(userId);
    (dashboard as unknown as TelecomDashboardFields).updatedBy = updatedBy;
    dashboard.updatedAt = new Date();
    await dashboard.save();
  }

  return dashboard;
}

export async function removeDashboardUser(dashboardId: string, userId: string, updatedBy: string) {
  const dashboard = await TelecomDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Telecom dashboard not found");

  (dashboard as unknown as TelecomDashboardFields).allowedUsers = (dashboard as unknown as TelecomDashboardFields).allowedUsers.filter((id: string) => id.toString() !== userId.toString());
  (dashboard as unknown as TelecomDashboardFields).updatedBy = updatedBy;
  dashboard.updatedAt = new Date();
  await dashboard.save();

  return dashboard;
}

export async function deleteTelecomDashboard(dashboardId: string, _deletedBy: string) {
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

  const company = await TelecomCompany.findById((dashboard as unknown as TelecomDashboardFields).companyId);
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
