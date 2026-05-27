// services/telecomIntegration.js - Telecom integration services
import crypto from "crypto";
import {
  SimCardTracking,
  NetworkActivity,
  TelecomCompany,
  Device,
} from "../db/index.js";

// ── SIM Card Tracking ───────────────────────────────────────────────────────────────
export async function registerSimCard(data) {
  const trackingId = `sim_${crypto.randomBytes(16).toString("hex")}`;

  // Verify device exists
  const device = await Device.findById(data.deviceId);
  if (!device) throw new Error("Device not found");

  // Verify telecom company
  const company = await TelecomCompany.findById(data.companyId);
  if (!company) throw new Error("Telecom company not found");

  const tracking = await SimCardTracking.create({
    ...data,
    trackingId,
    status: "active",
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Update company stats
  await TelecomCompany.findByIdAndUpdate(data.companyId, {
    $inc: { totalTracked: 1 },
  });

  return tracking;
}

export async function updateSimCardLocation(trackingId, location, cellTowerId) {
  const tracking = await SimCardTracking.findOne({ trackingId });
  if (!tracking) throw new Error("SIM card tracking not found");

  tracking.lastLocation = {
    ...location,
    timestamp: new Date(),
    cellTowerId,
  };
  tracking.lastActivity = new Date();
  tracking.updatedAt = new Date();
  await tracking.save();

  return tracking;
}

export async function flagSimCardAsStolen(trackingId, flaggedBy) {
  const tracking = await SimCardTracking.findOne({ trackingId });
  if (!tracking) throw new Error("SIM card tracking not found");

  tracking.flaggedAsStolen = true;
  tracking.flaggedAt = new Date();
  tracking.flaggedBy = flaggedBy;
  tracking.status = "blocked";
  tracking.updatedAt = new Date();
  await tracking.save();

  // TODO: Notify telecom company
  // TODO: Notify police

  return tracking;
}

export async function unflagSimCard(trackingId, unflaggedBy) {
  const tracking = await SimCardTracking.findOne({ trackingId });
  if (!tracking) throw new Error("SIM card tracking not found");

  tracking.flaggedAsStolen = false;
  tracking.status = "active";
  tracking.updatedAt = new Date();
  await tracking.save();

  return tracking;
}

export async function getSimCardTracking(trackingId) {
  const tracking = await SimCardTracking.findOne({ trackingId });
  if (!tracking) throw new Error("SIM card tracking not found");
  return tracking;
}

export async function getSimCardTrackingByDevice(deviceId) {
  const tracking = await SimCardTracking.findOne({ deviceId });
  return tracking;
}

export async function getSimCardTrackingByCompany(companyId) {
  const tracking = await SimCardTracking.find({ companyId }).sort({ createdAt: -1 });
  return tracking;
}

export async function getSimCardTrackingByICCID(iccid) {
  const tracking = await SimCardTracking.findOne({ iccid });
  return tracking;
}

export async function getSimCardTrackingByMSISDN(msisdn) {
  const tracking = await SimCardTracking.findOne({ msisdn });
  return tracking;
}

export async function getFlaggedSimCards() {
  const tracking = await SimCardTracking.find({ flaggedAsStolen: true }).sort({ flaggedAt: -1 });
  return tracking;
}

export async function getFlaggedSimCardsByCompany(companyId) {
  const tracking = await SimCardTracking.find({ companyId, flaggedAsStolen: true }).sort({ flaggedAt: -1 });
  return tracking;
}

// ── Network Activity Tracking ─────────────────────────────────────────────────────────
export async function recordNetworkActivity(data) {
  const activityId = `activity_${crypto.randomBytes(16).toString("hex")}`;

  const activity = await NetworkActivity.create({
    ...data,
    activityId,
    createdBy: data.createdBy,
  });

  // Update SIM card last activity if device is tracked
  const simTracking = await SimCardTracking.findOne({ deviceId: data.deviceId });
  if (simTracking) {
    simTracking.lastActivity = data.timestamp;
    simTracking.updatedAt = new Date();
    await simTracking.save();
  }

  return activity;
}

export async function getNetworkActivity(activityId) {
  const activity = await NetworkActivity.findOne({ activityId });
  if (!activity) throw new Error("Network activity not found");
  return activity;
}

export async function getNetworkActivityByDevice(deviceId) {
  const activities = await NetworkActivity.find({ deviceId }).sort({ timestamp: -1 }).limit(100);
  return activities;
}

export async function getNetworkActivityByCompany(companyId) {
  const activities = await NetworkActivity.find({ companyId }).sort({ timestamp: -1 }).limit(100);
  return activities;
}

export async function getNetworkActivityByType(deviceId, activityType) {
  const activities = await NetworkActivity.find({ deviceId, activityType }).sort({ timestamp: -1 }).limit(100);
  return activities;
}

export async function getNetworkActivityByDateRange(companyId, startDate, endDate) {
  const activities = await NetworkActivity.find({
    companyId,
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: -1 });
  return activities;
}

// ── Cell Tower Triangulation ─────────────────────────────────────────────────────────
export async function triangulateDeviceLocation(deviceId) {
  // Get recent network activities
  const activities = await NetworkActivity.find({ deviceId })
    .sort({ timestamp: -1 })
    .limit(3);

  if (activities.length < 2) {
    throw new Error("Not enough network activity data for triangulation");
  }

  // TODO: Implement actual triangulation algorithm
  // This would use cell tower locations and signal strengths
  // to estimate device location

  const locations = activities.map((a) => a.location).filter(Boolean);
  const avgLatitude = locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
  const avgLongitude = locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

  return {
    latitude: avgLatitude,
    longitude: avgLongitude,
    accuracy: 100, // meters
    method: "cell-tower-triangulation",
    timestamp: new Date(),
  };
}

// ── Commission Calculation ────────────────────────────────────────────────────────────
export async function calculateCommission(companyId, deviceId, recovery) {
  const company = await TelecomCompany.findById(companyId);
  if (!company) throw new Error("Telecom company not found");

  let commissionAmount = 0;

  if (recovery) {
    // Recovery commission
    if (company.commission.type === "percentage") {
      commissionAmount = (company.commission.value / 100) * 100; // Base recovery value
    } else {
      commissionAmount = company.commission.value;
    }

    // Update company stats
    await TelecomCompany.findByIdAndUpdate(companyId, {
      $inc: {
        totalRecovered: 1,
        totalCommission: commissionAmount,
      },
    });
  }

  return commissionAmount;
}
