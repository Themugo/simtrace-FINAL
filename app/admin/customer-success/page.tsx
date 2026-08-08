"use client";

import React, { useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  Activity,
  Zap,
} from "lucide-react";
import {
  GrowthBusinessService,
  CustomerHealthRecord,
} from "../../../services/growthBusiness.service";

export default function CustomerSuccessDashboardPage() {
  const [healthRecords] = useState<CustomerHealthRecord[]>(GrowthBusinessService.getCustomerHealthRecords());
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = healthRecords.filter(
    (r) =>
      r.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.assignedCSM.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Customer Success & Retention Dashboard</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time account health scores, onboarding progress, monthly investigation velocity & churn risk signals across law enforcement and carrier clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/business"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Business Intelligence
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>AVG ACCOUNT HEALTH</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-1">81.3 / 100</div>
          <div className="text-xs text-slate-400 mt-1">Top Tier Retention Posture</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>EXPANSION OPPORTUNITIES</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">2 Accounts</div>
          <div className="text-xs text-amber-400 mt-1">High Monthly Investigation Usage</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>CHURN RISK ACCOUNTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-400 mt-1">1 Account</div>
          <div className="text-xs text-slate-400 mt-1">Low Onboarding Completion</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>ACTIVE INVESTIGATORS</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">55 Active</div>
          <div className="text-xs text-slate-400 mt-1">Across Sovereign Enclaves</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer accounts by name or CSM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer Health Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Organization</th>
              <th className="py-3 px-4">Plan Tier</th>
              <th className="py-3 px-4">Health Score</th>
              <th className="py-3 px-4">Onboarding</th>
              <th className="py-3 px-4">Active Users</th>
              <th className="py-3 px-4">Monthly Cases</th>
              <th className="py-3 px-4">Churn Risk</th>
              <th className="py-3 px-4">Assigned CSM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50">
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> {r.organizationName}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold rounded">
                    {r.planTier}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold">
                  <span
                    className={
                      r.healthScore >= 80
                        ? "text-emerald-400"
                        : r.healthScore >= 60
                        ? "text-amber-400"
                        : "text-rose-400"
                    }
                  >
                    {r.healthScore} / 100
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="w-24 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${r.onboardingProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{r.onboardingProgress}% Complete</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-200">{r.activeUsersCount}</td>
                <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{r.monthlyInvestigationCount}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.churnRisk === "LOW"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : r.churnRisk === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {r.churnRisk} RISK
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">{r.assignedCSM}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
