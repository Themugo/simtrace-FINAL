"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

export default function CommercialEcosystemPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"marketplace" | "partner" | "insurance" | "oem" | "billing" | "telecom" | "whitelabel">("marketplace");

  // ── Marketplace State ──────────────────────────────────────────────────────
  const [marketFilter, setMarketFilter] = useState("all");
  const [marketSearch, setMarketSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  // ── Subscriptions & Billing State ─────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "paypal">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("+254 712 345 678");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ── Partner & Affiliate State ─────────────────────────────────────────────
  const [affiliateCode, setAffiliateCode] = useState("SIMTRACE-AFF-2026");
  const [commissionEarned, setCommissionEarned] = useState(1420);
  const [apiQueriesCount, setApiQueriesCount] = useState(48290);

  // ── White-Label State ─────────────────────────────────────────────────────
  const [brandName, setBrandName] = useState("Kenya National IMEI Registry");
  const [customDomain, setCustomDomain] = useState("registry.dci.go.ke");
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [whitelabelSaved, setWhitelabelSaved] = useState(false);

  // Sample Marketplace Items
  const items = [
    { id: "m1", title: "Samsung Galaxy S24 Ultra (Verified Clean)", price: 850, category: "devices", seller: "Safaricom Certified Refurb", imei: "356938035643809", badge: "GSMA CLEAR" },
    { id: "m2", title: "Apple iPhone 15 Pro Max 256GB", price: 990, category: "devices", seller: "Airtel Outlet Nairobi", imei: "490154203237518", badge: "SIMTRACE GUARANTEE" },
    { id: "m3", title: "SimTrace Anti-Theft Micro Tracker SIM", price: 15, category: "hardware", seller: "SimTrace Hardware Division", imei: "N/A", badge: "HARDWARE ENCRYPTION" },
    { id: "m4", title: "Comprehensive 12-Month Theft Insurance Policy", price: 35, category: "services", seller: "Jubilee Insurance Kenya", imei: "N/A", badge: "INSTANT COVERAGE" },
  ];

  function handleSubscribe() {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
    }, 1500);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(14,165,233,0.1))", borderColor: "var(--emerald)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--emerald), var(--sky))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#fff", fontWeight: 800 }}>
              🛒
            </div>
            <div>
              <h1 style={{ fontSize: "1.35rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Commercial Ecosystem & Partner Platform
                <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", border: "1px solid var(--emerald)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Monetization & API Engine
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Device marketplace, insurance underwriting, OEM licensing, carrier APIs, subscriptions, and white-label enterprise portal.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Affiliate Revenue</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--emerald)" }}>${commissionEarned.toLocaleString()} USD</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>API Queries (Mo.)</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--sky)" }}>{apiQueriesCount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "marketplace", label: "🛍️ Verified Marketplace" },
          { id: "billing", label: "💳 Subscriptions & Monetization" },
          { id: "insurance", label: "🛡️ Insurance Portal" },
          { id: "partner", label: "🤝 Partner & Affiliate Hub" },
          { id: "oem", label: "🏭 OEM & GSMA TAC Licensing" },
          { id: "telecom", label: "📡 Telecom & Carrier API" },
          { id: "whitelabel", label: "🏷️ White-Label Branding" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeTab === tab.id ? "var(--emerald)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--emerald)" : "var(--text2)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: VERIFIED DEVICE MARKETPLACE ─────────────────────────────────── */}
      {activeTab === "marketplace" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              {["all", "devices", "hardware", "services"].map(f => (
                <button
                  key={f}
                  onClick={() => setMarketFilter(f)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background: marketFilter === f ? "var(--sky)22" : "var(--surface)",
                    color: marketFilter === f ? "var(--sky)" : "var(--text2)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="Search verified devices & accessories…"
                value={marketSearch}
                onChange={e => setMarketSearch(e.target.value)}
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.82rem", borderRadius: 8, width: 240 }}
              />
              <button className="btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem" }}>
                🛒 Cart ({cartCount})
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {items
              .filter(i => marketFilter === "all" || i.category === marketFilter)
              .filter(i => !marketSearch || i.title.toLowerCase().includes(marketSearch.toLowerCase()))
              .map(item => (
                <div key={item.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "var(--emerald)22", color: "var(--emerald)" }}>
                        {item.badge}
                      </span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--sky)" }}>${item.price}</span>
                    </div>
                    <h3 style={{ fontSize: "0.95rem", marginBottom: 4 }}>{item.title}</h3>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                      Seller: <strong style={{ color: "var(--text)" }}>{item.seller}</strong>
                    </div>
                    {item.imei !== "N/A" && (
                      <div style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", background: "var(--surface)", padding: "4px 8px", borderRadius: 4, marginBottom: "0.75rem" }}>
                        🔒 Clean IMEI Verified: {item.imei}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setCartCount(c => c + 1); alert(`Added ${item.title} to cart with SimTrace Clean-IMEI Guarantee!`); }}
                    className="btn-primary"
                    style={{ width: "100%", padding: "6px 12px", fontSize: "0.82rem", marginTop: "0.5rem" }}
                  >
                    Buy Now with Guarantee
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: SUBSCRIPTIONS & BILLING ────────────────────────────────────── */}
      {activeTab === "billing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", marginBottom: 2 }}>💳 Subscription & Monetization Plans</h3>
                  <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Select an enterprise or consumer plan for full SimTrace features.</p>
                </div>
                <div style={{ display: "flex", background: "var(--surface)", padding: 3, borderRadius: 8 }}>
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    style={{ padding: "4px 10px", fontSize: "0.78rem", borderRadius: 6, border: "none", background: billingCycle === "monthly" ? "var(--sky)" : "transparent", color: billingCycle === "monthly" ? "#fff" : "var(--text2)", cursor: "pointer" }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    style={{ padding: "4px 10px", fontSize: "0.78rem", borderRadius: 6, border: "none", background: billingCycle === "annual" ? "var(--sky)" : "transparent", color: billingCycle === "annual" ? "#fff" : "var(--text2)", cursor: "pointer" }}
                  >
                    Annual (Save 20%)
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem" }}>
                {[
                  { id: "free", name: "Consumer Starter", price: "$0", desc: "Basic IMEI lookup & theft reporting", features: ["1 Registered Device", "Standard IMEI Check", "Public Alert Feed"] },
                  { id: "pro", name: "Pro Protection", price: billingCycle === "monthly" ? "$4.99/mo" : "$48/yr", desc: "Live background agent & AI evidence", features: ["Up to 5 Devices", "Live GPS & Camera Evidence", "AI Risk Analysis & SIM Alert", "M-Pesa Auto-Pay"] },
                  { id: "enterprise", name: "Government & Carrier", price: billingCycle === "monthly" ? "$1,999/mo" : "$19,990/yr", desc: "Full CEIR blacklist, API & White-label", features: ["Unlimited Devices", "National CEIR Blacklist API", "Court Affidavit Generator", "24/7 Dedicated Support"] },
                ].map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      border: `2px solid ${selectedPlan === plan.id ? "var(--emerald)" : "var(--border)"}`,
                      background: selectedPlan === plan.id ? "var(--surface)" : "var(--bg)",
                      borderRadius: 10,
                      padding: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifySpace: "between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: selectedPlan === plan.id ? "var(--emerald)" : "var(--text)" }}>{plan.name}</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.3rem 0" }}>{plan.price}</div>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 0.75rem 0", lineHeight: 1.3 }}>{plan.desc}</p>
                      <ul style={{ paddingLeft: "1rem", margin: 0, fontSize: "0.75rem", color: "var(--text2)" }}>
                        {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>⚡ Instant Payment Gateway</h3>
            {paymentSuccess ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
                <h4 style={{ fontSize: "1rem", color: "var(--emerald)", marginBottom: 4 }}>Subscription Activated!</h4>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Thank you for upgrading. Your account is now active on the {selectedPlan.toUpperCase()} tier.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Select Payment Method</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                    {[
                      { id: "mpesa", label: "📱 M-Pesa" },
                      { id: "card", label: "💳 Card" },
                      { id: "paypal", label: "🅿️ PayPal" },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        style={{
                          padding: "6px",
                          fontSize: "0.78rem",
                          borderRadius: 6,
                          border: `1px solid ${paymentMethod === m.id ? "var(--sky)" : "var(--border)"}`,
                          background: paymentMethod === m.id ? "var(--surface)" : "transparent",
                          color: paymentMethod === m.id ? "var(--sky)" : "var(--text2)",
                          cursor: "pointer",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "mpesa" && (
                  <div>
                    <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>M-Pesa Phone Number</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6 }}
                    />
                  </div>
                )}

                <button
                  onClick={handleSubscribe}
                  disabled={processingPayment}
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: "0.88rem", marginTop: "0.5rem" }}
                >
                  {processingPayment ? "Processing STK Push…" : `Complete Payment (${selectedPlan.toUpperCase()})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: INSURANCE PORTAL ───────────────────────────────────────────── */}
      {activeTab === "insurance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🛡️ Micro-Insurance & Automated Claims Underwriting</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Direct integration with Jubilee, Britam, and Liberty Insurance. Automated fraud checking via SimTrace AI before claim payout.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ACTIVE POLICIES</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>14,290</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>↑ +12.4% this month</div>
              </div>
              <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CLAIMS APPROVED</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>$184,200 USD</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>Avg payout: 4 mins</div>
              </div>
              <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>FRAUD CLAIMS PREVENTED</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--rose)" }}>$92,500 USD</div>
                <div style={{ fontSize: "0.72rem", color: "var(--rose)", marginTop: 4 }}>AI Risk Score blocking</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PARTNER & AFFILIATE HUB ────────────────────────────────────── */}
      {activeTab === "partner" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🤝 Affiliate & Referral Earnings Dashboard</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Share your affiliate tracking code with phone repair shops, resellers, or online communities to earn 20% recurring commission.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--surface)", padding: "1rem", borderRadius: 8, border: "1px solid var(--sky)44" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>YOUR UNIQUE AFFILIATE CODE</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--mono)", color: "var(--sky)" }}>{affiliateCode}</div>
              </div>
              <button onClick={() => alert("Affiliate link copied to clipboard!\nhttps://simtrace.site/ref/" + affiliateCode)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                📋 Copy Share Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: OEM & GSMA TAC LICENSING ───────────────────────────────────── */}
      {activeTab === "oem" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏭 Hardware OEM & Manufacturer Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Pre-load SimTrace security certificates directly onto phone firmware during factory assembly.
            </p>
            <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>Authorized GSMA TAC Ranges</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Samsung Electronics Co. Ltd · TAC Range: 35693803 - 35693899</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: TELECOM & CARRIER API ──────────────────────────────────────── */}
      {activeTab === "telecom" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📡 Telecom Operator & Carrier API Gateway</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Connect directly to Safaricom, Airtel, and Telkom SS7 / Diameter network nodes for real-time IMEI tracking.
            </p>
            <div style={{ background: "var(--surface)", padding: "1rem", borderRadius: 8 }}>
              <div style={{ fontSize: "0.78rem", color: "var(--sky)", fontFamily: "var(--mono)" }}>
                POST /api/telecom/v1/imei-check · HTTP 200 OK (Latency: 18ms)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: WHITE-LABEL BRANDING ───────────────────────────────────────── */}
      {activeTab === "whitelabel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏷️ White-Label Portal Customization</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Deploy a customized, branded portal under your custom government or corporate domain name.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxWidth: 500 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Portal Brand Name</label>
                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6 }} />
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Custom CNAME Domain</label>
                <input type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value)} style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6 }} />
              </div>

              <button onClick={() => { setWhitelabelSaved(true); setTimeout(() => setWhitelabelSaved(false), 3000); }} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                {whitelabelSaved ? "✓ Custom Branding Saved!" : "Save White-Label Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
