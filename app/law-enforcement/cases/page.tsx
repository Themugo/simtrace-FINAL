"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

interface LawEnforcementCase {
  _id: string;
  caseNumber: string;
  title: string;
  description: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  agency: string;
  status: 'open' | 'investigating' | 'evidence_collection' | 'prosecution' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedImeis: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function LawEnforcementCasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<LawEnforcementCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', description: '', agency: '', priority: 'medium' as const, relatedImeis: '' });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "law_enforcement")) { router.push("/login"); return; }
    if (user?.role === "law_enforcement") loadCases();
  }, [user, authLoading]);

  async function loadCases() {
    setLoading(true);
    try {
      const data = await api.get("/api/law-enforcement-cases");
      setCases(data.cases || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function createCase() {
    try {
      await api.post("/api/law-enforcement-cases", {
        title: newCase.title,
        description: newCase.description,
        agency: newCase.agency,
        priority: newCase.priority,
        relatedImeis: newCase.relatedImeis.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setNewCase({ title: '', description: '', agency: '', priority: 'medium', relatedImeis: '' });
      loadCases();
    } catch (err: any) {
      alert("Failed to create case: " + err.message);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--sky)';
      case 'investigating': return 'var(--amber)';
      case 'evidence_collection': return 'var(--violet)';
      case 'prosecution': return 'var(--emerald)';
      case 'closed': return 'var(--muted)';
      case 'archived': return 'var(--dim)';
      default: return 'var(--muted)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'var(--emerald)';
      case 'medium': return 'var(--sky)';
      case 'high': return 'var(--amber)';
      case 'critical': return 'var(--rose)';
      default: return 'var(--muted)';
    }
  };

  if (authLoading || loading) return <p className="text-muted" style={{ paddingTop: "2rem" }}>Loading…</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.15rem" }}>Law Enforcement Cases</h1>
          <p className="text-muted">{cases.length} active cases</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: "0.88rem", padding: "8px 16px" }}>
          + New Case
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "0.9rem" }}>
          Case Management
        </div>
        {cases.length === 0 ? (
          <p className="text-muted" style={{ padding: "2rem", textAlign: "center" }}>No cases found.</p>
        ) : cases.map((caseItem) => (
          <div key={caseItem._id} style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => router.push(`/law-enforcement/cases/${caseItem._id}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{caseItem.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{caseItem.caseNumber} · {caseItem.agency}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span className="badge" style={{ background: `${getPriorityColor(caseItem.priority)}20`, color: getPriorityColor(caseItem.priority), fontSize: "0.7rem" }}>
                  {caseItem.priority.toUpperCase()}
                </span>
                <span className="badge" style={{ background: `${getStatusColor(caseItem.status)}20`, color: getStatusColor(caseItem.status), fontSize: "0.7rem" }}>
                  {caseItem.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{caseItem.description}</div>
            {caseItem.relatedImeis.length > 0 && (
              <div style={{ fontSize: "0.75rem", color: "var(--dim)" }}>
                Related IMEIs: {caseItem.relatedImeis.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginBottom: "1rem" }}>Create New Case</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Title *</label>
                <input value={newCase.title} onChange={e => setNewCase({ ...newCase, title: e.target.value })} placeholder="Case title" />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea value={newCase.description} onChange={e => setNewCase({ ...newCase, description: e.target.value })} placeholder="Case description" style={{ minHeight: 100, padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label className="label">Agency *</label>
                <input value={newCase.agency} onChange={e => setNewCase({ ...newCase, agency: e.target.value })} placeholder="Agency name" />
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={newCase.priority} onChange={e => setNewCase({ ...newCase, priority: e.target.value as any })} style={{ width: "100%" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Related IMEIs (comma-separated)</label>
                <input value={newCase.relatedImeis} onChange={e => setNewCase({ ...newCase, relatedImeis: e.target.value })} placeholder="IMEI1, IMEI2, IMEI3" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button onClick={createCase} className="btn-primary" style={{ flex: 1 }}>Create Case</button>
                <button onClick={() => setShowCreateModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
