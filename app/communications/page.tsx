"use client";

import React, { useState } from "react";
import {
  Radio,
  Send,
  PhoneCall,
  Bell,
  MessageSquare,
  ShieldCheck,
  Zap,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Users,
  Smartphone
} from "lucide-react";

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<"broadcasts" | "dispatch" | "carrier">("broadcasts");
  const [message, setMessage] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("LAW_ENFORCEMENT");
  const [logs, setLogs] = useState([
    { id: "COMM-109", timestamp: "10:24:00 AM", channel: "Emergency Broadcast", sender: "Operations Center", recipient: "Nairobi Metro Division", content: "High-priority lock trigger on stolen iPhone 15 Pro Max. Geofence pinged in Westlands.", status: "Delivered" },
    { id: "COMM-108", timestamp: "10:18:12 AM", channel: "SS7 SMS Gateway", sender: "Safaricom Gateway", recipient: "+254712***890", content: "SIMTRACE Alert: A SIM Swap request was initiated for your line. If unauthorized, tap link or reply LOCK.", status: "Delivered" },
    { id: "COMM-107", timestamp: "09:50:41 AM", channel: "Direct Dispatch", sender: "Dispatch Desk", recipient: "Officer J. Ochieng", content: "Evidence packet #STM-98231 generated and attached to case ledger.", status: "Read" },
  ]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newLog = {
      id: `COMM-${Math.floor(110 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: true }),
      channel: selectedTarget === "ALL" ? "Global Emergency Push" : selectedTarget,
      sender: "Purity Kamau (Admin)",
      recipient: selectedTarget,
      content: message,
      status: "Dispatched",
    };

    setLogs([newLog, ...logs]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#2563EB] border border-blue-200 rounded-full text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5" /> SIMTRACE Sovereign Communications & Dispatch Center
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Communications, SS7 Alerts & Dispatch Feed
          </h1>
          <p className="text-xs text-slate-500">
            Real-time secure messaging hub, emergency carrier push notifications, and field agent dispatch communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SS7 Channel Active</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Broadcast Dispatch Console */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-[#2563EB]" /> Emergency Dispatch & Carrier Broadcast
          </h2>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Target Audience / Channel</label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#2563EB]"
              >
                <option value="LAW_ENFORCEMENT">Law Enforcement Field Agents</option>
                <option value="TELECOM_CARRIERS">Telecom Core Gateways (SS7 / Diameter)</option>
                <option value="GUARDIAN_NETWORK">Guardian Emergency Contacts</option>
                <option value="ALL">Global Network Push (Priority 1)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Message Content / Emergency Payload</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type dispatch alert or instant carrier instruction payload..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Dispatch Emergency Message
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Communication Logs */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-700" /> Dispatch Audit & Real-time Delivery Feed
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Live Socket Active</span>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2563EB] text-[11px]">{log.channel}</span>
                  <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <div className="text-slate-800 font-medium">{log.content}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                  <span>From: <strong className="text-slate-700">{log.sender}</strong> → <strong className="text-slate-700">{log.recipient}</strong></span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
