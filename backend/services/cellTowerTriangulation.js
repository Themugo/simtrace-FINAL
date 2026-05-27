// services/cellTowerTriangulation.js - Cell Tower Triangulation Service
// Satellite-assisted location tracking with cell tower data

import { SatellitePing, Device } from "../db/index.js";

// ── Cell Tower Database (Simplified) ───────────────────────────────────────────────
// In production, this would be a comprehensive database of cell towers
const CELL_TOWER_DATABASE = {
  // Kenya (Safaricom, Airtel, Telkom)
  "KE": {
    // Nairobi
    "63902": { lat: -1.286389, lng: 36.817223, provider: "Safaricom", city: "Nairobi" },
    "63901": { lat: -1.2921, lng: 36.8219, provider: "Safaricom", city: "Nairobi" },
    "63907": { lat: -1.2833, lng: 36.8167, provider: "Airtel", city: "Nairobi" },
    "63908": { lat: -1.2700, lng: 36.8070, provider: "Telkom", city: "Nairobi" },
    "63903": { lat: -1.2850, lng: 36.8190, provider: "Safaricom", city: "Nairobi" },
    "63904": { lat: -1.2900, lng: 36.8230, provider: "Airtel", city: "Nairobi" },
    "63905": { lat: -1.2750, lng: 36.8100, provider: "Telkom", city: "Nairobi" },
    // Mombasa
    "63910": { lat: -4.0435, lng: 39.6682, provider: "Safaricom", city: "Mombasa" },
    "63912": { lat: -4.0500, lng: 39.6700, provider: "Airtel", city: "Mombasa" },
    "63913": { lat: -4.0450, lng: 39.6650, provider: "Telkom", city: "Mombasa" },
    // Kisumu
    "63911": { lat: -0.0917, lng: 34.7676, provider: "Safaricom", city: "Kisumu" },
    "63914": { lat: -0.0950, lng: 34.7700, provider: "Airtel", city: "Kisumu" },
    "63915": { lat: -0.0880, lng: 34.7650, provider: "Telkom", city: "Kisumu" },
    // Nakuru
    "63920": { lat: -0.2844, lng: 36.0669, provider: "Safaricom", city: "Nakuru" },
    "63921": { lat: -0.2880, lng: 36.0700, provider: "Airtel", city: "Nakuru" },
    "63922": { lat: -0.2800, lng: 36.0640, provider: "Telkom", city: "Nakuru" },
    // Eldoret
    "63930": { lat: 0.5143, lng: 35.2698, provider: "Safaricom", city: "Eldoret" },
    "63931": { lat: 0.5180, lng: 35.2730, provider: "Airtel", city: "Eldoret" },
    "63932": { lat: 0.5100, lng: 35.2660, provider: "Telkom", city: "Eldoret" },
    // Other major towns
    "63940": { lat: -0.6167, lng: 34.7667, provider: "Safaricom", city: "Machakos" },
    "63941": { lat: -0.5167, lng: 37.2667, provider: "Safaricom", city: "Meru" },
    "63942": { lat: -0.2333, lng: 37.9667, provider: "Safaricom", city: "Embu" },
    "63943": { lat: -0.4667, lng: 37.5833, provider: "Airtel", city: "Chuka" },
    "63944": { lat: -0.0333, lng: 37.6500, provider: "Safaricom", city: "Nyeri" },
    "63945": { lat: -0.0167, lng: 37.0667, provider: "Airtel", city: "Karatina" },
    "63946": { lat: -0.4333, lng: 35.1833, provider: "Safaricom", city: "Naivasha" },
    "63947": { lat: -1.0833, lng: 36.7667, provider: "Telkom", city: "Kiambu" },
    "63948": { lat: -1.1667, lng: 37.0667, provider: "Safaricom", city: "Thika" },
    "63949": { lat: -1.0500, lng: 37.0333, provider: "Airtel", city: "Murang'a" },
  },
  // Nigeria (MTN, Airtel, 9mobile, Glo)
  "NG": {
    "62130": { lat: 6.5244, lng: 3.3792, provider: "MTN", city: "Lagos" },
    "62120": { lat: 6.6018, lng: 3.3515, provider: "Airtel", city: "Lagos" },
    "62125": { lat: 6.5244, lng: 3.3792, provider: "9mobile", city: "Lagos" },
    "62140": { lat: 9.0579, lng: 7.4951, provider: "MTN", city: "Abuja" },
    "62145": { lat: 6.5244, lng: 3.3792, provider: "Glo", city: "Lagos" },
  },
  // South Africa (Vodacom, MTN, Cell C, Telkom)
  "ZA": {
    "65510": { lat: -26.2041, lng: 28.0473, provider: "Vodacom", city: "Johannesburg" },
    "65501": { lat: -33.9249, lng: 18.4241, provider: "MTN", city: "Cape Town" },
    "65507": { lat: -25.7479, lng: 28.2293, provider: "Cell C", city: "Pretoria" },
    "65502": { lat: -29.8579, lng: 31.0292, provider: "Telkom", city: "Durban" },
  },
  // Ghana (MTN, Vodafone, AirtelTigo)
  "GH": {
    "62001": { lat: 5.6037, lng: -0.1870, provider: "MTN", city: "Accra" },
    "62002": { lat: 5.6037, lng: -0.1870, provider: "Vodafone", city: "Accra" },
    "62003": { lat: 5.6037, lng: -0.1870, provider: "AirtelTigo", city: "Accra" },
    "62010": { lat: 6.6933, lng: -1.6244, provider: "MTN", city: "Kumasi" },
  },
  // Uganda (MTN, Airtel, Africell)
  "UG": {
    "64110": { lat: 0.3476, lng: 32.5825, provider: "MTN", city: "Kampala" },
    "64101": { lat: 0.3476, lng: 32.5825, provider: "Airtel", city: "Kampala" },
    "64107": { lat: 0.3476, lng: 32.5825, provider: "Africell", city: "Kampala" },
    "64111": { lat: 0.3500, lng: 32.5850, provider: "MTN", city: "Kampala" },
    "64112": { lat: 0.3450, lng: 32.5800, provider: "Airtel", city: "Kampala" },
    "64113": { lat: 0.3520, lng: 32.5880, provider: "Africell", city: "Kampala" },
    "64120": { lat: 0.3136, lng: 32.5811, provider: "MTN", city: "Entebbe" },
    "64121": { lat: 0.3136, lng: 32.5811, provider: "Airtel", city: "Entebbe" },
    "64130": { lat: 0.6052, lng: 30.2755, provider: "MTN", city: "Gulu" },
    "64131": { lat: 0.6052, lng: 30.2755, provider: "Airtel", city: "Gulu" },
    "64140": { lat: 0.4734, lng: 33.2337, provider: "MTN", city: "Jinja" },
    "64141": { lat: 0.4734, lng: 33.2337, provider: "Airtel", city: "Jinja" },
    "64150": { lat: 0.5705, lng: 34.5606, provider: "MTN", city: "Mbale" },
    "64151": { lat: 0.5705, lng: 34.5606, provider: "Airtel", city: "Mbale" },
  },
  // Tanzania (Vodacom, Airtel, Tigo, Halotel, TTCL)
  "TZ": {
    "64001": { lat: -6.7924, lng: 39.2083, provider: "Vodacom", city: "Dar es Salaam" },
    "64002": { lat: -6.7924, lng: 39.2083, provider: "Airtel", city: "Dar es Salaam" },
    "64003": { lat: -6.7924, lng: 39.2083, provider: "Tigo", city: "Dar es Salaam" },
    "64004": { lat: -6.7900, lng: 39.2100, provider: "Halotel", city: "Dar es Salaam" },
    "64005": { lat: -6.7950, lng: 39.2050, provider: "TTCL", city: "Dar es Salaam" },
    "64010": { lat: -6.8165, lng: 39.2895, provider: "Vodacom", city: "Bagamoyo" },
    "64011": { lat: -6.8165, lng: 39.2895, provider: "Airtel", city: "Bagamoyo" },
    "64020": { lat: -3.3787, lng: 36.6829, provider: "Vodacom", city: "Arusha" },
    "64021": { lat: -3.3787, lng: 36.6829, provider: "Airtel", city: "Arusha" },
    "64022": { lat: -3.3787, lng: 36.6829, provider: "Tigo", city: "Arusha" },
    "64030": { lat: -8.4554, lng: 39.2654, provider: "Vodacom", city: "Mwanza" },
    "64031": { lat: -8.4554, lng: 39.2654, provider: "Airtel", city: "Mwanza" },
    "64032": { lat: -8.4554, lng: 39.2654, provider: "Tigo", city: "Mwanza" },
    "64040": { lat: -5.0666, lng: 32.9251, provider: "Vodacom", city: "Mtwara" },
    "64041": { lat: -5.0666, lng: 32.9251, provider: "Airtel", city: "Mtwara" },
    "64050": { lat: -10.4554, lng: 35.2654, provider: "Vodacom", city: "Mbeya" },
    "64051": { lat: -10.4554, lng: 35.2654, provider: "Airtel", city: "Mbeya" },
  },
  // Rwanda (MTN, Airtel)
  "RW": {
    "63501": { lat: -1.9441, lng: 30.0619, provider: "MTN", city: "Kigali" },
    "63502": { lat: -1.9441, lng: 30.0619, provider: "Airtel", city: "Kigali" },
    "63503": { lat: -1.9480, lng: 30.0650, provider: "MTN", city: "Kigali" },
    "63504": { lat: -1.9400, lng: 30.0580, provider: "Airtel", city: "Kigali" },
    "63510": { lat: -2.0789, lng: 30.1310, provider: "MTN", city: "Gitarama" },
    "63511": { lat: -2.0789, lng: 30.1310, provider: "Airtel", city: "Gitarama" },
    "63520": { lat: -1.6844, lng: 29.2578, provider: "MTN", city: "Ruhengeri" },
    "63521": { lat: -1.6844, lng: 29.2578, provider: "Airtel", city: "Ruhengeri" },
    "63530": { lat: -2.4833, lng: 29.7583, provider: "MTN", city: "Butare" },
    "63531": { lat: -2.4833, lng: 29.7583, provider: "Airtel", city: "Butare" },
  },
  // Burundi (Econet Leo, Lumitel, Smart)
  "BI": {
    "64201": { lat: -3.3836, lng: 29.3622, provider: "Econet Leo", city: "Bujumbura" },
    "64202": { lat: -3.3836, lng: 29.3622, provider: "Lumitel", city: "Bujumbura" },
    "64203": { lat: -3.3836, lng: 29.3622, provider: "Smart", city: "Bujumbura" },
    "64204": { lat: -3.3860, lng: 29.3650, provider: "Econet Leo", city: "Bujumbura" },
    "64205": { lat: -3.3810, lng: 29.3590, provider: "Lumitel", city: "Bujumbura" },
    "64210": { lat: -3.4000, lng: 29.3800, provider: "Econet Leo", city: "Gitega" },
    "64211": { lat: -3.4000, lng: 29.3800, provider: "Lumitel", city: "Gitega" },
  },
  // South Sudan (MTN, Zain, Vivacell)
  "SS": {
    "65901": { lat: 4.8470, lng: 31.6086, provider: "MTN", city: "Juba" },
    "65902": { lat: 4.8470, lng: 31.6086, provider: "Zain", city: "Juba" },
    "65903": { lat: 4.8470, lng: 31.6086, provider: "Vivacell", city: "Juba" },
    "65904": { lat: 4.8500, lng: 31.6100, provider: "MTN", city: "Juba" },
    "65905": { lat: 4.8440, lng: 31.6060, provider: "Zain", city: "Juba" },
    "65910": { lat: 4.5833, lng: 31.6000, provider: "MTN", city: "Malakal" },
    "65911": { lat: 4.5833, lng: 31.6000, provider: "Zain", city: "Malakal" },
  },
  // Ethiopia (Ethio Telecom, Safaricom)
  "ET": {
    "63601": { lat: 8.9636, lng: 38.7635, provider: "Ethio Telecom", city: "Addis Ababa" },
    "63602": { lat: 8.9636, lng: 38.7635, provider: "Safaricom", city: "Addis Ababa" },
    "63603": { lat: 8.9660, lng: 38.7660, provider: "Ethio Telecom", city: "Addis Ababa" },
    "63604": { lat: 8.9610, lng: 38.7610, provider: "Safaricom", city: "Addis Ababa" },
    "63610": { lat: 9.0333, lng: 38.7333, provider: "Ethio Telecom", city: "Bole" },
    "63611": { lat: 9.0333, lng: 38.7333, provider: "Safaricom", city: "Bole" },
    "63620": { lat: 11.5950, lng: 37.3883, provider: "Ethio Telecom", city: "Bahir Dar" },
    "63621": { lat: 11.5950, lng: 37.3883, provider: "Safaricom", city: "Bahir Dar" },
    "63630": { lat: 13.4967, lng: 39.2628, provider: "Ethio Telecom", city: "Mekelle" },
    "63631": { lat: 13.4967, lng: 39.2628, provider: "Safaricom", city: "Mekelle" },
  },
  // Somalia (Somtel, Hormuud, Golis)
  "SO": {
    "63701": { lat: 2.0469, lng: 45.3182, provider: "Somtel", city: "Mogadishu" },
    "63702": { lat: 2.0469, lng: 45.3182, provider: "Hormuud", city: "Mogadishu" },
    "63703": { lat: 2.0469, lng: 45.3182, provider: "Golis", city: "Mogadishu" },
    "63704": { lat: 2.0500, lng: 45.3200, provider: "Somtel", city: "Mogadishu" },
    "63705": { lat: 2.0440, lng: 45.3160, provider: "Hormuud", city: "Mogadishu" },
    "63710": { lat: 2.0150, lng: 45.3167, provider: "Somtel", city: "Hargeisa" },
    "63711": { lat: 2.0150, lng: 45.3167, provider: "Hormuud", city: "Hargeisa" },
  },
  // DRC (Vodacom, Airtel, Orange)
  "CD": {
    "63001": { lat: -4.4419, lng: 15.2663, provider: "Vodacom", city: "Kinshasa" },
    "63002": { lat: -4.4419, lng: 15.2663, provider: "Airtel", city: "Kinshasa" },
    "63003": { lat: -4.4419, lng: 15.2663, provider: "Orange", city: "Kinshasa" },
    "63004": { lat: -4.4450, lng: 15.2700, provider: "Vodacom", city: "Kinshasa" },
    "63005": { lat: -4.4380, lng: 15.2620, provider: "Airtel", city: "Kinshasa" },
    "63010": { lat: -1.6600, lng: 29.2200, provider: "Vodacom", city: "Goma" },
    "63011": { lat: -1.6600, lng: 29.2200, provider: "Airtel", city: "Goma" },
    "63020": { lat: -4.0383, lng: 29.9377, provider: "Vodacom", city: "Bukavu" },
    "63021": { lat: -4.0383, lng: 29.9377, provider: "Airtel", city: "Bukavu" },
  },
};

