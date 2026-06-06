"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const STATUS_COLOR: Record<string, string> = { active: "var(--emerald)", stolen: "var(--rose)", recovered: "var(--sky)", blacklisted: "var(--amber)" };
const STATUS_ICON: Record<string, string> = { active: "✅", stolen: "🚨", blacklisted: "⛔", recovered: "✔️" };

interface DeviceKeyModalProps {
  deviceKey: string;
  imei: string;
  onClose: () => void;
}

function DeviceKeyModal({ deviceKey, onClose }: DeviceKeyModalProps) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(deviceKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--amber)", borderRadius: 16, padding: "2rem", maxWidth: 500, width: "100%" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔑</div>
        <h2 style={{ marginBottom: "0.4rem" }}>Save your device key</h2>
        <p style={{ color: "var(--amber)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.5 }}>
          ⚠️ This key is shown <strong>once only</strong>. Copy it and configure your mobile agent with it — you cannot retrieve it again.
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "0.75rem 1rem", fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--sky)", wordBreak: "break-all", marginBottom: "0.6rem" }}>
          {deviceKey}
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--dim)", marginBottom: "1rem" }}>
          Configure your Android agent: <code style={{ color: "var(--text2)" }}>X-Device-Key: {deviceKey.slice(0,20)}…</code> on every ping to <code style={{ color: "var(--text2)" }}>POST /api/track</code>
        </p>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={copy} style={{ flex: 1, background: copied ? "var(--emerald)" : "var(--surface)", border: "1px solid var(--border2)", color: copied ? "#fff" : "var(--text2)", borderRadius: 9, padding: "0.65rem", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}>
            {copied ? "✓ Copied!" : "Copy key"}
          </button>
          <button onClick={onClose} className="btn-primary" style={{ flex: 1 }}>I've saved it</button>
        </div>
      </div>
    </div>
  );
}

interface Device {
  _id: string;
  imei: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  lastSeen?: string;
}

interface DeviceLimit {
  slotsUsed: number;
  totalAllowed: number;
  slotsRemaining: number;
  canAdd: boolean;
  plan: string;
}

