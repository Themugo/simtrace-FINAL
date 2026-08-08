"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";

interface Device {
  _id: string;
  imei: string;
  make?: string;
  model?: string;
}

const LOCK_STATES: Record<string, { icon: string; label: string; color: string }> = {
  idle:    { icon: "🔓", label: "Unlocked",  color: "var(--emerald)" },
  locking: { icon: "⟳",  label: "Sending command…", color: "var(--amber)" },
  locked:  { icon: "🔒", label: "Locked",    color: "var(--rose)" },
  error:   { icon: "⚠️", label: "Error",     color: "var(--amber)" },
};

export default function RemoteLockPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast  = useToast();
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [lockState, setLockState] = useState<Record<string, string>>({});
  const [msg,      setMsg]      = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) api.myDevices()
      .then((d: Device[]) => { setDevices(d); if (d.length) setSelected(d[0]._id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function sendLock(deviceId: string, imei: string) {
    setLockState(s => ({ ...s, [deviceId]: "locking" }));
    setMsg(m => ({ ...m, [deviceId]: "" }));
    try {
      await api.lockDevice(deviceId);
      setLockState(s => ({ ...s, [deviceId]: "locked" }));
      toast?.add(`🔒 Lock command sent — device will lock within 60s`, "warning", 8000);
      setMsg(m => ({ ...m, [deviceId]: `Lock command queued. Device locks on next agent check-in.` }));
    } catch (err: any) {
      setLockState(s => ({ ...s, [deviceId]: "error" }));
      toast?.add(err.message, "danger");
      setMsg(m => ({ ...m, [deviceId]: err.message }));
    }
  }

  async function sendUnlock(deviceId: string) {
    setLockState(s => ({ ...s, [deviceId]: "idle" }));
    setMsg(m => ({ ...m, [deviceId]: "Unlock command sent." }));
    try { await api.unlockDevice(deviceId); } catch { /* silent */ }
  }

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop: "2rem" }}>Loading…</p>;

  const device = devices.find(d => d._id === selected);
  const state  = device ? (lockState[device._id] || "idle") : "idle";
  const STATE  = LOCK_STATES[state];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,var(--rose),var(--violet))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>🔒</div>
          <div>
            <h1 style={{ marginBottom: 0 }}>Remote Lockdown</h1>
            <p className="text-muted" style={{ margin: 0 }}>Lock or wipe a stolen device remotely</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: "1.25rem", borderColor: "var(--rose)33", background: "var(--bg2)" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>How remote lock works</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "0.75rem" }}>
          {[
            ["1. Send command", "Click Lock below — a command is queued on our server"],
            ["2. Agent checks in", "The SimTrace agent on your device polls every 60 seconds"],
            ["3. Device locks", "Agent receives the command and locks the screen immediately"],
            ["4. Evidence saved", "A photo + last GPS location is uploaded before locking"],
          ].map(([t,d]) => (
            <div key={t} style={{ background: "var(--bg)", borderRadius: 8, padding: "0.75rem" }}>
              <div style={{ fontWeight: 700, color: "var(--rose)", fontSize: "0.82rem", marginBottom: 4 }}>{t}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Device selector */}
      {devices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📱</div>
          <h3>No devices registered</h3>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>Register a device first to use remote lock.</p>
          <Link href="/devices" className="btn-primary" style={{ display: "inline-block", padding: "0.65rem 1.5rem", textDecoration: "none" }}>+ Register Device</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Device picker */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {devices.map(d => (
              <button key={d._id} onClick={() => setSelected(d._id)}
                style={{ background: selected === d._id ? "var(--surface)" : "var(--bg2)", border: `1px solid ${selected === d._id ? "var(--sky)" : "var(--border)"}`, color: selected === d._id ? "var(--text)" : "var(--muted)", borderRadius: 9, padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}>
                {d.make || "?"} {d.model || d.imei.slice(-6)}
              </button>
            ))}
          </div>

          {/* Lock control card */}
          {device && (
            <div className="card" style={{ borderLeft: `3px solid ${STATE.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{device.make} {device.model}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", color: "var(--muted)" }}>{device.imei}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: 4 }}>
                    <span style={{ fontSize: "1rem" }}>{STATE.icon}</span>
                    <span style={{ color: STATE.color, fontWeight: 700, fontSize: "0.85rem" }}>{STATE.label}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {state !== "locked" ? (
                    <button
                      onClick={() => sendLock(device._id, device.imei)}
                      disabled={state === "locking"}
                      style={{ background: "linear-gradient(135deg,var(--rose),var(--violet))", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.92rem" }}>
                      {state === "locking" ? "⟳ Sending…" : "🔒 Lock Device"}
                    </button>
                  ) : (
                    <button onClick={() => sendUnlock(device._id)}
                      style={{ background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: 10, padding: "0.7rem 1.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.92rem" }}>
                      🔓 Unlock
                    </button>
                  )}
                </div>
              </div>

              {msg[device._id] && (
                <div style={{ marginTop: "0.85rem", background: state === "error" ? "rgba(251,191,36,0.08)" : "rgba(56,189,248,0.08)", border: `1px solid ${state === "error" ? "var(--amber)" : "var(--sky)"}33`, borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.85rem", color: state === "error" ? "var(--amber)" : "var(--text2)" }}>
                  {msg[device._id]}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--amber)", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <span>⚠️</span>
            <span>Remote lock requires the SimTrace agent app to be installed and running on the device. If the device is off or offline, the command executes on next connection.</span>
          </div>
        </div>
      )}

      {/* Remote wipe section */}
      <div className="card" style={{ marginTop: "1.25rem", borderColor: "var(--rose)44" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ color: "var(--rose)", marginBottom: "0.25rem" }}>⚠️ Remote Wipe</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
              Permanently erases all data on the device. <strong style={{ color: "var(--text)" }}>This cannot be undone.</strong>
            </p>
          </div>
          <button
            onClick={() => alert("Remote wipe requires Business plan or higher. Contact support to activate.")}
            style={{ background: "transparent", border: "1px solid var(--rose)", color: "var(--rose)", borderRadius: 9, padding: "6px 16px", fontSize: "0.85rem", cursor: "pointer" }}>
            Request Wipe
          </button>
        </div>
      </div>
    </div>
  );
}
