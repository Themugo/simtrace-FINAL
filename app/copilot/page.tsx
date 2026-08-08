"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Link2,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  History,
  Download,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  CopilotEngineService,
  CopilotMessage,
  GroundingSource,
  ExplainableRiskResponse,
} from "../../services/copilotEngine.service";

export default function InvestigatorAICopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "init-1",
      sender: "COPILOT",
      text: `Hello Officer, I am **SimTrace AI Copilot v2.0**—your grounded intelligence assistant. 

I can help you analyze suspect SIM swap networks, explain complex multi-vector risk scores, search cell tower logs, and draft court-admissible reports.

*How can I assist your investigation today?*`,
      timestamp: new Date().toISOString(),
      suggestedPrompts: [
        "Why is IMEI 869123049182341 flagged as critical risk?",
        "Draft executive report for Case KE-2026-0891",
        "Summarize SIM swap activity for the last 30 days",
        "Recommend tactical field actions for POI-9912",
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<GroundingSource | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim() || isProcessing) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      text: promptText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsProcessing(true);

    setTimeout(() => {
      const copilotResponse = CopilotEngineService.processQuery(promptText);
      setMessages((prev) => [...prev, copilotResponse]);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base">SimTrace Investigator AI Copilot</h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold rounded">
                GROUNDED RAG v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded Natural Language Intelligence & Explainable Risk Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Mandatory Human Officer Approval Required
          </div>
          <button
            onClick={() => setShowLogsModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-700"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" /> AI Audit Trail
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Conversation Stream */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "COPILOT" && (
                <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs space-y-3 ${
                  msg.sender === "USER"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {/* Explainable Risk Factor Breakdown Card */}
                {msg.riskAnalysis && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs mt-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" /> Explainable Risk Assessment
                      </span>
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-bold text-[10px] rounded">
                        {msg.riskAnalysis.totalRiskScore} / 100 ({msg.riskAnalysis.riskLevel})
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-slate-400 font-semibold text-[11px]">CONTRIBUTING RISK FACTORS:</div>
                      {msg.riskAnalysis.factors.map((f, idx) => (
                        <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-200">{f.factor}</span>
                            <p className="text-[10px] text-slate-400">{f.description}</p>
                          </div>
                          <span className="text-rose-400 font-mono font-bold">+{f.impactScore} pts</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="text-slate-400 font-semibold text-[11px]">RECOMMENDED INVESTIGATIVE ACTIONS:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                        {msg.riskAnalysis.recommendedActions.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Report Draft Assistant Card */}
                {msg.reportDraft && (
                  <div className="p-4 bg-slate-950 border border-cyan-900/40 rounded-xl space-y-3 text-xs mt-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> {msg.reportDraft.title}
                      </span>
                      <button className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] rounded flex items-center gap-1">
                        <Download className="w-3 h-3" /> Export Draft
                      </button>
                    </div>
                    <p className="text-slate-300 italic">{msg.reportDraft.executiveSummary}</p>
                    <div className="space-y-1">
                      <div className="text-slate-400 font-semibold">Key Findings:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {msg.reportDraft.keyFindings.map((kf, i) => (
                          <li key={i}>{kf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Grounding Sources & Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-cyan-400" /> GROUNDING SOURCES ({msg.sources.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src) => (
                        <button
                          key={src.id}
                          onClick={() => setSelectedSource(src)}
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded text-[10px] font-mono flex items-center gap-1 transition"
                        >
                          <Info className="w-3 h-3" /> [{src.type}] {src.referenceId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Prompts Pill Bar */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedPrompts.map((sp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sp)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[11px] transition flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-400" /> {sp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "USER" && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 items-center text-xs text-cyan-400 animate-pulse">
              <Bot className="w-4 h-4" />
              <span>SimTrace Copilot is retrieving grounded intelligence graph context...</span>
            </div>
          )}
        </div>

        {/* Selected Source Inspection Drawer */}
        {selectedSource && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 space-y-4 text-xs overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" /> Source Details
              </h2>
              <button onClick={() => setSelectedSource(null)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <div>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold rounded">
                {selectedSource.type}
              </span>
              <h3 className="font-bold text-white text-sm mt-2">{selectedSource.title}</h3>
              <p className="text-slate-400 font-mono text-[11px] mt-1">Ref ID: {selectedSource.referenceId}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 leading-relaxed font-mono text-[11px]">
              {selectedSource.snippet}
            </div>
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-5xl mx-auto"
        >
          <input
            type="text"
            placeholder="Ask AI Copilot (e.g., 'Why is IMEI123 considered high risk?' or 'Draft report for Case KE-0891')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isProcessing}
            className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>

      {/* AI Audit Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> AI Interactions Audit Log Ledger (AI_INTERACTIONS)
              </h2>
              <button onClick={() => setShowLogsModal(false)} className="text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <p className="text-slate-400">
              All prompts, RAG sources, confidence scores, and outputs are immutably logged for CJIS compliance.
            </p>
            <div className="space-y-3">
              {CopilotEngineService.getAIInteractionLogs().map((log) => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-cyan-400 font-bold">
                    <span>PROMPT: {log.prompt}</span>
                    <span>Confidence: {log.confidencePercent}%</span>
                  </div>
                  <div className="text-slate-300">{log.responseSnippet}</div>
                  <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                    <span>Model: {log.model} | Sources: {log.sourcesCount}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
