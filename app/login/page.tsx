"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";
import PasswordInput from "../../components/PasswordInput";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Mode: "email_pass" | "sms_pass" | "sms_otp"
  const [authMode, setAuthMode] = useState<"email_pass" | "sms_pass" | "sms_otp">("email_pass");
  const [countryCode, setCountryCode] = useState("+254");
  const [form, setForm] = useState({ identifier: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  function f(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatusMsg("");
    setLoading(true);

    try {
      if (authMode === "sms_otp") {
        if (!otpSent) {
          if (!form.identifier.trim()) {
            setError("Please enter your mobile phone number");
            setLoading(false);
            return;
          }
          // Simulate SMS OTP delivery
          setOtpSent(true);
          setStatusMsg(`📲 SMS OTP passcode sent to ${countryCode} ${form.identifier}! Use demo OTP: 938104`);
          setLoading(false);
          return;
        }

        if (form.otp.length < 4) {
          setError("Please enter the 6-digit SMS OTP code");
          setLoading(false);
          return;
        }

        // Verify SMS OTP and sign in
        const formattedPhone = `${countryCode}${form.identifier.replace(/^0+/, "")}`;
        const user = await login(formattedPhone, "DemoPassword123!");
        router.push(user.role === "admin" ? "/dashboard" : "/devices");
        return;
      }

      // Email or SMS with Password
      let id = form.identifier;
      if (authMode === "sms_pass") {
        id = `${countryCode}${form.identifier.replace(/^0+/, "")}`;
      }

      const user = await login(id, form.password);
      router.push(user.role === "admin" ? "/dashboard" : "/devices");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <SimTraceLogo size={52} showText={false} />
          <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem", fontSize: "1.75rem" }}>Welcome back</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Sign in to your SimTrace account</p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* TABS: Email vs SMS vs SMS OTP */}
          <div style={{ display: "flex", gap: "0.3rem", background: "var(--surface)", padding: 4, borderRadius: "var(--r)", border: "1px solid var(--border)", marginBottom: "1.25rem" }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode("email_pass");
                setError("");
                setOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "0.55rem 0.4rem",
                borderRadius: "calc(var(--r) - 2px)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                background: authMode === "email_pass" ? "var(--card)" : "transparent",
                color: authMode === "email_pass" ? "var(--sky)" : "var(--muted)",
                boxShadow: authMode === "email_pass" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              📧 Email
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("sms_pass");
                setError("");
                setOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "0.55rem 0.4rem",
                borderRadius: "calc(var(--r) - 2px)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                background: authMode === "sms_pass" ? "var(--card)" : "transparent",
                color: authMode === "sms_pass" ? "var(--sky)" : "var(--muted)",
                boxShadow: authMode === "sms_pass" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              📱 SMS Phone
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("sms_otp");
                setError("");
                setOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "0.55rem 0.4rem",
                borderRadius: "calc(var(--r) - 2px)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 700,
                background: authMode === "sms_otp" ? "var(--card)" : "transparent",
                color: authMode === "sms_otp" ? "var(--sky)" : "var(--muted)",
                boxShadow: authMode === "sms_otp" ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              ⚡ SMS OTP
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {authMode === "email_pass" && (
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="you@example.com"
                  {...f("identifier")}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
                />
              </div>
            )}

            {(authMode === "sms_pass" || authMode === "sms_otp") && (
              <div>
                <label className="label">Mobile Phone Number (SMS)</label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    style={{ width: 105, padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)" }}
                  >
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+255">🇹ℤ +255</option>
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+91">🇮🇳 +91</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="712 345 678"
                    {...f("identifier")}
                    style={{ flex: 1, padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
                  />
                </div>
              </div>
            )}

            {authMode !== "sms_otp" && (
              <div>
                <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                  Password
                  <Link href="/forgot-password" style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 400 }}>
                    Forgot password?
                  </Link>
                </label>
                <PasswordInput required placeholder="••••••••" {...f("password")} />
              </div>
            )}

            {authMode === "sms_otp" && otpSent && (
              <div>
                <label className="label">6-Digit SMS Passcode</label>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="938104"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    style={{ flex: 1, letterSpacing: "0.25em", fontSize: "1.1rem", fontWeight: 800, textAlign: "center", padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, otp: "938104" })}
                    className="btn-ghost"
                    style={{ padding: "0 0.75rem", fontSize: "0.78rem" }}
                  >
                    Demo OTP
                  </button>
                </div>
              </div>
            )}

            {statusMsg && (
              <div style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--sky)", fontSize: "0.85rem", fontWeight: 600 }}>
                {statusMsg}
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", height: 46, fontSize: "0.95rem" }}>
              {loading
                ? "Signing in…"
                : authMode === "sms_otp"
                ? otpSent
                  ? "Verify & Sign In →"
                  : "Send SMS Login Passcode 📲"
                : "Sign In →"}
            </button>
          </form>

          <hr className="divider" />

          <p style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--muted)" }}>
            Don't have an account? <Link href="/register" style={{ color: "var(--sky)", fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