// ── Triangulation Algorithm ───────────────────────────────────────────────────────
export async function triangulateFromCellTowers(cellData) {
  const { mcc, mnc, cellTowerId, signalStrength, lac, cid } = cellData;

  // Get country code from MCC
  const countryCode = getCountryCodeFromMCC(mcc);
  if (!countryCode) {
    throw new Error("Unsupported MCC (Mobile Country Code)");
  }

  // Get cell towers in the area
  const towers = getNearbyTowers(countryCode, mnc, cellTowerId);
  if (towers.length === 0) {
    throw new Error("No cell towers found in database for this area");
  }

  // Calculate weighted position based on signal strength
  const position = calculateWeightedPosition(towers, signalStrength);

  // Estimate accuracy based on number of towers and signal strength
  const accuracy = estimateAccuracy(towers.length, signalStrength);

  return {
    latitude: position.lat,
    longitude: position.lng,
    accuracy,
    source: "cell_tower_triangulation",
    towersUsed: towers.length,
    towers: towers.map(t => ({
      id: t.id,
      provider: t.provider,
      city: t.city,
      lat: t.lat,
      lng: t.lng,
    })),
  };
}

function getCountryCodeFromMCC(mcc) {
  const mccMap = {
    "639": "KE", // Kenya
    "621": "NG", // Nigeria
    "655": "ZA", // South Africa
    "620": "GH", // Ghana
    "641": "UG", // Uganda
    "640": "TZ", // Tanzania
    "310": "US", // USA
    "208": "FR", // France
    "262": "DE", // Germany
    "234": "GB", // UK
  };
  return mccMap[mcc] || null;
}

