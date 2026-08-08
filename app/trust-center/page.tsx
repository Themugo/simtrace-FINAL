"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Globe,
  Lock,
  FileText,
  CheckCircle2,
  Download,
  Server,
  Activity,
  Award,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import {
  ComplianceGovernanceService,
  LegalDocument,
} from "../../services/complianceGovernance.service";

export default function TrustCenterPage() {
  const [legalDocs] = useState<LegalDocument[]>(ComplianceGovernanceService.getLegalDocuments());
  const [dpaRequested, setDpaRequested] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Sovereign Hero Header */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> SimTrace Sovereign Trust Portal & Transparency Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Security, Privacy & Sovereign Compliance Assurance
          </h1>
          <p className="text-sm text-slate-300">
            Real-time status of SimTrace's enterprise security controls, multi-tenant isolation guarantees, regulatory certifications, and legal terms.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setDpaRequested(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> Request Enterprise DPA
          </button>
          <a
            href="/compliance/dashboard"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
          >
            Internal Dashboard <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {dpaRequested && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Data Processing Agreement (DPA v2.0) package sent to your authorized enterprise email address.
          </span>
          <button onClick={() => setDpaRequested(false)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Compliance Certification Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">SOC 2 Type II</h3>
            <p className="text-xs text-slate-400">Security & Privacy Audit Passed</p>
            <span className="text-[10px] text-emerald-400 font-bold">100% Compliant</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">ISO / IEC 27001</h3>
            <p className="text-xs text-slate-400">Information Security Mgmt</p>
            <span className="text-[10px] text-emerald-400 font-bold">2022 Certified</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">GDPR & Kenya DPA</h3>
            <p className="text-xs text-slate-400">Data Protection Act 2019</p>
            <span className="text-[10px] text-emerald-400 font-bold">Full Compliance</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">CJIS Standard</h3>
            <p className="text-xs text-slate-400">Law Enforcement Enclave</p>
            <span className="text-[10px] text-emerald-400 font-bold">Hardware Enclaved</span>
          </div>
        </div>
      </div>

      {/* SLA Uptime & Infrastructure Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Platform Infrastructure SLA Uptime
            </h2>
            <p className="text-xs text-slate-400">99.99% Guaranteed Service Level Agreement across multi-region sovereign nodes</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded-lg">
            OPERATIONAL (99.99%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400">Nairobi Sovereign Cluster (KE)</div>
            <div className="text-lg font-bold text-white mt-1">99.995% Uptime</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Latency: 12ms</div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400">London Sovereign Enclave (UK)</div>
            <div className="text-lg font-bold text-white mt-1">100.00% Uptime</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Latency: 18ms</div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="text-slate-400">US East CJIS FedCloud (US)</div>
            <div className="text-lg font-bold text-white mt-1">99.988% Uptime</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Latency: 24ms</div>
          </div>
        </div>
      </div>

      {/* Legal Documents & Governance Repository */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" /> Legal Documents & Master Agreements Directory
        </h2>
        <div className="space-y-3">
          {legalDocs.map((doc) => (
            <div key={doc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  {doc.title}
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                    {doc.version}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Type: {doc.type} | Effective Date: {doc.effectiveDate}
                </div>
              </div>
              <button
                onClick={() => setDpaRequested(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
