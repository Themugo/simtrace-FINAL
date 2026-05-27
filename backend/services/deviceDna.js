// services/deviceDna.js - Global Device DNA System
// Hardware-level fingerprinting for anti-cloning and device verification

import crypto from "crypto";
import { DeviceDna, Device } from "../db/index.js";

// ── DNA Hash Generation ────────────────────────────────────────────────────────
function generateChipsetSignature(data) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({
    manufacturer: data.manufacturer,
    model: data.model,
    socId: data.socId,
    cpuCores: data.cpuCores,
    gpuModel: data.gpuModel,
  }));
  return hash.digest("hex");
}

function generateRadioSignature(data) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({
    basebandVersion: data.basebandVersion,
    modemFirmware: data.modemFirmware,
    supportedBands: data.supportedBands?.sort(),
    imeiHash: data.imeiHash,
  }));
  return hash.digest("hex");
}

function generateSensorFingerprint(data) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({
    accelerometer: data.accelerometer,
    gyroscope: data.gyroscope,
    magnetometer: data.magnetometer,
  }));
  return hash.digest("hex");
}

function generateEntropyHash(data) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({
    bootTime: data.bootTime,
    uptime: data.uptime,
    memoryPattern: data.memoryPattern,
    thermalProfile: data.thermalProfile,
  }));
  return hash.digest("hex");
}

// ── DNA Collection & Storage ──────────────────────────────────────────────────────
export async function collectDeviceDna({ imei, chipset, radio, sensors, entropy }) {
  const device = await Device.findOne({ imei });
  if (!device) throw new Error("Device not registered");

  // Generate signatures
  const chipsetSig = generateChipsetSignature(chipset);
  const radioSig = generateRadioSignature(radio);
  const sensorSig = generateSensorFingerprint(sensors);
  const entropySig = generateEntropyHash(entropy);

  // Check for existing DNA
  let dna = await DeviceDna.findOne({ imei });
  
  if (dna) {
    // Update existing DNA
    dna.chipset = { ...chipset, signature: chipsetSig };
    dna.radio = { ...radio, networkSignature: radioSig };
    dna.sensors = { ...sensors, fingerprint: sensorSig };
    dna.entropy = { ...entropy, uniqueHash: entropySig };
    dna.updatedAt = new Date();
    
    // Clone detection: check if signatures changed significantly
    await detectClones(dna);
    
    await dna.save();
  } else {
    // Create new DNA record
    dna = await DeviceDna.create({
      imei,
      device: device._id,
      chipset: { ...chipset, signature: chipsetSig },
      radio: { ...radio, networkSignature: radioSig },
      sensors: { ...sensors, fingerprint: sensorSig },
      entropy: { ...entropy, uniqueHash: entropySig },
      verified: false,
      cloneDetected: false,
      cloneCount: 0,
    });
  }

  return dna;
}

// ── Clone Detection ───────────────────────────────────────────────────────────────
export async function detectClones(dnaRecord) {
  const { imei, chipset, radio, sensors } = dnaRecord;
  
  // Check for devices with same chipset signature but different IMEI
  const chipsetClones = await DeviceDna.find({
    imei: { $ne: imei },
    "chipset.signature": chipset.signature,
  });

  // Check for devices with same radio signature but different IMEI
  const radioClones = await DeviceDna.find({
    imei: { $ne: imei },
    "radio.networkSignature": radio.networkSignature,
  });

  // Check for devices with same sensor fingerprint but different IMEI
  const sensorClones = await DeviceDna.find({
    imei: { $ne: imei },
    "sensors.fingerprint": sensors.fingerprint,
  });

  const totalClones = chipsetClones.length + radioClones.length + sensorClones.length;
  
  if (totalClones > 0) {
    dnaRecord.cloneDetected = true;
    dnaRecord.cloneCount = totalClones;
    dnaRecord.lastCloneCheck = new Date();
    
    return {
      detected: true,
      count: totalClones,
      chipsetMatches: chipsetClones.length,
      radioMatches: radioClones.length,
      sensorMatches: sensorClones.length,
      matchedImeis: [
        ...chipsetClones.map(d => d.imei),
        ...radioClones.map(d => d.imei),
        ...sensorClones.map(d => d.imei),
      ].filter((v, i, a) => a.indexOf(v) === i), // unique
    };
  }

  dnaRecord.cloneDetected = false;
  dnaRecord.lastCloneCheck = new Date();
  
  return { detected: false, count: 0 };
}

