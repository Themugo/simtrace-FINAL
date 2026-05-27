// services/reseller.js - Phone Reseller & Repair Shop Portal
// Business portal for phone resellers and repair shops

import { Reseller, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Reseller Management ─────────────────────────────────────────────────────────
export async function createResellerProfile(data) {
  const {
    userId,
    businessName,
    businessType,
    licenseNumber,
    address,
    phone,
    email,
    services,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const reseller = await Reseller.create({
    user: userId,
    businessName,
    businessType,
    licenseNumber,
    address,
    phone,
    email,
    services,
    verified: false,
    status: "active",
  });

  // Notify via socket
  getIO().to("role:admin").emit("reseller_profile_created", {
    resellerId: reseller._id,
    businessName,
  });

  return reseller;
}

export async function getResellerProfile(resellerId) {
  const reseller = await Reseller.findById(resellerId)
    .populate("user", "name email")
    .populate("inventory.device")
    .populate("verifiedBy", "name email");

  return reseller;
}

export async function getResellerByUser(userId) {
  const reseller = await Reseller.findOne({ user: userId })
    .populate("inventory.device")
    .populate("verifiedBy", "name email");

  return reseller;
}

export async function updateResellerProfile(resellerId, updates) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const allowedUpdates = [
    "businessName",
    "businessType",
    "licenseNumber",
    "address",
    "phone",
    "email",
    "services",
  ];

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      reseller[key] = updates[key];
    }
  }

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function verifyReseller(resellerId, verifiedBy) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  reseller.verified = true;
  reseller.verifiedAt = new Date();
  reseller.verifiedBy = verifiedBy;
  reseller.updatedAt = new Date();
  await reseller.save();

  // Notify via socket
  getIO().to(`user:${reseller.user}`).emit("reseller_verified", {
    resellerId,
    businessName: reseller.businessName,
  });

  return reseller;
}

export async function updateResellerStatus(resellerId, status) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  reseller.status = status;
  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

// ── Inventory Management ───────────────────────────────────────────────────────
export async function addInventoryItem(resellerId, item) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const device = await Device.findById(item.deviceId);
  if (!device) throw new Error("Device not found");

  reseller.inventory.push({
    imei: device.imei,
    device: item.deviceId,
    status: item.status || "in_stock",
    price: item.price,
    listedAt: new Date(),
  });

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function updateInventoryItem(resellerId, inventoryId, updates) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const item = reseller.inventory.id(inventoryId);
  if (!item) throw new Error("Inventory item not found");

  if (updates.status) item.status = updates.status;
  if (updates.price) item.price = updates.price;

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function removeInventoryItem(resellerId, inventoryId) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  reseller.inventory.pull(inventoryId);
  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function recordTransaction(resellerId, transaction) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  reseller.transactions.push({
    type: transaction.type,
    imei: transaction.imei,
    amount: transaction.amount,
    date: new Date(),
  });

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

// ── Reseller Queries ───────────────────────────────────────────────────────────
export async function getResellersByType(businessType) {
  const resellers = await Reseller.find({ businessType })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return resellers;
}

export async function getResellersByCountry(country) {
  const resellers = await Reseller.find({ "address.country": country })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return resellers;
}

export async function getVerifiedResellers() {
  const resellers = await Reseller.find({ verified: true, status: "active" })
    .populate("user", "name email")
    .sort({ rating: -1 });

  return resellers;
}

export async function getPendingVerification() {
  const resellers = await Reseller.find({ verified: false, status: "active" })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return resellers;
}

export async function searchResellers(query) {
  const resellers = await Reseller.find({
    $or: [
      { businessName: { $regex: query, $options: "i" } },
      { "address.city": { $regex: query, $options: "i" } },
      { "address.region": { $regex: query, $options: "i" } },
    ],
    verified: true,
    status: "active",
  })
    .populate("user", "name email")
    .sort({ rating: -1 });

  return resellers;
}

// ── Rating & Reviews ───────────────────────────────────────────────────────────
export async function addResellerRating(resellerId, rating, review) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  // Update rating (simplified - in production would store individual reviews)
  const currentTotal = reseller.rating * reseller.reviewCount;
  reseller.reviewCount += 1;
  reseller.rating = (currentTotal + rating) / reseller.reviewCount;

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

// ── Reseller Statistics ───────────────────────────────────────────────────────
export async function getResellerStatistics() {
  const [
    totalResellers,
    verifiedResellers,
    pendingVerification,
    activeResellers,
    suspendedResellers,
    resellersByType,
    resellersByCountry,
    totalInventory,
  ] = await Promise.all([
    Reseller.countDocuments(),
    Reseller.countDocuments({ verified: true }),
    Reseller.countDocuments({ verified: false, status: "active" }),
    Reseller.countDocuments({ status: "active" }),
    Reseller.countDocuments({ status: "suspended" }),
    Reseller.aggregate([
      { $group: { _id: "$businessType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Reseller.aggregate([
      { $group: { _id: "$address.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Reseller.aggregate([
      { $unwind: "$inventory" },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]),
  ]);

  const avgRating = await Reseller.aggregate([
    { $match: { verified: true, reviewCount: { $gt: 0 } } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  return {
    totalResellers,
    verifiedResellers,
    pendingVerification,
    activeResellers,
    suspendedResellers,
    resellersByType: resellersByType.map(r => ({
      type: r._id,
      count: r.count,
    })),
    resellersByCountry: resellersByCountry.map(r => ({
      country: r._id,
      count: r.count,
    })),
    totalInventory: totalInventory[0]?.total || 0,
    avgRating: avgRating[0]?.avgRating?.toFixed(2) || 0,
  };
}

// ── Device Verification for Resellers ───────────────────────────────────────────
export async function verifyDeviceForReseller(imei) {
  const device = await Device.findOne({ imei });
  if (!device) {
    return {
      verified: false,
      reason: "Device not found in registry",
    };
  }

  // Check if device is blacklisted
  const isBlacklisted = device.status === "blacklisted" || device.stolen;

  // Check regulatory blocks
  const { RegulatoryBlock } = await import("../db/index.js");
  const blocks = await RegulatoryBlock.find({
    imei,
    status: "active",
    blockType: "blacklist",
  });

  return {
    verified: !isBlacklisted && blocks.length === 0,
    device: {
      imei: device.imei,
      make: device.make,
      model: device.model,
      status: device.status,
      stolen: device.stolen,
    },
    blacklisted: isBlacklisted,
    regulatoryBlocks: blocks.length,
    blocks: blocks.map(b => ({
      authority: b.authority,
      blockType: b.blockType,
      blockReason: b.blockReason,
    })),
  };
}
