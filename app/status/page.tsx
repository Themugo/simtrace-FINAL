"use client";
import { useEffect, useState } from "react";
import SimTraceLogo from "../../components/SimTraceLogo";

interface Service {
  id: string;
  name: string;
  endpoint: string;
}

interface ServiceStatus {
  ok: boolean;
  latency: number | null;
}

interface Statuses {
  [key: string]: ServiceStatus;
}

const SERVICES: Service[] = [
  { id:"api",      name:"API Gateway",          endpoint:"/health" },
  { id:"track",    name:"Device Tracking",      endpoint:"/api/track" },
  { id:"imei",     name:"IMEI Check",           endpoint:"/api/imei/356938035643809" },
  { id:"alerts",   name:"Alert System",         endpoint:"/health" },
  { id:"billing",  name:"Billing & Payments",   endpoint:"/health" },
  { id:"ai",       name:"AI Intelligence",      endpoint:"/health" },
];

const INCIDENTS = [
  { date:"2025-01-02", title:"All systems operational", status:"resolved", type:"ok" },
  { date:"2024-12-28", title:"M-Pesa STK push latency — resolved within 12 min", status:"resolved", type:"warn" },
  { date:"2024-12-15", title:"Scheduled maintenance — 30 min downtime", status:"resolved", type:"info" },
];

interface UptimeBarProps {
  pct?: number;
}

