// services/policeIntegration.js - Law Enforcement Integration
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
export async function createPoliceStation(data) {
  const station = await PoliceStation.create(data);
  return station;
}

export async function getPoliceStations(filters = {}) {
  const stations = await PoliceStation.find(filters)
    .sort({ stationType: 1, stationName: 1 });
  return stations;
}

export async function getPoliceStation(stationId) {
  const station = await PoliceStation.findById(stationId);
  return station;
}

export async function updatePoliceStation(stationId, updates) {
  const station = await PoliceStation.findByIdAndUpdate(
    stationId,
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
  return station;
}

export async function getNearbyStations(lat, lng, radiusKm = 50) {
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
export async function createPoliceReport(data) {
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

export async function confirmPoliceReport(reportId, confirmedBy, confirmationNotes) {
  const report = await PoliceReport.findById(reportId);
  if (!report) throw new Error("Police report not found");

  report.status = "confirmed";
  report.confirmedBy = confirmedBy;
  report.confirmedAt = new Date();
  report.confirmationNotes = confirmationNotes;
  report.updatedAt = new Date();
  await report.save();

  // Create nationwide alert
  await createNationwideAlert({
    deviceId: report.device,
    policeReport: report._id,
    alertType: "stolen",
    alertLevel: "high",
    lastKnownLocation: report.incidentLocation,
  });

  // Create recovery workflow
  await createRecoveryWorkflow({
    deviceId: report.device,
    policeReport: report._id,
    station: report.station,
  });

  // Notify all stations
  const allStations = await PoliceStation.find({ status: "active" });
  allStations.forEach(station => {
    getIO().to(`station:${station._id}`).emit("device_reported_stolen", {
      deviceId: report.device,
      obNumber: report.obNumber,
      alertLevel: "high",
    });
  });

  // Notify user
  getIO().to(`user:${report.user}`).emit("police_report_confirmed", {
    reportId: report._id,
    obNumber: report.obNumber,
  });

  return report;
}

export async function getPoliceReport(reportId) {
  const report = await PoliceReport.findById(reportId)
    .populate("device", "imei make model")
    .populate("user", "name email phone")
    .populate("station", "stationName stationCode address")
    .populate("confirmedBy", "name")
    .populate("transferredTo", "stationName stationCode")
    .populate("recoveredBy", "name");

  return report;
}

export async function getPoliceReportsByStation(stationId) {
  const reports = await PoliceReport.find({ station: stationId })
    .populate("device", "imei make model")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return reports;
}

export async function getPoliceReportsByDevice(deviceId) {
  const reports = await PoliceReport.find({ device: deviceId })
    .populate("station", "stationName stationCode")
    .sort({ createdAt: -1 });

  return reports;
}

export async function addEvidenceToReport(reportId, evidenceData) {
  const report = await PoliceReport.findById(reportId);
  if (!report) throw new Error("Police report not found");

  report.evidence.push({
    ...evidenceData,
    uploadedAt: new Date(),
  });
  report.updatedAt = new Date();
  await report.save();

  return report;
}

// ── Nationwide Alert System ───────────────────────────────────────────────────────
export async function createNationwideAlert(data) {
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
    notifiedStations: allStations.map(s => s._id),
  });

  // Notify all stations
  allStations.forEach(station => {
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

export async function getNationwideAlert(alertId) {
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

export async function reportSighting(alertId, sightingData) {
  const alert = await NationwideAlert.findById(alertId);
  if (!alert) throw new Error("Alert not found");

  alert.sightings.push({
    ...sightingData,
    timestamp: new Date(),
  });
  alert.updatedAt = new Date();
  await alert.save();

  // Notify originating station
  const report = await PoliceReport.findById(alert.policeReport);
  if (report) {
    getIO().to(`station:${report.station}`).emit("sighting_reported", {
      alertId: alert._id,
      deviceId: alert.device,
      sighting: sightingData,
    });
  }

  return alert;
}

export async function deactivateAlert(alertId, reason) {
  const alert = await NationwideAlert.findById(alertId);
  if (!alert) throw new Error("Alert not found");

  alert.status = "inactive";
  alert.deactivatedAt = new Date();
  alert.updatedAt = new Date();
  await alert.save();

  // Notify all stations
  alert.notifiedStations.forEach(stationId => {
    getIO().to(`station:${stationId}`).emit("alert_deactivated", {
      alertId: alert._id,
      deviceId: alert.device,
      reason,
    });
  });

  return alert;
}

// ── Case Transfer System ─────────────────────────────────────────────────────────
export async function requestCaseTransfer(data) {
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

export async function acceptCaseTransfer(transferId, approvedBy) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  transfer.status = "accepted";
  transfer.approvedBy = approvedBy;
  transfer.respondedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  // Update police report
  await PoliceReport.findByIdAndUpdate(transfer.policeReport, {
    transferredTo: transfer.toStation,
    transferredAt: new Date(),
    transferredBy: approvedBy,
    transferReason: transfer.transferReason,
  });

  // Notify requesting station
  getIO().to(`station:${transfer.fromStation}`).emit("case_transfer_accepted", {
    transferId: transfer._id,
    toStationId: transfer.toStation,
  });

  return transfer;
}

export async function rejectCaseTransfer(transferId, rejectedBy, rejectionReason) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  transfer.status = "rejected";
  transfer.rejectedBy = rejectedBy;
  transfer.rejectionReason = rejectionReason;
  transfer.respondedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  // Notify requesting station
  getIO().to(`station:${transfer.fromStation}`).emit("case_transfer_rejected", {
    transferId: transfer._id,
    rejectionReason,
  });

  return transfer;
}

export async function completeCaseTransfer(transferId) {
  const transfer = await CaseTransfer.findById(transferId);
  if (!transfer) throw new Error("Transfer not found");

  transfer.status = "completed";
  transfer.completedAt = new Date();
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

// ── Recovery Workflow ─────────────────────────────────────────────────────────────
export async function createRecoveryWorkflow(data) {
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

export async function updateRecoveryStage(workflowId, stage, notes, updatedBy) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  workflow.currentStage = stage;
  workflow.stageHistory.push({
    stage,
    timestamp: new Date(),
    notes,
    updatedBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify station
  getIO().to(`station:${workflow.station}`).emit("recovery_stage_updated", {
    workflowId: workflow._id,
    currentStage: stage,
    notes,
  });

  return workflow;
}

export async function addInvestigator(workflowId, investigatorId) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  if (!workflow.investigators.includes(investigatorId)) {
    workflow.investigators.push(investigatorId);
    workflow.updatedAt = new Date();
    await workflow.save();
  }

  return workflow;
}

export async function locateDevice(workflowId, locationData, locatedBy) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  workflow.currentStage = "located";
  workflow.locatedAt = new Date();
  workflow.locatedBy = locatedBy;
  workflow.locationDetails = locationData;
  workflow.stageHistory.push({
    stage: "located",
    timestamp: new Date(),
    notes: "Device located",
    updatedBy: locatedBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify station
  getIO().to(`station:${workflow.station}`).emit("device_located", {
    workflowId: workflow._id,
    location: locationData,
  });

  return workflow;
}

export async function recoverDevice(workflowId, recoveryData, recoveredBy) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  workflow.currentStage = "recovered";
  workflow.recoveredAt = new Date();
  workflow.recoveredBy = recoveredBy;
  workflow.recoveryNotes = recoveryData.notes;
  workflow.recoveryEvidence = recoveryData.evidence || [];
  workflow.stageHistory.push({
    stage: "recovered",
    timestamp: new Date(),
    notes: "Device recovered",
    updatedBy: recoveredBy,
  });
  workflow.updatedAt = new Date();
  await workflow.save();

  // Update police report
  const report = await PoliceReport.findById(workflow.policeReport);
  if (report) {
    report.recovered = true;
    report.recoveredAt = new Date();
    report.recoveredBy = recoveredBy;
    report.recoveryLocation = workflow.locationDetails;
    report.status = "resolved";
    await report.save();

    // Update device status
    await Device.findByIdAndUpdate(workflow.device, {
      status: "recovered",
      recoveredAt: new Date(),
    });

    // Deactivate alert
    const alert = await NationwideAlert.findOne({ device: workflow.device, status: "active" });
    if (alert) {
      await deactivateAlert(alert._id, "Device recovered");
    }
  }

  // Notify station
  getIO().to(`station:${workflow.station}`).emit("device_recovered", {
    workflowId: workflow._id,
    recoveryData,
  });

  // Notify user
  getIO().to(`user:${report.user}`).emit("device_recovered_notification", {
    deviceId: workflow.device,
    station: workflow.station,
  });

  return workflow;
}

export async function returnDeviceToOwner(workflowId, returnCondition, returnedBy) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  workflow.currentStage = "returned";
  workflow.returnedToOwner = true;
  workflow.returnedAt = new Date();
  workflow.returnCondition = returnCondition;
  workflow.stageHistory.push({
    stage: "returned",
    timestamp: new Date(),
    notes: "Device returned to owner",
    updatedBy: returnedBy,
  });
  workflow.status = "completed";
  workflow.updatedAt = new Date();
  await workflow.save();

  // Notify user
  const report = await PoliceReport.findById(workflow.policeReport);
  if (report) {
    getIO().to(`user:${report.user}`).emit("device_returned", {
      deviceId: workflow.device,
      returnCondition,
    });
  }

  return workflow;
}

export async function addArrest(workflowId, arrestData) {
  const workflow = await RecoveryWorkflow.findById(workflowId);
  if (!workflow) throw new Error("Recovery workflow not found");

  workflow.arrestsMade.push(arrestData);
  workflow.updatedAt = new Date();
  await workflow.save();

  return workflow;
}

// ── Court Case Integration ───────────────────────────────────────────────────────
export async function createCourtCase(data) {
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

export async function updateCourtCase(caseId, updates) {
  const courtCase = await CourtCase.findByIdAndUpdate(
    caseId,
    { ...updates, updatedAt: new Date() },
    { new: true }
  );

  return courtCase;
}

// ── Interpol Integration ─────────────────────────────────────────────────────────
export async function createInterpolCase(data) {
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

export async function publishInterpolNotice(caseId) {
  const interpolCase = await InterpolCase.findById(caseId);
  if (!interpolCase) throw new Error("Interpol case not found");

  interpolCase.status = "published";
  interpolCase.publishedAt = new Date();
  interpolCase.updatedAt = new Date();
  await interpolCase.save();

  return interpolCase;
}

export async function addInterpolResponse(caseId, responseData) {
  const interpolCase = await InterpolCase.findById(caseId);
  if (!interpolCase) throw new Error("Interpol case not found");

  interpolCase.responses.push({
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
