// services/lawEnforcementDashboard.js - Law enforcement dashboard services
import crypto from "crypto";
import {
  LawEnforcementDashboard,
  LawEnforcementAgency,
} from "../db/index.js";

// ── Law Enforcement Dashboard Management ───────────────────────────────────────────────
export async function createLawEnforcementDashboard(data) {
  const dashboardId = `ldash_${crypto.randomBytes(16).toString("hex")}`;

  // Verify law enforcement agency exists
  const agency = await LawEnforcementAgency.findById(data.agencyId);
  if (!agency) throw new Error("Law enforcement agency not found");

  const dashboard = await LawEnforcementDashboard.create({
    ...data,
    dashboardId,
    status: "active",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return dashboard;
}

export async function getLawEnforcementDashboard(dashboardId) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId, status: "active" });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function getLawEnforcementDashboardByAgency(agencyId) {
  const dashboard = await LawEnforcementDashboard.findOne({ agencyId, status: "active" });
  return dashboard;
}

export async function updateLawEnforcementDashboard(dashboardId, updates, updatedBy) {
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

export async function updateLawEnforcementDashboardWidgets(dashboardId, widgets, updatedBy) {
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

export async function updateLawEnforcementDashboardSettings(dashboardId, settings, updatedBy) {
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

export async function addLawEnforcementDashboardUser(dashboardId, userId, updatedBy) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  if (!dashboard.allowedUsers.includes(userId)) {
    dashboard.allowedUsers.push(userId);
    dashboard.updatedBy = updatedBy;
    dashboard.updatedAt = new Date();
    await dashboard.save();
  }

  return dashboard;
}

export async function removeLawEnforcementDashboardUser(dashboardId, userId, updatedBy) {
  const dashboard = await LawEnforcementDashboard.findOne({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  dashboard.allowedUsers = dashboard.allowedUsers.filter((id) => id.toString() !== userId.toString());
  dashboard.updatedBy = updatedBy;
  dashboard.updatedAt = new Date();
  await dashboard.save();

  return dashboard;
}

export async function deleteLawEnforcementDashboard(dashboardId, deletedBy) {
  const dashboard = await LawEnforcementDashboard.findOneAndDelete({ dashboardId });
  if (!dashboard) throw new Error("Law enforcement dashboard not found");
  return dashboard;
}

export async function getAllLawEnforcementDashboards() {
  const dashboards = await LawEnforcementDashboard.find({ status: "active" }).sort({ createdAt: -1 });
  return dashboards;
}

// ── Dashboard Data Aggregation ───────────────────────────────────────────────────────
export async function getLawEnforcementDashboardData(dashboardId) {
  const dashboard = await LawEnforcementDashboard.findById(dashboardId);
  if (!dashboard) throw new Error("Law enforcement dashboard not found");

  const agency = await LawEnforcementAgency.findById(dashboard.agencyId);
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
