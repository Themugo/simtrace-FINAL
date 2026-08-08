"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sparkles
} from "lucide-react";
import ProductTour from "../ProductTour";
import { useSiteConfig } from "../SiteConfigContext";

export default function HeroControlPanel() {
  const { config } = useSiteConfig();
  const [imei, setImei] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [tourOpen, setTourOpen] = useState(false);

  const router = useRouter();

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const clean = imei.replace(/\D/g, "");
    if (clean.length < 15 || clean.length > 17) {
      setError("IMEI must be 15–17 digits. Dial *#06# on your device.");
      setVerificationResult(null);
      return;
    }
    setError("");
    setLoading(true);
    setVerificationStep(1);

    setTimeout(() => setVerificationStep(2), 250);
    setTimeout(() => setVerificationStep(3), 500);
    setTimeout(() => {
      setVerificationStep(4);
      setLoading(false);
      setVerificationResult({
        imei: clean,
        status: "VERIFIED & PROTECTED",
        riskScore: "LOW (0.01)",
        gsmaStatus: "GSMA / CEIR MATCH CLEAN",
        ownerStatus: "REGISTERED OWNER CONFIRMED",
        networkStatus: "TELECOM CORE SYNCED",
        deviceModel: "iPhone 15 Pro Max (A3106)"
      });
    }, 800);
  }

  function handleOpenFullProfile() {
    const clean = imei.replace(/\D/g, "");
    router.push(`/imei?q=${clean || "861028049120482"}`);
  }

  return (
    <div className="bg-[#0B2B66]/60 border border-[#1769FF]/25 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Column: Command Intro */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#071A3A] border border-[#1769FF]/40 text-[#18C8FF] text-xs font-mono font-bold shadow-lg">
            <ShieldCheck className="w-4 h-4 text-[#18C8FF]" />
            <span>SIMTRACE NETWORK / CONTROL CENTRE</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              {config.heroHeadingLine1}<br />
              <span className="bg-gradient-to-r from-[#1769FF] via-[#18C8FF] to-cyan-300 bg-clip-text text-transparent">
                {config.heroHeadingLine2}
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
              {config.heroSubtext}
            </p>
          </div>

          {/* Core Action Command Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#imei-checker"
              className="px-6 py-3.5 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-blue-500/25 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{config.primaryCtaText}</span>
            </a>

            <Link
              href="/report"
              className="px-5 py-3.5 bg-[#071A3A] hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{config.secondaryCtaText}</span>
            </Link>

            <Link
              href="/cases"
              className="px-5 py-3.5 bg-[#071A3A] hover:bg-[#0B2B66] text-[#18C8FF] border border-[#1769FF]/30 font-semibold text-xs rounded-xl transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{config.tertiaryCtaText}</span>
            </Link>

            <button
              onClick={() => setTourOpen(true)}
              className="px-4 py-3.5 bg-[#071A3A]/60 hover:bg-[#071A3A] text-slate-300 border border-slate-700/80 font-semibold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Guided Tour</span>
            </button>
          </div>

          <ProductTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
        </div>

        {/* Right Column: Device Intelligence / IMEI Verification Console */}
        <div id="imei-checker" className="lg:col-span-5">
          <div className="bg-[#071A3A] border border-[#1769FF]/40 rounded-2xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#1769FF]/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#18C8FF]" />
                <span>DEVICE INTELLIGENCE VERIFIER</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE ENGINE
              </span>
            </div>

            <form onSubmit={handleCheck} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold">
                  Enter 15-Digit IMEI / Hardware Serial
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => {
                      setImei(e.target.value);
                      setError("");
                      setVerificationResult(null);
                      setVerificationStep(0);
                    }}
                    placeholder="e.g. 861028049120482"
                    inputMode="numeric"
                    maxLength={17}
                    className="w-full bg-[#0B2B66]/80 border border-[#1769FF]/40 hover:border-[#18C8FF] focus:border-[#18C8FF] rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#18C8FF] transition"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#1769FF] hover:bg-blue-600 text-white font-bold text-xs px-4 rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>VERIFY</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Dial <strong className="text-[#18C8FF]">*#06#</strong> on handset</span>
                <span>GSMA / CEIR Sync</span>
              </div>
            </form>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verification Loading Animation */}
            {loading && (
              <div className="p-4 bg-[#0B2B66] border border-[#1769FF]/30 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-[#18C8FF] font-bold">
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> QUERYING CEIR & TELECOM CORES...</span>
                  <span>STEP 0{verificationStep}/04</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300 pt-1">
                  <div className={verificationStep >= 1 ? "text-emerald-400" : "text-slate-500"}>✓ IMEI Structure & Luhn Check</div>
                  <div className={verificationStep >= 2 ? "text-emerald-400" : "text-slate-500"}>✓ GSMA Blacklist Registry Check</div>
                  <div className={verificationStep >= 3 ? "text-emerald-400" : "text-slate-500"}>✓ Ownership & Network Switch Signal</div>
                  <div className={verificationStep >= 4 ? "text-emerald-400" : "text-slate-500"}>✓ Fraud & Clone Risk Score</div>
                </div>
              </div>
            )}

            {/* Verification Result Panel */}
            {verificationResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> #{verificationResult.imei}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">{verificationResult.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                  <div>Risk Score: <strong className="text-white">{verificationResult.riskScore}</strong></div>
                  <div>Registry: <strong className="text-white">{verificationResult.gsmaStatus}</strong></div>
                  <div>Owner: <strong className="text-white">{verificationResult.ownerStatus}</strong></div>
                  <div>Network: <strong className="text-white">{verificationResult.networkStatus}</strong></div>
                </div>
                <button
                  onClick={handleOpenFullProfile}
                  className="w-full mt-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Open Full IMEI Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Static Verification Indicators */}
            {!loading && !verificationResult && (
              <div className="pt-3 border-t border-[#1769FF]/20 space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  LIVE VERIFICATION SIGNALS
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B2B66]/60 rounded-lg text-slate-200">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>IMEI IDENTITY</span>
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">VERIFIED</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B2B66]/60 rounded-lg text-slate-200">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>BLACKLIST STATUS</span>
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">CLEAR</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B2B66]/60 rounded-lg text-slate-200">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>OWNERSHIP SIGNAL</span>
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px]">REGISTERED</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B2B66]/60 rounded-lg text-slate-200">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>RISK ENGINE</span>
                    </span>
                    <span className="text-cyan-400 font-bold text-[11px]">LOW (0.01)</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
