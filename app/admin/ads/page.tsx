"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

interface SparklineProps {
  data?: number[];
  color?: string;
  height?: number;
}

function Sparkline({ data = [], color = "var(--sky)", height = 36 }: SparklineProps) {
  if (!data.length) return null;
  const max  = Math.max(...data, 1);
  const pts  = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 200;
    const y = height - (v / max) * (height - 4) + 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 200 ${height}`} style={{ width:"100%", height, display:"block" }} preserveAspectRatio="none">
      <polyline points={`0,${height} ${pts} 200,${height}`} fill={color} fillOpacity="0.12" stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_COLOR: Record<string, string> = {
  active:"var(--emerald)", pending:"var(--amber)", rejected:"var(--rose)",
  suspended:"var(--rose)", paused:"var(--muted)", exhausted:"var(--dim)",
};

interface Ad {
  _id: string;
  title: string;
  body: string;
  status: string;
  placement?: string;
  cpcKES?: number;
  impressions?: number;
  clicks?: number;
  spentKES?: number;
  budgetKES?: number;
}

interface Partner {
  _id: string;
  orgName: string;
  status: string;
  tier: string;
  orgType: string;
  apiCallsMonth?: number;
  apiCallsLimit?: number;
}

interface RevenueData {
  monthlyRevKES?: number;
  weeklyRevKES?: number;
  monthlyRevUSD?: number;
  adRevKES?: number;
  totalPayments?: number;
  subscriptions?: Array<{ _id: string; count: number }>;
  recentPayments?: Array<{
    user?: { name?: string };
    description?: string;
    type?: string;
    amountKES?: number;
    paidAt?: string;
  }>;
}

export default function AdminAdsPage() {
  const { user, loading:authLoading } = useAuth();
  const router = useRouter();
  const [tab,      setTab]      = useState("revenue");
  const [revenue,  setRevenue]  = useState<RevenueData | null>(null);
  const [ads,      setAds]      = useState<Ad[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") loadAll();
  }, [user, authLoading]);

  async function loadAll() {
    setLoading(true);
    try {
      const [rev, adList, partList] = await Promise.all([
        api.get("/api/billing/revenue"),
        api.get("/api/ads/admin/all"),
        api.get("/api/partner/admin/all"),
      ]);
      setRevenue(rev);
      setAds(adList || []);
      setPartners(partList || []);
    } catch { /**/ }
    finally { setLoading(false); }
  }

  async function setAdStatus(id: string, status: string) {
    await api.patch(`/api/ads/${id}/status`, { status });
    setAds(a => a.map(x => x._id === id ? { ...x, status } : x));
  }
  async function setPartnerStatus(id: string, status: string) {
    await api.patch(`/api/partner/admin/${id}/status`, { status });
    setPartners(p => p.map(x => x._id === id ? { ...x, status } : x));
  }
  async function setPartnerTier(id: string, tier: string) {
    await api.patch(`/api/partner/admin/${id}/tier`, { tier });
    setPartners(p => p.map(x => x._id === id ? { ...x, tier } : x));
  }

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop:"2rem" }}>Loading…</p>;

  const TABS = [
    { id:"revenue",  label:"💰 Revenue"  },
    { id:"ads",      label:"📢 Ads"      },
    { id:"partners", label:"🤝 Partners" },
  ];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
        <div>
          <h1 style={{ marginBottom:"0.15rem" }}>Revenue & Monetisation</h1>
          <p className="text-muted">Ads, partners, and billing management</p>
        </div>
        <button onClick={loadAll} className="btn-ghost" style={{ fontSize:"0.85rem" }}>↻ Refresh</button>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--border)", marginBottom:"1.5rem" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background:"transparent", border:"none", color:tab===t.id ? "var(--sky)" : "var(--muted)", fontWeight:tab===t.id ? 700 : 400, fontSize:"0.92rem", cursor:"pointer", padding:"0.5rem 1rem", borderBottom:`2px solid ${tab===t.id ? "var(--sky)" : "transparent"}`, transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Revenue tab ── */}
      {tab === "revenue" && revenue && (
        <div>
          {/* KPI cards */}
          <div className="grid-4" style={{ marginBottom:"1.5rem" }}>
            {[
              { label:"MRR (KES)",    value:`KES ${(revenue.monthlyRevKES||0).toLocaleString()}`, color:"var(--emerald)", spark:[revenue.weeklyRevKES*0.5, revenue.weeklyRevKES*0.75, revenue.weeklyRevKES] },
              { label:"Ad Revenue",  value:`KES ${(revenue.adRevKES||0).toLocaleString()}`,      color:"var(--amber)",   spark:null },
              { label:"MRR (USD)",   value:`USD ${(revenue.monthlyRevUSD||0).toLocaleString()}`, color:"var(--sky)",     spark:null },
              { label:"Payments",    value:revenue.totalPayments || 0,                           color:"var(--violet)",  spark:null },
            ].map(({ label, value, color, spark }) => (
              <div key={label} className="stat-card" style={{ "--accent":color }}>
                <div style={{ fontSize:"0.7rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{label}</div>
                <div style={{ fontSize:"1.5rem", fontWeight:800, color, letterSpacing:"-0.02em" }}>{value}</div>
                {spark && <Sparkline data={spark} color={color} />}
              </div>
            ))}
          </div>

          {/* Subscription breakdown */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div className="card">
              <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.85rem" }}>Subscription Mix</div>
              {(revenue.subscriptions || []).map(s => {
                const colors = { free:"var(--muted)", pro:"var(--sky)", business:"var(--violet)", enterprise:"var(--amber)" };
                const total  = (revenue.subscriptions || []).reduce((a,b) => a + b.count, 0) || 1;
                const pct    = Math.round((s.count / total) * 100);
                return (
                  <div key={s._id} style={{ marginBottom:"0.75rem" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.82rem", marginBottom:4 }}>
                      <span style={{ color:colors[s._id] || "var(--text2)", fontWeight:600, textTransform:"capitalize" }}>{s._id}</span>
                      <span style={{ color:"var(--muted)" }}>{s.count} · {pct}%</span>
                    </div>
                    <div style={{ background:"var(--border)", borderRadius:4, height:5, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:colors[s._id] || "var(--sky)", transition:"width 0.6s ease", borderRadius:4 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card">
              <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.85rem" }}>Recent Payments</div>
              {(revenue.recentPayments || []).map((p,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.45rem 0", borderBottom:"1px solid var(--border)", fontSize:"0.82rem" }}>
                  <div>
                    <div style={{ color:"var(--text2)", fontWeight:500 }}>{p.user?.name || "—"}</div>
                    <div style={{ color:"var(--muted)", fontSize:"0.75rem" }}>{p.description || p.type}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:"var(--emerald)", fontWeight:700 }}>KES {(p.amountKES||0).toLocaleString()}</div>
                    <div style={{ color:"var(--dim)", fontSize:"0.72rem" }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-KE") : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Ads tab ── */}
      {tab === "ads" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <p className="text-muted">{ads.length} campaign{ads.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            {ads.length === 0 && <p className="text-muted" style={{ padding:"2rem 0", textAlign:"center" }}>No ad campaigns yet.</p>}
            {ads.map(ad => {
              const ctr = ad.impressions ? ((ad.clicks/ad.impressions)*100).toFixed(2) : "0.00";
              return (
                <div key={ad._id} className="card" style={{ borderLeft:`3px solid ${STATUS_COLOR[ad.status] || "var(--muted)"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"0.75rem" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, marginBottom:2 }}>{ad.title}</div>
                      <div style={{ color:"var(--muted)", fontSize:"0.82rem", marginBottom:4 }}>{ad.body}</div>
                      <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                        <span className={`badge badge-${ad.status==="active"?"ok":ad.status==="pending"?"warn":"danger"}`}>{ad.status}</span>
                        <span className="badge badge-muted">{ad.placement?.replace(/_/g," ")}</span>
                        <span className="badge badge-info">KES {ad.cpcKES}/click</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"0.4rem" }}>
                      {ad.status === "pending" && <>
                        <button onClick={() => setAdStatus(ad._id,"active")} className="btn-success" style={{ fontSize:"0.78rem", padding:"3px 10px" }}>Approve</button>
                        <button onClick={() => setAdStatus(ad._id,"rejected")} className="btn-danger" style={{ fontSize:"0.78rem", padding:"3px 10px" }}>Reject</button>
                      </>}
                      {ad.status === "active"  && <button onClick={() => setAdStatus(ad._id,"paused")}  className="btn-ghost" style={{ fontSize:"0.78rem", padding:"3px 10px" }}>Pause</button>}
                      {ad.status === "paused"  && <button onClick={() => setAdStatus(ad._id,"active")}  className="btn-success" style={{ fontSize:"0.78rem", padding:"3px 10px" }}>Resume</button>}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.5rem" }}>
                    {([
                      ["Impressions", ad.impressions?.toLocaleString() || 0, "var(--text2)"],
                      ["Clicks",      ad.clicks?.toLocaleString() || 0,      "var(--sky)"  ],
                      ["CTR",         `${ctr}%`,                             parseFloat(ctr) >= 2 ? "var(--emerald)" : "var(--muted)"],
                      ["Spent",       `KES ${(ad.spentKES||0).toLocaleString()}`, "var(--amber)"],
                    ] as const).map(([l,v,c]) => (
                      <div key={l} style={{ background:"var(--bg)", borderRadius:"var(--r)", padding:"0.5rem 0.65rem" }}>
                        <div style={{ fontSize:"0.65rem", color:"var(--muted)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
                        <div style={{ fontWeight:700, color:c, fontSize:"0.92rem" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Budget bar */}
                  <div style={{ marginTop:"0.65rem" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--muted)", marginBottom:3 }}>
                      <span>Budget: KES {(ad.budgetKES||0).toLocaleString()}</span>
                      <span>{ad.budgetKES ? Math.round((ad.spentKES/ad.budgetKES)*100) : 0}% used</span>
                    </div>
                    <div style={{ background:"var(--border)", borderRadius:4, height:4, overflow:"hidden" }}>
                      <div style={{ width:`${ad.budgetKES ? Math.min(100, (ad.spentKES/ad.budgetKES)*100) : 0}%`, height:"100%", background:"var(--amber)", borderRadius:4, transition:"width 0.5s ease" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Partners tab ── */}
      {tab === "partners" && (
        <div>
          <p className="text-muted" style={{ marginBottom:"1rem" }}>{partners.length} partner organisation{partners.length !== 1 ? "s" : ""}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
            {partners.length === 0 && <p className="text-muted" style={{ padding:"2rem 0", textAlign:"center" }}>No partner applications yet.</p>}
            {partners.map(p => (
              <div key={p._id} className="card" style={{ borderLeft:`3px solid ${STATUS_COLOR[p.status] || "var(--muted)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, marginBottom:2 }}>{p.orgName}</div>
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.5rem" }}>
                      <span className={`badge badge-${p.status==="active"?"ok":"warn"}`}>{p.status}</span>
                      <span className="badge badge-indigo">{p.tier?.toUpperCase()}</span>
                      <span className="badge badge-muted">{p.orgType?.replace(/_/g," ")}</span>
                    </div>
                    <div style={{ fontSize:"0.78rem", color:"var(--muted)" }}>
                      API calls: {(p.apiCallsMonth||0).toLocaleString()} / {(p.apiCallsLimit||0).toLocaleString()} this month
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                    {p.status !== "active"    && <button onClick={() => setPartnerStatus(p._id,"active")}    className="btn-success" style={{ fontSize:"0.78rem", padding:"3px 10px" }}>Activate</button>}
                    {p.status === "active"    && <button onClick={() => setPartnerStatus(p._id,"suspended")} className="btn-ghost"   style={{ fontSize:"0.78rem", padding:"3px 10px", borderColor:"rgba(251,113,133,0.3)", color:"var(--rose)" }}>Suspend</button>}
                    {p.tier !== "standard"    && <button onClick={() => setPartnerTier(p._id,"standard")}    className="btn-ghost"   style={{ fontSize:"0.78rem", padding:"3px 10px" }}>→ Standard</button>}
                    {p.tier !== "premium"     && <button onClick={() => setPartnerTier(p._id,"premium")}     style={{ background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)", color:"var(--amber)", borderRadius:"var(--r)", padding:"3px 10px", fontSize:"0.78rem", cursor:"pointer" }}>→ Premium</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
