"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useToast } from "../../../components/ToastProvider";

const LiveMap = dynamic(() => import("../../../components/LiveMap"), { ssr: false });

const STATUS_COLOR: Record<string, string> = { active:"var(--emerald)", stolen:"var(--rose)", blacklisted:"var(--amber)", recovered:"var(--sky)" };

interface RiskGaugeProps {
  score: number;
}

function RiskGauge({ score }: RiskGaugeProps) {
  const color = score >= 70 ? "var(--rose)" : score >= 35 ? "var(--amber)" : "var(--emerald)";
  const label = score >= 70 ? "HIGH RISK" : score >= 35 ? "MEDIUM" : "LOW RISK";
  const r = 28, circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  return (
    <div style={{ textAlign:"center" }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="7"/>
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition:"stroke-dashoffset 0.8s ease" }}/>
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{score}</text>
      </svg>
      <div style={{ fontSize:"0.72rem", fontWeight:700, color, marginTop:2 }}>{label}</div>
    </div>
  );
}

interface Ping {
  ts: string;
  lat?: number;
  lng?: number;
  networkOp?: string;
  simIccid?: string;
  verified: boolean;
}

interface PingTimelineProps {
  pings: Ping[];
}

function PingTimeline({ pings }: PingTimelineProps) {
  if (!pings?.length) return <p className="text-muted" style={{ padding:"1rem 0" }}>No location pings recorded yet.</p>;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
        <thead>
          <tr style={{ borderBottom:"1px solid var(--border)" }}>
            {["Time","Location","Carrier","SIM ICCID","Verified"].map(h => (
              <th key={h} style={{ textAlign:"left", padding:"0.5rem 0.75rem", color:"var(--muted)", fontWeight:600, fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pings.map((p,i) => (
            <tr key={i} style={{ borderBottom:"1px solid var(--bg)", background: i%2===0 ? "transparent" : "var(--bg)33" }}>
              <td style={{ padding:"0.55rem 0.75rem", color:"var(--text2)", whiteSpace:"nowrap" }}>{new Date(p.ts).toLocaleString("en-KE")}</td>
              <td style={{ padding:"0.55rem 0.75rem", fontFamily:"var(--mono)", fontSize:"0.78rem", color:"var(--muted)" }}>{p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}</td>
              <td style={{ padding:"0.55rem 0.75rem", color:"var(--text2)" }}>{p.networkOp || "—"}</td>
              <td style={{ padding:"0.55rem 0.75rem", fontFamily:"var(--mono)", fontSize:"0.76rem", color:"var(--dim)" }}>{p.simIccid || "—"}</td>
              <td style={{ padding:"0.55rem 0.75rem" }}>
                <span style={{ fontSize:"0.72rem", color: p.verified ? "var(--emerald)" : "var(--dim)" }}>
                  {p.verified ? "✓ Signed" : "Unsigned"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  riskScore?: number;
  lastPings?: Ping[];
  fingerprint?: Record<string, any>;
  reports?: any[];
}

export default function DeviceDetailPage() {
  const { id }     = useParams();
  const router     = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast      = useToast();
  const [device,   setDevice]   = useState<Device | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("overview");
  const [locking,  setLocking]  = useState(false);
  const [lockState,setLockState]= useState("idle"); // idle | locked

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) load();
  }, [user, authLoading, id]);

  async function load() {
    try {
      const data = await api.deviceDetail(id as string);
      setDevice(data);
    } catch (err: any) {
      toast?.add("Device not found or access denied", "danger");
      router.push("/devices");
    } finally { setLoading(false); }
  }

  async function toggleLock() {
    setLocking(true);
    try {
      if (lockState === "idle") {
        await api.lockDevice(id as string);
        setLockState("locked");
        toast?.add("🔒 Lock command sent — device will lock within 60s", "warning", 8000);
      } else {
        await api.unlockDevice(id as string);
        setLockState("idle");
        toast?.add("🔓 Unlock command sent", "info");
      }
    } catch (err: any) {
      toast?.add(err.message, "danger");
    } finally { setLocking(false); }
  }

  if (loading || authLoading) return (
    <div style={{ padding:"3rem", textAlign:"center", color:"var(--muted)" }}>Loading device…</div>
  );
  if (!device) return null;

  const tabs = ["overview","map","pings","reports"];

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      {/* Back + header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <Link href="/devices" style={{ color:"var(--muted)", fontSize:"0.85rem", display:"inline-flex", alignItems:"center", gap:"0.3rem", marginBottom:"0.75rem" }}>
          ← My Devices
        </Link>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.25rem" }}>
              <h1 style={{ margin:0 }}>{device.make || "?"} {device.model || "Unknown"}</h1>
              <span style={{ background: STATUS_COLOR[device.status]+"22", color: STATUS_COLOR[device.status], padding:"2px 10px", borderRadius:20, fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase" }}>
                {device.status}
              </span>
            </div>
            <div style={{ fontFamily:"var(--mono)", color:"var(--muted)", fontSize:"0.88rem" }}>{device.imei}</div>
            {device.lastSeen && (
              <div style={{ color:"var(--dim)", fontSize:"0.78rem", marginTop:2 }}>
                Last seen: {new Date(device.lastSeen).toLocaleString("en-KE")}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:"0.6rem", flexWrap:"wrap" }}>
            <Link href={`/report?imei=${device.imei}`}
              style={{ background:"var(--rose)22", border:"1px solid var(--rose)44", color:"var(--rose)", borderRadius:9, padding:"7px 14px", fontSize:"0.85rem", fontWeight:600, textDecoration:"none" }}>
              🚨 Report Stolen
            </Link>
            <button onClick={toggleLock} disabled={locking}
              style={{ background: lockState==="locked" ? "var(--emerald)22" : "var(--surface)", border:`1px solid ${lockState==="locked"?"var(--emerald)":"var(--border)"}`, color: lockState==="locked" ? "var(--emerald)" : "var(--text2)", borderRadius:9, padding:"7px 14px", fontSize:"0.85rem", fontWeight:600, cursor:"pointer" }}>
              {locking ? "⟳…" : lockState==="locked" ? "🔓 Unlock" : "🔒 Lock"}
            </button>
            <Link href={`/imei?q=${device.imei}`}
              style={{ background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text2)", borderRadius:9, padding:"7px 14px", fontSize:"0.85rem", fontWeight:600, textDecoration:"none" }}>
              🔍 IMEI Check
            </Link>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:"0.25rem", marginBottom:"1.25rem", borderBottom:"1px solid var(--border)", paddingBottom:"0.5rem" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ background:"transparent", border:"none", color: tab===t ? "var(--sky)" : "var(--muted)", fontWeight: tab===t ? 700 : 400, fontSize:"0.9rem", cursor:"pointer", padding:"4px 12px", borderBottom: tab===t ? "2px solid var(--sky)" : "2px solid transparent", textTransform:"capitalize" }}>
            {t} {t==="reports" && device.reports?.length ? `(${device.reports.length})` : ""}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:"1.25rem", alignItems:"start" }}>
          {/* Risk gauge */}
          <div className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Risk Score</div>
            <RiskGauge score={device.riskScore || 0} />
            <div style={{ marginTop:"1rem", display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {[
                ["Status",    device.status,                    STATUS_COLOR[device.status]],
                ["Make",      device.make || "—",               "var(--text2)"],
                ["Model",     device.model || "—",              "var(--text2)"],
                ["Serial",    device.serialNumber || "—",       "var(--dim)"],
              ].map(([k,v,c]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem" }}>
                  <span style={{ color:"var(--muted)" }}>{k}</span>
                  <span style={{ color:c, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
            {/* Last ping */}
            {device.lastPings?.[0] && (
              <div className="card">
                <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>Last Known Location</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.5rem" }}>
                  {[
                    ["Coordinates", `${device.lastPings[0].lat?.toFixed(5)}, ${device.lastPings[0].lng?.toFixed(5)}`],
                    ["Carrier",     device.lastPings[0].networkOp || "—"],
                    ["Time",        new Date(device.lastPings[0].ts).toLocaleString("en-KE")],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:"var(--bg)", borderRadius:7, padding:"0.5rem 0.75rem" }}>
                      <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:"0.82rem", color:"var(--text2)", fontFamily: k==="Coordinates"?"var(--mono)":"inherit" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fingerprint */}
            {device.fingerprint && Object.keys(device.fingerprint).some(k => device.fingerprint![k]) && (
              <div className="card">
                <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:"0.75rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>Device Fingerprint</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem" }}>
                  {Object.entries(device.fingerprint).filter(([,v])=>v).map(([k,v]) => (
                    <div key={k} style={{ background:"var(--bg)", borderRadius:7, padding:"0.45rem 0.75rem" }}>
                      <div style={{ fontSize:"0.65rem", color:"var(--muted)", textTransform:"capitalize" }}>{k.replace(/([A-Z])/g," $1")}</div>
                      <div style={{ fontSize:"0.78rem", color:"var(--text2)", fontFamily:"var(--mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts summary */}
            <div className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"0.72rem", color:"var(--muted)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Open Alerts</div>
                <div style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--rose)" }}>
                  {device.reports?.length || 0}
                </div>
              </div>
              <Link href={`/alerts?imei=${device.imei}`} style={{ color:"var(--sky)", fontSize:"0.85rem" }}>
                View alerts →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Map tab */}
      {tab === "map" && (
        <LiveMap deviceImeis={[device.imei]} style={{ height:480 }} />
      )}

      {/* Pings tab */}
      {tab === "pings" && (
        <div className="card" style={{ padding:"0.75rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem", padding:"0 0.25rem" }}>
            <h3>Location History ({device.lastPings?.length || 0} recent pings)</h3>
            <Link href={`/imei?q=${device.imei}`} style={{ fontSize:"0.82rem", color:"var(--sky)" }}>Full IMEI report →</Link>
          </div>
          <PingTimeline pings={device.lastPings || []} />
        </div>
      )}

      {/* Reports tab */}
      {tab === "reports" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
          {!device.reports?.length ? (
            <div className="card" style={{ textAlign:"center", padding:"2.5rem" }}>
              <div style={{ fontSize:"2rem", marginBottom:"0.6rem" }}>✅</div>
              <h3>No theft reports</h3>
              <p className="text-muted" style={{ marginTop:"0.35rem" }}>This device has no open theft reports.</p>
            </div>
          ) : device.reports.map((r: any) => (
            <div key={r._id} className="card" style={{ borderLeft:`3px solid ${r.status==="open"?"var(--rose)":r.status==="investigating"?"var(--amber)":"var(--emerald)"}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.5rem" }}>
                <span className={`badge badge-${r.status==="open"?"danger":r.status==="investigating"?"warn":"ok"}`}>
                  {r.status}
                </span>
                <span style={{ fontSize:"0.75rem", color:"var(--dim)" }}>{new Date(r.createdAt).toLocaleDateString("en-KE")}</span>
              </div>
              {r.policeRef && <div style={{ fontSize:"0.82rem", color:"var(--muted)", marginBottom:4 }}>Police ref: <strong style={{ color:"var(--text2)" }}>{r.policeRef}</strong></div>}
              <p style={{ fontSize:"0.88rem", color:"var(--text2)", margin:0 }}>{r.description}</p>
            </div>
          ))}
          <Link href={`/report?imei=${device.imei}`} className="btn-primary" style={{ display:"inline-block", textAlign:"center", textDecoration:"none", padding:"0.7rem 1.5rem" }}>
            + File New Report
          </Link>
        </div>
      )}
    </div>
  );
}
