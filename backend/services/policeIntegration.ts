// services/policeIntegration.ts - Law Enforcement Integration
// Police station management, report system, nationwide alerts, case transfers, recovery workflow

import {
  PoliceStation,
  PoliceReport,
  NationwideAlert,
  CaseTransfer,
  RecoveryWorkflow,
  CourtCase,
  InterpolCase,
  Device,
  User,
  TheftReport,
} from "../db/index.js";
import { getIO } from "./socket.js";

// ── Police Station Management ───────────────────────────────────────────────────────
export async function createPoliceStation(data: Record<string, unknown>) {
  const station = await PoliceStation.create(data);
  return station;
}

export async function getPoliceStations(filters: Record<string, unknown> = {}) {
  const stations = await PoliceStation.find(filters)
    .sort({ stationType: 1, stationName: 1 });
  return stations;
}

export async function getPoliceStation(stationId: string) {
  const station = await PoliceStation.findById(stationId);
  return station;
}

export async function updatePoliceStation(stationId: string, updates: Record<string, unknown>) {
  const station = await PoliceStation.findByIdAndUpdate(
    stationId,
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
  return station;
}

export async function getNearbyStations(lat: number, lng: number, radiusKm = 50) {
  const stations = await PoliceStation.find({
    status: "active",
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000, // Convert to meters
      },
    },
  });
  return stations;
}

// ── Police Report System ─────────────────────────────────────────────────────────
export async function createPoliceReport(data: Record<string, unknown>) {
  const {
    deviceId,
    userId,
    stationId,
    obNumber,
    reportDate,
    incidentDate,
    incidentLocation,
    incidentType,
    incidentDescription,
    abstractNumber,
    abstractFile,
  } = data;

  // Check if OB number already exists
  const existingReport = await PoliceReport.findOne({ obNumber });
  if (existingReport) {
    throw new Error("OB number already exists");
  }

  const report = await PoliceReport.create({
    device: deviceId,
    user: userId,
    station: stationId,
    obNumber,
    reportDate,
    incidentDate,
    incidentLocation,
    incidentType,
    incidentDescription,
    abstractNumber,
    abstractFile,
    status: "pending",
  });

  // Update device status
  await Device.findByIdAndUpdate(deviceId, {
    status: "stolen",
    stolenAt: incidentDate,
  });

  // Notify user
  getIO().to(`user:${userId}`).emit("police_report_created", {
    reportId: report._id,
    obNumber,
    status: "pending",
  });

  return report;
}

export async function confirmPoliceReport(reportId: string, confirmedBy: string, confirmationNotes: string) {
  const report = await PoliceReport.findById(reportId);
  if (!report) throw new Error("Police report not found");

  (report as any).status = "confirmed";
  (report as any).confirmedBy = confirmedBy;
  (report as any).confirmedAt = new Date();
  (report as any).confirmationNotes = confirmationNotes;
  report.updatedAt = new Date();
  await report.save();

  // Create nationwide alert
  await createNationwideAlert({
    deviceId: (report as any).device,
    policeReport: report._id,
    alertType: "stolen",
    alertLevel: "high",
    lastKnownLocation: (report as any).incidentLocation,
  });

  // Create recovery workflow
  await createRecoveryWorkflow({
    deviceId: (report as any).device,
    policeReportId: report._id,
    stationId: (report as any).station,
  });

  // Notify all stations
  const allStations = await PoliceStation.find({ status: "active" });
  allStations.forEach((station: { _id: string }) => {
    getIO().to(`station:${station._id}`).emit("device_reported_stolen", {
      deviceId: (report as any).device,
      obNumber: (report as any).obNumber,
      alertLevel: "high",
    });
  });

  // Notify user
  getIO().to(`user:${(report as any).user}`).emit("police_report_confirmed", {
    reportId: report._id,
    obNumber: (report as any).obNumber,
  });

  return report;
}

export async function getPoliceReport(reportId: string) {
  const report = await PoliceReport.findById(reportId)
    .populate("device", "imei make model")
    .populate("user", "name email phone")
    .populate("station", "stationName stationCode address")
    .populate("confirmedBy", "name")
    .populate("transferredTo", "stationName stationCode")
    .populate("recoveredBy", "name");

  return report;
}

export async function getPoliceReportsByStation(stationId: string) {
  const reports = await PoliceReport.find({ station: stationId })
    .populate("device", "imei make model")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return reports;
}

export async function getPoliceReportsByDevice(deviceId: string) {
  const reports = await PoliceReport.find({ device: deviceId })
    .populate("station", "stationName stationCode")
    .sort({ createdAt: -1 });

  return reports;
}

