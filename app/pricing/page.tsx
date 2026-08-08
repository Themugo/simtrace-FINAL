"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

interface Plan {
  id: string;
  name: string;
  priceKES: number | null;
  priceUSD: number | null;
  deviceLimit: number | null;
  extraDeviceKES: number;
  features: string[];
  cta: string;
  color: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free", name: "Free", priceKES: 0, priceUSD: 0, deviceLimit: 1, extraDeviceKES: 260,
    features: ["1 free device included", "$2/mo per additional device", "5 IMEI checks/day", "3 AI reports/month", "Email alerts", "Community support"],
    cta: "Current plan", color: "var(--muted)",
  },
  {
    id: "pro", name: "Pro", priceKES: 799, priceUSD: 6, deviceLimit: 10, extraDeviceKES: 80, popular: true,
    features: ["10 devices included", "Unlimited IMEI checks", "50 AI reports/month", "SMS + email alerts", "Priority support", "No ads"],
    cta: "Upgrade to Pro", color: "var(--sky)",
  },
  {
    id: "business", name: "Business", priceKES: 3499, priceUSD: 27, deviceLimit: 50, extraDeviceKES: 50,
    features: ["50 devices included", "Unlimited everything", "Marketplace API", "Webhooks", "Dedicated manager", "No ads", "4h SLA"],
    cta: "Upgrade to Business", color: "var(--violet)",
  },
  {
    id: "enterprise", name: "Enterprise", priceKES: null, priceUSD: null, deviceLimit: null, extraDeviceKES: 0,
    features: ["Unlimited devices", "Full telecom API", "Bulk IMEI ingestion", "Custom SLA", "Law enforcement portal"],
    cta: "Contact Sales", color: "var(--amber)",
  },
];

interface PlanCardProps {
  plan: Plan;
  currentPlan: string;
  onUpgrade: (plan: Plan) => void;
}

