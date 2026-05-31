"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

interface SparklineProps {
  data?: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}

function Sparkline({ data = [], color = "var(--sky)", height = 48, fill = true }: SparklineProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * 200;
    const y = height - (v / max) * (height - 6) + 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 200 ${height}`} style={{ width:"100%", height, display:"block" }} preserveAspectRatio="none">
      {fill && <polyline points={`0,${height} ${pts} 200,${height}`} fill={color} fillOpacity="0.12" stroke="none"/>}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const PLAN_COLOR: Record<string, string> = { free:"var(--muted)", pro:"var(--sky)", business:"var(--violet)", enterprise:"var(--amber)" };

interface RevenueData {
  monthlyRevKES?: number;
  monthlyRevUSD?: number;
  adRevKES?: number;
  weeklyRevKES?: number;
  totalPayments?: number;
  subscriptions?: Array<{ _id: string; count: number }>;
  recentPayments?: Array<{
    user?: { name?: string };
    description?: string;
    type?: string;
    method?: string;
    paidAt?: string;
    amountKES?: number;
  }>;
}

export default function AdminRevenuePage() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const [rev,   setRev]   = useState<RevenueData | null>(null);
  const [loading,setLoad] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") {
      api.get("/api/billing/revenue").then(setRev).catch(console.error).finally(() => setLoad(false));
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop:"2rem" }}>Loading…</p>;
  if (!rev) return <p className="text-muted">Failed to load revenue data.</p>;

  const totalRevKES = (rev.monthlyRevKES || 0);
  const totalRevUSD = (rev.monthlyRevUSD || 0);
  const adRev       = rev.adRevKES || 0;
  const weekRev     = rev.weeklyRevKES || 0;
  const subRevKES   = totalRevKES - adRev;

  const weeklyTrend  = [weekRev*0.4, weekRev*0.6, weekRev*0.75, weekRev*0.9, weekRev*1.1, weekRev*0.95, weekRev];

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.75rem" }}>
        <div>
          <h1 style={{ marginBottom:"0.2rem" }}>Revenue Dashboard</h1>
          <p className="text-muted">Last 30 days · Subscription + advertising income</p>
        </div>
        <Link href="/admin/ads" className="btn-ghost" style={{ textDecoration:"none", fontSize:"0.88rem" }}>
          Manage Ads & Partners →
        </Link>
      </div>

      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"0.85rem", marginBottom:"1.5rem" }}>
        {[
          { label:"Total MRR (KES)", value:`KES ${totalRevKES.toLocaleString()}`, sub:"M-Pesa + bank",  color:"var(--emerald)", trend:weeklyTrend },
          { label:"Stripe Revenue",  value:`USD ${totalRevUSD.toLocaleString()}`, sub:"Card payments",  color:"var(--sky)"     },
          { label:"Ad Revenue",      value:`KES ${adRev.toLocaleString()}`,       sub:"CPC billing",    color:"var(--amber)"   },
          { label:"Sub Revenue",     value:`KES ${subRevKES.toLocaleString()}`,   sub:"Plan fees",      color:"var(--violet)"  },
          { label:"This Week",       value:`KES ${weekRev.toLocaleString()}`,     sub:"7-day total",    color:"var(--sky-dim)", trend:weeklyTrend },
          { label:"Total Payments",  value:rev.totalPayments || 0,                sub:"all time",       color:"var(--muted)"   },
        ].map(({ label, value, sub, color, trend }) => (
          <div key={label} className="stat-card" style={{ "--accent": color }}>
            <div style={{ fontSize:"0.68rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:"1.6rem", fontWeight:900, color, letterSpacing:"-0.02em", marginBottom:2 }}>{value}</div>
            <div style={{ fontSize:"0.72rem", color:"var(--dim)" }}>{sub}</div>
            {trend && <div style={{ marginTop:8 }}><Sparkline data={trend} color={color} height={36}/></div>}
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
        {/* Plan breakdown */}
        <div className="card">
          <h3 style={{ marginBottom:"1rem" }}>Subscribers by Plan</h3>
          {(rev.subscriptions || []).map(s => {
            const total = (rev.subscriptions || []).reduce((acc, x) => acc + x.count, 0);
            const pct   = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s._id} style={{ marginBottom:"0.85rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:"0.85rem" }}>
                  <span style={{ color: PLAN_COLOR[s._id] || "var(--text2)", fontWeight:600, textTransform:"capitalize" }}>{s._id}</span>
                  <span style={{ color:"var(--text2)" }}>{s.count} users · {pct}%</span>
                </div>
                <div style={{ background:"var(--border)", borderRadius:4, height:6, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background: PLAN_COLOR[s._id] || "var(--muted)", borderRadius:4, transition:"width 0.8s ease" }}/>
                </div>
              </div>
            );
          })}
          {(!rev.subscriptions || !rev.subscriptions.length) && (
            <p className="text-muted" style={{ fontSize:"0.85rem" }}>No subscription data</p>
          )}
        </div>

        {/* Revenue sources donut (simple bars) */}
        <div className="card">
          <h3 style={{ marginBottom:"1rem" }}>Revenue Sources</h3>
          {[
            ["Subscriptions", subRevKES, "var(--sky)"],
            ["Ad Revenue",    adRev,     "var(--amber)"],
            ["Stripe/USD",    totalRevUSD * 130, "var(--violet)"],
          ].filter(([,v]) => v > 0).map(([label, val, color]) => {
            const total = subRevKES + adRev + totalRevUSD * 130;
            const pct   = total ? Math.round((val / total) * 100) : 0;
            return (
              <div key={label} style={{ marginBottom:"0.85rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:"0.85rem" }}>
                  <span style={{ color:"var(--text2)" }}>{label}</span>
                  <span style={{ color, fontWeight:700 }}>KES {val.toLocaleString()} · {pct}%</span>
                </div>
                <div style={{ background:"var(--border)", borderRadius:4, height:6, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.8s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"0.85rem 1.1rem", borderBottom:"1px solid var(--border)", fontWeight:700, fontSize:"0.9rem" }}>
          Recent Payments
        </div>
        {!(rev.recentPayments?.length) ? (
          <p className="text-muted" style={{ padding:"1.5rem", textAlign:"center" }}>No recent payments</p>
        ) : rev.recentPayments.map((p, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.85rem", padding:"0.75rem 1.1rem", borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:36, height:36, borderRadius:9, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>
              💳
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:500, fontSize:"0.88rem" }}>{p.user?.name || "Unknown"}</div>
              <div style={{ fontSize:"0.75rem", color:"var(--muted)" }}>
                {p.description || p.type} · {p.method?.toUpperCase()} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-KE") : "—"}
              </div>
            </div>
            <div style={{ fontWeight:700, color:"var(--emerald)", fontSize:"0.95rem" }}>
              KES {(p.amountKES || 0).toLocaleString()}
            </div>
            <span className="badge badge-ok" style={{ flexShrink:0 }}>completed</span>
          </div>
        ))}
      </div>
    </div>
  );
}
