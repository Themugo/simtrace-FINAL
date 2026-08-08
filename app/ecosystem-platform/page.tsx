"use client";

import React, { useState } from "react";

// Types for Phase 18 Ecosystem & Platform Economy Modules
type EcosystemTab =
  | "marketplace"
  | "developer"
  | "partners"
  | "ai_exchange"
  | "data_exchange"
  | "templates"
  | "extension_framework"
  | "community"
  | "revenue"
  | "governance";

interface MarketplaceItem {
  id: string;
  name: string;
  category: "AI Agent" | "Industry Pack" | "UI Theme" | "Workflow Template" | "Integration";
  author: string;
  version: string;
  rating: number;
  reviewsCount: number;
  price: string;
  downloads: number;
  installed: boolean;
  description: string;
}

interface PartnerLead {
  id: string;
  companyName: string;
  partnerType: "System Integrator" | "MSP" | "Telecom Core" | "InsurTech OEM" | "University Research";
  dealSize: string;
  stage: "Registered" | "In Review" | "Approved" | "Commission Paid";
  revSharePercentage: number;
}

interface AIAgentAsset {
  id: string;
  name: string;
  provider: string;
  type: "Forensic OCR" | "Fraud Telemetry" | "Biometric Matcher" | "Predictive Risk";
  latencyMs: number;
  accuracyScore: string;
  costPer1kTokens: string;
  status: "CERTIFIED" | "SANDBOX_EVAL";
}

interface GovernanceSubmission {
  id: string;
  appName: string;
  developer: string;
  version: string;
  securityScan: "PASSED (0 Vulnerabilities)" | "IN_PROGRESS";
  sandboxStatus: "PASSED 100% ISOLATION" | "TESTING";
  reviewStage: "Automated Scan" | "Security Audit" | "Approved for Store";
}

