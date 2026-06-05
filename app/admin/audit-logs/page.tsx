"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

interface AuditLog {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

interface AuditStatistics {
  totalLogs: number;
  successLogs: number;
  failureLogs: number;
  successRate: string;
  logsByAction: Array<{ action: string; count: number }>;
  logsByResource: Array<{ resource: string; count: number }>;
  logsByUser: Array<{ userId: string; userName: string; userEmail: string; count: number }>;
}

export default function AdminAuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        api.get("/api/audit-logs"),
        api.get("/api/audit-logs/statistics"),
      ]);
      setLogs(logsData.logs);
      setStats(statsData);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function exportLogs() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/audit-logs/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      a.click();
    } catch (err: any) {
      alert("Failed to export logs: " + err.message);
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchFilter = !filter || 
      log.path.toLowerCase().includes(filter.toLowerCase()) ||
      log.userId?.email?.toLowerCase().includes(filter.toLowerCase()) ||
      log.userId?.name?.toLowerCase().includes(filter.toLowerCase());
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchFilter && matchAction;
  });

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop: "2rem" }}>Loading…</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>Audit Logs</h1>
          <p className="text-muted">{stats?.totalLogs || 0} total events</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search path, user, email…" style={{ maxWidth: 260 }} />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ width: "auto", fontSize: "0.85rem" }}>
            <option value="">All actions</option>
            <option value="read">Read</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <button onClick={exportLogs} className="btn-ghost" style={{ fontSize: "0.82rem", padding: "5px 14px", whiteSpace: "nowrap" }}>
            ↓ Export CSV
          </button>
          <button onClick={load} style={{ background: "var(--border)", border: "1px solid #334155", color: "var(--text2)", padding: "5px 14px", borderRadius: 8, fontSize: "0.82rem" }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Logs", value: stats.totalLogs, color: "var(--sky)" },
            { label: "Success", value: stats.successLogs, color: "var(--emerald)" },
            { label: "Failures", value: stats.failureLogs, color: "var(--rose)" },
            { label: "Success Rate", value: `${stats.successRate}%`, color: "var(--violet)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Top Actions</h3>
            {stats.logsByAction.map(({ action, count }) => (
              <div key={action} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span style={{ textTransform: "capitalize" }}>{action}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Top Resources</h3>
            {stats.logsByResource.map(({ resource, count }) => (
              <div key={resource} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
                <span style={{ textTransform: "capitalize" }}>{resource}</span>
                <span style={{ fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.9rem" }}>
          Recent Activity
        </div>
        {filteredLogs.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem", textAlign: "center" }}>No logs found.</p>
        ) : filteredLogs.map((log) => (
          <div key={log._id} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: log.success ? "rgba(52,211,153,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${log.success ? "rgba(52,211,153,0.2)" : "rgba(244,63,94,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
              {log.success ? "✓" : "✗"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {log.method} {log.path}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                {log.userId?.name || "System"} · {log.userId?.email || ""} · {log.action}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: log.success ? "var(--emerald)" : "var(--rose)" }}>
                {log.statusCode || "N/A"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--dim)" }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length > 0 && (
        <p style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
          Showing {filteredLogs.length} of {logs.length} logs
        </p>
      )}
    </div>
  );
}
