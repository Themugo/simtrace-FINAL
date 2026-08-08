// services/blockchain.ts - Blockchain Device Ledger Integration
// Immutable record of device lifecycle on blockchain

import crypto from "crypto";
import { BlockchainLedger, Device } from "../db/index.js";

// ── Transaction Hash Generation ───────────────────────────────────────────────────
function generateTransactionHash(data: {
  timestamp: Date;
  eventType: string;
  imei: string;
  fromAddress: string | null;
  toAddress: string | null;
  eventData: Record<string, unknown>;
}): string {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({
    timestamp: data.timestamp,
    eventType: data.eventType,
    imei: data.imei,
    fromAddress: data.fromAddress,
    toAddress: data.toAddress,
    eventData: data.eventData,
  }));
  return "0x" + hash.digest("hex");
}

// ── Block Number Simulation ────────────────────────────────────────────────────────
let currentBlockNumber = 1000000;
function getNextBlockNumber(): number {
  return ++currentBlockNumber;
}

// ── Record Event on Blockchain ─────────────────────────────────────────────────────
export async function recordBlockchainEvent(params: {
  imei: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  fromAddress?: string | null;
  toAddress?: string | null;
  initiator?: string | null;
}) {
  const {
    imei,
    eventType,
    eventData = {},
    fromAddress = null,
    toAddress = null,
    initiator = null,
  } = params;
  const device = await Device.findOne({ imei });
  if (!device) throw new Error("Device not found");

  const timestamp = new Date();
  const blockNumber = getNextBlockNumber();
  const transactionHash = generateTransactionHash({
    timestamp,
    eventType,
    imei,
    fromAddress,
    toAddress,
    eventData,
  });

  // Generate block hash
  const blockHash = crypto.createHash("sha256")
    .update(`${blockNumber}${timestamp}`)
    .digest("hex");

  const ledgerEntry = await BlockchainLedger.create({
    imei,
    device: device._id,
    transactionHash,
    blockNumber,
    blockHash: "0x" + blockHash,
    timestamp,
    eventType,
    eventData,
    fromAddress,
    toAddress,
    initiator,
    verified: false,
    confirmations: 0,
    ceirSynced: false,
  });

  // Simulate blockchain confirmation (in production, this would wait for actual confirmations)
  await simulateConfirmation(ledgerEntry._id);

  return ledgerEntry;
}

// ── Simulate Blockchain Confirmation ─────────────────────────────────────────────
async function simulateConfirmation(ledgerEntryId: string): Promise<void> {
  // In production, this would poll the blockchain for confirmations
  // For now, we simulate with a delay
  setTimeout(async () => {
    await BlockchainLedger.findByIdAndUpdate(ledgerEntryId, {
      verified: true,
      confirmations: Math.floor(Math.random() * 10) + 1, // 1-10 confirmations
    });
  }, 2000);
}

// ── Get Device Blockchain History ───────────────────────────────────────────────────
export async function getDeviceBlockchainHistory(imei: string) {
  const history = await BlockchainLedger.find({ imei })
    .sort({ timestamp: -1 })
    .populate("initiator", "name email")
    .populate("device", "imei make model");

  return history;
}

// ── Verify Transaction on Blockchain ───────────────────────────────────────────────
export async function verifyTransaction(transactionHash: string) {
  const ledgerEntry = await BlockchainLedger.findOne({ transactionHash });
  if (!ledgerEntry) {
    return { valid: false, reason: "Transaction not found" };
  }

  // In production, this would verify against actual blockchain
  // For now, we verify the hash locally
  const expectedHash = generateTransactionHash({
    timestamp: ledgerEntry.timestamp,
    eventType: ledgerEntry.eventType,
    imei: ledgerEntry.imei,
    fromAddress: ledgerEntry.fromAddress,
    toAddress: ledgerEntry.toAddress,
    eventData: ledgerEntry.eventData,
  });

  if (expectedHash !== transactionHash) {
    return { valid: false, reason: "Hash mismatch" };
  }

  return {
    valid: true,
    confirmations: ledgerEntry.confirmations,
    verified: ledgerEntry.verified,
    blockNumber: ledgerEntry.blockNumber,
  };
}

