"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";

const LiveMap = dynamic(() => import("../../components/LiveMap"), { ssr: false });

interface KpiCardProps {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon: string;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:"0.7rem", color:"var(--muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{label}</div>
          <div style={{ fontSize:"1.9rem", fontWeight:900, color, lineHeight:1, letterSpacing:"-0.02em" }}>{value ?? "—"}</div>
          {sub && <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ width:40, height:40, borderRadius:10, background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>{icon}</div>
      </div>
    </div>
  );
}

interface Alert {
  _id: string;
  type: string;
  imei: string;
  narrative?: string;
  ts: string;
  read: boolean;
  aiUrgency?: string;
}

interface AlertFeedProps {
  alerts: Alert[];
  onMarkRead: () => void;
  onTriage: () => void;
  triageLoading: boolean;
}

// ── Alert Feed ────────────────────────────────────────────────────────────────
const A_COLOR: Record<string, string> = { blacklist_ping:"var(--rose)", sim_swap:"var(--amber)", location_jump:"var(--amber)", fraud_pattern:"var(--rose)", theft_report:"var(--rose)" };
const A_ICON: Record<string, string> = { blacklist_ping:"🚨", sim_swap:"🔄", location_jump:"⚡", fraud_pattern:"🕵️", theft_report:"📋" };
const A_LABEL: Record<string, string> = { blacklist_ping:"Blacklist Ping", sim_swap:"SIM Swap", location_jump:"Location Jump", fraud_pattern:"Fraud Pattern", theft_report:"Theft Report" };

