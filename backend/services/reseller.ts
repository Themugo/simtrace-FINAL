// services/reseller.ts - Phone Reseller & Repair Shop Portal
// Business portal for phone resellers and repair shops

import { Reseller, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";

interface IResellerDoc {
  [key: string]: unknown;
  verified: boolean;
  verifiedAt: Date;
  verifiedBy: string;
  user: string;
  businessName: string;
  status: string;
  inventory: {
    push(item: Record<string, unknown>): void;
    id(id: string): Record<string, unknown> | null;
    pull(id: string): void;
  };
  transactions: {
    push(item: Record<string, unknown>): void;
  };
  rating: number;
  reviewCount: number;
}

interface IDeviceCheck {
  status: string;
  stolen?: boolean;
}

// ── Reseller Management ─────────────────────────────────────────────────────────
export async function createResellerProfile(data: Record<string, unknown>) {
  const {
    userId,
    businessName,
    businessType,
    licenseNumber,
    address,
    phone,
    email,
    services,
  } = data as { userId: string; businessName: string; businessType: string; licenseNumber: string; address: string; phone: string; email: string; services: string[] };

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

export async function getResellerProfile(resellerId: string) {
  const reseller = await Reseller.findById(resellerId)
    .populate("user", "name email")
    .populate("inventory.device")
    .populate("verifiedBy", "name email");

  return reseller;
}

export async function getResellerByUser(userId: string) {
  const reseller = await Reseller.findOne({ user: userId })
    .populate("inventory.device")
    .populate("verifiedBy", "name email");

  return reseller;
}

export async function updateResellerProfile(resellerId: string, updates: Record<string, unknown>) {
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
      (reseller as IResellerDoc)[key] = updates[key];
    }
  }

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function verifyReseller(resellerId: string, verifiedBy: string) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  (reseller as IResellerDoc).verified = true;
  (reseller as IResellerDoc).verifiedAt = new Date();
  (reseller as IResellerDoc).verifiedBy = verifiedBy;
  reseller.updatedAt = new Date();
  await reseller.save();

  // Notify via socket
  getIO().to(`user:${(reseller as IResellerDoc).user}`).emit("reseller_verified", {
    resellerId,
    businessName: (reseller as IResellerDoc).businessName,
  });

  return reseller;
}

export async function updateResellerStatus(resellerId: string, status: string) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  (reseller as IResellerDoc).status = status;
  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

// ── Inventory Management ───────────────────────────────────────────────────────
export async function addInventoryItem(resellerId: string, item: Record<string, unknown>) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const i = item as { deviceId: string; status: string; price: number };
  const device = await Device.findById(i.deviceId);
  if (!device) throw new Error("Device not found");

  (reseller as IResellerDoc).inventory.push({
    imei: device.imei,
    device: i.deviceId,
    status: i.status || "in_stock",
    price: i.price,
    listedAt: new Date(),
  });

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function updateInventoryItem(resellerId: string, inventoryId: string, updates: Record<string, unknown>) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const item = (reseller as IResellerDoc).inventory.id(inventoryId);
  if (!item) throw new Error("Inventory item not found");

  const u = updates as { status: string; price: number };
  if (u.status) item.status = u.status;
  if (u.price) item.price = u.price;

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function removeInventoryItem(resellerId: string, inventoryId: string) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  (reseller as IResellerDoc).inventory.pull(inventoryId);
  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

export async function recordTransaction(resellerId: string, transaction: Record<string, unknown>) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  const t = transaction as { type: string; imei: string; amount: number };
  (reseller as IResellerDoc).transactions.push({
    type: t.type,
    imei: t.imei,
    amount: t.amount,
    date: new Date(),
  });

  reseller.updatedAt = new Date();
  await reseller.save();

  return reseller;
}

// ── Reseller Queries ───────────────────────────────────────────────────────────
export async function getResellersByType(businessType: string) {
  const resellers = await Reseller.find({ businessType })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return resellers;
}

export async function getResellersByCountry(country: string) {
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

export async function searchResellers(query: string) {
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
export async function addResellerRating(resellerId: string, rating: number, _review: string) {
  const reseller = await Reseller.findById(resellerId);
  if (!reseller) throw new Error("Reseller not found");

  // Update rating (simplified - in production would store individual reviews)
  const currentTotal = (reseller as IResellerDoc).rating * (reseller as IResellerDoc).reviewCount;
  (reseller as IResellerDoc).reviewCount += 1;
  (reseller as IResellerDoc).rating = (currentTotal + rating) / (reseller as IResellerDoc).reviewCount;

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
    resellersByType: resellersByType.map((r) => ({
      type: r._id,
      count: r.count,
    })),
    resellersByCountry: resellersByCountry.map((r) => ({
      country: r._id,
      count: r.count,
    })),
    totalInventory: totalInventory[0]?.total || 0,
    avgRating: avgRating[0]?.avgRating?.toFixed(2) || 0,
  };
}

// ── Device Verification for Resellers ───────────────────────────────────────────
export async function verifyDeviceForReseller(imei: string) {
  const device = await Device.findOne({ imei });
  if (!device) {
    return {
      verified: false,
      reason: "Device not found in registry",
    };
  }

  // Check if device is blacklisted
  const isBlacklisted = (device as IDeviceCheck).status === "blacklisted" || (device as IDeviceCheck).stolen;

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
      status: (device as IDeviceCheck).status,
      stolen: (device as IDeviceCheck).stolen,
    },
    blacklisted: isBlacklisted,
    regulatoryBlocks: blocks.length,
    blocks: blocks.map((b) => ({
      authority: b.authority,
      blockType: b.blockType,
      blockReason: b.blockReason,
    })),
  };
}
