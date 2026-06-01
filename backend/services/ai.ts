// services/ai.ts — SimTrace AI Intelligence Layer
// Powered by Claude. Used for: threat narration, alert triage, IMEI risk reports, anomaly explanation.

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

async function callClaude({ system, messages, maxTokens = 1024, json = false }: {
  system: string;
  messages: any[];
  maxTokens?: number;
  json?: boolean;
}): Promise<string | any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  };

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data: any = await res.json();
  const text = data.content.map((b: any) => b.text || "").join("");

  if (json) {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
  return text;
}

// ── 1. IMEI Risk Report ───────────────────────────────────────────────────────
// Given device data + ping history, produce a human-readable risk narrative.
export async function generateImeiReport({ imei, device, riskScore, recentPings, alerts, reports }: {
  imei: string;
  device?: any;
  riskScore: number;
  recentPings?: any[];
  alerts?: any[];
  reports?: any[];
}) {
  const pingCount = recentPings?.length ?? 0;
  const simSwaps = alerts?.filter((a: any) => a.type === "sim_swap").length ?? 0;
  const jumpAlerts = alerts?.filter((a: any) => a.type === "location_jump").length ?? 0;
  const fraudAlerts = alerts?.filter((a: any) => a.type === "fraud_pattern").length ?? 0;
  const isStolen = reports?.some((r: any) => ["open", "investigating"].includes(r.status)) ?? false;

  const deviceSummary = device
    ? `${device.make || "Unknown"} ${device.model || "device"}, status: ${device.status}, last seen: ${device.lastSeen ? new Date(device.lastSeen).toISOString() : "never"}`
    : "Not registered in SimTrace";

  const pingSummary = recentPings?.slice(0, 3).map((p: any) =>
    `  • ${new Date(p.ts).toLocaleString()}: [${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}] via ${p.networkOp || "unknown carrier"} SIM:${p.simIccid || "?"}`
  ).join("\n") || "  No recent pings";

  return callClaude({
    system: `You are SimTrace's AI security analyst. You write clear, factual, concise device security reports for non-technical users and law enforcement. 
Tone: professional, direct, no jargon. Max 200 words. Structure: 2-3 short paragraphs.
Do not speculate beyond the data. Flag genuine risks. Reassure when the device is clean.`,
    messages: [{
      role: "user",
      content: `Generate a security report for IMEI ${imei}.

Device: ${deviceSummary}
Risk score: ${riskScore}/100
Active theft report: ${isStolen ? "YES" : "No"}
Pings in last 24h: ${pingCount}
SIM swap alerts: ${simSwaps}
Impossible location jumps: ${jumpAlerts}
Fraud pattern alerts: ${fraudAlerts}

Recent location pings:
${pingSummary}

Write a security summary a device owner or police officer would find useful.`,
    }],
    maxTokens: 350,
  });
}

// ── 2. Alert Triage ───────────────────────────────────────────────────────────
// Classify urgency and recommend action for a batch of unread alerts.
export async function triageAlerts(alerts: any[]) {
  if (!alerts?.length) return [];

  const summary = alerts.map((a: any) => ({
    id: a._id,
    type: a.type,
    imei: a.imei,
    ts: a.ts,
    payload: a.payload,
  }));

  return callClaude({
    system: `You are SimTrace's AI triage system. Analyse security alerts and return a JSON array — one object per alert — with:
{ "id": string, "urgency": "critical"|"high"|"medium"|"low", "action": string (max 12 words), "reason": string (max 20 words) }
Return ONLY the JSON array. No preamble, no markdown fences.`,
    messages: [{
      role: "user",
      content: `Triage these ${alerts.length} alerts:\n${JSON.stringify(summary, null, 2)}`,
    }],
    maxTokens: 1500,
    json: true,
  });
}

// ── 3. Anomaly Explanation ────────────────────────────────────────────────────
// Plain-English explanation of a single alert for a device owner.
export async function explainAlert(alert: any) {
  const typeLabels: Record<string, string> = {
    blacklist_ping: "Blacklisted device detected",
    sim_swap: "SIM card swap",
    location_jump: "Impossible location movement",
    fraud_pattern: "Carrier-hop fraud pattern",
    theft_report: "Theft report filed",
  };

  return callClaude({
    system: `You are SimTrace's user-facing AI. Explain security events to device owners in plain language.
Be empathetic, clear, and tell them exactly what to do next. Max 100 words. No technical jargon.`,
    messages: [{
      role: "user",
      content: `Explain this security event for IMEI ${alert.imei}:
Type: ${typeLabels[alert.type] || alert.type}
Details: ${JSON.stringify(alert.payload)}
Time: ${new Date(alert.ts).toLocaleString()}

What happened and what should the owner do?`,
    }],
    maxTokens: 200,
  });
}

// ── 4. AI Security Chat ───────────────────────────────────────────────────────
// Multi-turn assistant for the AI Assistant page. Knows about SimTrace context.
export async function securityChat({ messages, userContext }: {
  messages: any[];
  userContext?: { role: string; deviceCount: number; alertCount: number };
}) {
  const contextStr = userContext
    ? `User role: ${userContext.role}. Devices owned: ${userContext.deviceCount}. Open alerts: ${userContext.alertCount}.`
    : "Unauthenticated user.";

  return callClaude({
    system: `You are SimTrace's AI security assistant. You help users:
- Understand their device security status
- Interpret IMEI check results and risk scores  
- Know what to do if their device is stolen
- Understand SIM swap attacks and how to stay safe
- Navigate SimTrace features

Context: ${contextStr}
SimTrace platform: real-time device tracking, IMEI blacklist checks, SIM swap detection, fraud pattern detection.
Be helpful, concise, and action-oriented. If asked about a specific IMEI, remind the user to use the IMEI Checker page.
Never fabricate device data — only discuss what the user tells you.`,
    messages,
    maxTokens: 600,
  });
}

// ── 5. Fraud Pattern Narrative ────────────────────────────────────────────────
// Used internally after runIntelligence — generate a rich alert description.
export async function narrateFraudPattern({ imei, type, payload, pingHistory }: {
  imei: string;
  type: string;
  payload: any;
  pingHistory?: any[];
}) {
  return callClaude({
    system: `You are writing internal security event descriptions for SimTrace analysts. 
Be factual, precise, 1-2 sentences. Include specific numbers from the data.`,
    messages: [{
      role: "user",
      content: `Describe this security event:
IMEI: ${imei}
Event type: ${type}
Data: ${JSON.stringify(payload)}
Recent pings: ${JSON.stringify(pingHistory?.slice(0, 5))}`,
    }],
    maxTokens: 150,
  });
}
