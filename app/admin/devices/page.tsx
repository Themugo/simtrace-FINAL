"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

interface Device {
  _id: string;
  imei: string;
  make?: string;
  model?: string;
  status: string;
  owner?: {
    name?: string;
    email: string;
  };
  lastSeen?: string;
}

interface DeviceStats {
  total?: number;
  stolen?: number;
  blacklisted?: number;
  recovered?: number;
}

export default function AdminDevicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [stats,   setStats]   = useState<DeviceStats>({});

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    try {
      const [devs, st] = await Promise.all([
        api.myDevices(),
        api.deviceStats(),
      ]);
      setDevices(devs);
      setStats(st);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function setStatus(imei: string, status: string) {
    try {
      await api.updateStatus(imei, status);
      setDevices(d => d.map(x => x.imei === imei ? { ...x, status } : x));
    } catch (err: any) { alert(err.message); }
  }

  const STATUS_COLOR: Record<string, string> = { active: "var(--emerald)", stolen: "var(--rose)", blacklisted: "var(--amber)", recovered: "var(--sky)" };
  const STATUS_ICON: Record<string, string> = { active: "✅", stolen: "🚨", blacklisted: "⛔", recovered: "✔️" };

  const filtered = devices.filter(d => {
    const matchFilter = filter === "all" || d.status === filter;
    const matchSearch = !search
      || d.imei?.includes(search)
      || (d.make + " " + d.model).toLowerCase().includes(search.toLowerCase())
      || d.owner?.name?.toLowerCase().includes(search.toLowerCase())
      || d.owner?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (authLoading || loading) return <p className="text-muted">Loading…</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>All Devices</h1>
          <p className="text-muted">
            {stats.total || devices.length} registered · {" "}
            <span style={{ color: "var(--rose)" }}>{stats.stolen || 0} stolen</span> · {" "}
            <span style={{ color: "var(--amber)" }}>{stats.blacklisted || 0} blacklisted</span> · {" "}
            <span style={{ color: "var(--emerald)" }}>{stats.recovered || 0} recovered</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="IMEI, device, or owner…" style={{ maxWidth: 240 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "auto", fontSize: "0.85rem" }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="stolen">Stolen</option>
            <option value="blacklisted">Blacklisted</option>
            <option value="recovered">Recovered</option>
          </select>
          <button onClick={load} style={{ background: "var(--border)", border: "1px solid #334155", color: "var(--text2)", padding: "5px 14px", borderRadius: 8, fontSize: "0.82rem" }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Status quick-filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {["all","active","stolen","blacklisted","recovered"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ background: filter === s ? STATUS_COLOR[s] || "var(--sky)" : "var(--bg2)", border: `1px solid ${STATUS_COLOR[s] || "var(--border2)"}33`, color: filter === s ? "#fff" : "var(--text2)", borderRadius: 20, padding: "3px 14px", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize", cursor: "pointer" }}>
            {STATUS_ICON[s] || "📋"} {s} {s !== "all" ? `(${devices.filter(d=>d.status===s).length})` : `(${devices.length})`}
          </button>
        ))}
      </div>

      {/* Device list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 && <p className="text-muted" style={{ padding: "2rem 0", textAlign: "center" }}>No devices match this filter.</p>}
        {filtered.map(d => (
          <div key={d._id} className="card"
            style={{ borderLeft: `3px solid ${STATUS_COLOR[d.status] || "var(--muted)"}`, display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", padding: "0.85rem 1.1rem" }}>

            <div style={{ width: 36, height: 36, borderRadius: 8, background: STATUS_COLOR[d.status] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
              {STATUS_ICON[d.status] || "📱"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{d.make || "Unknown"} {d.model || ""}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--dim)" }}>{d.imei}</div>
              {d.owner && (
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  👤 {d.owner.name || "?"} · {d.owner.email}
                </div>
              )}
              {d.lastSeen && (
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
                  Last ping: {new Date(d.lastSeen).toLocaleString("en-KE")}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", background: STATUS_COLOR[d.status] + "22", color: STATUS_COLOR[d.status], padding: "2px 10px", borderRadius: 20, fontWeight: 700, textTransform: "uppercase" }}>
                {d.status}
              </span>

              <select value={d.status} onChange={e => setStatus(d.imei, e.target.value)}
                style={{ fontSize: "0.75rem", padding: "4px 8px", width: "auto", background: "var(--bg)", border: "1px solid #1e2d45", color: "var(--text2)", borderRadius: 6 }}>
                {["active","stolen","blacklisted","recovered"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <a href={`/imei?q=${d.imei}`} style={{ fontSize: "0.75rem", color: "var(--sky)", textDecoration: "none" }}>
                Check →
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <p style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
          Showing {filtered.length} of {devices.length} devices
        </p>
      )}
    </div>
  );
}
