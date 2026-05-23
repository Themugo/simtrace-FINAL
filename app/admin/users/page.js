"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") load();
  }, [user, authLoading]);

  async function load() {
    try {
      const data = await api.get("/api/admin/users");
      setUsers(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function setRole(id, role) {
    await api.patch(`/api/admin/users/${id}/role`, { role });
    setUsers(u => u.map(x => x._id === id ? { ...x, role } : x));
  }

  const ROLE_COLOR = { admin: "var(--rose)", telecom: "var(--sky)", law_enforcement: "var(--amber)", user: "var(--muted)" };
  const PLAN_COLOR = { free: "var(--muted)", pro: "var(--sky)", business: "var(--violet)", enterprise: "var(--amber)" };

  function exportCSV() {
    const header = "Name,Email,Phone,Role,Plan,Devices,Joined";
    const rows   = filtered.map(u => [
      u.name, u.email, u.phone||"", u.role,
      u.subscription?.plan||"free", u.deviceCount||0,
      new Date(u.createdAt).toLocaleDateString()
    ].join(","));
    const blob = new Blob([header+"\n"+rows.join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `simtrace-users-${Date.now()}.csv`; a.click();
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>User Management</h1>
          <p className="text-muted">{users.length} registered users</p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" style={{ maxWidth: 260 }} />
          <button onClick={exportCSV} className="btn-ghost" style={{ fontSize:"0.82rem", padding:"5px 14px", whiteSpace:"nowrap" }}>
            ↓ CSV ({filtered.length})
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 && <p className="text-muted">No users found.</p>}
        {filtered.map(u => (
          <div key={u._id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--sky),var(--indigo))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "#fff", flexShrink: 0 }}>
              {u.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{u.email}</div>
              {u.phone && <div style={{ fontSize: "0.72rem", color: "var(--dim)" }}>{u.phone}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", background: ROLE_COLOR[u.role] + "22", color: ROLE_COLOR[u.role], padding: "2px 10px", borderRadius: 20, fontWeight: 700, textTransform: "capitalize" }}>
                {u.role?.replace(/_/g, " ")}
              </span>
              {u.subscription && (
                <span style={{ fontSize: "0.72rem", background: PLAN_COLOR[u.subscription.plan] + "22", color: PLAN_COLOR[u.subscription.plan], padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>
                  {u.subscription.plan}
                </span>
              )}
              {u.deviceCount != null && (
                <span style={{ fontSize: "0.72rem", color: "var(--dim)" }}>📱 {u.deviceCount} devices</span>
              )}
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{new Date(u.createdAt).toLocaleDateString()}</div>

              {u.role !== "admin" && (
                <select
                  value={u.role}
                  onChange={e => setRole(u._id, e.target.value)}
                  style={{ fontSize: "0.75rem", padding: "3px 8px", width: "auto", background: "var(--bg)", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: 6 }}
                >
                  <option value="user">user</option>
                  <option value="telecom">telecom</option>
                  <option value="law_enforcement">law_enforcement</option>
                  <option value="admin">admin</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
