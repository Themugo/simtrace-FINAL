"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

export default function DeviceDnaPage() {
  const { user } = useAuth();
  const [imei, setImei] = useState("");
  const [dnaData, setDnaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  async function handleCollect() {
    setLoading(true);
    setError("");
    try {
      const dna = await api.post("/api/dna/collect", {
        imei,
        chipset: {
          manufacturer: "Qualcomm",
          model: "Snapdragon 8 Gen 2",
          socId: "SM8550",
          cpuCores: 8,
          gpuModel: "Adreno 740",
        },
        radio: {
          basebandVersion: "M8550-AAAANZM-410(00)",
          modemFirmware: "SW Version",
          supportedBands: ["1", "3", "5", "8", "28", "40", "41"],
          imeiHash: "hash_placeholder",
        },
        sensors: {
          accelerometer: { bias: [0.01, 0.02, 0.98], scale: [1.0, 1.0, 1.0] },
          gyroscope: { bias: [0, 0, 0], scale: [1.0, 1.0, 1.0] },
          magnetometer: { bias: [0.5, 0.5, 0.5], scale: [1.0, 1.0, 1.0] },
        },
        entropy: {
          bootTime: new Date(),
          uptime: 3600000,
          memoryPattern: "pattern_123",
          thermalProfile: "normal",
        },
      });
      setDnaData(dna);
      setShowVerify(true);
    } catch (err) {
      setError(err.message || "Failed to collect DNA");
    }
    setLoading(false);
  }

  async function handleVerify() {
    setLoading(true);
    try {
      const result = await api.post("/api/dna/verify", {
        imei,
        providedDna: dnaData,
      });
      setDnaData({ ...dnaData, verification: result });
    } catch (err) {
      setError(err.message || "Verification failed");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Global Device DNA
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Hardware-level device fingerprinting for anti-cloning and verification
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Input Section */}
        <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Collect Device DNA</h2>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>IMEI</label>
            <input
              value={imei}
              onChange={e => setImei(e.target.value)}
              placeholder="Enter 15-17 digit IMEI"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>

          <button
            onClick={handleCollect}
            disabled={loading || !imei}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--sky)",
              color: "white",
              border: "none",
              borderRadius: "var(--r)",
              fontWeight: 600,
              cursor: loading || !imei ? "not-allowed" : "pointer",
              opacity: loading || !imei ? 0.5 : 1,
            }}
          >
            {loading ? "Collecting..." : "Collect DNA"}
          </button>

          {error && (
            <p style={{ color: "var(--rose)", marginTop: "1rem", fontSize: "0.875rem" }}>{error}</p>
          )}
        </div>

        {/* DNA Display */}
        {dnaData && (
          <div style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>DNA Profile</h2>
            
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Status</div>
              <div style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.875rem", background: dnaData.verified ? "var(--emerald)15" : "var(--dim)15", color: dnaData.verified ? "var(--emerald)" : "var(--dim)" }}>
                {dnaData.verified ? "Verified" : "Unverified"}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Chipset Signature</div>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{dnaData.chipset?.signature || "N/A"}</code>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Radio Signature</div>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{dnaData.radio?.networkSignature || "N/A"}</code>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Sensor Fingerprint</div>
              <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{dnaData.sensors?.fingerprint || "N/A"}</code>
            </div>

            {dnaData.cloneDetected && (
              <div style={{ padding: "0.75rem", background: "var(--rose)15", borderRadius: "var(--r)", border: "1px solid var(--rose)30", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, color: "var(--rose)", marginBottom: "0.25rem" }}>⚠️ Clone Detected</div>
                <div style={{ fontSize: "0.875rem" }}>{dnaData.cloneCount} potential clones found</div>
              </div>
            )}

            {showVerify && !dnaData.verification && (
              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--indigo)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--r)",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Verifying..." : "Verify DNA"}
              </button>
            )}

            {dnaData.verification && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: dnaData.verification.verified ? "var(--emerald)15" : "var(--rose)15", borderRadius: "var(--r)" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Verification Result</div>
                <div style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                  Confidence: <strong>{dnaData.verification.confidence}%</strong>
                </div>
                <div style={{ fontSize: "0.875rem" }}>
                  {dnaData.verification.verified ? "✅ DNA Verified" : "❌ Verification Failed"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
