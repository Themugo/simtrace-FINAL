// services/rewards.js - Recovery Reward System
// Reward system for device recovery network

import { RecoveryReward, RecoveryCase, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Reward Creation ───────────────────────────────────────────────────────────────
export async function createRecoveryReward(data) {
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

export async function getReward(rewardId) {
  const reward = await RecoveryReward.findById(rewardId)
    .populate("recoveryCase")
    .populate("device", "imei make model")
    .populate("recipient", "name email");

  return reward;
}

export async function getRewardsByDevice(deviceId) {
  const rewards = await RecoveryReward.find({ device: deviceId })
    .populate("recoveryCase")
    .populate("recipient", "name email")
    .sort({ createdAt: -1 });

  return rewards;
}

export async function getRewardsByRecipient(recipientId) {
  const rewards = await RecoveryReward.find({ recipient: recipientId })
    .populate("device", "imei make model")
    .populate("recoveryCase")
    .sort({ createdAt: -1 });

  return rewards;
}

// ── Reward Claiming ─────────────────────────────────────────────────────────────
export async function claimReward(rewardId, recipientId, recipientType) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if (reward.status !== "offered") {
    throw new Error("Reward is not available for claiming");
  }

  if (reward.expiresAt < new Date()) {
    reward.status = "expired";
    await reward.save();
    throw new Error("Reward has expired");
  }

  const user = await User.findById(recipientId);
  if (!user) throw new Error("User not found");

  reward.recipient = recipientId;
  reward.recipientType = recipientType || "finder";
  reward.status = "claimed";
  reward.updatedAt = new Date();
  await reward.save();

  // Notify via socket
  getIO().to(`user:${reward.recoveryCase.user}`).emit("reward_claimed", {
    rewardId: reward._id,
    imei: reward.imei,
    recipient: user.name,
  });

  return reward;
}

// ── Reward Payment ─────────────────────────────────────────────────────────────
export async function payReward(rewardId, paymentMethod, paymentReference) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if (reward.status !== "claimed") {
    throw new Error("Reward must be claimed before payment");
  }

  if (!reward.recipient) {
    throw new Error("Reward has no recipient");
  }

  // Process payment (simplified - would integrate with payment gateways)
  reward.paymentMethod = paymentMethod;
  reward.paymentReference = paymentReference;
  reward.status = "paid";
  reward.paidAt = new Date();
  reward.updatedAt = new Date();
  await reward.save();

  // Notify recipient
  getIO().to(`user:${reward.recipient}`).emit("reward_paid", {
    rewardId: reward._id,
    amount: reward.rewardAmount,
    currency: reward.currency,
  });

  return reward;
}

// ── Reward Management ───────────────────────────────────────────────────────────
export async function updateReward(rewardId, updates) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  const allowedUpdates = ["rewardAmount", "currency", "expiresAt", "terms"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      reward[key] = updates[key];
    }
  }

  reward.updatedAt = new Date();
  await reward.save();

  return reward;
}

export async function cancelReward(rewardId) {
  const reward = await RecoveryReward.findById(rewardId);
  if (!reward) throw new Error("Reward not found");

  if (reward.status === "paid") {
    throw new Error("Cannot cancel a paid reward");
  }

  reward.status = "expired";
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
    reward.status = "expired";
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

export async function getRewardsByLocation(lat, lng, radiusKm = 50, limit = 20) {
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
  const filtered = rewards.filter(r => {
    if (!r.recoveryCase?.lastLocation) return false;
    const distance = haversineDistance(
      lat,
      lng,
      r.recoveryCase.lastLocation.lat,
      r.recoveryCase.lastLocation.lng
    );
    return distance <= radiusKm;
  });

  return filtered;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
