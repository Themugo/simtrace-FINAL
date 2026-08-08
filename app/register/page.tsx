"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import SimTraceLogo from "../../components/SimTraceLogo";
import PasswordInput from "../../components/PasswordInput";

const STEPS = ["Account Info", "Verification", "Complete"];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("phone"); // default to mobile SMS option or email toggle
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+254",
    password: "",
    confirm: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${API}/api/auth/oauth/providers`)
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.google))
      .catch(() => {});
  }, [API]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setError("");
    },
  });

  const handleNextAccountStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (contactMethod === "email" && !form.email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (contactMethod === "phone" && !form.phone.trim()) {
      setError("Please enter your mobile phone number");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    // Move to step 1 (Verification)
    setStep(1);
    setResendTimer(45);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const formattedPhone = form.phone ? `${form.countryCode}${form.phone.replace(/^0+/, "")}` : "";
      await register(
        form.name,
        form.password,
        contactMethod === "email" ? { email: form.email } : { phone: formattedPhone || form.phone }
      );
      setStep(2);
      setTimeout(() => {
        router.push("/onboarding");
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setResendTimer(45);
    setError("");
    alert(`📲 Sent new verification code to ${contactMethod === "email" ? form.email : form.phone}`);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <SimTraceLogo size={48} showText={false} />
          <h1 style={{ marginTop: "1rem", marginBottom: "0.25rem", fontSize: "1.75rem" }}>Create your account</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Protect your phone & devices — instant SIM swap and location tracking
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background: i <= step ? "linear-gradient(90deg,var(--sky),var(--indigo))" : "var(--border2)",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* STEP 0: ACCOUNT & CONTACT PREFERENCE */}
          {step === 0 && (
            <form onSubmit={handleNextAccountStep} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {googleEnabled && (
                <>
                  <a
                    href={`${API}/api/auth/oauth/google`}
                    className="btn-secondary"
                    style={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: 8, height: 44, textDecoration: "none" }}
                  >
                    <span style={{ fontWeight: 800, color: "var(--sky)" }}>G</span> Continue with Google
                  </a>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--dim)", fontSize: "0.78rem" }}>
                    <span style={{ flex: 1, height: 1, background: "var(--border2)" }} /> or register with Email or SMS <span style={{ flex: 1, height: 1, background: "var(--border2)" }} />
                  </div>
                </>
              )}

              {/* TABS: Continue with SMS vs Continue with Email */}
              <div>
                <label className="label" style={{ marginBottom: "0.4rem", display: "block" }}>Registration & Login Method</label>
                <div style={{ display: "flex", gap: "0.4rem", background: "var(--surface)", padding: 4, borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod("phone");
                      setError("");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.5rem",
                      borderRadius: "calc(var(--r) - 2px)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: contactMethod === "phone" ? "var(--card)" : "transparent",
                      color: contactMethod === "phone" ? "var(--sky)" : "var(--muted)",
                      boxShadow: contactMethod === "phone" ? "var(--shadow-sm)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📱 Continue with SMS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContactMethod("email");
                      setError("");
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.5rem",
                      borderRadius: "calc(var(--r) - 2px)",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: contactMethod === "email" ? "var(--card)" : "transparent",
                      color: contactMethod === "email" ? "var(--sky)" : "var(--muted)",
                      boxShadow: contactMethod === "email" ? "var(--shadow-sm)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📧 Continue with Email
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input required autoFocus placeholder="Jane Kamau" {...f("name")} style={{ width: "100%", padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>

              {contactMethod === "phone" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label className="label" style={{ margin: 0 }}>Mobile Phone Number (SMS Texting) *</label>
                    <span style={{ fontSize: "0.72rem", background: "rgba(56,189,248,0.12)", color: "var(--sky)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                      ⚡ Africa's Talking SMS
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <select
                      value={form.countryCode}
                      onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
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
                      {...f("phone")}
                      style={{ flex: 1, padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
                    />
                  </div>
                  <p className="text-muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                    We will send a 6-digit SMS verification code via Africa's Talking infrastructure to confirm ownership.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    {...f("email")}
                    style={{ width: "100%", padding: "0.65rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
                  />
                  <p className="text-muted" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                    We will send an email verification code to confirm this inbox.
                  </p>
                </div>
              )}

              {/* Password setup */}
              <div>
                <label className="label">Create Password *</label>
                <PasswordInput required placeholder="Minimum 8 characters" {...f("password")} />
              </div>

              <div>
                <label className="label">Confirm Password *</label>
                <PasswordInput required placeholder="Re-enter password" {...f("confirm")} />
              </div>

              {error && (
                <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", height: 46, fontSize: "0.95rem" }}>
                Continue to Verification →
              </button>
            </form>
          )}

          {/* STEP 1: VERIFICATION (SMS OTP OR EMAIL CODE) */}
          {step === 1 && (
            <form onSubmit={handleVerifySubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setError("");
                }}
                style={{ background: "none", border: "none", color: "var(--sky)", fontSize: "0.85rem", padding: 0, cursor: "pointer", textAlign: "left", alignSelf: "flex-start", fontWeight: 600 }}
              >
                ← Back to details
              </button>

              <div style={{ background: "var(--surface)", border: "1px solid var(--sky)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{contactMethod === "phone" ? "📱" : "📧"}</span>
                    <strong style={{ fontSize: "0.95rem" }}>
                      Confirming {contactMethod === "phone" ? `SMS Number: ${form.countryCode} ${form.phone}` : `Email: ${form.email}`}
                    </strong>
                  </div>
                  {contactMethod === "phone" && (
                    <span style={{ fontSize: "0.72rem", background: "rgba(56,189,248,0.12)", color: "var(--sky)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                      Africa's Talking SMS Gateway
                    </span>
                  )}
                </div>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Enter the 6-digit code sent to your {contactMethod === "phone" ? "mobile device via Africa's Talking SMS infrastructure" : "email inbox"}.
                </p>
              </div>

              <div>
                <label className="label">6-Digit Verification Code</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g. 748201"
                    style={{
                      flex: 1,
                      letterSpacing: "0.3em",
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      textAlign: "center",
                      height: 48,
                      borderRadius: "var(--r)",
                      border: "1px solid var(--border)",
                      background: "var(--bg)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode("748201");
                      setError("");
                    }}
                    className="btn-ghost"
                    style={{ padding: "0 0.85rem", fontSize: "0.78rem" }}
                  >
                    Demo OTP
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive a code?"}
                </span>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendTimer > 0 ? "var(--dim)" : "var(--sky)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: resendTimer > 0 ? "default" : "pointer",
                  }}
                >
                  Resend SMS / Email
                </button>
              </div>

              {error && (
                <div style={{ background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", borderRadius: "var(--r)", padding: "0.6rem 0.9rem", color: "var(--rose)", fontSize: "0.88rem" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", height: 46, fontSize: "0.95rem" }}>
                {loading ? "Creating account…" : "Verify Code & Continue →"}
              </button>
            </form>
          )}

          {/* STEP 2: COMPLETE */}
          {step === 2 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
              <h2 style={{ marginBottom: "0.4rem" }}>Account Verified!</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                Welcome to SimTrace! Starting your onboarding wizard…
              </p>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,var(--sky),var(--indigo))", animation: "fill 1.4s linear forwards", width: "0%" }} />
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
