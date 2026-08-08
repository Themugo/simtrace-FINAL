"use client";

import React from "react";
import Link from "next/link";
import { Search, ShieldCheck, AlertTriangle, FileText, Building2, LayoutDashboard, ArrowRight } from "lucide-react";

export default function CommandLauncher() {
  return (
    <section className="bg-gradient-to-r from-[#0B2B66] via-[#071A3A] to-[#0B2B66] border border-[#1769FF]/40 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#18C8FF]/10 blur-3xl pointer-events-none" />

      <div className="space-y-3 max-w-2xl mx-auto relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/20 text-[#18C8FF] border border-[#1769FF]/30 text-xs font-mono font-bold">
          <span>ENTER THE NETWORK</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Enter the SIMTRACE™ Network
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Select an entry command to verify, protect, report, recover, or connect your organization.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto relative z-10 font-mono text-xs">
        
        <Link
          href="/imei"
          className="p-4 bg-[#071A3A] hover:bg-[#1769FF] border border-[#1769FF]/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <Search className="w-5 h-5 text-[#18C8FF] group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Verify Device</span>
        </Link>

        <Link
          href="/register"
          className="p-4 bg-[#071A3A] hover:bg-[#1769FF] border border-[#1769FF]/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Protect Device</span>
        </Link>

        <Link
          href="/report"
          className="p-4 bg-[#071A3A] hover:bg-rose-600 border border-rose-500/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <AlertTriangle className="w-5 h-5 text-rose-400 group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Report Incident</span>
        </Link>

        <Link
          href="/cases"
          className="p-4 bg-[#071A3A] hover:bg-[#1769FF] border border-[#1769FF]/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <FileText className="w-5 h-5 text-purple-400 group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Recover Device</span>
        </Link>

        <Link
          href="/enterprise"
          className="p-4 bg-[#071A3A] hover:bg-[#1769FF] border border-[#1769FF]/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <Building2 className="w-5 h-5 text-amber-400 group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Connect Org</span>
        </Link>

        <Link
          href="/dashboard"
          className="p-4 bg-[#071A3A] hover:bg-[#1769FF] border border-[#1769FF]/30 hover:border-white rounded-2xl text-slate-200 hover:text-white transition space-y-2 flex flex-col items-center justify-center group shadow-md"
        >
          <LayoutDashboard className="w-5 h-5 text-cyan-300 group-hover:text-white" />
          <span className="font-bold uppercase text-[11px]">Control Room</span>
        </Link>

      </div>
    </section>
  );
}
