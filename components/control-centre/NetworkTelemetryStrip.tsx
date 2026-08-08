"use client";

import React from "react";
import { Smartphone, AlertTriangle, CheckCircle2, Radio, Activity } from "lucide-react";
import { useSiteConfig } from "../SiteConfigContext";

export default function NetworkTelemetryStrip() {
  const { config } = useSiteConfig();
  const { telemetry } = config;

  return (
    <section className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-2xl p-1 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#1769FF]/20 bg-[#071A3A] rounded-xl overflow-hidden">
        
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 text-center space-y-1">
          <div className="text-[10px] font-mono font-bold text-[#18C8FF] uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> DEVICE SIGNALS
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">
            {telemetry.protectedDevices}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Active Monitored Hardware</div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 text-center space-y-1">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE PROTECTION
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {telemetry.activeProtection}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Encrypted Device Vaults</div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 text-center space-y-1">
          <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> OPEN INCIDENTS
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
            {telemetry.openIncidents}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Under Active Containment</div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 text-center space-y-1">
          <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> RECOVERY CASES
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            {telemetry.recoveryCases}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">In Police Coordination</div>
        </div>

        {/* Metric 5 */}
        <div className="p-4 sm:p-5 text-center space-y-1 col-span-2 md:col-span-1">
          <div className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> NETWORK PARTNERS
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
            {telemetry.networkPartners}+
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Telecom Cores & Retailers</div>
        </div>

      </div>
    </section>
  );
}
