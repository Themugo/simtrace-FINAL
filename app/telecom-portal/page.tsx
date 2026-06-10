"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

interface OrgType {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

interface TierBenefits {
  calls: string;
  imeiChecks: string;
  webhooks: string;
  sla: string;
  price: string;
}

interface Partner {
  _id: string;
  partner?: {
    _id?: string;
    orgName: string;
    orgType: string;
    tier: string;
    status: string;
    webhookUrl?: string;
    apiCallsMonth?: number;
    apiCallsLimit?: number;
  };
  stats?: {
    totalBlacklisted?: number;
  };
  apiKey?: string;
}

interface FormState {
  orgName: string;
  orgType: string;
  country: string;
  webhookUrl: string;
}

const ORG_TYPES: OrgType[] = [
  { id: "telecom",          label: "Telecom Operator",     icon: "📡", desc: "Safaricom, Airtel, Telkom, Faiba and similar operators" },
  { id: "law_enforcement",  label: "Law Enforcement",       icon: "🏛️", desc: "Police, DCI, regulatory agencies" },
  { id: "marketplace",      label: "Online Marketplace",    icon: "🛒", desc: "Jiji, Jumia, OLX and device resellers" },
  { id: "insurance",        label: "Insurance Company",     icon: "🛡️", desc: "Device insurance providers" },
];

const TIER_BENEFITS: Record<string, TierBenefits> = {
  basic:    { calls: "1,000/month", imeiChecks: "Single IMEI", webhooks: "No", sla: "Best effort", price: "Free" },
  standard: { calls: "10,000/month", imeiChecks: "Bulk up to 100", webhooks: "Yes", sla: "24h", price: "KES 4,999/mo" },
  premium:  { calls: "Unlimited",    imeiChecks: "Bulk up to 500", webhooks: "Yes + priority", sla: "4h", price: "Custom" },
};

export default function TelecomPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const router  = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [form,    setForm]    = useState<FormState>({ orgName: "", orgType: "telecom", country: "KE", webhookUrl: "" });
  const [step,    setStep]    = useState("check");
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [apiKey,  setApiKey]  = useState("");
  const [testImei,    setTestImei]    = useState("");
  const [testResult,  setTestResult]  = useState<any>(null);
  const [rotating,    setRotating]    = useState(false);
  const [webhookTest, setWebhookTest] = useState<any>(null);
  const [testingHook, setTestingHook] = useState(false);
  const [copiedKey,   setCopiedKey]   = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) checkPartner();
  }, [user, authLoading]);

  async function checkPartner() {
    try {
      const data = await api.get("/api/partner/me");
      setPartner(data);
      setStep("active");
    } catch {
      setStep("apply");
    }
  }

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await api.post("/api/partner/register", form);
      setApiKey(res.apiKey);
      setStep("applied");
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function regenerateKey() {
    if (!partner || !confirm("Rotating your API key will invalidate the current one. All integrations must be updated. Continue?")) return;
    setRotating(true);
    try {
      const keyRes = await api.post(`/api/partner/${partner._id}/regenerate-key`, {});
      setPartner(p => ({ ...p, apiKey: keyRes.apiKey }));
      alert("API key rotated. Copy the new key now — it won't be shown again after you leave this page.");
    } catch (err: any) { alert(err.message); }
    finally { setRotating(false); }
  }

  function copyKey() {
    if (partner?.apiKey) {
      navigator.clipboard.writeText(partner.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  async function testBulkCheck() {
    if (!testImei) return;
    try {
      const res = await api.post("/api/partner/imei/bulk", { imeis: [testImei] });
      setTestResult(res.results?.[0] || null);
    } catch (err: any) { setTestResult({ error: err.message }); }
  }

  if (authLoading) return <p className="text-muted">Loading…</p>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-block", background: "var(--surface)", color: "var(--sky)", fontSize: "0.75rem", fontWeight: 700, padding: "3px 12px", borderRadius: 20, marginBottom: "0.75rem" }}>PARTNER PORTAL</div>
        <h1 style={{ marginBottom: "0.4rem" }}>Telecom & Agency Integration</h1>
        <p style={{ color: "var(--muted)" }}>API access for operators, law enforcement, and marketplaces to verify devices at scale.</p>
      </div>

      {step === "apply" && (
        <div>
          {/* Tier comparison */}
          <h2 style={{ marginBottom: "1rem" }}>API Tiers</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
            {Object.entries(TIER_BENEFITS).map(([tier, b]) => (
              <div key={tier} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontWeight: 700, textTransform: "capitalize", marginBottom: "0.75rem", color: tier === "premium" ? "var(--amber)" : tier === "standard" ? "var(--sky)" : "var(--muted)" }}>{tier}</div>
                {Object.entries(b).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                    <span style={{ color: "var(--dim)", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                    <span style={{ color: "var(--text)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Org type selection */}
          <h2 style={{ marginBottom: "0.75rem" }}>Apply for partner access</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.25rem" }}>
            {ORG_TYPES.map(t => (
              <div key={t.id} onClick={() => setForm(f => ({ ...f, orgType: t.id }))} style={{ background: "var(--bg2)", border: `1.5px solid ${form.orgType === t.id ? "var(--sky)" : "var(--border)"}`, borderRadius: 10, padding: "0.85rem", cursor: "pointer" }}>
                <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{t.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{t.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{t.desc}</div>
              </div>
            ))}
          </div>

          <form onSubmit={apply} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label className="label">Organisation name *</label>
              <input required placeholder="e.g. Safaricom PLC" value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Webhook URL (optional — receive real-time blacklist events)</label>
              <input type="url" placeholder="https://api.yourorg.com/simtrace-webhook" value={form.webhookUrl} onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={saving || !form.orgName}>
              {saving ? "Submitting…" : "Submit partner application"}
            </button>
            <p style={{ fontSize: "0.78rem", color: "var(--dim)" }}>Applications are reviewed within 2 business days. You'll start on the Basic tier and can upgrade after approval.</p>
          </form>
        </div>
      )}

      {step === "applied" && (
        <div>
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid #166534", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ color: "var(--emerald)", marginBottom: "0.5rem" }}>✅ Application submitted</h2>
            <p style={{ color: "var(--emerald)", marginBottom: "1rem" }}>Your API key is shown below — save it now, it won't be shown again.</p>
            <div style={{ background: "var(--bg)", borderRadius: 8, padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--emerald)", wordBreak: "break-all" }}>{apiKey}</div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>Your account is pending admin review. Once approved, you can use the key at <code style={{ color: "var(--sky)" }}>X-Partner-Key: your_key</code> header on all partner endpoints.</p>
        </div>
      )}

      {step === "active" && partner && (
        <div>
          {/* Status */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{partner.partner?.orgName}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.83rem", textTransform: "capitalize" }}>{partner.partner?.orgType?.replace(/_/g," ")} · {partner.partner?.tier} tier</div>
            </div>
            <span className={`badge ${partner.partner?.status === "active" ? "badge-ok" : "badge-warn"}`}>{partner.partner?.status?.toUpperCase()}</span>
          </div>

          {/* Usage */}
          <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
            {[
              ["API Calls This Month", `${partner.partner?.apiCallsMonth?.toLocaleString()} / ${partner.partner?.apiCallsLimit?.toLocaleString()}`],
              ["Blacklisted Devices",  partner.stats?.totalBlacklisted?.toLocaleString()],
            ].map(([k,v]) => (
              <div key={k} className="card">
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{k}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{v ?? "—"}</div>
              </div>
            ))}
          </div>

          {/* API docs inline */}
          <h2 style={{ marginBottom: "0.75rem" }}>Quick API Reference</h2>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem", fontFamily: "monospace", fontSize: "0.8rem", marginBottom: "1.5rem", overflowX: "auto" }}>
            <div style={{ color: "var(--muted)", marginBottom: "0.5rem" }}># Single IMEI check</div>
            <div style={{ color: "var(--text)" }}>POST {process.env.NEXT_PUBLIC_API_URL || "https://api.simtrace.site"}/api/partner/imei/check</div>
            <div style={{ color: "var(--sky)" }}>X-Partner-Key: your_key</div>
            <div style={{ color: "var(--text)", marginTop: "0.25rem" }}>{`{ "imei": "356938035643809" }`}</div>
            <div style={{ color: "var(--muted)", marginTop: "1rem", marginBottom: "0.5rem" }}># Bulk IMEI check (up to 500)</div>
            <div style={{ color: "var(--text)" }}>POST /api/partner/imei/bulk</div>
            <div style={{ color: "var(--text)" }}>{`{ "imeis": ["35693803...", "49015420..."] }`}</div>
          </div>

          {/* Live test */}
          <h2 style={{ marginBottom: "0.75rem" }}>Test IMEI lookup</h2>
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <input value={testImei} onChange={e => setTestImei(e.target.value)} placeholder="Enter IMEI to test" inputMode="numeric" maxLength={17} style={{ flex: 1 }} />
            <button className="btn-primary" onClick={testBulkCheck} disabled={!testImei}>Check</button>
          </div>
          {testResult && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.85rem", fontFamily: "monospace", fontSize: "0.82rem" }}>
              <pre style={{ margin: 0, color: "var(--text)" }}>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}

          {/* Webhook test */}
          {partner.partner?.webhookUrl && (
            <div style={{ marginTop: "1.5rem" }}>
              <h2 style={{ marginBottom: "0.75rem" }}>Webhook Delivery Test</h2>
              <div className="card" style={{ borderColor: "var(--sky)33" }}>
                <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  Send a signed test event to your webhook endpoint to verify delivery.
                </p>
                <div style={{ background: "var(--bg)", borderRadius: 6, padding: "0.5rem 0.75rem", fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.75rem", wordBreak: "break-all" }}>
                  {partner.partner.webhookUrl}
                </div>
                <button
                  onClick={async () => {
                    setTestingHook(true); setWebhookTest(null);
                    try {
                      const res = await api.testWebhook(partner.partner?._id || '');
                      setWebhookTest(res);
                    } catch (err: any) { setWebhookTest({ success: false, message: err.message }); }
                    finally { setTestingHook(false); }
                  }}
                  disabled={testingHook}
                  className="btn-primary"
                  style={{ fontSize: "0.85rem", padding: "6px 18px" }}
                >
                  {testingHook ? "⟳ Sending test event…" : "🔔 Send Test Webhook"}
                </button>
                {webhookTest && (
                  <div style={{ marginTop: "0.75rem", background: webhookTest.success ? "var(--emerald)11" : "var(--rose)11", border: `1px solid ${webhookTest.success ? "var(--emerald)" : "var(--rose)"}44`, borderRadius: 8, padding: "0.65rem 0.9rem", fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: webhookTest.success ? "var(--emerald)" : "var(--rose)", marginBottom: 4 }}>
                      {webhookTest.success ? "✅ Delivered successfully" : "❌ Delivery failed"}
                    </div>
                    <div style={{ color: "var(--text2)" }}>{webhookTest.message}</div>
                    {webhookTest.statusCode && (
                      <div style={{ color: "var(--dim)", fontSize: "0.78rem", marginTop: 2 }}>
                        HTTP {webhookTest.statusCode} · {webhookTest.latencyMs}ms latency
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* API key rotation */}
              <div className="card" style={{ marginTop: "0.85rem", borderColor: "var(--amber)33" }}>
                <h3 style={{ marginBottom: "0.5rem", color: "var(--amber)" }}>🔑 Rotate API Key</h3>
                <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                  Generate a new API key. Your current key will be immediately invalidated — update all integrations before rotating.
                </p>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    onClick={copyKey}
                    style={{ background: copiedKey ? "var(--emerald)" : "var(--surface)", border: "1px solid var(--border2)", color: copiedKey ? "#fff" : "var(--text2)", borderRadius: 9, padding: "5px 14px", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600 }}>
                    {copiedKey ? "✓ Copied!" : "📋 Copy current key"}
                  </button>
                  <button
                    onClick={regenerateKey}
                    disabled={rotating}
                    style={{ background: "transparent", border: "1px solid var(--amber)", color: "var(--amber)", borderRadius: 9, padding: "5px 14px", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600 }}>
                    {rotating ? "⟳ Rotating…" : "↻ Rotate API Key"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
