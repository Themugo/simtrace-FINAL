// services/gdpr.ts - GDPR Compliance Service
// Data privacy and GDPR compliance features

import { GdprRequest, DataResidency, User, Device, Ping, Alert, TheftReport } from "../db/index.js";
import crypto from "crypto";

// ── GDPR Request Management ───────────────────────────────────────────────────────
export async function createGdprRequest(data: any) {
  const {
    userId,
    requestType,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const gdprArticle = getGdprArticle(requestType);

  const request = await GdprRequest.create({
    user: userId,
    requestType,
    status: "pending",
    gdprArticle,
  });

  return request;
}

export async function getGdprRequest(requestId: string) {
  const request = await GdprRequest.findById(requestId)
    .populate("user", "name email")
    .populate("processedBy", "name email");

  return request;
}

export async function getGdprRequestsByUser(userId: string) {
  const requests = await GdprRequest.find({ user: userId })
    .sort({ createdAt: -1 });

  return requests;
}

export async function processGdprRequest(requestId: string, processedBy: string) {
  const request = await GdprRequest.findById(requestId);
  if (!request) throw new Error("GDPR request not found");

  if (request.status !== "pending") {
    throw new Error("Request has already been processed");
  }

  request.status = "processing";
  request.processedBy = processedBy;
  request.processedAt = new Date();
  await request.save();

  // Process based on request type
  switch (request.requestType) {
    case "data_export":
      await processDataExport(request);
      break;
    case "data_deletion":
      await processDataDeletion(request);
      break;
    case "access_request":
      await processAccessRequest(request);
      break;
    case "rectification":
      await processRectification(request);
      break;
  }

  return request;
}

async function processDataExport(request: any) {
  const user = await User.findById(request.user);
  if (!user) throw new Error("User not found");

  // Collect all user data
  const userData = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    devices: await Device.find({ user: user._id }),
    pings: await Ping.find({ device: { $in: (await Device.find({ user: user._id })).map((d: any) => d._id) } }),
    alerts: await Alert.find({ user: user._id }),
    theftReports: await TheftReport.find({ user: user._id }),
  };

  // Generate export file (simplified - in production would create a secure download)
  const exportData = JSON.stringify(userData, null, 2);
  const exportHash = crypto.createHash("sha256").update(exportData).digest("hex");

  // Set export URL (in production, upload to secure storage)
  request.exportUrl = `https://simtrace.com/exports/${exportHash}`;
  request.exportExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  request.status = "completed";
  request.updatedAt = new Date();
  await request.save();
}

async function processDataDeletion(request: any) {
  const user = await User.findById(request.user);
  if (!user) throw new Error("User not found");

  // Delete user's devices
  await Device.deleteMany({ user: user._id });

  // Delete user's pings
  const deviceIds = (await Device.find({ user: user._id })).map((d: any) => d._id);
  await Ping.deleteMany({ device: { $in: deviceIds } });

  // Delete user's alerts
  await Alert.deleteMany({ user: user._id });

  // Delete user's theft reports
  await TheftReport.deleteMany({ user: user._id });

  // Anonymize user account
  user.name = "Deleted User";
  user.email = `deleted_${user._id}@simtrace.com`;
  user.phone = null;
  await user.save();

  request.status = "completed";
  request.updatedAt = new Date();
  await request.save();
}

async function processAccessRequest(request: any) {
  // Similar to data export but for review
  await processDataExport(request);
}

async function processRectification(request: any) {
  // User would need to provide corrected data
  request.status = "completed";
  request.updatedAt = new Date();
  await request.save();
}

export async function rejectGdprRequest(requestId: string, reason: string) {
  const request = await GdprRequest.findById(requestId);
  if (!request) throw new Error("GDPR request not found");

  request.status = "rejected";
  request.rejectionReason = reason;
  request.updatedAt = new Date();
  await request.save();

  return request;
}

// ── Data Residency Management ─────────────────────────────────────────────────────
export async function setDataResidency(data: any) {
  const {
    userId,
    region,
    storageLocations,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const residency = await DataResidency.create({
    user: userId,
    region,
    storageLocations: storageLocations || [],
    gdprCompliant: region === "eu",
    ccpaCompliant: region === "us",
  });

  return residency;
}

export async function getDataResidency(userId: string) {
  const residency = await DataResidency.findOne({ user: userId });
  return residency;
}

export async function updateDataResidency(userId: string, updates: any) {
  const residency = await DataResidency.findOne({ user: userId });
  if (!residency) throw new Error("Data residency not found");

  const allowedUpdates = ["region", "storageLocations", "gdprCompliant", "ccpaCompliant"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (residency as any)[key] = updates[key];
    }
  }

  residency.updatedAt = new Date();
  await residency.save();

  return residency;
}

// ── GDPR Compliance Helpers ───────────────────────────────────────────────────────
function getGdprArticle(requestType: string): string {
  const articles: Record<string, string> = {
    data_export: "Article 15 - Right of access",
    data_deletion: "Article 17 - Right to erasure",
    access_request: "Article 15 - Right of access",
    rectification: "Article 16 - Right to rectification",
  };
  return articles[requestType] || "Unknown";
}

export async function checkGdprCompliance(userId: string) {
  const residency = await DataResidency.findOne({ user: userId });

  if (!residency) {
    return {
      compliant: false,
      reason: "No data residency configured",
    };
  }

  const isEuUser = residency.region === "eu";
  const isUsUser = residency.region === "us";

  return {
    gdprCompliant: residency.gdprCompliant,
    ccpaCompliant: residency.ccpaCompliant,
    region: residency.region,
    storageLocations: residency.storageLocations,
  };
}

// ── GDPR Statistics ─────────────────────────────────────────────────────────────
export async function getGdprStatistics() {
  const [
    totalRequests,
    pendingRequests,
    completedRequests,
    rejectedRequests,
    requestsByType,
    euUsers,
    usUsers,
  ] = await Promise.all([
    GdprRequest.countDocuments(),
    GdprRequest.countDocuments({ status: "pending" }),
    GdprRequest.countDocuments({ status: "completed" }),
    GdprRequest.countDocuments({ status: "rejected" }),
    GdprRequest.aggregate([
      { $group: { _id: "$requestType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    DataResidency.countDocuments({ region: "eu" }),
    DataResidency.countDocuments({ region: "us" }),
  ]);

  return {
    totalRequests,
    pendingRequests,
    completedRequests,
    rejectedRequests,
    requestsByType: requestsByType.map((r: any) => ({ type: r._id, count: r.count })),
    euUsers,
    usUsers,
  };
}

// ── Data Export Download ─────────────────────────────────────────────────────────
export async function getExportUrl(requestId: string) {
  const request = await GdprRequest.findById(requestId);

  if (!request) throw new Error("Request not found");
  if (request.requestType !== "data_export") throw new Error("Not a data export request");
  if (request.status !== "completed") throw new Error("Export not ready");
  if (request.exportExpiresAt < new Date()) throw new Error("Export link has expired");

  return request.exportUrl;
}
