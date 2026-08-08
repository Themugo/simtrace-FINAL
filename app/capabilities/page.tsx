"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  MapPin,
  Camera,
  Users,
  Sparkles,
  Landmark,
  ArrowRight,
  Radio,
  Lock,
  Globe,
  CheckCircle2
} from "lucide-react";

const CAPABILITIES = [
  {
    id: "device-identity",
    num: "01",
    title: "IMEI Intelligence",
    subtitle: "DEVICE IDENTITY",
    desc: "Verify device identity, blacklists, and ownership history before buying, selling, or registering a device.",
    icon: ShieldCheck,
    href: "/imei",
    color: "#38bdf8",
    statusText: "GSMA / CEIR SYNC",
    liveMetric: "Instant Global Registry Query",
  },
  {
    id: "threat-detection",
    num: "02",
    title: "SIM & Network Threat Detection",
    subtitle: "THREAT DETECTION",
    desc: "Real-time monitoring for unauthorized SIM swaps, IMSI anomalies, and SS7 network intrusions.",
    icon: ShieldAlert,
    href: "/alerts",
    color: "#f43f5e",
    statusText: "SS7 / DIAMETER ACTIVE",
    liveMetric: "Sub-Second Threat Dispatched",
  },
  {
    id: "guardian-protection",
    num: "03",
    title: "Guardian Safety",
    subtitle: "GUARDIAN PROTECTION",
    desc: "Proactive automated defense for family members, emergency contacts, and high-risk mobile assets.",
    icon: Shield,
    href: "/guardian",
    color: "#3b82f6",
    statusText: "GEOFENCE ARMED",
    liveMetric: "Continuous Geofence Ping",
  },
  {
    id: "incident-response",
    num: "04",
    title: "Lost & Stolen Device Response",
    subtitle: "INCIDENT RESPONSE",
    desc: "Instant remote lockdown, GPS telemetry tracking, and court-admissible evidence accumulation.",
    icon: MapPin,
    href: "/cases",
    color: "#10b981",
    statusText: "GPS DISPATCH ACTIVE",
    liveMetric: "30s Location Telemetry Ping",
  },
  {
    id: "digital-evidence",
    num: "05",
    title: "Evidence & Case Intelligence",
    subtitle: "DIGITAL EVIDENCE",
    desc: "Tamper-proof forensic snapshot vault with automated chain-of-custody logging for law enforcement.",
    icon: Camera,
    href: "/evidence",
    color: "#a855f7",
    statusText: "CHAIN-OF-CUSTODY",
    liveMetric: "SHA-256 Immutable Audit",
  },
  {
    id: "community-security",
    num: "06",
    title: "Community Detection",
    subtitle: "COMMUNITY MESH",
    desc: "Crowdsourced beacon discovery network helping pinpoint lost hardware in dense urban environments.",
    icon: Users,
    href: "/community",
    color: "#f59e0b",
    statusText: "1,420 ACTIVE NODES",
    liveMetric: "Peer-to-Peer Bluetooth Mesh",
  },
  {
    id: "fraud-intelligence",
    num: "07",
    title: "Device & Transaction Risk",
    subtitle: "FRAUD INTELLIGENCE",
    desc: "AI-driven detection of IMEI cloning, carrier billing fraud, and illicit second-hand market listings.",
    icon: Sparkles,
    href: "/intelligence",
    color: "#6366f1",
    statusText: "0% CLONE TOLERANCE",
    liveMetric: "Neural Behavioral Scoring",
  },
  {
    id: "institutional-recovery",
    num: "08",
    title: "Government & Authorized Networks",
    subtitle: "INSTITUTIONAL LEO",
    desc: "Direct integration with police precincts, customs authorities, and official judicial warrant relays.",
    icon: Landmark,
    href: "/police/dashboard",
    color: "#0284c7",
    statusText: "PRECINCT DIRECT",
    liveMetric: "Court Warrant Automated Relay",
  },
  {
    id: "forensic-sdk",
    num: "09",
    title: "Forensic SDK Integration",
    subtitle: "DEVELOPER TELEMETRY",
    desc: "Embed low-level baseband telemetry, secure enclave attestation, and court-admissible evidence capture.",
    icon: Radio,
    href: "/sdk",
    color: "#38bdf8",
    statusText: "FIPS 140-3 COMPLIANT",
    liveMetric: "Sub-Second Baseband Monitoring",
  }
];

export default function CapabilitiesPage() {
  return (
    <div className="min-h-screen bg-[#070D1B] text-slate-100 p-6 md:p-12 space-y-10">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-mono font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> SECURITY INFRASTRUCTURE CAPABILITIES
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          One Network. Multiple Layers of Protection.
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Explore SIMTRACE security capabilities, telemetry monitoring, and law enforcement integrations.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CAPABILITIES.map((cap) => {
          const IconComponent = cap.icon;
          return (
            <Link
              key={cap.id}
              href={cap.href}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 transition flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${cap.color}15`,
                    color: cap.color,
                    border: `1px solid ${cap.color}35`,
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-blue-400 transition">
                  {cap.num}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {cap.subtitle}
                </div>
                <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                  {cap.title}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="p-3 bg-[#070D1B] border border-slate-800/80 rounded-2xl space-y-1 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Telemetry</span>
                  <span style={{ color: cap.color }} className="font-bold">{cap.statusText}</span>
                </div>
                <div className="text-slate-200 font-bold">
                  {cap.liveMetric}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-blue-400 group-hover:text-blue-300">
                <span>Explore Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
