"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SimTraceLogo from "../components/SimTraceLogo";
import { api } from "../lib/api";

interface Feature {
  icon: string;
  label: string;
  desc: string;
  color: string;
  href: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
}

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

const FEATURES: Feature[] = [
  { icon:"🛡️", label:"SIM Swap Detection",  desc:"Instant alert the moment a SIM card is swapped in any protected device.", color:"var(--sky)", href:"/alerts" },
  { icon:"📡", label:"Live GPS Tracking",   desc:"Precise location every 30s. Works even on stolen devices.", color:"var(--emerald)", href:"/devices" },
  { icon:"🔒", label:"Remote Lockdown",     desc:"One click to lock the screen of a stolen device remotely.", color:"var(--rose)", href:"/remote-lock" },
  { icon:"📸", label:"Evidence Capture",    desc:"Silent front-camera capture and upload from the stolen device.", color:"var(--violet)", href:"/evidence" },
  { icon:"👥", label:"Community Detection", desc:"Community members help spot stolen devices in their area.", color:"var(--amber)", href:"/community" },
  { icon:"💰", label:"Fraud Protection",    desc:"AI stops IMEI cloning, carrier fraud and financial scams.", color:"var(--indigo)", href:"/imei" },
  { icon:"🏛️", label:"Police Network",      desc:"File police reports and share recovery cases through law-enforcement workflows.", color:"var(--sky)", href:"/law-enforcement" },
];

const TESTIMONIALS: Testimonial[] = [
  { name:"1. Register & protect", role:"Setup",        text:"Add your devices by IMEI. SimTrace watches for SIM swaps and location changes and alerts you the moment something looks wrong.", avatar:"1" },
  { name:"2. Report & lock",      role:"If it's lost", text:"Report a device as lost or stolen, lock it remotely, and capture evidence from the device to support recovery.", avatar:"2" },
  { name:"3. Locate & recover",   role:"Get it back",  text:"Track the device's last-known location and file a police report with the case details needed to help recover it.", avatar:"3" },
];

