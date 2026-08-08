"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, Bell, User, Megaphone } from "lucide-react";
import { useSiteConfig } from "../SiteConfigContext";

export default function CommandHeader() {
  const { config } = useSiteConfig();
  const { telemetry } = config;

  return (
    <div className="space-y-3">
      {/* Dynamic Announcement Banner if enabled */}
      {config.bannerEnabled && (
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono font-bold shadow-lg backdrop-blur-md ${
          config.bannerType === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
          config.bannerType === 'critical' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
          config.bannerType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          'bg-[#1769FF]/10 border-[#1769FF]/30 text-[#18C8FF]'
        }`}>
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{config.bannerMessage}</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#071A3A] border border-slate-700 text-[10px] text-slate-300">
            ADMIN LIVE BROADCAST
          </span>
        </div>
      )}

      {/* Primary Command Shell Bar */}
      <div className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left branding & System label */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#1769FF]/20 border border-[#1769FF]/40 text-[#18C8FF] text-[10px] font-mono font-bold uppercase tracking-wider">
                COMMAND SURFACE
              </span>
              <span className="text-xs font-mono text-slate-300">{config.version}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{config.brandName}</span>
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              {config.tagline}
            </p>
          </div>

          {/* Right Status & Admin Quick Access */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#071A3A] border border-[#1769FF]/30 text-emerald-400 font-bold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>● NETWORK {telemetry.status}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#071A3A]/80 border border-slate-700/80 text-slate-300 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-[#18C8FF]" />
              <span>Sync: <strong className="text-white">{telemetry.lastSync}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5 shadow-md"
                title="Admin Redesign Studio"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>ADMIN REDESIGN</span>
              </Link>

              <Link
                href="/alerts"
                className="p-2.5 rounded-xl bg-[#071A3A] hover:bg-[#0B2B66] border border-slate-700/80 text-slate-300 hover:text-white transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1769FF] hover:bg-blue-600 text-white font-bold transition shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Login</span>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
