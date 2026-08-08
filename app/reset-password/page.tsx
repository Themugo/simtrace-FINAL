"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SimTraceLogo from "../../components/SimTraceLogo";
import PasswordInput from "../../components/PasswordInput";
import { saveToken } from "../../lib/api";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get("token");

  const [form,    setForm]    = useState({ newPassword: "", confirm: "" });
  const [step,    setStep]    = useState("form"); // form | success | invalid
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || token.length !== 64) setStep("invalid");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError("Passwords don't match"); return; }
    if (form.newPassword.length < 8)       { setError("Password must be at least 8 characters"); return; }

    setLoading(true); setError("");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res  = await fetch(`${BASE}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }

      // Auto-login: save token and redirect
      if (data.token) saveToken(data.token);
      setStep("success");
      setTimeout(() => router.push("/devices"), 2500);
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <SimTraceLogo size={48} showText={false} />
        <h1 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>
          {step === "invalid" ? "Invalid link" : step === "success" ? "Password reset!" : "Set new password"}
        </h1>
      </div>

      {step === "invalid" && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>❌</div>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            This reset link is invalid or has expired. Reset links are only valid for 1 hour.
          </p>
          <Link href="/forgot-password" className="btn-primary" style={{ display: "inline-block", padding: "0.65rem 1.5rem", textDecoration: "none" }}>
            Request new link
          </Link>
        </div>
      )}

      {step === "success" && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
          <h2 style={{ marginBottom: "0.5rem" }}>Password updated!</h2>
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            You're now logged in. Redirecting to your devices…
          </p>
          <div style={{ width: "100%", height: 4, background: "var(--surface)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,var(--sky),var(--indigo))", animation: "fill 2.5s linear forwards" }} />
          </div>
          <style>{`@keyframes fill { from { width: 0 } to { width: 100% } }`}</style>
        </div>
      )}

      {step === "form" && (
        <div className="card">
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
            Choose a strong password with at least 8 characters.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">New password</label>
              <PasswordInput
                required
                minLength={8}
                placeholder="Min 8 characters"
                value={form.newPassword}
                onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <PasswordInput
                required
                placeholder="Same password again"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting…" : "Set New Password"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/login" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              ← Back to login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