function AnimatedCounter({ target, suffix = "", duration = 2000 }: AnimatedCounterProps) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setVal(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [imei,    setImei]    = useState("");
  const [error,   setError]   = useState("");
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get("/api/devices/public-stats").then(setStats).catch(() => {});
  }, []);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const clean = imei.replace(/\D/g, "");
    if (clean.length < 15 || clean.length > 17) {
      setError("IMEI must be 15–17 digits. Dial *#06# on your phone to find it."); return;
    }
    setLoading(true);
    router.push(`/imei?q=${clean}`);
  }

  return (
    <div style={{ overflow: "hidden" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "4rem 1rem 3rem", position: "relative" }}>
        {/* Glow orbs behind hero */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse at center, rgba(56,189,248,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 100, left: "20%", width: 300, height: 300, background: "radial-gradient(ellipse at center, rgba(129,140,248,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20, padding: "4px 16px", marginBottom: "1.5rem", fontSize: "0.82rem", color: "var(--sky)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", display: "inline-block", animation: "pulse 2s infinite" }} />
            Live — {stats ? (stats.total ?? 0).toLocaleString() : "…"} devices protected
          </div>

          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <SimTraceLogo size={90} showText={false} />
          </div>

          {/* Wordmark */}
          <h1 style={{ fontSize: "clamp(2.8rem,8vw,5rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.5rem" }}>
            SIM<span style={{ background: "linear-gradient(135deg, var(--sky), var(--indigo))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>TRACE</span>
            <sup style={{ fontSize: "0.25em", color: "var(--dim)", verticalAlign: "super", WebkitTextFillColor: "var(--dim)" }}>™</sup>
          </h1>
          <div style={{ fontSize: "clamp(0.75rem,2vw,0.9rem)", letterSpacing: "0.3em", color: "var(--muted)", marginBottom: "1.25rem" }}>
            CONNECT · PROTECT · RECOVER
          </div>

          <p style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", color: "var(--text2)", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            The Global Smart Network That <strong style={{ color: "var(--text)", fontWeight: 700 }}>Fights Theft</strong>,
            Protects People, and <strong style={{ color: "var(--sky)", fontWeight: 700 }}>Brings Devices Home.</strong>
          </p>

          {/* IMEI Quick Check */}
          <form onSubmit={handleCheck} style={{ display: "flex", gap: "0.6rem", maxWidth: 520, margin: "0 auto 0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ flex: 1, minWidth: 250, position: "relative" }}>
              <input
                value={imei}
                onChange={e => { setImei(e.target.value); setError(""); }}
                placeholder="Enter IMEI — dial *#06# to find it"
                inputMode="numeric" maxLength={17}
                style={{ paddingLeft: "2.75rem", fontSize: "1rem", height: 50, border: "1px solid var(--border2)", background: "var(--surface)" }}
              />
              <span style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }}>🔍</span>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ height: 50, padding: "0 1.75rem", fontSize: "0.95rem", whiteSpace: "nowrap" }}>
              {loading ? "⟳" : "Check IMEI"}
            </button>
          </form>
          {error && <p style={{ color: "var(--rose)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{error}</p>}
          <p style={{ color: "var(--dim)", fontSize: "0.78rem", marginTop: "0.5rem" }}>
            Free · No account required · Results in under 1 second
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem" }}>
            <Link href="/register" className="btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem", textDecoration: "none" }}>
              Get Started Free →
            </Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1.75rem", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: "var(--r)", color: "var(--text2)", fontWeight: 600, textDecoration: "none", fontSize: "0.95rem" }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7 FEATURE ICONS (matches brand image) ────────────────────────── */}
      <section style={{ padding: "0 0 3rem" }}>
        <div className="feature-icon-grid">
          {FEATURES.map(f => (
            <Link key={f.label} href={f.href} style={{ textDecoration: "none", textAlign: "center", padding: "1rem 0.4rem", borderRadius: "var(--r-lg)", transition: "background 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "var(--surface)"}
              onMouseOut={e  => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", margin: "0 auto 0.6rem", boxShadow: `0 0 16px ${f.color}10` }}>
                {f.icon}
              </div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text2)", letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.3 }}>{f.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ANIMATED STATS ───────────────────────────────────────────────── */}
      <section className="stat-grid" style={{ marginBottom: "4rem" }}>
        {[
          [stats?.total ?? 0,           "",   "Devices Protected", "var(--sky)"],
          [stats?.openReports ?? 0,     "",   "Active Cases",      "var(--rose)"],
          [stats?.recovered ?? 0,       "",   "Devices Recovered", "var(--emerald)"],
          [stats?.telecomPartners ?? 0, "+",  "Telecom Partners",  "var(--amber)"],
        ].map(([n,s,l,c]) => (
          <div key={l as string} style={{ background: "var(--bg2)", padding: "1.75rem 1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: c, marginBottom: 4 }}>
              <AnimatedCounter target={n as number} suffix={s as string} />
            </div>
            <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 500 }}>{l as string}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURE CARDS ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", marginBottom: "0.5rem" }}>
            Everything you need to <span className="grad-text">protect your devices</span>
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 520, margin: "0 auto" }}>
            From SIM swap alerts to law enforcement integration — all in one platform.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1rem" }}>
          {FEATURES.map(f => (
            <Link key={f.label} href={f.href} className="card card-glow" style={{ display: "block", textDecoration: "none", borderLeft: `3px solid ${f.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--r)", background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: "0.35rem", color: "var(--text)" }}>{f.label}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "4rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(1.3rem,3vw,1.8rem)", marginBottom: "0.5rem" }}>
          How recovery works
        </h2>
        <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "2rem" }}>From setup to recovery — what SimTrace does at each stage</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem" }}>
          {TESTIMONIALS.map((t,i) => (
            <div key={i} className="card" style={{ position: "relative" }}>
              <p style={{ color: "var(--text2)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1rem" }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,var(--sky-dim),var(--indigo-dim))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.82rem", color: "#fff", flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{t.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ───────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.06), rgba(129,140,248,0.06))", border: "1px solid rgba(56,189,248,0.15)", borderRadius: "var(--r-xl)", padding: "3rem 2rem", textAlign: "center", marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <SimTraceLogo size={52} showText={false} />
        <h2 style={{ margin: "1.25rem 0 0.6rem", fontSize: "clamp(1.3rem,3vw,1.8rem)" }}>
          Start protecting your devices today
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", maxWidth: 420, margin: "0 auto 2rem" }}>
          Free plan includes 2 devices. No credit card required. Takes 60 seconds to set up.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" className="btn-primary" style={{ padding: "0.85rem 2.25rem", fontSize: "1rem", textDecoration: "none" }}>
            Create Free Account
          </Link>
          <Link href="/telecom-portal" style={{ display: "inline-flex", alignItems: "center", padding: "0.85rem 2rem", background: "transparent", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "var(--r)", color: "var(--amber)", fontWeight: 600, textDecoration: "none", fontSize: "0.95rem" }}>
            📶 Telecom Partners →
          </Link>
        </div>
      </section>
    </div>
  );
}
