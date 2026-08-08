"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Zap,
  Bot,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import {
  AnalyticsEngineService,
  PlatformKPI,
  PredictiveForecast,
} from "../../services/analyticsEngine.service";

export default function ExecutiveDashboardPage() {
  const [kpis] = useState<PlatformKPI[]>(AnalyticsEngineService.getExecutiveKPIs());
  const [forecasts] = useState<PredictiveForecast[]>(AnalyticsEngineService.getPredictiveForecasts());
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState<{
    summary: string;
    keyInsights: string[];
    recommendedExecActions: string[];
  } | null>(null);

  const handleQueryCopilot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim()) return;
    const ans = AnalyticsEngineService.queryAnalyticsCopilot(copilotQuestion);
    setCopilotAnswer(ans);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">SimTrace 2.0 Executive Decision Support Portal</h1>
            <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold rounded">
              ENTERPRISE BI v2.5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Operational Performance, Commercial Growth, Platform SLAs & Predictive Capacity Analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Q3 2026 Executive Review
          </div>
          <a
            href="/analytics"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4" /> Custom Report Builder
          </a>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.kpiKey} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold uppercase text-[10px] tracking-wider">{kpi.category}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded">
                {kpi.status}
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-300 font-medium">{kpi.name}</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {kpi.unit === "USD" ? `$${kpi.currentValue.toLocaleString()}` : kpi.currentValue}{" "}
                <span className="text-xs font-normal text-slate-400">{kpi.unit !== "USD" && kpi.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-mono">
              {kpi.trendPercent >= 0 ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpi.trendPercent}%
                </span>
              ) : (
                <span className="text-cyan-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpi.trendPercent}%
                </span>
              )}
              <span className="text-slate-500 text-[10px]">vs previous 30d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: AI BI Copilot & Predictive Forecasts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Copilot Card (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">AI-Assisted Executive BI Copilot</h2>
              <p className="text-xs text-slate-400">Ask natural language questions about MRR growth, SLA trends, and case bottlenecks</p>
            </div>
          </div>

          <form onSubmit={handleQueryCopilot} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 'Explain MRR growth drivers' or 'Summarize case resolution SLA trends'..."
              value={copilotQuestion}
              onChange={(e) => setCopilotQuestion(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
            >
              Ask Copilot
            </button>
          </form>

          {copilotAnswer && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <p className="text-slate-200 leading-relaxed font-medium">{copilotAnswer.summary}</p>
              <div className="space-y-1">
                <div className="text-slate-400 font-semibold text-[11px]">KEY INSIGHTS:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {copilotAnswer.keyInsights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Predictive Capacity Forecasts (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Predictive Capacity Forecast
          </h2>

          <div className="space-y-4">
            {forecasts.map((f, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-200">
                  <span>{f.metricName}</span>
                  <span className="text-emerald-400 font-mono">{f.confidenceIntervalPercent}% Conf.</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                  <div className="p-1.5 bg-slate-900 rounded">
                    <span className="text-slate-500 block text-[9px]">30-DAY PROJECTION</span>
                    <span className="font-bold text-cyan-300">{f.projectedValue30Days}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 rounded">
                    <span className="text-slate-500 block text-[9px]">90-DAY PROJECTION</span>
                    <span className="font-bold text-emerald-300">{f.projectedValue90Days}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
