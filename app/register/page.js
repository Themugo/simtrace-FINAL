"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";

const STEPS = ["Account", "Security", "Done"];

export default function RegisterPage() {
  const { register }  = useAuth();
  const router        = useRouter();
  const [step,    setStep]    = useState(0); // 0=account 1=security
  const [form,    setForm]    = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const f = k => ({ value: form[k], onChange: e => { setForm(p => ({ ...p, [k]: e.target.value })); setError(""); } });

  function next(e) {
    e.preventDefault();
    if (!form.name.trim())  { setError("Please enter your name"); return; }
    if (!form.email.trim()) { setError("Please enter your email"); return; }
    setStep(1);
  }

  async function submit(e) {
    e.preventDefault();
    if (form.password.length < 8)        { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirm)  { setError("Passwords don't match"); return; }
    setLoading(true); setError("");
    try {
      await register(form.name, form.email, form.password, form.phone);
      setStep(2);
      setTimeout(() => router.push("/devices"), 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <SimTraceLogo size={48} showText={false} />
          <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>Create your account</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Start protecting your devices — free forever</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "2rem" }}>
          {STEPS.slice(0,2).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? "linear-gradient(90deg,var(--sky-dim),var(--indigo-dim))" : "var(--border2)", transition: "background 0.3s" }} />
          ))}
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)", animation: "scaleIn 0.2s ease" }}>
          {/* Step 0 — Account info */}
          {step === 0 && (
            <form onSubmit={next} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Full name *</label>
                <input required autoFocus placeholder="Jane Kamau" {...f("name")} />
              </div>
              <div>
                <label className="label">Email address *</label>
                <input type="email" required placeholder="jane@example.com" {...f("email")} />
              </div>
              <div>
                <label className="label">Mobile number <span style={{ color: "var(--dim)", fontWeight: 400 }}>— for SMS theft alerts</span></label>
                <input type="tel" placeholder="+254 712 345 678" {...f("phone")} />
              </div>
              {error && <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>{error}</div>}
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", height: 46 }}>
                Continue →
              </button>
            </form>
          )}

          {/* Step 1 — Password */}
          {step === 1 && (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button type="button" onClick={() => { setStep(0); setError(""); }}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.85rem", padding: 0, cursor: "pointer", textAlign: "left", alignSelf: "flex-start" }}>
                ← {form.name}
              </button>
              <div>
                <label className="label">Create password *</label>
                <input type="password" required autoFocus placeholder="Minimum 8 characters" {...f("password")} />
                {/* Strength indicator */}
                {form.password.length > 0 && (
                  <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                    {[1,2,3,4].map(i => {
                      const strength = form.password.length >= 12 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[^a-zA-Z0-9]/.test(form.password) ? 4
                        : form.password.length >= 10 && /[A-Z]/.test(form.password) ? 3
                        : form.password.length >= 8 ? 2 : 1;
                      const color = strength >= 3 ? "var(--emerald)" : strength === 2 ? "var(--amber)" : "var(--rose)";
                      return <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= strength ? color : "var(--border2)", transition: "background 0.2s" }} />;
                    })}
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)", marginLeft: 4 }}>
                      {form.password.length >= 12 ? "Strong" : form.password.length >= 8 ? "Good" : "Weak"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm password *</label>
                <input type="password" required placeholder="Same password again" {...f("confirm")} />
              </div>
              {error && <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>{error}</div>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", height: 46 }}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--dim)", textAlign: "center", lineHeight: 1.5 }}>
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}

          {/* Step 2 — Done */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
              <h2 style={{ marginBottom: "0.4rem" }}>Welcome to SimTrace!</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                Your account is ready. Redirecting to your devices…
              </p>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,var(--sky),var(--indigo))", animation: "fill 1.5s linear forwards", width: "0%" }} />
              </div>
              <style>{`@keyframes fill { to { width: 100% } }`}</style>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.25rem", color: "var(--muted)", fontSize: "0.88rem" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--sky)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