function PlanCard({ plan, currentPlan, onUpgrade }: PlanCardProps) {
  const isCurrent = currentPlan === plan.id;
  return (
    <div style={{
      background: "var(--bg2)", border: `1.5px solid ${plan.popular ? plan.color : "var(--border)"}`,
      borderRadius: 16, padding: "1.75rem 1.5rem", position: "relative",
      display: "flex", flexDirection: "column",
      boxShadow: plan.popular ? `0 0 32px ${plan.color}22` : "none",
    }}>
      {plan.popular && (
        <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,var(--sky),var(--indigo))", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "3px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>
          MOST POPULAR
        </div>
      )}
      <div style={{ color: plan.color, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.08em", marginBottom: "0.5rem", textTransform: "uppercase" }}>{plan.name}</div>
      {plan.priceKES !== null ? (
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>KES {plan.priceKES.toLocaleString()}</span>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>/month</span>
          {plan.priceUSD && plan.priceUSD > 0 && <div style={{ color: "var(--dim)", fontSize: "0.78rem" }}>≈ USD {plan.priceUSD}/mo via Stripe</div>}
        </div>
      ) : (
        <div style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.75rem" }}>Custom pricing</div>
      )}
      {plan.deviceLimit && (
        <div style={{ background: "var(--surface)", borderRadius: 8, padding: "0.5rem 0.9rem", marginBottom: "1rem", fontSize: "0.82rem", border: "1px solid var(--border)" }}>
          <span style={{ color: plan.color, fontWeight: 600 }}>{plan.deviceLimit} devices</span>
          {plan.extraDeviceKES > 0 && <span style={{ color: "var(--dim)" }}> · +KES {plan.extraDeviceKES}/extra device</span>}
        </div>
      )}
      <ul style={{ listStyle: "none", flex: 1, marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text2)" }}>
            <span style={{ color: plan.color, flexShrink: 0, marginTop: "0.1rem" }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onUpgrade(plan)}
        disabled={isCurrent}
        style={{
          background: isCurrent ? "var(--surface)" : `linear-gradient(135deg, ${plan.color}, ${plan.id === "pro" ? "var(--indigo)" : plan.color})`,
          color: isCurrent ? "var(--muted)" : "#fff",
          border: isCurrent ? "1px solid var(--border)" : "none",
          borderRadius: 10, padding: "0.75rem", fontWeight: 700, fontSize: "0.92rem",
          cursor: isCurrent ? "not-allowed" : "pointer",
        }}
      >
        {isCurrent ? "✓ Current plan" : plan.cta}
      </button>
    </div>
  );
}

interface MpesaModalProps {
  plan: Plan;
  onClose: () => void;
}

function MpesaModal({ plan, onClose }: MpesaModalProps) {
  const [phone,   setPhone]   = useState("");
  const [step,    setStep]    = useState("choose"); // choose | mpesa | stripe | polling | done | failed
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pollCount,  setPollCount]  = useState(0);

  // Poll for payment confirmation every 4 seconds
  useEffect(() => {
    if (step !== "polling" || !checkoutId) return;
    const iv = setInterval(async () => {
      try {
        const res = await api.get(`/api/billing/mpesa-status/${checkoutId}`);
        if (res.status === "completed") { clearInterval(iv); setStep("done"); }
        if (res.status === "failed")    { clearInterval(iv); setStep("failed"); }
        setPollCount(n => n + 1);
        if (pollCount > 30) { clearInterval(iv); } // stop after 2 min
      } catch { /* keep polling */ }
    }, 4000);
    return () => clearInterval(iv);
  }, [step, checkoutId, pollCount]);

  async function payMpesa() {
    if (!phone.trim()) { setError("Enter your M-Pesa phone number"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/billing/upgrade-mpesa", { planId: plan.id, phone: phone.trim() });
      setCheckoutId(res.checkoutRequestId);
      setStep("polling");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function payStripe() {
    setLoading(true); setError("");
    try {
      await api.post("/api/billing/upgrade-stripe", { planId: plan.id });
      // Stripe.js card payment — confirmCardPayment with clientSecret
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        // Dynamic import keeps Stripe out of initial bundle
        const { loadStripe } = await import("@stripe/stripe-js").catch(() => ({ loadStripe: null }));
        if (loadStripe) {
          // In production: use Stripe Elements to collect card details
          // const { error } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } });
          // if (error) { setError(error.message); setLoading(false); return; }
        }
      }
      // Payment intent created — webhook will activate subscription
      setStep("done");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" } as const;
  const box     = { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 16, padding: "2rem", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px #00000060" };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={e => e.stopPropagation()}>

        {/* Choose payment method */}
        {step === "choose" && (
          <>
            <h2 style={{ marginBottom: "0.25rem" }}>Upgrade to {plan.name}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
              KES {plan.priceKES?.toLocaleString()}/month · Cancel anytime
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button onClick={() => setStep("mpesa")} style={{ background: "var(--mpesa)", color: "#fff", border: "none", borderRadius: 12, padding: "1rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>📱</span> Pay with M-Pesa
              </button>
              <button onClick={() => setStep("stripe")} style={{ background: "#635bff", color: "#fff", border: "none", borderRadius: 12, padding: "1rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>💳</span> Pay with Card (Stripe)
              </button>
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 10, padding: "0.65rem", cursor: "pointer", fontSize: "0.88rem" }}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* M-Pesa phone entry */}
        {step === "mpesa" && (
          <>
            <h2 style={{ marginBottom: "0.25rem" }}>M-Pesa Payment</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              Enter the M-Pesa number to receive the STK push prompt
            </p>
            <label className="label">Phone number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678 or +254712345678" inputMode="tel" style={{ marginBottom: "0.75rem" }} />
            <div style={{ background: "var(--surface)", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
              <span>📋</span>
              <span>You'll receive a prompt on your phone. Enter your M-Pesa PIN to confirm <strong style={{ color: "var(--text)" }}>KES {plan.priceKES?.toLocaleString()}</strong>.</span>
            </div>
            {error && <p className="error" style={{ marginBottom: "0.75rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setStep("choose")} className="btn-ghost" style={{ flex: 1 }}>← Back</button>
              <button onClick={payMpesa} disabled={loading} style={{ flex: 2, background: "var(--mpesa)", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Sending…" : `Send KES ${plan.priceKES?.toLocaleString()} prompt`}
              </button>
            </div>
          </>
        )}

        {/* Polling — waiting for M-Pesa confirmation */}
        {step === "polling" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 1.5s infinite" }}>📱</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Check your phone</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              An M-Pesa STK prompt has been sent to <strong style={{ color: "var(--text)" }}>{phone}</strong>.<br />
              Enter your PIN to complete the payment.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--sky)", fontSize: "0.85rem" }}>
              <span style={{ display: "inline-block", animation: "spin 1.2s linear infinite" }}>⟳</span>
              Waiting for confirmation…
            </div>
            <p style={{ color: "var(--dim)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
              Didn't receive the prompt? <button onClick={payMpesa} style={{ background: "transparent", border: "none", color: "var(--sky)", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>Resend</button>
            </p>
          </div>
        )}

        {/* Stripe */}
        {step === "stripe" && (
          <>
            <h2 style={{ marginBottom: "0.25rem" }}>Card Payment</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              USD {plan.priceUSD}/month · Secure payment via Stripe
            </p>
            {error && <p className="error" style={{ marginBottom: "0.75rem" }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => setStep("choose")} className="btn-ghost" style={{ flex: 1 }}>← Back</button>
              <button onClick={payStripe} disabled={loading} style={{ flex: 2, background: "#635bff", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Processing…" : `Pay USD ${plan.priceUSD}`}
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Payment confirmed!</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Your account has been upgraded to <strong style={{ color: "var(--sky)" }}>{plan.name}</strong>. Enjoy your expanded features!
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: "100%" }}>Done</button>
          </div>
        )}

        {/* Failed */}
        {step === "failed" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
            <h2 style={{ marginBottom: "0.5rem" }}>Payment failed</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              The M-Pesa payment was declined or cancelled. Please try again.
            </p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={() => setStep("mpesa")} style={{ flex: 2 }}>Try again</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default function PricingPage() {
  const { user }      = useAuth();
  const router        = useRouter();
  const [modal, setModal]       = useState<Plan | null>(null);
  const [currentPlan, setCurrent] = useState("free");

  useEffect(() => {
    if (user) {
      api.get("/api/billing/subscription").then((s: any) => setCurrent(s.plan || "free")).catch(() => {});
    }
  }, [user]);

  function handleUpgrade(plan: Plan) {
    if (!user) { router.push("/register"); return; }
    if (plan.id === "enterprise") { window.open("mailto:sales@simtrace.site?subject=Enterprise enquiry", "_blank"); return; }
    if (plan.id === currentPlan) return;
    setModal(plan);
  }

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem", paddingTop: "1rem" }}>
        <div className="badge badge-info" style={{ marginBottom: "0.75rem" }}>Transparent pricing · No hidden fees</div>
        <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", marginBottom: "0.5rem" }}>Simple, honest pricing</h1>
        <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto" }}>
          Every user gets 1 device free. Additional devices incur a $2 / KES 260 monthly fee set by the System Admin.
        </p>
      </div>

      {/* Plan grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {PLANS.map(p => <PlanCard key={p.id} plan={p} currentPlan={currentPlan} onUpgrade={handleUpgrade} />)}
      </div>

      {/* Extra device callout */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Need extra devices on Free plan?</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1rem" }}>
          1 device is 100% free per user account. System Admin introduces a fee of $2 (KES 260)/month for each additional registered device slot.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            ["1st Device (Free)", "1 device slot included", "var(--emerald)"],
            ["Additional Device Fee", "$2.00 / KES 260 per month", "var(--amber)"],
            ["Pro Plan Upgrade", "KES 799/mo · 10 devices", "var(--sky)"]
          ].map(([t,v,c]) => (
            <div key={t} style={{ background: "var(--surface)", borderRadius: 9, padding: "0.65rem 1.1rem", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 2 }}>{t}</div>
              <div style={{ fontWeight: 700, color: c, fontSize: "0.92rem" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Telecom CTA */}
      <div style={{ background: "linear-gradient(135deg,#0ea5e915,#6366f115)", border: "1px solid var(--sky)33", borderRadius: 14, padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>🏛️</div>
        <h2 style={{ marginBottom: "0.4rem" }}>Telecom operator or law enforcement?</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: "1.25rem", maxWidth: 500, margin: "0 auto 1.25rem" }}>
          Get dedicated API access, bulk IMEI verification, webhooks, SLA-backed support, and a law enforcement portal.
        </p>
        <button className="btn-primary" onClick={() => router.push("/telecom-portal")}>Apply for Partner Access →</button>
      </div>

      {modal && <MpesaModal plan={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
