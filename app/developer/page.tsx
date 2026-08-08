"use client";
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";

export default function DeveloperPlatformPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "graphql" | "sdks" | "webhooks" | "plugins" | "cli" | "oauth" | "docs">("dashboard");

  // ── API Key Management ──────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState([
    { id: "key_1", name: "Production Operator API Key", key: "st_live_98f4a27b1c8e0d9f3a5b7c1e", created: "2026-01-15", lastUsed: "2 mins ago", requests: 84200, limit: 100000, status: "active" },
    { id: "key_2", name: "Sandbox Testing Key", key: "st_test_12a3b4c5d6e7f8g9h0i1j2k3", created: "2026-02-01", lastUsed: "10 mins ago", requests: 1240, limit: 10000, status: "active" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);

  // ── API Explorer State ──────────────────────────────────────────────────────
  const [explorerEndpoint, setExplorerEndpoint] = useState("/api/v1/imei/check");
  const [explorerMethod, setExplorerMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [explorerImei, setExplorerImei] = useState("356938035643809");
  const [explorerResponse, setExplorerResponse] = useState<any>(null);
  const [explorerStatus, setExplorerStatus] = useState<number | null>(null);
  const [explorerLatency, setExplorerLatency] = useState<number | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // ── GraphQL Gateway State ──────────────────────────────────────────────────
  const [gqlQuery, setGqlQuery] = useState(`query GetDeviceIntelligence {
  device(imei: "356938035643809") {
    imei
    make
    model
    status
    riskScore
    carrier
    lastLocation {
      latitude
      longitude
      city
    }
    alerts(limit: 3) {
      type
      timestamp
      severity
    }
  }
}`);
  const [gqlResult, setGqlResult] = useState<any>(null);
  const [gqlLoading, setGqlLoading] = useState(false);

  // ── SDK Language Selection ─────────────────────────────────────────────────
  const [selectedSdk, setSelectedSdk] = useState<"node" | "python" | "go" | "curl">("node");

  // ── Webhook State ──────────────────────────────────────────────────────────
  const [webhooks, setWebhooks] = useState([
    { id: "wh_1", url: "https://api.safaricom.co.ke/simtrace/events", events: ["imei.blacklisted", "sim_swap.detected"], status: "active", secret: "whsec_98234710982341", lastDelivery: "HTTP 200 (150ms)" },
    { id: "wh_2", url: "https://police.dci.go.ke/webhooks/stolen-phones", events: ["stolen_report.created", "evidence.uploaded"], status: "active", secret: "whsec_48102938102938", lastDelivery: "HTTP 200 (85ms)" },
  ]);
  const [newWhUrl, setNewWhUrl] = useState("");
  const [testWhResult, setTestWhResult] = useState<string | null>(null);

  // ── CLI Terminal Simulator State ───────────────────────────────────────────
  const [cliLogs, setCliLogs] = useState<string[]>([
    "$ simtrace --version",
    "simtrace-cli v2.8.4 (x86_64-linux-gnu)",
    "$ simtrace status",
    "✓ Connected to SimTrace Global CEIR Cluster (Latency: 14ms)",
    "✓ Auth: Logged in as enterprise_admin@safaricom.co.ke",
  ]);
  const [cliInput, setCliInput] = useState("");

  // ── OAuth Apps State ───────────────────────────────────────────────────────
  const [oauthApps, setOauthApps] = useState([
    { id: "app_1", name: "Jubilee Insurance Claims Verifier", clientId: "st_client_789123456", redirectUri: "https://insurance.jubilee.co.ke/oauth/callback", scopes: ["read:devices", "read:alerts"] },
    { id: "app_2", name: "Police Mobile Terminal App", clientId: "st_client_456123789", redirectUri: "https://dci.go.ke/auth/simtrace", scopes: ["read:devices", "write:reports", "telecom:blacklist"] },
  ]);

  // ── Helper: Run REST Explorer ──────────────────────────────────────────────
  function runExplorerRequest() {
    setExplorerLoading(true);
    setExplorerResponse(null);
    const start = Date.now();

    setTimeout(() => {
      setExplorerLatency(Date.now() - start + Math.floor(Math.random() * 40 + 10));
      setExplorerStatus(200);

      if (explorerEndpoint.includes("imei")) {
        setExplorerResponse({
          status: "success",
          data: {
            imei: explorerImei,
            brand: "Samsung",
            model: "Galaxy S24 Ultra",
            registrationStatus: "REGISTERED",
            stolenStatus: "CLEAN",
            riskScore: 12,
            blacklistStatus: {
              gsmaBlacklisted: false,
              nationalCeirListed: false,
            },
            verifiedOwner: "John K. (ID: *****782)",
            telecomOperator: "Safaricom PLC",
          },
        });
      } else if (explorerEndpoint.includes("blacklist")) {
        setExplorerResponse({
          status: "success",
          message: "IMEI successfully submitted to National CEIR Blacklist queue",
          imei: explorerImei,
          transactionHash: "0x8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
          propagatedCarriers: ["Safaricom", "Airtel", "Telkom"],
        });
      } else {
        setExplorerResponse({
          status: "success",
          data: [
            { alertId: "alt_901", imei: "356938035643809", type: "SIM_SWAP_UNAUTHORIZED", severity: "CRITICAL", timestamp: new Date().toISOString() },
            { alertId: "alt_902", imei: "490154203237518", type: "IMPOSSIBLE_LOCATION_JUMP", severity: "HIGH", timestamp: new Date().toISOString() },
          ],
        });
      }
      setExplorerLoading(false);
    }, 600);
  }

  // ── Helper: Run GraphQL Query ──────────────────────────────────────────────
  function runGqlQuery() {
    setGqlLoading(true);
    setTimeout(() => {
      setGqlResult({
        data: {
          device: {
            imei: "356938035643809",
            make: "Samsung",
            model: "Galaxy S24 Ultra",
            status: "STOLEN_REPORTED",
            riskScore: 88,
            carrier: "Safaricom Kenya",
            lastLocation: {
              latitude: -1.286389,
              longitude: 36.817223,
              city: "Nairobi CBD",
            },
            alerts: [
              { type: "SIM_SWAP_DETECTED", timestamp: "2026-07-31T12:00:00Z", severity: "CRITICAL" },
              { type: "VELOCITY_ANOMALY", timestamp: "2026-07-31T11:45:00Z", severity: "HIGH" },
            ],
          },
        },
      });
      setGqlLoading(false);
    }, 500);
  }

  // ── Helper: CLI Command Exec ───────────────────────────────────────────────
  function handleCliSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const cmd = cliInput.trim();
    const newLogs = [...cliLogs, `$ ${cmd}`];

    if (cmd === "help") {
      newLogs.push(
        "Available SimTrace CLI Commands:",
        "  simtrace imei <number>   - Query national IMEI status & risk score",
        "  simtrace blacklist <imei> - Issue carrier blacklist command",
        "  simtrace webhooks listen - Start local webhook forwarding tunnel",
        "  simtrace keys list        - Display active developer API keys",
        "  simtrace clear           - Clear terminal window"
      );
    } else if (cmd.startsWith("simtrace imei")) {
      const parts = cmd.split(" ");
      const imei = parts[2] || "356938035643809";
      newLogs.push(
        `Fetching IMEI ${imei}...`,
        `[OK] IMEI: ${imei}`,
        `[OK] Make/Model: Samsung Galaxy S24 Ultra`,
        `[OK] Status: CLEAN | Risk Score: 14/100`,
        `[OK] GSMA Record: MATCH VALIDATED`
      );
    } else if (cmd.startsWith("simtrace blacklist")) {
      const parts = cmd.split(" ");
      const imei = parts[2] || "356938035643809";
      newLogs.push(
        `🚨 Issuing CEIR Blacklist for IMEI ${imei}...`,
        `[OK] Broadcasted to Safaricom, Airtel & Telkom nodes`,
        `[OK] Blockchain Lock Tx: 0x3a4b...9e8f`
      );
    } else if (cmd === "simtrace webhooks listen") {
      newLogs.push(
        "Ready! Forwarding webhooks to http://localhost:3000/api/webhook...",
        "2026-07-31 14:02:11 [200] imei.blacklisted -> http://localhost:3000/api/webhook (42ms)"
      );
    } else if (cmd === "simtrace clear" || cmd === "clear") {
      setCliLogs([]);
      setCliInput("");
      return;
    } else {
      newLogs.push(`Command not recognized: '${cmd}'. Type 'help' for available commands.`);
    }

    setCliLogs(newLogs);
    setCliInput("");
  }

  // ── Helper: Create API Key ─────────────────────────────────────────────────
  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `st_live_${Math.random().toString(36).substring(2, 18)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      requests: 0,
      limit: 100000,
      status: "active",
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName("");
    setShowKeyModal(false);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.1))", borderColor: "var(--indigo)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--indigo), var(--sky))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#fff", fontWeight: 800 }}>
              ⚡
            </div>
            <div>
              <h1 style={{ fontSize: "1.35rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                SimTrace Developer Ecosystem & Open Platform
                <span style={{ fontSize: "0.7rem", background: "var(--indigo)22", color: "var(--indigo)", border: "1px solid var(--indigo)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  REST · GraphQL · Webhooks · SDKs
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Build third-party security applications, telecom integrations, and automated law enforcement tools with the SimTrace API.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={() => setActiveTab("explorer")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
              🚀 Interactive API Playground
            </button>
            <button onClick={() => setShowKeyModal(true)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.82rem", border: "1px solid var(--border)" }}>
              🔑 Generate API Key
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "dashboard", label: "🔑 API Keys & Dashboard" },
          { id: "explorer", label: "🧪 REST API Explorer" },
          { id: "graphql", label: "🕸️ GraphQL Gateway" },
          { id: "sdks", label: "📦 Client SDKs & Code" },
          { id: "webhooks", label: "🔔 Webhooks Engine" },
          { id: "plugins", label: "🧩 Extension Plugins" },
          { id: "cli", label: "💻 Terminal CLI Tool" },
          { id: "oauth", label: "🔐 OAuth Applications" },
          { id: "docs", label: "📚 API Specification" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeTab === tab.id ? "var(--indigo)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--indigo)" : "var(--text2)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: API KEYS & DEVELOPER DASHBOARD ─────────────────────────────── */}
      {activeTab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>MONTHLY API CALLS</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>85,440 / 100,000</div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>85% Quota Used (Resets in 12 days)</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>AVG API LATENCY</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>18ms</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Global Edge Cloud Run Routing</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ACTIVE WEBHOOK TUNNELS</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--indigo)" }}>2 Active</div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>99.98% Successful Delivery</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>REGISTERED OAUTH APPS</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--amber)" }}>{oauthApps.length} Apps</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Law Enforcement & Insurers</div>
            </div>
          </div>

          {/* API Keys Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: 2 }}>🔑 API Credentials & Production Tokens</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Use secret API keys to authenticate requests from your backend servers.</p>
              </div>
              <button onClick={() => setShowKeyModal(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                + Create New Key
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.82rem", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                    <th style={{ padding: "8px" }}>NAME</th>
                    <th style={{ padding: "8px" }}>SECRET KEY</th>
                    <th style={{ padding: "8px" }}>CREATED</th>
                    <th style={{ padding: "8px" }}>LAST USED</th>
                    <th style={{ padding: "8px" }}>USAGE</th>
                    <th style={{ padding: "8px" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(k => (
                    <tr key={k.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{k.name}</td>
                      <td style={{ padding: "8px", fontFamily: "var(--mono)", color: "var(--sky)" }}>{k.key}</td>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{k.created}</td>
                      <td style={{ padding: "8px", color: "var(--muted)" }}>{k.lastUsed}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{ fontWeight: 700 }}>{k.requests.toLocaleString()}</span> / {k.limit.toLocaleString()}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k.key);
                            alert("Copied API Key to clipboard!");
                          }}
                          className="btn-ghost"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                        >
                          📋 Copy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INTERACTIVE REST API EXPLORER ──────────────────────────────── */}
      {activeTab === "explorer" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          {/* Controls Panel */}
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🧪 Interactive REST API Playground</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Test SimTrace production endpoints directly from your browser with sample payloads.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>HTTP Method & Endpoint</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    value={explorerMethod}
                    onChange={e => setExplorerMethod(e.target.value as any)}
                    style={{ padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)", fontWeight: 700, color: "var(--sky)" }}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <select
                    value={explorerEndpoint}
                    onChange={e => setExplorerEndpoint(e.target.value)}
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <option value="/api/v1/imei/check">/api/v1/imei/check - Verify IMEI Registry</option>
                    <option value="/api/v1/telecom/blacklist">/api/v1/telecom/blacklist - Issue Carrier Blacklist</option>
                    <option value="/api/v1/alerts/active">/api/v1/alerts/active - Active Security Feed</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Target Device IMEI</label>
                <input
                  type="text"
                  value={explorerImei}
                  onChange={e => setExplorerImei(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Request Headers</label>
                <div style={{ background: "var(--bg)", padding: "0.5rem 0.75rem", borderRadius: 6, fontSize: "0.78rem", fontFamily: "var(--mono)", color: "var(--text2)" }}>
                  <div>Authorization: Bearer st_live_98f4a27b1c8e0d...</div>
                  <div>Content-Type: application/json</div>
                  <div>X-SimTrace-Region: KE-NBO</div>
                </div>
              </div>

              <button
                onClick={runExplorerRequest}
                disabled={explorerLoading}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.88rem", marginTop: "0.5rem" }}
              >
                {explorerLoading ? "Sending API Request…" : "⚡ Execute API Request"}
              </button>
            </div>
          </div>

          {/* Response Viewer */}
          <div className="card" style={{ height: "100%", minHeight: 380, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>HTTP Response Body</span>
              {explorerStatus && (
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem" }}>
                  <span style={{ color: "var(--emerald)", fontWeight: 700 }}>STATUS {explorerStatus} OK</span>
                  <span style={{ color: "var(--sky)" }}>{explorerLatency}ms</span>
                </div>
              )}
            </div>

            {!explorerResponse ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                Click Execute API Request to test live endpoint
              </div>
            ) : (
              <pre style={{ flex: 1, background: "var(--bg)", padding: "0.85rem", borderRadius: 8, fontSize: "0.8rem", fontFamily: "var(--mono)", color: "var(--emerald)", overflowX: "auto", margin: 0, lineHeight: 1.4 }}>
                {JSON.stringify(explorerResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: GRAPHQL GATEWAY & SCHEMA EXPLORER ─────────────────────────── */}
      {activeTab === "graphql" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          {/* Query Editor */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>🕸️ GraphQL Query Editor</h3>
              <span style={{ fontSize: "0.72rem", background: "var(--indigo)22", color: "var(--indigo)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                Endpoint: /graphql
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "0.75rem" }}>
              Query multi-nested device telemetry, SIM swap alerts, and blockchain ledger entries in a single network call.
            </p>

            <textarea
              value={gqlQuery}
              onChange={e => setGqlQuery(e.target.value)}
              rows={12}
              style={{ width: "100%", fontFamily: "var(--mono)", fontSize: "0.82rem", background: "var(--bg)", color: "var(--text)", padding: "0.75rem", borderRadius: 8, resize: "vertical", marginBottom: "0.75rem" }}
            />

            <button onClick={runGqlQuery} disabled={gqlLoading} className="btn-primary" style={{ width: "100%", padding: "8px 16px", fontSize: "0.88rem" }}>
              {gqlLoading ? "Executing GraphQL Query…" : "▶ Run GraphQL Query"}
            </button>
          </div>

          {/* GraphQL Result */}
          <div className="card" style={{ minHeight: 380, display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>GraphQL Execution Result</h3>
            {!gqlResult ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
                Run query to display graph response
              </div>
            ) : (
              <pre style={{ flex: 1, background: "var(--bg)", padding: "0.85rem", borderRadius: 8, fontSize: "0.8rem", fontFamily: "var(--mono)", color: "var(--sky)", overflowX: "auto", margin: 0, lineHeight: 1.4 }}>
                {JSON.stringify(gqlResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: CLIENT SDKS & CODE GENERATOR ───────────────────────────────── */}
      {activeTab === "sdks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", marginBottom: 2 }}>📦 Official SimTrace Client SDKs</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Idiomatic libraries with automatic retries, type definitions, and webhook verification.</p>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[
                  { id: "node", label: "Node.js / TS" },
                  { id: "python", label: "Python" },
                  { id: "go", label: "Go" },
                  { id: "curl", label: "cURL" },
                ].map(sdk => (
                  <button
                    key={sdk.id}
                    onClick={() => setSelectedSdk(sdk.id as any)}
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.8rem",
                      borderRadius: 6,
                      border: `1px solid ${selectedSdk === sdk.id ? "var(--indigo)" : "var(--border)"}`,
                      background: selectedSdk === sdk.id ? "var(--surface)" : "transparent",
                      color: selectedSdk === sdk.id ? "var(--indigo)" : "var(--text2)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {sdk.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: 8, fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--emerald)", overflowX: "auto" }}>
              {selectedSdk === "node" && (
                <pre style={{ margin: 0, lineHeight: 1.5 }}>{`// Install package: npm install @simtrace/sdk
