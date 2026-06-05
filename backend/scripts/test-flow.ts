// scripts/test-flow.ts — OFFLINE replay of the core track-and-trace flow.
// No DB/socket here, so it imports the REAL ML predictors (ml/pipeline.ts) and
// reproduces the engine's EXACT thresholds/maths/narratives
// (see services/intelligence.ts line refs) over an in-memory store.
// Run: npx tsx scripts/test-flow.ts
import { predictFraud, predictTheft } from "../ml/pipeline.js";

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1); const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function alertMessage(type: string, payload: any): string {
  switch (type) {
    case "blacklist_ping": return `Blacklisted device pinged at [${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}]`;
    case "sim_swap":       return `SIM swap detected: ${payload.oldSim} -> ${payload.newSim}`;
    case "location_jump":  return `Impossible speed: ${payload.kmh} km/h detected`;
    case "fraud_pattern":  return `Carrier-hop fraud: ${payload.operators.join(", ")}`;
    default:               return "Security alert";
  }
}
interface Ping { imei: string; lat: number; lng: number; simIccid?: string; networkOp?: string; ts: Date; }
interface Device { imei: string; make: string; model: string; status: string; owner: string | null; createdAt: Date; }
interface Alert { imei: string; type: string; payload: any; narrative?: string; ts: Date; }
const PINGS: Ping[] = []; const ALERTS: Alert[] = []; const DEVICES: Record<string, Device> = {};
const EMITTED: { room: string; imei: string; type: string }[] = [];
const NOTIFIED: { imei: string; type: string; message: string }[] = [];

