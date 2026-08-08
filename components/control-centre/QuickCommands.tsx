"use client";

import React from "react";
import Link from "next/link";
import { Search, AlertTriangle, Radio, Lock, FileText, Bell, Terminal, ArrowRight } from "lucide-react";
import { CENTRAL_NETWORK_DATA } from "../../lib/networkData";

export default function QuickCommands() {
  const { quickCommands } = CENTRAL_NETWORK_DATA;

  const iconMap: Record<string, React.ReactNode> = {
    verify: <Search className="w-5 h-5 text-[#18C8FF]" />,
    report: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    track: <Radio className="w-5 h-5 text-emerald-400" />,
    lock: <Lock className="w-5 h-5 text-amber-400" />,
    case: <FileText className="w-5 h-5 text-purple-400" />,
    alerts: <Bell className="w-5 h-5 text-cyan-400" />,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#18C8FF]" />
          <h2 className="text-lg sm:text-xl font-extrabold text-white font-mono uppercase tracking-wider">
            QUICK RESPONSE COMMANDS
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400 hidden sm:inline">
          Keyboard Command Surface Ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickCommands.map((cmd) => (
          <Link
            key={cmd.id}
            href={cmd.route}
            className="group bg-[#0B2B66]/70 hover:bg-[#0B2B66] border border-[#1769FF]/30 hover:border-[#18C8FF] rounded-2xl p-5 transition flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-[#071A3A] border border-[#1769FF]/20 group-hover:border-[#18C8FF]/40 transition shrink-0">
                {iconMap[cmd.id]}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-white group-hover:text-[#18C8FF] transition flex items-center gap-2">
                  <span>{cmd.title}</span>
                </div>
                <div className="text-xs text-slate-300">
                  {cmd.subtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden xl:inline-block px-2 py-1 rounded bg-[#071A3A] border border-slate-700/80 text-[10px] font-mono text-slate-400 font-bold">
                {cmd.keyHint}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#18C8FF] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
