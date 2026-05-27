"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";

export default function LoginPage() {
  const { login }   = useAuth();
  const router      = useRouter();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function f(key) {
    return { value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push(user.role === "admin" ? "/dashboard" : "/devices");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <SimTraceLogo size={52} showText={false} />
          <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem" }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Sign in to your SimTrace account</p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Email address</label>
              <input type="email" required placeholder="you@example.com" {...f("email")} />
            </div>
            <div>
              <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                Password
                <Link href="/forgot-password" style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 400 }}>Forgot password?</Link>
              </label>
              <input type="password" required placeholder="••••••••" {...f("password")} />
            </div>

            {error && (
              <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", height: 46, fontSize: "0.95rem" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--muted)" }}>
            No account? <Link href="/register" style={{ color: "var(--sky)", fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>

        {/* Demo accounts hint */}
        <div style={{ marginTop: "1rem", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: "var(--r)", padding: "0.75rem 1rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--sky)", marginBottom: "0.3rem" }}>Demo accounts</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.6 }}>
            Admin: <span style={{ fontFamily: "var(--mono)", color: "var(--text2)" }}>admin@simtrace.site / Admin@2024!</span><br />
            User: <span style={{ fontFamily: "var(--mono)", color: "var(--text2)" }}>jane@demo.simtrace.site / Demo@2024!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
