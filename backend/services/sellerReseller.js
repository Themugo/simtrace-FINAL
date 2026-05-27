// services/sellerReseller.js - Seller/Reseller layer services
import crypto from "crypto";
import {
  SellerReseller,
  DeviceRegistration,
  OfficialEmail,
  SecurityOtp,
  Device,
} from "../db/index.js";

// ── Seller/Reseller Management ─────────────────────────────────────────────────────
export async function createSellerReseller(data) {
  const sellerId = `seller_${crypto.randomBytes(16).toString("hex")}`;

  const seller = await SellerReseller.create({
    ...data,
    sellerId,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  return seller;
}

export async function getSellerReseller(sellerId) {
  const seller = await SellerReseller.findOne({ sellerId, status: "active" });
  if (!seller) throw new Error("Seller/Reseller not found");
  return seller;
}

export async function getSellerResellerByEmail(officialEmail) {
  const seller = await SellerReseller.findOne({ officialEmail, status: "active" });
  return seller;
}

export async function updateSellerReseller(sellerId, updates, updatedBy) {
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

export async function suspendSellerReseller(sellerId, suspendedBy) {
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

export async function verifySellerReseller(sellerId, verifiedBy) {
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

export async function getSellerResellersByCountry(countryCode) {
  const sellers = await SellerReseller.find({ countryCode, status: "active" });
  return sellers;
}

export async function getSellerResellersByRegion(countryCode, region) {
  const sellers = await SellerReseller.find({ countryCode, region, status: "active" });
  return sellers;
}

// ── Device Registration ────────────────────────────────────────────────────────────
export async function registerDevice(data) {
  const registrationId = `reg_${crypto.randomBytes(16).toString("hex")}`;

  // Calculate commission
  const seller = await SellerReseller.findById(data.sellerId);
  if (!seller) throw new Error("Seller/Reseller not found");

  let commissionAmount = 0;
  if (seller.commission.type === "percentage") {
    commissionAmount = (data.salePrice * seller.commission.value) / 100;
  } else {
    commissionAmount = seller.commission.value;
  }

  const registration = await DeviceRegistration.create({
    ...data,
    registrationId,
    commissionAmount,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Update seller stats
  await SellerReseller.findByIdAndUpdate(data.sellerId, {
    $inc: {
      totalSales: data.salePrice,
      totalCommission: commissionAmount,
    },
    $push: { devicesSold: data.deviceId },
  });

  return registration;
}

export async function getDeviceRegistration(registrationId) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");
  return registration;
}

export async function getDeviceRegistrationsBySeller(sellerId) {
  const registrations = await DeviceRegistration.find({ sellerId }).sort({ saleDate: -1 });
  return registrations;
}

export async function getDeviceRegistrationsByDevice(deviceId) {
  const registrations = await DeviceRegistration.find({ deviceId }).sort({ saleDate: -1 });
  return registrations;
}

export async function getDeviceRegistrationsByCustomer(customerEmail) {
  const registrations = await DeviceRegistration.find({ customerEmail }).sort({ saleDate: -1 });
  return registrations;
}

export async function transferDeviceRegistration(registrationId, newSellerId, transferredBy) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");

  // Remove from old seller
  await SellerReseller.findByIdAndUpdate(registration.sellerId, {
    $pull: { devicesSold: registration.deviceId },
  });

  // Calculate new commission
  const newSeller = await SellerReseller.findById(newSellerId);
  if (!newSeller) throw new Error("New seller not found");

  let commissionAmount = 0;
  if (newSeller.commission.type === "percentage") {
    commissionAmount = (registration.salePrice * newSeller.commission.value) / 100;
  } else {
    commissionAmount = newSeller.commission.value;
  }

  // Update registration
  registration.sellerId = newSellerId;
  registration.commissionAmount = commissionAmount;
  registration.status = "transferred";
  registration.updatedBy = transferredBy;
  registration.updatedAt = new Date();
  await registration.save();

  // Add to new seller
  await SellerReseller.findByIdAndUpdate(newSellerId, {
    $inc: {
      totalSales: registration.salePrice,
      totalCommission: commissionAmount,
    },
    $push: { devicesSold: registration.deviceId },
  });

  return registration;
}

export async function cancelDeviceRegistration(registrationId, cancelledBy) {
  const registration = await DeviceRegistration.findOne({ registrationId });
  if (!registration) throw new Error("Device registration not found");

  // Remove commission from seller
  await SellerReseller.findByIdAndUpdate(registration.sellerId, {
    $inc: {
      totalSales: -registration.salePrice,
      totalCommission: -registration.commissionAmount,
    },
    $pull: { devicesSold: registration.deviceId },
  });

  registration.status = "cancelled";
  registration.updatedBy = cancelledBy;
  registration.updatedAt = new Date();
  await registration.save();

  return registration;
}

// ── Permission Checks ──────────────────────────────────────────────────────────────
export async function checkSellerPermission(sellerId, permission) {
  const seller = await SellerReseller.findOne({ sellerId, status: "active" });
  if (!seller) return { allowed: false, reason: "Seller not found or inactive" };

  if (!seller.permissions[permission]) {
    return { allowed: false, reason: `Permission '${permission}' not granted` };
  }

  return { allowed: true, seller };
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getSellerStatistics(sellerId) {
  const seller = await SellerReseller.findById(sellerId);
  if (!seller) throw new Error("Seller not found");

  const registrations = await DeviceRegistration.find({ sellerId });
  const activeRegistrations = registrations.filter(r => r.status === "active");

  return {
    totalSales: seller.totalSales,
    totalCommission: seller.totalCommission,
    totalDevicesSold: seller.devicesSold.length,
    activeRegistrations: activeRegistrations.length,
    commissionTier: seller.commission.tier,
    businessType: seller.businessType,
    verified: seller.verified,
    status: seller.status,
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
