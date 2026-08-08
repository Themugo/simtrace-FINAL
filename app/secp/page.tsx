"use client";

import React, { useState } from "react";

// Types for SECP Modules
type SECPTab =
  | "overview"
  | "product"
  | "release"
  | "aiops"
  | "customer_success"
  | "knowledge"
  | "bi"
  | "commercial"
  | "support"
  | "engineering"
  | "innovation";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  environment: string;
  enabled: boolean;
  rolloutPercentage: number;
  description: string;
}

interface Ticket {
  id: string;
  tenant: string;
  subject: string;
  priority: "P1-CRITICAL" | "P2-HIGH" | "P3-MEDIUM" | "P4-LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  slaTimeRemaining: string;
  assignedTo: string;
}

interface ADRItem {
  id: string;
  title: string;
  status: "ACCEPTED" | "PROPOSED" | "SUPERSEDED";
  date: string;
  author: string;
  summary: string;
}

export default function SECPPage() {
  const [activeTab, setActiveTab] = useState<SECPTab>("overview");
  const [activeSprint, setActiveSprint] = useState("Sprint 42 - Cloud Scale");
  const [searchQuery, setSearchQuery] = useState("");

  // Feature Flags State
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: "ff-1", key: "enable_gemini_ocr_v2", name: "Gemini 1.5 Flash Forensic OCR v2", environment: "Production", enabled: true, rolloutPercentage: 100, description: "Accelerates receipt & box IMEI extraction speed by 40%" },
    { id: "ff-2", key: "canary_multi_region_failover", name: "Canary Multi-Region Auto-Failover", environment: "Production", enabled: true, rolloutPercentage: 25, description: "Automated RTO <30s failover to DR secondary enclave" },
    { id: "ff-3", key: "ai_incident_auto_remediation", name: "AIOps Automated Incident Self-Healing", environment: "Staging", enabled: true, rolloutPercentage: 50, description: "Auto-remediates memory leaks and node exhaustion" },
    { id: "ff-4", key: "mpesa_payout_escrow_v3", name: "M-Pesa Micro-Payout Instant Escrow", environment: "Production", enabled: false, rolloutPercentage: 0, description: "Instant compensation payouts for verified theft victims" },
  ]);

  // Support Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "TICK-9081", tenant: "Kenya Customs & Border", subject: "IMEI Bulk Verification Latency Spike in Nairobi Enclave", priority: "P1-CRITICAL", status: "IN_PROGRESS", slaTimeRemaining: "14 mins", assignedTo: "Dr. A. Omondi (SRE Lead)" },
    { id: "TICK-9082", tenant: "Safaricom Telecom Core", subject: "Request for SAML 2.0 Identity Federation Audit Log", priority: "P3-MEDIUM", status: "OPEN", slaTimeRemaining: "3 hrs 12 mins", assignedTo: "Identity Team" },
    { id: "TICK-9080", tenant: "Interpol East Africa", subject: "Cross-Border Theft Signal Replication Sync Delay", priority: "P2-HIGH", status: "IN_PROGRESS", slaTimeRemaining: "42 mins", assignedTo: "SecOps Core" },
    { id: "TICK-9079", tenant: "Jumia Marketplace Security", subject: "Commercial Fraud API Webhook Retry Configuration", priority: "P4-LOW", status: "RESOLVED", slaTimeRemaining: "Resolved", assignedTo: "DevRel Support" },
  ]);

  // Architecture Decision Records
  const [adrs, setAdrs] = useState<ADRItem[]>([
    { id: "ADR-041", title: "Adopt Drizzle ORM for Cloud SQL & PostgreSQL Migration", status: "ACCEPTED", date: "2026-06-15", author: "Lead Architect", summary: "Improves type safety and query generation speed for enterprise tenant records." },
    { id: "ADR-042", title: "Standardize on Gemini 1.5 Flash for Forensic Document Extraction", status: "ACCEPTED", date: "2026-07-02", author: "AI Director", summary: "Provides optimal balance of sub-200ms latency and high OCR accuracy." },
    { id: "ADR-043", title: "Implement Multi-Tenant Cloud Control Plane (SCP) Enclaves", status: "ACCEPTED", date: "2026-07-20", author: "Infrastructure SRE", summary: "Isolates national sovereign data per country with dedicated K8s namespaces." },
  ]);

  // AIOps Anomaly State
  const [anomalies, setAnomalies] = useState([
    { id: "ANO-101", metric: "PostgreSQL Connection Pool", anomaly: "+340% Spike in Waiting Connections", severeness: "HIGH", recommendation: "Auto-scale Cloud SQL connection pool limits and trigger query optimizer." },
    { id: "ANO-102", metric: "Kafka Ingestion Queue", anomaly: "Partition #4 Lag Exceeds 1,200 msgs", severeness: "MEDIUM", recommendation: "Rebalance consumer group workers in Nairobi worker pool." },
  ]);

  // Quoting Engine State
  const [quoteForm, setQuoteForm] = useState({
    clientName: "Uganda Revenue Authority & CEIR",
    cloudTier: "Enterprise Sovereign Enclave",
    nodes: 8,
    supportLevel: "24/7 Dedicated SRE & 15m SLA",
    durationMonths: 24,
  });

  const calculatedQuotePrice = Math.round(
    (quoteForm.nodes * 1800 + (quoteForm.cloudTier === "Enterprise Sovereign Enclave" ? 8500 : 4200) + (quoteForm.supportLevel.includes("15m") ? 3500 : 1200)) *
    (quoteForm.durationMonths >= 24 ? 0.85 : 1)
  );

  function toggleFlag(id: string) {
    setFeatureFlags(prev =>
      prev.map(f => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  }

  function handleCreateADR() {
    const title = prompt("Enter Architecture Decision Record (ADR) Title:");
    if (title) {
      const newADR: ADRItem = {
        id: `ADR-0${adrs.length + 44}`,
        title,
        status: "PROPOSED",
        date: new Date().toISOString().split("T")[0],
        author: "Enterprise Architect",
        summary: "Newly proposed architectural standard under review by Engineering Governance Board.",
      };
      setAdrs([newADR, ...adrs]);
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* ── HEADER BANNER ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🏢</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              SimTrace Enterprise Company Platform (SECP)
            </h1>
            <span style={{ fontSize: "0.72rem", background: "var(--sky)22", color: "var(--sky)", border: "1px solid var(--sky)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
              Phase 17 Enterprise Suite
            </span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, maxWidth: 820 }}>
            Unified operational OS for SimTrace product governance, enterprise release pipelines, AIOps telemetry, customer success, knowledge base, commercial engines, and engineering excellence.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Active Platform ARR</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--emerald)" }}>$14,280,000 / yr</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Global System Health</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--sky)" }}>99.999% SLA</div>
          </div>
        </div>
      </div>

      {/* ── TOP EXECUTIVE SUMMARY CARDS ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--sky)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Enterprise Tenants</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>48 Enclaves</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>+4 New This Quarter</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--emerald)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Active Sprints & Release</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>Sprint 42 (v4.8.0)</div>
          <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>Canary Rollout Active</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--indigo)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Customer Health Score</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>94.2 / 100</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>98.8% Renewal Rate</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--amber)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Open Support SLA</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>4 Active Tickets</div>
          <div style={{ fontSize: "0.72rem", color: "var(--amber)", marginTop: 4 }}>1 P1 Critical In-Progress</div>
        </div>
      </div>

      {/* ── NAVIGATION MODULE SWITCHER (10 PILLARS) ────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "overview", label: "📊 Executive Hub", icon: "🏢" },
          { id: "product", label: "🗺️ Product Mgmt", icon: "🗺️" },
          { id: "release", label: "🚀 Release Mgmt", icon: "🚀" },
          { id: "aiops", label: "🤖 AIOps & Health", icon: "🤖" },
          { id: "customer_success", label: "🤝 Customer Success", icon: "🤝" },
          { id: "knowledge", label: "📚 Knowledge Platform", icon: "📚" },
          { id: "bi", label: "📈 Business Intelligence", icon: "📈" },
          { id: "commercial", label: "💼 Commercial CPQ", icon: "💼" },
          { id: "support", label: "🎧 Enterprise Support", icon: "🎧" },
          { id: "engineering", label: "🛡️ Engineering Governance", icon: "🛡️" },
          { id: "innovation", label: "🧪 Innovation Lab", icon: "🧪" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SECPTab)}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: `1px solid ${activeTab === tab.id ? "var(--sky)" : "transparent"}`,
              background: activeTab === tab.id ? "var(--sky)22" : "transparent",
              color: activeTab === tab.id ? "var(--sky)" : "var(--muted)",
              fontWeight: activeTab === tab.id ? 800 : 500,
              fontSize: "0.82rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MODULE 1: EXECUTIVE HUB OVERVIEW ──────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🎯 Company Operational Strategy & Phase 17 Milestones
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
                SimTrace SECP orchestrates 10 core enterprise operations. Select a module from the navigation bar or use quick launcher controls below to inspect platform state.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.85rem" }}>
                {[
                  { title: "Product & Backlog Planning", desc: "Feature prioritization with RICE matrix, release planning & user story maps.", tab: "product" },
                  { title: "Release & Feature Flags", desc: "Blue/green deployments, canary testing & instant feature flag toggles.", tab: "release" },
                  { title: "AIOps & Root Cause Analysis", desc: "AI-driven anomaly detection, incident prediction & auto-remediation.", tab: "aiops" },
                  { title: "Customer Success & CSAT", desc: "Onboarding tracking, 0-100 tenant health scores & renewal forecasting.", tab: "customer_success" },
                  { title: "Knowledge Platform & ADRs", desc: "Architecture Decision Records, operational SOP runbooks & API docs.", tab: "knowledge" },
                  { title: "Commercial CPQ & Invoicing", desc: "Automated enterprise deal quoting, contract management & ARR analytics.", tab: "commercial" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTab(item.tab as SECPTab)}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      padding: "0.85rem",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--sky)", marginBottom: 4 }}>
                      {item.title} →
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Live Audit & Activity Stream */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginTop: 0, marginBottom: "0.75rem" }}>⚡ Real-Time Operational Stream</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.78rem" }}>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: 6 }}>
                  <span style={{ color: "var(--emerald)", fontWeight: 700 }}>[RELEASE]</span> Canary v4.8.0 deployed to 25% of Nairobi enclave traffic.
                </div>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: 6 }}>
                  <span style={{ color: "var(--sky)", fontWeight: 700 }}>[AIOPS]</span> Auto-healed Kafka queue partition lag in under 1.2s.
                </div>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: 6 }}>
                  <span style={{ color: "var(--amber)", fontWeight: 700 }}>[TICKET]</span> P1 Escalation opened by Kenya Customs (SLA 14m left).
                </div>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.5rem 0.75rem", borderRadius: 6 }}>
                  <span style={{ color: "var(--indigo)", fontWeight: 700 }}>[COMMERCIAL]</span> CPQ Quote generated for Uganda Revenue Authority ($34,800/mo).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 2: PRODUCT MANAGEMENT ──────────────────────────────────────── */}
      {activeTab === "product" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🗺️ Product Roadmap & Sprint Backlog (RICE Prioritized)</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Strategic product roadmap, sprint board, and customer feature feedback loop.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" onClick={() => alert("Simulated: Product Feature Creation Dialog Opened")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                  + Create Product Backlog Story
                </button>
              </div>
            </div>

            {/* Sprint Kanban Columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
              {[
                { title: "Backlog (RICE Pool)", color: "var(--muted)", items: [
                  { id: "ST-890", name: "Gemini 1.5 Pro Forensic Box Serial OCR", score: 8.4, epic: "AI Intelligence" },
                  { id: "ST-894", name: "Automated Interpol Stolen IMEI Dispatch Sync", score: 7.9, epic: "Cross-Border" },
                ]},
                { title: "Sprint 42 (In Dev)", color: "var(--sky)", items: [
                  { id: "ST-871", name: "Multi-Region Cloud Enclave SCP Wizard", score: 9.2, epic: "Cloud Infrastructure" },
                  { id: "ST-878", name: "Drizzle Schema Migration Engine", score: 8.8, epic: "Data Sovereignty" },
                ]},
                { title: "In Code Review", color: "var(--amber)", items: [
                  { id: "ST-865", name: "Law Enforcement Evidence Custody Hash Audit", score: 9.0, epic: "Compliance" },
                ]},
                { title: "Released to Staging", color: "var(--emerald)", items: [
                  { id: "ST-850", name: "Zero-Trust SAML 2.0 Carrier Federation", score: 9.5, epic: "Security" },
                ]},
              ].map((col, idx) => (
                <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: col.color, marginBottom: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
                    {col.title} ({col.items.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {col.items.map(item => (
                      <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.65rem", borderRadius: 6 }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--sky)", fontWeight: 700 }}>{item.id} • {item.epic}</div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, margin: "3px 0" }}>{item.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--emerald)", fontWeight: 700 }}>RICE Score: {item.score}/10</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 3: RELEASE MANAGEMENT ──────────────────────────────────────── */}
      {activeTab === "release" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🚀 Enterprise Release Management & Feature Flags</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Control feature rollouts, execute canary deployments, and trigger automated rollbacks across global sovereign enclaves.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {featureFlags.map(flag => (
                <div key={flag.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text)" }}>{flag.name}</span>
                      <code style={{ fontSize: "0.72rem", color: "var(--sky)", background: "var(--sky)15", padding: "1px 6px", borderRadius: 4 }}>{flag.key}</code>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 4 }}>{flag.environment}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>{flag.description}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ textAlign: "right", fontSize: "0.75rem" }}>
                      <div style={{ color: "var(--muted)" }}>Rollout Target</div>
                      <div style={{ fontWeight: 800, color: "var(--emerald)" }}>{flag.rolloutPercentage}% Traffic</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(flag.id)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 20,
                        border: "none",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: flag.enabled ? "var(--emerald)" : "var(--muted)",
                        color: "#fff",
                      }}
                    >
                      {flag.enabled ? "✓ ACTIVE" : "DISABLED"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 4: AI OPERATIONS (AIOPS) ──────────────────────────────────── */}
      {activeTab === "aiops" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🤖 AIOps Telemetry & Automated Incident Remediation</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Machine learning anomaly detection, incident prediction, and automated execution of diagnostic playbooks.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--amber)", marginTop: 0 }}>⚠️ Detected Anomalies & Predictive RCA</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {anomalies.map(ano => (
                    <div key={ano.id} style={{ background: "var(--bg)", border: "1px solid var(--amber)44", padding: "0.85rem", borderRadius: 8 }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--amber)", fontWeight: 800 }}>{ano.id} • SEVERITY: {ano.severeness}</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 800, margin: "2px 0" }}>{ano.metric}: {ano.anomaly}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>💡 Recommended AI Action: {ano.recommendation}</div>
                      <button
                        type="button"
                        onClick={() => alert(`🚀 Triggered Automated Remediation Playbook for ${ano.id}`)}
                        className="btn-primary"
                        style={{ padding: "4px 10px", fontSize: "0.72rem", marginTop: 8 }}
                      >
                        ⚡ Execute Auto-Healing Playbook
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.9rem", color: "var(--sky)", marginTop: 0 }}>📊 Live Capacity & Predictive Modeling</h4>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div>PostgreSQL Storage Utilization: <strong>34.2% (Estimated 180 days remaining)</strong></div>
                  <div>Gemini API Rate Limit Ceiling: <strong>14.2% of Enterprise Quota Used</strong></div>
                  <div>Kafka Message Throughput: <strong>24,500 msg/sec (Peak Load 48,000)</strong></div>
                  <div>Redis Cache Hit Ratio: <strong>99.4% Success Rate</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 5: CUSTOMER SUCCESS ────────────────────────────────────────── */}
      {activeTab === "customer_success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🤝 Customer Success & Health Scorecard</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Monitor tenant adoption, contract renewals, and automated CS health ratings.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { name: "Kenya Customs & Border", score: 98, status: "HEALTHY", arr: "$480,000", renewal: "2027-04-15" },
                { name: "Safaricom Telecom Core", score: 95, status: "HEALTHY", arr: "$1,200,000", renewal: "2026-11-30" },
                { name: "Uganda Revenue Authority", score: 82, status: "ATTENTION", arr: "$360,000", renewal: "2026-09-01" },
                { name: "Interpol East Africa", score: 99, status: "HEALTHY", arr: "$750,000", renewal: "2028-01-10" },
              ].map((tenant, idx) => (
                <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{tenant.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0" }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: tenant.score >= 90 ? "var(--emerald)" : "var(--amber)" }}>
                      {tenant.score} / 100
                    </div>
                    <span style={{ fontSize: "0.72rem", background: tenant.status === "HEALTHY" ? "var(--emerald)22" : "var(--amber)22", color: tenant.status === "HEALTHY" ? "var(--emerald)" : "var(--amber)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                      {tenant.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>ARR Value: <strong>{tenant.arr}</strong></div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Next Renewal: <strong>{tenant.renewal}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 6: KNOWLEDGE PLATFORM & ADRS ────────────────────────────────── */}
      {activeTab === "knowledge" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>📚 Centralized Knowledge Platform & Architecture Records (ADRs)</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Architecture decision log, standard operating procedure runbooks, and API documentation.
                </p>
              </div>
              <button type="button" onClick={handleCreateADR} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + Propose New ADR Record
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {adrs.map(adr => (
                <div key={adr.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 800, fontFamily: "var(--mono)" }}>{adr.id}</span>
                      <strong style={{ fontSize: "0.9rem" }}>{adr.title}</strong>
                    </div>
                    <span style={{ fontSize: "0.7rem", background: adr.status === "ACCEPTED" ? "var(--emerald)22" : "var(--amber)22", color: adr.status === "ACCEPTED" ? "var(--emerald)" : "var(--amber)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                      {adr.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "4px 0" }}>{adr.summary}</p>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
                    Author: {adr.author} • Date: {adr.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 7: BUSINESS INTELLIGENCE ──────────────────────────────────── */}
      {activeTab === "bi" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>📈 Strategic Business Intelligence & Financial Telemetry</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Real-time platform growth, revenue breakdown, and token usage metrics.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>NET RETENTION RATE (NRR)</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>128.4%</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Target: &gt; 120% Enterprise Grade</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>GROSS MARGIN PROFILE</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)", margin: "4px 0" }}>84.2%</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>AI & Infrastructure Cost Efficiency</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>ANNUALIZED CHURN RATE</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>0.82%</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Best-in-Class Sovereign SaaS</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 8: COMMERCIAL PLATFORM (CPQ) ───────────────────────────────── */}
      {activeTab === "commercial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>💼 Commercial Quoting & CPQ Estimator</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Generate enterprise proposals, custom contract pricing, and SLA tier terms.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Client Organization</label>
                <input
                  type="text"
                  value={quoteForm.clientName}
                  onChange={e => setQuoteForm({ ...quoteForm, clientName: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Sovereign Cloud Tier</label>
                  <select
                    value={quoteForm.cloudTier}
                    onChange={e => setQuoteForm({ ...quoteForm, cloudTier: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <option value="Enterprise Sovereign Enclave">Enterprise Sovereign Enclave</option>
                    <option value="Shared Multi-Tenant Core">Shared Multi-Tenant Core</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>K8s Worker Node Count ({quoteForm.nodes} Nodes)</label>
                  <input
                    type="range"
                    min={2}
                    max={32}
                    value={quoteForm.nodes}
                    onChange={e => setQuoteForm({ ...quoteForm, nodes: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--sky)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>ESTIMATED MONTHLY SUBSCRIPTION</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>${calculatedQuotePrice.toLocaleString()} / month</div>
                </div>
                <button type="button" onClick={() => alert(`🎉 Contract Quote generated for ${quoteForm.clientName} ($${calculatedQuotePrice}/mo)`)} className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
                  Generate Formal PDF Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 9: ENTERPRISE SUPPORT ──────────────────────────────────────── */}
      {activeTab === "support" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🎧 Enterprise Support Desk & Incident War Room</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Active SLA response tracking and AI-guided resolution recommendations.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tickets.map(t => (
                <div key={t.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: t.priority.includes("P1") ? "var(--rose)" : "var(--amber)", background: t.priority.includes("P1") ? "var(--rose)18" : "var(--amber)18", padding: "1px 6px", borderRadius: 4 }}>
                        {t.priority}
                      </span>
                      <strong style={{ fontSize: "0.88rem" }}>{t.subject}</strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                      Tenant: {t.tenant} • Assignee: {t.assignedTo}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>SLA Timer</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--sky)" }}>{t.slaTimeRemaining}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 10: ENGINEERING EXCELLENCE ────────────────────────────────── */}
      {activeTab === "engineering" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🛡️ Engineering Governance & Quality Gates</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Continuous Integration compliance, vulnerability scanning, and performance budget validation.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 4 }}>✓ ESLint & TypeScript Strict Mode</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>0 Syntax or Type errors detected in build pipeline.</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 4 }}>✓ Dependency CVE Vulnerability Scanner</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>All npm packages audited — 0 high vulnerabilities found.</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--sky)", marginBottom: 4 }}>✓ Automated Test Suite Coverage</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>94.8% Statement coverage across API & server endpoints.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 11: INNOVATION LAB ───────────────────────────────────────── */}
      {activeTab === "innovation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🧪 SimTrace Innovation Lab & AI Sandbox</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Experimental AI models, prototype testing, and beta customer research programs.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div><strong>Active AI Sandbox Experiment:</strong> Gemini 1.5 Flash vs. Gemini 1.5 Pro Forensic Box Serial OCR Accuracy Benchmark.</div>
              <div><strong>Current Results:</strong> Gemini 1.5 Flash yields 99.4% serial extraction accuracy with 140ms latency at 1/10th the token cost of Pro.</div>
              <button type="button" onClick={() => alert("🧪 AI Experimentation Benchmark Launched!")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.8rem", width: "fit-content" }}>
                🚀 Run Interactive Benchmark Testbed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
