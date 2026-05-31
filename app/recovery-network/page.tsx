"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

interface NewCaseData {
  imei: string;
  priority: string;
}

interface RecoveryCase {
  _id: string;
  imei: string;
  priority: string;
  status: string;
  createdAt: string;
  assignedAgents?: any[];
  workflowSteps?: Array<{
    step: string;
    status: string;
  }>;
  currentLocation?: {
    lat?: number;
    lng?: number;
  };
}

export default function RecoveryNetworkPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseData, setNewCaseData] = useState<NewCaseData>({ imei: "", priority: "medium" });

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await api.get("/api/recovery/cases/my");
      setCases(data.cases || []);
    } catch (err) {
      console.error("Failed to load cases:", err);
    }
    setLoading(false);
  }

  async function handleCreateCase() {
    try {
      await api.post("/api/recovery/cases", {
        imei: newCaseData.imei,
        priority: newCaseData.priority,
        recoveryFee: 5000,
        rewardOffered: 10000,
      });
      setShowNewCase(false);
      setNewCaseData({ imei: "", priority: "medium" });
      loadCases();
    } catch (err: any) {
      alert(err.message || "Failed to create case");
    }
  }

  const priorityColors: Record<string, string> = {
    low: "var(--dim)",
    medium: "var(--amber)",
    high: "var(--orange)",
    critical: "var(--rose)",
  };

  const statusLabels: Record<string, string> = {
    open: "Open",
    assigned: "Assigned",
    in_progress: "In Progress",
    negotiating: "Negotiating",
    recovered: "Recovered",
    failed: "Failed",
    closed: "Closed",
    escalated: "Escalated",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Autonomous Recovery Network
          </h1>
          <p style={{ color: "var(--muted)" }}>
            AI-powered device recovery with global agent network
          </p>
        </div>
        <button
          onClick={() => setShowNewCase(true)}
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
          + New Recovery Case
        </button>
      </div>

      {/* New Case Modal */}
      {showNewCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--bg)", padding: "2rem", borderRadius: "var(--r)", maxWidth: "500px", width: "100%", margin: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Create Recovery Case</h2>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>IMEI</label>
              <input
                value={newCaseData.imei}
                onChange={e => setNewCaseData({ ...newCaseData, imei: e.target.value })}
                placeholder="Enter IMEI"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Priority</label>
              <select
                value={newCaseData.priority}
                onChange={e => setNewCaseData({ ...newCaseData, priority: e.target.value })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleCreateCase}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "var(--sky)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--r)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create Case
              </button>
              <button
                onClick={() => setShowNewCase(false)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cases List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "var(--r)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📡</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No Recovery Cases</h3>
          <p style={{ color: "var(--muted)" }}>Create a recovery case to start tracking your device</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {cases.map((case_) => (
            <div key={case_._id} style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                    IMEI: {case_.imei}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                    Created: {new Date(case_.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: `${priorityColors[case_.priority]}15`, color: priorityColors[case_.priority] }}>
                    {case_.priority.toUpperCase()}
                  </div>
                  <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: "var(--border)" }}>
                    {statusLabels[case_.status]}
                  </div>
                </div>
              </div>

              {case_.assignedAgents && case_.assignedAgents.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                    Assigned Agents: {case_.assignedAgents.length}
                  </div>
                </div>
              )}

              {case_.workflowSteps && case_.workflowSteps.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontWeight: 500, marginBottom: "0.5rem", fontSize: "0.875rem" }}>Workflow Progress</div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {case_.workflowSteps.map((step, idx) => (
                      <div key={idx} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: step.status === "completed" ? "var(--emerald)15" : "var(--dim)15", borderRadius: "var(--r)" }}>
                        {step.step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {case_.currentLocation && (
                <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Last Known: {case_.currentLocation.lat?.toFixed(4)}, {case_.currentLocation.lng?.toFixed(4)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
