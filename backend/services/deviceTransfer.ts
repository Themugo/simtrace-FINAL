// services/deviceTransfer.ts - Device transfer system services
import crypto from "crypto";
import {
  DeviceTransfer,
  Device,
  User,
} from "../db/index.js";

// ── Device Transfer Management ───────────────────────────────────────────────────────
export async function initiateDeviceTransfer(data: any) {
  const transferId = `transfer_${crypto.randomBytes(16).toString("hex")}`;

  // Verify device ownership
  const device = await Device.findById(data.deviceId);
  if (!device) throw new Error("Device not found");
  if (device.owner?.toString() !== data.fromUserId.toString()) {
    throw new Error("You don't own this device");
  }

  // Verify device is not stolen
  if (device.status === "stolen") {
    throw new Error("Cannot transfer stolen device");
  }

  const transfer = await DeviceTransfer.create({
    ...data,
    transferId,
    status: "pending",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return transfer;
}

export async function acceptDeviceTransfer(transferId: string, userId: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  // Verify the user is the recipient
  if (transfer.toUserId.toString() !== userId.toString()) {
    throw new Error("You are not the recipient of this transfer");
  }

  // Mark as verified by recipient
  transfer.toUserVerified = true;
  transfer.toUserVerifiedAt = new Date();
  transfer.updatedBy = userId;
  transfer.updatedAt = new Date();
  await transfer.save();

  // Check if both parties verified
  if (transfer.fromUserVerified && transfer.toUserVerified) {
    await completeDeviceTransfer(transferId);
  }

  return transfer;
}

export async function confirmDeviceTransfer(transferId: string, userId: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  // Verify the user is the sender
  if (transfer.fromUserId.toString() !== userId.toString()) {
    throw new Error("You are not the sender of this transfer");
  }

  // Mark as verified by sender
  transfer.fromUserVerified = true;
  transfer.fromUserVerifiedAt = new Date();
  transfer.updatedBy = userId;
  transfer.updatedAt = new Date();
  await transfer.save();

  // Check if both parties verified
  if (transfer.fromUserVerified && transfer.toUserVerified) {
    await completeDeviceTransfer(transferId);
  }

  return transfer;
}

export async function completeDeviceTransfer(transferId: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  // Update device ownership
  const device = await Device.findById(transfer.deviceId);
  if (!device) throw new Error("Device not found");

  device.set('owner', transfer.toUserId);
  device.updatedAt = new Date();
  await device.save();

  // Mark transfer as completed
  transfer.status = "completed";
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

export async function cancelDeviceTransfer(transferId: string, userId: string, reason: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  // Verify the user is either sender or recipient
  if (
    transfer.fromUserId.toString() !== userId.toString() &&
    transfer.toUserId.toString() !== userId.toString()
  ) {
    throw new Error("You are not authorized to cancel this transfer");
  }

  transfer.status = "cancelled";
  transfer.updatedBy = userId;
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

export async function raiseDispute(transferId: string, userId: string, reason: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  // Verify the user is either sender or recipient
  if (
    transfer.fromUserId.toString() !== userId.toString() &&
    transfer.toUserId.toString() !== userId.toString()
  ) {
    throw new Error("You are not authorized to raise a dispute");
  }

  transfer.status = "disputed";
  transfer.disputeRaised = true;
  transfer.disputeRaisedBy = userId;
  transfer.disputeReason = reason;
  transfer.updatedBy = userId;
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

export async function resolveDispute(transferId: string, resolution: string, resolvedBy: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");

  transfer.disputeResolved = true;
  transfer.disputeResolution = resolution;
  transfer.updatedBy = resolvedBy;
  transfer.updatedAt = new Date();
  await transfer.save();

  return transfer;
}

export async function getDeviceTransfer(transferId: string) {
  const transfer = await DeviceTransfer.findOne({ transferId });
  if (!transfer) throw new Error("Transfer not found");
  return transfer;
}

export async function getDeviceTransfersByDevice(deviceId: string) {
  const transfers = await DeviceTransfer.find({ deviceId }).sort({ transferDate: -1 });
  return transfers;
}

export async function getDeviceTransfersByUser(userId: string) {
  const transfers = await DeviceTransfer.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  }).sort({ transferDate: -1 });
  return transfers;
}

export async function getPendingTransfers(userId: string) {
  const transfers = await DeviceTransfer.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
    status: "pending",
  }).sort({ transferDate: -1 });
  return transfers;
}

export async function getDisputedTransfers() {
  const transfers = await DeviceTransfer.find({
    status: "disputed",
    disputeResolved: false,
  }).sort({ transferDate: -1 });
  return transfers;
}
