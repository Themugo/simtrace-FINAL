"use client";
import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";

interface Placement {
  id: string;
  icon: string;
  label: string;
  desc: string;
  reach: string;
  cpc: string;
}

const PLACEMENTS: Placement[] = [
  { id:"dashboard_banner", icon:"🗺️", label:"Dashboard Banner",    desc:"Top of the admin command centre — maximum exposure", reach:"~5,000 daily", cpc:"KES 10" },
  { id:"imei_sidebar",     icon:"🔍", label:"IMEI Check Sidebar",  desc:"Shown beside every IMEI result — intent-driven audience", reach:"~12,000 daily", cpc:"KES 5" },
  { id:"devices_footer",   icon:"📱", label:"Devices Page Footer", desc:"Shown to device owners managing their inventory", reach:"~3,000 daily", cpc:"KES 8" },
  { id:"alert_feed",       icon:"🔔", label:"Alert Feed",          desc:"Native placement in the live security alert feed", reach:"~1,500 daily", cpc:"KES 6" },
];

const AUDIENCE_STATS = [
  ["50K+",  "Monthly active users"],
  ["12K",   "Daily IMEI checks"],
  ["47",    "Telecom partner integrations"],
  ["KES 5", "Minimum cost per click"],
];

const STEPS = ["Placement", "Creative", "Budget", "Review"];

interface AdForm {
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  placement: string;
  budgetKES: number;
  cpcKES: number;
}