export default function DevicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [devices,    setDevices]    = useState<Device[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [limit,      setLimit]      = useState<DeviceLimit | null>(null);
  const [form,       setForm]       = useState({ imei: "", make: "", model: "", serialNumber: "" });
  const [formErr,    setFormErr]    = useState("");
  const [saving,     setSaving]     = useState(false);
  const [newDevKey,  setNewDevKey]  = useState<{ key: string; imei: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) { fetchDevices(); fetchLimit(); }
  }, [user, authLoading]);

  async function fetchDevices() {
    try { setDevices(await api.myDevices()); }
    catch { /* handled */ }
    finally { setLoading(false); }
  }

  async function fetchLimit() {
    try { setLimit(await api.get("/api/billing/device-limit")); }
    catch { /* silent */ }
  }

  async function registerDevice(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(""); setSaving(true);
    try {
      const res = await api.registerDevice(form);
      if (res.deviceKey) setNewDevKey({ key: res.deviceKey, imei: form.imei });
      setShowForm(false);
      setForm({ imei: "", make: "", model: "", serialNumber: "" });
      await fetchDevices();
      await fetchLimit();
    } catch (err: any) {
      if (err.status === 402) {
        setFormErr(`Device limit reached. ${err.message}`);
      } else {
        setFormErr(err.message);
      }
    }
    finally { setSaving(false); }
  }

  async function deleteDevice(id: string) {
    if (!confirm("Remove this device from your account?")) return;
    try { await api.deleteDevice(id); setDevices(d => d.filter(x => x._id !== id)); await fetchLimit(); }
    catch (err: any) { alert(err.message); }
  }

  if (loading || authLoading) return <p className="text-muted" style={{ paddingTop: "2rem" }}>Loading…</p>;

  const atLimit = limit && !limit.canAdd;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>My Devices</h1>
          {limit && (
            <p className="text-muted">
              {limit.slotsUsed} / {limit.totalAllowed} slots used
              {limit.slotsRemaining > 0
                ? <span style={{ color: "var(--emerald)", marginLeft: 6 }}>· {limit.slotsRemaining} remaining</span>
                : <span style={{ color: "var(--amber)", marginLeft: 6 }}>· Limit reached</span>
              }
              <span style={{ marginLeft: 8, background: "var(--surface)", padding: "1px 8px", borderRadius: 20, fontSize: "0.72rem", color: "var(--muted)", textTransform: "capitalize" }}>{limit.plan} plan</span>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {atLimit && (
            <Link href="/pricing" style={{ background: "var(--amber)22", border: "1px solid var(--amber)55", color: "var(--amber)", borderRadius: 9, padding: "7px 14px", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
              ⚡ Upgrade plan
            </Link>
          )}
          <button className={atLimit ? "btn-ghost" : "btn-primary"} onClick={() => setShowForm(s => !s)} disabled={atLimit && !showForm ? true : undefined}>
            {showForm ? "Cancel" : atLimit ? "Limit reached" : "+ Register Device"}
          </button>
        </div>
      </div>

      {/* Register form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "1.25rem", borderColor: "var(--sky)44" }}>
          <h3 style={{ marginBottom: "1rem" }}>Register new device</h3>
          <form onSubmit={registerDevice} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "0.85rem", alignItems: "end" }}>
            <div>
              <label className="label">IMEI * <span style={{ color: "var(--dim)", fontWeight: 400 }}>(dial *#06#)</span></label>
              <input required placeholder="356938035643809" inputMode="numeric" maxLength={17}
                value={form.imei} onChange={e => setForm(p => ({ ...p, imei: e.target.value }))} />
            </div>
            <div>
              <label className="label">Make</label>
              <input placeholder="Samsung / Apple…" value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} />
            </div>
            <div>
              <label className="label">Model</label>
              <input placeholder="Galaxy S24 / iPhone 15…" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
            </div>
            <div>
              <label className="label">Serial number</label>
              <input placeholder="Optional" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              {formErr && <p className="error" style={{ marginBottom: "0.6rem" }}>{formErr}</p>}
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Registering…" : "Register Device"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Device list */}
      {devices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📱</div>
          <h3 style={{ marginBottom: "0.4rem" }}>No devices yet</h3>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>Register your first device to start tracking and protecting it.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Register Device</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {devices.map(d => (
            <div key={d._id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", borderLeft: `3px solid ${STATUS_COLOR[d.status] || "var(--muted)"}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: STATUS_COLOR[d.status] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                {STATUS_ICON[d.status] || "📱"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{d.make || "?"} {d.model || "Unknown device"}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--muted)" }}>{d.imei}</div>
                {d.lastSeen && <div style={{ fontSize: "0.72rem", color: "var(--dim)" }}>Last seen: {new Date(d.lastSeen).toLocaleString("en-KE")}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ background: STATUS_COLOR[d.status] + "22", color: STATUS_COLOR[d.status], padding: "2px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                  {d.status}
                </span>
                <Link href={`/devices/${d._id}`} style={{ fontSize: "0.8rem", color: "var(--sky)" }}>Details →</Link>
                <Link href={`/imei?q=${d.imei}`} style={{ fontSize: "0.8rem", color: "var(--dim)" }}>Check IMEI</Link>
                {d.status === "active" && (
                  <Link href={`/report?imei=${d.imei}`} style={{ fontSize: "0.8rem", color: "var(--rose)" }}>Report stolen</Link>
                )}
                <button onClick={() => deleteDevice(d._id)} style={{ background: "transparent", border: "none", color: "var(--dim)", fontSize: "0.8rem", cursor: "pointer", padding: "2px 4px" }}>✕ Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {newDevKey && <DeviceKeyModal deviceKey={newDevKey.key} imei={newDevKey.imei} onClose={() => setNewDevKey(null)} />}
    </div>
  );
}
