// services/selfieCapture.js - Selfie capture and thief identification services
import crypto from "crypto";
import cryptoJS from "crypto-js";
import {
  SelfieCapture,
  ThiefReport,
  Device,
  User,
} from "../db/index.js";

// ── Selfie Capture Management ─────────────────────────────────────────────────────────
export async function captureSelfie(data) {
  const captureId = `capture_${crypto.randomBytes(16).toString("hex")}`;

  // Generate image hash for deduplication
  const imageHash = cryptoJS.SHA256(data.imageUrl).toString();

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
    status: "pending",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Record unlock attempt on lock
  await recordUnlockAttempt(lock.lockId, data.captureLocation);

  // Trigger AI analysis
  await analyzeSelfie(captureId);

  return capture;
}

export async function analyzeSelfie(captureId) {
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
  const aiResult = await performAIAnalysis(capture.imageUrl);

  capture.aiAnalyzed = true;
  capture.aiAnalysisDate = new Date();
  capture.identified = aiResult.identified;
  capture.matchedUserId = aiResult.matchedUserId;
  capture.confidenceScore = aiResult.confidenceScore;
  capture.isThief = aiResult.isThief;
  capture.status = aiResult.identified ? "identified" : "analyzed";
  capture.updatedAt = new Date();
  await capture.save();

  // If thief identified, auto-report
  if (capture.isThief) {
    await autoReportThief(captureId);
  }

  return capture;
}

// Placeholder for AI analysis - integrate with actual AI service
async function performAIAnalysis(imageUrl) {
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

export async function getSelfieCapture(captureId) {
  const capture = await SelfieCapture.findOne({ captureId });
  if (!capture) throw new Error("Capture not found");
  return capture;
}

export async function getSelfieCapturesByDevice(deviceId) {
  const captures = await SelfieCapture.find({ deviceId }).sort({ captureDate: -1 });
  return captures;
}

export async function getSelfieCapturesByUser(userId) {
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
export async function reportThief(data) {
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
    capture.thiefReported = true;
    capture.thiefReportedTo = data.reportedTo;
    capture.status = "reported";
    capture.updatedAt = new Date();
    await capture.save();
  }

  return report;
}

export async function autoReportThief(captureId) {
  const capture = await SelfieCapture.findOne({ captureId });
  if (!capture) throw new Error("Capture not found");

  if (!capture.isThief) {
    throw new Error("Capture is not identified as thief");
  }

  // Auto-report to police and security organs
  const reportId = `report_${crypto.randomBytes(16).toString("hex")}`;

  const report = await ThiefReport.create({
    reportId,
    deviceId: capture.deviceId,
    userId: capture.userId,
    selfieCaptureId: capture._id,
    reportDate: new Date(),
    reportReason: "AI-identified thief attempting to unlock stolen device",
    reportedTo: ["police", "security-organs"],
    thiefIdentified: capture.identified,
    thiefUserId: capture.matchedUserId,
    status: "investigating",
    createdBy: capture.userId,
    updatedBy: capture.userId,
  });

  // Update capture
  capture.thiefReported = true;
  capture.thiefReportedTo = ["police", "security-organs"];
  capture.status = "reported";
  capture.updatedAt = new Date();
  await capture.save();

  return report;
}

export async function updateThiefReport(reportId, updates, updatedBy) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");

  Object.assign(report, updates);
  report.updatedBy = updatedBy;
  report.updatedAt = new Date();
  await report.save();

  return report;
}

export async function resolveThiefReport(reportId, resolution, resolvedBy) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");

  report.status = "resolved";
  report.resolution = resolution;
  report.resolvedAt = new Date();
  report.resolvedBy = resolvedBy;
  report.updatedAt = new Date();
  await report.save();

  return report;
}

export async function getThiefReport(reportId) {
  const report = await ThiefReport.findOne({ reportId });
  if (!report) throw new Error("Report not found");
  return report;
}

export async function getThiefReportsByDevice(deviceId) {
  const reports = await ThiefReport.find({ deviceId }).sort({ reportDate: -1 });
  return reports;
}

export async function getThiefReportsByUser(userId) {
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
