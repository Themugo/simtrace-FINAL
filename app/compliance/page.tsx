"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertOctagon, FileCheck, Lock, CheckCircle, RefreshCw, Filter, Search, ShieldAlert } from "lucide-react";

export default function ComplianceDashboardPage() {
  const [logs] = useState([
    { id: "c1", type: "EVIDENCE_ACCESS", user: "Inspector Jane Doe", action: "Downloaded evidence ev-501", status: "ALLOWED", time: "10 mins ago", severity: "info" },
    { id: "c2", type: "UNAUTHORIZED_ATTEMPT", user: "Analyst Mark Vance", action: "Attempted access to TOP_SECRET document doc-909", status: "DENIED", time: "42 mins ago", severity: "critical" },
    { id: "c3", type: "HASH_VERIFICATION", user: "System Auto-Check", action: "SHA-256 integrity check completed for 1,240 documents", status: "PASSED", time: "1 hour ago", severity: "info" },
    { id: "c4", type: "WATERMARK_EXPORT", user: "Inspector Jane Doe", action: "Exported watermarked report rep-101", status: "LOGGED", time: "2 hours ago", severity: "info" },
  ]);

  const [stats] = useState({
    auditEventsToday: 1248,
    integrityStatus: "100% VERIFIED",
    failedAccessAttempts: 2,
    activePolicies: "ISO/IEC 27001 & CJIS Compliant",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Compliance & Security Audit Desk</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Regulatory compliance oversight, document classification enforcement, and access logging</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold">
          <CheckCircle className="w-4 h-4" /> {stats.activePolicies}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Events Today</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.auditEventsToday}</div>
          <div className="text-xs text-slate-500 mt-1">Immutable ledger events</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File Integrity Verification</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.integrityStatus}</div>
          <div className="text-xs text-slate-500 mt-1">SHA-256 hash checks</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed Access Attempts</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{stats.failedAccessAttempts}</div>
          <div className="text-xs text-slate-500 mt-1">Blocked by classification rules</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Watermarking</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">ENABLED</div>
          <div className="text-xs text-slate-500 mt-1">All exports tracked with user ID</div>
        </div>
      </div>

      {/* Security Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-slate-200 text-sm">Real-Time Security Audit Stream</h2>
          <span className="text-xs text-slate-400">Showing last 24 hours</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">Event Type</th>
              <th className="py-3.5 px-4">User / Actor</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/50 transition">
                <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{log.type}</td>
                <td className="py-3.5 px-4 text-slate-200">{log.user}</td>
                <td className="py-3.5 px-4 text-slate-300">{log.action}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === "DENIED"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-slate-500">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
