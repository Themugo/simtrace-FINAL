"use client";

import React, { useState } from "react";
import { Activity, Globe, MapPin, CheckCircle2, ShieldAlert, Radio, RefreshCw, Layers } from "lucide-react";
import { CENTRAL_NETWORK_DATA, ActivityEvent, NetworkNode } from "../../lib/networkData";

export default function NetworkIntelligence() {
  const { activityFeed, networkNodes } = CENTRAL_NETWORK_DATA;
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(networkNodes[0]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 text-[#18C8FF] border border-[#1769FF]/20 text-xs font-mono font-bold">
          <Globe className="w-3.5 h-3.5" /> REAL-TIME TELEMETRY
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Network Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-slate-300">
          Real-time security signals flowing across the SIMTRACE ecosystem nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Activity Stream */}
        <div className="lg:col-span-6 bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1769FF]/20 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <Activity className="w-4 h-4 text-[#18C8FF]" />
                <span>LIVE ACTIVITY FEED</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                STREAMING LIVE
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {activityFeed.map((evt: ActivityEvent) => (
                <div
                  key={evt.id}
                  className="p-3.5 bg-[#071A3A] border border-slate-700/80 hover:border-[#1769FF]/40 rounded-xl transition flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        evt.type === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        evt.type === 'SIM_SWAP' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        evt.type === 'RECOVERY' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {evt.type}
                      </span>
                      <span className="text-white font-bold">{evt.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">{evt.details}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                      <MapPin className="w-3 h-3 text-[#18C8FF]" />
                      <span>{evt.location}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {evt.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1769FF]/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Latency: <strong className="text-emerald-400">14ms</strong></span>
            <span>Encryption: <strong className="text-white">TLS 1.3 / AES-256</strong></span>
          </div>
        </div>

        {/* Right Column: Abstract East Africa Network Topology Map */}
        <div className="lg:col-span-6 bg-[#0B2B66]/80 border border-[#1769FF]/30 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1769FF]/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <Layers className="w-4 h-4 text-[#18C8FF]" />
                <span>TOPOLOGY NETWORK MAP (EAST AFRICA)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-300 bg-[#071A3A] px-2.5 py-1 rounded-md border border-slate-700">
                5 ACTIVE NODES
              </span>
            </div>

            {/* Abstract Topology Visualizer Stage */}
            <div className="relative w-full h-[260px] bg-[#071A3A] border border-slate-700/80 rounded-2xl overflow-hidden p-4 flex items-center justify-center">
              
              {/* SVG Grid Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[#1769FF]/30 stroke-[1.5] [stroke-dasharray:4_4]">
                <line x1="25%" y1="30%" x2="50%" y2="35%" />
                <line x1="50%" y1="35%" x2="75%" y2="55%" />
                <line x1="50%" y1="35%" x2="68%" y2="80%" />
                <line x1="25%" y1="30%" x2="20%" y2="50%" />
              </svg>

              {/* Interactive Node Markers */}
              {networkNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className={`absolute w-8 h-8 rounded-full ${isSelected ? "bg-[#18C8FF]/30 animate-ping" : "bg-[#1769FF]/20"}`} />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected ? "bg-[#18C8FF] border-white scale-125" : "bg-[#1769FF] border-[#18C8FF]"
                      }`} />
                      <span className="absolute left-5 whitespace-nowrap bg-[#0B2B66] border border-[#1769FF]/40 text-white font-mono text-[10px] px-2 py-0.5 rounded shadow-md group-hover:scale-105 transition">
                        {node.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Node Info Display Panel */}
            {selectedNode && (
              <div className="p-3.5 bg-[#071A3A] border border-[#1769FF]/30 rounded-xl font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="flex items-center gap-1.5 text-[#18C8FF]">
                    <Radio className="w-3.5 h-3.5" />
                    {selectedNode.name}
                  </span>
                  <span className="text-emerald-400 text-[10px] bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded">
                    ● {selectedNode.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Active Carrier Connections: <strong className="text-white">{selectedNode.activeConnections}</strong></span>
                  <span>Protocol: <strong className="text-[#18C8FF]">SIMTRACE-SS7/5G</strong></span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Coverage: <strong>Kenya, Uganda, Tanzania, Rwanda</strong></span>
            <span>Mesh Topology: <strong>Redundant</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
}
