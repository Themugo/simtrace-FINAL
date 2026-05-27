"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

export default function InsurancePage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState("policies");
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [policiesData, claimsData] = await Promise.all([
        api.get("/api/insurance/policies"),
        api.get("/api/insurance/claims"),
      ]);
      setPolicies(policiesData.policies || []);
      setClaims(claimsData.claims || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Insurance Tech Integration
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Device insurance policies and claims management
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setActiveTab("policies")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "policies" ? "2px solid var(--sky)" : "none",
            fontWeight: 600,
            color: activeTab === "policies" ? "var(--sky)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          My Policies
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "claims" ? "2px solid var(--sky)" : "none",
            fontWeight: 600,
            color: activeTab === "claims" ? "var(--sky)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          Claims
        </button>
      </div>

      {activeTab === "policies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem" }}>Insurance Policies</h2>
            <button
              onClick={() => setShowNewPolicy(true)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "var(--sky)",
                color: "white",
                border: "none",
                borderRadius: "var(--r)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + New Policy
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
          ) : policies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "var(--r)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛡️</div>
              <h3 style={{ marginBottom: "0.5rem" }}>No Insurance Policies</h3>
              <p style={{ color: "var(--muted)" }}>Protect your devices with insurance coverage</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {policies.map((policy) => (
                <div key={policy._id} style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                        {policy.policyNumber}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                        {policy.provider}
                      </div>
                    </div>
                    <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: policy.status === "active" ? "var(--emerald)15" : "var(--dim)15", color: policy.status === "active" ? "var(--emerald)" : "var(--dim)" }}>
                      {policy.status.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", fontSize: "0.875rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Coverage</div>
                      <div>{policy.coverageType}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Premium</div>
                      <div>{policy.currency} {policy.premium}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Coverage Limit</div>
                      <div>{policy.currency} {policy.coverageLimit}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                    {policy.devices?.length || 0} devices covered • Expires: {new Date(policy.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "claims" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem" }}>Insurance Claims</h2>
            <button
              onClick={() => setShowNewClaim(true)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "var(--sky)",
                color: "white",
                border: "none",
                borderRadius: "var(--r)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + File Claim
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
          ) : claims.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "var(--r)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
              <h3 style={{ marginBottom: "0.5rem" }}>No Claims</h3>
              <p style={{ color: "var(--muted)" }}>File a claim when your device is lost, stolen, or damaged</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {claims.map((claim) => (
                <div key={claim._id} style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                        {claim.claimNumber}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                        {claim.claimType} • {new Date(claim.incidentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: claim.status === "approved" || claim.status === "paid" ? "var(--emerald)15" : claim.status === "rejected" ? "var(--rose)15" : "var(--dim)15", color: claim.status === "approved" || claim.status === "paid" ? "var(--emerald)" : claim.status === "rejected" ? "var(--rose)" : "var(--dim)" }}>
                      {claim.status.replace("_", " ").toUpperCase()}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                      Claimed Amount
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                      {claim.currency} {claim.claimedAmount}
                    </div>
                  </div>

                  {claim.approvedAmount && (
                    <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                      Approved: {claim.currency} {claim.approvedAmount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
