// services/crossBorder.js - Cross-Border Enforcement Module
// International cooperation and legal framework for device recovery

import { CrossBorderRequest, RecoveryCase, Device } from "../db/index.js";
import { recordCrossBorderRequest } from "./blockchain.js";
import { getIO } from "./socket.js";

// ── Legal Framework Configuration ───────────────────────────────────────────────────
const LEGAL_FRAMEWORKS = {
  MLAT: {
    name: "Mutual Legal Assistance Treaty",
    processingTime: 30, // days
    requiredFields: ["requestingAuthority", "targetAuthority", "referenceNumber"],
  },
  INTERPOL: {
    name: "Interpol Notice",
    processingTime: 14, // days
    requiredFields: ["referenceNumber"],
  },
  BILATERAL: {
    name: "Bilateral Agreement",
    processingTime: 21, // days
    requiredFields: ["requestingAuthority", "targetAuthority"],
  },
};

// ── Create Cross-Border Request ─────────────────────────────────────────────────────
export async function createCrossBorderRequest(data) {
  const {
    imei,
    recoveryCaseId,
    requestingCountry,
    targetCountry,
    requestType,
    treaty,
    referenceNumber,
    priority = "medium",
    requestingAuthority,
    targetAuthority,
    evidence = [],
  } = data;

  const device = await Device.findOne({ imei });
  if (!device) throw new Error("Device not found");

  const recoveryCase = recoveryCaseId 
    ? await RecoveryCase.findById(recoveryCaseId)
    : null;

  // Validate legal framework
  if (treaty && !LEGAL_FRAMEWORKS[treaty.toUpperCase()]) {
    throw new Error(`Invalid treaty: ${treaty}`);
  }

  // Calculate expiry based on treaty processing time
  const processingDays = treaty 
    ? LEGAL_FRAMEWORKS[treaty.toUpperCase()].processingTime 
    : 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + processingDays);

  const request = await CrossBorderRequest.create({
    imei,
    device: device._id,
    recoveryCase: recoveryCaseId,
    requestingCountry,
    targetCountry,
    requestType,
    treaty,
    referenceNumber,
    priority,
    requestingAuthority,
    targetAuthority,
    evidence,
    status: "pending",
    submittedAt: new Date(),
    expiresAt,
  });

  // Record on blockchain
  const ledgerEntry = await recordCrossBorderRequest(imei, requestingCountry, targetCountry);
  request.ledgerEntry = ledgerEntry._id;
  await request.save();

  // Update recovery case if linked
  if (recoveryCase) {
    recoveryCase.crossBorder = true;
    recoveryCase.countriesInvolved = [requestingCountry, targetCountry];
    await recoveryCase.save();
  }

  // Notify via socket
  getIO().emit("cross_border_request_created", {
    requestId: request._id,
    imei,
    requestingCountry,
    targetCountry,
    priority,
  });

  return request;
}

// ── Update Request Status ─────────────────────────────────────────────────────────
export async function updateRequestStatus(requestId, status, outcome, outcomeDetails) {
  const request = await CrossBorderRequest.findById(requestId);
  if (!request) throw new Error("Cross-border request not found");

  request.status = status;
  request.outcome = outcome;
  request.outcomeDetails = outcomeDetails;
  request.updatedAt = new Date();

  if (status === "acknowledged") {
    request.acknowledgedAt = new Date();
  } else if (status === "completed") {
    request.completedAt = new Date();
  }

  await request.save();

  // Notify via socket
  getIO().emit("cross_border_request_updated", {
    requestId,
    status,
    imei: request.imei,
  });

  return request;
}

// ── Add Evidence to Request ───────────────────────────────────────────────────────
export async function addEvidence(requestId, evidence) {
  const request = await CrossBorderRequest.findById(requestId);
  if (!request) throw new Error("Cross-border request not found");

  request.evidence.push({
    ...evidence,
    uploadedAt: new Date(),
  });

  await request.save();
  return request;
}

