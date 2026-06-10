// services/sellerReseller.ts - Seller/Reseller layer services
import crypto from "crypto";
import {
  SellerReseller,
  DeviceRegistration,
  OfficialEmail,
  SecurityOtp,
  Device,
} from "../db/index.js";

// ── Seller/Reseller Management ─────────────────────────────────────────────────────
export async function createSellerReseller(data: Record<string, unknown>) {
  const sellerId = `seller_${crypto.randomBytes(16).toString("hex")}`;

  const seller = await SellerReseller.create({
    ...data,
    sellerId,
    createdBy: data.createdBy as string,
    updatedBy: data.createdBy as string,
  });

  return seller;
}

export async function getSellerReseller(sellerId: string) {
  const seller = await SellerReseller.findOne({ sellerId, status: "active" });
  if (!seller) throw new Error("Seller/Reseller not found");
  return seller;
}

export async function getSellerResellerByEmail(officialEmail: string) {
  const seller = await SellerReseller.findOne({ officialEmail, status: "active" });
  return seller;
}

export async function updateSellerReseller(sellerId: string, updates: Record<string, unknown>, updatedBy: string) {
  const seller = await SellerReseller.findOneAndUpdate(
    { sellerId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!seller) throw new Error("Seller/Reseller not found");
  return seller;
}

export async function suspendSellerReseller(sellerId: string, suspendedBy: string) {
  const seller = await SellerReseller.findOneAndUpdate(
    { sellerId },
    {
      status: "suspended",
      updatedBy: suspendedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!seller) throw new Error("Seller/Reseller not found");
  return seller;
}

export async function verifySellerReseller(sellerId: string, verifiedBy: string) {
  const seller = await SellerReseller.findOneAndUpdate(
    { sellerId },
    {
      verified: true,
      updatedBy: verifiedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!seller) throw new Error("Seller/Reseller not found");
  return seller;
}

export async function getSellerResellersByCountry(countryCode: string) {
  const sellers = await SellerReseller.find({ countryCode, status: "active" });
  return sellers;
}

export async function getSellerResellersByRegion(countryCode: string, region: string) {
  const sellers = await SellerReseller.find({ countryCode, region, status: "active" });
  return sellers;
}

// ── Device Registration ────────────────────────────────────────────────────────────
export async function registerDevice(data: Record<string, unknown>) {
  const registrationId = `reg_${crypto.randomBytes(16).toString("hex")}`;

  // Calculate commission
  const d = data as { sellerId: string; salePrice: number; deviceId: string; createdBy: string; [key: string]: unknown };
  const seller = await SellerReseller.findById(d.sellerId);
  if (!seller) throw new Error("Seller/Reseller not found");

  let commissionAmount = 0;
  if ((seller as any).commission.type === "percentage") {
    commissionAmount = (d.salePrice * (seller as any).commission.value) / 100;
  } else {
    commissionAmount = (seller as any).commission.value;
  }

  const registration = await DeviceRegistration.create({
    ...data,
    registrationId,
    commissionAmount,
    createdBy: d.createdBy,
    updatedBy: d.createdBy,
  });

  // Update seller stats
  await SellerReseller.findByIdAndUpdate(d.sellerId, {
    $inc: {
      totalSales: d.salePrice,
      totalCommission: commissionAmount,
    },
    $push: { devicesSold: d.deviceId },
  });

  return registration;
}

export async function getDeviceRegistration(registrationId: string) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");
  return registration;
}

export async function getDeviceRegistrationsBySeller(sellerId: string) {
  const registrations = await DeviceRegistration.find({ sellerId }).sort({ saleDate: -1 });
  return registrations;
}

export async function getDeviceRegistrationsByDevice(deviceId: string) {
  const registrations = await DeviceRegistration.find({ deviceId }).sort({ saleDate: -1 });
  return registrations;
}

export async function getDeviceRegistrationsByCustomer(customerEmail: string) {
  const registrations = await DeviceRegistration.find({ customerEmail }).sort({ saleDate: -1 });
  return registrations;
}

export async function transferDeviceRegistration(registrationId: string, newSellerId: string, transferredBy: string) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");

  // Remove from old seller
  await SellerReseller.findByIdAndUpdate((registration as any).sellerId, {
    $pull: { devicesSold: (registration as any).deviceId },
  });

  // Calculate new commission
  const newSeller = await SellerReseller.findById(newSellerId);
  if (!newSeller) throw new Error("New seller not found");

  let commissionAmount = 0;
  if ((newSeller as any).commission.type === "percentage") {
    commissionAmount = ((registration as any).salePrice * (newSeller as any).commission.value) / 100;
  } else {
    commissionAmount = (newSeller as any).commission.value;
  }

  // Update registration
  (registration as any).sellerId = newSellerId;
  (registration as any).commissionAmount = commissionAmount;
  (registration as any).status = "transferred";
  (registration as any).updatedBy = transferredBy;
  registration.updatedAt = new Date();
  await registration.save();

  // Add to new seller
  await SellerReseller.findByIdAndUpdate(newSellerId, {
    $inc: {
      totalSales: (registration as any).salePrice,
      totalCommission: commissionAmount,
    },
    $push: { devicesSold: (registration as any).deviceId },
  });

  return registration;
}

export async function cancelDeviceRegistration(registrationId: string, cancelledBy: string) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");

  // Remove commission from seller
  await SellerReseller.findByIdAndUpdate((registration as any).sellerId, {
    $inc: {
      totalSales: -(registration as any).salePrice,
      totalCommission: -(registration as any).commissionAmount,
    },
    $pull: { devicesSold: (registration as any).deviceId },
  });

  (registration as any).status = "cancelled";
  (registration as any).updatedBy = cancelledBy;
  registration.updatedAt = new Date();
  await registration.save();

  return registration;
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkSellerPermission(sellerId: string, permission: string) {
  const seller = await SellerReseller.findOne({ sellerId, status: "active" });
  if (!seller) return { allowed: false, reason: "Seller not found or inactive" };

  if (!(seller as any).permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, seller };
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getSellerStatistics(sellerId: string) {
  const seller = await SellerReseller.findById(sellerId);
  if (!seller) throw new Error("Seller not found");

  const registrations = await DeviceRegistration.find({ sellerId });
  const activeRegistrations = registrations.filter((r) => r.status === "active");

  return {
    totalSales: (seller as any).totalSales,
    totalCommission: (seller as any).totalCommission,
    totalDevicesSold: (seller as any).devicesSold.length,
    activeRegistrations: activeRegistrations.length,
    commissionTier: (seller as any).commission.tier,
    businessType: (seller as any).businessType,
    verified: (seller as any).verified,
    status: (seller as any).status,
  };
}

export async function getSellerResellerStatistics() {
  const [
    totalSellers,
    activeSellers,
    totalRegistrations,
    activeRegistrations,
    totalSales,
    totalCommission,
  ] = await Promise.all([
    SellerReseller.countDocuments(),
    SellerReseller.countDocuments({ status: "active" }),
    DeviceRegistration.countDocuments(),
    DeviceRegistration.countDocuments({ status: "active" }),
    SellerReseller.aggregate([{ $group: { _id: null, total: { $sum: "$totalSales" } } }]),
    SellerReseller.aggregate([{ $group: { _id: null, total: { $sum: "$totalCommission" } } }]),
  ]);

  return {
    sellers: {
      total: totalSellers,
      active: activeSellers,
    },
    registrations: {
      total: totalRegistrations,
      active: activeRegistrations,
    },
    financial: {
      totalSales: totalSales[0]?.total || 0,
      totalCommission: totalCommission[0]?.total || 0,
    },
  };
}
