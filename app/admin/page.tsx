"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Activity,
  Key,
  Server,
  DollarSign,
  TrendingUp,
  Sliders,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Database,
  Download,
  Plus,
  RefreshCw,
  Lock,
  Globe,
  Radio,
  Palette,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import AdminRedesignStudio from "../../components/admin/AdminRedesignStudio";
import { SiteConfigProvider, useSiteConfig } from "../../components/SiteConfigContext";

function AdminConsolePageContent() {
  const { config } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<"redesign" | "users" | "system" | "audit" | "intelligence">("redesign");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const users = [
    { id: "USR-101", name: "Purity Kamau", email: "purity@simtrace.io", role: "ADMINISTRATOR", status: "Active", lastLogin: "2 mins ago", region: "Kenya" },
    { id: "USR-102", name: "Alexander Jenkins", email: "alex@jenkins.com", role: "CUSTOMER", status: "Active", lastLogin: "15 mins ago", region: "United States" },
    { id: "USR-103", name: "Officer James Ochieng", email: "j.ochieng@police.go.ke", role: "LAW_ENFORCEMENT", status: "Active", lastLogin: "1 hour ago", region: "Kenya" },
    { id: "USR-104", name: "Safaricom Core Engine", email: "soc@safaricom.co.ke", role: "TELECOM_PARTNER", status: "Active", lastLogin: "Just now", region: "East Africa" },
    { id: "USR-105", name: "Sarah Jenkins", email: "sarah@jenkins.com", role: "GUARDIAN", status: "Pending Verification", lastLogin: "Yesterday", region: "United States" },
  ];

  const auditLogs = [
    { id: "LOG-9921", timestamp: "10:24:12 AM", actor: "Purity Kamau (Admin)", action: "Approved GSMA IMEI Whitelist sync", target: "Batch #GSMA-2026-08", ip: "102.210.44.12" },
    { id: "LOG-9920", timestamp: "10:18:45 AM", actor: "Safaricom Core API", action: "Dispatched SIM Swap Trigger", target: "Device +254712***890", ip: "196.201.214.5" },
    { id: "LOG-9919", timestamp: "09:55:02 AM", actor: "System Daemon", action: "Automated Database Backup Completed", target: "Cloud Spanner Region eu-west2", ip: "Internal" },
    { id: "LOG-9918", timestamp: "09:30:11 AM", actor: "Officer James Ochieng", action: "Exported Court Evidence Affidavit", target: "Case #STM-98231", ip: "105.160.18.99" },
  ];

  const systemHealth = [
    { name: "Cloud Spanner primary DB", status: "99.998% Uptime", latency: "12ms", health: "Optimal" },
    { name: "GSMA IMEI Global Database API", status: "Connected", latency: "45ms", health: "Optimal" },
    { name: "SS7 / Diameter Core Gateway", status: "Listening", latency: "18ms", health: "Optimal" },
    { name: "AES-256 Remote Lock Broker", status: "Ready", latency: "8ms", health: "Optimal" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Control Centre
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> {config.brandName} Sovereign Admin Console
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            System Administration & Redesign Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Absolute administrative rights to redesign layouts, text copy, pages, telemetry numbers, and platform configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" /> Preview Live Site
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TOTAL REGISTERED USERS</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">148,200</div>
          <div className="text-xs text-emerald-600 font-semibold font-mono">↑ +1,240 this week</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">ACTIVE TELECOM INTEGRATIONS</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{config.telemetry.networkPartners} Carriers</div>
          <div className="text-xs text-blue-600 font-semibold font-mono">100% SS7 Sync</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PROTECTED DEVICES</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">{config.telemetry.protectedDevices}</div>
          <div className="text-xs text-slate-500 font-mono">Live In Engine</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono font-bold">RECOVERY CASES</div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">{config.telemetry.recoveryCases} Active</div>
          <div className="text-xs text-slate-500 font-mono">Police Coordination</div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1">
        {[
          { id: "redesign", label: "★ Site Redesign & CMS Studio", icon: Palette, highlight: true },
          { id: "users", label: "User Management", icon: Users },
          { id: "system", label: "System Health & Config", icon: Server },
          { id: "audit", label: "Security & Audit Logs", icon: FileText },
          { id: "intelligence", label: "Business Intelligence", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition ${
                isActive
                  ? tab.highlight
                    ? "bg-amber-500 text-slate-950 shadow-md font-black"
                    : "bg-[#2563EB] text-white shadow-md font-bold"
                  : tab.highlight
                    ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Absolute Redesign Studio */}
      {activeTab === "redesign" && <AdminRedesignStudio />}

      {/* Tab 2: User Management */}
      {activeTab === "users" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user ID, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Filter Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMINISTRATOR">Administrator</option>
                <option value="CUSTOMER">Customer</option>
                <option value="LAW_ENFORCEMENT">Law Enforcement</option>
                <option value="TELECOM_PARTNER">Telecom Partner</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User ID & Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email} ({u.id})</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-md font-semibold text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.region}</td>
                    <td className="p-3 text-slate-500">{u.lastLogin}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button className="text-blue-600 font-semibold hover:underline">Edit</button>
                      <button className="text-rose-600 font-semibold hover:underline">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Health */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" /> Microservice & Database Clusters
            </h3>
            <div className="space-y-3 text-xs">
              {systemHealth.map((sh) => (
                <div key={sh.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-bold text-slate-800">{sh.name}</div>
                    <div className="text-[10px] text-slate-400">{sh.status} • Latency {sh.latency}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">
                    {sh.health}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" /> API Gateway & Key Provisions
            </h3>
            <p className="text-xs text-slate-500">
              Manage external partner secrets, OAuth client IDs, and GSMA database sync tokens.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">GSMA_GLOBAL_SYNC_TOKEN</div>
                  <div className="font-mono text-[10px] text-slate-400">st_prod_live_99812480124809</div>
                </div>
                <button className="text-xs text-blue-600 font-bold hover:underline">Rotate Key</button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">SAFARICOM_CORE_OAUTH_CLIENT</div>
                  <div className="font-mono text-[10px] text-slate-400">client_id_safaricom_ke_01</div>
                </div>
                <button className="text-xs text-blue-600 font-bold hover:underline">View Claims</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Audit Logs */}
      {activeTab === "audit" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" /> Real-time System Audit Ledger
          </h3>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 mr-2">{log.timestamp}</span>
                  <span className="font-bold text-slate-900">{log.actor}</span>
                  <span className="text-slate-600 ml-1.5">{log.action}: <span className="font-medium text-blue-600">{log.target}</span></span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">IP: {log.ip}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Business Intelligence */}
      {activeTab === "intelligence" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Platform Revenue & Growth Dynamics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Annual Recurring Revenue</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">$3,414,000</div>
              <div className="text-xs text-emerald-600 mt-1">↑ +24% YoY</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Average Recovery Time</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">4.2 Hours</div>
              <div className="text-xs text-blue-600 mt-1">↓ -18% Faster than industry</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Law Enforcement Affiliation</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">42 Sovereign Forces</div>
              <div className="text-xs text-purple-600 mt-1">Global Interpol Sync</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminConsolePage() {
  return (
    <SiteConfigProvider>
      <AdminConsolePageContent />
    </SiteConfigProvider>
  );
}
