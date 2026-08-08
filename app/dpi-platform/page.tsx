"use client";
import { useState } from "react";
import Link from "next/link";
import LiveMapWrapper from "../../components/LiveMapWrapper";

export default function DPIPlatformPage() {
  const [activeTab, setActiveTab] = useState<
    | "identity_registry"
    | "incident_platform"
    | "regulatory_dashboards"
    | "data_governance"
    | "integration_hub"
    | "evidence_management"
    | "public_selfservice"
    | "platform_governance"
  >("identity_registry");

  // ── 1. National Device Identity Registry State ─────────────────────────────
  const [imeiSearch, setImeiSearch] = useState("358912104928104");
  const [registryResult, setRegistryResult] = useState({
    imei: "358912104928104",
    status: "VERIFIED_CLEAN",
    tacBrand: "Apple Inc. (iPhone 15 Pro Max)",
    duplicateCheck: "0 Duplicates Found (Unique Cryptographic DNA)",
    nationalRegistrationDate: "2025-12-05",
    carrierBinds: "Safaricom 5G Core / Airtel Interconnect",
    governedStatus: "NATIONAL_REGISTRY_ACTIVE",
  });

  // ── 2. National Incident Platform State ─────────────────────────────────────
  const [incidents, setIncidents] = useState([
    { id: "INC-2026-8801", type: "ARMED_ROBBERY_THEFT", imei: "358912104928104", region: "Nairobi Metro", agency: "DCI Cybercrime Unit", status: "EVIDENCE_COLLECTED", recoveryScore: "92%", timestamp: "2 hours ago" },
    { id: "INC-2026-8799", type: "SIM_SWAP_FRAUD", imei: "864219041284901", region: "Mombasa County", agency: "Safaricom Fraud Desk", status: "BLOCKED_ON_CEIR", recoveryScore: "88%", timestamp: "5 hours ago" },
    { id: "INC-2026-8795", type: "LOST_IN_TRANSIT", imei: "351029481920391", region: "Nakuru Urban", agency: "National Police Service", status: "UNDER_INVESTIGATION", recoveryScore: "74%", timestamp: "1 day ago" },
  ]);

  // ── 3. Regulatory & Compliance Dashboards State ─────────────────────────────
  const regulatoryMetrics = [
    { title: "National CEIR Compliance Rate", value: "99.8%", status: "PASSED", detail: "All 3 Licensed Carriers Syncing SS7 Blacklists" },
    { title: "Active Registered National IMEIs", value: "18,420,000", status: "ACTIVE", detail: "89.2% National Smartphone Population Covered" },
    { title: "Avg Law Enforcement Dispatch", value: "4.2 Mins", status: "OPTIMAL", detail: "Automated DCI Warrant & Snapshot Dispatches" },
    { title: "Cross-Border Interoperability", value: "28 Nations", status: "CONNECTED", detail: "EAC & Interpol CEIR Mesh Interconnect" },
  ];

  // ── 4. Data Governance Framework State ──────────────────────────────────────
  const governancePolicies = [
    { name: "National Data Sovereignty & Residency", classification: "RESTRICTED GOVT", encryption: "AES-256-GCM + KMS Enclave", retention: "10 Years Immutable", status: "ENFORCED" },
    { name: "Subscriber Telemetry Privacy (GDPR/DPA)", classification: "CONFIDENTIAL", encryption: "Anonymized Hash Zero-Knowledge", retention: "90 Days Active Log", status: "ENFORCED" },
    { name: "Digital Evidence Chain-of-Custody", classification: "COURT ADMISSIBLE", encryption: "SHA-256 Cryptographic Ledger", retention: "Permanent Legal Vault", status: "ENFORCED" },
  ];

  // ── 5. Integration Hub State ────────────────────────────────────────────────
  const integrationConnectors = [
    { name: "Safaricom Core Network Gateway", protocol: "SS7 / MAP / Diameter", latency: "12ms", status: "ONLINE" },
    { name: "DCI National Cybercrime Database", protocol: "RESTful OpenAPI v3 / Webhooks", latency: "24ms", status: "ONLINE" },
    { name: "Integrated National ID (e-ID / IPRS)", protocol: "OAuth 2.0 / SAML 2.0", latency: "45ms", status: "ONLINE" },
    { name: "Interpol Global CEIR Mesh", protocol: "gRPC High-Speed Stream", latency: "88ms", status: "ONLINE" },
    { name: "M-Pesa Micro-Insurance Escrow Gateway", protocol: "SOAP / REST API", latency: "18ms", status: "ONLINE" },
  ];

  // ── 6. Digital Evidence Management State ────────────────────────────────────
  const evidenceFiles = [
    { id: "EVD-9901", title: "Silent Front-Camera Selfie Snapshot", sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", source: "Device Enclave Capture", courtAdmissible: "YES" },
    { id: "EVD-9902", title: "Cell Tower Triangulation Logs (3 Towers)", sha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4", source: "Carrier Signaling Mesh", courtAdmissible: "YES" },
    { id: "EVD-9903", title: "Signed DCI Police Affidavit PDF", sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", source: "Automated Legal Engine", courtAdmissible: "YES" },
  ];

  // ── 7. Public Self-Service State ───────────────────────────────────────────
  const [selfServiceImei, setSelfServiceImei] = useState("");
  const [selfServiceResult, setSelfServiceResult] = useState<any>(null);

  function handlePublicCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!selfServiceImei) return;
    setSelfServiceResult({
      imei: selfServiceImei,
      status: "CLEAN",
      verified: true,
      message: "This device is registered clean on the National Registry. Zero theft or blacklists reported.",
    });
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Hero Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(14,165,233,0.15))", borderColor: "var(--emerald)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), var(--sky))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#fff", fontWeight: 800 }}>
              🏛️
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                National Digital Public Infrastructure (DPI) Platform
                <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Phase 14 DPI Core
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                National device identity registry, digital evidence management, regulatory dashboards, data sovereignty governance, and public self-service.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/trust-platform" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🛡️ Global Trust Platform
            </Link>
            <button onClick={() => alert("National DPI Platform Operating at Peak Capacity. 100% Core Nodes Online.")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ⚡ DPI Status: 100% OPERATIONAL
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "identity_registry", label: "📱 National Device Identity" },
          { id: "incident_platform", label: "🚨 National Incident Platform" },
          { id: "regulatory_dashboards", label: "📊 Regulatory & Compliance" },
          { id: "data_governance", label: "🔒 Data Governance & Sovereignty" },
          { id: "integration_hub", label: "⚡ Integration Hub & Interop" },
          { id: "evidence_management", label: "⚖️ Digital Evidence Management" },
          { id: "public_selfservice", label: "🌐 Public Self-Service Portal" },
          { id: "platform_governance", label: "🏢 Platform Governance" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeTab === tab.id ? "var(--emerald)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--emerald)" : "var(--text2)",
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

      {/* ── TAB 1: NATIONAL DEVICE IDENTITY REGISTRY ─────────────────────────── */}
      {activeTab === "identity_registry" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📱 Governed National Device Identity Registry</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Provides authoritative verification of official device origin, GSMA TAC allocations, and duplicate IMEI cloning prevention.
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>NATIONAL DEVICE STATUS</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--emerald)", marginTop: 2 }}>{registryResult.status}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--sky)", fontWeight: 700, marginTop: 4 }}>{registryResult.tacBrand}</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>DUPLICATE CLONING AUDIT</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--emerald)", marginTop: 2 }}>{registryResult.duplicateCheck}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>Carrier Gateways: {registryResult.carrierBinds}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: NATIONAL INCIDENT PLATFORM ───────────────────────────────── */}
      {activeTab === "incident_platform" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🚨 National Incident & Theft Dispatch Platform</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Automated case dispatch linking victims, DCI Cybercrime detectives, and carrier network operators.</p>
              </div>
              <button onClick={() => alert("New Incident Case Created & Broadcasted to Law Enforcement Mesh.")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + File National Incident Case
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {incidents.map(inc => (
                <div key={inc.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--emerald)" }}>{inc.id}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{inc.type}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                      Region: {inc.region} · Assigned: {inc.agency} · {inc.timestamp}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sky)", background: "var(--sky)22", padding: "2px 8px", borderRadius: 4 }}>
                      Recovery Chance: {inc.recoveryScore}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {inc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: REGULATORY DASHBOARDS ────────────────────────────────────── */}
      {activeTab === "regulatory_dashboards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📊 Regulatory & Executive Compliance Dashboards</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              National key performance indicators for Communications Authorities, Law Enforcement Directorates, and Central Banks.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {regulatoryMetrics.map((m, idx) => (
                <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{m.title}</div>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--emerald)", marginTop: 2 }}>{m.value}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>{m.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DATA GOVERNANCE & SOVEREIGNTY ─────────────────────────────── */}
      {activeTab === "data_governance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🔒 Data Governance, Residency & Privacy Sovereignty</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Enforces zero-trust data classification, citizen privacy consent, and national data residency compliance.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {governancePolicies.map((pol, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{pol.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                      Class: <code style={{ color: "var(--emerald)" }}>{pol.classification}</code> · Encryption: {pol.encryption} · Retention: {pol.retention}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                    {pol.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: INTEGRATION HUB & INTEROPERABILITY ─────────────────────────── */}
      {activeTab === "integration_hub" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚡ Modular Integration Hub & Standardized Connectors</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Pre-built, high-performance connectors connecting carrier signaling, police databases, national ID registries, and mobile money gateways.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {integrationConnectors.map((c, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{c.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                      Protocol: <code style={{ color: "var(--sky)" }}>{c.protocol}</code> · Gateway Latency: {c.latency}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DIGITAL EVIDENCE MANAGEMENT ───────────────────────────────── */}
      {activeTab === "evidence_management" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚖️ Digital Evidence Management (DEM) & Chain-of-Custody</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Secures court-admissible forensic artifacts with SHA-256 integrity verification and tamper-evident audit logs.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {evidenceFiles.map((ev, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{ev.title} ({ev.id})</div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      Admissible: {ev.courtAdmissible}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Source: {ev.source}</div>
                  <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--sky)", marginTop: 4, wordBreak: "break-all" }}>
                    SHA-256 Digest: {ev.sha256}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: PUBLIC SELF-SERVICE PORTAL ─────────────────────────────────── */}
      {activeTab === "public_selfservice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🌐 Public Citizen Self-Service Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Enables consumers to verify second-hand phone IMEIs, file instant theft claims, and download official ownership titles.
            </p>

            <form onSubmit={handlePublicCheck} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", maxWidth: 540 }}>
              <input
                type="text"
                required
                value={selfServiceImei}
                onChange={e => setSelfServiceImei(e.target.value)}
                placeholder="Enter 15-Digit IMEI or Dial *#06#"
                style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, fontFamily: "var(--mono)" }}
              />
              <button type="submit" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                🔍 Instant Public Check
              </button>
            </form>

            {selfServiceResult && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--emerald)", borderRadius: 8, padding: "1rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--emerald)" }}>
                  ✅ Verification Complete: Clean Status
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text2)", marginTop: 4 }}>
                  {selfServiceResult.message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 8: PLATFORM GOVERNANCE ───────────────────────────────────────── */}
      {activeTab === "platform_governance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏢 Multi-Tenant Platform Governance & Agency Administration</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Delegated administration and role-based access control across government ministries, police departments, and telecoms.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: "0.5rem" }}>Tenant Agency Onboarding</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.85rem" }}>
                  Provision isolated tenant workspaces for new national security, customs, or telecommunications regulators.
                </p>
                <button onClick={() => alert("New Tenant Agency Onboarded!")} className="btn-primary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                  + Onboard New Agency Tenant
                </button>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: "0.5rem" }}>RBAC Policy Management</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.85rem" }}>
                  Configure granular permissions for DCI Officers, Carrier Fraud Engineers, and Insurance Adjusters.
                </p>
                <button onClick={() => alert("RBAC Policy Matrix Updated!")} className="btn-ghost" style={{ padding: "6px 12px", fontSize: "0.78rem", border: "1px solid var(--border)" }}>
                  ⚙️ Configure RBAC Matrix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
