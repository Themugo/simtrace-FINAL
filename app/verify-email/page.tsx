"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SimTraceLogo from "../../components/SimTraceLogo";

function VerifyForm() {
  const params = useSearchParams();
  const token  = params.get("token");
  const [step, setStep] = useState<"loading" | "success" | "invalid">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || token.length !== 64) { setStep("invalid"); setError("Missing or malformed verification link."); return; }

    const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Verification failed"); setStep("invalid"); return; }
        setStep("success");
      })
      .catch(() => { setError("Could not connect. Please try again."); setStep("invalid"); });
  }, [token]);

  return (
    <div style={{ maxWidth: 420, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <SimTraceLogo size={48} showText={false} />
        <h1 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>
          {step === "loading" ? "Verifying…" : step === "success" ? "Email verified!" : "Verification failed"}
        </h1>
      </div>

      {step === "loading" && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{
            width: 40, height: 40, margin: "0 auto", borderRadius: "50%",
            border: "3px solid var(--border2)", borderTopColor: "var(--sky)",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {step === "success" && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Your email address is confirmed. You're all set.
          </p>
          <Link href="/devices" className="btn-primary" style={{ display: "inline-block", padding: "0.65rem 1.5rem", textDecoration: "none" }}>
            Go to your devices →
          </Link>
        </div>
      )}

      {step === "invalid" && (
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>❌</div>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {error || "This verification link is invalid or has expired."} Verification links are valid for 24 hours.
          </p>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
            You can request a new link from your profile once you're signed in.
          </p>
          <Link href="/login" style={{ color: "var(--sky)", fontWeight: 600, fontSize: "0.9rem" }}>
            ← Back to login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>Loading…</div>}>
      <VerifyForm />
    </Suspense>
  );
}