function computeRiskScore(imei: string): { score: number; parts: string[] } {
  const device = DEVICES[imei]; const parts: string[] = [];
  if (!device) return { score: 0, parts };
  let score = 0;
  if (device.status === "stolen")      { score += 80;  parts.push("stolen +80"); }
  if (device.status === "blacklisted") { score += 100; parts.push("blacklisted +100"); }
  const since = Date.now() - 24 * 3600000;
  const recent = PINGS.filter(p => p.imei === imei && +p.ts >= since).sort((a, b) => +b.ts - +a.ts);
  if (recent.length === 0) return { score: Math.min(score, 100), parts };
  const simSet = new Set(recent.map(p => p.simIccid).filter(Boolean));
  const simChanges = simSet.size > 1 ? simSet.size - 1 : 0;
  if (simSet.size > 1) { score += simSet.size * 15; parts.push(`SIM set ${simSet.size} +${simSet.size * 15}`); }
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1], b = recent[i];
    const km = haversineKm(a.lat, a.lng, b.lat, b.lng); const hrs = (+a.ts - +b.ts) / 3600000;
    if (hrs > 0 && km / hrs > 500) { score += 25; parts.push("impossible jump +25"); break; }
  }
  const opSet = new Set(recent.map(p => p.networkOp).filter(Boolean));
  if (opSet.size > 2) { score += 10; parts.push(`${opSet.size} carriers +10`); }
  const deviceAge = Math.floor((Date.now() - +device.createdAt) / 86400000);
  const fp = predictFraud({ riskScore: score, simChanges, deviceAge, locationChanges: recent.length });
  const tp = predictTheft({ riskScore: score, movementCount: recent.length, simChanges });
  const mlFraud = fp.prediction * 100 * fp.confidence; const mlTheft = tp.prediction * 100 * tp.confidence;
  const traditional = score;
  score = score * 0.7 + ((mlFraud + mlTheft) / 2) * 0.3;
  parts.push(`ML blend (trad ${traditional.toFixed(0)}->${score.toFixed(0)})`);
  return { score: Math.min(score, 100), parts };
}
const COOLDOWN_MS: Record<string, number> = { blacklist_ping: 1800000, sim_swap: 3600000, location_jump: 900000, fraud_pattern: 3600000 };
function runIntelligence(ping: Ping, device: Device): Alert[] {
  const found: { type: string; payload: any }[] = [];
  if (device.status === "stolen" || device.status === "blacklisted")
    found.push({ type: "blacklist_ping", payload: { lat: ping.lat, lng: ping.lng, ts: ping.ts } });
  if (ping.simIccid) {
    const prev = PINGS.filter(p => p.imei === ping.imei && p.simIccid && p.simIccid !== ping.simIccid && +p.ts < +ping.ts).sort((a, b) => +b.ts - +a.ts)[0];
    if (prev) found.push({ type: "sim_swap", payload: { oldSim: prev.simIccid, newSim: ping.simIccid } });
  }
  const prevPing = PINGS.filter(p => p.imei === ping.imei && +p.ts < +ping.ts).sort((a, b) => +b.ts - +a.ts)[0];
  if (prevPing) {
    const km = haversineKm(prevPing.lat, prevPing.lng, ping.lat, ping.lng); const hrs = (+ping.ts - +prevPing.ts) / 3600000;
    if (hrs > 0 && km / hrs > 500) found.push({ type: "location_jump", payload: { kmh: Math.round(km / hrs), from: [prevPing.lat, prevPing.lng], to: [ping.lat, ping.lng] } });
  }
  const oneHourAgo = +ping.ts - 3600000;
  const recentOps = new Set(PINGS.filter(p => p.imei === ping.imei && +p.ts >= oneHourAgo && +p.ts <= +ping.ts && p.networkOp).map(p => p.networkOp));
  if (recentOps.size >= 3) found.push({ type: "fraud_pattern", payload: { operators: [...recentOps] } });
  const out: Alert[] = [];
  for (const a of found) {
    const cooldown = COOLDOWN_MS[a.type] || 1800000;
    if (ALERTS.find(x => x.imei === ping.imei && x.type === a.type && +x.ts >= +ping.ts - cooldown)) continue;
    const alert: Alert = { imei: ping.imei, type: a.type, payload: a.payload, narrative: alertMessage(a.type, a.payload), ts: ping.ts };
    ALERTS.push(alert); out.push(alert);
    EMITTED.push({ room: `device:${ping.imei}`, imei: ping.imei, type: a.type });
    EMITTED.push({ room: "role:admin", imei: ping.imei, type: a.type });
    NOTIFIED.push({ imei: ping.imei, type: a.type, message: alert.narrative! });
  }
  return out;
}
const NOW = Date.now(); const mins = (m: number) => new Date(NOW - m * 60000);
const line = (c = "-") => console.log(c.repeat(64));
console.log("\n SIMTRACE - CORE TRACK & TRACE FLOW (offline replay)\n"); line("=");
DEVICES["111222333444555"] = { imei: "111222333444555", make: "Apple", model: "iPhone 14", status: "stolen", owner: "jane", createdAt: new Date(NOW - 120 * 86400000) };
DEVICES["999888777666555"] = { imei: "999888777666555", make: "Samsung", model: "Galaxy A54", status: "blacklisted", owner: "jane", createdAt: new Date(NOW - 90 * 86400000) };
DEVICES["444333222111000"] = { imei: "444333222111000", make: "Tecno", model: "Pop 8", status: "stolen", owner: null, createdAt: new Date(NOW - 60 * 86400000) };
DEVICES["356938035643809"] = { imei: "356938035643809", make: "Samsung", model: "Galaxy S24", status: "active", owner: "jane", createdAt: new Date(NOW - 200 * 86400000) };
const WG = { lat: -1.2566, lng: 36.8030 };
for (let i = 0; i < 12; i++) PINGS.push({ imei: "111222333444555", lat: WG.lat + i * 0.0006, lng: WG.lng + i * 0.0004, simIccid: i < 8 ? "8954030000012345" : "8954030000099999", networkOp: "Safaricom", ts: mins(180 - i * 12) });
const carriers = ["Safaricom", "Airtel", "Telkom", "Safaricom", "Airtel", "Telkom"];
for (let i = 0; i < 6; i++) PINGS.push({ imei: "999888777666555", lat: -1.2921 + i * 0.001, lng: 36.8219 + i * 0.001, simIccid: "8954030000067890", networkOp: carriers[i], ts: mins(55 - i * 9) });
PINGS.push({ imei: "444333222111000", lat: -1.30, lng: 36.82, simIccid: "8954030000045678", networkOp: "Airtel", ts: mins(40) });
PINGS.push({ imei: "444333222111000", lat: -1.17, lng: 36.75, simIccid: "8954030000045678", networkOp: "Airtel", ts: mins(40 - 1.1) });
for (let i = 0; i < 5; i++) PINGS.push({ imei: "356938035643809", lat: -1.265 + i * 0.0005, lng: 36.81 + i * 0.0005, simIccid: "8954030000011111", networkOp: "Safaricom", ts: mins(90 - i * 15) });

