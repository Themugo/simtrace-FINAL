// services/deviceLock.ts - Device lock and remote wipe services
import crypto from "crypto";
import {
  DeviceLock,
  Device,
  
} from "../db/index.js";

// ── Device Lock Management ───────────────────────────────────────────────────────────
export async function lockDevice(data: Record<string, unknown>) {
  const lockId = `lock_${crypto.randomBytes(16).toString("hex")}`;

  // Verify device ownership
  const device = await Device.findById(data.deviceId);
  if (!device) throw new Error("Device not found");
  if (device.owner?.toString() !== (data.userId as string).toString()) {
    throw new Error("You don't own this device");
  }

  // Check if device is already locked
  const existingLock = await DeviceLock.findOne({
    deviceId: data.deviceId,
    status: "active",
  });
  if (existingLock) {
    throw new Error("Device is already locked");
  }

  const lock = await DeviceLock.create({
    ...data,
    lockId,
    status: "active",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Update device status
  device.locked = true;   // lock state is separate from theft status
  device.updatedAt = new Date();
  await device.save();

  return lock;
}

export async function unlockDevice(lockId: string, userId: string) {
  const lock = await DeviceLock.findOne({ lockId });
  if (!lock) throw new Error("Lock not found");

  // Verify ownership
  if (lock.userId.toString() !== userId.toString()) {
    throw new Error("You don't own this device");
  }

  // Check if lock is permanent
  if (lock.lockType === "permanent") {
    throw new Error("Cannot unlock permanent lock. Contact support.");
  }

  // Update lock status
  lock.status = "unlocked";
  lock.updatedBy = userId;
  lock.updatedAt = new Date();
  await lock.save();

  // Update device status
  const device = await Device.findById(lock.deviceId);
  if (device) {
    device.locked = false;  // unlock; preserve stolen/blacklisted status
    device.updatedAt = new Date();
    await device.save();
  }

  return lock;
}

export async function recordUnlockAttempt(lockId: string, location: Record<string, unknown>) {
  const lock = await DeviceLock.findOne({ lockId });
  if (!lock) throw new Error("Lock not found");

  (lock as any).failedAttempts = ((lock as any).failedAttempts ?? 0) + 1;  // was unlockAttempts (undefined -> NaN)
  (lock as any).lastUnlockAttempt = new Date();
  if (location) (lock as any).lastAttemptLocation = location;              // capture WHERE the attempt happened
  lock.updatedAt = new Date();
  await lock.save();

  return lock;
}

export async function remoteWipeDevice(lockId: string, userId: string) {
  const lock = await DeviceLock.findOne({ lockId });
  if (!lock) throw new Error("Lock not found");

  // Verify ownership
  if (lock.userId.toString() !== userId.toString()) {
    throw new Error("You don't own this device");
  }

  lock.remoteWipe = true;
  lock.wipeDate = new Date();
  lock.wipeConfirmed = true;
  lock.updatedBy = userId;
  lock.updatedAt = new Date();
  await lock.save();

  // TODO: Send wipe command to device via push notification or socket

  return lock;
}

export async function getDeviceLock(lockId: string) {
  const lock = await DeviceLock.findOne({ lockId });
  if (!lock) throw new Error("Lock not found");
  return lock;
}

export async function getDeviceLocksByDevice(deviceId: string) {
  const locks = await DeviceLock.find({ deviceId }).sort({ lockDate: -1 });
  return locks;
}

export async function getDeviceLocksByUser(userId: string) {
  const locks = await DeviceLock.find({ userId }).sort({ lockDate: -1 });
  return locks;
}

export async function getActiveLocksByDevice(deviceId: string) {
  const lock = await DeviceLock.findOne({
    deviceId,
    status: "active",
  });
  return lock;
}

export async function checkDeviceLockStatus(deviceId: string) {
  const lock = await DeviceLock.findOne({
    deviceId,
    status: "active",
  });

  if (!lock) {
    return { locked: false };
  }

  // Check if temporary lock has expired
  if (lock.lockType === "temporary" && lock.unlockDate && lock.unlockDate < new Date()) {
    lock.status = "expired";
    lock.updatedAt = new Date();
    await lock.save();

    // Update device status
    const device = await Device.findById(lock.deviceId);
    if (device) {
      device.locked = false;  // unlock; preserve stolen/blacklisted status
      device.updatedAt = new Date();
      await device.save();
    }

    return { locked: false };
  }

  return {
    locked: true,
    lockId: lock.lockId,
    lockType: lock.lockType,
    lockReason: lock.lockReason,
    lockDate: lock.lockDate,
    unlockDate: lock.unlockDate,
    unlockAttempts: lock.unlockAttempts,
  };
}

export async function expireTemporaryLocks() {
  const now = new Date();
  const expiredLocks = await DeviceLock.find({
    lockType: "temporary",
    unlockDate: { $lt: now },
    status: "active",
  });

  for (const lock of expiredLocks) {
    lock.status = "expired";
    lock.updatedAt = new Date();
    await lock.save();

    // Update device status
    const device = await Device.findById(lock.deviceId);
    if (device) {
      device.locked = false;  // unlock; preserve stolen/blacklisted status
      device.updatedAt = new Date();
      await device.save();
    }
  }

  return { expired: expiredLocks.length };
}

