"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Globe,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Zap,
  Calculator,
} from "lucide-react";
import { GrowthBusinessService } from "../../../services/growthBusiness.service";

export default function BusinessIntelligenceDashboardPage() {
  const [metrics] = useState(GrowthBusinessService.getBusinessIntelligenceMetrics());

  // ROI Calculator state
  const [investigatorsCount, setInvestigatorsCount] = useState(10);
  const [monthlyCasesCount, setMonthlyCasesCount] = useState(40);

  const roiResult = GrowthBusinessService.calculateROI(investigatorsCount, monthlyCasesCount);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Business Intelligence & Revenue Dashboard</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time commercial metrics, Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), trial conversion funnel & enterprise ROI calculator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/customer-success"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-emerald-400" /> Customer Success
          </a>
        </div>
      </div>

      {/* Commercial Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>MONTHLY RECURRING REVENUE (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-1">${metrics.mrr.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">+18.4% QoQ Growth</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>ANNUAL RECURRING REVENUE (ARR)</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">${metrics.arr.toLocaleString()}</div>
          <div className="text-xs text-cyan-400 mt-1">Sovereign Enterprise Tier Contracts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>TRIAL CONVERSION RATE</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-1">{metrics.conversionRatePercent}%</div>
          <div className="text-xs text-slate-400 mt-1">{metrics.trialConversionsCount} Trials Converted</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>NET CHURN RATE</span>
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">{metrics.churnRatePercent}%</div>
          <div className="text-xs text-emerald-400 mt-1">Industry-Leading Retention</div>
        </div>
      </div>

      {/* Grid: Top Feature Usage & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Used Modules */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" /> Platform Usage & High-Value Module Telemetry
          </h2>
          <div className="space-y-4">
            {metrics.topUsedModules.map((m) => (
              <div key={m.module} className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">{m.module}</span>
                  <span className="font-mono text-cyan-400 font-bold">{m.usageCount} Executions</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (m.usageCount / 1500) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" /> Sovereign Customer Geographic Footprint
          </h2>
          <div className="space-y-3">
            {metrics.geographicDistribution.map((g) => (
              <div key={g.country} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <div className="font-bold text-white">{g.country} Sovereign Deployment</div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded">
                  {g.customerCount} Enterprise Accounts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise ROI & Savings Estimator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Sales Enablement: Interactive Enterprise ROI Calculator</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Calculate the cost savings and officer time reduction delivered by SimTrace multi-carrier SIM swap automation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Number of Active Investigators</label>
              <input
                type="number"
                min={1}
                value={investigatorsCount}
                onChange={(e) => setInvestigatorsCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Monthly Forensics & SIM Swap Cases</label>
              <input
                type="number"
                min={1}
                value={monthlyCasesCount}
                onChange={(e) => setMonthlyCasesCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-5 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-slate-400 font-semibold uppercase text-[10px]">PROJECTED MONTHLY TIME SAVED</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{roiResult.totalHoursSavedMonthly} Officer Hours</div>
            </div>

            <div className="my-3 pt-3 border-t border-slate-800">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">PROJECTED ANNUAL FINANCIAL SAVINGS</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                ${roiResult.annualSavingsUSD.toLocaleString()} USD / yr
              </div>
            </div>

            <div className="text-[11px] text-amber-400 font-semibold">
              ⚡ {roiResult.estimatedEfficiencyBoostPercent}% Increase in Forensics Unit Velocity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
