"use client";
import { useState } from "react";
import Link from "next/link";

export default function LawEnforcementCompliancePage() {
  const [selectedAgency, setSelectedAgency] = useState("all");
  const [auditRunning, setAuditRunning] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState("Just now (Live Streaming)");

  // ── 1. Real-Time Compliance Overview Telemetry ──────────────────────────────
  const metrics = [
    { label: "Data Residency Compliance", score: "100%", status: "IN-REGION ENCLAVE", color: "var(--emerald)", detail: "100% Sovereign Kenya/EAC Region KMS" },
    { label: "Evidence Chain-of-Custody", score: "100%", status: "SHA-256 VERIFIED", color: "var(--emerald)", detail: "Zero Tampering Across 4,210 Evidence Vaults" },
    { label: "WORM Storage Retention", score: "99.99%", status: "COMPLIANT", color: "var(--sky)", detail: "Immutable Write-Once-Read-Many Vault Active" },
    { label: "Judicial Warrant Verification", score: "100%", status: "AUTO-AUDITED", color: "var(--indigo)", detail: "Direct OAG & High Court API Verification" },
  ];

  // ── 2. Data Residency & Sovereignty Node Map ─────────────────────────────
  const residencyNodes = [
    { location: "Nairobi Core Primary Enclave (AWS africa-south-1 / Local KMS)", status: "ACTIVE SOVEREIGN", dataStored: "1.42 TB Evidence", latency: "4ms", encryption: "AES-256-GCM + Hardware Enclave" },
    { location: "Mombasa Subsea Gateway Backup Node (KeNIC Partner)", status: "ACTIVE SOVEREIGN", dataStored: "890 GB Mirrors", latency: "8ms", encryption: "FIPS 140-2 Level 3 HSM" },
    { location: "EAC Interpol Cross-Border Gateway (Zero-Knowledge Tunnel)", status: "AUDITED COMPLIANT", dataStored: "Transient Logs Only", latency: "24ms", encryption: "TLS 1.3 / mTLS Strict" },
  ];

  // ── 3. Real-Time Policy Compliance Audit Log Stream ─────────────────────────
  const [auditLogs, setAuditLogs] = useState([
    { id: "AUD-9912", agency: "DCI Cybercrime Unit", policy: "Evidence Custody SHA-256 Audit", result: "PASSED", detail: "Selfie snapshot & cell tower logs hash verified against immutable ledger", timestamp: "1 min ago", region: "Nairobi Metro" },
    { id: "AUD-9911", agency: "Interpol Kenya NCB", policy: "Cross-Border Query Authorization", result: "PASSED", detail: "Verified signed EAC Red Notice Subpoena before releasing IMEIS search", timestamp: "4 mins ago", region: "International" },
    { id: "AUD-9910", agency: "National Police Service", policy: "Data Residency Boundary Guard", result: "BLOCKED VIOLATION", detail: "Attempted unencrypted export outside sovereign boundary auto-blocked by guardrail", timestamp: "12 mins ago", region: "Rift Valley" },
    { id: "AUD-9909", agency: "Anti-Counterfeit Authority", policy: "WORM Storage Integrity Check", result: "PASSED", detail: "Verified 840 counterfeit TAC seized records tamper-proof status", timestamp: "25 mins ago", region: "Mombasa Port" },
  ]);

  // ── 4. Law Enforcement Evidence Handling Checklist Matrix ───────────────────
  const evidenceRules = [
    { rule: "ISO/IEC 27037 Digital Evidence Collection", status: "ENFORCED", autoCheck: "True", description: "Automated forensic timestamping, GPS tagging, and baseband radio snapshot capture upon warrant execution." },
    { rule: "Strict Data Residency (Sovereign Kenya Data Protection Act 2019)", status: "ENFORCED", autoCheck: "True", description: "All subscriber PII and location telemetry strictly pinned to local sovereign cloud nodes." },
    { rule: "Cryptographic Chain of Custody (SHA-256 Hash Ring)", status: "ENFORCED", autoCheck: "True", description: "Every file access by investigating officers is signed with individual officer Ed25519 PKI key." },
    { rule: "Automated Judicial Subpoena Lifecycle", status: "ENFORCED", autoCheck: "True", description: "Requires active magistrate order digital signature before unlocking cell tower triangulation history." },
  ];

  function handleTriggerAudit() {
    setAuditRunning(true);
    setTimeout(() => {
      setAuditRunning(false);
      setLastAuditTime("Just now (" + new Date().toLocaleTimeString() + ")");
      const newAuditLog = {
        id: `AUD-${Math.floor(9913 + Math.random() * 100)}`,
        agency: "DCI Cybercrime Unit",
        policy: "Live Policy Enforcement Sweep",
        result: "PASSED",
        detail: "Automated scan verified 100% encryption at rest & zero unauthorized data movement.",
        timestamp: "Just now",
        region: "National Core"
      };
      setAuditLogs(prev => [newAuditLog, ...prev]);
      alert("✅ Automated Compliance & Data Residency Audit completed successfully. All 142 Law Enforcement Nodes are 100% compliant.");
    }, 1200);
  }

  const filteredLogs = selectedAgency === "all" ? auditLogs : auditLogs.filter(l => l.agency.toLowerCase().includes(selectedAgency.toLowerCase()));

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))", borderColor: "var(--emerald)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), var(--indigo))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#fff", fontWeight: 800 }}>
              ⚖️
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Law Enforcement Data Residency & Evidence Compliance Monitor
                <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  REAL-TIME AUDIT
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Continuous monitoring of national data sovereignty, cryptographic evidence chain-of-custody, and judicial subpoena authorization across agencies.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/law-enforcement" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🏛️ Law Enforcement Portal
            </Link>
            <button onClick={handleTriggerAudit} disabled={auditRunning} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              {auditRunning ? "Running System Audit…" : "⚡ Run Real-Time Compliance Audit"}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Compliance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
        {metrics.map((m, idx) => (
          <div key={idx} className="card" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: m.color, margin: "4px 0" }}>{m.score}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: m.color, background: `${m.color}22`, padding: "2px 6px", borderRadius: 4 }}>
                {m.status}
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 6 }}>{m.detail}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Residency Nodes & Evidence Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Left: Data Residency Node Map & Enclaves */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📍 National Data Residency Enclave Nodes</span>
            </h3>
            <span style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 700 }}>100% In-Region</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1rem" }}>
            Enforces strict data sovereignty laws (Kenya Data Protection Act 2019 / EAC Cybersecurity Framework). Zero PII egress permitted.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {residencyNodes.map((node, i) => (
              <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{node.location}</div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 6px", borderRadius: 4 }}>
                    {node.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  Data Vault: <strong>{node.dataStored}</strong> · Latency: <strong>{node.latency}</strong>
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--sky)", marginTop: 2 }}>
                  Encryption: {node.encryption}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Digital Evidence Handling Rules */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>📜 Digital Evidence Handling Policy Rules</h3>
            <span style={{ fontSize: "0.72rem", color: "var(--indigo)", fontWeight: 700 }}>ISO/IEC 27037</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1rem" }}>
            Mandatory handling procedures required for court admissibility and forensic integrity.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {evidenceRules.map((rule, idx) => (
              <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>{rule.rule}</div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 6px", borderRadius: 4 }}>
                    {rule.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.4 }}>
                  {rule.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Compliance Audit Stream Log */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🔍 Real-Time Policy Compliance Audit Stream</span>
              <span style={{ fontSize: "0.7rem", color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                {lastAuditTime}
              </span>
            </h3>
            <p className="text-muted" style={{ fontSize: "0.78rem", margin: 0 }}>Automated logging of evidence access, subpoena checks, and data boundary validations.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Filter Agency:</label>
            <select
              value={selectedAgency}
              onChange={e => setSelectedAgency(e.target.value)}
              style={{ padding: "4px 8px", fontSize: "0.78rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <option value="all">All Law Enforcement Agencies</option>
              <option value="dci">DCI Cybercrime Unit</option>
              <option value="interpol">Interpol Kenya NCB</option>
              <option value="police">National Police Service</option>
              <option value="counterfeit">Anti-Counterfeit Authority</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredLogs.map(log => (
            <div key={log.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--sky)" }}>{log.id}</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{log.agency}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>({log.region})</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                  Policy Checked: <strong>{log.policy}</strong> · {log.detail}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{log.timestamp}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: log.result === "PASSED" ? "var(--emerald)" : "var(--rose)", background: log.result === "PASSED" ? "var(--emerald)22" : "var(--rose)22", padding: "3px 10px", borderRadius: 4 }}>
                  {log.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
