"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../lib/api";

interface Device {
  _id: string;
  imei: string;
  make?: string;
  model?: string;
  status: string;
}

interface Evidence {
  capturedAt: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  device: Device;
}

export default function EvidencePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast  = useToast();
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Device | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) loadData();
  }, [user, authLoading]);

  async function loadData() {
    try {
      const devs = await api.myDevices();
      const stolen = devs.filter((d: Device) => d.status === "stolen" || d.status === "blacklisted");
      setDevices(stolen);

      // Load evidence for each stolen device
      const allEvidence: Evidence[] = [];
      for (const d of stolen) {
        try {
          const imgs = await api.get(`/api/devices/${d._id}/evidence`);
          (imgs.evidence || []).forEach((e: any) => allEvidence.push({ ...e, device: d }));
        } catch { /* no evidence yet — normal */ }
      }
      setEvidence(allEvidence.sort((a,b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()));
    } catch (err: any) { toast?.add('Failed to load evidence: ' + err.message, 'danger'); }
    finally { setLoading(false); }
  }

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop:"2rem" }}>Loading…</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.35rem" }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,var(--violet),var(--indigo))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem" }}>📸</div>
          <div>
            <h1 style={{ marginBottom:0 }}>Evidence Capture</h1>
            <p className="text-muted" style={{ margin:0 }}>Photos and location data captured from stolen devices</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom:"1.5rem", borderColor:"var(--violet)33", background:"var(--bg2)" }}>
        <h3 style={{ marginBottom:"0.75rem" }}>How evidence capture works</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.75rem" }}>
          {[
            ["📱 Agent runs silently", "The SimTrace mobile agent continues running even when the device is locked"],
            ["📸 Photos captured", "Front camera activates periodically and uploads photos of the person holding the device"],
            ["📍 Location tagged", "Every photo is geotagged with GPS coordinates for law enforcement"],
            ["🔒 Encrypted upload", "Evidence is encrypted in transit — only accessible by you and authorised law enforcement"],
          ].map(([t,d]) => (
            <div key={t} style={{ background:"var(--bg)", borderRadius:8, padding:"0.75rem" }}>
              <div style={{ fontWeight:700, fontSize:"0.82rem", color:"var(--violet)", marginBottom:4 }}>{t}</div>
              <div style={{ color:"var(--muted)", fontSize:"0.78rem", lineHeight:1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stolen devices */}
      {devices.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"3rem" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>✅</div>
          <h3 style={{ marginBottom:"0.4rem" }}>No stolen devices</h3>
          <p className="text-muted">Evidence capture only activates when a device is reported stolen.</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", alignItems:"start" }}>
          {/* Device list */}
          <div>
            <h2 style={{ marginBottom:"0.85rem", fontSize:"1rem" }}>Tracked stolen devices ({devices.length})</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {devices.map(d => (
                <div key={d._id} className={`card ${selected?._id===d._id?"card-selected":""}`}
                  onClick={() => setSelected(d)}
                  style={{ cursor:"pointer", borderLeft:"3px solid var(--rose)", borderColor: selected?._id===d._id ? "var(--sky)" : undefined, transition:"border-color 0.15s" }}>
                  <div style={{ fontWeight:600 }}>{d.make} {d.model}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:"0.78rem", color:"var(--muted)" }}>{d.imei}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:4 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:d.status==="stolen"?"var(--rose)":"var(--amber)", display:"inline-block" }}/>
                    <span style={{ fontSize:"0.72rem", color:"var(--muted)", textTransform:"capitalize" }}>{d.status}</span>
                    {evidence.filter(e=>e.device._id===d._id).length > 0 && (
                      <span className="badge badge-indigo" style={{ fontSize:"0.65rem" }}>
                        {evidence.filter(e=>e.device._id===d._id).length} photos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence panel */}
          <div>
            {selected ? (
              <div>
                <h2 style={{ marginBottom:"0.85rem", fontSize:"1rem" }}>
                  Evidence for {selected.make} {selected.model}
                </h2>
                {evidence.filter(e=>e.device._id===selected._id).length === 0 ? (
                  <div className="card" style={{ textAlign:"center", padding:"2rem" }}>
                    <div style={{ fontSize:"1.8rem", marginBottom:"0.5rem" }}>⏳</div>
                    <p className="text-muted" style={{ fontSize:"0.88rem" }}>
                      No evidence captured yet. The agent will upload photos when it next checks in (within 60 seconds of the device coming online).
                    </p>
                    <div style={{ marginTop:"1rem", background:"var(--surface)", borderRadius:8, padding:"0.6rem 0.85rem", fontSize:"0.8rem", color:"var(--dim)" }}>
                      Requires SimTrace agent v1.2+ installed on the device
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem" }}>
                    {evidence.filter(e=>e.device._id===selected._id).map((e,i) => (
                      <div key={i} className="card" style={{ padding:"0.6rem" }}>
                        <div style={{ background:"var(--surface)", borderRadius:6, height:140, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"0.5rem", overflow:"hidden", fontSize:"2rem" }}>
                          {e.imageUrl ? (
                            <img src={e.imageUrl} alt="Evidence" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                          ) : "📷"}
                        </div>
                        <div style={{ fontSize:"0.72rem", color:"var(--muted)" }}>
                          {new Date(e.capturedAt).toLocaleString("en-KE")}
                        </div>
                        {e.lat && (
                          <div style={{ fontSize:"0.7rem", color:"var(--dim)", fontFamily:"var(--mono)" }}>
                            {e.lat.toFixed(5)}, {e.lng?.toFixed(5)}
                          </div>
                        )}
                        {e.imageUrl && (
                          <a href={e.imageUrl} target="_blank" rel="noopener" style={{ fontSize:"0.72rem", color:"var(--sky)", display:"block", marginTop:2 }}>
                            Download →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Share with law enforcement */}
                <div className="card" style={{ marginTop:"0.85rem", borderColor:"var(--sky)33" }}>
                  <h3 style={{ fontSize:"0.9rem", marginBottom:"0.5rem" }}>Share with law enforcement</h3>
                  <p style={{ color:"var(--muted)", fontSize:"0.82rem", marginBottom:"0.75rem" }}>
                    Generate a secure evidence package link to share with DCI Kenya or your local police.
                  </p>
                  <button className="btn-primary" style={{ fontSize:"0.85rem", padding:"6px 16px" }}
                    onClick={() => alert("Evidence package link copied! Valid for 72 hours.\n\nhttps://evidence.simtrace.site/" + selected._id)}>
                    🔗 Generate Evidence Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign:"center", padding:"2rem" }}>
                <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>👆</div>
                <p className="text-muted">Select a device to view captured evidence</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
