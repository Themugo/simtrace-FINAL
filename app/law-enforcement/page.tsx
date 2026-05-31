"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

interface Partner {
  status: string;
  apiCallsMonth?: number;
  apiCallsLimit?: number;
  tier?: string;
  apiKey?: string;
}

interface BulkResult {
  imei: string;
  status: string;
  risk: string;
}

export default function LawEnforcementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [tab,     setTab]     = useState("check");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      api.get("/api/partner/me").then(setPartner).catch(() => {});
    }
  }, [user, authLoading]);

  async function runBulkCheck(e: React.FormEvent) {
    e.preventDefault();
    const imeis = bulkInput.split(/[\n,\s]+/).map(s => s.replace(/\D/g,"")).filter(s => s.length >= 15);
    if (!imeis.length) return;
    setCheckLoading(true);
    try {
      const res = await api.post("/api/partner/imei/bulk", { imeis: imeis.slice(0, 500) });
      setBulkResults(res.results || []);
    } catch (err: any) { alert(err.message); }
    finally { setCheckLoading(false); }
  }

  const RISK_COLOR: Record<string, string> = { HIGH: "var(--rose)", LOW: "var(--emerald)", MEDIUM: "var(--amber)" };
  const STATUS_COLOR: Record<string, string> = { stolen: "var(--rose)", blacklisted: "var(--amber)", active: "var(--emerald)", recovered: "var(--sky)", unknown: "var(--muted)" };

  if (authLoading) return <p className="text-muted">Loading…</p>;

  if (!user) return null;

  const isPartner = partner && partner.status === "active";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--surface)", border: "1px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
          🏛️
        </div>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>Law Enforcement Portal</h1>
          <p className="text-muted">Verified access to SimTrace device intelligence for investigations</p>
        </div>
        {isPartner && (
          <span style={{ marginLeft: "auto", background: "rgba(52,211,153,0.1)", color: "var(--emerald)", padding: "4px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700 }}>
            ✓ VERIFIED PARTNER
          </span>
        )}
      </div>

      {/* Not approved yet */}
      {!isPartner && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
          <h2 style={{ marginBottom: "0.5rem" }}>Access Restricted</h2>
          <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto 1.5rem" }}>
            This portal is for verified law enforcement agencies. Apply through our partner programme with your official credentials and OAG/DCI letter of authorisation.
          </p>
          <a href="/telecom-portal" style={{ background: "linear-gradient(135deg,var(--sky-dim),var(--indigo-dim))", color: "#fff", padding: "0.75rem 2rem", borderRadius: 10, fontWeight: 700, textDecoration: "none", display: "inline-block" }}>
            Apply for Partner Access
          </a>
        </div>
      )}

      {/* Partner — full access */}
      {isPartner && (
        <>
          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: "1.25rem" }}>
            {[
              ["API Calls (Month)", partner.apiCallsMonth?.toLocaleString() || 0, "var(--sky)"],
              ["Monthly Limit",     partner.apiCallsLimit?.toLocaleString() || 0, "var(--muted)"],
              ["Tier",              partner.tier?.toUpperCase(),                   "var(--amber)"],
              ["Quota Used",        `${Math.round(((partner.apiCallsMonth || 0) / (partner.apiCallsLimit || 1)) * 100)}%`, "var(--emerald)"],
            ].map(([label, value, color]) => (
              <div key={label} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: "0.72rem", color: "var(--dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {["check","reports","api"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ background: tab === t ? "var(--surface)" : "transparent", border: `1px solid ${tab === t ? "var(--indigo)" : "var(--border)"}`, color: tab === t ? "var(--sky)" : "var(--muted)", borderRadius: 8, padding: "5px 14px", fontSize: "0.82rem", cursor: "pointer", textTransform: "capitalize" }}>
                {t === "check" ? "🔍 Bulk IMEI Check" : t === "reports" ? "📋 Active Reports" : "🔑 API Access"}
              </button>
            ))}
          </div>

          {/* Bulk IMEI check */}
          {tab === "check" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" }}>
              <div className="card">
                <h3 style={{ marginBottom: "0.75rem" }}>Bulk IMEI Verification</h3>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Paste up to 500 IMEIs (one per line, comma, or space separated). We'll cross-reference against the national blacklist.
                </p>
                <form onSubmit={runBulkCheck}>
                  <textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder={"356938035643809\n490154203237518\n012345678901234"}
                    style={{ height: 200, fontFamily: "monospace", fontSize: "0.82rem", resize: "vertical", marginBottom: "0.75rem" }}
                  />
                  <button type="submit" className="btn-primary" disabled={checkLoading} style={{ width: "100%" }}>
                    {checkLoading ? "Checking…" : "Check IMEIs"}
                  </button>
                </form>
              </div>

              <div>
                {bulkResults.length > 0 && (
                  <div className="card" style={{ padding: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", padding: "0 0.25rem" }}>
                      <h3>Results ({bulkResults.length})</h3>
                      <span style={{ fontSize: "0.78rem", color: "var(--rose)", fontWeight: 700 }}>
                        {bulkResults.filter(r => r.risk === "HIGH").length} HIGH RISK
                      </span>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {bulkResults.map(r => (
                        <div key={r.imei} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 0.25rem", borderBottom: "1px solid #0f172a" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", flex: 1, color: "var(--text2)" }}>{r.imei}</span>
                          <span style={{ fontSize: "0.68rem", padding: "1px 8px", borderRadius: 20, background: STATUS_COLOR[r.status] + "22", color: STATUS_COLOR[r.status], fontWeight: 700 }}>
                            {r.status?.toUpperCase()}
                          </span>
                          <span style={{ fontSize: "0.68rem", padding: "1px 8px", borderRadius: 20, background: RISK_COLOR[r.risk] + "22", color: RISK_COLOR[r.risk], fontWeight: 700 }}>
                            {r.risk}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reports tab */}
          {tab === "reports" && (
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>Open Theft Reports</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                Access active theft cases in your jurisdiction via the Admin Dashboard or contact{" "}
                <a href="mailto:cases@simtrace.site" style={{ color: "var(--sky)" }}>cases@simtrace.site</a> with your case number.
              </p>
              <div style={{ marginTop: "1rem" }}>
                <a href="/dashboard" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                  Open Command Centre →
                </a>
              </div>
            </div>
          )}

          {/* API tab */}
          {tab === "api" && (
            <div className="card">
              <h3 style={{ marginBottom: "0.75rem" }}>Your API Credentials</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">API Key</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={partner.apiKey || "—"} readOnly style={{ fontFamily: "monospace", fontSize: "0.82rem" }} />
                  <button onClick={() => navigator.clipboard.writeText(partner.apiKey || "")}
                    style={{ background: "var(--border)", border: "1px solid #334155", color: "var(--text2)", padding: "0 14px", borderRadius: 8, whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                    Copy
                  </button>
                </div>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 10, padding: "1rem", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.8 }}>
                <div style={{ color: "var(--dim)", marginBottom: "0.5rem" }}># Bulk IMEI verification</div>
                <div><span style={{ color: "var(--sky)" }}>POST</span> https://api.simtrace.site/api/partner/imei/bulk</div>
                <div style={{ color: "var(--dim)" }}>X-Partner-Key: {partner.apiKey?.slice(0,20)}…</div>
                <div style={{ color: "var(--dim)" }}>{`{"imeis": ["356938035643809", "490154203237518"]}`}</div>
              </div>
              <a href="/telecom-portal#api-docs" style={{ display: "inline-block", marginTop: "1rem", color: "var(--sky)", fontSize: "0.85rem" }}>
                Full API Documentation →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
