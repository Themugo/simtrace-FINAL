"use client";

import React from "react";
import { AlertTriangle, Lock, Radio, ShieldCheck, Landmark, CheckCircle2, ArrowRight } from "lucide-react";
import { CENTRAL_NETWORK_DATA } from "../../lib/networkData";

export default function IncidentPipeline() {
  const { incidentPipeline } = CENTRAL_NETWORK_DATA;

  const iconMap: Record<string, React.ReactNode> = {
    '01': <AlertTriangle className="w-4 h-4 text-rose-400" />,
    '02': <Lock className="w-4 h-4 text-amber-400" />,
    '03': <Radio className="w-4 h-4 text-[#18C8FF]" />,
    '04': <ShieldCheck className="w-4 h-4 text-[#18C8FF]" />,
    '05': <Landmark className="w-4 h-4 text-indigo-400" />,
    '06': <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  };

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
          <span>RESPONSE PROTOCOL</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Incident Response Pipeline
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Automated six-stage recovery coordination sequence executed upon incident registration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        {incidentPipeline.map((item) => (
          <div
            key={item.step}
            className="bg-[#071A3A] border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-4 space-y-3 relative transition shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-[#0B2B66] border border-[#1769FF]/40 text-[#18C8FF] font-mono font-bold text-xs flex items-center justify-center">
                {item.step}
              </span>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                item.code === 'REPORT' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                item.code === 'CONTAIN' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                item.code === 'LOCATE' ? 'bg-[#18C8FF]/10 text-[#18C8FF] border-[#18C8FF]/20' :
                item.code === 'VERIFY' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                item.code === 'RECOVER' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}>
                {item.code}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-[#18C8FF] transition">
                {iconMap[item.step]}
                <span>{item.label}</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Status:</span>
              <span className="text-white font-bold">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
