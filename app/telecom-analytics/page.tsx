"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

interface AnalyticsOverview {
  overview: {
    totalFraudAlerts: number;
    totalSimSwaps: number;
    totalTheftReports: number;
    totalBlacklisted: number;
    apiCallsThisMonth: number;
    apiCallsLimit: number;
  };
  geographic: {
    hotspots: Array<{ region: string; count: number; lat: number; lng: number }>;
  };
  trends: {
    daily: Array<{ date: string; fraud: number; simSwap: number }>;
  };
}

interface FraudPatterns {
  totalFraudPatterns: number;
  topPatterns: Array<{ pattern: string; count: number }>;
  recentFraudAlerts: Array<{ type: string; severity: string; timestamp: Date }>;
}

interface SimSwaps {
  totalSimSwaps: number;
  byNetwork: Array<{ network: string; count: number }>;
  dailyTrend: Array<{ date: string; count: number }>;
  recentSwaps: Array<{ network: string; previousIccid: string; newIccid: string; timestamp: Date }>;
}

export default function TelecomAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [fraudPatterns, setFraudPatterns] = useState<FraudPatterns | null>(null);
  const [simSwaps, setSimSwaps] = useState<SimSwaps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      loadOverview();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (tab === "fraud") loadFraudPatterns();
    if (tab === "simswap") loadSimSwaps();
  }, [tab]);

  async function loadOverview() {
    setLoading(true);
    try {
      const data = await api.get("/api/telecom-analytics/overview");
      setOverview(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFraudPatterns() {
    try {
      const data = await api.get("/api/telecom-analytics/fraud-patterns");
      setFraudPatterns(data);
    } catch (err: any) {
      console.error("Failed to load fraud patterns:", err);
    }
  }

  async function loadSimSwaps() {
    try {
      const data = await api.get("/api/telecom-analytics/sim-swaps");
      setSimSwaps(data);
    } catch (err: any) {
      console.error("Failed to load SIM swaps:", err);
    }
  }

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop: "2rem" }}>Loading…</p>;

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-block", background: "var(--surface)", color: "var(--sky)", fontSize: "0.75rem", fontWeight: 700, padding: "3px 12px", borderRadius: 20, marginBottom: "0.75rem" }}>
          TELECOM ANALYTICS
        </div>
        <h1 style={{ marginBottom: "0.4rem" }}>Advanced Analytics Dashboard</h1>
        <p style={{ color: "var(--muted)" }}>Real-time fraud detection, geographic heatmaps, and SIM swap trends</p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "fraud", label: "🕵️ Fraud Patterns" },
          { id: "simswap", label: "🔄 SIM Swaps" },
          { id: "geographic", label: "🗺️ Geographic" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "var(--surface)" : "transparent",
              border: `1px solid ${tab === t.id ? "var(--indigo)" : "var(--border)"}`,
              color: tab === t.id ? "var(--sky)" : "var(--muted)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Fraud Alerts", value: overview.overview.totalFraudAlerts, color: "var(--rose)" },
            { label: "SIM Swaps", value: overview.overview.totalSimSwaps, color: "var(--amber)" },
            { label: "Theft Reports", value: overview.overview.totalTheftReports, color: "var(--sky)" },
            { label: "Blacklisted Devices", value: overview.overview.totalBlacklisted, color: "var(--violet)" },
            { label: "API Calls", value: `${overview.overview.apiCallsThisMonth}/${overview.overview.apiCallsLimit}`, color: "var(--emerald)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "overview" && overview && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>30-Day Trend</h3>
          <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 4 }}>
            {overview.trends.daily.map((day, i) => (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  background: `linear-gradient(to top, var(--sky-dim), var(--sky))`,
                  height: `${Math.max((day.fraud / Math.max(...overview.trends.daily.map(d => d.fraud))) * 100, 5)}%`,
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                }}
                title={`${day.date}: ${day.fraud} fraud, ${day.simSwap} SIM swaps`}
              />
            ))}
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--muted)", textAlign: "center" }}>
            Daily fraud alerts over 30 days
          </div>
        </div>
      )}

      {tab === "fraud" && fraudPatterns && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Top Fraud Patterns</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {fraudPatterns.topPatterns.map(({ pattern, count }) => (
                <div key={pattern} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem" }}>{pattern}</span>
                  <span style={{ fontWeight: 700, color: "var(--rose)" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Recent Fraud Alerts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {fraudPatterns.recentFraudAlerts.map((alert, i) => (
                <div key={i} style={{ padding: "0.5rem", background: "var(--bg)", borderRadius: 6 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{alert.type}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {alert.severity} · {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "simswap" && simSwaps && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>SIM Swaps by Network</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {simSwaps.byNetwork.map(({ network, count }) => (
                <div key={network} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.9rem" }}>{network}</span>
                  <span style={{ fontWeight: 700, color: "var(--amber)" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: "1rem" }}>Recent SIM Swaps</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {simSwaps.recentSwaps.map((swap, i) => (
                <div key={i} style={{ padding: "0.5rem", background: "var(--bg)", borderRadius: 6 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{swap.network}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    ICCID: {swap.previousIccid?.slice(-8)} → {swap.newIccid?.slice(-8)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--dim)" }}>
                    {new Date(swap.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "geographic" && overview && (
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Geographic Hotspots</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Top 20 locations with highest device activity
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {overview.geographic.hotspots.map((hotspot) => (
              <div key={hotspot.region} style={{ padding: "0.75rem", background: "var(--bg)", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 2 }}>
                  {hotspot.lat.toFixed(2)}, {hotspot.lng.toFixed(2)}
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--sky)" }}>
                  {hotspot.count}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>pings</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
