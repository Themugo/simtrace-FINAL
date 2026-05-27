// services/regulatory.js - Regulatory Blocking System
// Integration with CEIR and national regulatory bodies

import { RegulatoryBlock, Device } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Block Management ─────────────────────────────────────────────────────────────
export async function createRegulatoryBlock(data) {
  const {
    imei,
    deviceId,
    authority,
    authorityId,
    country,
    blockType,
    blockReason,
    blockReference,
    expiresAt,
  } = data;

  const device = deviceId ? await Device.findById(deviceId) : null;
  if (deviceId && !device) throw new Error("Device not found");

  const block = await RegulatoryBlock.create({
    imei,
    device: deviceId,
    authority,
    authorityId,
    country,
    blockType,
    blockReason,
    blockReference,
    blockedAt: new Date(),
    expiresAt,
    status: "active",
  });

  // Sync with authority (simulation)
  await syncWithAuthority(block._id, authority);

  // Notify via socket
  getIO().emit("regulatory_block_created", {
    blockId: block._id,
    imei,
    authority,
    blockType,
  });

  return block;
}

export async function getRegulatoryBlock(blockId) {
  const block = await RegulatoryBlock.findById(blockId)
    .populate("device");

  return block;
}

export async function getBlocksByImei(imei) {
  const blocks = await RegulatoryBlock.find({ imei })
    .populate("device")
    .sort({ blockedAt: -1 });

  return blocks;
}

export async function getBlocksByAuthority(authority, country) {
  const query = { authority };
  if (country) query.country = country;

  const blocks = await RegulatoryBlock.find(query)
    .populate("device")
    .sort({ blockedAt: -1 });

  return blocks;
}

export async function getActiveBlocks() {
  const blocks = await RegulatoryBlock.find({ status: "active" })
    .populate("device")
    .sort({ blockedAt: -1 });

  return blocks;
}

export async function updateBlockStatus(blockId, status) {
  const block = await RegulatoryBlock.findById(blockId);
  if (!block) throw new Error("Block not found");

  block.status = status;
  block.updatedAt = new Date();
  await block.save();

  // Notify via socket
  getIO().emit("regulatory_block_updated", {
    blockId,
    status,
    imei: block.imei,
  });

  return block;
}

// ── Sync with Authorities ───────────────────────────────────────────────────────
async function syncWithAuthority(blockId, authority) {
  const block = await RegulatoryBlock.findById(blockId);
  if (!block) return;

  // Simulate sync with authority
  const syncResult = {
    authority,
    syncedAt: new Date(),
    status: "success",
  };

  block.syncedWith.push(syncResult);
  await block.save();

  return syncResult;
}

export async function syncWithCeir(imei) {
  const blocks = await RegulatoryBlock.find({ imei, authority: "CEIR" });
  
  for (const block of blocks) {
    await syncWithAuthority(block._id, "CEIR");
  }

  return { synced: blocks.length };
}

export async function syncWithNationalRegulator(country, imei) {
  const blocks = await RegulatoryBlock.find({ 
    imei, 
    country,
    authority: { $ne: "CEIR" },
  });
  
  for (const block of blocks) {
    await syncWithAuthority(block._id, block.authority);
  }

  return { synced: blocks.length };
}

// ── Appeal Management ───────────────────────────────────────────────────────────
export async function submitAppeal(blockId, appealNotes) {
  const block = await RegulatoryBlock.findById(blockId);
  if (!block) throw new Error("Block not found");

  if (block.status !== "active") {
    throw new Error("Can only appeal active blocks");
  }

  block.appealStatus = "submitted";
  block.appealDate = new Date();
  block.appealNotes = appealNotes;
  block.updatedAt = new Date();
  await block.save();

  // Notify via socket
  getIO().emit("regulatory_appeal_submitted", {
    blockId,
    imei: block.imei,
  });

  return block;
}

export async function updateAppealStatus(blockId, appealStatus) {
  const block = await RegulatoryBlock.findById(blockId);
  if (!block) throw new Error("Block not found");

  block.appealStatus = appealStatus;
  block.updatedAt = new Date();

  if (appealStatus === "approved") {
    block.status = "lifted";
  }

  await block.save();

  return block;
}

// ── Block Expiry Check ─────────────────────────────────────────────────────────
export async function checkBlockExpiry() {
  const now = new Date();
  const expiredBlocks = await RegulatoryBlock.find({
    status: "active",
    expiresAt: { $lt: now },
  });

  for (const block of expiredBlocks) {
    await updateBlockStatus(block._id, "expired");
  }

  return expiredBlocks.length;
}

// ── Regulatory Statistics ───────────────────────────────────────────────────────
export async function getRegulatoryStatistics() {
  const [
    totalBlocks,
    activeBlocks,
    expiredBlocks,
    liftedBlocks,
    appealedBlocks,
    blocksByAuthority,
    blocksByType,
    blocksByCountry,
  ] = await Promise.all([
    RegulatoryBlock.countDocuments(),
    RegulatoryBlock.countDocuments({ status: "active" }),
    RegulatoryBlock.countDocuments({ status: "expired" }),
    RegulatoryBlock.countDocuments({ status: "lifted" }),
    RegulatoryBlock.countDocuments({ appealStatus: { $ne: "none" } }),
    RegulatoryBlock.aggregate([
      { $group: { _id: "$authority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    RegulatoryBlock.aggregate([
      { $group: { _id: "$blockType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    RegulatoryBlock.aggregate([
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    totalBlocks,
    activeBlocks,
    expiredBlocks,
    liftedBlocks,
    appealedBlocks,
    blocksByAuthority: blocksByAuthority.map(b => ({
      authority: b._id,
      count: b.count,
    })),
    blocksByType: blocksByType.map(b => ({
      type: b._id,
      count: b.count,
    })),
    blocksByCountry: blocksByCountry.map(b => ({
      country: b._id,
      count: b.count,
    })),
  };
}

// ── CEIR Integration (Simulation) ─────────────────────────────────────────────────
export async function checkCeirStatus(imei) {
  // In production, this would call the actual CEIR API
  const block = await RegulatoryBlock.findOne({
    imei,
    authority: "CEIR",
    status: "active",
  });

  return {
    imei,
    blocked: !!block,
    blockType: block?.blockType || null,
    blockReason: block?.blockReason || null,
    blockReference: block?.blockReference || null,
    blockedAt: block?.blockedAt || null,
  };
}

export async function addToCeirBlacklist(imei, reason, reference) {
  const block = await createRegulatoryBlock({
    imei,
    authority: "CEIR",
    authorityId: "CEIR-KENYA",
    country: "KE",
    blockType: "blacklist",
    blockReason: reason,
    blockReference: reference,
  });

  return block;
}

export async function removeFromCeirBlacklist(imei) {
  const block = await RegulatoryBlock.findOne({
    imei,
    authority: "CEIR",
    status: "active",
  });

  if (!block) {
    throw new Error("No active CEIR block found for this IMEI");
  }

  return await updateBlockStatus(block._id, "lifted");
}