function getNearbyTowers(countryCode, mnc, cellTowerId) {
  const countryTowers = CELL_TOWER_DATABASE[countryCode];
  if (!countryTowers) return [];

  // In production, this would query a spatial database
  // For now, return all towers in the country
  return Object.entries(countryTowers).map(([id, tower]) => ({
    id,
    ...tower,
  }));
}

function calculateWeightedPosition(towers, signalStrength) {
  if (towers.length === 0) return { lat: 0, lng: 0 };

  // Simple weighted average based on signal strength
  // In production, use more sophisticated algorithms like multilateration
  let totalLat = 0;
  let totalLng = 0;
  let totalWeight = 0;

  for (const tower of towers) {
    // Weight decreases with distance (simulated)
    const weight = signalStrength / 100;
    totalLat += tower.lat * weight;
    totalLng += tower.lng * weight;
    totalWeight += weight;
  }

  return {
    lat: totalLat / totalWeight,
    lng: totalLng / totalWeight,
  };
}

function estimateAccuracy(towerCount, signalStrength) {
  // More towers and stronger signal = better accuracy
  const baseAccuracy = 1000; // 1km baseline
  const towerFactor = Math.max(0.1, 1 - (towerCount * 0.1));
  const signalFactor = Math.max(0.1, 1 - (signalStrength / 100));

  return Math.round(baseAccuracy * towerFactor * signalFactor);
}

