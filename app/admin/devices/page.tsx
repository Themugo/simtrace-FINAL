"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { Modal } from "../../../components/ui/Modal";

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

  // System Admin Device Fee State
  const [extraDeviceFeeUSD, setExtraDeviceFeeUSD] = useState("2.00");
  const [extraDeviceFeeKES, setExtraDeviceFeeKES] = useState("260");
  const [feeSuccessMsg, setFeeSuccessMsg] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const usd = parseFloat(extraDeviceFeeUSD) || 2.0;
      const kes = parseFloat(extraDeviceFeeKES) || 260;
      await api.post('/api/admin/config/device-fee', {
        additionalDeviceMonthlyFeeUSD: usd,
        additionalDeviceMonthlyFeeKES: kes,
      });
      setFeeSuccessMsg(`System Admin Fee updated successfully! Additional device fee set to $${usd.toFixed(2)} USD (KES ${kes}) per month.`);
      setTimeout(() => setFeeSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to update device fee configuration");
    }
  };

  const handleDeleteFee = async () => {
    try {
      await api.del('/api/admin/config/device-fee');
      setExtraDeviceFeeUSD("0.00");
      setExtraDeviceFeeKES("0");
      setFeeSuccessMsg("Device fee configuration deleted successfully.");
      setIsDeleteModalOpen(false);
      setTimeout(() => setFeeSuccessMsg(""), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to delete device fee configuration");
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) { router.push("/login"); return; }
    if (user?.role === "admin") load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    try {
      const [devs, st, feeConfig] = await Promise.all([
        api.myDevices().catch(() => []),
        api.deviceStats().catch(() => ({})),
        api.get('/api/admin/config/device-fee').catch(() => null),
      ]);
      setDevices(devs);
      setStats(st);
      if (feeConfig?.additionalDeviceMonthlyFeeUSD !== undefined) {
        setExtraDeviceFeeUSD(String(feeConfig.additionalDeviceMonthlyFeeUSD));
      }
      if (feeConfig?.additionalDeviceMonthlyFeeKES !== undefined) {
        setExtraDeviceFeeKES(String(feeConfig.additionalDeviceMonthlyFeeKES));
      }
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
      {/* System Admin Device Quota & Additional Fee Configuration */}
      <div id="device-fee-config" className="card" style={{ marginBottom: "1.5rem", borderColor: "var(--sky)44", background: "linear-gradient(135deg, rgba(14,165,233,0.05), rgba(99,102,241,0.05))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              ⚙️ System Admin Device Quota & Fee Control
            </h2>
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
              Rule: Every user gets <strong>1 free device slot</strong>. Additional devices require a monthly fee set by System Admin.
            </p>
          </div>
          <span style={{ background: "var(--emerald)22", color: "var(--emerald)", padding: "3px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, border: "1px solid var(--emerald)44" }}>
            POLICY ACTIVE: 1 FREE DEVICE PER USER
          </span>
        </div>

        <form onSubmit={handleUpdateFee} style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="device-fee-input" className="label" style={{ fontSize: "0.78rem" }}>Additional Device Monthly Fee (USD)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: 8, color: "var(--dim)" }}>$</span>
              <input
                id="device-fee-input"
                name="deviceFeeUSD"
                type="number"
                step="0.5"
                min="0"
                value={extraDeviceFeeUSD}
                onChange={(e) => {
                  setExtraDeviceFeeUSD(e.target.value);
                  const usd = parseFloat(e.target.value) || 0;
                  setExtraDeviceFeeKES(Math.round(usd * 130).toString());
                }}
                style={{ paddingLeft: 24, fontSize: "0.88rem" }}
                placeholder="2.00"
                required
              />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 160 }}>
            <label htmlFor="device-fee-kes-input" className="label" style={{ fontSize: "0.78rem" }}>Equivalent Fee (KES)</label>
            <input
              id="device-fee-kes-input"
              name="deviceFeeKES"
              type="number"
              value={extraDeviceFeeKES}
              onChange={(e) => setExtraDeviceFeeKES(e.target.value)}
              style={{ fontSize: "0.88rem" }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.85rem" }}>
              Save Fee Config
            </button>
            <button
              id="delete-device-fee-btn"
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                background: "rgba(239, 68, 68, 0.15)",
                color: "var(--rose)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </form>

        {feeSuccessMsg && (
          <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.85rem", background: "var(--emerald)22", border: "1px solid var(--emerald)44", color: "var(--emerald)", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600 }}>
            ✓ {feeSuccessMsg}
          </div>
        )}
      </div>

      {/* Delete Fee Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion of Device Fee Configuration"
        description="This action will delete the current additional device fee configuration."
        size="md"
        footer={
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                background: "rgba(148, 163, 184, 0.15)",
                color: "var(--text2, #94a3b8)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteFee}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Confirm Delete
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
            Are you sure you want to delete the additional device monthly fee configuration?
          </p>
          <div style={{ padding: "0.75rem", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#f87171", fontSize: "0.8rem" }}>
            ⚠️ <strong>Warning:</strong> Deleting this configuration will reset the additional device monthly fee to <strong>$0.00 (KES 0)</strong> per month across the platform.
          </div>
        </div>
      </Modal>

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
