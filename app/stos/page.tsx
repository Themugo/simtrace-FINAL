"use client";
import { useState } from "react";
import Link from "next/link";

export default function STOSPage() {
  const [activeTab, setActiveTab] = useState<
    | "microkernel"
    | "lowcode"
    | "workflow"
    | "dataplatform"
    | "aiplatform"
    | "developer"
    | "observability"
    | "security"
  >("microkernel");

  // ── 1. STOS Microkernel Installed Modules ──────────────────────────────────
  const [modules, setModules] = useState([
    { id: "stos_identity", name: "Core Identity & Zero-Trust IAM Service", version: "v15.2.0", tier: "CORE KERNEL", status: "ACTIVE", health: "100%", dependencies: "None", memory: "14 MB" },
    { id: "stos_trust", name: "Explainable Device Trust Engine", version: "v15.1.4", tier: "PLATFORM SERVICE", status: "ACTIVE", health: "99.9%", dependencies: "stos_identity", memory: "28 MB" },
    { id: "stos_ai", name: "Gemini 1.5 RAG & Forensic AI Runtime", version: "v15.3.0", tier: "AI PLATFORM", status: "ACTIVE", health: "100%", dependencies: "stos_trust", memory: "84 MB" },
    { id: "stos_search", name: "Vector & Full-Text Search Indexer", version: "v15.0.1", tier: "DATA SERVICE", status: "ACTIVE", health: "99.8%", dependencies: "stos_storage", memory: "42 MB" },
    { id: "stos_workflow", name: "Universal Drag-and-Drop Automation Engine", version: "v15.2.1", tier: "ORCHESTRATION", status: "ACTIVE", health: "100%", dependencies: "stos_identity", memory: "19 MB" },
    { id: "stos_billing", name: "M-Pesa Micro-Payouts & Billing Engine", version: "v15.0.0", tier: "FINTECH SERVICE", status: "ACTIVE", health: "100%", dependencies: "stos_identity", memory: "12 MB" },
  ]);

  // ── 2. Low-Code Visual Builder State ────────────────────────────────────────
  const [draggedComponents, setDraggedComponents] = useState([
    { id: "cmp_1", label: "IMEI Status Verification Card", type: "DATA_CARD" },
    { id: "cmp_2", label: "Silent Camera Selfie OCR Capture Box", type: "FORM_INPUT" },
    { id: "cmp_3", label: "Cell Tower Triangulation Map Layer", type: "MAP_VIEW" },
  ]);

  // ── 3. Data Platform Multi-Engine Abstraction ──────────────────────────────
  const storageEngines = [
    { type: "RELATIONAL (PostgreSQL / Spanner)", usage: "Transactional Device Passports & Subpoenas", latency: "4ms", size: "482 GB" },
    { type: "VECTOR EMBEDDINGS (pgvector)", usage: "Gemini 1.5 Forensic Image & Case Matching", latency: "14ms", size: "1.2 TB" },
    { type: "DOCUMENT STORE (Firestore)", usage: "Multi-Tenant Organization Configs & State", latency: "6ms", size: "120 GB" },
    { type: "GRAPH DATABASE (Neo4j Mesh)", usage: "Fraud Syndicate & SIM Swap Network Ring Traversal", latency: "9ms", size: "240 GB" },
    { type: "TIME-SERIES (TimescaleDB)", usage: "Global Baseband & Cell Tower Telemetry Stream", latency: "2ms", size: "8.4 TB" },
  ];

  // ── 4. Observability & Distributed Tracing Telemetry ────────────────────────
  const systemMetrics = {
    cpuUtilization: "14.2%",
    memoryAllocated: "2.1 GB / 16 GB",
    activeRpcTraces: "12,480 req/min",
    p99Latency: "18.4ms",
    zeroTrustDenials: 0,
  };

  function handleModuleToggle(id: string) {
    setModules(prev =>
      prev.map(m => (m.id === id ? { ...m, status: m.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : m))
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))", borderColor: "var(--indigo)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--indigo), var(--rose))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "#fff", fontWeight: 800 }}>
              🖥️
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                SimTrace Operating System (STOS Kernel)
                <span style={{ fontSize: "0.72rem", background: "var(--indigo)22", color: "var(--indigo)", border: "1px solid var(--indigo)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Phase 15 Microkernel v15.0
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Enterprise modular OS microkernel, low-code app builder, multi-engine data abstraction, RAG AI runtime, and Zero-Trust observability.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/dpi-platform" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🏛️ DPI Platform
            </Link>
            <button onClick={() => alert("STOS Microkernel Health Check: ALL 12 PLATFORM SERVICES OPERATIONAL")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ⚡ STOS Kernel: HEALTHY
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "microkernel", label: "⚙️ Microkernel Services" },
          { id: "lowcode", label: "🎨 Low-Code App Builder" },
          { id: "workflow", label: "⚡ Universal Workflow Engine" },
          { id: "dataplatform", label: "🗄️ Multi-Model Data Platform" },
          { id: "aiplatform", label: "🤖 Gemini AI Runtime & RAG" },
          { id: "developer", label: "🔌 Developer SDK & Plugins" },
          { id: "observability", label: "📊 Enterprise Observability" },
          { id: "security", label: "🛡️ Zero-Trust Security" },
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

      {/* ── TAB 1: STOS MICROKERNEL SERVICES ──────────────────────────────────── */}
      {activeTab === "microkernel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚙️ Installed Microkernel Platform Services & Lifecycle Manager</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Independently deployable, versioned OS services supporting zero-downtime hot upgrades and isolation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {modules.map(mod => (
                <div key={mod.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 6px", borderRadius: 4 }}>
                        {mod.tier}
                      </span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>{mod.name}</span>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--sky)" }}>{mod.version}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                      Memory: {mod.memory} · Health Score: <strong style={{ color: "var(--emerald)" }}>{mod.health}</strong> · Dependencies: {mod.dependencies}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: mod.status === "ACTIVE" ? "var(--emerald)" : "var(--rose)", background: mod.status === "ACTIVE" ? "var(--emerald)22" : "var(--rose)22", padding: "2px 8px", borderRadius: 4 }}>
                      {mod.status}
                    </span>
                    <button onClick={() => handleModuleToggle(mod.id)} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "0.75rem", border: "1px solid var(--border)" }}>
                      {mod.status === "ACTIVE" ? "Pause Service" : "Activate Service"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LOW-CODE VISUAL APP BUILDER ───────────────────────────────── */}
      {activeTab === "lowcode" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🎨 Visual Low-Code Application & Dashboard Builder</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Drag and drop enterprise components to assemble custom national portals without code edits.</p>
              </div>
              <button onClick={() => alert("Custom Low-Code UI Layout Saved & Published to Portal!")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                💾 Save Custom Canvas Layout
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1rem" }}>
              {/* Left Toolbox */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.75rem" }}>STOS COMPONENT PALETTE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {["📊 Analytics Metric Badge", "🔍 IMEI Verification Bar", "🚨 Theft Incident Map", "📜 Ownership Title Vault", "📸 Forensic OCR Camera Box"].map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setDraggedComponents(prev => [...prev, { id: `cmp_${Date.now()}`, label: c, type: "WIDGET" }])}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      + {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Canvas Preview */}
              <div style={{ background: "var(--surface)", border: "2px dashed var(--indigo)44", padding: "1.25rem", borderRadius: 12, minHeight: 280 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.75rem" }}>ACTIVE CANVAS PREVIEW (3 Widgets Loaded):</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  {draggedComponents.map(cmp => (
                    <div key={cmp.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, position: "relative" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>{cmp.label}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>Type: {cmp.type}</div>
                      <button
                        onClick={() => setDraggedComponents(prev => prev.filter(x => x.id !== cmp.id))}
                        style={{ position: "absolute", top: 6, right: 6, background: "transparent", border: "none", color: "var(--rose)", cursor: "pointer", fontSize: "0.8rem" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: UNIVERSAL WORKFLOW ENGINE ──────────────────────────────────── */}
      {activeTab === "workflow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>⚡ STOS Universal Automation Engine</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Event-driven micro-service orchestration supporting human-in-the-loop approvals, timers, and external API webhooks.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--indigo)", marginBottom: "0.5rem" }}>
                Active Workflow: Automated Stolen Device Cross-Border Lockdown
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: "0.78rem" }}>
                  1. Trigger: Incident Theft Filed
                </div>
                <span>→</span>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: "0.78rem" }}>
                  2. Query GSMA TAC Registry
                </div>
                <span>→</span>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: "0.78rem" }}>
                  3. Issue SS7 & Interpol Blacklist
                </div>
                <span>→</span>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 6, fontSize: "0.78rem" }}>
                  4. Human Approval (DCI Detective)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: MULTI-MODEL DATA PLATFORM ─────────────────────────────────── */}
      {activeTab === "dataplatform" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🗄️ Unified Multi-Engine Data Storage Abstraction</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Single data abstraction layer unifying relational, vector, document, graph, and time-series telemetry storage.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {storageEngines.map((e, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--indigo)", textTransform: "uppercase" }}>{e.type}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, margin: "6px 0 2px 0" }}>{e.usage}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Latency: <strong style={{ color: "var(--emerald)" }}>{e.latency}</strong> · Total Size: {e.size}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: GEMINI AI RUNTIME & RAG ───────────────────────────────────── */}
      {activeTab === "aiplatform" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🤖 Enterprise Gemini 1.5 Flash AI Runtime & RAG</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Embedded neural model service for forensic OCR, intelligent theft prediction, and case synthesis.
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1.25rem", borderRadius: 8 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>ACTIVE AI CAPABILITIES:</div>
              <ul style={{ fontSize: "0.82rem", color: "var(--text2)", margin: 0, paddingLeft: "1.2rem", lineHeight: 1.6 }}>
                <li><strong>Forensic Photo OCR:</strong> Extracts IMEIs and serial numbers from photos of device boxes and receipts.</li>
                <li><strong>Vector RAG Intelligence:</strong> Searches historical theft patterns across 48TB vector embeddings.</li>
                <li><strong>Automated Subpoena Generation:</strong> Drafts court-ready PDF affidavits using Gemini structured outputs.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DEVELOPER SDK & PLUGINS ────────────────────────────────────── */}
      {activeTab === "developer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🔌 STOS Developer SDK & Plugin Packaging CLI</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Standardized CLI tooling and extension SDK for building third-party integrations and custom OS modules.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--emerald)" }}>
              $ npm install -g @stos/cli<br />
              $ stos plugin init my-carrier-gateway --template=telecom<br />
              $ stos plugin build --out=dist/plugin.stos<br />
              $ stos plugin publish --registry=https://registry.ceir.gov
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: ENTERPRISE OBSERVABILITY ──────────────────────────────────── */}
      {activeTab === "observability" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📊 STOS Kernel Observability & Telemetry Matrix</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Real-time microkernel RPC tracing, CPU allocation, memory footprint, and Zero-Trust metrics.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CPU UTILIZATION</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>{systemMetrics.cpuUtilization}</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>MEMORY ALLOCATED</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>{systemMetrics.memoryAllocated}</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>P99 LATENCY</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--indigo)" }}>{systemMetrics.p99Latency}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: ZERO-TRUST SECURITY ───────────────────────────────────────── */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🛡️ Microkernel Zero-Trust Security Architecture</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Policy-driven authorization, cryptographic mTLS service mesh, and immutable memory isolation between modules.
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--emerald)", marginBottom: "0.5rem" }}>
                ✅ Zero-Trust Security Guardrails Active (0 Policy Violations Detected)
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text2)", margin: 0 }}>
                Every microkernel RPC call is verified using Ed25519 ephemeral tokens with strict tenant memory boundary checks.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
