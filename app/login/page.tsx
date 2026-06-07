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
  const [showPassword, setShowPassword] = useState(false);

  function f(key: keyof typeof form) {
    return { value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value })) };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Role-based routing
      if (user.role === "admin" || user.role === "super_admin") {
        router.push("/dashboard");
      } else if (user.role === "telecom") {
        router.push("/telecom-portal");
      } else if (user.role === "law_enforcement") {
        router.push("/law-enforcement");
      } else {
        router.push("/devices");
      }
    } catch (err: any) {
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
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  {...f("password")} 
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: "absolute", 
                    right: "12px", 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    color: "var(--muted)",
                    fontSize: "1.2rem"
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
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
      </div>
    </div>
  );
}
