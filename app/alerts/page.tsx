"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  blacklist_ping: { label:"Blacklist Ping",      icon:"🚨", color:"var(--rose)"    },
  sim_swap:       { label:"SIM Swap Detected",   icon:"🔄", color:"var(--amber)"   },
  location_jump:  { label:"Impossible Location", icon:"⚡", color:"var(--amber)"   },
  fraud_pattern:  { label:"Fraud Pattern",       icon:"🕵️", color:"var(--rose)"    },
  theft_report:   { label:"Theft Report",        icon:"📋", color:"var(--rose)"    },
};

const FILTER_TYPES = Object.entries(TYPE_META).map(([k,v]) => ({ value:k, label:v.label }));

interface Alert {
  _id: string;
  type: string;
  imei: string;
  narrative?: string;
  ts: string;
  read: boolean;
  aiUrgency?: string;
  payload?: any;
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast  = useToast();

  const [alerts,     setAlerts]     = useState<Alert[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) load();
  }, [user, authLoading, page, typeFilter, unreadOnly]);

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (typeFilter) params.type   = typeFilter;
      if (unreadOnly) params.unread = "true";
      const res = await api.alerts(params);
      setAlerts(res.alerts || []);
      setTotal(res.total  || 0);
      setPages(res.pages  || 1);
    } catch { /**/ }
    finally { setLoading(false); }
  }

  async function markRead(id: string) {
    await api.markRead(id);
    setAlerts(a => a.map(x => x._id === id ? { ...x, read: true } : x));
  }

  async function markAllRead() {
    await api.markAllRead();
    setAlerts(a => a.map(x => ({ ...x, read: true })));
    toast?.add("All alerts marked as read", "success");
  }

  async function explain(alert: Alert) {
    if (explanations[alert._id]) return; // already fetched
    setExplaining(alert._id);
    try {
      const { explanation } = await api.explainAlert(alert._id);
      setExplanations(e => ({ ...e, [alert._id]: explanation }));
    } catch (err: any) {
      toast?.add("Could not generate explanation: " + err.message, "danger");
    } finally { setExplaining(null); }
  }

  const unreadCount = alerts.filter(a => !a.read).length;

  if (authLoading) return (
    <div style={{ padding:"3rem", textAlign:"center", color:"var(--muted)" }}>Loading…</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:3 }}>
            <h1>Security Alerts</h1>
            {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} unread</span>}
          </div>
          <p className="text-muted">{total.toLocaleString()} total alert{total !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ width:"auto", fontSize:"0.85rem", padding:"0.45rem 0.75rem" }}>
            <option value="">All types</option>
            {FILTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label style={{ display:"flex", alignItems:"center", gap:"0.4rem", cursor:"pointer", fontSize:"0.85rem", color:"var(--text2)", userSelect:"none", whiteSpace:"nowrap" }}>
            <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }} />
            Unread only
          </label>
          <button className="btn-ghost" style={{ fontSize:"0.82rem", padding:"5px 14px" }} onClick={markAllRead}>
            ✓ Mark all read
          </button>
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height:88, opacity:0.4, animation:"shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3.5rem 2rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🔕</div>
          <h3 style={{ marginBottom:"0.4rem" }}>All clear</h3>
          <p className="text-muted">No security alerts matching this filter.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {alerts.map(a => {
            const meta = TYPE_META[a.type] || { label:a.type, icon:"⚠️", color:"var(--muted)" };
            return (
              <div key={a._id} className="card" style={{
                borderLeft:`3px solid ${meta.color}`,
                opacity: a.read ? 0.6 : 1,
                transition:"opacity 0.2s",
                padding:"0.9rem 1.1rem",
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"0.85rem" }}>
                  {/* Icon */}
                  <div style={{ width:38, height:38, borderRadius:10, background:`${meta.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0 }}>
                    {meta.icon}
                  </div>

                  {/* Body */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:3 }}>
                      <span style={{ fontWeight:700, fontSize:"0.92rem" }}>{meta.label}</span>
                      {!a.read && (
                        <span style={{ width:6, height:6, borderRadius:"50%", background:meta.color, display:"inline-block", flexShrink:0 }} />
                      )}
                      {a.aiUrgency && (
                        <span className={`badge ${a.aiUrgency === "critical" ? "badge-danger" : a.aiUrgency === "high" ? "badge-warn" : "badge-info"}`} style={{ fontSize:"0.65rem" }}>
                          AI: {a.aiUrgency.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div style={{ fontFamily:"var(--mono)", fontSize:"0.78rem", color:"var(--muted)", marginBottom:4 }}>
                      IMEI {a.imei}
                    </div>

                    {/* Payload summary */}
                    {a.payload && (
                      <div style={{ fontSize:"0.8rem", color:"var(--muted)", marginBottom:4 }}>
                        {a.type === "sim_swap"      && `SIM: …${a.payload.oldSim?.slice(-6)} → …${a.payload.newSim?.slice(-6)}`}
                        {a.type === "location_jump" && `Speed: ${a.payload.kmh?.toFixed(0)} km/h — impossible movement`}
                        {a.type === "fraud_pattern" && `Carriers: ${a.payload.operators?.join(" → ")}`}
                        {a.type === "blacklist_ping"&& a.payload.lat && `Location: ${a.payload.lat?.toFixed(4)}, ${a.payload.lng?.toFixed(4)}`}
                      </div>
                    )}

                    {/* Narrative */}
                    {a.narrative && (
                      <div style={{ fontSize:"0.82rem", color:"var(--text2)", background:"var(--surface)", borderRadius:7, padding:"0.45rem 0.7rem", marginBottom:4, lineHeight:1.5 }}>
                        {a.narrative}
                      </div>
                    )}

                    {/* AI Explanation */}
                    {explanations[a._id] && (
                      <div style={{ fontSize:"0.85rem", color:"var(--sky)", background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:8, padding:"0.55rem 0.8rem", marginTop:5, lineHeight:1.6 }}>
                        🤖 {explanations[a._id]}
                      </div>
                    )}

                    <div style={{ fontSize:"0.7rem", color:"var(--dim)", marginTop:5 }}>
                      {new Date(a.ts).toLocaleString("en-KE", { dateStyle:"medium", timeStyle:"short" })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", flexShrink:0 }}>
                    <button onClick={() => explain(a)} disabled={explaining === a._id || !!explanations[a._id]}
                      style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", color:"var(--sky)", borderRadius:7, padding:"4px 10px", fontSize:"0.75rem", cursor:"pointer", whiteSpace:"nowrap" }}>
                      {explaining === a._id ? "⟳" : explanations[a._id] ? "✓ Explained" : "🤖 Explain"}
                    </button>
                    {!a.read && (
                      <button onClick={() => markRead(a._id)} className="btn-ghost" style={{ fontSize:"0.75rem", padding:"4px 10px" }}>
                        Mark read
                      </button>
                    )}
                    <Link href={`/imei?q=${a.imei}`} style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--sky)" }}>
                      Check →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display:"flex", gap:"0.5rem", justifyContent:"center", alignItems:"center", marginTop:"1.75rem" }}>
          <button className="btn-ghost" style={{ padding:"5px 16px", fontSize:"0.85rem" }} disabled={page === 1} onClick={() => setPage(p => p-1)}>
            ← Prev
          </button>
          <span style={{ color:"var(--muted)", fontSize:"0.88rem", padding:"0 0.5rem" }}>
            {page} / {pages}
          </span>
          <button className="btn-ghost" style={{ padding:"5px 16px", fontSize:"0.85rem" }} disabled={page === pages} onClick={() => setPage(p => p+1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
