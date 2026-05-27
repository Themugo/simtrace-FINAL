// services/repairShop.js - Repair shop layer services
import crypto from "crypto";
import {
  RepairShop,
  RepairRecord,
  OfficialEmail,
  SecurityOtp,
  Device,
} from "../db/index.js";

// ── Repair Shop Management ─────────────────────────────────────────────────────────
export async function createRepairShop(data) {
  const shopId = `shop_${crypto.randomBytes(16).toString("hex")}`;

  const shop = await RepairShop.create({
    ...data,
    shopId,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return shop;
}

export async function getRepairShop(shopId) {
  const shop = await RepairShop.findOne({ shopId, status: "active" });
  if (!shop) throw new Error("Repair shop not found");
  return shop;
}

export async function getRepairShopByEmail(officialEmail) {
  const shop = await RepairShop.findOne({ officialEmail, status: "active" });
  return shop;
}

export async function updateRepairShop(shopId, updates, updatedBy) {
  const shop = await RepairShop.findOneAndUpdate(
    { shopId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!shop) throw new Error("Repair shop not found");
  return shop;
}

export async function suspendRepairShop(shopId, suspendedBy) {
  const shop = await RepairShop.findOneAndUpdate(
    { shopId },
    {
      status: "suspended",
      updatedBy: suspendedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!shop) throw new Error("Repair shop not found");
  return shop;
}

export async function verifyRepairShop(shopId, verifiedBy) {
  const shop = await RepairShop.findOneAndUpdate(
    { shopId },
    {
      verified: true,
      updatedBy: verifiedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!shop) throw new Error("Repair shop not found");
  return shop;
}

export async function getRepairShopsByCountry(countryCode) {
  const shops = await RepairShop.find({ countryCode, status: "active" });
  return shops;
}

export async function getRepairShopsByRegion(countryCode, region) {
  const shops = await RepairShop.find({ countryCode, region, status: "active" });
  return shops;
}

export async function getRepairShopsBySpecialization(specialization) {
  const shops = await RepairShop.find({
    specializations: specialization,
    status: "active",
  });
  return shops;
}

// ── Repair Record Management ────────────────────────────────────────────────────────
export async function createRepairRecord(data) {
  const repairId = `repair_${crypto.randomBytes(16).toString("hex")}`;

  // Calculate commission
  const shop = await RepairShop.findById(data.shopId);
  if (!shop) throw new Error("Repair shop not found");

  let commissionAmount = 0;
  if (shop.commission.type === "percentage") {
    commissionAmount = (data.repairCost * shop.commission.value) / 100;
  } else {
    commissionAmount = shop.commission.value;
  }

  const repair = await RepairRecord.create({
    ...data,
    repairId,
    commissionAmount,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Update shop stats
  await RepairShop.findByIdAndUpdate(data.shopId, {
    $inc: {
      totalRepairs: 1,
      totalCommission: commissionAmount,
    },
    $push: { devicesRepaired: data.deviceId },
  });

  return repair;
}

export async function getRepairRecord(repairId) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");
  return repair;
}

export async function getRepairRecordsByShop(shopId) {
  const repairs = await RepairRecord.find({ shopId }).sort({ repairDate: -1 });
  return repairs;
}

export async function getRepairRecordsByDevice(deviceId) {
  const repairs = await RepairRecord.find({ deviceId }).sort({ repairDate: -1 });
  return repairs;
}

export async function updateRepairRecord(repairId, updates, updatedBy) {
  const repair = await RepairRecord.findOneAndUpdate(
    { repairId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!repair) throw new Error("Repair record not found");

  // If completed, update successful repairs count
  if (updates.status === "completed" && repair.status !== "completed") {
    await RepairShop.findByIdAndUpdate(repair.shopId, {
      $inc: { successfulRepairs: 1 },
    });
  }

  return repair;
}

export async function completeRepairRecord(repairId, completionData, completedBy) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  repair.completionDate = new Date();
  repair.status = "completed";
  repair.findings = completionData.findings;
  repair.deviceStatusAfter = completionData.deviceStatusAfter;
  repair.contributedToRecovery = completionData.contributedToRecovery || false;
  repair.recoveryNotes = completionData.recoveryNotes;
  repair.updatedBy = completedBy;
  repair.updatedAt = new Date();
  await repair.save();

  // Update shop stats
  await RepairShop.findByIdAndUpdate(repair.shopId, {
    $inc: { successfulRepairs: 1 },
  });

  // If contributed to recovery, notify relevant parties
  if (repair.contributedToRecovery) {
    // TODO: Notify recovery network
  }

  return repair;
}

export async function cancelRepairRecord(repairId, cancelledBy) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  // Remove commission from shop
  await RepairShop.findByIdAndUpdate(repair.shopId, {
    $inc: {
      totalRepairs: -1,
      totalCommission: -repair.commissionAmount,
    },
    $pull: { devicesRepaired: repair.deviceId },
  });

  repair.status = "cancelled";
  repair.updatedBy = cancelledBy;
  repair.updatedAt = new Date();
  await repair.save();

  return repair;
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkRepairShopPermission(shopId, permission) {
  const shop = await RepairShop.findOne({ shopId, status: "active" });
  if (!shop) return { allowed: false, reason: "Repair shop not found or inactive" };

  if (!shop.permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, shop };
}

// ── Recovery Contribution ───────────────────────────────────────────────────────────
export async function reportRecoveryContribution(repairId, recoveryData, reportedBy) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  repair.contributedToRecovery = true;
  repair.recoveryNotes = recoveryData.notes;
  repair.updatedBy = reportedBy;
  repair.updatedAt = new Date();
  await repair.save();

  // TODO: Notify recovery network
  // TODO: Update device status if shop has permission

  return repair;
}

export async function getRecoveryContributionsByShop(shopId) {
  const repairs = await RepairRecord.find({
    shopId,
    contributedToRecovery: true,
  }).sort({ repairDate: -1 });
  return repairs;
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getRepairShopStatistics(shopId) {
  const shop = await RepairShop.findById(shopId);
  if (!shop) throw new Error("Repair shop not found");

  const repairs = await RepairRecord.find({ shopId });
  const completedRepairs = repairs.filter(r => r.status === "completed");
  const recoveryContributions = repairs.filter(r => r.contributedToRecovery);

  return {
    totalRepairs: shop.totalRepairs,
    successfulRepairs: shop.successfulRepairs,
    totalCommission: shop.totalCommission,
    devicesRepaired: shop.devicesRepaired.length,
    completedRepairs: completedRepairs.length,
    recoveryContributions: recoveryContributions.length,
    commissionTier: shop.commission.tier,
    specializations: shop.specializations,
    verified: shop.verified,
    status: shop.status,
  };
}

export async function getRepairShopStatistics() {
  const [
    totalShops,
    activeShops,
    totalRepairs,
    completedRepairs,
    totalCommission,
  ] = await Promise.all([
    RepairShop.countDocuments(),
    RepairShop.countDocuments({ status: "active" }),
    RepairRecord.countDocuments(),
    RepairRecord.countDocuments({ status: "completed" }),
    RepairShop.aggregate([{ $group: { _id: null, total: { $sum: "$totalCommission" } } }]),
  ]);

  const recoveryContributions = await RepairRecord.countDocuments({ contributedToRecovery: true });

  return {
    shops: {
      total: totalShops,
      active: activeShops,
    },
    repairs: {
      total: totalRepairs,
      completed: completedRepairs,
      recoveryContributions,
    },
    financial: {
      totalCommission: totalCommission[0]?.total || 0,
    },
  };
}