// ── Auto-Acknowledge Request (Simulation) ─────────────────────────────────────────
export async function autoAcknowledgeRequest(requestId) {
  const request = await CrossBorderRequest.findById(requestId);
  if (!request) throw new Error("Cross-border request not found");

  // Simulate acknowledgement delay based on priority
  const delayHours = {
    urgent: 4,
    high: 12,
    medium: 24,
    low: 48,
  }[request.priority] || 24;

  setTimeout(async () => {
    await updateRequestStatus(
      requestId,
      "acknowledged",
      null,
      `Request acknowledged by ${request.targetCountry} authorities`
    );
  }, delayHours * 60 * 60 * 1000);

  return request;
}

// ── Check Request Expiry ───────────────────────────────────────────────────────────
export async function checkRequestExpiry() {
  const now = new Date();
  const expiredRequests = await CrossBorderRequest.find({
    status: { $in: ["pending", "acknowledged", "in_progress"] },
    expiresAt: { $lt: now },
  });

  for (const request of expiredRequests) {
    await updateRequestStatus(
      request._id,
      "expired",
      "Request expired without resolution",
      `Request expired on ${request.expiresAt.toISOString()}`
    );
  }

  return expiredRequests.length;
}

// ── Query Requests ───────────────────────────────────────────────────────────────
export async function getCrossBorderRequest(requestId) {
  const request = await CrossBorderRequest.findById(requestId)
    .populate("device")
    .populate("recoveryCase")
    .populate("ledgerEntry");

  return request;
}

export async function getRequestsByImei(imei) {
  const requests = await CrossBorderRequest.find({ imei })
    .populate("device")
    .sort({ submittedAt: -1 });

  return requests;
}

export async function getRequestsByCountry(country, role = "requesting") {
  const query = role === "requesting" 
    ? { requestingCountry: country }
    : { targetCountry: country };

  const requests = await CrossBorderRequest.find(query)
    .populate("device")
    .sort({ submittedAt: -1 });

  return requests;
}

export async function getPendingRequests() {
  const requests = await CrossBorderRequest.find({
    status: { $in: ["pending", "acknowledged", "in_progress"] },
  })
    .populate("device")
    .sort({ priority: -1, submittedAt: -1 });

  return requests;
}

export async function getRequestsByTreaty(treaty) {
  const requests = await CrossBorderRequest.find({ treaty })
    .populate("device")
    .sort({ submittedAt: -1 });

  return requests;
}

