import { Ping, Device, Alert } from "../db/index.js";
import { getIO } from "./socket.js";
import { sendAlert } from "./notify.js";
import { narrateFraudPattern } from "./ai.js";
import { predictFraud, predictTheft } from "../ml/pipeline.js";

// ── Risk scoring ──────────────────────────────────────────────────────────────
export async function computeRiskScore(imei: string): Promise<number> {
  const device = await Device.findOne({ imei });
  if (!device) return 0;

  let score = 0;

  if (device.status === "stolen")      score += 80;
  if (device.status === "blacklisted") score += 100;

  // Recent pings in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentPings = await Ping.find({ imei, ts: { $gte: since } }).sort({ ts: -1 });

  if (recentPings.length === 0) return Math.min(score, 100);

  // SIM swaps in last 24h
  const simSet = new Set(recentPings.map((p: any) => p.simIccid).filter(Boolean));
  const simChanges = simSet.size > 1 ? simSet.size - 1 : 0;
  if (simSet.size > 1) score += simSet.size * 15;

  // Impossible location jumps (>500 km/h between pings)
  for (let i = 1; i < recentPings.length; i++) {
    const a = recentPings[i - 1];
    const b = recentPings[i];
    const km  = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const hrs = (a.ts - b.ts) / 3600000;
    if (hrs > 0 && km / hrs > 500) { score += 25; break; }
  }

  // Carrier-hop anomaly
  const opSet = new Set(recentPings.map((p: any) => p.networkOp).filter(Boolean));
  if (opSet.size > 2) score += 10;

  // Integrate ML predictions for enhanced risk scoring
  try {
    const deviceAge = device.createdAt ? Math.floor((Date.now() - new Date(device.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // ML: fraud prediction
    const fraudPrediction = predictFraud({
      riskScore: score,
      simChanges,
      deviceAge,
      locationChanges: recentPings.length
    });

    // ML: theft prediction
    const theftPrediction = predictTheft({
      riskScore: score,
      movementCount: recentPings.length,
      simChanges
    });

    // Adjust score based on ML predictions (weighted influence)
    // ML predictions are 0-1, convert to 0-100 scale
    const mlFraudScore = fraudPrediction.prediction * 100 * fraudPrediction.confidence;
    const mlTheftScore = theftPrediction.prediction * 100 * theftPrediction.confidence;
    
    // Blend traditional score with ML predictions (70% traditional, 30% ML)
    score = (score * 0.7) + ((mlFraudScore + mlTheftScore) / 2 * 0.3);
  } catch (mlError) {
    // Don't fail if ML prediction fails - fall back to traditional scoring
    console.error('ML prediction error in risk scoring:', mlError);
  }

  return Math.min(score, 100);
}

// ── Main intelligence runner — called after every ping ────────────────────────
export async function runIntelligence({ ping, device }: { ping: any; device: any }): Promise<void> {
  if (!device) return;

  const alerts: any[] = [];

  // 1. Blacklist hit
  if (device.status === "stolen" || device.status === "blacklisted") {
    alerts.push({ type: "blacklist_ping", payload: { lat: ping.lat, lng: ping.lng, ts: ping.ts } });
  }

  // 2. SIM swap detection
  if (ping.simIccid) {
    const prev = await Ping.findOne({
      imei:    ping.imei,
      simIccid: { $exists: true, $ne: ping.simIccid },
      ts:      { $lt: ping.ts },
    }).sort({ ts: -1 });

    if (prev) {
      alerts.push({
        type: "sim_swap",
        payload: { oldSim: prev.simIccid, newSim: ping.simIccid, ts: ping.ts },
      });
    }
  }

  // 3. Impossible location jump
  const prevPing = await Ping.findOne({
    imei: ping.imei,
    ts:   { $lt: ping.ts },
  }).sort({ ts: -1 });

  if (prevPing) {
    const km  = haversineKm(prevPing.lat, prevPing.lng, ping.lat, ping.lng);
    const hrs = (ping.ts - prevPing.ts) / 3600000;
    if (hrs > 0 && km / hrs > 500) {
      alerts.push({
        type: "location_jump",
        payload: { kmh: Math.round(km / hrs), from: [prevPing.lat, prevPing.lng], to: [ping.lat, ping.lng] },
      });
    }
  }

  // 4. Fraud pattern — rapid multi-carrier hops in 1h
  const oneHourAgo = new Date(Date.now() - 3600000);
  const recentOps  = await Ping.distinct("networkOp", {
    imei: ping.imei,
    ts:   { $gte: oneHourAgo },
    networkOp: { $exists: true },
  });
  if (recentOps.length >= 3) {
    alerts.push({ type: "fraud_pattern", payload: { operators: recentOps } });
  }

  // 5. IMEI cloning — same IMEI pinging from very different fingerprints simultaneously
  // Detect if networkMac or bluetoothMac changes while device was static
  if (ping.imei && prevPing) {
    const prevDevice = await Device.findOne({ imei: ping.imei }).select("fingerprint").lean();
    const newFp  = ping.fingerprint || {};
    const prevFp = (prevDevice as any)?.fingerprint || {};

    // If bluetoothMac or networkMac changes — strong cloning signal
    const macChanged =
      (newFp.bluetoothMac && prevFp.bluetoothMac && newFp.bluetoothMac !== prevFp.bluetoothMac) ||
      (newFp.networkMac   && prevFp.networkMac   && newFp.networkMac   !== prevFp.networkMac);

    if (macChanged) {
      alerts.push({
        type:    "fraud_pattern",
        payload: {
          reason:       "IMEI cloning detected",
          fingerprint:  { prev: prevFp, current: newFp },
          operators:    [prevPing.networkOp, ping.networkOp].filter(Boolean),
        },
      });
    }
  }

  // Persist + emit all alerts
  const pingHistory = await Ping.find({ imei: ping.imei }).sort({ ts: -1 }).limit(5).lean();

  // Deduplication: skip alert if same type fired for this IMEI in last 30 min
  // Prevents alert spam when a stolen device pings every 30s
  const COOLDOWN_MS: Record<string, number> = {
    blacklist_ping:  30 * 60 * 1000,  // 30 min — one alert per half hour
    sim_swap:        60 * 60 * 1000,  // 1 hour — SIM swap only once per hour
    location_jump:   15 * 60 * 1000,  // 15 min
    fraud_pattern:   60 * 60 * 1000,  // 1 hour
    theft_report:    24 * 60 * 60 * 1000, // once per day
  };

  const deduped: any[] = [];
  for (const a of alerts) {
    const cooldown  = COOLDOWN_MS[a.type] || 30 * 60 * 1000;
    const since     = new Date(Date.now() - cooldown);
    const duplicate = await Alert.findOne({ imei: ping.imei, type: a.type, ts: { $gte: since } }).lean();
    if (!duplicate) deduped.push(a);
  }
  const filtered = deduped; // use filtered going forward

  for (const a of filtered) {
    // AI narrative (best-effort — don't block on failure)
    let aiNarrative;
    try {
      aiNarrative = await narrateFraudPattern({ imei: ping.imei, type: a.type, payload: a.payload, pingHistory });
    } catch { /* AI unavailable — continue without narrative */ }

    const saved = await Alert.create({ imei: ping.imei, ...a, ...(aiNarrative && { narrative: aiNarrative }) });

    // Push to subscribed dashboard clients
    getIO().to(`device:${ping.imei}`).emit("alert", saved);
    getIO().to("role:admin").emit("alert", saved);

    // Push notification
    await sendAlert({
      type:    a.type,
      imei:    ping.imei,
      message: aiNarrative || alertMessage(a),
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const toRad = (d: number) => (d * Math.PI) / 180;

function alertMessage({ type, payload }: { type: string; payload: any }): string {
  switch (type) {
    case "blacklist_ping":   return `Blacklisted device pinged at [${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}]`;
    case "sim_swap":         return `SIM swap detected: ${payload.oldSim} → ${payload.newSim}`;
    case "location_jump":    return `Impossible speed: ${payload.kmh} km/h detected`;
    case "fraud_pattern":    return `Carrier-hop fraud: ${payload.operators.join(", ")}`;
    default:                 return "Security alert";
  }
}