export async function addEvidenceToReport(reportId: string, evidenceData: Record<string, unknown>) {
  const report = await PoliceReport.findById(reportId);
  if (!report) throw new Error("Police report not found");

  (report as any).evidence.push({
    ...evidenceData,
    uploadedAt: new Date(),
  });
  report.updatedAt = new Date();
  await report.save();

  return report;
}

// ── Nationwide Alert System ───────────────────────────────────────────────────────
export async function createNationwideAlert(data: Record<string, unknown>) {
  const {
    deviceId,
    policeReport,
    alertType,
    alertLevel,
    deviceDescription,
    devicePhoto,
    uniqueFeatures,
    lastKnownLocation,
  } = data;

  // Get all active stations
  const allStations = await PoliceStation.find({ status: "active" });

  const alert = await NationwideAlert.create({
    device: deviceId,
    policeReport,
    alertType,
    alertLevel,
    deviceDescription,
    devicePhoto,
    uniqueFeatures,
    lastKnownLocation,
    status: "active",
    notifiedStations: allStations.map((s: { _id: string }) => s._id),
  });

  // Notify all stations
  allStations.forEach((station: { _id: string }) => {
    getIO().to(`station:${station._id}`).emit("nationwide_alert", {
      alertId: alert._id,
      deviceId,
      alertType,
      alertLevel,
      deviceDescription,
    });
  });

  return alert;
}

export async function getNationwideAlert(alertId: string) {
  const alert = await NationwideAlert.findById(alertId)
    .populate("device", "imei make model")
    .populate("policeReport", "obNumber incidentType")
    .populate("notifiedStations", "stationName stationCode")
    .populate("sightings.station", "stationName stationCode")
    .populate("sightings.reportedBy", "name");

  return alert;
}

export async function getActiveNationwideAlerts() {
  const alerts = await NationwideAlert.find({ status: "active" })
    .populate("device", "imei make model")
    .populate("policeReport", "obNumber")
    .sort({ alertLevel: -1, createdAt: -1 });

  return alerts;
}

export async function reportSighting(alertId: string, sightingData: Record<string, unknown>) {
  const alert = await NationwideAlert.findById(alertId);
  if (!alert) throw new Error("Alert not found");

  (alert as any).sightings.push({
    ...sightingData,
    timestamp: new Date(),
  });
  alert.updatedAt = new Date();
  await alert.save();

  // Notify originating station
  const report = await PoliceReport.findById((alert as any).policeReport);
  if (report) {
    getIO().to(`station:${(report as any).station}`).emit("sighting_reported", {
      alertId: alert._id,
      deviceId: (alert as any).device,
      sighting: sightingData,
    });
  }

  return alert;
}

export async function deactivateAlert(alertId: string, reason: string) {
  const alert = await NationwideAlert.findById(alertId);
  if (!alert) throw new Error("Alert not found");

  (alert as any).status = "inactive";
  (alert as any).deactivatedAt = new Date();
  alert.updatedAt = new Date();
  await alert.save();

  // Notify all stations
  (alert as any).notifiedStations.forEach((stationId: string) => {
    getIO().to(`station:${stationId}`).emit("alert_deactivated", {
      alertId: alert._id,
      deviceId: (alert as any).device,
      reason,
    });
  });

  return alert;
}

// ── Case Transfer System ─────────────────────────────────────────────────────────
export async function requestCaseTransfer(data: Record<string, unknown>) {
  const {
    policeReportId,
    deviceId,
    fromStationId,
    toStationId,
    transferReason,
    transferNotes,
    requestedBy,
  } = data;

  const transfer = await CaseTransfer.create({
    policeReport: policeReportId,
    device: deviceId,
    fromStation: fromStationId,
    toStation: toStationId,
    transferReason,
    transferNotes,
    requestedBy,
    status: "pending",
  });

  // Notify receiving station
  getIO().to(`station:${toStationId}`).emit("case_transfer_requested", {
    transferId: transfer._id,
    policeReportId,
    fromStationId,
    transferReason,
  });

  return transfer;
}

export async function acceptCaseTransfer(transferId: string, approvedBy: string) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  (transfer as any).status = "accepted";
  (transfer as any).approvedBy = approvedBy;
  (transfer as any).respondedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  // Update police report
  await PoliceReport.findByIdAndUpdate((transfer as any).policeReport, {
    transferredTo: (transfer as any).toStation,
    transferredAt: new Date(),
    transferredBy: approvedBy,
    transferReason: (transfer as any).transferReason,
  });

  // Notify requesting station
  getIO().to(`station:${(transfer as any).fromStation}`).emit("case_transfer_accepted", {
    transferId: transfer._id,
    toStationId: (transfer as any).toStation,
  });

  return transfer;
}