// ── Satellite-Assisted Location ──────────────────────────────────────────────────
export async function getSatelliteAssistedLocation(deviceId) {
  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  // Get recent satellite pings
  const recentPings = await SatellitePing.find({
    device: deviceId,
    source: { $in: ["satellite", "gps", "cell_tower"] },
  })
    .sort({ timestamp: -1 })
    .limit(10);

  if (recentPings.length === 0) {
    throw new Error("No location data available for this device");
  }

  // Get the most accurate location
  const bestPing = recentPings.reduce((best, current) => {
    const currentAccuracy = current.accuracy || 1000;
    const bestAccuracy = best.accuracy || 1000;
    return currentAccuracy < bestAccuracy ? current : best;
  });

  return {
    latitude: bestPing.latitude,
    longitude: bestPing.longitude,
    accuracy: bestPing.accuracy,
    altitude: bestPing.altitude,
    source: bestPing.source,
    satelliteProvider: bestPing.satelliteProvider,
    signalStrength: bestPing.signalStrength,
    timestamp: bestPing.timestamp,
  };
}

// ── Hybrid Location (GPS + Cell Tower + Satellite) ───────────────────────────────
export async function getHybridLocation(deviceId) {
  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  // Get all recent location data
  const recentPings = await SatellitePing.find({
    device: deviceId,
  })
    .sort({ timestamp: -1 })
    .limit(20);

  if (recentPings.length === 0) {
    throw new Error("No location data available for this device");
  }

  // Group by source
  const bySource = {
    gps: recentPings.filter(p => p.source === "gps"),
    satellite: recentPings.filter(p => p.source === "satellite"),
    cell_tower: recentPings.filter(p => p.source === "cell_tower"),
    wifi: recentPings.filter(p => p.source === "wifi"),
    ip_geolocation: recentPings.filter(p => p.source === "ip_geolocation"),
  };

  // Prioritize sources: GPS > Satellite > WiFi > Cell Tower > IP
  const sources = ["gps", "satellite", "wifi", "cell_tower", "ip_geolocation"];

  for (const source of sources) {
    if (bySource[source].length > 0) {
      const best = bySource[source].reduce((best, current) => {
        const currentAccuracy = current.accuracy || 1000;
        const bestAccuracy = best.accuracy || 1000;
        return currentAccuracy < bestAccuracy ? current : best;
      });

      return {
        latitude: best.latitude,
        longitude: best.longitude,
        accuracy: best.accuracy,
        altitude: best.altitude,
        source: best.source,
        timestamp: best.timestamp,
        method: "hybrid",
        availableSources: Object.keys(bySource).filter(s => bySource[s].length > 0),
      };
    }
  }

  throw new Error("No valid location data available");
}

