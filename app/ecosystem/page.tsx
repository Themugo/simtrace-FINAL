"use client";
import { useState } from "react";
import Link from "next/link";
import SimTraceLogo from "../../components/SimTraceLogo";

export default function EcosystemPage() {
  const [selectedNode, setSelectedNode] = useState<string>("device_intelligence");

  const ecosystemNodes = [
    {
      id: "device_intelligence",
      title: "Device Intelligence",
      icon: "📱",
      href: "/devices",
      badge: "CORE ENGINE",
      tagline: "Cryptographic Hardware DNA & Live Telemetry",
      description: "Extracts baseband hardware signatures, IMEI 1 & 2 fingerprints, eSIM ICCID states, and silent biometric telemetry. Builds continuous risk scores for device authenticity.",
      metrics: ["15-digit IMEI Validation", "eSIM Digital ID Binding", "Sub-second Risk Scoring"]
    },
    {
      id: "investigation_platform",
      title: "Investigation Platform",
      icon: "🕵️‍♂️",
      href: "/evidence",
      badge: "CRIMINAL FORENSICS",
      tagline: "Court-Admissible Evidence & Silent Photo Capture",
      description: "Generates digital chain-of-custody evidence packages containing silent front-camera snapshots, cell tower triangulation logs, and GPS movement heatmaps.",
      metrics: ["Silent Snapshot Vault", "Admissible Affidavit Export", "Multi-Jurisdiction Tracking"]
    },
    {
      id: "government_platform",
      title: "Government Platform",
      icon: "🏛️",
      href: "/law-enforcement",
      badge: "NATIONAL SECURITY",
      tagline: "Direct DCI & Law Enforcement Portal",
      description: "Connects national law enforcement agencies (DCI, Interpol, Police) with automated theft affidavits, search warrant authorization, and stolen device recovery operations.",
      metrics: ["Interpol Stolen DB Sync", "DCI Cybercrime Pipeline", "Automated Warrant Forms"]
    },
    {
      id: "telecom_platform",
      title: "Telecom Platform",
      icon: "📡",
      href: "/telecom/dashboard",
      badge: "CARRIER CORE",
      tagline: "SS7 / Diameter Network Signaling Mesh",
      description: "Integrates with Safaricom, Airtel, Telkom, and international carrier cores for instantaneous IMSI-IMEI mismatch detection, SIM swap alerts, and CEIR blacklisting.",
      metrics: ["18ms Carrier Latency", "MAP_CANCEL_LOCATION Signaling", "CEIR Blacklist Broadcast"]
    },
    {
      id: "insurance_platform",
      title: "Insurance Platform",
      icon: "🛡️",
      href: "/insurance",
      badge: "INSURTECH",
      tagline: "Automated Underwriting & Jubilee Micro-Policies",
      description: "Underwrites theft and screen damage micro-policies starting at KES 50/month with automated instant claims processing backed by blockchain evidence verification.",
      metrics: ["Sub-60s Claim Settlement", "Automated Fraud Scoring", "M-Pesa Micro-Payouts"]
    },
    {
      id: "enterprise_platform",
      title: "Enterprise Platform",
      icon: "🏢",
      href: "/enterprise",
      badge: "ZERO TRUST",
      tagline: "MDM Integration & Corporate Fleet Protection",
      description: "Secures corporate laptop and smartphone fleets with passkey hardware tokens, Zero Trust device posture checking, and automated remote lockdown upon departure.",
      metrics: ["FIDO2 Hardware Passkeys", "SOC 2 Type II Certified", "Fleet-Wide Remote Lock"]
    },
    {
      id: "oem_platform",
      title: "OEM Platform",
      icon: "🏭",
      href: "/oem",
      badge: "MANUFACTURING",
      tagline: "Factory TAC Range Allocation & Device Minting",
      description: "Enables phone manufacturers (Samsung, Apple, Xiaomi, Tecno) to pre-mint cryptographic hardware passports directly at assembly line testing.",
      metrics: ["GSMA TAC Range Sync", "Factory Cryptographic Signing", "Anti-Cloning Shield"]
    },
    {
      id: "retail_platform",
      title: "Retail Platform",
      icon: "🏪",
      href: "/retail",
      badge: "POINT OF SALE",
      tagline: "Trade-In Verification & Refurbished Certification",
      description: "Equips phone retailers and repair shops with instant POS IMEI clean-check scanners to prevent purchasing or servicing stolen devices.",
      metrics: ["Instant POS QR Scanner", "Trade-In Valuation Engine", "Certified Clean Seal"]
    },
    {
      id: "marketplace",
      title: "Marketplace",
      icon: "🛒",
      href: "/marketplace",
      badge: "COMMERCE",
      tagline: "Verified Clean Device & Hardware Store",
      description: "Peer-to-peer and refurbished marketplace where every listed device has a verified 100% clean IMEI, active warranty, and immutable transfer history.",
      metrics: ["100% Verified Clean IMEIs", "Escrow Escrow Protection", "Instant Title Transfer"]
    },
    {
      id: "developer_platform",
      title: "Developer Platform",
      icon: "⚡",
      href: "/developer",
      badge: "API & SDKs",
      tagline: "REST, GraphQL, Webhooks & CLI Tools",
      description: "Full API suite for security developers, fintech builders, and logistics platforms. Includes interactive playgrounds, webhooks, and official client SDKs.",
      metrics: ["REST & GraphQL Gateway", "10,000 req/min Rate Limit", "Real-time Event Webhooks"]
    },
    {
      id: "ai_platform",
      title: "AI Platform",
      icon: "🧠",
      href: "/ai-assistant",
      badge: "NEURAL INTELLIGENCE",
      tagline: "Gemini 1.5 Flash Vision & Court Affidavit Generator",
      description: "Neural engine that analyzes physical purchase receipts via OCR, automatically drafts court affidavits, and correlates cross-network theft patterns.",
      metrics: ["Gemini 1.5 Flash OCR", "Natural Language Investigation", "Automated Risk Scoring"]
    },
    {
      id: "data_platform",
      title: "Data Platform",
      icon: "📊",
      href: "/analytics",
      badge: "TELEMETRY",
      tagline: "National Theft Heatmaps & Device Analytics",
      description: "Real-time spatial data engine providing national crime density maps, carrier loss ratio metrics, and predictive anti-theft intelligence.",
      metrics: ["Spatial Crime Heatmaps", "Carrier Loss Ratio Analytics", "Real-Time Telemetry"]
    },
    {
      id: "partner_network",
      title: "Partner Network",
      icon: "🤝",
      href: "/partners",
      badge: "ECOSYSTEM",
      tagline: "Global Telecoms, Insurers, & Security Vendors",
      description: "Interconnected partner network joining GSMA, Safaricom, Jubilee Insurance, DCI, and international recovery networks into a unified coalition.",
      metrics: ["Multi-Carrier Coalition", "Global Interconnect Mesh", "Unified Threat Feed"]
    },
    {
      id: "public_apis",
      title: "Public APIs",
      icon: "🌐",
      href: "/api-docs",
      badge: "OPEN GATEWAY",
      tagline: "Public *#06# IMEI Lookup & Verification Endpoints",
      description: "Free public verification API for consumers, second-hand buyers, and mobile app developers to verify stolen device status globally.",
      metrics: ["Free Public Lookup", "Sub-20ms Response Time", "Zero-Authentication Tier"]
    },
    {
      id: "global_registry",
      title: "Global Registry",
      icon: "🗺️",
      href: "/imei",
      badge: "DECENTRALIZED DB",
      tagline: "Blockchain Device DNA & Ownership Ledger",
      description: "Immutable, distributed ledger holding cryptographically signed proof-of-ownership records, ownership transfer histories, and lost/stolen statuses.",
      metrics: ["Immutable Block Signatures", "Cross-Border Recovery", "Zero Double-Registration"]
    },
    {
      id: "trust_network",
      title: "Trust Network",
      icon: "🛡️",
      href: "/operations",
      badge: "SECURITY & RELIABILITY",
      tagline: "99.994% Uptime SLA & OpenTelemetry Monitoring",
      description: "High-reliability trust mesh featuring multi-region cloud replication, automated point-in-time snapshot backups, and SOC 2 Type II compliance.",
      metrics: ["99.994% System Uptime", "Multi-Region Cloud Failover", "SOC 2 Type II Certified"]
    },
  ];

  const activeNode = ecosystemNodes.find(n => n.id === selectedNode) || ecosystemNodes[0];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Hero Header */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))", borderColor: "var(--sky)44", marginBottom: "2rem", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <SimTraceLogo size={72} showText={false} />
        </div>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.25em", color: "var(--sky)", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
          Unified Architecture Map
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
          The Complete <span style={{ background: "linear-gradient(135deg, var(--sky), var(--indigo))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SimTrace Ecosystem</span>
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text2)", maxWidth: 680, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
          16 interconnected platforms forming the world's most advanced anti-theft, device recovery, carrier signaling, and criminal evidence network.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.88rem", textDecoration: "none" }}>
            Get Started Free →
          </Link>
          <Link href="/developer" className="btn-ghost" style={{ padding: "8px 20px", fontSize: "0.88rem", border: "1px solid var(--border)", textDecoration: "none" }}>
            ⚡ Developer API Portal
          </Link>
        </div>
      </div>

      {/* Main Grid & Active Node Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }}>
        {/* Left: 16 Ecosystem Nodes Grid */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🌐 Interactive Platform Nodes</span>
            <span style={{ fontSize: "0.72rem", color: "var(--sky)", background: "var(--sky)22", border: "1px solid var(--sky)44", padding: "2px 8px", borderRadius: 12 }}>
              16 Core Pillars
            </span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "0.85rem" }}>
            {ecosystemNodes.map(node => {
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  style={{
                    background: isSelected ? "var(--surface)" : "var(--bg)",
                    border: `1px solid ${isSelected ? "var(--sky)" : "var(--border)"}`,
                    borderRadius: 12,
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 10px 20px -5px rgba(14,165,233,0.25)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{node.icon}</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: isSelected ? "var(--sky)" : "var(--muted)", background: isSelected ? "var(--sky)22" : "var(--surface)", padding: "2px 6px", borderRadius: 4 }}>
                      {node.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: isSelected ? "var(--sky)" : "var(--text)", marginBottom: 4 }}>
                    {node.title}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {node.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Node Detail Card */}
        <div style={{ position: "sticky", top: "1rem", height: "fit-content" }}>
          <div
            className="card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--sky)44",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "2rem", width: 50, height: 50, borderRadius: "50%", background: "var(--sky)22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {activeNode.icon}
              </div>
              <div>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--sky)", background: "var(--sky)22", padding: "2px 8px", borderRadius: 12 }}>
                  {activeNode.badge}
                </span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "2px 0 0 0" }}>{activeNode.title}</h3>
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              {activeNode.description}
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.85rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>PLATFORM SPECIFICATIONS:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {activeNode.metrics.map((m, idx) => (
                  <div key={idx} style={{ fontSize: "0.8rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ color: "var(--emerald)", fontWeight: 800 }}>✓</span> {m}
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={activeNode.href}
              className="btn-primary"
              style={{
                display: "block",
                textAlign: "center",
                padding: "0.75rem",
                fontSize: "0.88rem",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Open {activeNode.title} Module →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
