"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Cpu, Radio, Camera, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function SecurityOperations() {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
          <ShieldAlert className="w-3.5 h-3.5" /> SOC ENGINE
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Security Operations
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Core operational security modules continuously verifying device hardware and network integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Module 1: SIM Security */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold">
                ● MONITORING
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#18C8FF] transition">
                SIM & IMSI Security
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Real-time detection for SIM swaps, IMSI changes, and SS7 signal hijacking.
              </p>
            </div>
            <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300">
              Signal Status: <strong className="text-emerald-400">0 Threat Anomalies</strong>
            </div>
          </div>

          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#18C8FF] hover:text-white pt-2 border-t border-[#1769FF]/20 transition"
          >
            <span>View SIM Alerts</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Module 2: Device Security */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                ● ACTIVE
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#18C8FF] transition">
                Hardware DNA & Risk
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                GSMA registry matching, clone analysis, and hardware tampering verification.
              </p>
            </div>
            <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300">
              Hardware Check: <strong className="text-emerald-400">GSMA Verified</strong>
            </div>
          </div>

          <Link
            href="/imei"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#18C8FF] hover:text-white pt-2 border-t border-[#1769FF]/20 transition"
          >
            <span>Check Device DNA</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Module 3: Location Intelligence */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-[10px] font-mono font-bold">
                ● TELEMETRY LIVE
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#18C8FF] transition">
                Location Triangulation
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                GPS tracking, cell tower triangulation, and geofence velocity monitoring.
              </p>
            </div>
            <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300">
              Gps Accuracy: <strong className="text-emerald-400">~3 Meters</strong>
            </div>
          </div>

          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#18C8FF] hover:text-white pt-2 border-t border-[#1769FF]/20 transition"
          >
            <span>Open Live Map</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Module 4: Evidence Vault */}
        <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-5 space-y-4 shadow-lg transition flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold">
                ● SHA-256 VAULT
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#18C8FF] transition">
                Chain of Custody
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Cryptographic evidence preservation (photo, audio, timestamps) for legal cases.
              </p>
            </div>
            <div className="p-2.5 bg-[#071A3A] rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300">
              Integrity: <strong className="text-purple-300">Immutable Ledger</strong>
            </div>
          </div>

          <Link
            href="/evidence"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#18C8FF] hover:text-white pt-2 border-t border-[#1769FF]/20 transition"
          >
            <span>Open Evidence Vault</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
