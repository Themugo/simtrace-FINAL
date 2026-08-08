"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Eye,
  AlertTriangle,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  UserCheck,
  Globe,
  FileText,
  Sliders,
  BellAlert,
} from "lucide-react";
import {
  ComplianceGovernanceService,
  OrganizationPolicy,
  DataClassification,
  PrivacyRequest,
  RetentionPolicy,
  SecurityIncident,
} from "../../../services/complianceGovernance.service";

export default function SecurityComplianceDashboardPage() {
  const [orgId] = useState("org-police-01");

  const [metrics, setMetrics] = useState(ComplianceGovernanceService.getComplianceMetrics());
  const [policies, setPolicies] = useState<OrganizationPolicy[]>(ComplianceGovernanceService.getPolicies(orgId));
  const [classifications] = useState<DataClassification[]>(ComplianceGovernanceService.getClassifications());
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>(ComplianceGovernanceService.getPrivacyRequests());
  const [retentionPolicies] = useState<RetentionPolicy[]>(ComplianceGovernanceService.getRetentionPolicies());
  const [incidents, setIncidents] = useState<SecurityIncident[]>(ComplianceGovernanceService.getSecurityIncidents());

  // Privacy request modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [reqType, setReqType] = useState<PrivacyRequest["requestType"]>("DATA_EXPORT");
  const [requestedBy, setRequestedBy] = useState("Data Protection Officer");
  const [subjectIdentity, setSubjectIdentity] = useState("MSISDN +254700123456");

  const handleTogglePolicy = (id: string) => {
    ComplianceGovernanceService.togglePolicy(id);
    setPolicies([...ComplianceGovernanceService.getPolicies(orgId)]);
    setMetrics(ComplianceGovernanceService.getComplianceMetrics());
  };

  const handleCreatePrivacyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    ComplianceGovernanceService.createPrivacyRequest({
      organizationId: orgId,
      requestType: reqType,
      requestedBy,
      subjectIdentity,
    });
    setPrivacyRequests([...ComplianceGovernanceService.getPrivacyRequests()]);
    setMetrics(ComplianceGovernanceService.getComplianceMetrics());
    setShowPrivacyModal(false);
  };

  const handleProcessPrivacy = (id: string, status: PrivacyRequest["status"]) => {
    ComplianceGovernanceService.processPrivacyRequest(id, status);
    setPrivacyRequests([...ComplianceGovernanceService.getPrivacyRequests()]);
    setMetrics(ComplianceGovernanceService.getComplianceMetrics());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Top Navigation / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Enterprise Compliance & Governance Dashboard</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time security posture, policy enforcement, data subject privacy requests, classification levels & SOC 2 / GDPR monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/compliance/audits"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-cyan-400" /> Internal Audit Workspace
          </a>
          <a
            href="/trust-center"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
          >
            <Globe className="w-4 h-4" /> Sovereign Trust Center
          </a>
        </div>
      </div>

      {/* Compliance Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>SECURITY SCORE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-1">{metrics.securityScore} / 100</div>
          <div className="text-xs text-slate-400 mt-1">SOC 2 Type II Certified (100%)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>ACTIVE POLICIES</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">
            {metrics.enabledPolicies} / {metrics.totalPolicies}
          </div>
          <div className="text-xs text-blue-400 mt-1">Enforcing MFA & Export Rules</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>PRIVACY REQUESTS</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-1">{metrics.pendingPrivacyReqs} Pending</div>
          <div className="text-xs text-slate-400 mt-1">GDPR & Kenya DPA 2019 DPO Portal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>SECURITY INCIDENTS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-1">{metrics.openIncidents} Open</div>
          <div className="text-xs text-slate-400 mt-1">Zero Breach / Zero Data Leakage</div>
        </div>
      </div>

      {/* Grid: Policies & Data Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Organization Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" /> Enforced Governance & Security Policies
            </h2>
            <span className="text-xs text-slate-400 font-mono">Policy Engine v3</span>
          </div>
          <div className="divide-y divide-slate-800">
            {policies.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{p.name}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                      {p.policyType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Config: {JSON.stringify(p.configuration)}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePolicy(p.id)}
                  className={`px-3 py-1 rounded text-xs font-bold transition border ${
                    p.enabled
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.enabled ? "ENFORCED" : "DISABLED"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Classification Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" /> Data Classification & Resource Level Tags
            </h2>
            <span className="text-xs text-slate-400 font-mono">Multi-Tenant Isolation</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Resource Type</th>
                <th className="py-3 px-4">Resource ID</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Tagged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {classifications.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono text-blue-400 font-bold">{c.resourceType}</td>
                  <td className="py-3 px-4 text-slate-200 font-mono">{c.resourceId}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.classificationLevel === "HIGHLY_RESTRICTED"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : c.classificationLevel === "RESTRICTED"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {c.classificationLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{c.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privacy Requests & Retention Policies */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" /> Data Subject Privacy Requests (GDPR / DPA)
            </h2>
            <p className="text-xs text-slate-400">Formal requests for data export, deletion, access or correction submitted by data subjects.</p>
          </div>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Submit Privacy Request
          </button>
        </div>

        {showPrivacyModal && (
          <form onSubmit={handleCreatePrivacyRequest} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Request Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="DATA_ACCESS">DATA ACCESS</option>
                  <option value="DATA_EXPORT">DATA EXPORT</option>
                  <option value="DATA_CORRECTION">DATA CORRECTION</option>
                  <option value="DATA_DELETION">DATA DELETION</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Requested By</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Subject Identifier (Phone/IMEI)</label>
                <input
                  type="text"
                  value={subjectIdentity}
                  onChange={(e) => setSubjectIdentity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPrivacyModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white rounded font-semibold">
                Submit Request
              </button>
            </div>
          </form>
        )}

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Request Type</th>
              <th className="py-3 px-4">Subject Identity</th>
              <th className="py-3 px-4">Requested By</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {privacyRequests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50">
                <td className="py-3 px-4 font-mono font-bold text-purple-400">{r.requestType}</td>
                <td className="py-3 px-4 text-slate-200 font-mono">{r.subjectIdentity}</td>
                <td className="py-3 px-4 text-slate-400">{r.requestedBy}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : r.status === "PROCESSING"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {r.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleProcessPrivacy(r.id, "COMPLETED")}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded transition"
                    >
                      Approve & Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security Incidents & Retention Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Incident Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Open Security Incidents & Breach Response
          </h2>
          <div className="space-y-3">
            {incidents.map((i) => (
              <div key={i.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{i.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      i.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {i.severity} SEVERITY
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">{i.description}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>Assigned: {i.assignedTo}</span>
                  <span className="font-mono text-emerald-400">STATUS: {i.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" /> Automated Data Retention & Archival Rules
          </h2>
          <div className="space-y-3">
            {retentionPolicies.map((r) => (
              <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400">{r.resourceType}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                    ACTION: {r.action}
                  </span>
                </div>
                <p className="text-slate-400">Retention Period: <span className="text-white font-bold">{r.retentionPeriodDays} Days</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
