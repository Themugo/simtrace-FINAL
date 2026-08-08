"use client";

import React, { useState, useEffect } from "react";
import { Activity, Radio, ShieldAlert, Cpu, RefreshCw, Zap, Server } from "lucide-react";
import Link from "next/link";

export default function LiveOperationsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeSockets: 42,
    eventsPerMin: 128,
    activeDevices: 384,
    systemStatus: "OPTIMAL",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Generate simulated live events or fetch from socket/api
    const mockEvents = [
      { id: "ev1", type: "DEVICE_PING", imei: "IMEI358992019921101", msg: "Location updated: Nairobi CBD", severity: "info", time: "Just now" },
      { id: "ev2", type: "SIM_CHANGE", imei: "IMSI89254010099120", msg: "SIM swap detected on Safaricom +254700***111", severity: "warning", time: "1m ago" },
      { id: "ev3", type: "IMPOSSIBLE_TRAVEL", imei: "IMEI358992019921101", msg: "Displacement speed 840 km/h between Nairobi & Mombasa", severity: "critical", time: "3m ago" },
      { id: "ev4", type: "CASE_LINKED", imei: "CASE-102", msg: "Device linked to active theft investigation #102", severity: "warning", time: "5m ago" },
    ];
    setEvents(mockEvents);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setStats((prev) => ({
        ...prev,
        eventsPerMin: Math.floor(100 + Math.random() * 50),
      }));
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Operations Command Center</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Real-time socket telemetry, event stream, and live device monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Feed
          </button>
          <Link
            href="/intelligence/graph"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Open Intelligence Graph
          </Link>
        </div>
      </div>

      {/* Real-time KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sockets</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeSockets}</div>
            <div className="text-xs text-slate-500 mt-1">Live WebSocket connections</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Events / Minute</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats.eventsPerMin}</div>
            <div className="text-xs text-slate-500 mt-1">Stream velocity</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Devices</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.activeDevices}</div>
            <div className="text-xs text-slate-500 mt-1">Tracked online</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Health</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.systemStatus}</div>
            <div className="text-xs text-slate-500 mt-1">Redis + MongoDB Socket.IO</div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Stream & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Event Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-slate-200">Real-Time Intelligence Event Stream</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-slate-800 mt-3">
            {events.map((ev) => (
              <div key={ev.id} className="py-3.5 flex items-start gap-4 hover:bg-slate-800/40 px-2 rounded-lg transition">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    ev.severity === "critical"
                      ? "bg-rose-500/20 text-rose-400"
                      : ev.severity === "warning"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-200">{ev.type}</div>
                    <span className="text-xs text-slate-500">{ev.time}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{ev.imei}</div>
                  <div className="text-xs text-slate-300 mt-1">{ev.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Controls & Map Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-semibold text-slate-200 mb-3">Operational Zone Focus</h2>
          <div className="bg-slate-950 border border-slate-800 rounded-lg h-64 flex flex-col items-center justify-center p-4 text-center">
            <Radio className="w-10 h-10 text-blue-500 mb-2 animate-pulse" />
            <div className="text-sm font-medium text-slate-300">Nairobi & Mombasa High-Density Quadrant</div>
            <div className="text-xs text-slate-500 mt-1">42 devices active in current perimeter</div>
          </div>

          <div className="mt-4 space-y-2">
            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition text-left px-4 flex items-center justify-between">
              <span>Filter Critical Severity Only</span>
              <span className="text-xs text-rose-400 font-bold">1 Alert</span>
            </button>
            <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition text-left px-4 flex items-center justify-between">
              <span>Broadcast Emergency Warning</span>
              <span className="text-xs text-slate-400">All Agents</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
