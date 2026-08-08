"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

function ReportPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();
  const [form,    setForm]    = useState({ imei: params.get("imei") || "", description: "", policeRef: "" });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = form.imei.replace(/\D/g,"");
    if (!clean.match(/^\d{15,17}$/)) { setError("Enter a valid IMEI (15–17 digits)"); return; }
    if (!form.description.trim())    { setError("Please describe the theft"); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.reportStolen({ imei: clean, description: form.description, policeRef: form.policeRef });
      setSuccess(res);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (authLoading) return <div style={{ padding:"3rem", textAlign:"center", color:"var(--muted)" }}>Loading…</div>;

  if (success) return (
    <div style={{ maxWidth: 520, margin: "2rem auto" }}>
      <div className="card" style={{ textAlign: "center", padding: "2.5rem 2rem", borderColor: "rgba(52,211,153,0.3)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.25rem" }}>✅</div>
        <h2 style={{ marginBottom: "0.5rem" }}>Report submitted</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Your device has been blacklisted across the SimTrace network and all partner telecoms and marketplaces.
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Case details</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {[
              ["Case ID",    success.reportId || "—"],
              ["IMEI",      form.imei.replace(/\D/g,"")],
              ["Status",    "Open — monitoring active"],
              ["Filed",     new Date().toLocaleDateString("en-KE", { day:"numeric", month:"long", year:"numeric" })],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--muted)", minWidth: 80 }}>{k}</span>
                <span style={{ color: "var(--text)", fontFamily: k === "Case ID" || k === "IMEI" ? "var(--mono)" : "inherit", fontWeight: k === "Case ID" ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: "var(--dim)", fontSize: "0.82rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Share the Case ID with DCI or your police station. You'll be notified by SMS and email if the device is located.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => router.push("/devices")}>My Devices</button>
          <Link href="/alerts" style={{ display: "inline-flex", alignItems: "center", padding: "0.6rem 1.25rem", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--text2)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
            View Alerts
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <Link href="/devices" style={{ color: "var(--muted)", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.75rem" }}>
          ← My Devices
        </Link>
        <h1 style={{ marginBottom: "0.35rem" }}>Report Stolen Device</h1>
        <p style={{ color: "var(--muted)" }}>
          This instantly blacklists the IMEI across SimTrace and alerts all partner telecoms and marketplaces.
        </p>
      </div>

      {/* Warning */}
      <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "var(--r)", padding: "0.85rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
        <p style={{ color: "var(--amber)", fontSize: "0.88rem", margin: 0, lineHeight: 1.6 }}>
          Only report a device you own that has been stolen. Filing a false report is a criminal offence under the Computer Misuse and Cybercrimes Act.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label className="label">IMEI number * <span style={{ color: "var(--dim)", fontWeight: 400 }}>— dial *#06# to find it</span></label>
            <input required placeholder="e.g. 356938035643809" inputMode="numeric" maxLength={17}
              value={form.imei} onChange={e => { setForm(p => ({...p, imei: e.target.value})); setError(""); }} />
          </div>
          <div>
            <label className="label">Description of theft *</label>
            <textarea rows={4} required placeholder="Describe when, where, and how your device was stolen. Include any identifiable details." style={{ resize: "vertical" }}
              value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          </div>
          <div>
            <label className="label">Police OB reference <span style={{ color: "var(--dim)", fontWeight: 400 }}>— if you have one</span></label>
            <input placeholder="e.g. OB/4721/2024" value={form.policeRef} onChange={e => setForm(p => ({...p, policeRef: e.target.value}))} />
          </div>

          {error && (
            <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,var(--rose),#e11d48)", color: "#fff", border: "none", borderRadius: "var(--r)", padding: "0.85rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {loading ? "⟳ Submitting report…" : "🚨 Submit Theft Report"}
          </button>
        </form>
      </div>

      {/* What happens next */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>What happens after you submit</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            ["Immediately", "IMEI blacklisted across SimTrace network and 47 partner operators"],
            ["Within 1 min", "Marketplace partners (Jiji, Jumia, OLX) notified to block resale listings"],
            ["Within 5 min", "Law enforcement portal updated — DCI can see the device location"],
            ["Ongoing",      "You'll receive SMS/email alerts whenever the stolen device is detected"],
          ].map(([time, action]) => (
            <div key={time} style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--sky)", minWidth: 90, fontWeight: 600, flexShrink: 0 }}>{time}</span>
              <span style={{ color: "var(--text2)" }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ padding:"2rem", color:"var(--muted)", textAlign:"center" }}>Loading…</div>}>
      <ReportPageInner />
    </Suspense>
  );
}
