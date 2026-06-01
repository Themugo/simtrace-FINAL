"use client";
import { useState } from "react";
import { api } from "../../lib/api";

interface BlockchainEntry {
  _id: string;
  eventType: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
  verified: boolean;
  ceirSynced?: boolean;
  ceirReference?: string;
}

export default function BlockchainLedgerPage() {
  const [imei, setImei] = useState("");
  const [history, setHistory] = useState<BlockchainEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLoadHistory() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(`/api/blockchain/${imei}/history`);
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || "Failed to load blockchain history");
    }
    setLoading(false);
  }

  const eventTypeLabels: Record<string, string> = {
    device_registered: "Device Registered",
    ownership_transfer: "Ownership Transfer",
    theft_reported: "Theft Reported",
    device_recovered: "Device Recovered",
    blacklisted: "Blacklisted",
    whitelisted: "Whitelisted",
    dna_verified: "DNA Verified",
    clone_detected: "Clone Detected",
    cross_border_request: "Cross-Border Request",
  };

  const eventTypeColors: Record<string, string> = {
    device_registered: "var(--emerald)",
    ownership_transfer: "var(--sky)",
    theft_reported: "var(--rose)",
    device_recovered: "var(--emerald)",
    blacklisted: "var(--rose)",
    whitelisted: "var(--emerald)",
    dna_verified: "var(--indigo)",
    clone_detected: "var(--orange)",
    cross_border_request: "var(--amber)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Blockchain Device Ledger
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Immutable record of device lifecycle on blockchain
        </p>
      </div>

      {/* Search Section */}
      <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>IMEI</label>
            <input
              value={imei}
              onChange={e => setImei(e.target.value)}
              placeholder="Enter 15-17 digit IMEI"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>
          <button
            onClick={handleLoadHistory}
            disabled={loading || !imei}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--sky)",
              color: "white",
              border: "none",
              borderRadius: "var(--r)",
              fontWeight: 600,
              cursor: loading || !imei ? "not-allowed" : "pointer",
              opacity: loading || !imei ? 0.5 : 1,
            }}
          >
            {loading ? "Loading..." : "Load History"}
          </button>
        </div>

        {error && (
          <p style={{ color: "var(--rose)", marginTop: "1rem", fontSize: "0.875rem" }}>{error}</p>
        )}
      </div>

      {/* Blockchain History */}
      {history.length > 0 && (
        <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
            Blockchain History ({history.length} transactions)
          </h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {history.map((entry) => (
              <div key={entry._id} style={{ padding: "1rem", background: "var(--bg)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: eventTypeColors[entry.eventType] }} />
                    <span style={{ fontWeight: 600 }}>{eventTypeLabels[entry.eventType] || entry.eventType}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>

                <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem", fontFamily: "monospace", wordBreak: "break-all", color: "var(--muted)" }}>
                  TX: {entry.transactionHash}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", fontSize: "0.875rem" }}>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Block</div>
                    <div>#{entry.blockNumber}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Confirmations</div>
                    <div>{entry.confirmations}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Verified</div>
                    <div style={{ color: entry.verified ? "var(--emerald)" : "var(--rose)" }}>
                      {entry.verified ? "✓ Yes" : "✗ No"}
                    </div>
                  </div>
                </div>

                {entry.ceirSynced && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--emerald)" }}>
                    ✓ CEIR Synced: {entry.ceirReference}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && imei && !loading && !error && (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "var(--r)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⛓️</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No Blockchain History</h3>
          <p style={{ color: "var(--muted)" }}>This device has no recorded blockchain transactions</p>
        </div>
      )}
    </div>
  );
}
