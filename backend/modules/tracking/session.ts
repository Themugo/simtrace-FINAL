import { DeviceSession, TrackingEvent, DeviceLocation, Device } from '../../db/index.js';

// ── Device Session Engine ───────────────────────────────────────────────────────
export async function startDeviceSession(data: {
  imei: string;
  userId?: string;
  deviceKey?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  // End any existing active sessions for this device
  await DeviceSession.updateMany(
    { imei: data.imei, endTime: null },
    { endTime: new Date(), duration: 0 }
  );
  
  // Create new session
  const session = await DeviceSession.create({
    ...data,
    startTime: new Date(),
    eventsCount: 0,
  });
  
  // Log session start event
  await TrackingEvent.create({
    imei: data.imei,
    eventType: 'device_boot',
    data: {
      sessionId: session._id,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    timestamp: new Date(),
  });
  
  return session;
}

export async function endDeviceSession(imei: string) {
  const session = await DeviceSession.findOne({ imei, endTime: null });
  
  if (session) {
    const duration = Date.now() - session.startTime.getTime();
    await DeviceSession.findByIdAndUpdate(session._id, {
      endTime: new Date(),
      duration,
    });
    
    return session;
  }
  
  return null;
}

export async function incrementSessionEvents(sessionId: string) {
  return DeviceSession.findByIdAndUpdate(sessionId, {
    $inc: { eventsCount: 1 },
  });
}

export async function getActiveSession(imei: string) {
  return DeviceSession.findOne({ imei, endTime: null }).lean();
}

export async function getDeviceSessions(imei: string, limit = 50) {
  return DeviceSession.find({ imei })
    .sort({ startTime: -1 })
    .limit(limit)
    .lean();
}

// ── Change Detection ───────────────────────────────────────────────────────────
export async function detectSimChange(imei: string, newSimIccid: string) {
  const lastEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'network_change',
  }).sort({ timestamp: -1 });
  
  if (lastEvent && lastEvent.data.simIccid !== newSimIccid) {
    // SIM swap detected
    await TrackingEvent.create({
      imei,
      eventType: 'sim_change',
      data: {
        oldSimIccid: lastEvent.data.simIccid,
        newSimIccid,
        previousTimestamp: lastEvent.timestamp,
      },
      timestamp: new Date(),
    });
    
    return true;
  }
  
  return false;
}

export async function detectIpChange(imei: string, newIpAddress: string) {
  const lastEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'network_change',
  }).sort({ timestamp: -1 });
  
  if (lastEvent && lastEvent.data.ipAddress !== newIpAddress) {
    await TrackingEvent.create({
      imei,
      eventType: 'network_change',
      data: {
        oldIpAddress: lastEvent.data.ipAddress,
        newIpAddress,
        previousTimestamp: lastEvent.timestamp,
      },
      timestamp: new Date(),
    });
    
    return true;
  }
  
  return false;
}

interface DeviceFingerprint {
  networkMac?: string;
  bluetoothMac?: string;
  screenRes?: string;
  osVersion?: string;
  buildId?: string;
}

export async function detectFingerprintChange(imei: string, newFingerprint: DeviceFingerprint) {
  const device = await Device.findOne({ imei });
  
  if (!device) {
    return false;
  }

  if (!device.fingerprint) {
    await Device.findByIdAndUpdate(device._id, { fingerprint: newFingerprint });
    return false;
  }
  
  const changes: string[] = [];
  
  if (device.fingerprint.networkMac !== newFingerprint.networkMac) {
    changes.push('network_mac');
  }
  if (device.fingerprint.bluetoothMac !== newFingerprint.bluetoothMac) {
    changes.push('bluetooth_mac');
  }
  if (device.fingerprint.screenRes !== newFingerprint.screenRes) {
    changes.push('screen_resolution');
  }
  if (device.fingerprint.osVersion !== newFingerprint.osVersion) {
    changes.push('os_version');
  }
  if (device.fingerprint.buildId !== newFingerprint.buildId) {
    changes.push('build_id');
  }
  
  if (changes.length > 0) {
    await TrackingEvent.create({
      imei,
      eventType: 'suspicious_activity',
      data: {
        type: 'fingerprint_change',
        changes,
        oldFingerprint: device.fingerprint,
        newFingerprint,
      },
      timestamp: new Date(),
    });
    
    // Update device fingerprint
    await Device.findByIdAndUpdate(device._id, { fingerprint: newFingerprint });
    
    return true;
  }
  
  return false;
}

// ── Movement Continuity Analysis ─────────────────────────────────────────────────
export async function analyzeMovementContinuity(imei: string, hours = 24) {
  const locations = await DeviceLocation.find({
    imei,
    timestamp: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) },
  }).sort({ timestamp: 1 });
  
  if (locations.length < 2) {
    return { continuous: true, gaps: [] };
  }
  
  const gaps: Array<{ start: Date; end: Date; duration: number }> = [];
  let lastTimestamp = locations[0].timestamp.getTime();
  
  for (let i = 1; i < locations.length; i++) {
    const currentTimestamp = locations[i].timestamp.getTime();
    const timeDiff = (currentTimestamp - lastTimestamp) / 1000 / 60; // minutes
    
    // If gap is more than 4 hours, consider it a gap
    if (timeDiff > 240) {
      gaps.push({
        start: new Date(lastTimestamp),
        end: new Date(currentTimestamp),
        duration: timeDiff,
      });
    }
    
    lastTimestamp = currentTimestamp;
  }
  
  return {
    continuous: gaps.length === 0,
    gaps,
    totalLocations: locations.length,
  };
}

export async function detectImpossibleTravel(imei: string, maxSpeedKmh = 1000) {
  const locations = await DeviceLocation.find({ imei })
    .sort({ timestamp: 1 })
    .limit(100);
  
  if (locations.length < 2) {
    return null;
  }
  
  const earthRadiusKm = 6371;
  const suspiciousMoves: Array<{
    from: { lat: number; lng: number; timestamp: Date };
    to: { lat: number; lng: number; timestamp: Date };
    distance: number;
    timeDiffHours: number;
    calculatedSpeed: number;
  }> = [];
  
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    
    const timeDiffHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (timeDiffHours <= 0) continue;
    
    // Calculate distance using Haversine formula
    const lat1 = (prev.lat * Math.PI) / 180;
    const lat2 = (curr.lat * Math.PI) / 180;
    const deltaLat = lat2 - lat1;
    const deltaLng = ((curr.lng - prev.lng) * Math.PI) / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;
    
    const speed = distance / timeDiffHours;
    
    if (speed > maxSpeedKmh) {
      suspiciousMoves.push({
        from: { lat: prev.lat, lng: prev.lng, timestamp: prev.timestamp },
        to: { lat: curr.lat, lng: curr.lng, timestamp: curr.timestamp },
        distance,
        timeDiffHours,
        calculatedSpeed: speed,
      });
    }
  }
  
  return suspiciousMoves.length > 0 ? suspiciousMoves : null;
}
