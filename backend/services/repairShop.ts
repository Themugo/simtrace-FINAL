// services/repairShop.ts - Repair shop layer services
import crypto from "crypto";
import {
  RepairShop,
  RepairRecord,
  OfficialEmail,
  SecurityOtp,
  Device,
} from "../db/index.js";

// ── Repair Shop Management ─────────────────────────────────────────────────────────
export async function createRepairShop(data: any) {
  const shopId = `shop_${crypto.randomBytes(16).toString("hex")}`;

  const shop = await RepairShop.create({
    ...data,
    shopId,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return shop;
}

export async function getRepairShop(shopId: string) {
  const shop = await RepairShop.findOne({ shopId, status: "active" });
  if (!shop) throw new Error("Repair shop not found");
  return shop;
}

export async function getRepairShopByEmail(officialEmail: string) {
  const shop = await RepairShop.findOne({ officialEmail, status: "active" });
  return shop;
}

export async function updateRepairShop(shopId: string, updates: any, updatedBy: string) {
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

export async function suspendRepairShop(shopId: string, suspendedBy: string) {
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

export async function verifyRepairShop(shopId: string, verifiedBy: string) {
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

export async function getRepairShopsByCountry(countryCode: string) {
  const shops = await RepairShop.find({ countryCode, status: "active" });
  return shops;
}

export async function getRepairShopsByRegion(countryCode: string, region: string) {
  const shops = await RepairShop.find({ countryCode, region, status: "active" });
  return shops;
}

export async function getRepairShopsBySpecialization(specialization: string) {
  const shops = await RepairShop.find({
    specializations: specialization,
    status: "active",
  });
  return shops;
}

// ── Repair Record Management ────────────────────────────────────────────────────────
export async function createRepairRecord(data: any) {
  const repairId = `repair_${crypto.randomBytes(16).toString("hex")}`;

  // Calculate commission
  const shop = await RepairShop.findById(data.shopId);
  if (!shop) throw new Error("Repair shop not found");

  let commissionAmount = 0;
  if ((shop as any).commission.type === "percentage") {
    commissionAmount = (data.repairCost * (shop as any).commission.value) / 100;
  } else {
    commissionAmount = (shop as any).commission.value;
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

export async function getRepairRecord(repairId: string) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");
  return repair;
}

export async function getRepairRecordsByShop(shopId: string) {
  const repairs = await RepairRecord.find({ shopId }).sort({ repairDate: -1 });
  return repairs;
}

export async function getRepairRecordsByDevice(deviceId: string) {
  const repairs = await RepairRecord.find({ deviceId }).sort({ repairDate: -1 });
  return repairs;
}

export async function updateRepairRecord(repairId: string, updates: any, updatedBy: string) {
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
  if (updates.status === "completed" && (repair as any).status !== "completed") {
    await RepairShop.findByIdAndUpdate((repair as any).shopId, {
      $inc: { successfulRepairs: 1 },
    });
  }

  return repair;
}

export async function completeRepairRecord(repairId: string, completionData: any, completedBy: string) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  (repair as any).completionDate = new Date();
  (repair as any).status = "completed";
  (repair as any).findings = completionData.findings;
  (repair as any).deviceStatusAfter = completionData.deviceStatusAfter;
  (repair as any).contributedToRecovery = completionData.contributedToRecovery || false;
  (repair as any).recoveryNotes = completionData.recoveryNotes;
  (repair as any).updatedBy = completedBy;
  repair.updatedAt = new Date();
  await repair.save();

  // Update shop stats
  await RepairShop.findByIdAndUpdate((repair as any).shopId, {
    $inc: { successfulRepairs: 1 },
  });

  // If contributed to recovery, notify relevant parties
  if ((repair as any).contributedToRecovery) {
    // TODO: Notify recovery network
  }

  return repair;
}

export async function cancelRepairRecord(repairId: string, cancelledBy: string) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  // Remove commission from shop
  await RepairShop.findByIdAndUpdate((repair as any).shopId, {
    $inc: {
      totalRepairs: -1,
      totalCommission: -(repair as any).commissionAmount,
    },
    $pull: { devicesRepaired: (repair as any).deviceId },
  });

  (repair as any).status = "cancelled";
  (repair as any).updatedBy = cancelledBy;
  repair.updatedAt = new Date();
  await repair.save();

  return repair;
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkRepairShopPermission(shopId: string, permission: string) {
  const shop = await RepairShop.findOne({ shopId, status: "active" });
  if (!shop) return { allowed: false, reason: "Repair shop not found or inactive" };

  if (!(shop as any).permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, shop };
}

// ── Recovery Contribution ───────────────────────────────────────────────────────────
export async function reportRecoveryContribution(repairId: string, recoveryData: any, reportedBy: string) {
  const repair = await RepairRecord.findOne({ repairId });
  if (!repair) throw new Error("Repair record not found");

  (repair as any).contributedToRecovery = true;
  (repair as any).recoveryNotes = recoveryData.notes;
  (repair as any).updatedBy = reportedBy;
  repair.updatedAt = new Date();
  await repair.save();

  // TODO: Notify recovery network
  // TODO: Update device status if shop has permission

  return repair;
}

export async function getRecoveryContributionsByShop(shopId: string) {
  const repairs = await RepairRecord.find({
    shopId,
    contributedToRecovery: true,
  }).sort({ repairDate: -1 });
  return repairs;
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getRepairShopStatistics(shopId: string) {
  const shop = await RepairShop.findById(shopId);
  if (!shop) throw new Error("Repair shop not found");

  const repairs = await RepairRecord.find({ shopId });
  const completedRepairs = repairs.filter((r: any) => r.status === "completed");
  const recoveryContributions = repairs.filter((r: any) => r.contributedToRecovery);

  return {
    totalRepairs: (shop as any).totalRepairs,
    successfulRepairs: (shop as any).successfulRepairs,
    totalCommission: (shop as any).totalCommission,
    devicesRepaired: (shop as any).devicesRepaired.length,
    completedRepairs: completedRepairs.length,
    recoveryContributions: recoveryContributions.length,
    commissionTier: (shop as any).commission.tier,
    specializations: (shop as any).specializations,
    verified: (shop as any).verified,
    status: (shop as any).status,
  };
}

export async function getAllRepairShopStatistics() {
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
