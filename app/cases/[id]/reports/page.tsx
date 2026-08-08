"use client";

import React, { useState } from "react";
import { FileText, Plus, ShieldCheck, Download, Eye, CheckCircle, Clock, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CaseReportsWorkspacePage({ params }: { params?: { id: string } }) {
  const caseId = params?.id || "CASE-102";

  const [reports, setReports] = useState([
    {
      id: "rep-101",
      title: "Comprehensive Device Theft & SIM Swap Forensic Analysis #102",
      reportType: "FULL_INVESTIGATION",
      status: "APPROVED",
      version: 2,
      classification: "CONFIDENTIAL",
      createdBy: "Inspector Jane Doe",
      createdAt: "2026-08-01 01:30",
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("FULL_INVESTIGATION");
  const [newClassification, setNewClassification] = useState("CONFIDENTIAL");
  const [newContent, setNewContent] = useState("");

  const [previewReport, setPreviewReport] = useState<any>(null);

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const created = {
      id: `rep-${Date.now()}`,
      title: newTitle,
      reportType: newType,
      status: "DRAFT",
      version: 1,
      classification: newClassification,
      createdBy: "Inspector Jane Doe",
      createdAt: "Just now",
    };

    setReports([created, ...reports]);
    setIsCreating(false);
    setNewTitle("");
    setNewContent("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Back Link */}
      <Link href="/intelligence/graph" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Intelligence Graph
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Case Investigation Report Workspace</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Case ID: <span className="font-mono text-blue-400 font-semibold">{caseId}</span> | Dynamic Report Builder & Audit Export Engine</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> Create New Report
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Draft Investigation Report</h2>
            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Device Theft & IMEI Telemetry Summary"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Report Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FULL_INVESTIGATION">FULL_INVESTIGATION</option>
                    <option value="DEVICE_ANALYSIS">DEVICE_ANALYSIS</option>
                    <option value="RISK_ASSESSMENT">RISK_ASSESSMENT</option>
                    <option value="INTELLIGENCE_SUMMARY">INTELLIGENCE_SUMMARY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Classification</label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="TOP_SECRET">TOP_SECRET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investigation Findings & Executive Summary</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed investigation narrative..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold">
                  Save & Compile Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Compiled Case Reports ({reports.length})</h2>
          {reports.map((rep) => (
            <div key={rep.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {rep.classification}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{rep.reportType}</span>
                </div>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {rep.status} (v{rep.version})
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mt-2">{rep.title}</h3>
              <div className="text-xs text-slate-400 mt-1">
                Prepared by <span className="text-slate-200">{rep.createdBy}</span> | {rep.createdAt}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setPreviewReport(rep)}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Dossier
                </button>
                <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                  <Download className="w-3.5 h-3.5" /> Export Watermarked PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Evidence Attachments Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Linked Evidence Attachments</h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-xs font-semibold text-white">samsung_s24_forensic_dump.bin</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">SHA-256: a3b5c7d9e1f23456...</div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">VERIFIED</span>
                <Link href="/evidence/ev-501" className="text-blue-400 hover:underline">
                  View Custody Log
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Dossier Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white">Official PDF Dossier Preview</h3>
              <button onClick={() => setPreviewReport(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
            <pre className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto h-80 whitespace-pre-wrap">
              {`================================================================================
                    OFFICIAL LAW ENFORCEMENT DOSSIER
                 CLASSIFICATION LEVEL: [ ${previewReport.classification} ]
================================================================================
WATERMARK: OFFICIAL USE ONLY - SIMTRACE INVESTIGATION SYSTEM

REPORT TITLE: ${previewReport.title}
CASE ID: ${caseId}
PREPARED BY: ${previewReport.createdBy}
STATUS: ${previewReport.status} (Version ${previewReport.version})

1. EXECUTIVE SUMMARY & FORENSIC EVIDENCE SUMMARY
Subject device IMEI358992019921101 tracked across 8 SIM card changes.
Linked to active police theft report #102.

2. SHA-256 CRYPTOGRAPHIC INTEGRITY AUDIT
All registered evidence files verified against immutable ledger hashes.
Chain of custody complete and legally admissible.`}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