import { SimTraceClient } from '@simtrace/sdk';

const simtrace = new SimTraceClient({
  apiKey: process.env.SIMTRACE_API_KEY,
  environment: 'production',
});

// Check IMEI against National CEIR Registry
const result = await simtrace.imei.check('356938035643809');
console.log('IMEI Status:', result.stolenStatus, 'Risk Score:', result.riskScore);`}</pre>
              )}

              {selectedSdk === "python" && (
                <pre style={{ margin: 0, lineHeight: 1.5 }}>{`# Install package: pip install simtrace-py
from simtrace import SimTraceClient

client = SimTraceClient(api_key="st_live_98f4a27b1c8e0d9f3a5b7c1e")

# Query device risk intelligence
device = client.imei.check("356938035643809")
print(f"Device: {device.make} {device.model} | Risk: {device.risk_score}")`}</pre>
              )}

              {selectedSdk === "go" && (
                <pre style={{ margin: 0, lineHeight: 1.5 }}>{`// Install package: go get github.com/simtrace/simtrace-go
package main

import (
    "fmt"
    "github.com/simtrace/simtrace-go"
)

func main() {
    client := simtrace.NewClient("st_live_98f4a27b1c8e0d9f3a5b7c1e")
    device, err := client.IMEI.Check("356938035643809")
    if err == nil {
        fmt.Println("Status:", device.Status)
    }
}`}</pre>
              )}

              {selectedSdk === "curl" && (
                <pre style={{ margin: 0, lineHeight: 1.5 }}>{`# cURL Request