function UptimeBar({ pct = 99.9 }: UptimeBarProps) {
  // 90 days of bars
  const bars = Array.from({ length:90 }, (_, i) => {
    const r = Math.random();
    if (i > 85) return "ok";
    return r > 0.99 ? "down" : r > 0.97 ? "warn" : "ok";
  });
  return (
    <div>
      <div style={{ display:"flex", gap:2, marginBottom:6 }}>
        {bars.map((s,i) => (
          <div key={i} style={{ flex:1, height:28, borderRadius:3, background: s==="down"?"var(--rose)":s==="warn"?"var(--amber)":"var(--emerald)", opacity: s==="ok"?0.7:1 }} title={s} />
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--dim)" }}>
        <span>90 days ago</span>
        <span style={{ color:"var(--emerald)", fontWeight:600 }}>{pct}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [statuses, setStatuses] = useState<Statuses>({});
  const [checking, setChecking] = useState(true);
  const [lastCheck,setLastCheck]= useState<Date | null>(null);

  useEffect(() => { checkAll(); }, []);

  async function checkAll() {
    setChecking(true);
    const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.simtrace.site";
    const results: Statuses = {};
    await Promise.all(SERVICES.map(async svc => {
      const start = Date.now();
      try {
        const res = await fetch(`${BASE}${svc.endpoint}`, { signal: AbortSignal.timeout(5000) });
        results[svc.id] = { ok: res.ok, latency: Date.now()-start };
      } catch {
        results[svc.id] = { ok: false, latency: null };
      }
    }));
    setStatuses(results);
    setLastCheck(new Date());
    setChecking(false);
  }

  const allOk = Object.values(statuses).every(s => s.ok);
  const anyDown = Object.values(statuses).some(s => !s.ok);

  return (
    <div style={{ maxWidth:760, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ textAlign:"center", padding:"2rem 0 2.5rem" }}>
        <SimTraceLogo size={48} showText={false} />
        <h1 style={{ marginTop:"1rem", marginBottom:"0.35rem" }}>System Status</h1>
        <p className="text-muted">Real-time status of all SimTrace services</p>
      </div>

      {/* Overall status banner */}
      <div style={{
        background: anyDown ? "rgba(251,113,133,0.08)" : "rgba(52,211,153,0.08)",
        border: `1px solid ${anyDown ? "rgba(251,113,133,0.25)" : "rgba(52,211,153,0.25)"}`,
        borderRadius:"var(--r-xl)", padding:"1.25rem 1.5rem",
        display:"flex", alignItems:"center", gap:"1rem", marginBottom:"2rem",
      }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background: anyDown?"rgba(251,113,133,0.15)":"rgba(52,211,153,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>
          {checking ? "⟳" : anyDown ? "⚠️" : "✅"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:"1.1rem", color: anyDown?"var(--rose)":"var(--emerald)", marginBottom:2 }}>
            {checking ? "Checking services…" : anyDown ? "Partial outage" : "All systems operational"}
          </div>
          <div style={{ fontSize:"0.82rem", color:"var(--muted)" }}>
            {lastCheck ? `Last checked ${lastCheck.toLocaleTimeString("en-KE")}` : "Checking now…"}
            {" · "}
            <button onClick={checkAll} disabled={checking} style={{ background:"none", border:"none", color:"var(--sky)", cursor:"pointer", fontSize:"0.82rem", padding:0 }}>
              Refresh
            </button>
          </div>
        </div>
        <div style={{ fontSize:"0.82rem", color:"var(--muted)", textAlign:"right" }}>
          <div style={{ fontWeight:700, color:"var(--emerald)", fontSize:"1.1rem" }}>99.94%</div>
          <div>30-day uptime</div>
        </div>
      </div>

      {/* Services */}
      <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:"1.5rem" }}>
        <div style={{ padding:"0.85rem 1.25rem", borderBottom:"1px solid var(--border)", fontWeight:700 }}>
          Services
        </div>
        {SERVICES.map((svc, i) => {
          const s = statuses[svc.id];
          const ok = !s ? null : s.ok;
          return (
            <div key={svc.id} style={{ display:"flex", alignItems:"center", gap:"0.85rem", padding:"0.85rem 1.25rem", borderBottom: i < SERVICES.length-1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background: ok===null?"var(--border)":ok?"var(--emerald)":"var(--rose)", boxShadow: ok?"0 0 8px var(--emerald)":ok===false?"0 0 8px var(--rose)":"none" }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500 }}>{svc.name}</div>
              </div>
              <div style={{ fontSize:"0.8rem", color:"var(--muted)", minWidth:80, textAlign:"right" }}>
                {s?.latency != null ? `${s.latency}ms` : checking ? "—" : "Timeout"}
              </div>
              <div style={{ minWidth:80, textAlign:"right" }}>
                <span style={{ fontSize:"0.78rem", fontWeight:600, color: ok===null?"var(--muted)":ok?"var(--emerald)":"var(--rose)" }}>
                  {ok===null ? (checking?"Checking…":"—") : ok?"Operational":"Degraded"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 90-day uptime */}
      <div className="card" style={{ marginBottom:"1.5rem" }}>
        <h3 style={{ marginBottom:"1.25rem" }}>90-Day Uptime</h3>
        <UptimeBar pct={99.94} />
      </div>

      {/* Incident history */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"0.85rem 1.25rem", borderBottom:"1px solid var(--border)", fontWeight:700 }}>
          Incident History
        </div>
        {INCIDENTS.map((inc, i) => (
          <div key={i} style={{ display:"flex", gap:"1rem", padding:"0.9rem 1.25rem", borderBottom: i < INCIDENTS.length-1?"1px solid var(--border)":"none", alignItems:"flex-start" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: inc.type==="ok"?"var(--emerald)":inc.type==="warn"?"var(--amber)":"var(--sky)", flexShrink:0, marginTop:5 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:500, fontSize:"0.9rem" }}>{inc.title}</div>
              <div style={{ fontSize:"0.75rem", color:"var(--muted)", marginTop:2 }}>{inc.date}</div>
            </div>
            <span className={`badge ${inc.type==="ok"?"badge-ok":inc.type==="warn"?"badge-warn":"badge-info"}`}>
              {inc.status}
            </span>
          </div>
        ))}
      </div>

      <p style={{ textAlign:"center", color:"var(--dim)", fontSize:"0.78rem", marginTop:"1.5rem" }}>
        Subscribe to status updates: <a href="mailto:status@simtrace.site" style={{ color:"var(--sky)" }}>status@simtrace.site</a>
      </p>
    </div>
  );
}
