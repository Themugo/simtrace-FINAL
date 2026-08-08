"use client";

import React, { useState } from "react";
import {
  FileCheck,
  UserCheck,
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Building,
  ArrowRight,
} from "lucide-react";
import {
  ComplianceGovernanceService,
  AuditCase,
  AccessReview,
  ComplianceEvent,
} from "../../../services/complianceGovernance.service";

export default function InternalAuditWorkspacePage() {
  const [orgId] = useState("org-police-01");

  const [auditCases, setAuditCases] = useState<AuditCase[]>(ComplianceGovernanceService.getAuditCases());
  const [accessReviews] = useState<AccessReview[]>(ComplianceGovernanceService.getAccessReviews());
  const [events] = useState<ComplianceEvent[]>(ComplianceGovernanceService.getComplianceEvents());

  // Create audit modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [auditorName, setAuditorName] = useState("Lead SOC2 Auditor (PwC)");
  const [scope, setScope] = useState("Multi-tenant telemetry, evidence encryption, export auditing");

  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    ComplianceGovernanceService.createAuditCase({
      organizationId: orgId,
      title,
      auditorId: `auditor-${Date.now()}`,
      auditorName,
      status: "ACTIVE",
      scope,
    });

    setAuditCases([...ComplianceGovernanceService.getAuditCases()]);
    setTitle("");
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Internal Audit & Access Review Workspace</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Conduct formal internal audits, assign auditors, track findings, review periodic user access privileges & audit automated compliance event streams
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Create New Audit Case
          </button>
        </div>
      </div>

      {/* New Audit Modal */}
      {showModal && (
        <form onSubmit={handleCreateAudit} className="my-6 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" /> Initiate New Internal Compliance Audit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Audit Case Title</label>
              <input
                type="text"
                placeholder="e.g. Q3 SOC 2 Type II Isolation Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Lead Auditor Name / Firm</label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Audit Scope & Controls</label>
              <input
                type="text"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-cyan-600 text-white rounded font-semibold">
              Save Audit Case
            </button>
          </div>
        </form>
      )}

      {/* Audit Cases Grid */}
      <div className="my-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" /> Formal Audit Cases & Findings Tracker
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auditCases.map((a) => (
            <div key={a.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{a.title}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    a.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <p className="text-slate-400">Auditor: <span className="text-slate-200 font-semibold">{a.auditorName}</span></p>
              <p className="text-slate-400 font-mono text-[11px]">Scope: {a.scope}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <span className="text-slate-400">Findings Count: <strong className="text-amber-400">{a.findingsCount}</strong></span>
                <span className="text-slate-500 font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Access Reviews Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-purple-400" /> Periodic User Access Reviews & Privileges Certification
        </h2>
        <div className="space-y-3">
          {accessReviews.map((ar) => (
            <div key={ar.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-white">{ar.targetRole}</div>
                <div className="text-slate-400 text-[11px]">Reviewed by: {ar.reviewerName}</div>
              </div>
              <div className="flex items-center gap-4 text-slate-300">
                <span>Users Reviewed: <strong>{ar.usersReviewedCount}</strong></span>
                <span>Revoked Privileges: <strong className="text-rose-400">{ar.revokedCount}</strong></span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">
                  {ar.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Compliance Event Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> Real-Time Automated Compliance Audit Log Stream
        </h2>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-slate-800/50">
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">{e.eventType}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      e.severity === "HIGH"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {e.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-200">{e.description}</td>
                <td className="py-3 px-4 text-slate-400 font-mono">{e.actor}</td>
                <td className="py-3 px-4 text-slate-500 font-mono">{new Date(e.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
