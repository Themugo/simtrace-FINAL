"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

// ── Risk Meter ────────────────────────────────────────────────────────────────
interface RiskMeterProps {
  score: number;
}

function RiskMeter({ score }: RiskMeterProps) {
  const color = score >= 70 ? "var(--rose)" : score >= 35 ? "var(--amber)" : "var(--emerald)";
  const label = score >= 70 ? "HIGH RISK"   : score >= 35 ? "MEDIUM RISK"  : "LOW RISK";
  const r = 32; const circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="7"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition:"stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>
        <text x="44" y="49" textAnchor="middle" fontSize="16" fontWeight="800" fill={color}>{score}</text>
      </svg>
      <span style={{ fontSize:"0.72rem", fontWeight:700, color, letterSpacing:"0.06em" }}>{label}</span>
    </div>
  );
}

// ── Bulk Checker ──────────────────────────────────────────────────────────────
interface BulkResult {
  imei: string;
  status: string;
  make?: string;
  model?: string;
  riskScore?: number;
  stolen?: boolean;
}

function BulkChecker() {
  const [csv,      setCsv]      = useState("");
  const [results,  setResults]  = useState<BulkResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);

  const STATUS_COLOR: Record<string, string> = {
    stolen:"var(--rose)", blacklisted:"var(--amber)",
    active:"var(--emerald)", unknown:"var(--muted)", recovered:"var(--sky)"
  };

  async function run() {
    const imeis = csv.split(/[\n,\s]+/).map(s => s.replace(/\D/g,"")).filter(s => s.length >= 15 && s.length <= 17);
    if (!imeis.length) return;
    setResults([]); setLoading(true); setProgress(0);
    const out: BulkResult[] = [];
    for (let i = 0; i < Math.min(imeis.length, 100); i++) {
      try {
        const r = await api.imeiLookup(imeis[i]);
        out.push({ imei:imeis[i], ...r });
      } catch {
        out.push({ imei:imeis[i], status:"error", riskScore:0 });
      }
      setProgress(Math.round(((i+1)/Math.min(imeis.length,100))*100));
      await new Promise(r => setTimeout(r, 120));
    }
    setResults(out);
    setLoading(false);
  }

  function exportCSV() {
    const rows = ["IMEI,Status,Make,Model,RiskScore,Stolen"].concat(
      results.map(r => [r.imei, r.status, r.make||"", r.model||"", r.riskScore||0, r.stolen?"YES":"NO"].join(","))
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type:"text/csv" }));
    a.download = `simtrace-bulk-${Date.now()}.csv`;
    a.click();
  }

  const high = results.filter(r => (r.riskScore||0) >= 70 || r.stolen).length;
  const clean = results.filter(r => r.status === "active" && !r.stolen).length;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", alignItems:"start" }}>
      {/* Input */}
      <div className="card">
        <h3 style={{ marginBottom:"0.5rem" }}>Paste IMEIs</h3>
        <p className="text-muted" style={{ fontSize:"0.85rem", marginBottom:"0.85rem" }}>
          Up to 100 IMEIs — one per line, comma or space separated. Great for verifying phones before purchase.
        </p>
        <textarea value={csv} onChange={e => setCsv(e.target.value)}
          placeholder={"356938035643809\n490154203237518\n012345678901234"}
          rows={8} style={{ fontFamily:"var(--mono)", fontSize:"0.82rem", resize:"vertical", marginBottom:"0.75rem" }} />

        {loading && (
          <div style={{ marginBottom:"0.75rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", color:"var(--muted)", marginBottom:4 }}>
              <span>Checking IMEIs…</span><span>{progress}%</span>
            </div>
            <div style={{ background:"var(--border)", borderRadius:4, height:6, overflow:"hidden" }}>
              <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,var(--sky),var(--indigo))", transition:"width 0.3s ease" }} />
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn-primary" onClick={run} disabled={loading || !csv.trim()} style={{ flex:1, justifyContent:"center" }}>
            {loading ? `⟳ ${progress}%` : "Check All IMEIs"}
          </button>
          {results.length > 0 && (
            <button className="btn-ghost" onClick={exportCSV} style={{ padding:"0.6rem 1rem" }}>
              ↓ CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        {results.length > 0 && (
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {/* Summary */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", borderBottom:"1px solid var(--border)" }}>
              {([
                [high,   "High risk",   "var(--rose)"   ],
                [clean,  "Clean",       "var(--emerald)"],
                [results.length, "Total","var(--text2)" ],
              ] as const).map(([n,l,c]) => (
                <div key={l as string} style={{ padding:"0.75rem", textAlign:"center", borderRight:"1px solid var(--border)" }}>
                  <div style={{ fontSize:"1.4rem", fontWeight:800, color:c }}>{n}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>{l as string}</div>
                </div>
              ))}
            </div>
            {/* Rows */}
            <div style={{ maxHeight:380, overflowY:"auto" }}>
              {results.map(r => (
                <div key={r.imei} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 0.85rem", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontFamily:"var(--mono)", fontSize:"0.8rem", flex:1, color:"var(--text2)" }}>{r.imei}</span>
                  <span style={{ fontSize:"0.7rem", padding:"2px 8px", borderRadius:20, background:`${STATUS_COLOR[r.status]||"var(--muted)"}18`, color:STATUS_COLOR[r.status]||"var(--muted)", fontWeight:700, textTransform:"uppercase" }}>
                    {r.status}
                  </span>
                  <span style={{ fontSize:"0.75rem", fontWeight:700, color:(r.riskScore||0)>=70?"var(--rose)":(r.riskScore||0)>=35?"var(--amber)":"var(--emerald)", minWidth:40, textAlign:"right" }}>
                    {r.riskScore||0}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!results.length && !loading && (
          <div style={{ padding:"3rem", textAlign:"center", color:"var(--dim)", fontSize:"0.88rem" }}>
            Results will appear here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main IMEI page ────────────────────────────────────────────────────────────
interface ImeiResult {
  imei?: string;
  make?: string;
  model?: string;
  lastSeen?: string;
  riskScore?: number;
  status?: string;
  stolen?: boolean;
  found?: boolean;
  reportRef?: string;
}

function ImeiPageInner() {
  const params               = useSearchParams();
  const { user }             = useAuth();
  const toast                = useToast();
  const [tab,      setTab]   = useState("single");
  const [imei,     setImei]  = useState(params.get("q") || "");
  const [result,   setResult]= useState<ImeiResult | null>(null);
  const [error,    setError] = useState("");
  const [loading,  setLoading]= useState(false);
  const [aiReport, setAiReport]= useState<string | null>(null);
  const [aiLoading,setAiLoad]= useState(false);

  useEffect(() => {
    if (params.get("q")) doCheck(params.get("q"));
  }, []);

  async function doCheck(val?: string | null) {
    const clean = (val || imei).replace(/\D/g,"");
    if (!clean.match(/^\d{15,17}$/)) { setError("Enter a valid IMEI — 15 to 17 digits"); return; }
    setError(""); setLoading(true); setResult(null); setAiReport(null);
    try {
      const r = await api.imeiLookup(clean);
      setResult(r);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function getAIReport() {
    setAiLoad(true);
    try {
      const { report } = await api.imeiReport(result?.imei || imei.replace(/\D/g,""));
      setAiReport(report);
    } catch (err: any) { toast?.add(err.message, "danger"); }
    finally { setAiLoad(false); }
  }

  const statusColor: Record<string, string> = { active:"var(--emerald)", stolen:"var(--rose)", blacklisted:"var(--amber)", recovered:"var(--sky)", unknown:"var(--muted)" };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"1.75rem" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:20, padding:"3px 12px", marginBottom:"0.75rem", fontSize:"0.78rem", color:"var(--sky)" }}>
          🔍 Free · No account required
        </div>
        <h1 style={{ marginBottom:"0.35rem" }}>IMEI Checker</h1>
        <p className="text-muted">Instantly verify any device. Dial <strong style={{ color:"var(--text)" }}>*#06#</strong> on your phone to find its IMEI.</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--border)", marginBottom:"1.5rem" }}>
        {[["single","Single IMEI"],["bulk","Bulk Check (up to 100)"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background:"transparent", border:"none",
            color: tab===k ? "var(--sky)" : "var(--muted)",
            fontWeight: tab===k ? 700 : 400,
            fontSize:"0.9rem", cursor:"pointer",
            padding:"0.5rem 1rem",
            borderBottom:`2px solid ${tab===k?"var(--sky)":"transparent"}`,
            transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {/* ── Single check ── */}
      {tab === "single" && (
        <div>
          <form onSubmit={e => { e.preventDefault(); doCheck(); }} style={{ display:"flex", gap:"0.6rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:240, position:"relative" }}>
              <input value={imei} onChange={e => { setImei(e.target.value); setError(""); setResult(null); }}
                placeholder="Enter IMEI — e.g. 356938035643809"
                inputMode="numeric" maxLength={17}
                style={{ paddingLeft:"2.75rem", height:50, fontSize:"0.95rem" }} />
              <span style={{ position:"absolute", left:"0.9rem", top:"50%", transform:"translateY(-50%)", fontSize:"1.1rem", pointerEvents:"none" }}>📱</span>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ height:50, padding:"0 1.75rem", fontSize:"0.95rem", whiteSpace:"nowrap" }}>
              {loading ? "⟳ Checking…" : "Check IMEI"}
            </button>
          </form>

          {error && (
            <div style={{ background:"rgba(251,113,133,0.1)", border:"1px solid rgba(251,113,133,0.2)", borderRadius:"var(--r)", padding:"0.65rem 0.9rem", color:"var(--rose)", fontSize:"0.9rem", marginBottom:"1rem" }}>
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div style={{ display:"flex", gap:"1rem" }}>
              {[1,2,3].map(i => <div key={i} className="card" style={{ flex:1, height:100, opacity:0.4, animation:"shimmer 1.5s infinite" }} />)}
            </div>
          )}

          {result && !loading && (
            <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"1.25rem", alignItems:"start" }}>
              {/* Risk gauge */}
              <div className="card" style={{ textAlign:"center", minWidth:140 }}>
                <RiskMeter score={result.riskScore || 0} />
                <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid var(--border)" }}>
                  <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Status</div>
                  <span style={{ display:"inline-block", background:`${statusColor[result.status||"unknown"]||"var(--muted)"}18`, color:statusColor[result.status||"unknown"]||"var(--muted)", padding:"3px 12px", borderRadius:20, fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase" }}>
                    {result.status || "unknown"}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                {/* Device info */}
                <div className="card">
                  <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.85rem" }}>
                    Device Information
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                    {([
                      ["IMEI",      result.imei || imei.replace(/\D/g,""), true],
                      ["Make",      result.make  || "Unknown"],
                      ["Model",     result.model || "Unknown"],
                      ["Last seen", result.lastSeen ? new Date(result.lastSeen).toLocaleDateString("en-KE") : "Never"],
                    ] as const).map(([k,v,mono]) => (
                      <div key={k} style={{ background:"var(--bg)", borderRadius:8, padding:"0.6rem 0.85rem" }}>
                        <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k}</div>
                        <div style={{ fontFamily:mono?"var(--mono)":undefined, fontSize:"0.88rem", color:"var(--text)", fontWeight:500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stolen warning */}
                {result.stolen && (
                  <div style={{ background:"rgba(251,113,133,0.08)", border:"1px solid rgba(251,113,133,0.25)", borderRadius:"var(--r-lg)", padding:"1rem 1.25rem" }}>
                    <div style={{ fontWeight:700, color:"var(--rose)", marginBottom:"0.35rem" }}>🚨 Reported Stolen</div>
                    <p style={{ color:"var(--text2)", fontSize:"0.88rem", margin:0, lineHeight:1.6 }}>
                      This device has an active theft report. Purchasing or selling it could result in criminal charges. Reference case: <strong style={{ fontFamily:"var(--mono)" }}>{result.reportRef}</strong>
                    </p>
                  </div>
                )}

                {/* Clean result */}
                {result.found && !result.stolen && result.status === "active" && (
                  <div style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:"var(--r-lg)", padding:"0.85rem 1.1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(52,211,153,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>✅</div>
                    <div>
                      <div style={{ fontWeight:700, color:"var(--emerald)", marginBottom:2 }}>Clean device</div>
                      <div style={{ color:"var(--text2)", fontSize:"0.85rem" }}>No theft reports or blacklist entries found.</div>
                    </div>
                  </div>
                )}

                {/* Not found */}
                {!result.found && (
                  <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:"var(--r-lg)", padding:"0.85rem 1.1rem" }}>
                    <div style={{ fontWeight:600, color:"var(--sky)", marginBottom:2 }}>Not in SimTrace database</div>
                    <p style={{ color:"var(--text2)", fontSize:"0.85rem", margin:0 }}>
                      This IMEI isn't registered. <a href="/login" style={{ color:"var(--sky)" }}>Sign in</a> to register and protect it.
                    </p>
                  </div>
                )}

                {/* AI Report button */}
                {result.found && (
                  <div>
                    {!aiReport ? (
                      <button onClick={getAIReport} disabled={aiLoading}
                        style={{ background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.25)", color:"var(--indigo)", borderRadius:"var(--r)", padding:"0.65rem 1.25rem", fontSize:"0.88rem", fontWeight:600, cursor:"pointer", width:"100%", justifyContent:"center", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        {aiLoading ? "⟳ Generating AI report…" : "🤖 Generate AI Security Report"}
                      </button>
                    ) : (
                      <div style={{ background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.2)", borderRadius:"var(--r-lg)", padding:"1rem 1.1rem" }}>
                        <div style={{ fontWeight:700, color:"var(--indigo)", marginBottom:"0.6rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          🤖 AI Security Report
                        </div>
                        <p style={{ fontSize:"0.88rem", color:"var(--text2)", margin:0, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{aiReport}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {user && (
                  <div style={{ display:"flex", gap:"0.6rem", flexWrap:"wrap" }}>
                    <Link href={`/report?imei=${result.imei || imei}`}
                      style={{ background:"rgba(251,113,133,0.1)", border:"1px solid rgba(251,113,133,0.25)", color:"var(--rose)", borderRadius:"var(--r)", padding:"6px 16px", fontSize:"0.85rem", fontWeight:600, textDecoration:"none" }}>
                      🚨 Report Stolen
                    </Link>
                    <Link href="/devices"
                      style={{ background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--text2)", borderRadius:"var(--r)", padding:"6px 16px", fontSize:"0.85rem", fontWeight:600, textDecoration:"none" }}>
                      Register Device
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk check ── */}
      {tab === "bulk" && <BulkChecker />}
    </div>
  );
}

export default function ImeiPage() {
  return (
    <Suspense fallback={<div style={{ padding:"2rem", color:"var(--muted)", textAlign:"center" }}>Loading…</div>}>
      <ImeiPageInner />
    </Suspense>
  );
}
