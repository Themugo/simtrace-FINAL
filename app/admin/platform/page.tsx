"use client";

import React, { useState } from "react";
import {
  Globe,
  TrendingUp,
  CreditCard,
  Building2,
  Users,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Zap,
} from "lucide-react";

export default function AdminPlatformControlPage() {
  const [stats] = useState({
    totalOrgs: 142,
    activeSubscriptions: 138,
    mrr: "$384,500",
    totalDevicesTracked: "148,920",
    systemUptime: "99.99%",
  });

  const [orgs] = useState([
    { id: "org-police-01", name: "National Police Service", country: "Kenya", plan: "ENTERPRISE", mrr: "$9,999", status: "ACTIVE", users: 24 },
    { id: "org-telecom-02", name: "Safaricom Intelligence Unit", country: "Kenya", plan: "CUSTOM_GOVERNMENT", mrr: "$25,000", status: "ACTIVE", users: 58 },
    { id: "org-investigation-03", name: "Apex Security Group", country: "South Africa", plan: "PROFESSIONAL", mrr: "$2,499", status: "ACTIVE", users: 12 },
    { id: "org-agency-04", name: "Uganda Cyber Crime Agency", country: "Uganda", plan: "ENTERPRISE", mrr: "$9,999", status: "ACTIVE", users: 30 },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Platform Super-Admin Control Desk</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Global multi-tenant SaaS oversight, revenue analytics, MRR tracking, and system telemetry</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold">
          <Zap className="w-4 h-4" /> Global Cluster Uptime: {stats.systemUptime}
        </div>
      </div>

      {/* Commercial Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.mrr}</div>
          <div className="text-xs text-slate-500 mt-1">+14.2% MRR growth vs last month</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Organizations</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.totalOrgs}</div>
          <div className="text-xs text-slate-500 mt-1">Multi-tenant accounts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{stats.activeSubscriptions}</div>
          <div className="text-xs text-slate-500 mt-1">Paying commercial tenants</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Tracked Devices</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.totalDevicesTracked}</div>
          <div className="text-xs text-slate-500 mt-1">Active IMEI/IMSI streams</div>
        </div>
      </div>

      {/* Organizations Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-200 text-sm">Tenant Organizations & Subscription Status</h2>
          <span className="text-xs text-slate-400">Showing top enterprise tenants</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">Organization Name</th>
              <th className="py-3.5 px-4">Jurisdiction</th>
              <th className="py-3.5 px-4">Plan Tier</th>
              <th className="py-3.5 px-4">MRR Contribution</th>
              <th className="py-3.5 px-4">Seats</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/50 transition">
                <td className="py-3.5 px-4 font-semibold text-white">
                  <div>{o.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{o.id}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-300">{o.country}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{o.plan}</td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">{o.mrr}</td>
                <td className="py-3.5 px-4 text-slate-400">{o.users} Users</td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                    {o.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <a href={`/organization`} className="text-blue-400 hover:underline font-semibold">
                    Manage Tenant
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