// ── DNA Verification ─────────────────────────────────────────────────────────────
export async function verifyDeviceDna(imei, providedDna) {
  const dna = await DeviceDna.findOne({ imei });
  if (!dna) throw new Error("DNA record not found for this device");

  let matchScore = 0;
  const maxScore = 4; // chipset, radio, sensors, entropy

  // Compare chipset
  if (providedDna.chipset) {
    const providedSig = generateChipsetSignature(providedDna.chipset);
    if (providedSig === dna.chipset.signature) matchScore++;
  }

  // Compare radio
  if (providedDna.radio) {
    const providedSig = generateRadioSignature(providedDna.radio);
    if (providedSig === dna.radio.networkSignature) matchScore++;
  }

  // Compare sensors
  if (providedDna.sensors) {
    const providedSig = generateSensorFingerprint(providedDna.sensors);
    if (providedSig === dna.sensors.fingerprint) matchScore++;
  }

  // Compare entropy
  if (providedDna.entropy) {
    const providedSig = generateEntropyHash(providedDna.entropy);
    if (providedSig === dna.entropy.uniqueHash) matchScore++;
  }

  const confidence = Math.round((matchScore / maxScore) * 100);

  // Update verification status
  dna.verified = confidence >= 75; // Require 75% match
  dna.confidence = confidence;
  dna.verifiedAt = new Date();
  await dna.save();

  return {
    verified: dna.verified,
    confidence,
    matchScore,
    maxScore,
    details: {
      chipset: matchScore >= 1,
      radio: matchScore >= 2,
      sensors: matchScore >= 3,
      entropy: matchScore >= 4,
    },
  };
}

// ── DNA Query & Analysis ─────────────────────────────────────────────────────────
export async function getDeviceDna(imei) {
  const dna = await DeviceDna.findOne({ imei }).populate("device");
  if (!dna) return null;

  // Check for recent clones
  const cloneInfo = await detectClones(dna);

  return {
    ...dna.toObject(),
    cloneInfo,
  };
}

export async function searchByDnaFingerprint({ chipsetSig, radioSig, sensorSig }) {
  const query = {};
  
  if (chipsetSig) query["chipset.signature"] = chipsetSig;
  if (radioSig) query["radio.networkSignature"] = radioSig;
  if (sensorSig) query["sensors.fingerprint"] = sensorSig;

  const matches = await DeviceDna.find(query).populate("device");
  
  return matches.map(dna => ({
    imei: dna.imei,
    device: dna.device,
    confidence: dna.confidence,
    verified: dna.verified,
    cloneDetected: dna.cloneDetected,
  }));
}

// ── DNA Statistics ───────────────────────────────────────────────────────────────
export async function getDnaStatistics() {
  const [
    totalDna,
    verifiedDna,
    cloneDetected,
    avgConfidence,
  ] = await Promise.all([
    DeviceDna.countDocuments(),
    DeviceDna.countDocuments({ verified: true }),
    DeviceDna.countDocuments({ cloneDetected: true }),
    DeviceDna.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } },
    ]),
  ]);

  return {
    totalDevices: totalDna,
    verifiedDevices: verifiedDna,
    cloneDetected: cloneDetected,
    verificationRate: totalDna > 0 ? ((verifiedDna / totalDna) * 100).toFixed(2) : 0,
    cloneRate: totalDna > 0 ? ((cloneDetected / totalDna) * 100).toFixed(2) : 0,
    averageConfidence: avgConfidence[0]?.avgConfidence?.toFixed(2) || 0,
  };
}

// ── Batch DNA Verification (for partner API) ─────────────────────────────────────
export async function batchVerifyDna(imeiList) {
  const results = await Promise.all(
    imeiList.map(async (imei) => {
      try {
        const dna = await getDeviceDna(imei);
        return {
          imei,
          found: !!dna,
          verified: dna?.verified || false,
          confidence: dna?.confidence || 0,
          cloneDetected: dna?.cloneDetected || false,
        };
      } catch (error) {
        return {
          imei,
          found: false,
          error: error.message,
        };
      }
    })
  );

  return results;
}
