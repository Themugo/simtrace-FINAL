// services/securityEnhanced.ts - Enhanced Security Features
// Nearby device detection, guardian system, parent-child tracking, panic mode

import { NearbyDeviceDetection, Guardian, ParentChild, PanicMode, Device, User, SatellitePing } from "../db/index.js";
import { getIO } from "./socket.js";

// ── Nearby Device Detection ───────────────────────────────────────────────────────
export async function detectNearbyDevices(data: any) {
  const {
    deviceId,
    userId,
    incidentType,
    incidentDescription,
    location,
  } = data;

  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  // Get nearby devices from satellite pings in the area
  const nearbyRadius = 500; // 500 meters
  const timeWindow = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

  const nearbyPings = await SatellitePing.find({
    device: { $ne: deviceId },
    timestamp: { $gte: timeWindow },
    latitude: { $gte: location.lat - 0.005, $lte: location.lat + 0.005 },
    longitude: { $gte: location.lng - 0.005, $lte: location.lng + 0.005 },
  })
    .populate("device")
    .limit(20);

  const nearbyDevices = nearbyPings.map((ping: any) => ({
    imei: ping.device.imei,
    signalStrength: ping.signalStrength || 50,
    distance: calculateDistance(location.lat, location.lng, ping.latitude, ping.longitude),
    lastSeen: ping.timestamp,
    isSimtraceUser: true,
  }));

  // Create detection record
  const detection = await NearbyDeviceDetection.create({
    device: deviceId,
    user: userId,
    timestamp: new Date(),
    location,
    nearbyDevices,
    incidentType,
    incidentDescription,
    status: "pending",
  });

  // Notify via socket
  getIO().to(`user:${userId}`).emit("nearby_devices_detected", {
    detectionId: detection._id,
    nearbyDevices: nearbyDevices.length,
    incidentType,
  });

  return detection;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return in meters
}

export async function getNearbyDeviceDetection(detectionId: string) {
  const detection = await NearbyDeviceDetection.findById(detectionId)
    .populate("device", "imei make model")
    .populate("user", "name email")
    .populate("potentialWitnesses.userId", "name email");

  return detection;
}

export async function getNearbyDetectionsByDevice(deviceId: string) {
  const detections = await NearbyDeviceDetection.find({ device: deviceId })
    .sort({ timestamp: -1 });

  return detections;
}

export async function addPotentialWitness(detectionId: string, witnessData: any) {
  const detection = await NearbyDeviceDetection.findById(detectionId);
  if (!detection) throw new Error("Detection not found");

  (detection as any).potentialWitnesses.push(witnessData);
  (detection as any).status = "investigating";
  await detection.save();

  return detection;
}

