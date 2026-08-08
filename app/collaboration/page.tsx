"use client";

import React, { useState } from "react";
import {
  Globe,
  Shield,
  ShieldCheck,
  Search,
  FileCheck,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Eye,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  FileText,
} from "lucide-react";
import {
  FederationService,
  TrustRelationship,
  DataSharingAgreement,
  DataRequest,
  FederatedSearchResult,
} from "../../services/federation.service";

export default function CollaborationPortalPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "agreements" | "search" | "requests" | "policy">("partners");

  const [trusts, setTrusts] = useState<TrustRelationship[]>(FederationService.getTrustRelationships());
  const [dsas, setDsas] = useState<DataSharingAgreement[]>(FederationService.getDataSharingAgreements());
  const [requests, setRequests] = useState<DataRequest[]>(FederationService.getDataRequests());

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FederatedSearchResult[]>([]);

  // Request Submission Modal
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqResource, setReqResource] = useState("");
  const [reqPurpose, setReqPurpose] = useState("");
  const [reqLegal, setReqLegal] = useState("");

  // Policy Simulator State
  const [simReqOrg, setSimReqOrg] = useState("org-safaricom-01");
  const [simTargetOrg, setSimTargetOrg] = useState("org-police-01");
  const [simResType, setSimResType] = useState("M-Pesa CDR Telemetry");
  const [simResult, setSimResult] = useState<{ allowed: boolean; reason: string } | null>(null);

  const handleFederatedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const res = FederationService.searchFederatedEntities(searchQuery);
    setSearchResults(res);
  };

  const handleDataRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqResource.trim()) return;

    FederationService.submitDataRequest({
      requesterOrgId: "org-police-01",
      requesterOrgName: "Kenya National Police",
      targetOrgId: "org-safaricom-01",
      targetOrgName: "Safaricom Fraud Operations",
      requestedResource: reqResource,
      purpose: reqPurpose,
      legalBasis: reqLegal,
    });

    setRequests([...FederationService.getDataRequests()]);
    setReqResource("");
    setReqPurpose("");
    setReqLegal("");
    setShowReqModal(false);
  };

  const handleApproveRequest = (id: string) => {
    FederationService.updateDataRequestStatus(id, "APPROVED", "Director CID");
    setRequests([...FederationService.getDataRequests()]);
  };

  const handleRejectRequest = (id: string) => {
    FederationService.updateDataRequestStatus(id, "REJECTED", "Director CID");
    setRequests([...FederationService.getDataRequests()]);
  };

  const handleSimulatePolicy = () => {
    const res = FederationService.evaluatePolicy(simReqOrg, simTargetOrg, simResType);
    setSimResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-600 rounded-xl text-white shadow-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">SimTrace National Collaboration & Federation Portal</h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold rounded">
                FEDERATION v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-Organization Intelligence Sharing, Trust Agreements, Federated Search & Policy Enforcement
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowReqModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Submit Cross-Org Data Request
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: "partners", label: "Trusted Partner Orgs", icon: Building2 },
          { id: "agreements", label: "Data Sharing Agreements", icon: FileCheck },
          { id: "search", label: "Federated Entity Search", icon: Search },
          { id: "requests", label: "Data Requests & Approvals", icon: Send },
          { id: "policy", label: "Policy Engine Simulator", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-400 bg-slate-900/50"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Trusted Partner Orgs */}
      {activeTab === "partners" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trusts.map((t) => {
              const dynamicEvaluation = FederationService.calculateDynamicTrustLevel(t);
              const findings = t.recentAuditFindingsCount ?? 0;
              return (
                <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-sm">{t.targetOrganizationName}</h3>
                      <p className="text-xs text-slate-400 font-mono">ID: {t.targetOrganizationId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                          dynamicEvaluation.auditStatus === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : dynamicEvaluation.auditStatus === "WARNING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {dynamicEvaluation.effectiveTrustLevel} TRUST (DYNAMIC)
                      </span>
                      {findings > 0 && (
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {findings} Audit Finding(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Approved By:</span>
                      <strong className="text-slate-200">{t.approvedBy || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-bold">{t.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compliance Audit Count:</span>
                      <span className="font-mono text-cyan-400 font-bold">{t.complianceAuditCount} Audits Passed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="font-mono text-slate-400">{new Date(t.expirationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Simulate Audit Finding:</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          FederationService.recordSecurityAudit(t.id, 0);
                          setTrusts([...FederationService.getTrustRelationships()]);
                        }}
                        className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono rounded"
                      >
                        0 Findings (Clean)
                      </button>
                      <button
                        onClick={() => {
                          FederationService.recordSecurityAudit(t.id, 2);
                          setTrusts([...FederationService.getTrustRelationships()]);
                        }}
                        className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-[10px] font-mono rounded"
                      >
                        2 Findings
                      </button>
                      <button
                        onClick={() => {
                          FederationService.recordSecurityAudit(t.id, 5);
                          setTrusts([...FederationService.getTrustRelationships()]);
                        }}
                        className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px] font-mono rounded"
                      >
                        5 Findings
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Data Sharing Agreements */}
      {activeTab === "agreements" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dsas.map((d) => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">{d.partnerOrganizationName}</h3>
                    <p className="text-xs text-emerald-400 font-semibold">{d.agreementType}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-bold rounded-lg">
                    {d.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2">
                  <div>Legal Basis: <span className="font-mono text-amber-300">{d.legalBasis}</span></div>
                  <div>
                    <span className="font-semibold block mb-1">Permitted Resources:</span>
                    <div className="flex flex-wrap gap-1">
                      {d.permittedResources.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-mono rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Federated Search */}
      {activeTab === "search" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleFederatedSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search IMEI, phone number, suspect name across partner organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition"
            >
              Search Trusted Partners
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-3 pt-2">
              {searchResults.map((res) => (
                <div key={res.entityId} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white font-mono">{res.entityId} ({res.entityType})</span>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono rounded">
                      {res.visibilityLevel} VISIBILITY
                    </span>
                  </div>
                  <p className="text-slate-300">{res.snippet}</p>
                  <div className="text-[10px] text-slate-400 font-mono">Source Origin: {res.provenance}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Data Requests & Approvals */}
      {activeTab === "requests" && (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{r.requesterOrgName}</span>
                  <span className="text-slate-400">requested access from</span>
                  <span className="font-bold text-emerald-400">{r.targetOrgName}</span>
                </div>
                <div className="text-slate-300">Resource: <strong className="text-white">{r.requestedResource}</strong></div>
                <div className="text-slate-400 text-[11px]">Purpose: {r.purpose} | Legal Basis: {r.legalBasis}</div>
              </div>

              <div className="flex items-center gap-2">
                {r.status === "PENDING_REVIEW" ? (
                  <>
                    <button
                      onClick={() => handleApproveRequest(r.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                    >
                      Approve Grant
                    </button>
                    <button
                      onClick={() => handleRejectRequest(r.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-3 py-1 font-mono font-bold rounded-lg text-xs ${
                      r.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {r.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Policy Engine Simulator */}
      {activeTab === "policy" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Federation Policy Engine Evaluation Simulator</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Requesting Organization</label>
              <input
                type="text"
                value={simReqOrg}
                onChange={(e) => setSimReqOrg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Organization</label>
              <input
                type="text"
                value={simTargetOrg}
                onChange={(e) => setSimTargetOrg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Resource Type</label>
              <input
                type="text"
                value={simResType}
                onChange={(e) => setSimResType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleSimulatePolicy}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
          >
            Evaluate Policy Access Rules
          </button>

          {simResult && (
            <div
              className={`p-4 rounded-xl border space-y-1 font-mono text-xs ${
                simResult.allowed
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {simResult.allowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                ACCESS EVALUATION RESULT: {simResult.allowed ? "ALLOWED" : "DENIED"}
              </div>
              <div>{simResult.reason}</div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Data Request */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleDataRequestSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs"
          >
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Submit Cross-Organization Data Request</h2>
            <div>
              <label className="block text-slate-400 mb-1">Requested Resource</label>
              <input
                type="text"
                placeholder="e.g. CDR Tower Handover Logs for IME123"
                value={reqResource}
                onChange={(e) => setReqResource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Investigation Purpose</label>
              <textarea
                placeholder="Describe investigative necessity..."
                value={reqPurpose}
                onChange={(e) => setReqPurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white h-20"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Legal Basis / Warrant Reference</label>
              <input
                type="text"
                placeholder="e.g. High Court Order #HC-2026-901"
                value={reqLegal}
                onChange={(e) => setReqLegal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
