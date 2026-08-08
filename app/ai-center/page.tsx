"use client";

import React, { useState, useEffect } from "react";
import { BrainCircuit, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Eye, Sparkles, Filter } from "lucide-react";

export default function AiCenterPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulated initial AI alerts feed
    setAlerts([
      {
        id: "alt_1",
        entityId: "IMEI358992019921101",
        alertType: "SUSPICIOUS_SIM_ACTIVITY",
        priority: "critical",
        riskScore: 88,
        description: "Device associated with 8 distinct SIM card swaps in 48 hours.",
        status: "NEW",
        createdAt: "2026-08-01 01:20",
      },
      {
        id: "alt_2",
        entityId: "IMEI889012300119",
        alertType: "LOCATION_ANOMALY",
        priority: "high",
        riskScore: 74,
        description: "Impossible travel velocity detected: 840 km/h between Nairobi & Mombasa.",
        status: "UNDER_REVIEW",
        createdAt: "2026-08-01 00:45",
      },
    ]);

    setRecommendations([
      { id: "rec_1", recommendation: "Device IMEI35899201 has changed SIM cards 8 times. Recommend issuing subpoena for subscriber SIM records.", priority: "high" },
      { id: "rec_2", recommendation: "Entity is linked to 2 active police investigations. Recommend cross-jurisdictional agency coordination.", priority: "critical" },
    ]);
  }, []);

  const handleReviewAction = (decision: "CONFIRM" | "DISMISS" | "ESCALATE") => {
    if (!selectedAlert) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === selectedAlert.id
            ? { ...a, status: decision === "CONFIRM" ? "CONFIRMED" : decision === "DISMISS" ? "DISMISSED" : "UNDER_REVIEW" }
            : a
        )
      );
      setSelectedAlert(null);
      setReviewNotes("");
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Intelligence & Fraud Command Desk</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Automated risk evaluation, anomaly detection rules engine, and human oversight desk</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Model: RuleEngine-v1.2.0
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Alerts Center */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-slate-200">Active Intelligence Alerts</h2>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">{alerts.length} Pending</span>
          </div>

          <div className="divide-y divide-slate-800 mt-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAlert(a)}
                className={`p-4 rounded-xl cursor-pointer transition border mt-2 ${
                  selectedAlert?.id === a.id
                    ? "bg-slate-800 border-indigo-500"
                    : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        a.priority === "critical" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {a.priority}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">{a.alertType}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">Risk Score {a.riskScore}</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-2">{a.entityId}</div>
                <div className="text-xs text-slate-300 mt-1">{a.description}</div>
                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                  <span>Created: {a.createdAt}</span>
                  <span className="font-semibold text-indigo-400">Status: {a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human Oversight & AI Recommendation Panel */}
        <div className="space-y-6">
          {/* Selected Alert Human Desk */}
          {selectedAlert ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Human Investigator Review</h3>
              <p className="text-xs text-slate-400 mb-4">Review AI decision signals before taking enforcement action.</p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs mb-4">
                <div className="font-semibold text-slate-200">{selectedAlert.alertType}</div>
                <div className="text-slate-400 mt-1">{selectedAlert.description}</div>
              </div>

              <textarea
                placeholder="Add investigator review notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 mb-4 h-20"
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReviewAction("CONFIRM")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-semibold transition"
                >
                  Confirm
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReviewAction("ESCALATE")}
                  className="bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg text-xs font-semibold transition"
                >
                  Escalate
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleReviewAction("DISMISS")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <Eye className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-300">Select an alert to initiate review</div>
            </div>
          )}

          {/* AI Investigation Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-slate-200">Investigation Suggestions</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((r) => (
                <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <span className="text-indigo-400 font-semibold uppercase">{r.priority} priority</span>
                  <div className="text-slate-300 mt-1">{r.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