// ── Guardian/Nominee System ─────────────────────────────────────────────────────
export async function addGuardian(data: any) {
  const {
    userId,
    guardianId,
    name,
    phone,
    email,
    relationship,
    permissions,
    canReportTheft,
    emergencyOnly,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const guardian = await User.findById(guardianId);
  if (!guardian) throw new Error("Guardian user not found");

  const guardianRelation = await Guardian.create({
    user: userId,
    guardian: guardianId,
    name: name || (guardian as any).name,
    phone: phone || (guardian as any).phone,
    email: email || (guardian as any).email,
    relationship,
    permissions: permissions || [{ type: "report_theft", enabled: true }],
    canReportTheft: canReportTheft !== false,
    emergencyOnly: emergencyOnly !== false,
    status: "active",
  });

  // Notify guardian
  getIO().to(`user:${guardianId}`).emit("guardian_added", {
    guardianId: guardianRelation._id,
    userName: (user as any).name,
    relationship,
  });

  return guardianRelation;
}

export async function getGuardians(userId: string) {
  const guardians = await Guardian.find({ user: userId, status: "active" })
    .populate("guardian", "name email phone")
    .sort({ createdAt: -1 });

  return guardians;
}

export async function removeGuardian(userId: string, guardianId: string) {
  const guardian = await Guardian.findOne({ user: userId, guardian: guardianId });
  if (!guardian) throw new Error("Guardian not found");

  (guardian as any).status = "revoked";
  guardian.updatedAt = new Date();
  await guardian.save();

  return guardian;
}

export async function updateGuardianPermissions(userId: string, guardianId: string, permissions: any) {
  const guardian = await Guardian.findOne({ user: userId, guardian: guardianId });
  if (!guardian) throw new Error("Guardian not found");

  (guardian as any).permissions = permissions;
  guardian.updatedAt = new Date();
  await guardian.save();

  return guardian;
}

export async function guardianReportTheft(guardianId: string, deviceId: string, reason: string) {
  const guardian = await Guardian.findById(guardianId);
  if (!guardian) throw new Error("Guardian not found");

  if (!(guardian as any).canReportTheft) {
    throw new Error("Guardian does not have permission to report theft");
  }

  if ((guardian as any).emergencyOnly) {
    // Log emergency report
    (guardian as any).usageCount += 1;
    (guardian as any).lastUsed = new Date();
    await guardian.save();
  }

  // Create theft report (would integrate with existing theft report system)
  // For now, return confirmation
  return {
    success: true,
    message: "Theft reported by guardian",
    guardianId,
    deviceId,
    reason,
    timestamp: new Date(),
  };
}

// ── Parent-Child Relationship System ─────────────────────────────────────────────
export async function addChild(data: any) {
  const {
    parentId,
    childId,
    childName,
    childAge,
    school,
    canTrack,
    canManageDevice,
    canReceiveAlerts,
  } = data;

  const parent = await User.findById(parentId);
  if (!parent) throw new Error("Parent not found");

  const child = await User.findById(childId);
  if (!child) throw new Error("Child not found");

  const parentChild = await ParentChild.create({
    parent: parentId,
    child: childId,
    childName: childName || (child as any).name,
    childAge,
    school,
    canTrack: canTrack !== false,
    canManageDevice: canManageDevice !== false,
    canReceiveAlerts: canReceiveAlerts !== false,
    guardianConsent: data.guardianConsent === true,
    consentRecordedAt: data.guardianConsent === true ? new Date() : null,
    dataRetentionUntil: data.guardianConsent === true ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
    status: "active",
  });

  // Notify parent
  getIO().to(`user:${parentId}`).emit("child_added", {
    parentChildId: parentChild._id,
    childName: (parentChild as any).childName,
  });

  return parentChild;
}

export async function getChildren(parentId: string) {
  const children = await ParentChild.find({ parent: parentId, status: "active" })
    .populate("child", "name email phone")
    .sort({ createdAt: -1 });

  return children;
}

export async function enableLiveTracking(parentChildId: string, reason: string, durationHours = 24) {
  const parentChild = await ParentChild.findById(parentChildId);
  if (!parentChild) throw new Error("Parent-child relationship not found");

  // Lawful-basis gate: live-tracking a minor requires recorded guardian consent
  if ((parentChild as any).guardianConsent !== true) {
    throw new Error("Guardian consent is required before enabling live tracking of a minor");
  }

  const startTime = new Date();
  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  (parentChild as any).liveTrackingEnabled = true;
  (parentChild as any).liveTrackingReason = reason;
  (parentChild as any).liveTrackingStartTime = startTime;
  (parentChild as any).liveTrackingEndTime = endTime;
  parentChild.updatedAt = new Date();
  await parentChild.save();

  // Notify child
  getIO().to(`user:${(parentChild as any).child}`).emit("live_tracking_enabled", {
    reason,
    endTime,
  });

  return parentChild;
}

export async function disableLiveTracking(parentChildId: string) {
  const parentChild = await ParentChild.findById(parentChildId);
  if (!parentChild) throw new Error("Parent-child relationship not found");

  (parentChild as any).liveTrackingEnabled = false;
  (parentChild as any).liveTrackingReason = null;
  (parentChild as any).liveTrackingStartTime = null;
  (parentChild as any).liveTrackingEndTime = null;
  parentChild.updatedAt = new Date();
  await parentChild.save();

  // Notify child
  getIO().to(`user:${(parentChild as any).child}`).emit("live_tracking_disabled", {});

  return parentChild;
}

export async function addGeofence(parentChildId: string, geofenceData: any) {
  const parentChild = await ParentChild.findById(parentChildId);
  if (!parentChild) throw new Error("Parent-child relationship not found");

  (parentChild as any).geofences.push(geofenceData);
  parentChild.updatedAt = new Date();
  await parentChild.save();

  return parentChild;
}

export async function removeGeofence(parentChildId: string, geofenceIndex: number) {
  const parentChild = await ParentChild.findById(parentChildId);
  if (!parentChild) throw new Error("Parent-child relationship not found");

  (parentChild as any).geofences.splice(geofenceIndex, 1);
  parentChild.updatedAt = new Date();
  await parentChild.save();

  return parentChild;
}

// ── Panic Mode System ───────────────────────────────────────────────────────────
export async function activatePanicMode(data: any) {
  const {
    userId,
    deviceId,
    panicType,
    description,
    location,
    authorizedTrackers,
  } = data;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  const panicMode = await PanicMode.create({
    user: userId,
    device: deviceId,
    panicType,
    description,
    location,
    authorizedTrackers: authorizedTrackers || [],
    status: "active",
  });

  // Notify authorized trackers
  for (const tracker of authorizedTrackers) {
    getIO().to(`user:${tracker.userId}`).emit("panic_activated", {
      panicId: panicMode._id,
      userName: (user as any).name,
      panicType,
      location,
    });
  }

  // Notify user's emergency contacts
  getIO().to(`user:${userId}`).emit("panic_confirmed", {
    panicId: panicMode._id,
  });

  return panicMode;
}

export async function getPanicMode(panicId: string) {
  const panicMode = await PanicMode.findById(panicId)
    .populate("user", "name email phone")
    .populate("device", "imei make model")
    .populate("authorizedTrackers.userId", "name email phone");

  return panicMode;
}

export async function getActivePanicModes(userId: string) {
  const panicModes = await PanicMode.find({
    $or: [
      { user: userId },
      { "authorizedTrackers.userId": userId },
    ],
    status: "active",
  })
    .sort({ createdAt: -1 });

  return panicModes;
}

export async function resolvePanicMode(panicId: string, resolvedBy: string, resolutionNotes: string) {
  const panicMode = await PanicMode.findById(panicId);
  if (!panicMode) throw new Error("Panic mode not found");

  (panicMode as any).status = "resolved";
  (panicMode as any).resolvedAt = new Date();
  (panicMode as any).resolvedBy = resolvedBy;
  (panicMode as any).resolutionNotes = resolutionNotes;
  panicMode.updatedAt = new Date();
  await panicMode.save();

  // Notify all involved parties
  getIO().to(`user:${(panicMode as any).user}`).emit("panic_resolved", {
    panicId: panicMode._id,
    resolutionNotes,
  });

  for (const tracker of (panicMode as any).authorizedTrackers) {
    getIO().to(`user:${tracker.userId}`).emit("panic_resolved", {
      panicId: panicMode._id,
      resolutionNotes,
    });
  }

  return panicMode;
}

export async function cancelPanicMode(panicId: string) {
  const panicMode = await PanicMode.findById(panicId);
  if (!panicMode) throw new Error("Panic mode not found");

  (panicMode as any).status = "cancelled";
  panicMode.updatedAt = new Date();
  await panicMode.save();

  // Notify all involved parties
  getIO().to(`user:${(panicMode as any).user}`).emit("panic_cancelled", {
    panicId: panicMode._id,
  });

  for (const tracker of (panicMode as any).authorizedTrackers) {
    getIO().to(`user:${tracker.userId}`).emit("panic_cancelled", {
      panicId: panicMode._id,
    });
  }

  return panicMode;
}

// ── Security Statistics ───────────────────────────────────────────────────────────
export async function getSecurityStatistics() {
  const [
    totalDetections,
    pendingDetections,
    resolvedDetections,
    totalGuardians,
    activeGuardians,
    totalParentChild,
    activeParentChild,
    activeLiveTracking,
    totalPanicModes,
    activePanicModes,
    resolvedPanicModes,
  ] = await Promise.all([
    NearbyDeviceDetection.countDocuments(),
    NearbyDeviceDetection.countDocuments({ status: "pending" }),
    NearbyDeviceDetection.countDocuments({ status: "resolved" }),
    Guardian.countDocuments(),
    Guardian.countDocuments({ status: "active" }),
    ParentChild.countDocuments(),
    ParentChild.countDocuments({ status: "active" }),
    ParentChild.countDocuments({ liveTrackingEnabled: true }),
    PanicMode.countDocuments(),
    PanicMode.countDocuments({ status: "active" }),
    PanicMode.countDocuments({ status: "resolved" }),
  ]);

  return {
    nearbyDeviceDetection: {
      total: totalDetections,
      pending: pendingDetections,
      resolved: resolvedDetections,
    },
    guardians: {
      total: totalGuardians,
      active: activeGuardians,
    },
    parentChild: {
      total: totalParentChild,
      active: activeParentChild,
      liveTracking: activeLiveTracking,
    },
    panicModes: {
      total: totalPanicModes,
      active: activePanicModes,
      resolved: resolvedPanicModes,
    },
  };
}