export async function rejectCaseTransfer(transferId: string, rejectedBy: string, rejectionReason: string) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  (transfer as any).status = "rejected";
  (transfer as any).rejectedBy = rejectedBy;
  (transfer as any).rejectionReason = rejectionReason;
  (transfer as any).respondedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  // Notify requesting station
  getIO().to(`station:${(transfer as any).fromStation}`).emit("case_transfer_rejected", {
    transferId: transfer._id,
    rejectionReason,
  });

  return transfer;
}

export async function completeCaseTransfer(transferId: string) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  (transfer as any).status = "completed";
  (transfer as any).completedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

// ── Recovery Workflow ─────────────────────────────────────────────────────────────
export async function createRecoveryWorkflow(data: Record<string, unknown>) {
  const {
    deviceId,
    policeReportId,
    stationId,
  } = data;

  const workflow = await RecoveryWorkflow.create({
    device: deviceId,
    policeReport: policeReportId,
    station: stationId,
    currentStage: "reported",
    status: "active",
    stageHistory: [{
      stage: "reported",
      timestamp: new Date(),
      notes: "Case reported",
    }],
  });

  return workflow;
}

export async function updateRecoveryStage(workflowId: string, stage: string, notes: string, updatedBy: string) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  (workflow as any).currentStage = stage;
  (workflow as any).stageHistory.push({
    stage,
    timestamp: new Date(),
    notes,
    updatedBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify station
  getIO().to(`station:${(workflow as any).station}`).emit("recovery_stage_updated", {
    workflowId: workflow._id,
    currentStage: stage,
    notes,
  });

  return workflow;
}

export async function addInvestigator(workflowId: string, investigatorId: string) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  if (!(workflow as any).investigators.includes(investigatorId)) {
    (workflow as any).investigators.push(investigatorId);
    workflow.updatedAt = new Date();
    await workflow.save();
  }

  return workflow;
}

export async function locateDevice(workflowId: string, locationData: Record<string, unknown>, locatedBy: string) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  (workflow as any).currentStage = "located";
  (workflow as any).locatedAt = new Date();
  (workflow as any).locatedBy = locatedBy;
  (workflow as any).locationDetails = locationData;
  (workflow as any).stageHistory.push({
    stage: "located",
    timestamp: new Date(),
    notes: "Device located",
    updatedBy: locatedBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify station
  getIO().to(`station:${(workflow as any).station}`).emit("device_located", {
    workflowId: workflow._id,
    location: locationData,
  });

  return workflow;
}

export async function recoverDevice(workflowId: string, recoveryData: { notes?: unknown; evidence?: unknown[] }, recoveredBy: string) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  (workflow as any).currentStage = "recovered";
  (workflow as any).recoveredAt = new Date();
  (workflow as any).recoveredBy = recoveredBy;
  (workflow as any).recoveryNotes = recoveryData.notes;
  (workflow as any).recoveryEvidence = recoveryData.evidence || [];
  (workflow as any).stageHistory.push({
    stage: "recovered",
    timestamp: new Date(),
    notes: "Device recovered",
    updatedBy: recoveredBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Update police report
  const report = await PoliceReport.findById((workflow as any).policeReport);
  if (report) {
    (report as any).recovered = true;
    (report as any).recoveredAt = new Date();
    (report as any).recoveredBy = recoveredBy;
    (report as any).recoveryLocation = (workflow as any).locationDetails;
    (report as any).status = "resolved";
    await report.save();

    // Update device status
    await Device.findByIdAndUpdate((workflow as any).device, {
      status: "recovered",
      recoveredAt: new Date(),
    });

    // Deactivate alert
    const alert = await NationwideAlert.findOne({ device: (workflow as any).device, status: "active" });
    if (alert) {
      await deactivateAlert(alert._id.toString(), "Device recovered");
    }
  }

  // Notify station
  getIO().to(`station:${(workflow as any).station}`).emit("device_recovered", {
    workflowId: workflow._id,
    recoveryData,
  });

  // Notify user
  getIO().to(`user:${(report as any).user}`).emit("device_recovered_notification", {
    deviceId: (workflow as any).device,
    station: (workflow as any).station,
  });

  return workflow;
}

export async function returnDeviceToOwner(workflowId: string, returnCondition: string, returnedBy: string) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  (workflow as any).currentStage = "returned";
  (workflow as any).returnedToOwner = true;
  (workflow as any).returnedAt = new Date();
  (workflow as any).returnCondition = returnCondition;
  (workflow as any).stageHistory.push({
    stage: "returned",
    timestamp: new Date(),
    notes: "Device returned to owner",
    updatedBy: returnedBy,
  });
  (workflow as any).status = "completed";
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify user
  const report = await PoliceReport.findById((workflow as any).policeReport);
  if (report) {
    getIO().to(`user:${(report as any).user}`).emit("device_returned", {
      deviceId: (workflow as any).device,
      returnCondition,
    });
  }

  return workflow;
}

export async function addArrest(workflowId: string, arrestData: Record<string, unknown>) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  (workflow as any).arrestsMade.push(arrestData);
  workflow.updatedAt = new Date();
  await workflow.save();

  return workflow;
}

