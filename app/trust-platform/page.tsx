"use client";
import { useState } from "react";
import Link from "next/link";

export default function TrustPlatformPage() {
  const [activeTab, setActiveTab] = useState<
    | "trust_engine"
    | "ownership_passport"
    | "reputation"
    | "fraud_exchange"
    | "certification"
    | "marketplace"
    | "executive_command"
  >("trust_engine");

  // ── 1. Trust Engine State ───────────────────────────────────────────────────
  const [targetImei, setTargetImei] = useState("358912104928104");
  const [trustScoreData, setTrustScoreData] = useState({
    score: 96,
    rating: "VERY HIGH TRUST",
    factors: [
      { factor: "Carrier SIM Continuity", impact: "+25 pts", detail: "Active on Safaricom 5G network for >180 days with zero IMSI churn." },
      { factor: "Cryptographic DNA Passkey", impact: "+30 pts", detail: "FIDO2 secure enclave hardware signature matches factory minting." },
      { factor: "Proof of Purchase (Receipt OCR)", impact: "+20 pts", detail: "Verified Jubilee Insurance micro-policy & official store invoice." },
      { factor: "Repair & Service Logs", impact: "+15 pts", detail: "Serviced at Authorized iSpot Center with original OEM parts." },
      { factor: "Zero Fraud Flag History", impact: "+6 pts", detail: "Clean Interpol, GSMA TAC, and national police registry records." },
    ]
  });

  // ── 2. Verified Ownership & Digital Passport State ─────────────────────────
  const [ownershipType, setOwnershipType] = useState<"individual" | "corporate" | "temporary">("individual");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferSuccess, setTransferSuccess] = useState(false);

  const devicePassport = {
    imei: "358912104928104",
    model: "iPhone 15 Pro Max (256GB Natural Titanium)",
    currentOwner: "Alice W. (SimTrace ID: USR-88102)",
    ownershipType: "Individual Private Title",
    warranty: "AppleCare+ Active until June 2027",
    insurance: "Jubilee InsurTech Active (Policy #JUB-2026-99)",
    timeline: [
      { date: "2025-11-10", event: "Manufactured at Foxconn Zhengzhou (GSMA TAC 35891210)", icon: "🏭", authority: "Apple OEM Minting Node" },
      { date: "2025-12-01", event: "Imported & Activated on Safaricom Kenya Mesh", icon: "📡", authority: "Safaricom Core Gateway" },
      { date: "2025-12-05", event: "Initial Ownership Registered to Alice W.", icon: "🔑", authority: "SimTrace Global Registry" },
      { date: "2026-03-14", event: "Authorized Screen Repair at iSpot Nairobi", icon: "🔧", authority: "iSpot Certified Repair Node" },
      { date: "2026-07-31", event: "Passed Phase 13 Trust Engine Audit (Score 96/100)", icon: "🛡️", authority: "SimTrace Trust Engine v3" },
    ]
  };

  // ── 3. Reputation Engine State ──────────────────────────────────────────────
  const reputationEntities = [
    { name: "iSpot Kenya Authorized Apple Reseller", type: "RETAILER / REPAIR", trustScore: 99.4, badge: "PLATINUM VERIFIED", completedTransfers: 14200, status: "TIER 1" },
    { name: "Safaricom PLC Fraud Prevention Desk", type: "TELECOM OPERATOR", trustScore: 100, badge: "NATIONAL CEIR CORE", completedTransfers: 890000, status: "CORE NODE" },
    { name: "Jubilee InsurTech Underwriting Mesh", type: "INSURER", trustScore: 98.9, badge: "INSTANT PAYOUT", completedTransfers: 45000, status: "CERTIFIED" },
    { name: "DCI Cybercrime Recovery Team", type: "LAW ENFORCEMENT", trustScore: 100, badge: "JUDICIAL EVIDENCE", completedTransfers: 3800, status: "GOVT CORE" },
  ];

  // ── 4. Fraud Intelligence Exchange (FIX) State ─────────────────────────────
  const [fraudIndicators, setFraudIndicators] = useState([
    { id: "FIX-901", type: "SIM_SWAP_VELOCITY_ANOMALY", hash: "0x8f2a...c1e9", source: "Safaricom Carrier Node", risk: "CRITICAL", policy: "AUTO_LOCK_BANKING", timestamp: "10 mins ago" },
    { id: "FIX-902", type: "DUPLICATE_IMEI_CLONE_DETECTED", hash: "0x3e1d...7b4c", source: "Interpol CEIR Mesh", risk: "HIGH", policy: "SS7_BLACKLIST_BROADCAST", timestamp: "25 mins ago" },
    { id: "FIX-903", type: "UNAUTHORIZED_BASEBAND_FLASH", hash: "0x9c4f...1a3b", source: "DCI Forensics Vault", risk: "MEDIUM", policy: "EVIDENCE_SNAPSHOT_PULL", timestamp: "1 hour ago" },
  ]);

  // ── 5. Certification Platform State ────────────────────────────────────────
  const certifications = [
    { title: "SimTrace Level 3 Certified Secure Repair Hub", holder: "iSpot Nairobi", expires: "2027-12-31", status: "VALID", verifiedHash: "Ed25519-0x99182a" },
    { title: "GSMA TAC Compliant Hardware Minting Partner", holder: "Samsung Electronics", expires: "2028-06-30", status: "VALID", verifiedHash: "Ed25519-0x4421bc" },
    { title: "SOC 2 Type II Multi-Tenant Data Isolation", holder: "SimTrace Cloud Infrastructure", expires: "2027-08-15", status: "VALID", verifiedHash: "Ed25519-0x1102ed" },
  ];

  // ── 6. Developer Marketplace State ──────────────────────────────────────────
  const marketplaceItems = [
    { name: "Splunk / Datadog SIEM Incident Connector", category: "SECURITY INTEGRATION", downloads: "2,400+", author: "SimTrace Enterprise Team", price: "Free (Included)" },
    { name: "M-Pesa Instant Micro-Insurance Escrow Module", category: "FINTECH PAYMENTS", downloads: "8,900+", author: "Jubilee InsurTech", price: "Free Plugin" },
    { name: "Gemini 1.5 Flash Forensic Affidavit Auto-Draft", category: "AI WORKFLOW TEMPLATE", downloads: "1,200+", author: "LegalTech Labs", price: "Free Extension" },
    { name: "Android / iOS Biometric Offline Passport SDK", category: "MOBILE SDK", downloads: "5,100+", author: "SimTrace Mobile Team", price: "Included in Pro" },
  ];

  // ── Helper Actions ─────────────────────────────────────────────────────────
  function handleTransferOwnership(e: React.FormEvent) {
    e.preventDefault();
    if (!transferRecipient) return;
    setTransferSuccess(true);
    setTimeout(() => {
      setTransferSuccess(false);
      setTransferRecipient("");
      alert(`Digital Ownership Title for IMEI ${devicePassport.imei} successfully transferred to ${transferRecipient}!`);
    }, 1500);
  }

  function handleEvaluateTrust() {
    // Re-evaluate mock trust score
    const newScore = Math.floor(88 + Math.random() * 11);
    setTrustScoreData(prev => ({
      ...prev,
      score: newScore,
      rating: newScore > 92 ? "VERY HIGH TRUST" : "HIGH TRUST"
    }));
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Hero Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.15))", borderColor: "var(--indigo)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--indigo), var(--sky))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#fff", fontWeight: 800 }}>
              🛡️
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Global Trust & Network Platform
                <span style={{ fontSize: "0.7rem", background: "var(--indigo)22", color: "var(--indigo)", border: "1px solid var(--indigo)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Phase 13 Trust Engine
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Explainable device trust scoring, verified ownership certificates, fraud intelligence exchange (FIX), partner certifications, and plugin marketplace.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/global-ecosystem" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🛰️ Command Center
            </Link>
            <button onClick={handleEvaluateTrust} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ⚡ Re-Evaluate Trust Score
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "trust_engine", label: "🛡️ Trust Engine & Scoring" },
          { id: "ownership_passport", label: "📜 Verified Ownership & Passport" },
          { id: "reputation", label: "🌟 Partner Reputation Index" },
          { id: "fraud_exchange", label: "🕵️ Fraud Intelligence Exchange" },
          { id: "certification", label: "🎖️ Certification Platform" },
          { id: "marketplace", label: "🛍️ Developer Marketplace" },
          { id: "executive_command", label: "🏛️ Strategic Command & Insights" },
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

      {/* ── TAB 1: TRUST ENGINE & EXPLAINABLE SCORING ─────────────────────────── */}
      {activeTab === "trust_engine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🛡️ Explainable Device Trust Engine & Risk Matrix</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Calculates real-time trust score using multi-dimensional hardware, carrier, and ownership factors.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={targetImei}
                  onChange={e => setTargetImei(e.target.value)}
                  placeholder="Enter 15-Digit IMEI"
                  style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                />
                <button onClick={handleEvaluateTrust} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                  Inspect IMEI Trust
                </button>
              </div>
            </div>

            {/* Score Banner */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>EVALUATED IMEI TRUST SCORE</div>
                <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--emerald)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {trustScoreData.score} <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/ 100</span>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "3px 10px", borderRadius: 12 }}>
                  {trustScoreData.rating}
                </span>
              </div>

              <div style={{ textAlignment: "right", maxWidth: 300 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>AUTOMATED DECISION RECOMMENDATION</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--sky)", marginTop: 4 }}>
                  ✅ Approved for Instant Insurance Underwriting & Unrestricted Carrier Network Activation
                </div>
              </div>
            </div>

            {/* Explainable Factors List */}
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>Explainable Scoring Weight Breakdown:</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {trustScoreData.factors.map((f, i) => (
                <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{f.factor}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{f.detail}</div>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "4px 10px", borderRadius: 6 }}>
                    {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VERIFIED OWNERSHIP REGISTRY & DIGITAL PASSPORT ─────────────── */}
      {activeTab === "ownership_passport" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.25rem" }}>
            {/* Left: Device Digital Passport Timeline */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 8px", borderRadius: 12 }}>
                    DIGITAL PASSPORT V3
                  </span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "4px 0 0 0" }}>{devicePassport.model}</h3>
                  <div style={{ fontSize: "0.78rem", fontFamily: "var(--mono)", color: "var(--sky)", marginTop: 2 }}>IMEI: {devicePassport.imei}</div>
                </div>
                <button onClick={() => alert("Cryptographic PDF Passport Exported with Ed25519 Signature.")} className="btn-primary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                  📥 Export Signed Passport
                </button>
              </div>

              {/* Lifecycle Event Chain */}
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.75rem" }}>IMMUTABLE LIFECYCLE AUDIT TRAIL:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", borderLeft: "2px solid var(--indigo)44", paddingLeft: "1rem", marginLeft: "0.5rem" }}>
                {devicePassport.timeline.map((item, idx) => (
                  <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8, position: "relative" }}>
                    <div style={{ position: "absolute", left: "-1.55rem", top: "1rem", background: "var(--indigo)", color: "#fff", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>
                      ✓
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{item.icon} {item.event}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--indigo)", fontWeight: 600 }}>Authority: {item.authority}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Transfer Title Panel */}
            <div className="card">
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🔑 Transfer Ownership Title</h3>
              <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
                Executes cryptographic title transfer between individuals, corporate fleets, or temporary retail trade-ins.
              </p>

              <form onSubmit={handleTransferOwnership} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Ownership Classification</label>
                  <select
                    value={ownershipType}
                    onChange={e => setOwnershipType(e.target.value as any)}
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
                  >
                    <option value="individual">Individual Private Owner</option>
                    <option value="corporate">Corporate Enterprise Fleet</option>
                    <option value="temporary">Temporary Retail / Repair Escrow</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Recipient SimTrace ID or Email</label>
                  <input
                    type="text"
                    required
                    value={transferRecipient}
                    onChange={e => setTransferRecipient(e.target.value)}
                    placeholder="e.g. buyer@domain.com or USR-99012"
                    style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6 }}
                  />
                </div>

                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.75rem", borderRadius: 6, fontSize: "0.75rem", color: "var(--text2)" }}>
                  🔒 <strong>Cryptographic Safety Guard:</strong> Transfer requires biometrics or hardware key passkey signature.
                </div>

                <button type="submit" disabled={transferSuccess} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                  {transferSuccess ? "Signing & Executing Transfer…" : "⚡ Execute Cryptographic Transfer"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: REPUTATION ENGINE ─────────────────────────────────────────── */}
      {activeTab === "reputation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🌟 Global Partner Reputation & Trust Ranks</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Verifiable trust scores for repair centers, second-hand retailers, carriers, and insurtech underwriters.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {reputationEntities.map((e, idx) => (
                <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 6px", borderRadius: 4 }}>
                      {e.type}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 6px", borderRadius: 4 }}>
                      {e.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.95rem", fontWeight: 800, margin: "6px 0 2px 0" }}>{e.name}</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--sky)" }}>{e.trustScore} <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Trust Score</span></div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>Completed Verified Transactions: {e.completedTransfers.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FRAUD INTELLIGENCE EXCHANGE (FIX) ─────────────────────────── */}
      {activeTab === "fraud_exchange" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🕵️ Fraud Intelligence Exchange (FIX)</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Privacy-preserving cross-agency fraud vector sharing with policy enforcement.</p>
              </div>
              <button onClick={() => alert("New Fraud Indicator Published to FIX Mesh.")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                + Share Indicator (FIX)
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {fraudIndicators.map(fi => (
                <div key={fi.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--indigo)" }}>{fi.id}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>{fi.type}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>Source: {fi.source} · Anonymized Hash: <code style={{ color: "var(--sky)" }}>{fi.hash}</code> · {fi.timestamp}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: fi.risk === "CRITICAL" ? "var(--rose)" : "var(--amber)", background: fi.risk === "CRITICAL" ? "var(--rose)22" : "var(--amber)22", padding: "2px 8px", borderRadius: 4 }}>
                      {fi.risk} RISK
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      Policy: {fi.policy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: CERTIFICATION PLATFORM ────────────────────────────────────── */}
      {activeTab === "certification" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🎖️ Partner Certification & Verification Platform</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Issue, renew, and publicly verify compliance certifications for repair shops, carriers, and hardware vendors.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {certifications.map((c, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>{c.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Holder: {c.holder} · Valid through: {c.expires}</div>
                    <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--sky)", marginTop: 2 }}>Public Hash: {c.verifiedHash}</div>
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

      {/* ── TAB 6: DEVELOPER MARKETPLACE ──────────────────────────────────────── */}
      {activeTab === "marketplace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🛍️ Ecosystem Plugin & AI Extension Marketplace</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Extend SimTrace capabilities with community and enterprise plugins, SIEM connectors, and AI workflow templates.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {marketplaceItems.map((item, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 6px", borderRadius: 4 }}>
                      {item.category}
                    </span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, margin: "8px 0 2px 0" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>By {item.author} · {item.downloads} Installs</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)" }}>{item.price}</span>
                    <button onClick={() => alert(`Installed ${item.name} plugin!`)} className="btn-primary" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>
                      Install Plugin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: EXECUTIVE COMMAND & STRATEGIC INSIGHTS ────────────────────── */}
      {activeTab === "executive_command" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏛️ Executive Strategic Insights & Ecosystem Health</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Strategic performance indicators, ecosystem growth velocity, and cross-border recovery metrics.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>GLOBAL ECOSYSTEM VALUE PROTECTED</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>$1.48 Billion</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>Across 4.8M Registered Devices</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ACTIVE FEDERATED ORGANIZATIONS</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>142 Partners</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Telecoms, Insurers, Govt & OEMs</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CROSS-BORDER RECOVERY LATENCY</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--indigo)" }}>14.2 Minutes</div>
                <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>Interpol SS7 Auto-Paging</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