// ── Record Satellite Ping ───────────────────────────────────────────────────────
export async function recordSatellitePing(data) {
  const {
    deviceId,
    imei,
    latitude,
    longitude,
    accuracy,
    altitude,
    source,
    satelliteProvider,
    satelliteId,
    signalStrength,
    cellTowerId,
    cellTowerLat,
    cellTowerLng,
    mcc,
    mnc,
    batteryLevel,
    isCharging,
    networkType,
  } = data;

  const ping = await SatellitePing.create({
    device: deviceId,
    imei,
    latitude,
    longitude,
    accuracy,
    altitude,
    source: source || "gps",
    satelliteProvider,
    satelliteId,
    signalStrength,
    cellTowerId,
    cellTowerLat,
    cellTowerLng,
    mcc,
    mnc,
    batteryLevel,
    isCharging,
    networkType,
    timestamp: new Date(),
  });

  return ping;
}

// ── Location History ─────────────────────────────────────────────────────────────
export async function getLocationHistory(deviceId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const pings = await SatellitePing.find({
    device: deviceId,
    timestamp: { $gte: since },
  })
    .sort({ timestamp: -1 });

  return pings;
}

// ── Cell Tower Statistics ───────────────────────────────────────────────────────
export async function getCellTowerStatistics() {
  const totalTowers = Object.values(CELL_TOWER_DATABASE).reduce(
    (sum, country) => sum + Object.keys(country).length,
    0
  );

  const countries = Object.keys(CELL_TOWER_DATABASE).map(code => ({
    code,
    name: getCountryName(code),
    towerCount: Object.keys(CELL_TOWER_DATABASE[code]).length,
  }));

  return {
    totalTowers,
    countries,
    supportedCountries: Object.keys(CELL_TOWER_DATABASE),
  };
}

function getCountryName(code) {
  const names = {
    KE: "Kenya",
    NG: "Nigeria",
    ZA: "South Africa",
    GH: "Ghana",
    UG: "Uganda",
    TZ: "Tanzania",
    US: "United States",
    FR: "France",
    DE: "Germany",
    GB: "United Kingdom",
  };
  return names[code] || code;
}
