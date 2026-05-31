"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";

interface NewRequestData {
  imei: string;
  requestingCountry: string;
  targetCountry: string;
  requestType: string;
  priority: string;
}

interface Request {
  _id: string;
  imei: string;
  requestingCountry: string;
  targetCountry: string;
  requestType: string;
  status: string;
  priority: string;
  treaty?: string;
  submittedAt: string;
  expiresAt?: string;
  outcome?: string;
}

export default function CrossBorderPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequestData, setNewRequestData] = useState<NewRequestData>({
    imei: "",
    requestingCountry: "KE",
    targetCountry: "",
    requestType: "location_request",
    priority: "medium",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      if (user?.role === "admin") {
        const data = await api.get("/api/cross-border/requests/pending");
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
    setLoading(false);
  }

  async function handleCreateRequest() {
    try {
      await api.post("/api/cross-border/requests", {
        ...newRequestData,
        requestingAuthority: {
          agency: "SimTrace Security",
          contact: user?.email || "security@simtrace.com",
          badgeNumber: "ST-001",
        },
        targetAuthority: {
          agency: "Local Authority",
          contact: "contact@authority.gov",
          badgeNumber: "N/A",
        },
      });
      setShowNewRequest(false);
      setNewRequestData({
        imei: "",
        requestingCountry: "KE",
        targetCountry: "",
        requestType: "location_request",
        priority: "medium",
      });
      loadRequests();
    } catch (err: any) {
      alert(err.message || "Failed to create request");
    }
  }

  const requestTypeLabels: Record<string, string> = {
    location_request: "Location Request",
    device_seizure: "Device Seizure",
    investigation_assist: "Investigation Assist",
    legal_proceedings: "Legal Proceedings",
    extradition: "Extradition",
    evidence_sharing: "Evidence Sharing",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    acknowledged: "Acknowledged",
    in_progress: "In Progress",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
    expired: "Expired",
  };

  const statusColors: Record<string, string> = {
    pending: "var(--dim)",
    acknowledged: "var(--sky)",
    in_progress: "var(--amber)",
    approved: "var(--emerald)",
    rejected: "var(--rose)",
    completed: "var(--emerald)",
    expired: "var(--rose)",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Cross-Border Enforcement
          </h1>
          <p style={{ color: "var(--muted)" }}>
            International cooperation and legal framework for device recovery
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowNewRequest(true)}
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
            + New Request
          </button>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--bg)", padding: "2rem", borderRadius: "var(--r)", maxWidth: "600px", width: "100%", margin: "1rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Create Cross-Border Request</h2>
            
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>IMEI</label>
              <input
                value={newRequestData.imei}
                onChange={e => setNewRequestData({ ...newRequestData, imei: e.target.value })}
                placeholder="Enter IMEI"
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Requesting Country</label>
                <input
                  value={newRequestData.requestingCountry}
                  onChange={e => setNewRequestData({ ...newRequestData, requestingCountry: e.target.value.toUpperCase() })}
                  placeholder="KE"
                  maxLength={2}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Target Country</label>
                <input
                  value={newRequestData.targetCountry}
                  onChange={e => setNewRequestData({ ...newRequestData, targetCountry: e.target.value.toUpperCase() })}
                  placeholder="UG"
                  maxLength={2}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Request Type</label>
              <select
                value={newRequestData.requestType}
                onChange={e => setNewRequestData({ ...newRequestData, requestType: e.target.value })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="location_request">Location Request</option>
                <option value="device_seizure">Device Seizure</option>
                <option value="investigation_assist">Investigation Assist</option>
                <option value="legal_proceedings">Legal Proceedings</option>
                <option value="extradition">Extradition</option>
                <option value="evidence_sharing">Evidence Sharing</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Priority</label>
              <select
                value={newRequestData.priority}
                onChange={e => setNewRequestData({ ...newRequestData, priority: e.target.value })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--r)", border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleCreateRequest}
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
                Submit Request
              </button>
              <button
                onClick={() => setShowNewRequest(false)}
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

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "var(--r)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌍</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No Cross-Border Requests</h3>
          <p style={{ color: "var(--muted)" }}>Submit a request to initiate international cooperation</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {requests.map((request) => (
            <div key={request._id} style={{ background: "var(--surface)", padding: "1.5rem", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                    IMEI: {request.imei}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                    {request.requestingCountry} → {request.targetCountry}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: `${statusColors[request.status]}15`, color: statusColors[request.status] }}>
                    {statusLabels[request.status]}
                  </div>
                  <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--r)", fontSize: "0.75rem", background: "var(--border)" }}>
                    {request.priority.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontWeight: 500, marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                  {requestTypeLabels[request.requestType] || request.requestType}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Treaty: {request.treaty || "N/A"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", fontSize: "0.875rem" }}>
                <div>
                  <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Submitted</div>
                  <div>{new Date(request.submittedAt).toLocaleDateString()}</div>
                </div>
                {request.expiresAt && (
                  <div>
                    <div style={{ color: "var(--muted)", marginBottom: "0.25rem" }}>Expires</div>
                    <div>{new Date(request.expiresAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>

              {request.outcome && (
                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--border)", borderRadius: "var(--r)", fontSize: "0.875rem" }}>
                  <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>Outcome</div>
                  <div>{request.outcome}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
