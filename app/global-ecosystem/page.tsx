"use client";
import { useState } from "react";
import Link from "next/link";
import LiveMapWrapper from "../../components/LiveMapWrapper";

export default function GlobalEcosystemPage() {
  const [activeTab, setActiveTab] = useState<
    | "command_center"
    | "federation"
    | "workflow"
    | "whitelabel"
    | "datalake"
    | "portals"
    | "research"
  >("command_center");

  // ── 1. Global Command Center Telemetry ────────────────────────────────────
  const [liveMapFilter, setLiveMapFilter] = useState("all");
  const commandMetrics = {
    globalTrackedDevices: "4,820,194",
    carrierNodesConnected: 142,
    activeTheftAlerts: 18,
    recoveredToday: 42,
    federatedAgencies: 28,
  };

  // ── 2. Trust Network & Federation Layers ──────────────────────────────────
  const [federationPartners, setFederationPartners] = useState([
    { name: "Interpol Global CEIR Mesh", region: "International (195 Countries)", trustScore: "99.9%", dataSharing: "FULL_CEIR_BLACKLIST", status: "ACTIVE" },
    { name: "Safaricom PLC Core Node", region: "East Africa (Kenya/Uganda)", trustScore: "100%", dataSharing: "IMSI_IMEI_SIGNALING", status: "ACTIVE" },
    { name: "Airtel Africa Interconnect", region: "Pan-Africa (14 Countries)", trustScore: "99.8%", dataSharing: "CELL_TRIANGULATION", status: "ACTIVE" },
    { name: "Jubilee InsurTech Claims Vault", region: "East Africa", trustScore: "99.5%", dataSharing: "VERIFIED_THEFT_POLICIES", status: "ACTIVE" },
    { name: "Samsung GSMA TAC Registry", region: "Global Manufacturing", trustScore: "100%", dataSharing: "FACTORY_DNA_PASSPORTS", status: "ACTIVE" },
  ]);

  // ── 3. Workflow Automation Engine ──────────────────────────────────────────
  const [workflows, setWorkflows] = useState([
    {
      id: "wf_1",
      name: "Automated Stolen Device Lockdown & Court Affidavit",
      trigger: "Device Stolen Report Filed",
      steps: ["1. Query GSMA DB", "2. Issue Carrier SS7 Blacklist", "3. Trigger Silent Selfie OCR", "4. Draft PDF Affidavit to DCI"],
      status: "ACTIVE",
      executions: 1240,
    },
    {
      id: "wf_2",
      name: "SIM Swap Velocity Anomaly Auto-Paging",
      trigger: ">2 SIM Swaps in 30 mins",
      steps: ["1. Calculate Risk Score", "2. Lock Banking Tokens", "3. Notify Carrier Fraud Desk", "4. Dispatch SMS Alert to Owner"],
      status: "ACTIVE",
      executions: 840,
    },
  ]);
  const [newWorkflowName, setNewWorkflowName] = useState("");

  // ── 4. White-Label Branding Customization State ────────────────────────────
  const [brandName, setBrandName] = useState("National CEIR Platform");
  const [brandColor, setBrandColor] = useState("#0ea5e9");
  const [customDomain, setCustomDomain] = useState("ceir.government.go.ke");

  // ── 5. Data Lake Analytics & AI Cloud ──────────────────────────────────────
  const dataLakeMetrics = [
    { metric: "Total Historical Telemetry Points", value: "1.42 Billion Records" },
    { metric: "AI Theft Model Training Size", value: "48 Terabytes Vector Embeddings" },
    { metric: "Real-Time Query Latency", value: "14ms Index Lookup" },
    { metric: "Cold Storage Retention", value: "10 Years Immutable Archival" },
  ];

  // ── 6. Partner Portals Suite ────────────────────────────────────────────────
  const partnerPortals = [
    { title: "Telecom Operator Portal", role: "Safaricom, Airtel, Telkom", features: "SS7 / Diameter Core Gateway, Cell Tower Triangulation, IMSI Binds", href: "/telecom/dashboard" },
    { title: "Law Enforcement Portal", role: "DCI Kenya, Interpol, Police Units", features: "Court Affidavit Generation, Evidence Chain-of-Custody, Warrant Forms", href: "/law-enforcement" },
    { title: "Insurance Underwriting Portal", role: "Jubilee Insurance, APA, Britam", features: "Automated Claim Settlement, Fraud Detection, M-Pesa Micro-Payouts", href: "/insurance" },
    { title: "OEM & Manufacturer Portal", role: "Samsung, Apple, Xiaomi, Tecno", features: "Factory TAC Range Pre-Minting, Anti-Cloning Shield, Hardware Passports", href: "/oem" },
    { title: "Retail & Trade-In Portal", role: "Phone Shops, Repair Stores, Refurbishers", features: "POS QR Scanner, Certified Clean Seal, Instant Ownership Transfer", href: "/retail" },
  ];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(16,185,129,0.15))", borderColor: "var(--sky)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--sky), var(--emerald))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#fff", fontWeight: 800 }}>
              🌐
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Global Device Intelligence Ecosystem Command Platform
                <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Phase 12 Ecosystem Mesh
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Federated cross-border intelligence, workflow automation, white-label government portals, data lake AI, and global command telemetry.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/ecosystem" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🗺️ Ecosystem Map
            </Link>
            <button onClick={() => alert("Global Command Center Status: ALL NODES OPERATIONAL")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ⚡ Command Status: ACTIVE
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "command_center", label: "🛰️ Global Command Center" },
          { id: "federation", label: "🌐 Federated Trust Network" },
          { id: "workflow", label: "⚙️ Workflow Automation Engine" },
          { id: "whitelabel", label: "🎨 White-Label Platform" },
          { id: "datalake", label: "🌊 Data Lake & AI Cloud" },
          { id: "portals", label: "🤝 Partner Portals Suite" },
          { id: "research", label: "📊 Research & Analytics" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeTab === tab.id ? "var(--sky)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--sky)" : "var(--text2)",
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

      {/* ── TAB 1: GLOBAL COMMAND CENTER & MAP TELEMETRY ──────────────────────── */}
      {activeTab === "command_center" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>GLOBAL TRACKED DEVICES</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--sky)" }}>{commandMetrics.globalTrackedDevices}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>+12,400 Today</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CARRIER CORE NODES</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--emerald)" }}>{commandMetrics.carrierNodesConnected} Connected</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>SS7 / Diameter Mesh</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ACTIVE THEFT ALERTS</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--rose)" }}>{commandMetrics.activeTheftAlerts} Critical</div>
              <div style={{ fontSize: "0.72rem", color: "var(--rose)", marginTop: 4 }}>Auto-dispatched to Police</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>DEVICES RECOVERED TODAY</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--indigo)" }}>{commandMetrics.recoveredToday} Units</div>
              <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>89.4% Recovery Rate</div>
            </div>
          </div>

          {/* Command Live Map */}
          <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--sky)44" }}>
            <div style={{ padding: "0.85rem 1rem", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🛰️ Live Satellite Command Map & Spatial Telemetry</span>
                <span style={{ fontSize: "0.68rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 6px", borderRadius: 4 }}>REAL-TIME</span>
              </div>
              <select
                value={liveMapFilter}
                onChange={e => setLiveMapFilter(e.target.value)}
                style={{ padding: "4px 8px", fontSize: "0.78rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <option value="all">All Global Nodes</option>
                <option value="stolen">Stolen / Active Theft Incidents</option>
                <option value="recovered">Recovered Devices</option>
                <option value="towers">Cell Towers & Carrier Gateways</option>
              </select>
            </div>
            <div style={{ height: 420 }}>
              <LiveMapWrapper />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FEDERATED TRUST NETWORK ────────────────────────────────────── */}
      {activeTab === "federation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🌐 Federated Cross-Border & Multi-Organization Trust Network</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Enables secure intelligence sharing between governments, Interpol, telecoms, and insurers while maintaining absolute tenant isolation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {federationPartners.map((fp, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{fp.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Jurisdiction: {fp.region} · Policy: <code style={{ color: "var(--sky)" }}>{fp.dataSharing}</code></div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--emerald)" }}>Trust Score: {fp.trustScore}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {fp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: WORKFLOW AUTOMATION ENGINE ─────────────────────────────────── */}
      {activeTab === "workflow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>⚙️ Automated Investigation & Response Workflow Engine</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Trigger automated multi-agency workflows upon device theft or security anomalies.</p>
              </div>
              <button onClick={() => alert("New Workflow Created!")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + Build New Workflow
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {workflows.map(wf => (
                <div key={wf.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{wf.name}</div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {wf.status} ({wf.executions} Executions)
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--sky)", marginBottom: "0.5rem" }}>
                    Trigger Condition: <strong>{wf.trigger}</strong>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {wf.steps.map((step, idx) => (
                      <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600 }}>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: WHITE-LABEL PLATFORM ───────────────────────────────────────── */}
      {activeTab === "whitelabel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🎨 White-Label Customization & Government Branding</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              Deploy fully branded national CEIR registries with custom themes, domains, and agency logos.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>National Registry Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Primary Theme Accent Color</label>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={{ width: "100%", height: 40, padding: "2px", borderRadius: 6, cursor: "pointer" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Custom Domain CNAME</label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                  />
                </div>

                <button onClick={() => alert("White-label settings saved and applied to live domain!")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                  💾 Save White-Label Configuration
                </button>
              </div>

              {/* Preview Box */}
              <div style={{ background: "var(--bg)", border: `2px solid ${brandColor}`, padding: "1.25rem", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: 4 }}>LIVE DOMAIN: https://{customDomain}</div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: brandColor, marginBottom: "0.5rem" }}>{brandName}</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text2)", margin: 0 }}>
                    Official Government Telecommunications & Device CEIR Portal. Powered by SimTrace Core Engine.
                  </p>
                </div>
                <div style={{ background: brandColor, color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 700, textAlign: "center", marginTop: "1rem" }}>
                  Dial *#06# IMEI Check Active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DATA LAKE & AI CLOUD ───────────────────────────────────────── */}
      {activeTab === "datalake" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🌊 Data Lake Analytics & AI Intelligence Cloud</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Massive historical telemetry storage powering Gemini neural models for predictive theft analysis.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {dataLakeMetrics.map((dl, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{dl.metric}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--sky)", marginTop: 4 }}>{dl.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: PARTNER PORTALS SUITE ──────────────────────────────────────── */}
      {activeTab === "portals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🤝 Partner Portals Suite & Specialized Enterprise Administration</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Dedicated web interfaces tailored to specific industry roles across the global device lifecycle.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {partnerPortals.map((pp, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: 2 }}>{pp.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--sky)", fontWeight: 700, marginBottom: "0.5rem" }}>Target: {pp.role}</div>
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 1rem 0", lineHeight: 1.4 }}>{pp.features}</p>
                  </div>
                  <Link href={pp.href} className="btn-primary" style={{ padding: "6px 12px", fontSize: "0.78rem", textAlign: "center", textDecoration: "none" }}>
                    Launch {pp.title} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: RESEARCH & ANALYTICS ───────────────────────────────────────── */}
      {activeTab === "research" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📊 Research, Trend Forecasting & National Benchmarking</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              National device theft trends, carrier recovery index benchmarking, and economic loss impact modeling.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>National Theft Recovery Rate Trend</div>
                <div style={{ height: 120, background: "var(--bg)", borderRadius: 6, display: "flex", alignItems: "flex-end", padding: "0.5rem", gap: "0.4rem" }}>
                  {[42, 48, 55, 62, 70, 78, 82, 85, 89].map((v, i) => (
                    <div key={i} style={{ flex: 1, background: "var(--emerald)", height: `${v}%`, borderRadius: "2px 2px 0 0" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: 6 }}>
                  <span>Jan 2026</span>
                  <span>National Recovery: 89.4%</span>
                  <span>Jul 2026</span>
                </div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>Stolen Device Economic Loss Prevented</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald)", margin: "0.5rem 0" }}>KES 482,500,000</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
                  Estimated savings across consumers, Jubilee Insurance payouts, and carrier replacement subsidies in Q2 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
