"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";

export default function EnterpriseExcellencePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "zerotrust"
    | "compliance"
    | "audit"
    | "telemetry"
    | "flags"
    | "cost"
    | "apigov"
    | "soc"
  >("zerotrust");

  // ── 1. Zero Trust & Passkey State ──────────────────────────────────────────
  const [passkeys, setPasskeys] = useState([
    { id: "pk_1", name: "YubiKey 5 NFC (Hardware Security Key)", registered: "2026-06-12", lastUsed: "10 mins ago", status: "ACTIVE" },
    { id: "pk_2", name: "MacBook Pro Touch ID / Windows Hello Passkey", registered: "2026-07-01", lastUsed: "Just now", status: "ACTIVE" },
  ]);
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);
  const [deviceTrustScore, setDeviceTrustScore] = useState(98);
  const [mTLSEnforced, setMTLSEnforced] = useState(true);

  // ── 2. Compliance Framework State ──────────────────────────────────────────
  const [complianceFrameworks, setComplianceFrameworks] = useState([
    { id: "SOC2", name: "SOC 2 Type II", controlsPassed: 124, totalControls: 124, status: "100% COMPLIANT", lastAudit: "2026-07-15" },
    { id: "ISO27001", name: "ISO/IEC 27001:2022", controlsPassed: 114, totalControls: 114, status: "CERTIFIED", lastAudit: "2026-06-20" },
    { id: "GDPR", name: "GDPR & Kenya Data Protection Act", controlsPassed: 88, totalControls: 88, status: "FULLY AUDITED", lastAudit: "2026-07-28" },
    { id: "OWASP", name: "OWASP ASVS Level 3", controlsPassed: 180, totalControls: 180, status: "VERIFIED", lastAudit: "2026-07-02" },
    { id: "NIST", name: "NIST SP 800-53 Rev. 5", controlsPassed: 256, totalControls: 256, status: "COMPLIANT", lastAudit: "2026-07-10" },
  ]);

  // ── 3. Immutable Audit Logs & Replay State ──────────────────────────────────
  const [auditIndex, setAuditIndex] = useState(4);
  const auditLogs = [
    { id: "AUD-1001", timestamp: "2026-07-31 14:00:01 UTC", actor: "sec-admin@simtrace.org", action: "ENFORCE_PASSKEY_POLICY", hash: "0x8f2a9b4c1e...", sig: "Ed25519 Verified" },
    { id: "AUD-1002", timestamp: "2026-07-31 14:02:15 UTC", actor: "carrier-gateway@safaricom.co.ke", action: "SS7_CEIR_BLACKLIST_BROADCAST", hash: "0x3e1d9a8c7b...", sig: "Ed25519 Verified" },
    { id: "AUD-1003", timestamp: "2026-07-31 14:05:30 UTC", actor: "dci-officer-402@dci.go.ke", action: "EXPORT_COURT_EVIDENCE_AFFIDAVIT", hash: "0x9c4f2e1a3b...", sig: "Ed25519 Verified" },
    { id: "AUD-1004", timestamp: "2026-07-31 14:08:42 UTC", actor: "system-auto-scaler", action: "CANARY_DEPLOYMENT_ROLLOUT_50%", hash: "0x1a2b3c4d5e...", sig: "Ed25519 Verified" },
    { id: "AUD-1005", timestamp: "2026-07-31 14:11:00 UTC", actor: "soc-analyst@simtrace.org", action: "RESOLVE_GEO_ANOMALY_INCIDENT", hash: "0x7f8e9d0c1b...", sig: "Ed25519 Verified" },
  ];

  // ── 4. OpenTelemetry & RUM State ───────────────────────────────────────────
  const [traces, setTraces] = useState([
    { traceId: "tr-98a12c4f", name: "POST /api/v2/imei/verify", duration: "18ms", status: "200 OK", service: "ceir-gateway", spans: 6 },
    { traceId: "tr-31b4e8d2", name: "GET /api/v2/telecom/ss7-status", duration: "12ms", status: "200 OK", service: "carrier-mesh", spans: 4 },
    { traceId: "tr-77c9d1e5", name: "POST /api/v2/evidence/capture", duration: "142ms", status: "200 OK", service: "ai-vision-ocr", spans: 11 },
  ]);

  // ── 5. Feature Flags & Canary Deployment State ──────────────────────────────
  const [flags, setFlags] = useState([
    { id: "ff_1", key: "enable-ss7-diameter-v3", name: "SS7/Diameter v3 High-Density Mesh", percentage: 50, status: "CANARY", killSwitch: false },
    { id: "ff_2", key: "ai-auto-court-affidavit", name: "AI Automated Court Affidavit Generation", percentage: 100, status: "ACTIVE", killSwitch: false },
    { id: "ff_3", key: "passkey-hardware-mfa-only", name: "Hardware Passkey Strict Enforcement", percentage: 25, status: "ROLLOUT", killSwitch: false },
  ]);

  // ── 6. Cloud Cost Intelligence State ───────────────────────────────────────
  const costData = [
    { service: "Cloud Run Containers", monthly: "$1,240.00", share: "38%", status: "OPTIMIZED" },
    { service: "Cloud Firestore Multi-Region", monthly: "$890.00", share: "27%", status: "OPTIMIZED" },
    { service: "Gemini 1.5 Flash AI API", monthly: "$450.00", share: "14%", status: "WITHIN BUDGET" },
    { service: "Carrier SS7 VPN & Interconnect", monthly: "$380.00", share: "12%", status: "FIXED RATE" },
    { service: "Egress Bandwidth & Cloud Armor WAF", monthly: "$290.00", share: "9%", status: "MONITORED" },
  ];

  // ── 7. Enterprise API Governance State ─────────────────────────────────────
  const apiVersions = [
    { version: "v2.8 (Current)", status: "STABLE", lifecycle: "ACTIVE", rateLimit: "10,000 req/min", deprecation: "N/A" },
    { version: "v2.0 (Legacy)", status: "MAINTENANCE", lifecycle: "DEPRECATED", rateLimit: "1,000 req/min", deprecation: "2026-12-31" },
    { version: "v3.0 (Beta)", status: "EXPERIMENTAL", lifecycle: "CANARY", rateLimit: "50,000 req/min", deprecation: "N/A" },
  ];

  // ── Helper Actions ─────────────────────────────────────────────────────────
  function handleAddPasskey() {
    setEnrollingPasskey(true);
    setTimeout(() => {
      setPasskeys(prev => [
        ...prev,
        { id: `pk_${Date.now()}`, name: "YubiKey 5C FIPS Key", registered: new Date().toISOString().split("T")[0], lastUsed: "Just now", status: "ACTIVE" }
      ]);
      setEnrollingPasskey(false);
    }, 1200);
  }

  function toggleKillSwitch(flagId: string) {
    setFlags(prev =>
      prev.map(f => (f.id === flagId ? { ...f, killSwitch: !f.killSwitch, percentage: f.killSwitch ? 50 : 0 } : f))
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.12))", borderColor: "var(--sky)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--sky), var(--indigo))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#fff", fontWeight: 800 }}>
              🏛️
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Enterprise Excellence & Global Governance Suite
                <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Zero Trust & SOC 2 Ready
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Passkey FIDO2 MFA, OpenTelemetry distributed tracing, immutable Merkle audit replay, canary deployment kill-switches, and cloud cost intelligence.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleAddPasskey} disabled={enrollingPasskey} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              {enrollingPasskey ? "Connecting Security Key…" : "🔑 Enroll Hardware Passkey"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "zerotrust", label: "🔒 Zero Trust & Passkeys" },
          { id: "compliance", label: "📜 Regulatory Compliance" },
          { id: "audit", label: "🛡️ Immutable Audit & Replay" },
          { id: "telemetry", label: "📊 OpenTelemetry & RUM" },
          { id: "flags", label: "🚩 Feature Flags & Canaries" },
          { id: "cost", label: "💰 Cloud Cost Intelligence" },
          { id: "apigov", label: "⚡ Enterprise API Governance" },
          { id: "soc", label: "🚨 SOC Threat Center" },
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

      {/* ── TAB 1: ZERO TRUST & PASSKEYS ────────────────────────────────────── */}
      {activeTab === "zerotrust" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>DEVICE TRUST SCORE</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald)" }}>{deviceTrustScore} / 100</div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>mTLS Certificate & Secure Enclave Active</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>mTLS BINDING</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--sky)" }}>TLS 1.3 Strict</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Hardware Token Verified</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ENROLLED PASSKEYS</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--indigo)" }}>{passkeys.length} Hardware Keys</div>
              <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>FIDO2 / WebAuthn Compliant</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0 }}>🔑 Registered FIDO2 Passkeys & Security Tokens</h3>
              <button onClick={handleAddPasskey} disabled={enrollingPasskey} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + Register New YubiKey
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {passkeys.map(pk => (
                <div key={pk.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{pk.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>Registered: {pk.registered} · Last used: {pk.lastUsed}</div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                    {pk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: REGULATORY COMPLIANCE ────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📜 Enterprise Compliance Framework Matrix</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Real-time posture against global regulatory requirements, OWASP ASVS standards, and national privacy laws.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {complianceFrameworks.map(cf => (
                <div key={cf.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{cf.name}</div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {cf.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text2)", marginBottom: 8 }}>
                    Passed Controls: <strong>{cf.controlsPassed} / {cf.totalControls}</strong> (100% Score)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Last Independent Audit: {cf.lastAudit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: IMMUTABLE AUDIT & TIMELINE REPLAY ─────────────────────────── */}
      {activeTab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🛡️ Cryptographic Merkle Audit Log & Timeline Replay</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Ed25519 digitally signed forensic log trail with SHA-256 hash chaining.</p>
              </div>
              <button onClick={() => alert("Audit Log Package Exported with SHA-256 Merkle Proof.")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                📥 Export JSON-LD Proof
              </button>
            </div>

            {/* Interactive Timeline Slider */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Forensic Replay Index: Position {auditIndex + 1} of {auditLogs.length}
              </div>
              <input
                type="range"
                min="0"
                max={auditLogs.length - 1}
                value={auditIndex}
                onChange={e => setAuditIndex(parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            {/* Selected Audit Log Entry Card */}
            <div style={{ background: "#0f172a", borderRadius: 8, padding: "1rem", color: "#f8fafc", fontFamily: "var(--mono)", fontSize: "0.82rem" }}>
              <div style={{ color: "#38bdf8", fontWeight: 800, marginBottom: 4 }}>RECORD ID: {auditLogs[auditIndex].id}</div>
              <div style={{ color: "#94a3b8", marginBottom: 2 }}>Timestamp: {auditLogs[auditIndex].timestamp}</div>
              <div style={{ color: "#a855f7", marginBottom: 2 }}>Actor: {auditLogs[auditIndex].actor}</div>
              <div style={{ color: "#10b981", marginBottom: 2 }}>Action: {auditLogs[auditIndex].action}</div>
              <div style={{ color: "#f59e0b", marginTop: 6 }}>Merkle Root Hash: {auditLogs[auditIndex].hash}</div>
              <div style={{ color: "#10b981", marginTop: 2 }}>Signature Verification: {auditLogs[auditIndex].sig}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: OPENTELEMETRY & RUM ───────────────────────────────────────── */}
      {activeTab === "telemetry" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📊 OpenTelemetry Distributed Tracing & Real User Monitoring (RUM)</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              End-to-end trace context propagation across microservices and browser client web vitals.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {traces.map(tr => (
                <div key={tr.traceId} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--sky)" }}>{tr.traceId}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{tr.name}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {tr.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", gap: "1.5rem" }}>
                    <span>Service: {tr.service}</span>
                    <span>Duration: {tr.duration}</span>
                    <span>Spans: {tr.spans} micro-operations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: FEATURE FLAGS & CANARY DEPLOYMENTS ────────────────────────── */}
      {activeTab === "flags" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🚩 Feature Flag Governance & Emergency Kill-Switches</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Gradual percentage rollouts, user cohort targeting, and immediate automated kill switches.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {flags.map(flag => (
                <div key={flag.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{flag.name}</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--sky)", marginTop: 2 }}>{flag.key}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>Rollout: {flag.percentage}% of Traffic</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: flag.killSwitch ? "var(--rose)" : "var(--emerald)", background: flag.killSwitch ? "var(--rose)22" : "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {flag.killSwitch ? "KILL-SWITCH TRIGGERED" : flag.status}
                    </span>
                    <button
                      onClick={() => toggleKillSwitch(flag.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        borderRadius: 6,
                        border: "none",
                        background: flag.killSwitch ? "var(--emerald)" : "var(--rose)",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {flag.killSwitch ? "Restore Flag Traffic" : "🚨 EMERGENCY KILL SWITCH"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: CLOUD COST INTELLIGENCE ────────────────────────────────────── */}
      {activeTab === "cost" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>💰 Cloud Cost Intelligence & Expenditure Breakdown</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Granular per-service expenditure analytics, cost anomaly alerts, and budget limit thresholds.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {costData.map((cd, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>{cd.service}</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--sky)" }}>{cd.monthly} / mo</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
                    <span>Share: {cd.share}</span>
                    <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{cd.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: ENTERPRISE API GOVERNANCE ──────────────────────────────────── */}
      {activeTab === "apigov" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚡ Enterprise API Lifecycle & Version Governance</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              API versioning tiers, automated OpenAPI 3.0 specs, rate limits, and client SDK generators.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {apiVersions.map((v, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{v.version}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Rate Quota: {v.rateLimit} · Deprecation: {v.deprecation}</div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: v.lifecycle === "ACTIVE" ? "var(--emerald)" : "var(--sky)", background: v.lifecycle === "ACTIVE" ? "var(--emerald)22" : "var(--sky)22", padding: "2px 8px", borderRadius: 4 }}>
                    {v.lifecycle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: SOC THREAT CENTER ─────────────────────────────────────────── */}
      {activeTab === "soc" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🚨 Security Operations Center (SOC) & Threat Intelligence</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Real-time geo-anomaly monitoring, automated IP blocking, and brute-force mitigation.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ANOMALOUS ATTEMPTS (24H)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>0 Active Threats</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>Cloud Armor Shield Active</div>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>GEO-ANOMALY SCORE</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>99.8 / 100</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Impossible travel detector enabled</div>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>SIEM STREAM STATUS</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--indigo)" }}>CONNECTED</div>
                <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>Splunk / Datadog Sink Active</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
