"use client";
import { useState } from "react";
import Link from "next/link";

export default function CustomerSuccessDocsPage() {
  const [activeCategory, setActiveCategory] = useState<"onboarding" | "carrier" | "police" | "developer" | "faq">("onboarding");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))", borderColor: "var(--sky)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--sky), var(--indigo))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#fff", fontWeight: 800 }}>
              📚
            </div>
            <div>
              <h1 style={{ fontSize: "1.35rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Customer Success Center & Platform Knowledge Base
                <span style={{ fontSize: "0.7rem", background: "var(--sky)22", color: "var(--sky)", border: "1px solid var(--sky)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  v2.8 Enterprise Guide
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Comprehensive documentation, onboarding walkthroughs, carrier SS7 manuals, and law enforcement training guides.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "onboarding", label: "📱 Consumer Onboarding Guide" },
          { id: "carrier", label: "📡 Telecom & SS7 Core Integration" },
          { id: "police", label: "🏛️ Law Enforcement Court Affidavits" },
          { id: "developer", label: "⚡ Developer API & Webhooks" },
          { id: "faq", label: "❓ Frequently Asked Questions" },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeCategory === cat.id ? "var(--sky)" : "var(--border)"}`,
              background: activeCategory === cat.id ? "var(--surface)" : "transparent",
              color: activeCategory === cat.id ? "var(--sky)" : "var(--text2)",
              fontWeight: activeCategory === cat.id ? 700 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category Content */}
      {activeCategory === "onboarding" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Step 1: Dial *#06# to Extract Device IMEI</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1rem" }}>
              The International Mobile Equipment Identity (IMEI) is a 15-digit unique serial number embedded in your phone's cellular baseband modem. Dialing *#06# displays the IMEI on iOS, Android, and feature phones.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--sky)", marginBottom: 4 }}>1. Extract IMEI</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>Dial *#06# or inspect physical phone tray/box label.</p>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 4 }}>2. Register DNA</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>Register under 'My Devices' to mint blockchain ownership passport.</p>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--indigo)", marginBottom: 4 }}>3. Active Watch</div>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>SimTrace background agent continuously monitors for SIM swap events.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "carrier" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>SS7 / Diameter Core Gateway Specification</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1rem" }}>
              Telecom carriers establish a secure VPN IPsec tunnel with the SimTrace CEIR cluster to transmit signaling messages (MAP_CANCEL_LOCATION, MAP_SEND_AUTHENTICATION_INFO).
            </p>
            <div style={{ background: "var(--bg)", padding: "1rem", borderRadius: 8, fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--emerald)" }}>
              [SS7-Core] MAP_CANCEL_LOCATION received for IMSI 639021002341098 → IMEI Match 356938035643809 → Blacklist Enforced
            </div>
          </div>
        </div>
      )}

      {activeCategory === "police" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Admissible Court Affidavit Generation</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1rem" }}>
              Law enforcement officers can generate standardized, digital-signed evidence dossiers containing GPS heatmaps, cell tower triangulation logs, and photo snapshots.
            </p>
            <Link href="/law-enforcement" className="btn-primary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.82rem", textDecoration: "none" }}>
              Open Law Enforcement Portal →
            </Link>
          </div>
        </div>
      )}

      {activeCategory === "developer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Developer API Documentation</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1rem" }}>
              Full REST API, GraphQL schemas, and webhook callback configurations are hosted under our Developer Platform.
            </p>
            <Link href="/developer" className="btn-primary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.82rem", textDecoration: "none" }}>
              Open Developer Platform →
            </Link>
          </div>
        </div>
      )}

      {activeCategory === "faq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Frequently Asked Questions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {[
                { q: "Is SimTrace compatible with dual-SIM phones?", a: "Yes. Dual-SIM devices have two distinct 15-digit IMEI numbers. SimTrace automatically registers both IMEIs under a single owner account." },
                { q: "What happens if a thief inserts a new SIM card into my stolen phone?", a: "SimTrace detects the IMSI-IMEI mismatch at the cell tower level within 30 seconds and broadcasts a lockdown alert." },
                { q: "Are police reports digitally submitted to the Directorate of Criminal Investigations (DCI)?", a: "Yes, reports filed through SimTrace are synchronized directly with DCI cybercrime division databases." },
              ].map((item, i) => (
                <div key={i} style={{ background: "var(--surface)", padding: "0.85rem 1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 4 }}>{item.q}</div>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
