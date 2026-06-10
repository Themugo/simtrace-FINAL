// services/lawEnforcementDashboard.ts - Law enforcement dashboard services
import crypto from "crypto";
import {
  LawEnforcementDashboard,
  LawEnforcementAgency,
} from "../db/index.js";

// ── Law Enforcement Dashboard Management ───────────────────────────────────────────────
export async function createLawEnforcementDashboard(data: Record<string, unknown>) {
  const dashboardId = `ldash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify law enforcement agency exists
  const agency = await LawEnforcementAgency.findById(data.agencyId as string);
  if (!agency) throw new Error("Law enforcement agency not found");

  const dashboard = await LawEnforcementDashboard.create({
    ...data,
    dashboardId,
    status: "active",
    createdBy: data.createdBy as string,
    updatedBy: data.createdBy as string,
  });

  return dashboard;
}

export async function getLawEnforcementDashboard(dashboardId: string) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function getLawEnforcementDashboardByAgency(agencyId: string) {
  const dashboard = await LawEnforcementDashboard.findOne({ agencyId, status: "active" });
  return dashboard;
}

export async function updateLawEnforcementDashboard(dashboardId: string, updates: Record<string, unknown>, updatedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function updateLawEnforcementDashboardWidgets(dashboardId: string, widgets: Record<string, unknown>, updatedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOneAndUpdate(
    { dashboardId },
    {
      widgets,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function updateLawEnforcementDashboardSettings(dashboardId: string, settings: Record<string, unknown>, updatedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOneAndUpdate(
    { dashboardId },
    {
      settings,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function addLawEnforcementDashboardUser(dashboardId: string, userId: string, updatedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  if (!(dashboard as any).allowedUsers.includes(userId)) {
    (dashboard as any).allowedUsers.push(userId);
    (dashboard as any).updatedBy = updatedBy;
    dashboard.updatedAt = new Date();
    await dashboard.save();
  }

  return dashboard;
}

export async function removeLawEnforcementDashboardUser(dashboardId: string, userId: string, updatedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  (dashboard as any).allowedUsers = (dashboard as any).allowedUsers.filter((id: string) => id.toString() !== userId.toString());
  (dashboard as any).updatedBy = updatedBy;
  dashboard.updatedAt = new Date();
  await dashboard.save();

  return dashboard;
}

export async function deleteLawEnforcementDashboard(dashboardId: string, deletedBy: string) {
  const dashboard = await LawEnforcementDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function getAllLawEnforcementDashboards() {
  const dashboards = await LawEnforcementDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getLawEnforcementDashboardData(dashboardId: string) {
  const dashboard = await LawEnforcementDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  const agency = await LawEnforcementAgency.findById((dashboard as any).agencyId);
  if (!agency) throw new Error("Law enforcement agency not found");

  // TODO: Aggregate data based on widgets
  // This would fetch data for each widget type:
  // - active-cases: Get active case statistics
  // - arrests: Get arrest statistics
  // - investigations: Get investigation statistics
  // - interpol-cases: Get Interpol case statistics
  // - statistics: Get general statistics

  return {
    dashboard,
    agency,
    // Widget data would be added here
  };
}
