"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Sliders,
  Download,
  FileSpreadsheet,
  Database,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  AnalyticsEngineService,
  CustomReportResult,
} from "../../services/analyticsEngine.service";

export default function CustomReportBuilderPage() {
  const [selectedDims, setSelectedDims] = useState<string[]>(["Organization", "Priority"]);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>(["Active Cases", "Resolved Swaps"]);
  const [dateRange, setDateRange] = useState(30);

  const [reportResult, setReportResult] = useState<CustomReportResult>(
    AnalyticsEngineService.buildCustomReport({
      dimensions: selectedDims,
      measures: selectedMeasures,
      dateRangeDays: dateRange,
    })
  );

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AnalyticsEngineService.buildCustomReport({
      dimensions: selectedDims,
      measures: selectedMeasures,
      dateRangeDays: dateRange,
    });
    setReportResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" /> Custom Intelligence Report Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build, filter, and export custom analytical queries from the SimTrace Enterprise Data Warehouse
          </p>
        </div>

        <div className="flex gap-2">
          <button className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700">
            <Download className="w-4 h-4 text-cyan-400" /> Export CSV
          </button>
          <button className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> Export Certified PDF
          </button>
        </div>
      </div>

      {/* Builder Form Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" /> Query Dimensions & Measures
        </h2>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-2">Dimensions (Rows)</label>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {["Organization", "Case Status", "Priority Level", "Carrier Network", "Device Model"].map((dim) => (
                <label key={dim} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDims.includes(dim)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedDims([...selectedDims, dim]);
                      else setSelectedDims(selectedDims.filter((d) => d !== dim));
                    }}
                    className="accent-cyan-500"
                  />
                  {dim}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-2">Measures (Values)</label>
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {["Active Cases", "Resolved Swaps", "Average Risk Index", "SLA Compliance %", "Telemetry Ingestion Rate"].map((m) => (
                <label key={m} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMeasures.includes(m)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedMeasures([...selectedMeasures, m]);
                      else setSelectedMeasures(selectedMeasures.filter((x) => x !== m));
                    }}
                    className="accent-cyan-500"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <label className="block font-semibold text-slate-300 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last 365 Days</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition mt-4"
            >
              Run Analytics Query
            </button>
          </div>
        </form>
      </div>

      {/* Query Result Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">{reportResult.title}</h2>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {new Date(reportResult.generatedAt).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                {reportResult.headers.map((h, i) => (
                  <th key={i} className="p-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {reportResult.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-850 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
