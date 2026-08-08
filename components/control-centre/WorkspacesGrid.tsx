"use client";

import React from "react";
import Link from "next/link";
import { Users, Radio, Building2, Landmark, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { CENTRAL_NETWORK_DATA } from "../../lib/networkData";

export default function WorkspacesGrid() {
  const { telecomStatus, marketplaceSample } = CENTRAL_NETWORK_DATA;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
          <span>ECOSYSTEM WORKSPACES</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ecosystem Launchers & Control Hubs
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Dedicated portals for individuals, carrier operations, commercial marketplaces, and law enforcement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Workspace 1: Guardian / Personal Security */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-[#18C8FF] border border-blue-500/20 text-xs font-mono font-bold">
                <Users className="w-3.5 h-3.5" /> PERSONAL & GUARDIAN WORKSPACE
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">4 DEVICES MONITORED</span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Protect Family & Personal Assets</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Configure guardian alerts for family smartphones, laptops, emergency contacts, and high-value asset perimeters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
              <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700 text-slate-300 flex items-center justify-between">
                <span>Family Group:</span>
                <strong className="text-white">3 Members</strong>
              </div>
              <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700 text-slate-300 flex items-center justify-between">
                <span>Active Geofences:</span>
                <strong className="text-emerald-400">2 Zones</strong>
              </div>
            </div>
          </div>

          <Link
            href="/guardian"
            className="px-5 py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-between shadow-md"
          >
            <span>Open Guardian Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Workspace 2: Telecom Network */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                <Radio className="w-3.5 h-3.5" /> TELECOM NETWORK
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold">{telecomStatus.partnersCount}</span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Carrier Core Infrastructure Integration</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Connect network intelligence directly into SS7/IMSI switches for instant SIM swap anomaly mitigation.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-[#071A3A] rounded-xl border border-slate-700 text-center">
                <div className="text-[9px] text-slate-400">SIGNALS</div>
                <div className="font-bold text-emerald-400">{telecomStatus.carrierSignals}</div>
              </div>
              <div className="p-2 bg-[#071A3A] rounded-xl border border-slate-700 text-center">
                <div className="text-[9px] text-slate-400">IDENTITY</div>
                <div className="font-bold text-emerald-400">{telecomStatus.deviceIdentity}</div>
              </div>
              <div className="p-2 bg-[#071A3A] rounded-xl border border-slate-700 text-center">
                <div className="text-[9px] text-slate-400">SIM SEC</div>
                <div className="font-bold text-cyan-300">{telecomStatus.simSecurity}</div>
              </div>
            </div>
          </div>

          <Link
            href="/telecom-portal"
            className="px-5 py-3 bg-[#071A3A] hover:bg-[#0B2B66] text-[#18C8FF] border border-[#1769FF]/40 font-bold text-xs rounded-xl transition flex items-center justify-between"
          >
            <span>Open Telecom Control Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Workspace 3: Marketplace Trust Network */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                <Building2 className="w-3.5 h-3.5" /> MARKETPLACE TRUST NETWORK
              </div>
              <span className="text-xs font-mono text-emerald-300 font-bold">PRE-TRADE-IN VERIFIED</span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Verify Before Every Device Trade</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Secondary device trust verification for retailers, trade-in shops, and commercial marketplaces.
              </p>
            </div>

            <div className="p-3 bg-[#071A3A] border border-slate-700 rounded-xl font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span>{marketplaceSample.deviceModel}</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">
                  {marketplaceSample.tradeRecommendation}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300 text-[11px]">
                <span>IMEI Check: <strong className="text-emerald-400">CLEAN (0.01)</strong></span>
                <span>GSMA Status: <strong className="text-emerald-400">CLEAR</strong></span>
              </div>
            </div>
          </div>

          <Link
            href="/advertise"
            className="px-5 py-3 bg-[#071A3A] hover:bg-[#0B2B66] text-[#18C8FF] border border-[#1769FF]/40 font-bold text-xs rounded-xl transition flex items-center justify-between"
          >
            <span>Open Marketplace Controls</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Workspace 4: Police & Law Enforcement */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                <Landmark className="w-3.5 h-3.5" /> AUTHORIZED RECOVERY PORTAL
              </div>
              <span className="text-xs font-mono text-indigo-300 font-bold">LAW ENFORCEMENT CORE</span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Precinct Dispatch & Case Files</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Direct dispatch integration for authorized police officers, precinct investigators, and field recovery teams.
              </p>
            </div>

            <div className="p-3 bg-[#071A3A] border border-slate-700 rounded-xl font-mono text-xs flex items-center justify-between text-slate-300">
              <span>Case Transfer Protocol: <strong className="text-indigo-400">AUTHORIZED ONLY</strong></span>
              <span className="text-emerald-400 font-bold">PORTAL READY</span>
            </div>
          </div>

          <Link
            href="/police/dashboard"
            className="px-5 py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition flex items-center justify-between shadow-md"
          >
            <span>Open Police Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
