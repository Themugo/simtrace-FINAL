"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const STATUS_META: Record<string, { color: string; icon: string; label: string }> = {
  open:          { color:"var(--rose)",    icon:"🚨", label:"Open"          },
  investigating: { color:"var(--amber)",   icon:"🔍", label:"Investigating" },
  recovered:     { color:"var(--emerald)", icon:"✅", label:"Recovered"     },
  closed:        { color:"var(--muted)",   icon:"📁", label:"Closed"        },
};

interface Report {
  _id: string;
  imei: string;
  status: string;
  description: string;
  policeRef?: string;
  createdAt: string;
  device?: {
    _id: string;
    make?: string;
    model?: string;
  };
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports]  = useState<Report[]>([]);
  const [total,   setTotal]    = useState(0);
  const [pages,   setPages]    = useState(1);
  const [page,    setPage]     = useState(1);
  const [filter,  setFilter]   = useState("all");
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) load();
  }, [user, authLoading, filter, page]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/api/imei/my-reports?page=${page}&limit=20${filter !== "all" ? `&status=${filter}` : ""}`);
      setReports(res.reports || []);
      setTotal(res.total   || 0);
      setPages(res.pages   || 1);
    } catch { setReports([]); }
    finally { setLoading(false); }
  }

  const counts = {
    open:          reports.filter(r => r.status === "open").length,
    investigating: reports.filter(r => r.status === "investigating").length,
    recovered:     reports.filter(r => r.status === "recovered").length,
  };

  if (authLoading) return <div style={{ padding:"3rem", color:"var(--muted)", textAlign:"center" }}>Loading…</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem", marginBottom:"1.5rem" }}>
        <div>
          <h1 style={{ marginBottom:"0.15rem" }}>Theft Reports</h1>
          <p className="text-muted">{total} report{total !== 1 ? "s" : ""} across your devices</p>
        </div>
        <Link href="/report" className="btn-primary" style={{ textDecoration:"none" }}>
          + New Report
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid-3" style={{ marginBottom:"1.25rem" }}>
        {[
          ["Open",          counts.open,          "var(--rose)"   ],
          ["Investigating", counts.investigating,  "var(--amber)"  ],
          ["Recovered",     counts.recovered,      "var(--emerald)"],
        ].map(([l,v,c]) => (
          <div key={l} className="stat-card" style={{ "--accent":c, textAlign:"center", cursor:"pointer" }}
            onClick={() => { setFilter(l.toLowerCase()); setPage(1); }}>
            <div style={{ fontSize:"2rem", fontWeight:900, color:c }}>{v}</div>
            <div className="text-muted" style={{ fontSize:"0.82rem" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"1rem" }}>
        {["all","open","investigating","recovered","closed"].map(s => {
          const meta = STATUS_META[s];
          return (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              style={{ background:filter===s ? (meta?.color||"var(--sky)")+"18" : "var(--bg2)", border:`1px solid ${filter===s ? (meta?.color||"var(--sky)")+"44" : "var(--border)"}`, color:filter===s ? (meta?.color||"var(--sky)") : "var(--muted)", borderRadius:20, padding:"4px 14px", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
              {meta?.icon || "📋"} {s} {s !== "all" && total > 0 ? `(${reports.filter(r=>r.status===s).length})` : ""}
            </button>
          );
        })}
      </div>

      {/* Reports list */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ height:100, opacity:0.4, animation:"shimmer 1.5s infinite" }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📋</div>
          <h3 style={{ marginBottom:"0.4rem" }}>{filter === "all" ? "No theft reports" : `No ${filter} reports`}</h3>
          <p className="text-muted" style={{ marginBottom:"1.25rem" }}>
            {filter === "all" ? "You haven't filed any theft reports yet." : `No reports with status "${filter}".`}
          </p>
          {filter === "all" && (
            <Link href="/report" className="btn-primary" style={{ textDecoration:"none", display:"inline-block" }}>
              File a Report
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {reports.map(r => {
            const meta = STATUS_META[r.status] || STATUS_META.open;
            return (
              <div key={r._id} className="card" style={{ borderLeft:`3px solid ${meta.color}` }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"0.75rem" }}>
                  <div style={{ flex:1 }}>
                    {/* Device + status */}
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap", marginBottom:"0.4rem" }}>
                      {r.device && (
                        <Link href={`/devices/${r.device._id}`} style={{ fontWeight:700, color:"var(--text)", textDecoration:"none" }}>
                          {r.device.make || "?"} {r.device.model || "Unknown"}
                        </Link>
                      )}
                      <span style={{ fontFamily:"var(--mono)", fontSize:"0.76rem", color:"var(--dim)" }}>
                        {r.imei}
                      </span>
                      <span style={{ background:`${meta.color}18`, color:meta.color, padding:"2px 9px", borderRadius:20, fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase" }}>
                        {meta.icon} {r.status}
                      </span>
                    </div>

                    <p style={{ color:"var(--text2)", fontSize:"0.88rem", margin:"0 0 0.4rem", lineHeight:1.6 }}>
                      {r.description}
                    </p>

                    <div style={{ display:"flex", gap:"1rem", fontSize:"0.75rem", color:"var(--dim)", flexWrap:"wrap" }}>
                      {r.policeRef && (
                        <span>🚔 Ref: <strong style={{ color:"var(--text2)", fontFamily:"var(--mono)" }}>{r.policeRef}</strong></span>
                      )}
                      <span>📅 {new Date(r.createdAt).toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" })}</span>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:"0.5rem", flexShrink:0, alignItems:"flex-start" }}>
                    <Link href={`/imei?q=${r.imei}`} style={{ fontSize:"0.8rem", color:"var(--sky)", whiteSpace:"nowrap" }}>
                      Track →
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
        <div style={{ display:"flex", gap:"0.5rem", justifyContent:"center", alignItems:"center", marginTop:"1.5rem" }}>
          <button className="btn-ghost" style={{ padding:"5px 16px" }} disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span className="text-muted" style={{ fontSize:"0.88rem" }}>{page} / {pages}</span>
          <button className="btn-ghost" style={{ padding:"5px 16px" }} disabled={page === pages} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
