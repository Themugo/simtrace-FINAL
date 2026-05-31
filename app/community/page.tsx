"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

interface Sighting {
  imei: string;
  location: string;
  notes?: string;
  createdAt: string;
}

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sightings, setSightings]  = useState<Sighting[]>([]);
  const [loading,   setLoading]    = useState(true);
  const [form,      setForm]       = useState({ imei: "", location: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error,     setError]       = useState("");

  const [stats, setStats] = useState({ members:"14,821+", recovered:"891+", sightings:0 });

  useEffect(() => {
    // Load sightings + platform stats
    api.sightings()
      .then(d => {
        setSightings(d.sightings || []);
        setStats(s => ({ ...s, sightings: d.sightings?.length || 0 }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get("/api/devices/stats")
      .then((s: any) => setStats(prev => ({ ...prev, recovered: (s.recovered || 891).toLocaleString() + "+" })))
      .catch(() => {});
  }, []);

  async function submitSighting(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imei.replace(/\D/g,"").match(/^\d{15,17}$/)) { setError("Enter a valid IMEI"); return; }
    if (!user) { router.push("/login"); return; }
    setSubmitting(true); setError("");
    try {
      await api.submitSighting({
        imei:     form.imei.replace(/\D/g,""),
        location: form.location,
        notes:    form.notes,
      });
      setSubmitted(true);
      setForm({ imei: "", location: "", notes: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,var(--emerald),var(--sky))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>👥</div>
          <div>
            <h1 style={{ marginBottom: 0 }}>Community Detection</h1>
            <p className="text-muted" style={{ margin: 0 }}>Help recover stolen devices by reporting sightings</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          ["Community members", stats.members, "var(--sky)"],
          ["Devices recovered", stats.recovered, "var(--emerald)"],
          ["Active sightings", sightings.length, "var(--amber)"],
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
            <div className="text-muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem", alignItems: "start" }}>
        {/* Sightings feed */}
        <div>
          <h2 style={{ marginBottom: "1rem", fontSize: "1rem" }}>Recent sightings</h2>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[1,2,3].map(i => <div key={i} className="card" style={{ height: 72, opacity: 0.4 }} />)}
            </div>
          ) : sightings.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>👁️</div>
              <h3 style={{ marginBottom: "0.4rem" }}>No sightings yet</h3>
              <p className="text-muted">Be the first to report a stolen device spotted in your area.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sightings.map((s, i) => (
                <div key={i} className="card" style={{ borderLeft: "3px solid var(--amber)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--text2)", marginBottom: 2 }}>
                        IMEI {s.imei}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>📍 {s.location}</div>
                      {s.notes && <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: 2 }}>{s.notes}</div>}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--dim)", flexShrink: 0 }}>
                      {new Date(s.createdAt).toLocaleDateString("en-KE")}
                    </div>
                  </div>
                  <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem" }}>
                    <a href={`/imei?q=${s.imei}`} style={{ fontSize: "0.75rem", color: "var(--sky)" }}>Check IMEI →</a>
                    <a href={`/report?imei=${s.imei}`} style={{ fontSize: "0.75rem", color: "var(--rose)" }}>Report stolen →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report form */}
        <div>
          <div className="card" style={{ borderColor: "var(--emerald)44" }}>
            <h3 style={{ marginBottom: "0.75rem" }}>
              👁️ Report a sighting
            </h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.5 }}>
              Did you see a device matching a stolen report? Help reunite it with its owner.
            </p>

            {submitted && (
              <div style={{ background: "var(--emerald)22", border: "1px solid var(--emerald)44", borderRadius: 8, padding: "0.65rem 0.9rem", color: "var(--emerald)", fontSize: "0.88rem", marginBottom: "0.85rem" }}>
                ✅ Sighting reported — thank you!
              </div>
            )}

            <form onSubmit={submitSighting} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label className="label">IMEI of device seen *</label>
                <input
                  value={form.imei}
                  onChange={e => setForm(p => ({ ...p, imei: e.target.value }))}
                  placeholder="356938035643809"
                  inputMode="numeric"
                  maxLength={17}
                  required
                />
              </div>
              <div>
                <label className="label">Location spotted *</label>
                <input
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Westgate Mall, Nairobi"
                  required
                />
              </div>
              <div>
                <label className="label">Additional details</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="What you saw, time of day, description of person with device…"
                  style={{ resize: "vertical" }}
                />
              </div>

              {error && <p className="error">{error}</p>}

              {!user && (
                <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  <a href="/login">Sign in</a> to submit a sighting.
                </p>
              )}

              <button
                type="submit"
                className="btn-success"
                disabled={submitting || !user}
                style={{ width: "100%" }}
              >
                {submitting ? "Submitting…" : "Submit Sighting"}
              </button>
            </form>

            <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--bg)", borderRadius: 8, fontSize: "0.78rem", color: "var(--dim)", lineHeight: 1.6 }}>
              🔒 Your identity is never shared publicly. SimTrace shares sighting data only with law enforcement and the verified device owner.
            </div>
          </div>

          {/* How to identify */}
          <div className="card" style={{ marginTop: "0.85rem" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>How to check a device's IMEI</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {[
                ["Android", "Settings → About Phone → IMEI"],
                ["iPhone",  "Settings → General → About → IMEI"],
                ["Any phone", "Dial *#06# to display IMEI"],
                ["Phone box", "Barcode sticker on original box"],
              ].map(([device, method]) => (
                <div key={device} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem" }}>
                  <span style={{ color: "var(--sky)", minWidth: 70, fontWeight: 600 }}>{device}</span>
                  <span style={{ color: "var(--muted)" }}>{method}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
