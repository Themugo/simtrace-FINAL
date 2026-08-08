"use client";

import React, { useState } from "react";
import { Network, Search, Filter, Cpu, Phone, ShieldAlert, ArrowRight } from "lucide-react";

export default function IntelligenceGraphPage() {
  const [searchQuery, setSearchQuery] = useState("IMEI358992019921101");
  const [selectedEntity, setSelectedEntity] = useState<any>({
    id: "e1",
    name: "Samsung Galaxy S24 Ultra",
    type: "DEVICE",
    externalId: "IMEI358992019921101",
    riskScore: 78,
    status: "flagged",
  });

  const sampleNodes = [
    { id: "e1", label: "Samsung S24 (Target)", type: "DEVICE", riskScore: 78, x: 50, y: 50 },
    { id: "e2", label: "Safaricom SIM +254700***111", type: "SIM_CARD", riskScore: 45, x: 25, y: 25 },
    { id: "e3", label: "National ID 34892011", type: "PERSON", riskScore: 20, x: 75, y: 25 },
    { id: "e4", label: "Nairobi CBD Tower 4", type: "LOCATION", riskScore: 10, x: 25, y: 75 },
    { id: "e5", label: "Case #102 Stolen Ring", type: "CASE", riskScore: 85, x: 75, y: 75 },
  ];

  const sampleEdges = [
    { source: "e1", target: "e2", label: "USED_SIM" },
    { source: "e2", target: "e3", label: "REGISTERED_TO" },
    { source: "e1", target: "e4", label: "LOCATED_AT" },
    { source: "e1", target: "e5", label: "LINKED_CASE" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Graph Intelligence Explorer</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Discover hidden relationship edges between Devices, SIM cards, Persons, Locations, and Cases</p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search IMEI, Phone, Person, Case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg text-sm border border-slate-700 font-medium">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Main Canvas + Sidebar Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 flex-1">
        {/* Interactive Graph Canvas */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden min-h-[500px] flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
            Target Node: {searchQuery} | 2-Hop Traversal Active
          </div>

          {/* Graphical Nodes Visualization */}
          <div className="relative flex-1 bg-slate-950 rounded-lg border border-slate-800/80 p-8 flex items-center justify-center">
            {/* Edge Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
              <line x1="25%" y1="25%" x2="75%" y2="25%" stroke="#64748b" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="25%" y2="75%" stroke="#3b82f6" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#ef4444" strokeWidth="2.5" />
            </svg>

            {/* Central Root Node */}
            <div
              onClick={() => setSelectedEntity(sampleNodes[0])}
              className="z-10 absolute cursor-pointer bg-slate-900 border-2 border-blue-500 rounded-xl p-4 shadow-xl hover:scale-105 transition text-center min-w-[140px]"
              style={{ left: "calc(50% - 70px)", top: "calc(50% - 40px)" }}
            >
              <Cpu className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-white">Samsung S24</div>
              <div className="text-[10px] text-slate-400 font-mono">IMEI35899201</div>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400">Risk 78</span>
            </div>

            {/* Satellite Nodes */}
            <div
              onClick={() => setSelectedEntity(sampleNodes[1])}
              className="z-10 absolute cursor-pointer bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-lg hover:border-blue-400 transition text-center min-w-[120px]"
              style={{ left: "20%", top: "20%" }}
            >
              <Phone className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-slate-200">Safaricom SIM</div>
              <div className="text-[10px] text-slate-400">+254700***111</div>
            </div>

            <div
              onClick={() => setSelectedEntity(sampleNodes[4])}
              className="z-10 absolute cursor-pointer bg-slate-900 border-2 border-rose-500 rounded-xl p-3 shadow-lg hover:scale-105 transition text-center min-w-[120px]"
              style={{ right: "20%", bottom: "20%" }}
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <div className="text-xs font-semibold text-rose-300">Case #102</div>
              <div className="text-[10px] text-slate-400">Active Theft</div>
            </div>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Selected Node Details</div>
            <h3 className="text-lg font-bold text-white">{selectedEntity.name}</h3>
            <div className="text-xs font-mono text-slate-400 mt-1">{selectedEntity.externalId}</div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Entity Type</span>
                <span className="font-semibold text-blue-400">{selectedEntity.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Risk Score</span>
                <span className="font-bold text-amber-400">{selectedEntity.riskScore} / 100</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Direct Edges</span>
                <span className="font-semibold text-slate-200">4 Connections</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={`/intelligence/entity/${selectedEntity.id}`}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Full Entity Workspace <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
