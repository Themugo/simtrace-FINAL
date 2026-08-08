"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Code, Terminal, Copy, Check, ExternalLink, ArrowRight, Server } from "lucide-react";

export default function DeveloperNetwork() {
  const [copied, setCopied] = useState(false);

  const snippet = `curl -X GET "https://api.simtrace.io/v1/devices/861028049120482" \\
  -H "Authorization: Bearer st_live_key_9981248" \\
  -H "Accept: application/json"`;

  const copyCode = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column Info */}
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
            <Code className="w-3.5 h-3.5" /> DEVELOPER CONNECTIVITY
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Build on SIMTRACE Device Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Embed device verification, IMEI threat checking, and SIM swap risk scoring directly into your apps, marketplaces, or enterprise portals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 bg-[#071A3A] border border-slate-700/80 rounded-xl space-y-0.5">
              <div className="text-[10px] text-slate-400">AVAILABILITY</div>
              <div className="font-bold text-emerald-400">99.9% SLA UPTIME</div>
            </div>
            <div className="p-3 bg-[#071A3A] border border-slate-700/80 rounded-xl space-y-0.5">
              <div className="text-[10px] text-slate-400">INTEGRATION</div>
              <div className="font-bold text-[#18C8FF]">REST & WEBHOOKS</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/developer"
              className="px-5 py-3 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <span>OPEN DEVELOPER PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/docs"
              className="px-4 py-3 bg-[#071A3A] hover:bg-[#0B2B66] text-slate-300 border border-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>API Documentation</span>
            </Link>
          </div>
        </div>

        {/* Right Column Code Terminal */}
        <div className="lg:col-span-6 bg-[#071A3A] border border-[#1769FF]/40 rounded-2xl p-5 font-mono text-xs space-y-3 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-2 text-white font-bold">
              <Terminal className="w-4 h-4 text-[#18C8FF]" />
              GET /v1/devices/:imei
            </span>
            <button
              onClick={copyCode}
              className="px-2.5 py-1 rounded bg-[#0B2B66] hover:bg-[#1769FF] text-slate-200 text-[10px] font-bold transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "COPIED" : "COPY"}</span>
            </button>
          </div>

          <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto p-2 bg-[#05132B] rounded-xl border border-slate-800">
            <code>{snippet}</code>
          </pre>

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
            <div>Available Endpoints:</div>
            <div className="text-[#18C8FF] font-semibold">• POST /v1/risk/score</div>
            <div className="text-[#18C8FF] font-semibold">• POST /v1/alerts/sim-swap</div>
            <div className="text-[#18C8FF] font-semibold">• GET /v1/devices/:imei/history</div>
          </div>
        </div>

      </div>
    </section>
  );
}