function AlertFeed({ alerts, onMarkRead, onTriage, triageLoading }: AlertFeedProps) {
  const unread = alerts.filter(a => !a.read).length;
  return (
    <div className="card" style={{ display:"flex", flexDirection:"column", height:"100%", padding:0, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 1rem", borderBottom:"1px solid var(--border)" }}>
        <div style={{ fontWeight:700, fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          🔔 Live Alerts
          {unread > 0 && <span className="badge badge-danger">{unread} new</span>}
        </div>
        <div style={{ display:"flex", gap:"0.4rem" }}>
          <button onClick={onTriage} disabled={triageLoading}
            style={{ background:"var(--surface)", border:"1px solid var(--indigo-dim)", color:"var(--indigo)", borderRadius:6, padding:"3px 10px", fontSize:"0.72rem", cursor:"pointer", fontWeight:600 }}>
            {triageLoading ? "⟳ AI…" : "🤖 Triage"}
          </button>
          <button onClick={onMarkRead}
            style={{ background:"transparent", border:"1px solid var(--border2)", color:"var(--muted)", borderRadius:6, padding:"3px 10px", fontSize:"0.72rem", cursor:"pointer" }}>
            ✓ All read
          </button>
        </div>
      </div>
      {/* Feed */}
      <div style={{ overflowY:"auto", flex:1 }}>
        {alerts.length === 0 ? (
          <div style={{ padding:"2rem", textAlign:"center", color:"var(--muted)", fontSize:"0.85rem" }}>
            <div style={{ fontSize:"1.5rem", marginBottom:"0.5rem" }}>✅</div>
            All clear
          </div>
        ) : alerts.map(a => (
          <div key={a._id} style={{ display:"flex", gap:"0.75rem", padding:"0.65rem 1rem", borderBottom:"1px solid var(--border)", opacity:a.read ? 0.5 : 1, transition:"opacity 0.2s" }}>
            <div style={{ flexShrink:0, width:30, height:30, borderRadius:8, background:`${A_COLOR[a.type] || "var(--muted)"}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem" }}>
              {A_ICON[a.type]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"0.82rem", fontWeight:600, color:a.read ? "var(--muted)" : "var(--text)", display:"flex", alignItems:"center", gap:5, marginBottom:1 }}>
                {A_LABEL[a.type]}
                {!a.read && <span style={{ width:5, height:5, borderRadius:"50%", background:A_COLOR[a.type], display:"inline-block", flexShrink:0 }} />}
                {a.aiUrgency && (
                  <span className={`badge ${a.aiUrgency === "critical" ? "badge-danger" : "badge-warn"}`} style={{ fontSize:"0.6rem" }}>
                    {a.aiUrgency}
                  </span>
                )}
              </div>
              <div style={{ fontFamily:"var(--mono)", fontSize:"0.72rem", color:"var(--muted)" }}>IMEI {a.imei}</div>
              {a.narrative && (
                <div style={{ fontSize:"0.75rem", color:"var(--text2)", marginTop:3, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                  {a.narrative}
                </div>
              )}
              <div style={{ fontSize:"0.68rem", color:"var(--dim)", marginTop:3 }}>
                {new Date(a.ts).toLocaleString("en-KE")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DeviceStats {
  total?: number;
  stolen?: number;
  recovered?: number;
  blacklisted?: number;
  recentPings?: number;
  openReports?: number;
}

interface DeviceStatusBarProps {
  stats: DeviceStats;
}

// ── Device Status Bar ─────────────────────────────────────────────────────────
function DeviceStatusBar({ stats }: DeviceStatusBarProps) {
  if (!stats) return null;
  const total  = stats.total || 1;
  const active = total - (stats.stolen || 0) - (stats.recovered || 0) - (stats.blacklisted || 0);
  const items  = [
    { label:"Active",      count:active,                  color:"var(--emerald)" },
    { label:"Stolen",      count:stats.stolen || 0,       color:"var(--rose)"    },
    { label:"Recovered",   count:stats.recovered || 0,    color:"var(--sky)"     },
    { label:"Blacklisted", count:stats.blacklisted || 0,  color:"var(--amber)"   },
  ];
  return (
    <div className="card">
      <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>Device Status</div>
      <div style={{ display:"flex", borderRadius:6, overflow:"hidden", height:8, marginBottom:"0.85rem", gap:1 }}>
        {items.map(it => (
          <div key={it.label} style={{ width:`${(it.count / total) * 100}%`, background:it.color, transition:"width 0.6s ease", borderRadius:4 }} />
        ))}
      </div>
      <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap" }}>
        {items.map(it => (
          <div key={it.label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.78rem" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:it.color, display:"inline-block" }} />
            <span style={{ color:"var(--muted)" }}>{it.label}</span>
            <strong style={{ color:"var(--text)", fontWeight:700 }}>{it.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RevenueData {
  monthlyRevKES?: number;
  monthlyRevUSD?: number;
  adRevKES?: number;
  weeklyRevKES?: number;
  subscriptions?: Array<{ _id: string; count: number }>;
  recentPayments?: Array<{ user?: { name: string }; description?: string; type: string; amountKES?: number }>;
}

interface RevenueSnapshotProps {
  revenue: RevenueData;
}

// ── Revenue Snapshot ──────────────────────────────────────────────────────────
function RevenueSnapshot({ revenue }: RevenueSnapshotProps) {
  if (!revenue) return null;
  const planColors: Record<string, string> = { free:"var(--muted)", pro:"var(--sky)", business:"var(--violet)", enterprise:"var(--amber)" };
  return (
    <div className="card">
      <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.85rem", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>Revenue · 30 days</div>
      <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", marginBottom:"1rem" }}>
        {([
          [revenue.monthlyRevKES, "KES", "Total", "var(--emerald)"],
          [revenue.monthlyRevUSD, "USD", "Stripe", "var(--sky)"],
          [revenue.adRevKES,      "KES", "Ads",    "var(--amber)"],
          [revenue.weeklyRevKES,  "KES", "Week",   "var(--violet)"],
        ] as const).filter(([v]) => v).map(([v, currency, label, color]) => (
          <div key={label as string}>
            <div style={{ fontSize:"1.4rem", fontWeight:800, color, letterSpacing:"-0.02em" }}>
              {currency} {(v || 0).toLocaleString()}
            </div>
            <div style={{ fontSize:"0.7rem", color:"var(--muted)" }}>{label as string}</div>
          </div>
        ))}
      </div>
      {/* Plan breakdown */}
      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom: revenue.recentPayments?.length ? "0.85rem" : 0 }}>
        {(revenue.subscriptions || []).map(s => (
          <div key={s._id} style={{ background:"var(--surface)", borderRadius:6, padding:"3px 10px", fontSize:"0.72rem", border:"1px solid var(--border)" }}>
            <span style={{ color:planColors[s._id] || "var(--text2)", fontWeight:700, textTransform:"capitalize" }}>{s._id}</span>
            <span style={{ color:"var(--muted)", marginLeft:4 }}>{s.count}</span>
          </div>
        ))}
      </div>
      {/* Recent payments */}
      {revenue.recentPayments?.length && revenue.recentPayments.length > 0 && (
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:"0.65rem" }}>
          <div style={{ fontSize:"0.68rem", color:"var(--muted)", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"0.4rem" }}>Recent</div>
          {revenue.recentPayments.slice(0,4).map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", fontSize:"0.78rem", borderBottom:"1px solid var(--border)" }}>
              <span style={{ color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>
                {p.user?.name || "—"} · {p.description || p.type}
              </span>
              <span style={{ color:"var(--emerald)", fontWeight:700, flexShrink:0 }}>KES {(p.amountKES || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats,         setStats]         = useState<DeviceStats | null>(null);
  const [alerts,        setAlerts]        = useState<Alert[]>([]);
  const [revenue,       setRevenue]       = useState<RevenueData | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [tab,           setTab]           = useState("overview");
  const [lastRefresh,   setLastRefresh]   = useState<Date | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("simtrace_token") : null;

  const load = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    const [s, a, r] = await Promise.allSettled([
      api.deviceStats(),
      api.alerts({ limit: "40" }),
      api.get("/api/billing/revenue"),
    ]);
    if (s.status === "fulfilled") setStats(s.value);
    if (a.status === "fulfilled") setAlerts(a.value.alerts || []);
    if (r.status === "fulfilled") setRevenue(r.value);
    setLastRefresh(new Date());
  }, [user]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [user, authLoading, load]);

  async function runTriage() {
    setTriageLoading(true);
    try {
      const { triage } = await api.triageAlerts(40);
      setAlerts(prev => prev.map(a => {
        const t = triage?.find(x => x.id === a._id);
        return t ? { ...a, aiUrgency: t.urgency } : a;
      }));
    } catch { /**/ }
    finally { setTriageLoading(false); }
  }

  async function markAllRead() {
    await api.markAllRead();
    setAlerts(a => a.map(x => ({ ...x, read: true })));
  }

  if (authLoading || !user) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", gap:"0.75rem", color:"var(--muted)" }}>
      <SimTraceLogo size={32} showText={false} />
      <span>Loading…</span>
    </div>
  );

  const tabs = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"map",      icon:"🗺️", label:"Live Map" },
    { id:"alerts",   icon:"🔔", label:"Alerts"   },
    { id:"revenue",  icon:"💰", label:"Revenue"  },
  ];

  const QUICK_LINKS = [
    { icon:"🔍", label:"IMEI Lookup",   href:"/imei",          color:"var(--sky)"     },
    { icon:"📱", label:"All Devices",   href:"/admin/devices", color:"var(--indigo)"  },
    { icon:"💰", label:"Revenue & Ads", href:"/admin/ads",     color:"var(--emerald)" },
    { icon:"🤝", label:"Partners",      href:"/telecom-portal",color:"var(--amber)"   },
    { icon:"🤖", label:"AI Assistant",  href:"/ai-assistant",  color:"var(--violet)"  },
    { icon:"👥", label:"Users",         href:"/admin/users",   color:"var(--sky)"     },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:3 }}>
            <h1>Command Centre</h1>
            <span style={{ background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.2)", color:"var(--emerald)", fontSize:"0.65rem", padding:"2px 10px", borderRadius:20, fontWeight:700, letterSpacing:"0.06em" }}>
              ● LIVE
            </span>
          </div>
          <p style={{ color:"var(--muted)", fontSize:"0.8rem", margin:0 }}>
            {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString("en-KE")} · ` : ""}Auto-refreshes every 30s
          </p>
        </div>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background:tab===t.id ? "var(--surface)" : "transparent", border:`1px solid ${tab===t.id ? "var(--indigo-dim)" : "var(--border)"}`, color:tab===t.id ? "var(--indigo)" : "var(--muted)", borderRadius:8, padding:"5px 14px", fontSize:"0.82rem", cursor:"pointer", fontWeight:tab===t.id ? 700 : 400, transition:"all 0.15s" }}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={load} style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)", borderRadius:8, padding:"5px 12px", fontSize:"0.82rem", cursor:"pointer" }}>
            ↻
          </button>
        </div>
      </div>

      {/* ── KPI Row — always visible ── */}
      <div className="grid-4" style={{ marginBottom:"1.5rem" }}>
        <KpiCard label="Total Devices"  value={stats?.total || 0}                          icon="📱" color="var(--sky)"     sub="registered" />
        <KpiCard label="Stolen"         value={stats?.stolen || 0}                         icon="🚨" color="var(--rose)"    sub="active cases" />
        <KpiCard label="Recovered"      value={stats?.recovered || 0}                      icon="✅" color="var(--emerald)" sub="success" />
        <KpiCard label="Pings Today"    value={stats?.recentPings || 0}                    icon="📡" color="var(--sky-dim)" sub="location events" />
        <KpiCard label="Open Reports"   value={stats?.openReports || 0}                    icon="📋" color="var(--amber)"   sub="awaiting action" />
        <KpiCard label="Unread Alerts"  value={alerts.filter(a=>!a.read).length}      icon="🔔" color="var(--violet)"  />
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:"1rem", alignItems:"start" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <DeviceStatusBar stats={stats} />
            <RevenueSnapshot revenue={revenue} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.6rem" }}>
              {QUICK_LINKS.map(l => (
                <Link key={l.label} href={l.href}
                  style={{ background:"var(--bg2)", border:`1px solid ${l.color}22`, borderRadius:10, padding:"0.85rem", textDecoration:"none", display:"flex", flexDirection:"column", gap:"0.4rem", transition:"border-color 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = l.color + "55"}
                  onMouseOut={e  => e.currentTarget.style.borderColor = l.color + "22"}>
                  <span style={{ fontSize:"1.3rem" }}>{l.icon}</span>
                  <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text2)" }}>{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div style={{ height:520 }}>
            <AlertFeed alerts={alerts} onMarkRead={markAllRead} onTriage={runTriage} triageLoading={triageLoading} />
          </div>
        </div>
      )}

      {/* ── Map tab ── */}
      {tab === "map" && (
        <div>
          <p style={{ color:"var(--muted)", fontSize:"0.82rem", marginBottom:"0.75rem" }}>
            Real-time device locations · 🔴 Stolen/blacklisted · 🟢 Active
          </p>
          {token && <LiveMap token={token} showAll style={{ height:560 }} />}
        </div>
      )}

      {/* ── Alerts tab ── */}
      {tab === "alerts" && (
        <div style={{ height:"72vh" }}>
          <AlertFeed alerts={alerts} onMarkRead={markAllRead} onTriage={runTriage} triageLoading={triageLoading} />
        </div>
      )}

      {/* ── Revenue tab ── */}
      {tab === "revenue" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
          <RevenueSnapshot revenue={revenue} />
          <div className="card">
            <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.85rem", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>Quick Actions</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
              {[
                ["Full Revenue Report",   "/admin/ads"],
                ["Manage Ad Campaigns",   "/admin/ads"],
                ["Partner Management",    "/telecom-portal"],
                ["User Subscriptions",    "/admin/users"],
              ].map(([l,h]) => (
                <Link key={l} href={h}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.65rem 0.75rem", borderRadius:"var(--r)", color:"var(--text2)", textDecoration:"none", fontSize:"0.88rem", transition:"background 0.1s" }}
                  onMouseOver={e => e.currentTarget.style.background="var(--surface)"}
                  onMouseOut={e  => e.currentTarget.style.background="transparent"}>
                  {l} <span style={{ color:"var(--sky)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
