"use client";

import React, { useState, useEffect } from "react";
import { Cpu, ShieldAlert, Clock, MapPin, Network, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function EntityDetailPage({ params }: { params?: { id: string } }) {
  const entityId = params?.id || "e1";
  const [entity, setEntity] = useState<any>({
    id: entityId,
    name: "Samsung Galaxy S24 Ultra",
    type: "DEVICE",
    externalId: "IMEI358992019921101",
    riskScore: 78,
    status: "flagged",
    createdAt: "2026-07-15T10:00:00Z",
  });

  const [timeline, setTimeline] = useState([
    { id: "t1", time: "2026-08-01 01:15", title: "IMPOSSIBLE_TRAVEL", desc: "Displacement speed 840 km/h detected", severity: "critical" },
    { id: "t2", time: "2026-07-28 14:30", title: "SIM_CHANGED", desc: "Connected to Safaricom SIM +254700***111", severity: "warning" },
    { id: "t3", time: "2026-07-20 09:00", title: "CASE_LINKED", desc: "Linked to police theft investigation Case #102", severity: "error" },
    { id: "t4", time: "2026-07-15 10:00", title: "DEVICE_SEEN", desc: "Registered in national telemetry stream", severity: "info" },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Back Button */}
      <Link href="/intelligence/graph" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Graph Explorer
      </Link>

      {/* Header Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{entity.name}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Risk Score {entity.riskScore} / 100
              </span>
            </div>
            <div className="text-sm font-mono text-slate-400 mt-1">
              External ID: <span className="text-slate-200">{entity.externalId}</span> | Type: <span className="text-blue-400">{entity.type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            Flag as Stolen / Blacklisted
          </button>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition">
            Export Dossier PDF
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Entity Attributes & Metadata */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Entity Attributes</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Manufacturer</span>
              <span className="text-slate-200 font-medium">Samsung</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Model</span>
              <span className="text-slate-200 font-medium">Galaxy S24 Ultra</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">First Seen</span>
              <span className="text-slate-200 font-medium">15 July 2026</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Associated SIMs</span>
              <span className="text-slate-200 font-medium">4 SIM Cards</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Known Locations</span>
              <span className="text-slate-200 font-medium">Nairobi, Mombasa</span>
            </div>
          </div>
        </div>

        {/* Intelligence Graph Connections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Direct Graph Edges</h2>
            <Network className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Safaricom SIM +254700***111</div>
                <div className="text-[10px] text-slate-400 font-mono">Edge: DEVICE_USED_SIM</div>
              </div>
              <span className="text-xs font-medium text-emerald-400">98% Confidence</span>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Case #102 Investigation</div>
                <div className="text-[10px] text-slate-400 font-mono">Edge: DEVICE_LINKED_TO_CASE</div>
              </div>
              <span className="text-xs font-medium text-rose-400">Active Case</span>
            </div>
          </div>
        </div>

        {/* Intelligence Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Intelligence Event History</h2>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>

          <div className="relative pl-4 border-l-2 border-slate-800 space-y-4">
            {timeline.map((ev) => (
              <div key={ev.id} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div className="text-xs text-slate-400">{ev.time}</div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">{ev.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{ev.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