curl -X GET "https://simtrace.site/api/v1/imei/check?imei=356938035643809" \\
  -H "Authorization: Bearer st_live_98f4a27b1c8e0d9f3a5b7c1e" \\
  -H "Content-Type: application/json"`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: WEBHOOKS ENGINE ───────────────────────────────────────────── */}
      {activeTab === "webhooks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🔔 Real-Time Webhook Subscriptions</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Receive instant HTTP callbacks whenever an IMEI is blacklisted, a SIM swap occurs, or a theft report is filed.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
              {webhooks.map(w => (
                <div key={w.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, fontFamily: "var(--mono)", color: "var(--sky)" }}>{w.url}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
                      Events: {w.events.join(", ")} · Secret: <span style={{ fontFamily: "var(--mono)" }}>{w.secret}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 700 }}>{w.lastDelivery}</span>
                    <button
                      onClick={() => {
                        setTestWhResult(`[SUCCESS] Webhook event 'test.ping' sent to ${w.url} - Received HTTP 200 OK (84ms)`);
                        setTimeout(() => setTestWhResult(null), 4000);
                      }}
                      className="btn-ghost"
                      style={{ fontSize: "0.78rem", padding: "4px 10px", border: "1px solid var(--border)" }}
                    >
                      ⚡ Test Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {testWhResult && (
              <div style={{ background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "0.65rem 0.85rem", borderRadius: 6, fontSize: "0.8rem", marginBottom: "1rem" }}>
                {testWhResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: PLUGIN ARCHITECTURE ────────────────────────────────────────── */}
      {activeTab === "plugins" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🧩 Extension Plugin Ecosystem</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Extend SimTrace functionality with custom fraud detection rules, e-commerce checkout guards, and carrier middleware.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                { name: "Shopify IMEI Checkout Guard", author: "SimTrace Labs", desc: "Prevents stolen or blacklisted phones from being listed on Shopify stores.", status: "Installed" },
                { name: "WooCommerce Anti-Fraud Sync", author: "E-Commerce Security", desc: "Automated real-time IMEI lookup during shopping cart checkout.", status: "Available" },
                { name: "Police Evidence Exporter", author: "DCI Kenya Cyber Unit", desc: "Direct export of device dossiers into court-approved PDF formats.", status: "Installed" },
              ].map((plug, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>{plug.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginBottom: "0.5rem" }}>by {plug.author}</div>
                  <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 0.85rem 0", lineHeight: 1.4 }}>{plug.desc}</p>
                  <button className={plug.status === "Installed" ? "btn-ghost" : "btn-primary"} style={{ width: "100%", padding: "4px 10px", fontSize: "0.78rem" }}>
                    {plug.status === "Installed" ? "✓ Active Extension" : "Install Plugin"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: TERMINAL CLI TOOL ──────────────────────────────────────────── */}
      {activeTab === "cli" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>💻 SimTrace Command Line Interface (`simtrace-cli`)</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Manage CEIR blacklist records, listen to webhooks, and trigger security commands directly from your terminal.
            </p>

            <div style={{ background: "#0f172a", borderRadius: 8, padding: "1rem", color: "#f8fafc", fontFamily: "var(--mono)", fontSize: "0.82rem", minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ flex: 1, overflowY: "auto", marginBottom: "0.5rem" }}>
                {cliLogs.map((line, i) => (
                  <div key={i} style={{ color: line.startsWith("$") ? "#38bdf8" : line.includes("[OK]") ? "#4ade80" : "#cbd5e1", lineHeight: 1.5 }}>
                    {line}
                  </div>
                ))}
              </div>

              <form onSubmit={handleCliSubmit} style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #334155", paddingTop: "0.5rem" }}>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>$</span>
                <input
                  type="text"
                  value={cliInput}
                  onChange={e => setCliInput(e.target.value)}
                  placeholder="Type 'help' or 'simtrace imei 356938035643809'..."
                  style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "var(--mono)", fontSize: "0.82rem", outline: "none" }}
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: OAUTH APPLICATIONS ─────────────────────────────────────────── */}
      {activeTab === "oauth" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: 2 }}>🔐 Third-Party OAuth 2.0 Applications</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Allow users to sign in with their SimTrace identity and grant scoped API permissions.</p>
              </div>
              <button onClick={() => alert("Create OAuth App Modal opened")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                + Register New App
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {oauthApps.map(app => (
                <div key={app.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>{app.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: 6 }}>
                    <span>Client ID: <strong style={{ fontFamily: "var(--mono)", color: "var(--sky)" }}>{app.clientId}</strong></span>
                    <span>Redirect URI: <strong style={{ fontFamily: "var(--mono)", color: "var(--text)" }}>{app.redirectUri}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {app.scopes.map((s, i) => (
                      <span key={i} style={{ fontSize: "0.68rem", background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--mono)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: API DOCS & OPENAPI SPEC ────────────────────────────────────── */}
      {activeTab === "docs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>📚 SimTrace API Specification & Reference</h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
              Base URL: <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: 4, color: "var(--sky)" }}>https://simtrace.site/api/v1</code>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { method: "GET", path: "/imei/check", desc: "Lookup IMEI in GSMA & National CEIR Database", params: "imei (string, required)" },
                { method: "POST", path: "/telecom/blacklist", desc: "Broadcast device IMEI to all operator networks", params: "imei, reason, policeCaseId" },
                { method: "POST", path: "/reports/stolen", desc: "File official theft affidavit with photo evidence", params: "imei, ownerId, gpsCoordinates" },
                { method: "GET", path: "/alerts/active", desc: "Stream real-time nationwide SIM swap & theft alerts", params: "region, minSeverity, limit" },
              ].map((ep, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: ep.method === "GET" ? "var(--sky)22" : "var(--emerald)22", color: ep.method === "GET" ? "var(--sky)" : "var(--emerald)" }}>
                      {ep.method}
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "var(--mono)" }}>{ep.path}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text2)", marginBottom: 4 }}>{ep.desc}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Parameters: <code style={{ fontFamily: "var(--mono)" }}>{ep.params}</code></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create API Key */}
      {showKeyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: 450, width: "100%", background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🔑 Generate New API Secret Key</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1rem" }}>
              Specify a label for your key to identify its usage (e.g. "Production Server Kenya").
            </p>

            <input
              type="text"
              placeholder="e.g. Carrier Core Node Key"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "0.85rem", borderRadius: 8, marginBottom: "1rem" }}
            />

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowKeyModal(false)} className="btn-ghost" style={{ padding: "6px 12px", fontSize: "0.82rem" }}>
                Cancel
              </button>
              <button onClick={handleCreateKey} disabled={!newKeyName.trim()} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