// ── Cross-Border Statistics ─────────────────────────────────────────────────────────
export async function getCrossBorderStatistics() {
  const [
    totalRequests,
    pendingRequests,
    acknowledgedRequests,
    inProgressRequests,
    approvedRequests,
    rejectedRequests,
    completedRequests,
    expiredRequests,
    requestsByCountry,
    requestsByTreaty,
    requestsByType,
  ] = await Promise.all([
    CrossBorderRequest.countDocuments(),
    CrossBorderRequest.countDocuments({ status: "pending" }),
    CrossBorderRequest.countDocuments({ status: "acknowledged" }),
    CrossBorderRequest.countDocuments({ status: "in_progress" }),
    CrossBorderRequest.countDocuments({ status: "approved" }),
    CrossBorderRequest.countDocuments({ status: "rejected" }),
    CrossBorderRequest.countDocuments({ status: "completed" }),
    CrossBorderRequest.countDocuments({ status: "expired" }),
    CrossBorderRequest.aggregate([
      { $group: { _id: "$requestingCountry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    CrossBorderRequest.aggregate([
      { $group: { _id: "$treaty", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CrossBorderRequest.aggregate([
      { $group: { _id: "$requestType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const totalClosed = approvedRequests + rejectedRequests + completedRequests + expiredRequests;
  const successRate = totalClosed > 0 
    ? ((approvedRequests + completedRequests) / totalClosed * 100).toFixed(2) 
    : 0;

  // Calculate average processing time
  const avgProcessingTime = await CrossBorderRequest.aggregate([
    { $match: { status: { $in: ["approved", "rejected", "completed"] } } },
    {
      $project: {
        processingTime: {
          $subtract: ["$completedAt", "$submittedAt"],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: "$processingTime" },
      },
    },
  ]);

  return {
    totalRequests,
    pendingRequests,
    acknowledgedRequests,
    inProgressRequests,
    approvedRequests,
    rejectedRequests,
    completedRequests,
    expiredRequests,
    totalClosed,
    successRate,
    avgProcessingDays: avgProcessingTime[0]?.avgTime 
      ? Math.round(avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0,
    requestsByCountry: requestsByCountry.map(r => ({
      country: r._id,
      count: r.count,
    })),
    requestsByTreaty: requestsByTreaty.map(r => ({
      treaty: r._id,
      count: r.count,
    })),
    requestsByType: requestsByType.map(r => ({
      type: r._id,
      count: r.count,
    })),
  };
}

// ── Interpol Integration (Simulation) ───────────────────────────────────────────────
export async function submitToInterpol(requestId) {
  const request = await CrossBorderRequest.findById(requestId);
  if (!request) throw new Error("Cross-border request not found");

  // Generate Interpol reference number
  const interpolRef = `INT-${request.requestingCountry}-${Date.now()}-${request.imei.slice(-6)}`;

  // Update request with Interpol details
  request.treaty = "INTERPOL";
  request.referenceNumber = interpolRef;
  request.priority = request.priority === "low" ? "medium" : request.priority; // Upgrade priority for Interpol
  await request.save();

  // Simulate Interpol submission
  await updateRequestStatus(
    requestId,
    "in_progress",
    null,
    `Submitted to Interpol with reference ${interpolRef}`
  );

  // Update recovery case if linked
  if (request.recoveryCase) {
    const recoveryCase = await RecoveryCase.findById(request.recoveryCase);
    if (recoveryCase) {
      recoveryCase.interpolRef = interpolRef;
      await recoveryCase.save();
    }
  }

  return { interpolRef, request };
}

// ── MLAT Request Generator ─────────────────────────────────────────────────────────
export async function generateMlatRequest(requestId) {
  const request = await CrossBorderRequest.findById(requestId)
    .populate("device")
    .populate("recoveryCase");

  if (!request) throw new Error("Cross-border request not found");

  // Generate MLAT document structure
  const mlatDocument = {
    documentType: "Mutual Legal Assistance Treaty Request",
    referenceNumber: request.referenceNumber,
    date: new Date().toISOString(),
    
    requestingCountry: request.requestingCountry,
    requestingAuthority: request.requestingAuthority,
    
    targetCountry: request.targetCountry,
    targetAuthority: request.targetAuthority,
    
    subject: {
      imei: request.imei,
      device: request.device,
      recoveryCase: request.recoveryCase,
    },
    
    requestType: request.requestType,
    priority: request.priority,
    
    evidence: request.evidence,
    
    legalBasis: {
      treaty: request.treaty,
      applicableLaw: "Domestic theft and fraud legislation",
    },
    
    requestedActions: {
      locationRequest: "Provide current location of device",
      deviceSeizure: "Seize device if found",
      investigationAssist: "Assist in investigation",
      evidenceSharing: "Share any evidence obtained",
    },
  };

  return mlatDocument;
}

// ── Country Compliance Check ─────────────────────────────────────────────────────
export async function checkCountryCompliance(requestingCountry, targetCountry) {
  // In production, this would check actual bilateral agreements
  const compliantPairs = [
    ["KE", "UG"], ["KE", "TZ"], ["KE", "RW"], // Kenya with East Africa
    ["UG", "KE"], ["UG", "TZ"], ["UG", "RW"],
    ["TZ", "KE"], ["TZ", "UG"], ["TZ", "RW"],
    ["RW", "KE"], ["RW", "UG"], ["RW", "TZ"],
  ];

  const isCompliant = compliantPairs.some(
    pair => (pair[0] === requestingCountry && pair[1] === targetCountry) ||
           (pair[1] === requestingCountry && pair[0] === targetCountry)
  );

  return {
    compliant: isCompliant,
    recommendedTreaty: isCompliant ? "BILATERAL" : "MLAT",
    estimatedProcessingTime: isCompliant ? 21 : 30, // days
  };
}
