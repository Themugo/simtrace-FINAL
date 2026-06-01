"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

interface DashboardData {
  current?: {
    monthly?: {
      totalRevenue?: number;
      totalUsers?: number;
      netProfit?: number;
      profitMargin?: number;
    };
  };
  revenueBreakdown?: {
    subscription?: number;
    ads?: number;
    verification?: number;
    partnerApi?: number;
    insurance?: number;
  };
  revenueTrend?: Array<{
    month: string;
    revenue?: number;
  }>;
  costBreakdown?: {
    infrastructure?: number;
    marketing?: number;
    operational?: number;
  };
}

export default function FinancialDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "admin") {
      loadDashboard();
    }
  }, [user]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await api.get("/api/financials/dashboard");
      setDashboard(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>Access Denied</h2>
        <p style={{ color: "var(--muted)" }}>This page is only accessible to administrators</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading financial dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Financial Dashboard
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Revenue tracking and business projections
        </p>
      </div>

      {dashboard && (
        <div style={{ display: "grid", gap: "2rem" }}>
          {/* Current Period Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Revenue</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {dashboard.current?.monthly?.totalRevenue?.toLocaleString() || 0}
              </div>
            </div>
            <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Users</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {dashboard.current?.monthly?.totalUsers || 0}
              </div>
            </div>
            <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Net Profit</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: dashboard.current?.monthly?.netProfit && dashboard.current.monthly.netProfit >= 0 ? "var(--emerald)" : "var(--rose)" }}>
                {dashboard.current?.monthly?.netProfit?.toLocaleString() || 0}
              </div>
            </div>
            <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Profit Margin</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {dashboard.current?.monthly?.profitMargin?.toFixed(1) || 0}%
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Revenue Breakdown</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Subscriptions</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.revenueBreakdown?.subscription?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Ads</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.revenueBreakdown?.ads?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Verification</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.revenueBreakdown?.verification?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Partner API</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.revenueBreakdown?.partnerApi?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Insurance</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.revenueBreakdown?.insurance?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trend */}
          <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Revenue Trend (12 Months)</h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {dashboard.revenueTrend?.map((data, idx) => (
                <div key={idx} style={{ textAlign: "center", padding: "1rem", background: "var(--bg)", borderRadius: "var(--r)", minWidth: "80px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                    {data.month}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {data.revenue?.toLocaleString() || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Cost Breakdown</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Infrastructure</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.costBreakdown?.infrastructure?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Marketing</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.costBreakdown?.marketing?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Operational</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {dashboard.costBreakdown?.operational?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
