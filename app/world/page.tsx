"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SimTraceWorldPage() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "identity"
    | "trust"
    | "intelligence"
    | "automation"
    | "collaboration"
    | "ai_copilot"
    | "integration"
    | "governance"
    | "analytics"
  >("overview");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // ── 1. UNIVERSAL IDENTITY STATE ───────────────────────────────────────────
  interface IdentityRecord {
    id: string;
    entityName: string;
    entityType: "USER" | "ORGANIZATION" | "DEVICE" | "ASSET" | "API_SERVICE" | "BOT_AGENT";
    federationProtocol: "SAML 2.0" | "OIDC / OAuth2" | "mTLS + DID" | "Hardware Key (FIDO2)";
    status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "REVOKED";
    trustScore: number; // 0-100
    issuerRegion: string;
    lastAuth: string;
    authFactor: "3FA (Biometric + HSM + OTP)" | "2FA (Hardware + PIN)" | "mTLS Cert";
  }

  const [identities, setIdentities] = useState<IdentityRecord[]>([
    {
      id: "ID-ORG-SAFARICOM",
      entityName: "Safaricom PLC Enterprise Enclave",
      entityType: "ORGANIZATION",
      federationProtocol: "OIDC / OAuth2",
      status: "ACTIVE",
      trustScore: 98,
      issuerRegion: "AWS africa-south-1 (Nairobi)",
      lastAuth: "Just now",
      authFactor: "3FA (Biometric + HSM + OTP)",
    },
    {
      id: "ID-DEV-IMEI-88390",
      entityName: "Apple iPhone 15 Pro (IMEI: 354892110293841)",
      entityType: "DEVICE",
      federationProtocol: "mTLS + DID",
      status: "ACTIVE",
      trustScore: 94,
      issuerRegion: "Sovereign eSIM Trust Zone",
      lastAuth: "2 mins ago",
      authFactor: "mTLS Cert",
    },
    {
      id: "ID-USR-DCI-CHIEF",
      entityName: "Inspector General / DCI Cyber Division",
      entityType: "USER",
      federationProtocol: "SAML 2.0",
      status: "ACTIVE",
      trustScore: 99,
      issuerRegion: "National Security Enclave",
      lastAuth: "12 mins ago",
      authFactor: "3FA (Biometric + HSM + OTP)",
    },
    {
      id: "ID-SVC-GEMINI-AI",
      entityName: "Gemini 1.5 Flash Neural Copilot Proxy",
      entityType: "API_SERVICE",
      federationProtocol: "Hardware Key (FIDO2)",
      status: "ACTIVE",
      trustScore: 97,
      issuerRegion: "Global Sovereign AI Gateway",
      lastAuth: "Sub-second",
      authFactor: "2FA (Hardware + PIN)",
    },
    {
      id: "ID-AST-CARGO-7710",
      entityName: "Mombasa Port Container Scanner #409",
      entityType: "ASSET",
      federationProtocol: "mTLS + DID",
      status: "ACTIVE",
      trustScore: 91,
      issuerRegion: "KRA Customs Gateway",
      lastAuth: "4 mins ago",
      authFactor: "mTLS Cert",
    },
  ]);

  const [idFilter, setIdFilter] = useState<string>("ALL");
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityRecord | null>(null);

  // ── 2. UNIVERSAL TRUST ENGINE STATE ────────────────────────────────────────
  interface TrustFactor {
    name: string;
    weight: number;
    score: number;
    description: string;
  }

  const [trustSimulation, setTrustSimulation] = useState({
    hardwareSecurityScore: 95,
    networkReputationScore: 90,
    complianceStatusScore: 100,
    historicalBehaviorScore: 88,
    aiAnomalyDeduction: 0,
  });

  const calculatedTrustScore = Math.max(
    0,
    Math.round(
      (trustSimulation.hardwareSecurityScore * 0.3 +
        trustSimulation.networkReputationScore * 0.25 +
        trustSimulation.complianceStatusScore * 0.25 +
        trustSimulation.historicalBehaviorScore * 0.2) -
        trustSimulation.aiAnomalyDeduction
    )
  );

  // ── 3. UNIVERSAL INTELLIGENCE STATE ───────────────────────────────────────
  interface ThreatAlert {
    id: string;
    timestamp: string;
    type: "SIM_SWAP_BURST" | "CROSS_BORDER_IMEI_CLONE" | "UNAUTHORIZED_HSM_ACCESS" | "GEOPOLITICAL_ENCLAVE_SPIKE";
    threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    affectedRegion: string;
    confidencePercent: number;
    status: "ACTIVE_MITIGATION" | "INVESTIGATING" | "RESOLVED";
    summary: string;
  }

  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([
    {
      id: "ALT-9041",
      timestamp: "10:14:02 UTC",
      type: "CROSS_BORDER_IMEI_CLONE",
      threatLevel: "CRITICAL",
      affectedRegion: "Uganda-Kenya Border Corridor",
      confidencePercent: 98.4,
      status: "ACTIVE_MITIGATION",
      summary: "Detected 412 cloned TAC signatures transmitting simultaneously on Safaricom & MTN nodes.",
    },
    {
      id: "ALT-9042",
      timestamp: "09:58:30 UTC",
      type: "SIM_SWAP_BURST",
      threatLevel: "HIGH",
      affectedRegion: "Nairobi Financial District",
      confidencePercent: 92.1,
      status: "INVESTIGATING",
      summary: "High frequency SIM swap requests originating from unverified USSD proxy gateways.",
    },
    {
      id: "ALT-9043",
      timestamp: "08:30:15 UTC",
      type: "UNAUTHORIZED_HSM_ACCESS",
      threatLevel: "MEDIUM",
      affectedRegion: "AWS africa-south-1 Node Enclave",
      confidencePercent: 87.5,
      status: "RESOLVED",
      summary: "Hardware Security Module signature challenge failed for legacy API key attempt. Blocked.",
    },
  ]);

  // ── 4. UNIVERSAL AUTOMATION STATE ─────────────────────────────────────────
  interface WorkflowPipeline {
    id: string;
    title: string;
    trigger: string;
    actionsCount: number;
    status: "ENABLED" | "PAUSED" | "DRAFT";
    lastRun: string;
    executionsTotal: number;
  }

  const [workflows, setWorkflows] = useState<WorkflowPipeline[]>([
    {
      id: "WF-AUTOM-001",
      title: "Stolen Device Instant Multi-Carrier Blacklist & Police Alert",
      trigger: "Consumer Report / Police Docket File",
      actionsCount: 5,
      status: "ENABLED",
      lastRun: "3 mins ago",
      executionsTotal: 14820,
    },
    {
      id: "WF-AUTOM-002",
      title: "Automatic Quota Scaling & Throttling Enforcement",
      trigger: "Tenant Storage or RPS > 85%",
      actionsCount: 3,
      status: "ENABLED",
      lastRun: "12 mins ago",
      executionsTotal: 3410,
    },
    {
      id: "WF-AUTOM-003",
      title: "Cross-Border Fraud Chain Intelligence Synthesis",
      trigger: "Cron: Hourly Anomaly Sweep",
      actionsCount: 6,
      status: "ENABLED",
      lastRun: "44 mins ago",
      executionsTotal: 890,
    },
  ]);

  // ── 5. UNIVERSAL COLLABORATION STATE ──────────────────────────────────────
  interface JointInvestigation {
    id: string;
    title: string;
    leadAgency: string;
    partnerOrgs: string[];
    evidenceItems: number;
    classification: "RESTRICTED GOV" | "INTER-REGIONAL" | "COMMERCIAL SOVEREIGN";
    status: "OPEN" | "EVIDENCE_REVIEW" | "CLOSED";
  }

  const [investigations, setInvestigations] = useState<JointInvestigation[]>([
    {
      id: "INV-2026-904",
      title: "Operation Shield: East Africa Counter-Smuggling Taskforce",
      leadAgency: "DCI Kenya Cyber Division",
      partnerOrgs: ["Uganda Police Force", "Safaricom CEIR Unit", "INTERPOL EAPCCO"],
      evidenceItems: 142,
      classification: "RESTRICTED GOV",
      status: "OPEN",
    },
    {
      id: "INV-2026-882",
      title: "Global Supply Chain Counterfeit Device Interception",
      leadAgency: "SimTrace Global Trust Network",
      partnerOrgs: ["Apple Security Risk Ops", "KRA Customs", "DHL Express Aviation"],
      evidenceItems: 89,
      classification: "INTER-REGIONAL",
      status: "EVIDENCE_REVIEW",
    },
  ]);

  // ── 6. UNIVERSAL AI & OVERSIGHT STATE ─────────────────────────────────────
  interface OversightItem {
    id: string;
    title: string;
    aiRecommendation: string;
    confidence: number;
    impactLevel: "CRITICAL (Legal Freeze)" | "HIGH (Carrier Drop)" | "MEDIUM (Throttle)";
    requestedAt: string;
    status: "PENDING_HUMAN_APPROVAL" | "APPROVED" | "REJECTED";
  }

  const [oversightQueue, setOversightQueue] = useState<OversightItem[]>([
    {
      id: "OVR-701",
      title: "Block 1,200 Cloned TAC Series Across Regional MNO Towers",
      aiRecommendation: "Approve temporary regional IMEI spectrum lock for 24 hours while DCI verifies batch shipment logs.",
      confidence: 96.8,
      impactLevel: "CRITICAL (Legal Freeze)",
      requestedAt: "5 mins ago",
      status: "PENDING_HUMAN_APPROVAL",
    },
    {
      id: "OVR-702",
      title: "Isolate High-Risk Reseller Account (iSpot Dist hub)",
      aiRecommendation: "Suspend API token minting due to repeated unverified device registration attempts.",
      confidence: 91.2,
      impactLevel: "HIGH (Carrier Drop)",
      requestedAt: "18 mins ago",
      status: "PENDING_HUMAN_APPROVAL",
    },
  ]);

  // ── 7. UNIVERSAL INTEGRATION STATE ────────────────────────────────────────
  const [meshServices, setMeshServices] = useState([
    { name: "gRPC High-Throughput CEIR Stream", protocol: "gRPC / HTTP/2", port: 50051, latency: "1.4ms", status: "HEALTHY" },
    { name: "REST Public API Gateway v2", protocol: "REST / OpenAPI 3.1", port: 443, latency: "8.2ms", status: "HEALTHY" },
    { name: "Event-Driven Webhook Broker", protocol: "Kafka / CloudEvents", port: 9092, latency: "3.1ms", status: "HEALTHY" },
    { name: "GraphQL Unified Graph Engine", protocol: "GraphQL / Federated", port: 4000, latency: "12.0ms", status: "HEALTHY" },
    { name: "SAP & Oracle Enterprise Connector", protocol: "SOAP / Enterprise SDK", port: 8443, latency: "18.5ms", status: "HEALTHY" },
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "1.5rem" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 10000, background: "var(--surface)", border: "1px solid var(--sky)", color: "var(--sky)", padding: "0.85rem 1.2rem", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)", border: "1px solid var(--sky)33", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--sky)", background: "var(--sky)22", padding: "2px 8px", borderRadius: 4, letterSpacing: "1px" }}>
                PHASE 22 REVISION
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 700 }}>● GLOBAL MESH ONLINE</span>
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: "0.3rem 0", color: "var(--text)" }}>
              🌐 SimTrace World Platform
            </h1>
            <p className="text-muted" style={{ fontSize: "0.9rem", margin: 0, maxWidth: 840 }}>
              The unified digital architecture delivering Universal Identity, Explainable Trust, Intelligence Synthesis, Workflow Automation, Multi-Agency Collaboration, and AI Governance across public and private sectors.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => showToast("SimTrace World Architecture Specifications & API Specs exported!")}
              className="btn-ghost"
              style={{ padding: "8px 14px", fontSize: "0.82rem", border: "1px solid var(--border)" }}
            >
              📄 Export Specs & Runbooks
            </button>

            <Link href="/dashboard" className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem", textDecoration: "none" }}>
              🗺️ Global Command Center
            </Link>
          </div>
        </div>

        {/* Global Architecture High-Level Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", marginTop: "1.25rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.75rem 0.9rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Federated Identities</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--sky)", marginTop: 2 }}>142.8M</div>
            <div style={{ fontSize: "0.7rem", color: "var(--emerald)", marginTop: 2 }}>mTLS + FIDO2 + SAML</div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.75rem 0.9rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Explainable Trust Engine</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--indigo)", marginTop: 2 }}>96.4 Avg</div>
            <div style={{ fontSize: "0.7rem", color: "var(--indigo)", marginTop: 2 }}>100% Vector Auditability</div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.75rem 0.9rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Real-Time Intelligence</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--emerald)", marginTop: 2 }}>42k req/sec</div>
            <div style={{ fontSize: "0.7rem", color: "var(--emerald)", marginTop: 2 }}>Fraud & Threat Detection</div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.75rem 0.9rem", borderRadius: 8 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Oversight Queue</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--amber)", marginTop: 2 }}>{oversightQueue.filter(q => q.status === "PENDING_HUMAN_APPROVAL").length} Pending</div>
            <div style={{ fontSize: "0.7rem", color: "var(--amber)", marginTop: 2 }}>Human-in-the-Loop Active</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "overview", label: "🪐 World Overview" },
          { id: "identity", label: "🆔 Universal Identity" },
          { id: "trust", label: "🛡️ Universal Trust" },
          { id: "intelligence", label: "🧠 Universal Intelligence" },
          { id: "automation", label: "⚡ Universal Automation" },
          { id: "collaboration", label: "🤝 Universal Collaboration" },
          { id: "ai_copilot", label: "🤖 Universal AI & Oversight" },
          { id: "integration", label: "🔌 Universal Integration" },
          { id: "governance", label: "🏛️ Universal Governance" },
          { id: "analytics", label: "📊 Universal Analytics" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id ? "btn-primary" : "btn-ghost"}
            style={{
              padding: "7px 14px",
              fontSize: "0.82rem",
              whiteSpace: "nowrap",
              border: activeTab === tab.id ? "none" : "1px solid var(--border)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: WORLD OVERVIEW ────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Architecture Visual Map */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🏛️ Modular Cloud-Native World Architecture</h3>
                <p className="text-muted" style={{ fontSize: "0.83rem", margin: "2px 0 0 0" }}>
                  10 Core Platform Pillars supporting sovereign governments, telecom operators, enterprise hubs, and international security agencies.
                </p>
              </div>
              <span style={{ fontSize: "0.75rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "3px 10px", borderRadius: 12, fontWeight: 800 }}>
                100% SLA OBSERVED
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--sky)44", padding: "1.1rem", borderRadius: 10 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--sky)", marginBottom: 4 }}>
                  🆔 1. Universal Identity Platform
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  Unified directory for users, orgs, hardware devices, asset chips, and AI services with SAML 2.0, OIDC, and mTLS DID credentials.
                </p>
                <button onClick={() => setActiveTab("identity")} className="btn-ghost" style={{ fontSize: "0.75rem", marginTop: 10, padding: "3px 8px", border: "1px solid var(--sky)" }}>
                  Manage Directory →
                </button>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--indigo)44", padding: "1.1rem", borderRadius: 10 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--indigo)", marginBottom: 4 }}>
                  🛡️ 2. Explainable Trust Scoring
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  Transparent multi-vector trust score calculation combining hardware security, compliance state, network posture, and AI telemetry.
                </p>
                <button onClick={() => setActiveTab("trust")} className="btn-ghost" style={{ fontSize: "0.75rem", marginTop: 10, padding: "3px 8px", border: "1px solid var(--indigo)" }}>
                  Inspect Engine →
                </button>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--emerald)44", padding: "1.1rem", borderRadius: 10 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--emerald)", marginBottom: 4 }}>
                  🧠 3. Intelligence & Threat Brain
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  Real-time cross-border fraud detection, threat vector forecasting, IMEI cloning prevention, and contextual risk insights.
                </p>
                <button onClick={() => setActiveTab("intelligence")} className="btn-ghost" style={{ fontSize: "0.75rem", marginTop: 10, padding: "3px 8px", border: "1px solid var(--emerald)" }}>
                  Live Anomaly Stream →
                </button>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--amber)44", padding: "1.1rem", borderRadius: 10 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--amber)", marginBottom: 4 }}>
                  🤖 4. AI Platform & Human Oversight
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  Gemini 1.5 Flash Copilots, semantic search over national registries, and strict human-in-the-loop approval queues for legal actions.
                </p>
                <button onClick={() => setActiveTab("ai_copilot")} className="btn-ghost" style={{ fontSize: "0.75rem", marginTop: 10, padding: "3px 8px", border: "1px solid var(--amber)" }}>
                  Oversight Queue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: UNIVERSAL IDENTITY ────────────────────────────────────── */}
      {activeTab === "identity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🆔 Universal Identity Directory & Lifecycle Engine</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Cryptographic identity provisioning for users, devices, organizations, assets, and automated service agents.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["ALL", "USER", "ORGANIZATION", "DEVICE", "API_SERVICE"].map(type => (
                  <button
                    key={type}
                    onClick={() => setIdFilter(type)}
                    className={idFilter === type ? "btn-primary" : "btn-ghost"}
                    style={{ padding: "4px 10px", fontSize: "0.75rem", border: "1px solid var(--border)" }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {identities
                .filter(i => idFilter === "ALL" || i.entityType === idFilter)
                .map(item => (
                  <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.85rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 800, color: "var(--sky)" }}>{item.id}</span>
                        <strong style={{ fontSize: "0.95rem" }}>{item.entityName}</strong>
                        <span style={{ fontSize: "0.7rem", background: "var(--indigo)22", color: "var(--indigo)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {item.entityType}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                        Federation: <strong>{item.federationProtocol}</strong> · Auth Factor: <strong>{item.authFactor}</strong> · Region: <strong>{item.issuerRegion}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Trust Index</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: item.trustScore >= 95 ? "var(--emerald)" : "var(--amber)" }}>
                          {item.trustScore} / 100
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedIdentity(item);
                          showToast(`Minted OAuth2 / mTLS Token Session for ${item.id}`);
                        }}
                        className="btn-ghost"
                        style={{ padding: "5px 12px", fontSize: "0.78rem", border: "1px solid var(--sky)", color: "var(--sky)" }}
                      >
                        🔑 Issue Token
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: UNIVERSAL TRUST ───────────────────────────────────────── */}
      {activeTab === "trust" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🛡️ Explainable Trust Engine & Scenario Simulator</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1.25rem 0" }}>
              Transparent trust score calculations powered by explainable vector decomposition. Adjust values below to stress test policy triggers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Sliders Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "var(--bg)", padding: "1.2rem", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                    <label style={{ fontWeight: 700 }}>🔒 Hardware Security & TPM Score (30%)</label>
                    <span style={{ fontWeight: 800, color: "var(--sky)" }}>{trustSimulation.hardwareSecurityScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trustSimulation.hardwareSecurityScore}
                    onChange={e => setTrustSimulation({ ...trustSimulation, hardwareSecurityScore: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                    <label style={{ fontWeight: 700 }}>🌐 Network & IP Telemetry Posture (25%)</label>
                    <span style={{ fontWeight: 800, color: "var(--indigo)" }}>{trustSimulation.networkReputationScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trustSimulation.networkReputationScore}
                    onChange={e => setTrustSimulation({ ...trustSimulation, networkReputationScore: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                    <label style={{ fontWeight: 700 }}>⚖️ Regulatory Compliance & Residency (25%)</label>
                    <span style={{ fontWeight: 800, color: "var(--emerald)" }}>{trustSimulation.complianceStatusScore}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={trustSimulation.complianceStatusScore}
                    onChange={e => setTrustSimulation({ ...trustSimulation, complianceStatusScore: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                    <label style={{ fontWeight: 700 }}>🚨 AI Anomaly Penalty Deduction</label>
                    <span style={{ fontWeight: 800, color: "var(--rose)" }}>-{trustSimulation.aiAnomalyDeduction} pts</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={trustSimulation.aiAnomalyDeduction}
                    onChange={e => setTrustSimulation({ ...trustSimulation, aiAnomalyDeduction: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Calculated Result Output */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.2rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>EXPLAINABLE TRUST COMPOSITE INDEX</div>
                <div style={{ fontSize: "3.5rem", fontWeight: 900, color: calculatedTrustScore >= 85 ? "var(--emerald)" : calculatedTrustScore >= 60 ? "var(--amber)" : "var(--rose)", margin: "0.5rem 0" }}>
                  {calculatedTrustScore} / 100
                </div>

                <div style={{ fontSize: "0.82rem", fontWeight: 700, padding: "4px 12px", borderRadius: 12, background: calculatedTrustScore >= 85 ? "var(--emerald)22" : "var(--amber)22", color: calculatedTrustScore >= 85 ? "var(--emerald)" : "var(--amber)" }}>
                  {calculatedTrustScore >= 85 ? "✅ ZERO TRUST TRUSTED ENTITY" : "⚠️ CONDITIONAL ACCESS / EXTRA MFA REQUIRED"}
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", marginTop: "1rem", maxWidth: 320 }}>
                  Auditable cryptographically signed trust certificate generated dynamically per session.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: UNIVERSAL INTELLIGENCE ───────────────────────────────── */}
      {activeTab === "intelligence" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🧠 Live Anomaly Stream & Threat Analysis</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1rem 0" }}>
              Contextual insights and automated cross-border fraud vector mitigation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {threatAlerts.map(alert => (
                <div key={alert.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 800, color: "var(--sky)" }}>{alert.id}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: alert.threatLevel === "CRITICAL" ? "var(--rose)22" : "var(--amber)22", color: alert.threatLevel === "CRITICAL" ? "var(--rose)" : "var(--amber)" }}>
                        {alert.threatLevel}
                      </span>
                      <strong style={{ fontSize: "0.95rem" }}>{alert.type}</strong>
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "var(--text)", margin: "0.4rem 0 0 0" }}>{alert.summary}</p>

                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
                      Region: <strong>{alert.affectedRegion}</strong> · AI Confidence: <strong>{alert.confidencePercent}%</strong> · Timestamp: <strong>{alert.timestamp}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setThreatAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: "RESOLVED" } : a));
                      showToast(`Threat Alert ${alert.id} marked RESOLVED with automated firewall rule update.`);
                    }}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                  >
                    ⚡ Mitigate & Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: UNIVERSAL AUTOMATION ──────────────────────────────────── */}
      {activeTab === "automation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>⚡ Universal Workflow Automation Core</h3>
                <p className="text-muted" style={{ fontSize: "0.83rem", margin: 0 }}>
                  Reusable event-driven workflows, SLA escalation triggers, background pipelines, and AI reporting automation.
                </p>
              </div>

              <button
                onClick={() => {
                  const newWf: WorkflowPipeline = {
                    id: `WF-AUTOM-00${workflows.length + 1}`,
                    title: "Custom Multi-Agency Escalation Pipeline",
                    trigger: "Custom Webhook Event",
                    actionsCount: 4,
                    status: "ENABLED",
                    lastRun: "Just now",
                    executionsTotal: 1,
                  };
                  setWorkflows([newWf, ...workflows]);
                  showToast("Created new workflow: Custom Multi-Agency Escalation Pipeline!");
                }}
                className="btn-primary"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
              >
                + Create Workflow
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {workflows.map(wf => (
                <div key={wf.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.85rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 800, color: "var(--sky)" }}>{wf.id}</span>
                      <strong style={{ fontSize: "0.95rem" }}>{wf.title}</strong>
                      <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                        {wf.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                      Trigger: <strong>{wf.trigger}</strong> · Actions: <strong>{wf.actionsCount} steps</strong> · Executions: <strong>{wf.executionsTotal.toLocaleString()}</strong> · Last run: <strong>{wf.lastRun}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => showToast(`Manually triggered workflow pipeline ${wf.id}!`)}
                    className="btn-ghost"
                    style={{ padding: "5px 12px", fontSize: "0.78rem", border: "1px solid var(--sky)", color: "var(--sky)" }}
                  >
                    ▶️ Run Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5.5: UNIVERSAL COLLABORATION ─────────────────────────────── */}
      {activeTab === "collaboration" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🤝 Cross-Agency Joint Investigation Workspace</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1rem 0" }}>
              Secure federated collaboration hub linking law enforcement, telecom anti-fraud units, and border customs.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {investigations.map(inv => (
                <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 800, color: "var(--sky)" }}>{inv.id}</span>
                      <h4 style={{ fontSize: "1rem", margin: "2px 0 0 0" }}>{inv.title}</h4>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                        Lead Agency: <strong>{inv.leadAgency}</strong> · Evidence Vault: <strong>{inv.evidenceItems} Cryptographic Hash Logs</strong>
                      </div>
                    </div>

                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: 12, background: "var(--indigo)22", color: "var(--indigo)" }}>
                      {inv.classification}
                    </span>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Federated Partners:</span>
                    {inv.partnerOrgs.map((partner, pIdx) => (
                      <span key={pIdx} style={{ fontSize: "0.72rem", background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 4 }}>
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: UNIVERSAL AI & OVERSIGHT ──────────────────────────────── */}
      {activeTab === "ai_copilot" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🤖 Human-in-the-Loop AI Oversight Queue</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1rem 0" }}>
              SimTrace AI Governance requires explicit human sign-off for high-impact actions (e.g., regional spectrum freezes, device blacklists).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {oversightQueue.map(item => (
                <div key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.6rem" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 800, color: "var(--sky)" }}>{item.id}</span>
                      <h4 style={{ fontSize: "1rem", margin: "2px 0 0 0" }}>{item.title}</h4>
                    </div>

                    <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: 12, background: "var(--rose)22", color: "var(--rose)", border: "1px solid var(--rose)44" }}>
                      {item.impactLevel}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.83rem", color: "var(--muted)", background: "var(--bg)", padding: "0.75rem", borderRadius: 6, border: "1px solid var(--border)", margin: "0 0 0.85rem 0" }}>
                    🤖 <strong>AI Recommendation (Gemini 1.5 Flash - {item.confidence}% confidence):</strong> {item.aiRecommendation}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Requested: {item.requestedAt}</span>

                    {item.status === "PENDING_HUMAN_APPROVAL" ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => {
                            setOversightQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "REJECTED" } : q));
                            showToast(`Action ${item.id} REJECTED by Human Operator.`);
                          }}
                          className="btn-ghost"
                          style={{ padding: "6px 12px", fontSize: "0.78rem", border: "1px solid var(--rose)", color: "var(--rose)" }}
                        >
                          ✕ Reject Action
                        </button>
                        <button
                          onClick={() => {
                            setOversightQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "APPROVED" } : q));
                            showToast(`Action ${item.id} APPROVED by Human Operator. Executed across Cloud Mesh!`);
                          }}
                          className="btn-primary"
                          style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                        >
                          ✓ Authorize & Execute
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: item.status === "APPROVED" ? "var(--emerald)" : "var(--rose)" }}>
                        STATUS: {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: UNIVERSAL INTEGRATION ─────────────────────────────────── */}
      {activeTab === "integration" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🔌 Service Mesh & API Integration Gateway</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1rem 0" }}>
              High-availability protocols connecting global MNOs, law enforcement backends, and commercial supply chain APIs.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {meshServices.map((svc, idx) => (
                <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.72rem", background: "var(--sky)22", color: "var(--sky)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {svc.protocol}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--emerald)", fontWeight: 800 }}>● {svc.status}</span>
                  </div>

                  <strong style={{ fontSize: "0.92rem", display: "block", marginBottom: 4 }}>{svc.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    Port: <strong>{svc.port}</strong> · Latency: <strong>{svc.latency}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: UNIVERSAL GOVERNANCE ──────────────────────────────────── */}
      {activeTab === "governance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>🏛️ Global Regulatory & AI Safety Governance Suite</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1.25rem 0" }}>
              Automated policy compliance verification across international standards (ISO-27001, SOC2 Type II, GDPR Art 32, EAC-CEIR, ITU-T).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                { standard: "ISO-27001 / 27701", scope: "Information Security & Privacy Management", status: "COMPLIANT", score: "99.8%" },
                { standard: "SOC2 Type II", scope: "Security, Availability & Confidentiality Trust Criteria", status: "COMPLIANT", score: "100%" },
                { standard: "GDPR Article 32 & 44", scope: "Cross-Border Sovereign Cryptographic Data Safeguards", status: "ENFORCED", score: "100%" },
                { standard: "EAC-CEIR Framework v4", scope: "East African Community Telecom Equipment Identification", status: "CERTIFIED", score: "100%" },
                { standard: "ITU-T X.1254", scope: "Entity Authentication Assurance Framework", status: "VERIFIED", score: "99.4%" },
              ].map((gov, idx) => (
                <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--sky)" }}>{gov.standard}</span>
                    <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
                      {gov.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, margin: "6px 0 4px 0" }}>{gov.scope}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Audit Pass Index: <strong>{gov.score}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: UNIVERSAL ANALYTICS ───────────────────────────────────── */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0" }}>📊 Universal Platform Analytics & Telemetry</h3>
            <p className="text-muted" style={{ fontSize: "0.83rem", margin: "0 0 1.25rem 0" }}>
              Comprehensive executive, operational, security, and AI telemetry dashboards.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--sky)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Global API Requests / Day</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--sky)", marginTop: 4 }}>3.64 Billion</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 2 }}>↑ 12.4% vs last week</div>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--emerald)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Stolen Devices Intercepted</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--emerald)", marginTop: 4 }}>48,920</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 2 }}>100% Legal Chain of Custody</div>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--indigo)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Average Mesh Latency</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--indigo)", marginTop: 4 }}>4.2ms RTT</div>
                <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 2 }}>Direct IXP BGP Peering</div>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--amber)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Inference Telemetry</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--amber)", marginTop: 4 }}>140ms Avg</div>
                <div style={{ fontSize: "0.72rem", color: "var(--amber)", marginTop: 2 }}>Gemini 1.5 Flash Vision OCR</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

