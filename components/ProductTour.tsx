"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export interface TourStep {
  targetTitle: string;
  badge: string;
  description: string;
  featureHref: string;
  icon: string;
  highlightDetails: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    targetTitle: "1. National IMEI & Device DNA Registry",
    badge: "CORE SECURITY",
    description: "Every device is minted with a unique Device DNA cryptographic signature on the blockchain. Dial *#06# on any phone to check clean ownership or verify stolen status.",
    featureHref: "/imei",
    icon: "🔍",
    highlightDetails: [
      "GSMA & CEIR real-time query",
      "Cryptographic ownership transfer",
      "Cloning & spoofing risk score"
    ]
  },
  {
    targetTitle: "2. Live GPS & Silent Evidence Capture",
    badge: "ANTI-THEFT RECOVERY",
    description: "When a device is reported stolen, background triggers silently record camera snapshots, GPS tracking points, and audio logs to build an admissible court evidence bundle.",
    featureHref: "/devices",
    icon: "📡",
    highlightDetails: [
      "30-second interval satellite pinpointing",
      "Silent selfie capture on invalid PIN attempts",
      "Automated evidence chain-of-custody"
    ]
  },
  {
    targetTitle: "3. AI Investigation & Neural Intelligence",
    badge: "AI PLATFORM",
    description: "Gemini-powered neural assistant parses police reports, generates court affidavits, runs OCR on physical ID receipts, and triages high-priority theft alerts.",
    featureHref: "/ai-assistant",
    icon: "🧠",
    highlightDetails: [
      "Automated legal affidavit generation",
      "OCR receipt & ID scanner",
      "Natural language investigative queries"
    ]
  },
  {
    targetTitle: "4. Telecom Operator & SS7 Core Gateway",
    badge: "CARRIER INTEGRATION",
    description: "Direct integration with Safaricom, Airtel, and Telkom network cores for instantaneous SIM swap detection and nationwide IMEI blacklisting.",
    featureHref: "/telecom/dashboard",
    icon: "📡",
    highlightDetails: [
      "Sub-second SS7 / Diameter network signaling",
      "Instant cell tower triangulation",
      "CEIR automated blacklist broadcast"
    ]
  },
  {
    targetTitle: "5. Commercial Ecosystem & Marketplace",
    badge: "ENTERPRISE MONETIZATION",
    description: "Verified clean device marketplace, Jubilee micro-insurance policies, OEM TAC range licensing, M-Pesa automated subscriptions, and white-label enterprise portals.",
    featureHref: "/marketplace",
    icon: "🛒",
    highlightDetails: [
      "SimTrace Clean-IMEI Marketplace",
      "Automated insurance claims underwriting",
      "White-label custom government branding"
    ]
  },
  {
    targetTitle: "6. Developer API Platform & Webhooks",
    badge: "DEVELOPER ECOSYSTEM",
    description: "Public REST API, GraphQL gateway, official Node/Python SDKs, terminal CLI tool (`simtrace-cli`), and webhooks for third-party security developers.",
    featureHref: "/developer",
    icon: "⚡",
    highlightDetails: [
      "Interactive REST & GraphQL playground",
      "Real-time event webhooks",
      "Client SDKs & OAuth 2.0 applications"
    ]
  },
  {
    targetTitle: "7. Enterprise Operations & Reliability",
    badge: "SOC & RELIABILITY",
    description: "Centralized observability, multi-region failover, automated point-in-time snapshot backups, chaos testing, and GSMA ISO 27001 compliance audit reports.",
    featureHref: "/operations",
    icon: "🛡️",
    highlightDetails: [
      "99.994% Uptime SLA with 18ms latency",
      "Automated chaos engineering injectors",
      "SOC 2 Type II & GDPR compliance packages"
    ]
  }
];

export default function ProductTour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 580,
          width: "100%",
          background: "var(--bg)",
          border: "1px solid var(--sky)44",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          borderRadius: 16,
          padding: "1.5rem",
          position: "relative",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Progress header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>{step.icon}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: 12, background: "var(--sky)22", color: "var(--sky)", border: "1px solid var(--sky)44" }}>
              {step.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}
          >
            ✕
          </button>
        </div>

        {/* Step indicator bar */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "1.25rem" }}>
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: idx <= currentStepIndex ? "var(--sky)" : "var(--border)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Title & Description */}
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--text)" }}>
          {step.targetTitle}
        </h2>
        <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.5, marginBottom: "1rem" }}>
          {step.description}
        </p>

        {/* Highlights List */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8, marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>KEY CAPABILITIES:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {step.highlightDetails.map((h, i) => (
              <div key={i} style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text)" }}>
                <span style={{ color: "var(--emerald)", fontWeight: 800 }}>✓</span> {h}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            href={step.featureHref}
            onClick={onClose}
            style={{ fontSize: "0.82rem", color: "var(--sky)", fontWeight: 700, textDecoration: "none" }}
          >
            Explore {step.badge} Module →
          </Link>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex(c => c - 1)}
                className="btn-ghost"
                style={{ padding: "6px 14px", fontSize: "0.82rem", border: "1px solid var(--border)" }}
              >
                Back
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setCurrentStepIndex(c => c + 1)}
                className="btn-primary"
                style={{ padding: "6px 16px", fontSize: "0.82rem" }}
              >
                Next Step ({currentStepIndex + 1}/{TOUR_STEPS.length})
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn-primary"
                style={{ padding: "6px 18px", fontSize: "0.82rem", background: "var(--emerald)" }}
              >
                🎉 Complete Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
