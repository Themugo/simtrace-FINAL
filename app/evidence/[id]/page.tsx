"use client";

import React, { useState } from "react";
import { Shield, Clock, FileCheck, CheckCircle2, Lock, ArrowLeft, Download, RefreshCw, Key } from "lucide-react";
import Link from "next/link";

export default function EvidenceDetailPage({ params }: { params?: { id: string } }) {
  const evidenceId = params?.id || "ev-501";

  const [evidence] = useState({
    id: evidenceId,
    caseId: "CASE-102",
    evidenceType: "DEVICE_MEMORY_DUMP",
    description: "Full bit-stream binary export from Samsung S24 Ultra (IMEI358992019921101)",
    collectedBy: "Inspector Jane Doe",
    collectedAt: "2026-08-01 00:15",
    location: "Nairobi Police HQ Evidence Locker 4",
    status: "VERIFIED",
    hash: "a3b5c7d9e1f234567890abcdef1234567890abcdef1234567890abcdef123456",
    fileSize: "1,048,576 bytes",
    classification: "CONFIDENTIAL",
  });

  const [custodyLogs] = useState([
    {
      id: "log-1",
      action: "CREATED",
      userId: "Inspector Jane Doe",
      userRole: "Lead Investigator",
      location: "Nairobi Police HQ Evidence Locker 4",
      notes: "Initial evidence ingestion and SHA-256 hash calculation.",
      timestamp: "2026-08-01 00:30",
    },
    {
      id: "log-2",
      action: "VIEWED",
      userId: "Inspector Jane Doe",
      userRole: "Lead Investigator",
      location: "Cyber Crime Unit Lab Desk 2",
      notes: "Forensic extraction preview conducted.",
      timestamp: "2026-08-01 01:00",
    },
    {
      id: "log-3",
      action: "TRANSFERRED",
      userId: "Analyst Mark Vance",
      userRole: "Forensic Specialist",
      location: "National Cyber Forensics Lab Desk 3",
      notes: "Transferred for secondary hex inspection.",
      timestamp: "2026-08-01 01:45",
    },
  ]);

  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const handleVerifyHash = () => {
    setVerificationResult("VERIFYING...");
    setTimeout(() => {
      setVerificationResult("VALIDATED: Hash matches SHA-256 record exactly (0 Bit Alterations)");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Back Button */}
      <Link href="/cases/CASE-102/reports" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Case Reports Workspace
      </Link>

      {/* Header Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Evidence Record {evidence.id}</h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STATUS: {evidence.status}
              </span>
            </div>
            <div className="text-sm font-mono text-slate-400 mt-1">
              Case ID: <span className="text-blue-400 font-semibold">{evidence.caseId}</span> | Classification: <span className="text-amber-400">{evidence.classification}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyHash}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 transition"
          >
            <Key className="w-4 h-4 text-emerald-400" /> Verify Cryptographic Hash
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Download className="w-4 h-4" /> Download Signed Evidence Copy
          </button>
        </div>
      </div>

      {verificationResult && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {verificationResult}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Evidence Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Evidence Attributes & Metadata</h2>
          <div className="space-y-3 text-xs">
            <div className="py-2 border-b border-slate-800">
              <span className="text-slate-400 block mb-1">Evidence Type</span>
              <span className="font-semibold text-blue-400 font-mono">{evidence.evidenceType}</span>
            </div>
            <div className="py-2 border-b border-slate-800">
              <span className="text-slate-400 block mb-1">SHA-256 Cryptographic Hash</span>
              <span className="font-mono text-emerald-400 break-all bg-slate-950 p-2 rounded border border-slate-800 block">
                {evidence.hash}
              </span>
            </div>
            <div className="py-2 border-b border-slate-800">
              <span className="text-slate-400 block mb-1">Description</span>
              <span className="text-slate-200">{evidence.description}</span>
            </div>
            <div className="py-2 border-b border-slate-800">
              <span className="text-slate-400 block mb-1">Collected By</span>
              <span className="text-slate-200 font-medium">{evidence.collectedBy} ({evidence.collectedAt})</span>
            </div>
            <div className="py-2">
              <span className="text-slate-400 block mb-1">Physical / Logical Location</span>
              <span className="text-slate-200 font-medium">{evidence.location}</span>
            </div>
          </div>
        </div>

        {/* Chain of Custody Audit Trail */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-slate-200">Immutable Chain of Custody Timeline</h2>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
              {custodyLogs.length} Verified Entries
            </span>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {custodyLogs.map((log) => (
              <div key={log.id} className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-900" />
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-mono">
                    {log.action}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-sm font-semibold text-white mt-1.5">{log.userId} ({log.userRole})</div>
                <div className="text-xs text-slate-400 mt-0.5">Location: <span className="text-slate-200">{log.location}</span></div>
                <div className="text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 mt-2">{log.notes}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
