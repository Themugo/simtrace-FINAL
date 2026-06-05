// services/selfieCapture.ts - Selfie capture and thief identification services
import crypto from "crypto";
import { createHash } from "crypto";
import {
  SelfieCapture,
  ThiefReport,
  Device,
  User,
} from "../db/index.js";

// ── Selfie Capture Management ─────────────────────────────────────────────────────────
export async function captureSelfie(data: any) {
  const captureId = `capture_${crypto.randomBytes(16).toString("hex")}`;

  // Generate image hash for deduplication
  const imageHash = createHash("sha256").update(data.imageUrl).digest("hex");

  // Check if device is locked
  const device = await Device.findById(data.deviceId);
  if (!device) throw new Error("Device not found");

  const lock = await checkDeviceLockStatus(data.deviceId);
  if (!lock.locked) {
    throw new Error("Device is not locked");
  }

  // Count previous unlock attempts
  const previousCaptures = await SelfieCapture.find({ deviceId: data.deviceId });
  const unlockAttempt = previousCaptures.length + 1;

  const capture = await SelfieCapture.create({
    ...data,
    captureId,
    imageHash,
    unlockAttempt,
    // Lawful basis: captures only occur on a locked (reported lost/stolen) device
    consentBasis: data.consentBasis || "legitimate_interest_stolen_device_recovery",
    retentionUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    status: "pending",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Record unlock attempt on lock
  await recordUnlockAttempt((lock as any).lockId, data.captureLocation);

  // Trigger AI analysis
  await analyzeSelfie(captureId);

  return capture;
}

export async function analyzeSelfie(captureId: string) {
  const capture = await SelfieCapture.findOne({ captureId });
  if (!capture) throw new Error("Capture not found");

  // TODO: Integrate with AI service for face recognition
  // For now, this is a placeholder for the AI analysis
  // In production, this would call an AI service like:
  // - AWS Rekognition
  // - Google Cloud Vision
  // - Azure Face API
  // - Custom ML model

  // Simulate AI analysis
  const aiResult = await performAIAnalysis((capture as any).imageUrl);

  (capture as any).aiAnalyzed = true;
  (capture as any).aiAnalysisDate = new Date();
  (capture as any).identified = aiResult.identified;
  (capture as any).matchedUserId = aiResult.matchedUserId;
  (capture as any).confidenceScore = aiResult.confidenceScore;
  (capture as any).isThief = aiResult.isThief;
  (capture as any).status = aiResult.identified ? "identified" : "analyzed";
  capture.updatedAt = new Date();
  await capture.save();

  // If thief identified, auto-report
  if ((capture as any).isThief) {
    await autoReportThief(captureId);
  }

  return capture;
}

// Placeholder for AI analysis - integrate with actual AI service
async function performAIAnalysis(imageUrl: string) {
  // TODO: Replace with actual AI service integration
  // This would typically:
  // 1. Download the image
  // 2. Run face detection
  // 3. Compare against registered users
  // 4. Return match results with confidence score

  // Placeholder response
  return {
    identified: false,
    matchedUserId: null,
    confidenceScore: 0,
    isThief: false,
  };
}

export async function getSelfieCapture(captureId: string) {
  const capture = await SelfieCapture.findOne({ captureId });
  if (!capture) throw new Error("Capture not found");
  return capture;
}

export async function getSelfieCapturesByDevice(deviceId: string) {
  const captures = await SelfieCapture.find({ deviceId }).sort({ captureDate: -1 });
  return captures;
}

export async function getSelfieCapturesByUser(userId: string) {
  const captures = await SelfieCapture.find({ userId }).sort({ captureDate: -1 });
  return captures;
}

export async function getPendingCaptures() {
  const captures = await SelfieCapture.find({ status: "pending" }).sort({ captureDate: -1 });
  return captures;
}

export async function getThiefCaptures() {
  const captures = await SelfieCapture.find({ isThief: true }).sort({ captureDate: -1 });
  return captures;
}

// ── Thief Report Management ───────────────────────────────────────────────────────────
export async function reportThief(data: any) {
  const reportId = `report_${crypto.randomBytes(16).toString("hex")}`;

  const report = await ThiefReport.create({
    ...data,
    reportId,
    status: "pending",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Update selfie capture as reported
  const capture = await SelfieCapture.findById(data.selfieCaptureId);
  if (capture) {
    (capture as any).thiefReported = true;
    (capture as any).thiefReportedTo = data.reportedTo;
    (capture as any).status = "reported";
    capture.updatedAt = new Date();
    await capture.save();
  }

  return report;
}

export async function autoReportThief(captureId: string) {
  const capture = await SelfieCapture.findOne({ captureId });
  if (!capture) throw new Error("Capture not found");

  if (!(capture as any).isThief) {
    throw new Error("Capture is not identified as thief");
  }

  // Auto-report to police and security organs
  const reportId = `report_${crypto.randomBytes(16).toString("hex")}`;

  const report = await ThiefReport.create({
    reportId,
    deviceId: (capture as any).deviceId,
    userId: (capture as any).userId,
    selfieCaptureId: capture._id,
    reportDate: new Date(),
    reportReason: "AI-identified thief attempting to unlock stolen device",
    reportedTo: ["police", "security-organs"],
    thiefIdentified: (capture as any).identified,
    thiefUserId: (capture as any).matchedUserId,
    status: "investigating",
    createdBy: (capture as any).userId,
    updatedBy: (capture as any).userId,
  });

  // Update capture
  (capture as any).thiefReported = true;
  (capture as any).thiefReportedTo = ["police", "security-organs"];
  (capture as any).status = "reported";
  capture.updatedAt = new Date();
  await capture.save();

  return report;
}

export async function updateThiefReport(reportId: string, updates: any, updatedBy: string) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");

  Object.assign(report, updates);
  (report as any).updatedBy = updatedBy;
  report.updatedAt = new Date();
  await report.save();

  return report;
}

export async function resolveThiefReport(reportId: string, resolution: string, resolvedBy: string) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");

  (report as any).status = "resolved";
  (report as any).resolution = resolution;
  (report as any).resolvedAt = new Date();
  (report as any).resolvedBy = resolvedBy;
  report.updatedAt = new Date();
  await report.save();

  return report;
}

export async function getThiefReport(reportId: string) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");
  return report;
}

export async function getThiefReportsByDevice(deviceId: string) {
  const reports = await ThiefReport.find({ deviceId }).sort({ reportDate: -1 });
  return reports;
}

export async function getThiefReportsByUser(userId: string) {
  const reports = await ThiefReport.find({ userId }).sort({ reportDate: -1 });
  return reports;
}

export async function getPendingThiefReports() {
  const reports = await ThiefReport.find({ status: "pending" }).sort({ reportDate: -1 });
  return reports;
}

export async function getInvestigatingThiefReports() {
  const reports = await ThiefReport.find({ status: "investigating" }).sort({ reportDate: -1 });
  return reports;
}

// Import helper functions
import { checkDeviceLockStatus } from "./deviceLock.js";
import { recordUnlockAttempt } from "./deviceLock.js";