// ── Court Case Integration ───────────────────────────────────────────────────────
export async function createCourtCase(data: Record<string, unknown>) {
  const {
    policeReportId,
    deviceId,
    courtName,
    courtType,
    courtLocation,
    caseNumber,
    caseType,
    charges,
    prosecutor,
    defenseLawyer,
    judge,
  } = data;

  const courtCase = await CourtCase.create({
    policeReport: policeReportId,
    device: deviceId,
    courtName,
    courtType,
    courtLocation,
    caseNumber,
    caseType,
    charges,
    prosecutor,
    defenseLawyer,
    judge,
    status: "filed",
  });

  // Update police report
  await PoliceReport.findByIdAndUpdate(policeReportId, {
    courtCaseNumber: caseNumber,
    courtCaseStatus: "filed",
  });

  return courtCase;
}

export async function updateCourtCase(caseId: string, updates: Record<string, unknown>) {
  const courtCase = await CourtCase.findByIdAndUpdate(
    caseId,
    { ...updates, updatedAt: new Date() },
    { new: true }
  );

  return courtCase;
}

// ── Interpol Integration ─────────────────────────────────────────────────────────
export async function createInterpolCase(data: Record<string, unknown>) {
  const {
    policeReportId,
    deviceId,
    interpolNotice,
    noticeNumber,
    originatingCountry,
    targetCountries,
    noticeType,
    description,
  } = data;

  const interpolCase = await InterpolCase.create({
    policeReport: policeReportId,
    device: deviceId,
    interpolNotice,
    noticeNumber,
    originatingCountry,
    targetCountries,
    noticeType,
    description,
    status: "pending",
  });

  return interpolCase;
}

export async function publishInterpolNotice(caseId: string) {
  const interpolCase = await InterpolCase.findById(caseId);
  if (!interpolCase) throw new Error("Interpol case not found");

  (interpolCase as any).status = "published";
  (interpolCase as any).publishedAt = new Date();
  interpolCase.updatedAt = new Date();
  await interpolCase.save();

  return interpolCase;
}

export async function addInterpolResponse(caseId: string, responseData: Record<string, unknown>) {
  const interpolCase = await InterpolCase.findById(caseId);
  if (!interpolCase) throw new Error("Interpol case not found");

  (interpolCase as any).responses.push({
    ...responseData,
    timestamp: new Date(),
  });
  interpolCase.updatedAt = new Date();
  await interpolCase.save();

  return interpolCase;
}

// ── Statistics ───────────────────────────────────────────────────────────────────
export async function getPoliceStatistics() {
  const [
    totalStations,
    activeStations,
    totalReports,
    pendingReports,
    confirmedReports,
    resolvedReports,
    totalAlerts,
    activeAlerts,
    totalTransfers,
    pendingTransfers,
    totalRecoveries,
    activeRecoveries,
    completedRecoveries,
    totalCourtCases,
    pendingCourtCases,
    totalInterpolCases,
    publishedInterpolCases,
  ] = await Promise.all([
    PoliceStation.countDocuments(),
    PoliceStation.countDocuments({ status: "active" }),
    PoliceReport.countDocuments(),
    PoliceReport.countDocuments({ status: "pending" }),
    PoliceReport.countDocuments({ status: "confirmed" }),
    PoliceReport.countDocuments({ status: "resolved" }),
    NationwideAlert.countDocuments(),
    NationwideAlert.countDocuments({ status: "active" }),
    CaseTransfer.countDocuments(),
    CaseTransfer.countDocuments({ status: "pending" }),
    RecoveryWorkflow.countDocuments(),
    RecoveryWorkflow.countDocuments({ status: "active" }),
    RecoveryWorkflow.countDocuments({ status: "completed" }),
    CourtCase.countDocuments(),
    CourtCase.countDocuments({ status: "pending" }),
    InterpolCase.countDocuments(),
    InterpolCase.countDocuments({ status: "published" }),
  ]);

  return {
    stations: {
      total: totalStations,
      active: activeStations,
    },
    reports: {
      total: totalReports,
      pending: pendingReports,
      confirmed: confirmedReports,
      resolved: resolvedReports,
    },
    alerts: {
      total: totalAlerts,
      active: activeAlerts,
    },
    transfers: {
      total: totalTransfers,
      pending: pendingTransfers,
    },
    recoveries: {
      total: totalRecoveries,
      active: activeRecoveries,
      completed: completedRecoveries,
    },
    courtCases: {
      total: totalCourtCases,
      pending: pendingCourtCases,
    },
    interpolCases: {
      total: totalInterpolCases,
      published: publishedInterpolCases,
    },
  };
}
