// services/insurance.ts - Insurance Tech Integration
// Device insurance policy and claims management

import { InsurancePolicy, InsuranceClaim, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Policy Management ─────────────────────────────────────────────────────────────
export async function createInsurancePolicy(data: Record<string, unknown>) {
  const {
    userId,
    provider,
    providerId,
    coverageType,
    devices,
    premium,
    currency,
    deductible,
    coverageLimit,
    startDate,
    endDate,
  } = data as {
    userId: string;
    provider: string;
    providerId: string;
    coverageType: string;
    devices: string[];
    premium: number;
    currency: string;
    deductible: number;
    coverageLimit: number;
    startDate: Date;
    endDate: Date;
  };

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Validate devices
  for (const deviceId of devices) {
    const device = await Device.findById(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (device.owner?.toString() !== userId) {
      throw new Error("Device does not belong to user");
    }
  }

  // Generate policy number
  const policyNumber = `POL-${provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const policy = await InsurancePolicy.create({
    user: userId,
    policyNumber,
    provider,
    providerId,
    coverageType,
    devices,
    premium,
    currency,
    deductible,
    coverageLimit,
    startDate,
    endDate,
    renewalDate: new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before expiry
    status: "active",
  });

  // Notify via socket
  getIO().to(`user:${userId}`).emit("insurance_policy_created", {
    policyId: policy._id,
    policyNumber,
  });

  return policy;
}

export async function getInsurancePolicy(policyId: string) {
  const policy = await InsurancePolicy.findById(policyId)
    .populate("user", "name email")
    .populate("devices")
    .populate("claims");

  return policy;
}

export async function getPoliciesByUser(userId: string) {
  const policies = await InsurancePolicy.find({ user: userId })
    .populate("devices")
    .sort({ createdAt: -1 });

  return policies;
}

export async function updatePolicyStatus(policyId: string, status: string) {
  const policy = await InsurancePolicy.findById(policyId);
  if (!policy) throw new Error("Policy not found");

  policy.status = status;
  policy.updatedAt = new Date();
  await policy.save();

  return policy;
}

// ── Claim Management ─────────────────────────────────────────────────────────────
export async function createInsuranceClaim(data: Record<string, unknown>) {
  const {
    policyId,
    userId,
    deviceId,
    claimType,
    incidentDate,
    incidentLocation,
    description,
    evidence,
    policeReportNumber,
    policeStation,
    claimedAmount,
    currency,
  } = data as {
    policyId: string;
    userId: string;
    deviceId: string;
    claimType: string;
    incidentDate: Date;
    incidentLocation: string;
    description: string;
    evidence?: string[];
    policeReportNumber?: string;
    policeStation?: string;
    claimedAmount: number;
    currency: string;
  };

  const policy = await InsurancePolicy.findById(policyId);
  if (!policy) throw new Error("Policy not found");

  if (policy.user.toString() !== userId) {
    throw new Error("Policy does not belong to user");
  }

  if (policy.status !== "active") {
    throw new Error("Policy is not active");
  }

  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  if (!policy.devices.includes(deviceId)) {
    throw new Error("Device not covered by policy");
  }

  // Generate claim number
  const claimNumber = `CLM-${policy.provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const claim = await InsuranceClaim.create({
    policy: policyId,
    user: userId,
    device: deviceId,
    claimNumber,
    claimType,
    incidentDate,
    incidentLocation,
    description,
    evidence: evidence || [],
    policeReportNumber,
    policeStation,
    claimedAmount,
    currency,
    status: "submitted",
  });

  // Add claim to policy
  policy.claims.push(claim._id);
  await policy.save();

  // Notify via socket
  getIO().to(`user:${userId}`).emit("insurance_claim_submitted", {
    claimId: claim._id,
    claimNumber,
  });

  return claim;
}

export async function getInsuranceClaim(claimId: string) {
  const claim = await InsuranceClaim.findById(claimId)
    .populate("policy")
    .populate("user", "name email")
    .populate("device")
    .populate("assessor", "name email");

  return claim;
}

export async function getClaimsByUser(userId: string) {
  const claims = await InsuranceClaim.find({ user: userId })
    .populate("policy", "policyNumber provider")
    .populate("device", "imei make model")
    .sort({ createdAt: -1 });

  return claims;
}

export async function updateClaimStatus(claimId: string, status: string, assessorId: string, assessmentNotes?: string, approvedAmount?: number) {
  const claim = await InsuranceClaim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  claim.status = status;
  claim.assessor = assessorId;
  claim.assessmentNotes = assessmentNotes;
  claim.assessmentDate = new Date();

  if (status === "approved" && approvedAmount) {
    claim.approvedAmount = approvedAmount;
  }

  if (status === "paid") {
    claim.paymentDate = new Date();
    claim.paymentReference = `PAY-${Date.now()}`;
  }

  claim.updatedAt = new Date();
  await claim.save();

  // Notify via socket
  getIO().to(`user:${claim.user}`).emit("insurance_claim_updated", {
    claimId,
    status,
  });

  return claim;
}

export async function addClaimEvidence(claimId: string, evidence: Record<string, unknown>) {
  const claim = await InsuranceClaim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  claim.evidence.push({
    ...evidence,
    uploadedAt: new Date(),
  } as typeof evidence extends Array<infer U> ? U : never);

  claim.updatedAt = new Date();
  await claim.save();

  return claim;
}

export async function markDeviceRecovered(claimId: string) {
  const claim = await InsuranceClaim.findById(claimId);
  if (!claim) throw new Error("Claim not found");

  claim.deviceRecovered = true;
  claim.recoveryDate = new Date();
  claim.updatedAt = new Date();
  await claim.save();

  return claim;
}

// ── Insurance Analytics ─────────────────────────────────────────────────────────
export async function getInsuranceStatistics() {
  const [
    totalPolicies,
    activePolicies,
    expiredPolicies,
    totalClaims,
    pendingClaims,
    approvedClaims,
    rejectedClaims,
    paidClaims,
    totalClaimedAmount,
    totalApprovedAmount,
    totalPaidAmount,
  ] = await Promise.all([
    InsurancePolicy.countDocuments(),
    InsurancePolicy.countDocuments({ status: "active" }),
    InsurancePolicy.countDocuments({ status: "expired" }),
    InsuranceClaim.countDocuments(),
    InsuranceClaim.countDocuments({ status: "submitted" }),
    InsuranceClaim.countDocuments({ status: "approved" }),
    InsuranceClaim.countDocuments({ status: "rejected" }),
    InsuranceClaim.countDocuments({ status: "paid" }),
    InsuranceClaim.aggregate([
      { $group: { _id: null, total: { $sum: "$claimedAmount" } } },
    ]),
    InsuranceClaim.aggregate([
      { $match: { status: { $in: ["approved", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
    ]),
    InsuranceClaim.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
    ]),
  ]);

  const claimApprovalRate = totalClaims > 0 
    ? ((approvedClaims / totalClaims) * 100).toFixed(2) 
    : 0;

  const avgClaimAmount = totalClaims > 0 
    ? (totalClaimedAmount[0]?.total / totalClaims).toFixed(2) 
    : 0;

  return {
    totalPolicies,
    activePolicies,
    expiredPolicies,
    totalClaims,
    pendingClaims,
    approvedClaims,
    rejectedClaims,
    paidClaims,
    claimApprovalRate,
    totalClaimedAmount: totalClaimedAmount[0]?.total || 0,
    totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
    totalPaidAmount: totalPaidAmount[0]?.total || 0,
    avgClaimAmount,
  };
}

export async function getProviderStatistics(providerId: string) {
  const [
    totalPolicies,
    activePolicies,
    totalClaims,
    approvedClaims,
    paidClaims,
  ] = await Promise.all([
    InsurancePolicy.countDocuments({ providerId }),
    InsurancePolicy.countDocuments({ providerId, status: "active" }),
    InsuranceClaim.aggregate([
      { $lookup: { from: "insurancepolicies", localField: "policy", foreignField: "_id", as: "policy" } },
      { $match: { "policy.providerId": providerId } },
      { $count: "total" },
    ]),
    InsuranceClaim.aggregate([
      { $lookup: { from: "insurancepolicies", localField: "policy", foreignField: "_id", as: "policy" } },
      { $match: { "policy.providerId": providerId, status: "approved" } },
      { $count: "total" },
    ]),
    InsuranceClaim.aggregate([
      { $lookup: { from: "insurancepolicies", localField: "policy", foreignField: "_id", as: "policy" } },
      { $match: { "policy.providerId": providerId, status: "paid" } },
      { $count: "total" },
    ]),
  ]);

  return {
    totalPolicies,
    activePolicies,
    totalClaims: totalClaims[0]?.total || 0,
    approvedClaims: approvedClaims[0]?.total || 0,
    paidClaims: paidClaims[0]?.total || 0,
  };
}

// ── Policy Renewal ─────────────────────────────────────────────────────────────
export async function checkPolicyExpiry() {
  const now = new Date();
  const expiringPolicies = await InsurancePolicy.find({
    status: "active",
    endDate: { $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }, // Expiring within 30 days
  });

  for (const policy of expiringPolicies) {
    getIO().to(`user:${policy.user}`).emit("policy_expiring_soon", {
      policyId: policy._id,
      policyNumber: policy.policyNumber,
      endDate: policy.endDate,
      renewalDate: policy.renewalDate,
    });
  }

  // Mark expired policies
  const expiredPolicies = await InsurancePolicy.find({
    status: "active",
    endDate: { $lt: now },
  });

  for (const policy of expiredPolicies) {
    await updatePolicyStatus(policy._id, "expired");
  }

  return {
    expiringSoon: expiringPolicies.length,
    markedExpired: expiredPolicies.length,
  };
}

export async function renewPolicy(policyId: string, newEndDate: Date) {
  const policy = await InsurancePolicy.findById(policyId);
  if (!policy) throw new Error("Policy not found");

  policy.endDate = newEndDate;
  policy.renewalDate = new Date(newEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  policy.status = "active";
  policy.updatedAt = new Date();
  await policy.save();

  return policy;
}