console.log("\n>> STAGE 1 - Live tracking: replaying device pings through the engine\n");
const chrono = [...PINGS].sort((a, b) => +a.ts - +b.ts);
PINGS.length = 0; let firedTotal = 0;
for (const p of chrono) {
  PINGS.push(p);
  for (const a of runIntelligence(p, DEVICES[p.imei])) { firedTotal++; console.log(`   ${DEVICES[p.imei].model.padEnd(11)} ${p.imei}  ->  ${a.type.toUpperCase().padEnd(15)} ${a.narrative}`); }
}
console.log(`\n   ${PINGS.length} pings ingested - ${firedTotal} alerts raised (after dedup)`);
console.log("\n>> STAGE 2 - Risk scoring (rules blended 70/30 with the real ML pipeline)\n");
for (const imei of Object.keys(DEVICES)) {
  const { score, parts } = computeRiskScore(imei);
  const band = score >= 80 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  console.log(`   ${DEVICES[imei].model.padEnd(11)} ${imei}  risk ${score.toFixed(0).padStart(3)}/100  ${band.padEnd(8)} [${parts.join(", ")}]`);
}
console.log("\n>> STAGE 3 - Map alert layer (markers the dashboard would render)\n");
const markers: { imei: string; type: string; lat: number; lng: number }[] = [];
for (const a of ALERTS) {
  if (a.type === "blacklist_ping") markers.push({ imei: a.imei, type: a.type, lat: a.payload.lat, lng: a.payload.lng });
  if (a.type === "location_jump") markers.push({ imei: a.imei, type: a.type, lat: a.payload.to[0], lng: a.payload.to[1] });
}
for (const m of markers) console.log(`   [pin] [${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}]  ${m.type.padEnd(15)} ${DEVICES[m.imei].model} (${m.imei})`);
console.log(`\n   ${markers.length} geolocated alert markers`);
console.log("\n>> STAGE 4 - Police flow: theft report -> law-enforcement case -> recovery\n");
const report = { imei: "111222333444555", reportedBy: "jane@demo.simtrace.site", description: "iPhone 14 snatched at Westgate Mall", policeRef: "OB/4721/2024", status: "open" };
console.log(`   [report] ${report.policeRef}  ${report.imei}  status=${report.status}  by ${report.reportedBy}`);
const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const linked = ALERTS.filter(a => a.imei === "111222333444555").map(a => a.type);
const leCase = { caseNumber, imei: "111222333444555", priority: "high", status: "open", linkedAlerts: [...new Set(linked)], assignedTo: "dci@demo.simtrace.site" };
console.log(`   [case]   ${leCase.caseNumber}  priority=${leCase.priority}  evidence=[${leCase.linkedAlerts.join(", ")}]`);
function tx(to: string) { console.log(`   [case]   ${leCase.caseNumber}  ${leCase.status} -> ${to}`); leCase.status = to; }
report.status = "investigating"; console.log(`   [report] ${report.policeRef}  status -> investigating`);
tx("investigating"); tx("evidence_collection");
console.log("\n   ...new ping received on the wanted device - pushed to the case officer in real time...");
tx("prosecution"); DEVICES["111222333444555"].status = "recovered"; report.status = "recovered"; tx("closed");
console.log(`   [report] ${report.policeRef}  status -> recovered   [device] 111222333444555 -> recovered`);
console.log("\n>> STAGE 5 - Real-time synchronization (what the live runtime pushes)\n");
const byType = EMITTED.filter(e => e.room === "role:admin").reduce((m: Record<string, number>, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {});
console.log(`   socket emits: ${EMITTED.length} (device:<imei> rooms + role:admin dashboard)`);
console.log(`     by type -> ${Object.entries(byType).map(([t, n]) => `${t}:${n}`).join("  ")}`);
console.log(`   push notifications queued (sendAlert): ${NOTIFIED.length}`);
console.log(`   dashboard counters -> open alerts: ${ALERTS.length} | active cases: 0 (1 closed) | recovered: 1`);
line("="); console.log(" FLOW COMPLETE - detected, scored, mapped, reported, escalated, recovered.\n");
