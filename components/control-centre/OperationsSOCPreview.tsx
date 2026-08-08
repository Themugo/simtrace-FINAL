"use client";

import React from "react";
import Link from "next/link";
import { Server, Activity, ShieldCheck, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { CENTRAL_NETWORK_DATA } from "../../lib/networkData";

export default function OperationsSOCPreview() {
  const { telemetry } = CENTRAL_NETWORK_DATA;

  return (
    <section className="bg-[#0B2B66]/60 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#1769FF]/20 pb-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
            <Server className="w-3.5 h-3.5" /> SOC COMMAND DASHBOARD
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            SIMTRACE Operations Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Live overview of global threat signals, active recovery cases, and carrier network integrity.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/operations"
            className="px-6 py-3.5 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <span>OPEN OPERATIONS ROOM</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        
        <div className="p-4 bg-[#071A3A] border border-slate-700/80 rounded-2xl space-y-1">
          <div className="text-[10px] text-slate-400">NETWORK HEALTH</div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONAL</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1">99.99% Uptime</div>
        </div>

        <div className="p-4 bg-[#071A3A] border border-slate-700/80 rounded-2xl space-y-1">
          <div className="text-[10px] text-slate-400">SECURITY SIGNALS</div>
          <div className="text-xl font-bold text-white">86 Active Signals</div>
          <div className="text-[10px] text-cyan-300 pt-1">3 Anomaly Flags</div>
        </div>

        <div className="p-4 bg-[#071A3A] border border-slate-700/80 rounded-2xl space-y-1">
          <div className="text-[10px] text-slate-400">ACTIVE INCIDENTS</div>
          <div className="text-xl font-bold text-rose-400">{telemetry.openIncidents} Cases</div>
          <div className="text-[10px] text-slate-400 pt-1">Automated Containment</div>
        </div>

        <div className="p-4 bg-[#071A3A] border border-slate-700/80 rounded-2xl space-y-1">
          <div className="text-[10px] text-slate-400">RECOVERY CASES</div>
          <div className="text-xl font-bold text-emerald-400">{telemetry.recoveryCases} Active</div>
          <div className="text-[10px] text-slate-400 pt-1">Law Enforcement Linked</div>
        </div>

      </div>

      <div className="p-4 bg-[#071A3A]/80 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 font-mono">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Recovery actions are subject to authorization, applicable law, and partner permissions.</span>
        </div>
        <span className="text-[11px] text-[#18C8FF] shrink-0 font-bold">ISO 27001 & SOC 2 COMPLIANT</span>
      </div>
    </section>
  );
}