export default function AdvertisePage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const toast      = useToast();
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState<AdForm>({
    title:"", body:"", ctaText:"Learn More", ctaUrl:"",
    placement:"imei_sidebar", budgetKES:5000, cpcKES:5,
  });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState<any>(null);

  const f  = (k: keyof AdForm) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value })) });
  const pl = PLACEMENTS.find(p => p.id === form.placement);
  const estClicks = Math.floor(form.budgetKES / (form.cpcKES || 1));

  async function submit() {
    setLoading(true);
    try {
      const res = await api.post("/api/ads", {
        ...form, budgetKES: Number(form.budgetKES), cpcKES: Number(form.cpcKES),
      });
      setDone(res);
      toast?.add("Campaign submitted for review! We'll activate it within 24 hours.", "success", 8000);
    } catch (err: any) {
      toast?.add(err.message, "danger");
    } finally { setLoading(false); }
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ maxWidth:600, margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:"3rem" }}>
        <div style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>📢</div>
        <h1 style={{ marginBottom:"0.5rem" }}>Advertise on SimTrace</h1>
        <p className="text-muted" style={{ maxWidth:420, margin:"0 auto 2rem" }}>
          Reach device owners, IT managers, and security professionals across Kenya and East Africa.
        </p>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
          <button className="btn-primary" onClick={() => router.push("/register")}>Create free account</button>
          <Link href="/login" style={{ display:"inline-flex", alignItems:"center", padding:"0.65rem 1.25rem", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:"var(--r)", color:"var(--text2)", fontWeight:600, textDecoration:"none", fontSize:"0.9rem" }}>
            Sign in
          </Link>
        </div>
      </div>
      <div className="grid-2">
        {AUDIENCE_STATS.map(([v,l]) => (
          <div key={l} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"1.8rem", fontWeight:900, color:"var(--sky)", marginBottom:4 }}>{v}</div>
            <div className="text-muted" style={{ fontSize:"0.82rem" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Done state ─────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ maxWidth:520, margin:"2rem auto" }}>
      <div className="card" style={{ textAlign:"center", padding:"2.5rem 2rem", borderColor:"rgba(52,211,153,0.3)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem", margin:"0 auto 1.25rem" }}>🎉</div>
        <h2 style={{ marginBottom:"0.5rem" }}>Campaign submitted!</h2>
        <p className="text-muted" style={{ marginBottom:"1.5rem", lineHeight:1.7 }}>
          Your campaign is under review. We typically approve within 24 hours and you'll receive an email confirmation.
        </p>
        <div className="card-surface" style={{ marginBottom:"1.5rem", textAlign:"left" }}>
          {[
            ["Campaign",   form.title],
            ["Placement",  pl?.label],
            ["Budget",     `KES ${Number(form.budgetKES).toLocaleString()}`],
            ["Est. clicks",estClicks.toLocaleString()],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"0.4rem 0", borderBottom:"1px solid var(--border)", fontSize:"0.88rem" }}>
              <span className="text-muted">{k}</span>
              <span style={{ color:"var(--text)", fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
          <Link href="/my-campaigns" className="btn-primary" style={{ textDecoration:"none" }}>View My Campaigns</Link>
          <button className="btn-ghost" onClick={() => { setDone(null); setStep(0); setForm({ title:"", body:"", ctaText:"Learn More", ctaUrl:"", placement:"imei_sidebar", budgetKES:5000, cpcKES:5 }); }}>
            New Campaign
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:720, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ marginBottom:"0.35rem" }}>Advertise on SimTrace</h1>
        <p className="text-muted">Reach 50,000+ monthly device owners, IT managers, and security professionals.</p>
      </div>

      {/* Audience stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.6rem", marginBottom:"2rem" }}>
        {AUDIENCE_STATS.map(([v,l]) => (
          <div key={l} className="stat-card" style={{ "--accent":"var(--sky)", textAlign:"center" }}>
            <div style={{ fontSize:"1.4rem", fontWeight:900, color:"var(--sky)" }}>{v}</div>
            <div className="text-muted" style={{ fontSize:"0.75rem", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ display:"flex", gap:"0.3rem", marginBottom:"2rem" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:3, borderRadius:3, background: i <= step ? "linear-gradient(90deg,var(--sky-dim),var(--indigo-dim))" : "var(--border)", marginBottom:6, transition:"background 0.3s" }} />
            <div style={{ fontSize:"0.7rem", color: i === step ? "var(--sky)" : "var(--muted)", fontWeight: i === step ? 700 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ── Step 0: Placement ── */}
      {step === 0 && (
        <div>
          <h2 style={{ marginBottom:"1rem" }}>Choose ad placement</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", marginBottom:"1.5rem" }}>
            {PLACEMENTS.map(p => (
              <div key={p.id} onClick={() => setForm(f => ({ ...f, placement: p.id }))}
                style={{ background:"var(--bg2)", border:`2px solid ${form.placement===p.id?"var(--sky)":"var(--border)"}`, borderRadius:"var(--r-lg)", padding:"1rem 1.25rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"1rem", transition:"border-color 0.15s" }}>
                <div style={{ width:44, height:44, borderRadius:"var(--r)", background:`${form.placement===p.id?"rgba(56,189,248,0.15)":"var(--surface)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0, transition:"background 0.15s" }}>
                  {p.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, marginBottom:2 }}>{p.label}</div>
                  <div style={{ fontSize:"0.83rem", color:"var(--muted)" }}>{p.desc}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:"0.82rem", color:"var(--sky)", fontWeight:600 }}>{p.reach}</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--dim)" }}>from {p.cpc}</div>
                </div>
                {form.placement === p.id && (
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"var(--sky)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"0.7rem", color:"#fff", fontWeight:700 }}>✓</div>
                )}
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setStep(1)}>Next: Create ad →</button>
        </div>
      )}

      {/* ── Step 1: Creative ── */}
      {step === 1 && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", alignItems:"start" }}>
            <div>
              <h2 style={{ marginBottom:"1rem" }}>Write your ad</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                <div>
                  <label className="label">Headline * <span style={{ color:"var(--dim)", fontWeight:400 }}>max 80 chars</span></label>
                  <input maxLength={80} placeholder="Insure your device for KES 99/mo" {...f("title")} />
                  <div style={{ fontSize:"0.7rem", color: form.title.length > 70 ? "var(--amber)" : "var(--dim)", marginTop:3 }}>{form.title.length}/80</div>
                </div>
                <div>
                  <label className="label">Body text * <span style={{ color:"var(--dim)", fontWeight:400 }}>max 200 chars</span></label>
                  <textarea rows={3} maxLength={200} style={{ resize:"none" }} placeholder="Get instant IMEI-linked insurance from just KES 99/month. Claims in 24 hours." {...f("body")} />
                  <div style={{ fontSize:"0.7rem", color: form.body.length > 180 ? "var(--amber)" : "var(--dim)", marginTop:3 }}>{form.body.length}/200</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <div>
                    <label className="label">Button text</label>
                    <input maxLength={30} placeholder="Learn More" {...f("ctaText")} />
                  </div>
                  <div>
                    <label className="label">Landing URL *</label>
                    <input type="url" placeholder="https://yoursite.com" {...f("ctaUrl")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h2 style={{ marginBottom:"1rem", color:"var(--muted)", fontSize:"0.85rem", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>Live Preview</h2>
              <div style={{ background:"var(--bg)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"var(--r-lg)", padding:"1rem", position:"sticky", top:80 }}>
                <div style={{ fontSize:"0.65rem", color:"var(--dim)", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.1em" }}>Ad · {pl?.label}</div>
                <div style={{ fontWeight:700, marginBottom:"0.35rem", color: form.title ? "var(--text)" : "var(--muted)" }}>
                  {form.title || "Your headline here"}
                </div>
                <div style={{ fontSize:"0.85rem", color: form.body ? "var(--text2)" : "var(--muted)", marginBottom:"0.75rem", lineHeight:1.5 }}>
                  {form.body || "Your ad body text will appear here"}
                </div>
                <span style={{ display:"inline-block", background:"rgba(56,189,248,0.1)", color:"var(--sky)", fontSize:"0.8rem", padding:"4px 14px", borderRadius:20, fontWeight:600, border:"1px solid rgba(56,189,248,0.2)" }}>
                  {form.ctaText || "Learn More"} →
                </span>
                <div style={{ marginTop:"0.75rem", fontSize:"0.72rem", color:"var(--dim)" }}>
                  Reaches {pl?.reach} · {pl?.cpc} suggested
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1.5rem" }}>
            <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
            <button className="btn-primary" onClick={() => setStep(2)} disabled={!form.title || !form.body || !form.ctaUrl}>
              Next: Budget →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Budget ── */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom:"1rem" }}>Set your budget</h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem", marginBottom:"1.25rem" }}>
            <div>
              <label className="label">Total budget (KES) *</label>
              <input type="number" min={500} step={500} {...f("budgetKES")} />
              <div style={{ fontSize:"0.72rem", color:"var(--dim)", marginTop:3 }}>Minimum KES 500 · No expiry</div>
            </div>
            <div>
              <label className="label">Cost per click (KES)</label>
              <input type="number" min={1} max={100} step={1} {...f("cpcKES")} />
              <div style={{ fontSize:"0.72rem", color:"var(--dim)", marginTop:3 }}>Higher CPC = more delivery priority</div>
            </div>
          </div>

          {/* Estimate */}
          <div className="card" style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontSize:"0.72rem", color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.85rem" }}>Estimated results</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem" }}>
              {[
                ["Total budget",    `KES ${Number(form.budgetKES||0).toLocaleString()}`, "var(--amber)"],
                ["Est. clicks",     estClicks.toLocaleString(),                           "var(--sky)"],
                ["Placement",       pl?.label,                                            "var(--text2)"],
              ].map(([k,v,c]) => (
                <div key={k} style={{ background:"var(--bg)", borderRadius:"var(--r)", padding:"0.65rem 0.85rem" }}>
                  <div style={{ fontSize:"0.68rem", color:"var(--muted)", marginBottom:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k}</div>
                  <div style={{ fontWeight:700, color:c, fontSize:"0.92rem" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" onClick={() => setStep(3)} disabled={Number(form.budgetKES) < 500}>
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ── */}
      {step === 3 && (
        <div>
          <h2 style={{ marginBottom:"1rem" }}>Review your campaign</h2>
          <div className="card" style={{ marginBottom:"1.25rem" }}>
            {[
              ["Placement",    pl?.label],
              ["Headline",     form.title],
              ["Body",         form.body],
              ["CTA",          `${form.ctaText} → ${form.ctaUrl}`],
              ["Budget",       `KES ${Number(form.budgetKES).toLocaleString()}`],
              ["CPC",          `KES ${form.cpcKES}`],
              ["Est. clicks",  estClicks.toLocaleString()],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", gap:"1rem", padding:"0.55rem 0", borderBottom:"1px solid var(--border)", fontSize:"0.88rem" }}>
                <span style={{ color:"var(--muted)", minWidth:90, flexShrink:0 }}>{k}</span>
                <span style={{ color:"var(--text)", wordBreak:"break-word" }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:"0.82rem", color:"var(--dim)", marginBottom:"1.25rem", lineHeight:1.6 }}>
            Campaigns are reviewed within 24 hours. You'll receive an email when your ad goes live. By submitting you agree to our advertising policy.
          </p>
          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" onClick={submit} disabled={loading} style={{ flex:1, justifyContent:"center" }}>
              {loading ? "⟳ Submitting…" : "Submit Campaign"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
