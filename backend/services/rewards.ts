// services/rewards.ts - Recovery Reward System
// Reward system for device recovery network

import { RecoveryReward, RecoveryCase, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Reward Creation ───────────────────────────────────────────────────────────────
export async function createRecoveryReward(data: any) {
  const {
    recoveryCaseId,
    deviceId,
    imei,
    rewardAmount,
    currency,
    expiresAt,
    terms,
  } = data;

  const recoveryCase = await RecoveryCase.findById(recoveryCaseId);
  if (!recoveryCase) throw new Error("Recovery case not found");

  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  const reward = await RecoveryReward.create({
    recoveryCase: recoveryCaseId,
    device: deviceId,
    imei,
    rewardAmount,
    currency: currency || "USD",
    status: "offered",
    expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    terms: terms || "Reward will be paid upon successful device recovery",
  });

  // Notify via socket
  getIO().emit("reward_offered", {
    rewardId: reward._id,
    imei,
    rewardAmount,
    currency,
  });

  return reward;
}

export async function getReward(rewardId: string) {
  const reward = await RecoveryReward.findById(rewardId)
    .populate("recoveryCase")
    .populate("device", "imei make model")
    .populate("recipient", "name email");

  return reward;
}

export async function getRewardsByDevice(deviceId: string) {
  const rewards = await RecoveryReward.find({ device: deviceId })
    .populate("recoveryCase")
    .populate("recipient", "name email")
    .sort({ createdAt: -1 });

  return rewards;
}

export async function getRewardsByRecipient(recipientId: string) {
  const rewards = await RecoveryReward.find({ recipient: recipientId })
    .populate("device", "imei make model")
    .populate("recoveryCase")
    .sort({ createdAt: -1 });

  return rewards;
}

// ── Reward Claiming ─────────────────────────────────────────────────────────────
export async function claimReward(rewardId: string, recipientId: string, recipientType: string) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if ((reward as any).status !== "offered") {
    throw new Error("Reward is not available for claiming");
  }

  if ((reward as any).expiresAt < new Date()) {
    (reward as any).status = "expired";
    await reward.save();
    throw new Error("Reward has expired");
  }

  const user = await User.findById(recipientId);
  if (!user) throw new Error("User not found");

  (reward as any).recipient = recipientId;
  (reward as any).recipientType = recipientType || "finder";
  (reward as any).status = "claimed";
  reward.updatedAt = new Date();
  await reward.save();

  // Notify via socket
  getIO().to(`user:${(reward as any).recoveryCase.user}`).emit("reward_claimed", {
    rewardId: reward._id,
    imei: (reward as any).imei,
    recipient: (user as any).name,
  });

  return reward;
}

// ── Reward Payment ─────────────────────────────────────────────────────────────
export async function payReward(rewardId: string, paymentMethod: string, paymentReference: string) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if ((reward as any).status !== "claimed") {
    throw new Error("Reward must be claimed before payment");
  }

  if (!(reward as any).recipient) {
    throw new Error("Reward has no recipient");
  }

  // Process payment (simplified - would integrate with payment gateways)
  (reward as any).paymentMethod = paymentMethod;
  (reward as any).paymentReference = paymentReference;
  (reward as any).status = "paid";
  (reward as any).paidAt = new Date();
  reward.updatedAt = new Date();
  await reward.save();

  // Notify recipient
  getIO().to(`user:${(reward as any).recipient}`).emit("reward_paid", {
    rewardId: reward._id,
    amount: (reward as any).rewardAmount,
    currency: (reward as any).currency,
  });

  return reward;
}

// ── Reward Management ───────────────────────────────────────────────────────────
export async function updateReward(rewardId: string, updates: any) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  const allowedUpdates = ["rewardAmount", "currency", "expiresAt", "terms"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      (reward as any)[key] = updates[key];
    }
  }

  reward.updatedAt = new Date();
  await reward.save();

  return reward;
}

export async function cancelReward(rewardId: string) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if ((reward as any).status === "paid") {
    throw new Error("Cannot cancel a paid reward");
  }

  (reward as any).status = "expired";
  reward.updatedAt = new Date();
  await reward.save();

  return reward;
}

// ── Reward Expiry Check ─────────────────────────────────────────────────────────
export async function checkRewardExpiry() {
  const now = new Date();
  const expiredRewards = await RecoveryReward.find({
    status: "offered",
    expiresAt: { $lt: now },
  });

  for (const reward of expiredRewards) {
    (reward as any).status = "expired";
    reward.updatedAt = new Date();
    await reward.save();
  }

  return expiredRewards.length;
}

// ── Reward Statistics ───────────────────────────────────────────────────────────
export async function getRewardStatistics() {
  const [
    totalRewards,
    offeredRewards,
    claimedRewards,
    paidRewards,
    expiredRewards,
    totalPayout,
    totalOffered,
  ] = await Promise.all([
    RecoveryReward.countDocuments(),
    RecoveryReward.countDocuments({ status: "offered" }),
    RecoveryReward.countDocuments({ status: "claimed" }),
    RecoveryReward.countDocuments({ status: "paid" }),
    RecoveryReward.countDocuments({ status: "expired" }),
    RecoveryReward.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
    ]),
    RecoveryReward.aggregate([
      { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
    ]),
  ]);

  const claimRate = totalRewards > 0 
    ? ((claimedRewards / totalRewards) * 100).toFixed(2) 
    : 0;

  return {
    totalRewards,
    offeredRewards,
    claimedRewards,
    paidRewards,
    expiredRewards,
    claimRate,
    totalPayout: totalPayout[0]?.total || 0,
    totalOffered: totalOffered[0]?.total || 0,
  };
}

// ── Available Rewards ───────────────────────────────────────────────────────────
export async function getAvailableRewards(limit = 50) {
  const rewards = await RecoveryReward.find({
    status: "offered",
    expiresAt: { $gte: new Date() },
  })
    .populate("device", "imei make model")
    .populate("recoveryCase")
    .sort({ rewardAmount: -1 })
    .limit(limit);

  return rewards;
}

export async function getRewardsByLocation(lat: number, lng: number, radiusKm = 50, limit = 20) {
  // Get rewards for devices in the specified area
  // This is a simplified geospatial query
  const rewards = await RecoveryReward.find({
    status: "offered",
    expiresAt: { $gte: new Date() },
  })
    .populate("device", "imei make model")
    .populate("recoveryCase")
    .sort({ rewardAmount: -1 })
    .limit(limit);

  // Filter by distance (in production, use MongoDB geospatial queries)
  const filtered = rewards.filter((r: any) => {
    if (!(r as any).recoveryCase?.lastLocation) return false;
    const distance = haversineDistance(
      lat,
      lng,
      (r as any).recoveryCase.lastLocation.lat,
      (r as any).recoveryCase.lastLocation.lng
    );
    return distance <= radiusKm;
  });

  return filtered;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