export default function EcosystemPlatformPage() {
  const [activeTab, setActiveTab] = useState<EcosystemTab>("marketplace");
  const [marketCategoryFilter, setMarketCategoryFilter] = useState("all");

  // 1. Marketplace Items State
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([
    {
      id: "mod-101",
      name: "Safaricom M-Pesa Fraud Defense Pack",
      category: "Industry Pack",
      author: "Safaricom DevCorp",
      version: "v2.4.0",
      rating: 4.9,
      reviewsCount: 128,
      price: "$490 / mo",
      downloads: 1420,
      installed: true,
      description: "Pre-packaged micro-payout validation rules, SIM swap risk hooks, and M-Pesa API connectors.",
    },
    {
      id: "mod-102",
      name: "Gemini 1.5 Pro Forensic Box Serial OCR Agent",
      category: "AI Agent",
      author: "Google AI Partner Network",
      version: "v1.8.2",
      rating: 5.0,
      reviewsCount: 310,
      price: "0.002 / call",
      downloads: 8900,
      installed: true,
      description: "High-accuracy AI vision model tuned for reflective smartphone box barcode and IMEI label extraction.",
    },
    {
      id: "mod-103",
      name: "Interpol Cross-Border Alert Dispatcher",
      category: "Workflow Template",
      author: "Interpol Cybercrime Division",
      version: "v3.1.0",
      rating: 4.8,
      reviewsCount: 64,
      price: "Included (Gov)",
      downloads: 420,
      installed: false,
      description: "Automated workflow template for broadcasting stolen IMEI signals across 195 member enclaves.",
    },
    {
      id: "mod-104",
      name: "Dark Luxury Sovereign Command Theme",
      category: "UI Theme",
      author: "SimTrace Design Studio",
      version: "v1.0.4",
      rating: 4.7,
      reviewsCount: 42,
      price: "Free",
      downloads: 3200,
      installed: false,
      description: "High-contrast dark mode CSS theme optimized for police dispatch centers & military enclaves.",
    },
  ]);

  // 2. Partner Leads & Certifications
  const [partnerLeads, setPartnerLeads] = useState<PartnerLead[]>([
    { id: "PL-801", companyName: "Dimension Data Africa", partnerType: "System Integrator", dealSize: "$1.2M", stage: "Commission Paid", revSharePercentage: 15 },
    { id: "PL-802", companyName: "Safaricom Enterprise Managed Services", partnerType: "MSP", dealSize: "$4.5M", stage: "Approved", revSharePercentage: 20 },
    { id: "PL-803", companyName: "Jubilee InsurTech Solutions", partnerType: "InsurTech OEM", dealSize: "$850K", stage: "In Review", revSharePercentage: 12 },
  ]);

  // 3. AI Marketplace Assets
  const [aiAssets, setAiAssets] = useState<AIAgentAsset[]>([
    { id: "AI-101", name: "Gemini Forensic Receipt Scanner", provider: "DeepMind / SimTrace", type: "Forensic OCR", latencyMs: 140, accuracyScore: "99.8%", costPer1kTokens: "$0.0015", status: "CERTIFIED" },
    { id: "AI-102", name: "IMEI Cloning Neural Predictor", provider: "Nairobi Cyber Labs", type: "Predictive Risk", latencyMs: 22, accuracyScore: "98.4%", costPer1kTokens: "$0.0008", status: "CERTIFIED" },
    { id: "AI-103", name: "Biometric Face/Snapshot Guard", provider: "Biometric Vault Inc", type: "Biometric Matcher", latencyMs: 85, accuracyScore: "99.9%", costPer1kTokens: "$0.0030", status: "SANDBOX_EVAL" },
  ]);

  // 4. Developer API Webhook Tester State
  const [webhookUrl, setWebhookUrl] = useState("https://api.partner-domain.com/simtrace/webhooks");
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // 5. Governance Submissions
  const [submissions, setSubmissions] = useState<GovernanceSubmission[]>([
    { id: "SUB-401", appName: "Uganda Tax Customs IMEI Audit Tool", developer: "URA Tech Team", version: "v1.2.0", securityScan: "PASSED (0 Vulnerabilities)", sandboxStatus: "PASSED 100% ISOLATION", reviewStage: "Approved for Store" },
    { id: "SUB-402", appName: "Airtel SIM Swap Realtime Alert", developer: "Airtel Labs", version: "v2.0.1", securityScan: "PASSED (0 Vulnerabilities)", sandboxStatus: "TESTING", reviewStage: "Security Audit" },
  ]);

  function toggleInstall(id: string) {
    setMarketplaceItems(prev =>
      prev.map(item => (item.id === id ? { ...item, installed: !item.installed } : item))
    );
  }

  function handleTestWebhook() {
    setWebhookStatus("Testing payload dispatch to edge endpoint...");
    setTimeout(() => {
      setWebhookStatus("HTTP 200 OK — Webhook delivered in 42ms. Payload hash verified.");
    }, 1200);
  }

  function handleRegisterLead() {
    const comp = prompt("Enter Partner Company Name:");
    if (comp) {
      const newLead: PartnerLead = {
        id: `PL-${partnerLeads.length + 804}`,
        companyName: comp,
        partnerType: "System Integrator",
        dealSize: "$500,000",
        stage: "Registered",
        revSharePercentage: 15,
      };
      setPartnerLeads([newLead, ...partnerLeads]);
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* ── HEADER BANNER ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🌐</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              SimTrace Digital Ecosystem & Platform Economy
            </h1>
            <span style={{ fontSize: "0.72rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
              Phase 18 Ecosystem Suite
            </span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, maxWidth: 840 }}>
            Extensible platform economy enabling developers, partners, governments, and service providers to build, monetize, and deploy solutions on SimTrace.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Marketplace ARR Share</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--emerald)" }}>$3,840,000 / yr</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Active Developers & Partners</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--sky)" }}>1,480 Certified</div>
          </div>
        </div>
      </div>

      {/* ── TOP KPI HIGHLIGHTS ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--emerald)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Published Modules</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>248 Solution Packs</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>+18 Certified This Month</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--sky)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>AI Agent Exchange</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>32 Models & Copilots</div>
          <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>Gemini 1.5 Flash Verified</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--indigo)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Partner Rev-Share Pool</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>20% Royalty Split</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>Automated Smart Payouts</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--amber)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Governance & Security</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>100% Sandbox Isolated</div>
          <div style={{ fontSize: "0.72rem", color: "var(--amber)", marginTop: 4 }}>0 CVE Defects Found</div>
        </div>
      </div>

      {/* ── NAVIGATION MODULE SWITCHER (10 PILLARS) ────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "marketplace", label: "🛍️ Solution Marketplace", icon: "🛍️" },
          { id: "developer", label: "💻 Developer Portal & OpenAPI", icon: "💻" },
          { id: "partners", label: "🤝 Partner Network", icon: "🤝" },
          { id: "ai_exchange", label: "🤖 AI Model Exchange", icon: "🤖" },
          { id: "data_exchange", label: "📊 Governed Data Exchange", icon: "📊" },
          { id: "templates", label: "🧩 Sector Templates", icon: "🧩" },
          { id: "extension_framework", label: "🔌 Plugin Framework", icon: "🔌" },
          { id: "community", label: "💬 Community & Showcase", icon: "💬" },
          { id: "revenue", label: "💳 Revenue & Monitization", icon: "💳" },
          { id: "governance", label: "🛡️ App Certification", icon: "🛡️" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as EcosystemTab)}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: `1px solid ${activeTab === tab.id ? "var(--emerald)" : "transparent"}`,
              background: activeTab === tab.id ? "var(--emerald)22" : "transparent",
              color: activeTab === tab.id ? "var(--emerald)" : "var(--muted)",
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

      {/* ── MODULE 1: SOLUTION MARKETPLACE ───────────────────────────────────── */}
      {activeTab === "marketplace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🛍️ Discoverable Extension Modules & Industry Packs</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  1-Click installable modules, AI agents, UI themes, and automation bundles with semantic versioning.
                </p>
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["all", "Industry Pack", "AI Agent", "Workflow Template", "UI Theme"].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setMarketCategoryFilter(cat)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      border: `1px solid ${marketCategoryFilter === cat ? "var(--sky)" : "var(--border)"}`,
                      background: marketCategoryFilter === cat ? "var(--sky)22" : "var(--bg)",
                      color: marketCategoryFilter === cat ? "var(--sky)" : "var(--muted)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
              {marketplaceItems
                .filter(item => marketCategoryFilter === "all" || item.category === marketCategoryFilter)
                .map(item => (
                  <div key={item.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--sky)", background: "var(--sky)15", border: "1px solid var(--sky)33", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 700 }}>
                          ★ {item.rating} ({item.reviewsCount})
                        </span>
                      </div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "2px 0 4px 0" }}>{item.name}</h4>
                      <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 10px 0" }}>{item.description}</p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{item.author} • {item.version}</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text)" }}>{item.price}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleInstall(item.id)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: item.installed ? "var(--emerald)22" : "var(--emerald)",
                          color: item.installed ? "var(--emerald)" : "#fff",
                        }}
                      >
                        {item.installed ? "✓ INSTALLED" : "+ INSTALL MODULE"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 2: DEVELOPER PORTAL & OPENAPI SANDBOX ─────────────────────── */}
      {activeTab === "developer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>💻 Developer Portal, OpenAPI Spec & Webhook Testbed</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Download official TypeScript SDKs, test REST/gRPC webhooks, and inspect OpenAPI v3.1 endpoint schemas.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Webhook Tester */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", marginTop: 0, color: "var(--sky)" }}>⚡ Live Webhook Event Dispatcher</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Partner Webhook Listener URL</label>
                    <input
                      type="text"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", fontSize: "0.82rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                    />
                  </div>

                  <button type="button" onClick={handleTestWebhook} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem", width: "fit-content" }}>
                    🚀 Dispatch Sample `device.stolen` Event
                  </button>

                  {webhookStatus && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--emerald)", padding: "0.6rem", borderRadius: 6, fontSize: "0.75rem", color: "var(--emerald)", fontFamily: "var(--mono)" }}>
                      {webhookStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* SDK & CLI Links */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", marginTop: 0, color: "var(--emerald)" }}>📦 Official SimTrace SDKs & CLI Tooling</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--surface)", borderRadius: 6 }}>
                    <code>npm install @simtrace/sdk-typescript</code>
                    <strong style={{ color: "var(--emerald)" }}>v4.8.0</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--surface)", borderRadius: 6 }}>
                    <code>pip install simtrace-python-sdk</code>
                    <strong style={{ color: "var(--emerald)" }}>v4.8.0</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "var(--surface)", borderRadius: 6 }}>
                    <code>curl -sSL https://get.simtrace.dev/cli | sh</code>
                    <strong style={{ color: "var(--sky)" }}>CLI Tool</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 3: PARTNER NETWORK & LEAD REGISTRATION ──────────────────────── */}
      {activeTab === "partners" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>🤝 Tiered Partner Network & Deal Lead Registration</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Manage certified System Integrators, MSPs, Telecom Cores, InsurTech OEMs, and revenue commissions.
                </p>
              </div>
              <button type="button" onClick={handleRegisterLead} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + Register New Partner Lead
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {partnerLeads.map(lead => (
                <div key={lead.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 800 }}>{lead.id}</span>
                      <strong style={{ fontSize: "0.9rem" }}>{lead.companyName}</strong>
                      <span style={{ fontSize: "0.7rem", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 4 }}>{lead.partnerType}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                      Registered Opportunity Size: <strong>{lead.dealSize}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                      {lead.stage} ({lead.revSharePercentage}% Split)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 4: AI MODEL EXCHANGE ──────────────────────────────────────── */}
      {activeTab === "ai_exchange" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🤖 Certified AI Model & Copilot Exchange</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Publish, evaluate, and deploy domain-specific Gemini AI agents and neural predictive models.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {aiAssets.map(asset => (
                <div key={asset.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--sky)", fontWeight: 800 }}>{asset.type}</span>
                    <span style={{ fontSize: "0.7rem", background: asset.status === "CERTIFIED" ? "var(--emerald)22" : "var(--amber)22", color: asset.status === "CERTIFIED" ? "var(--emerald)" : "var(--amber)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                      {asset.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{asset.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "4px 0 8px 0" }}>Provider: {asset.provider}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text)", display: "flex", justifyContent: "space-between", background: "var(--surface)", padding: "6px 8px", borderRadius: 6 }}>
                    <span>Latency: <strong>{asset.latencyMs}ms</strong></span>
                    <span>Accuracy: <strong style={{ color: "var(--emerald)" }}>{asset.accuracyScore}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 5: GOVERMENT DATA EXCHANGE ─────────────────────────────────── */}
      {activeTab === "data_exchange" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>📊 Governed Data Exchange & Anonymized Data Catalog</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Permissioned cross-agency dataset sharing with automatic PII anonymization and lineage audits.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { name: "National CEIR Stolen IMEI Registry", records: "4.8M Devices", quality: "99.9% Clean", sharing: "AUTOMATED_API_SYNC" },
                { name: "Cross-Border Subsea Transit Theft Telemetry", records: "1.2M Records", quality: "98.7% Clean", sharing: "ENCRYPTED_BATCH_S3" },
                { name: "Carrier IMSI Swap Risk Signal Feed", records: "18.4M Events/Day", quality: "100% Validated", sharing: "KAFKA_STREAM" },
              ].map((ds, idx) => (
                <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{ds.name}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Volume: {ds.records} • Data Quality Score: <span style={{ color: "var(--emerald)", fontWeight: 700 }}>{ds.quality}</span></div>
                  </div>
                  <code style={{ fontSize: "0.72rem", color: "var(--sky)", background: "var(--sky)15", padding: "2px 8px", borderRadius: 4 }}>{ds.sharing}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 6: SECTOR SOLUTION TEMPLATES ──────────────────────────────── */}
      {activeTab === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🧩 Turnkey Sector Solution Templates</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Deploy fully-configured vertical applications packaged with workflows, dashboards, and role permissions.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {[
                { title: "National CEIR & Customs Pack", sector: "Government", time: "10 mins setup" },
                { title: "Telecom Core Carrier Interconnect", sector: "Telecom", time: "15 mins setup" },
                { title: "Micro-Theft Underwriting & Claims Engine", sector: "Insurance", time: "5 mins setup" },
                { title: "Enterprise Fleet Device Management", sector: "Enterprise Logistics", time: "5 mins setup" },
              ].map((tpl, idx) => (
                <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--sky)", fontWeight: 700 }}>{tpl.sector}</span>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, margin: "4px 0" }}>{tpl.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: 10 }}>Est. Deployment: {tpl.time}</div>
                  <button type="button" onClick={() => alert(`🎉 Provisioning ${tpl.title} template...`)} className="btn-primary" style={{ padding: "5px 12px", fontSize: "0.75rem", width: "100%" }}>
                    Deploy Solution Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 7: RUNTIME EXTENSION PLUGIN FRAMEWORK ─────────────────────── */}
      {activeTab === "extension_framework" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🔌 SimTrace Runtime Plugin & Extension Slot Architecture</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Register extension hooks for custom navigation slots, visual widgets, and event filters without editing core source code.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem" }}>
              <div style={{ color: "var(--sky)", fontWeight: 700, marginBottom: 6 }}>REGISTERED EXTENSION HOOK SLOTS:</div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: 4 }}>
                <li><code>slot:navbar:action_button</code> — Registered by Safaricom Fraud Plugin</li>
                <li><code>slot:device_details:tab_extra</code> — Registered by Jubilee Claims Validator</li>
                <li><code>slot:analytics:widget_grid</code> — Registered by Interpol CEIR Telemetry</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 8: COMMUNITY PLATFORM ─────────────────────────────────────── */}
      {activeTab === "community" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>💬 SimTrace Developer & Partner Community Hub</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Developer forums, feature voting, hackathons, and reusable code snippet gallery.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--sky)", marginTop: 0 }}>🏆 Active Ecosystem Hackathon</h4>
                <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>Pan-African Cybersec Device Defense 2026</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "4px 0" }}>Prize Pool: $50,000 in Gemini API Credits & SimTrace Grants</div>
                <button type="button" onClick={() => alert("Registered for Hackathon 2026!")} className="btn-primary" style={{ padding: "5px 12px", fontSize: "0.75rem", marginTop: 6 }}>
                  Register Hackathon Team
                </button>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--emerald)", marginTop: 0 }}>💡 Top Voted Feature Requests</h4>
                <div style={{ fontSize: "0.78rem" }}>
                  <div>1. 🚀 Native Swift iOS Baseband Telemetry SDK (142 votes)</div>
                  <div>2. ⚡ Rust gRPC Direct Carrier Proxy (98 votes)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 9: PLATFORM REVENUE & MONETIZATION ───────────────────────── */}
      {activeTab === "revenue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>💳 Platform Revenue Engine & Royalty Distribution</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Automated 80/20 marketplace revenue split, API consumption billing, and partner payouts.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>DEVELOPER ROYALTIES PAID</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>$1,420,000</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Distributed to 128 authors</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>MARKETPLACE COMMISSION (20%)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--sky)", margin: "4px 0" }}>$355,000</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Platform re-investment fund</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>API CONSUMPTION OVERAGE</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>$84,200 / mo</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Pay-as-you-go micro-billing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 10: APP CERTIFICATION & GOVERNANCE ────────────────────────── */}
      {activeTab === "governance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🛡️ Ecosystem App Certification & Security Review Pipeline</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Automated static analysis, WASM sandbox isolation verification, and official certification badges.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {submissions.map(sub => (
                <div key={sub.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 800 }}>{sub.id}</span>
                      <strong style={{ fontSize: "0.9rem" }}>{sub.appName}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>by {sub.developer} ({sub.version})</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--emerald)", marginTop: 4 }}>
                      {sub.securityScan} • {sub.sandboxStatus}
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                    {sub.reviewStage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