// ── Sync with CEIR (Central Equipment Identity Register) ───────────────────────────
export async function syncWithCeir(imei: string, eventType: string) {
  const ledgerEntry = await BlockchainLedger.findOne({ imei, eventType });
  if (!ledgerEntry) throw new Error("Ledger entry not found");

  // In production, this would call CEIR API
  // For now, we simulate the sync
  const ceirReference = `CEIR-${Date.now()}-${imei.slice(-6)}`;

  await BlockchainLedger.findByIdAndUpdate(ledgerEntry._id, {
    ceirSynced: true,
    ceirReference,
  });

  return { ceirReference, synced: true };
}

// ── Get Blockchain Statistics ─────────────────────────────────────────────────────
export async function getBlockchainStatistics() {
  const [
    totalTransactions,
    verifiedTransactions,
    ceirSynced,
    eventsByType,
  ] = await Promise.all([
    BlockchainLedger.countDocuments(),
    BlockchainLedger.countDocuments({ verified: true }),
    BlockchainLedger.countDocuments({ ceirSynced: true }),
    BlockchainLedger.aggregate([
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalTransactions,
    verifiedTransactions,
    verificationRate: totalTransactions > 0 
      ? ((verifiedTransactions / totalTransactions) * 100).toFixed(2) 
      : 0,
    ceirSynced,
    ceirSyncRate: totalTransactions > 0 
      ? ((ceirSynced / totalTransactions) * 100).toFixed(2) 
      : 0,
    eventsByType: eventsByType.map((e: { _id: string; count: number }) => ({
      type: e._id,
      count: e.count,
    })),
  };
}

// ── Event Type Helpers ─────────────────────────────────────────────────────────────
export async function recordDeviceRegistered(imei: string, owner: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "device_registered",
    eventData: { action: "initial_registration" },
    toAddress: owner,
  });
}

export async function recordOwnershipTransfer(imei: string, fromOwner: string, toOwner: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "ownership_transfer",
    eventData: { from: fromOwner, to: toOwner },
    fromAddress: fromOwner,
    toAddress: toOwner,
  });
}

export async function recordTheftReported(imei: string, reportedBy: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "theft_reported",
    eventData: { reportedAt: new Date() },
    initiator: reportedBy,
  });
}

export async function recordDeviceRecovered(imei: string, recoveredBy: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "device_recovered",
    eventData: { recoveredAt: new Date() },
    initiator: recoveredBy,
  });
}

export async function recordDeviceBlacklisted(imei: string, byUser: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "blacklisted",
    eventData: { blacklistedAt: new Date() },
    initiator: byUser,
  });
}

export async function recordDnaVerified(imei: string, confidence: number, verifiedBy: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "dna_verified",
    eventData: { confidence },
    initiator: verifiedBy,
  });
}

export async function recordCloneDetected(imei: string, cloneCount: number) {
  return recordBlockchainEvent({
    imei,
    eventType: "clone_detected",
    eventData: { cloneCount, detectedAt: new Date() },
  });
}

export async function recordCrossBorderRequest(imei: string, requestingCountry: string, targetCountry: string) {
  return recordBlockchainEvent({
    imei,
    eventType: "cross_border_request",
    eventData: {
      requestingCountry,
      targetCountry,
      requestedAt: new Date(),
    },
  });
}

// ── Blockchain Proof Generation ───────────────────────────────────────────────────
export async function generateDeviceProof(imei: string) {
  const history = await getDeviceBlockchainHistory(imei);
  
  if (history.length === 0) {
    return { proof: null, reason: "No blockchain history found" };
  }

  // Generate Merkle-like proof from transaction chain
  const proofHash = crypto.createHash("sha256");
  history.forEach(entry => {
    proofHash.update(entry.transactionHash);
  });

  return {
    proof: "0x" + proofHash.digest("hex"),
    transactionCount: history.length,
    firstTransaction: history[history.length - 1],
    lastTransaction: history[0],
    verified: history.every(entry => entry.verified),
  };
}
