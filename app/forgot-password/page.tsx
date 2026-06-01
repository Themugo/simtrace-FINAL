"use client";
import { useState } from "react";
import Link from "next/link";
import SimTraceLogo from "../../components/SimTraceLogo";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${BASE}/api/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      // Always show success to avoid user enumeration
      setSent(true);
    } catch {
      setSent(true); // show success regardless
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <SimTraceLogo size={48} showText={false} />
        <h1 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>Reset Password</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
          Enter your email and we'll send a reset link
        </p>
      </div>

      {sent ? (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📬</div>
          <h2 style={{ marginBottom: "0.5rem" }}>Check your email</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            If <strong>{email}</strong> is registered, you'll receive a password reset link within a few minutes.
            Check your spam folder if you don't see it.
          </p>
          <Link href="/login" style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--sky)", fontSize: "0.88rem" }}>
            ← Back to login
          </Link>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center" }}>
              <Link href="/login" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
