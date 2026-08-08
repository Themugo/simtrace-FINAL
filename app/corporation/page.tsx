"use client";

import React, { useState } from "react";

// Types for Phase 19 Corporate Modules
type CorpTab =
  | "structure"
  | "portfolio"
  | "cloud_ops"
  | "ai_org"
  | "services"
  | "academy"
  | "research"
  | "partners"
  | "customer_success"
  | "governance";

interface DivisionItem {
  id: string;
  name: string;
  lead: string;
  quarterlyRevenue: string;
  tenantsCount: number;
  status: "ACTIVE" | "EXPANDING";
  description: string;
}

interface CertificationCourse {
  id: string;
  title: string;
  level: "Associate" | "Professional" | "Architect" | "Executive";
  durationHours: number;
  enrolledStudents: number;
  examCode: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  domain: "AI Vision & OCR" | "Subsea Anti-Cloning" | "Zero-Knowledge Identity" | "Quantum-Safe Encryption";
  status: "PUBLISHED" | "PEER_REVIEW" | "PATENT_FILED";
  author: string;
  citationCount: number;
}

export default function SimTraceCorporationPage() {
  const [activeTab, setActiveTab] = useState<CorpTab>("structure");
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<CertificationCourse | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [examSubmitted, setExamSubmitted] = useState(false);

  // 1. Corporate Product Divisions State
  const [divisions] = useState<DivisionItem[]>([
    { id: "DIV-01", name: "Government & Sovereign DPI", lead: "Dr. A. Omondi", quarterlyRevenue: "$4.2M", tenantsCount: 14, status: "ACTIVE", description: "National CEIR, customs border verification, IMEI register, and digital public infrastructure." },
    { id: "DIV-02", name: "Telecom & Carrier Interconnect", lead: "K. Mwangi", quarterlyRevenue: "$5.8M", tenantsCount: 22, status: "ACTIVE", description: "Baseband signal monitoring, SIM swap risk detection, and EIR network gateway sync." },
    { id: "DIV-03", name: "InsurTech & Asset Underwriting", lead: "S. Chen", quarterlyRevenue: "$2.1M", tenantsCount: 8, status: "EXPANDING", description: "Micro-theft claim verification, instant M-Pesa escrow payouts, and pre-underwriting serial validation." },
    { id: "DIV-04", name: "Enterprise & Retail Logistics", lead: "M. Vance", quarterlyRevenue: "$1.8M", tenantsCount: 12, status: "ACTIVE", description: "Supply chain custody tracking, high-value asset serial tagging, and retail fraud prevention." },
    { id: "DIV-05", name: "Law Enforcement & Evidence Labs", lead: "Capt. J. Ruto", quarterlyRevenue: "$1.4M", tenantsCount: 19, status: "ACTIVE", description: "Court-admissible forensic hashes, IMEI chain of custody, and stolen recovery dispatch." },
    { id: "DIV-06", name: "SimTrace AI & Intelligence Labs", lead: "Dr. E. Thorne", quarterlyRevenue: "$1.1M", tenantsCount: 48, status: "EXPANDING", description: "Gemini 1.5 Flash vision OCR, neural anomaly prediction, and automated copilot assistants." },
  ]);

  // 2. SimTrace Academy Courses
  const [courses] = useState<CertificationCourse[]>([
    { id: "CRS-101", title: "SimTrace Certified Platform Associate (SCPA)", level: "Associate", durationHours: 12, enrolledStudents: 1420, examCode: "ST-EXAM-101" },
    { id: "CRS-201", title: "Sovereign Cloud & K8s Enclave Engineer", level: "Professional", durationHours: 32, enrolledStudents: 680, examCode: "ST-EXAM-201" },
    { id: "CRS-301", title: "Enterprise Anti-Theft Architect (EATA)", level: "Architect", durationHours: 48, enrolledStudents: 240, examCode: "ST-EXAM-301" },
    { id: "CRS-401", title: "Executive DPI Policy & Digital Identity", level: "Executive", durationHours: 8, enrolledStudents: 190, examCode: "ST-EXAM-401" },
  ]);

  // 3. Research Papers
  const [researchPapers] = useState<ResearchPaper[]>([
    { id: "RES-901", title: "Sub-200ms Forensic OCR Extraction on Reflective Smartphone Packaging using Gemini 1.5", domain: "AI Vision & OCR", status: "PUBLISHED", author: "SimTrace AI Labs & DeepMind Research", citationCount: 42 },
    { id: "RES-902", title: "Subsea Fiber Optic Baseband Signals for Real-Time Device Cloning Mitigation", domain: "Subsea Anti-Cloning", status: "PATENT_FILED", author: "Telecom Signal Processing Division", citationCount: 18 },
    { id: "RES-903", title: "Zero-Knowledge Proofs for Cross-Border Sovereign Data Exchange", domain: "Zero-Knowledge Identity", status: "PEER_REVIEW", author: "Cryptography & Privacy Division", citationCount: 29 },
  ]);

  function handleTakeExam(course: CertificationCourse) {
    setSelectedExam(course);
    setCandidateName("");
    setExamSubmitted(false);
    setExamModalOpen(true);
  }

  function submitExam(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateName.trim()) return;
    setExamSubmitted(true);
    setTimeout(() => {
      alert(`🎉 Congratulations ${candidateName}! You passed ${selectedExam?.title} (${selectedExam?.examCode}) with 96% Score. Certification Badge issued on SimTrace Blockchain Ledger.`);
      setExamModalOpen(false);
    }, 1200);
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* ── HEADER BANNER ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🏛️</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              SimTrace Technology Corporation
            </h1>
            <span style={{ fontSize: "0.72rem", background: "var(--indigo)22", color: "var(--indigo)", border: "1px solid var(--indigo)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
              Phase 19 Global Corporate OS
            </span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, maxWidth: 840 }}>
            Unified corporate architecture organizing 6 product divisions, shared platform services, global cloud operations, AI labs, professional services, and SimTrace Academy.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Corporate Valuation</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--emerald)" }}>$185,000,000</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.5rem 0.85rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "right" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>Global Employees</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--sky)" }}>340 Engineers & SREs</div>
          </div>
        </div>
      </div>

      {/* ── TOP EXECUTIVE HIGHLIGHTS ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--indigo)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Product Divisions</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>6 Operating Units</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>100% Shared Platform Services</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--sky)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>SimTrace Academy</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>2,530 Graduates</div>
          <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>4 Certified Exam Tracks</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--emerald)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Research & Patents</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>14 Patents Filed</div>
          <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>Gemini AI Vision Certified</div>
        </div>
        <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--amber)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Professional Services</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>28 Active Rollouts</div>
          <div style={{ fontSize: "0.72rem", color: "var(--amber)", marginTop: 4 }}>99.2% On-Time Delivery</div>
        </div>
      </div>

      {/* ── NAVIGATION MODULE SWITCHER (10 PILLARS) ────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {[
          { id: "structure", label: "🏢 Product Divisions & Org", icon: "🏢" },
          { id: "portfolio", label: "💼 Portfolio Governance", icon: "💼" },
          { id: "cloud_ops", label: "☁️ Hybrid & On-Prem Cloud", icon: "☁️" },
          { id: "ai_org", label: "🤖 AI Org & Copilot Suite", icon: "🤖" },
          { id: "services", label: "🛠️ Professional Services", icon: "🛠️" },
          { id: "academy", label: "🎓 SimTrace Academy", icon: "🎓" },
          { id: "research", label: "🔬 Research & Patents", icon: "🔬" },
          { id: "partners", label: "🤝 Global Partner Network", icon: "🤝" },
          { id: "customer_success", label: "📈 CS & EBR Reviews", icon: "📈" },
          { id: "governance", label: "⚖️ Corporate Legal & Risk", icon: "⚖️" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as CorpTab)}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: `1px solid ${activeTab === tab.id ? "var(--indigo)" : "transparent"}`,
              background: activeTab === tab.id ? "var(--indigo)22" : "transparent",
              color: activeTab === tab.id ? "var(--indigo)" : "var(--muted)",
              fontWeight: activeTab === tab.id ? 800 : 500,
              fontSize: "0.82rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MODULE 1: PRODUCT DIVISIONS & ORG STRUCTURE ────────────────────────── */}
      {activeTab === "structure" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🏢 Independent Product Divisions & Shared Core Services</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Each operating division delivers specialized domain solutions built on top of shared IAM, telemetry, and billing services.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
              {divisions.map(div => (
                <div key={div.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--indigo)", fontWeight: 800 }}>{div.id}</span>
                      <span style={{ fontSize: "0.7rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                        {div.status}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "2px 0 6px 0" }}>{div.name}</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>{div.description}</p>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.75rem", paddingTop: "0.6rem", display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span>Division Lead: <strong>{div.lead}</strong></span>
                    <span style={{ color: "var(--emerald)", fontWeight: 700 }}>Qtr Revenue: {div.quarterlyRevenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 2: PORTFOLIO PRODUCT MANAGEMENT ───────────────────────────── */}
      {activeTab === "portfolio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>💼 Portfolio Management & Lifecycle Roadmaps</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Strategic resource allocation, product lifecycle gates (GA, Beta, Deprecated), and multi-year vision.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { name: "SimTrace National CEIR 4.0", stage: "GENERAL_AVAILABILITY", target: "Pan-African EACCMA States", allocation: "35% R&D Budget" },
                { name: "Gemini 1.5 Pro Anti-Cloning Vision AI", stage: "BETA_TESTING", target: "Carrier Forensics & Customs", allocation: "25% R&D Budget" },
                { name: "Legacy EIR 2G Gateway Sync", stage: "DEPRECATION_SCHEDULED", target: "Sunset by Q4 2026", allocation: "5% Maintenance" },
              ].map((p, idx) => (
                <div key={idx} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem" }}>{p.name}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Target Sector: {p.target}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", background: "var(--sky)22", color: "var(--sky)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                      {p.stage} ({p.allocation})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 3: CLOUD OPERATIONS ───────────────────────────────────────── */}
      {activeTab === "cloud_ops" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>☁️ Multi-Deployment Cloud Operations (SaaS, Private, Hybrid & On-Prem)</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Manage cloud topologies across public Cloud Run, private AWS EKS clusters, and isolated air-gapped sovereign military enclaves.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--sky)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 800 }}>PUBLIC CLOUD RUN (SAAS)</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0" }}>14 Tenant Enclaves</div>
                <div style={{ fontSize: "0.75rem", color: "var(--emerald)", fontWeight: 700 }}>✓ Auto-Scaling Active (Port 3000)</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--indigo)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--indigo)", fontWeight: 800 }}>PRIVATE AWS/GCP K8S</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0" }}>22 Sovereign Enclaves</div>
                <div style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 700 }}>✓ Terraform Managed</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--amber)33", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--amber)", fontWeight: 800 }}>AIR-GAPPED ON-PREMISES</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0" }}>12 Defense Enclaves</div>
                <div style={{ fontSize: "0.75rem", color: "var(--amber)", fontWeight: 700 }}>✓ STOS Appliance v4.8</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 4: UNIFIED AI ORGANIZATION ────────────────────────────────── */}
      {activeTab === "ai_org" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🤖 Corporate AI Organization & Gemini Copilot Engine</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Centralized AI platform providing server-side Gemini 1.5 Flash and Pro APIs for vision OCR, RAG, and automated compliance assistants.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div><strong>Core Model Engine:</strong> Google GenAI SDK (Gemini 1.5 Flash / Pro)</div>
              <div><strong>Server-Side Security:</strong> 100% Proxied via <code>/api/gemini</code> — zero browser API key exposure.</div>
              <div><strong>Token Optimization:</strong> Sub-200ms document processing with caching enabled.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 5: PROFESSIONAL SERVICES ──────────────────────────────────── */}
      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🛠️ Professional Services & Migration Frameworks</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Turnkey consulting playbooks, legacy EIR database migrations, and 24/7 dedicated SRE deployment teams.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--sky)", marginTop: 0 }}>📦 Legacy EIR Migration Toolkit</h4>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                  Automated ETL pipeline for ingesting Oracle / CSV carrier blacklist databases into SimTrace Cloud SQL enclaves.
                </div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--emerald)", marginTop: 0 }}>📋 90-Day Sovereign Rollout Framework</h4>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                  Step-by-step implementation methodology certified for East African Community customs authorities.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 6: SIMTRACE ACADEMY ───────────────────────────────────────── */}
      {activeTab === "academy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🎓 SimTrace Academy & Professional Certification Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Interactive training tracks and examinations for engineers, law enforcement officers, and government policy makers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {courses.map(course => (
                <div key={course.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--sky)", fontWeight: 800 }}>{course.examCode}</span>
                      <span style={{ fontSize: "0.7rem", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                        {course.level}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "4px 0" }}>{course.title}</h4>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 10px 0" }}>
                      Duration: {course.durationHours} Hours • {course.enrolledStudents} Certified Graduates
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTakeExam(course)}
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.78rem", width: "100%" }}
                  >
                    🎓 Take Certification Exam
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 7: RESEARCH & PATENTS ──────────────────────────────────────── */}
      {activeTab === "research" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🔬 SimTrace Research Labs & Patent Portfolio</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Academic papers, zero-knowledge privacy research, and patented subsea signal anti-cloning algorithms.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {researchPapers.map(paper => (
                <div key={paper.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--sky)", fontWeight: 800 }}>{paper.id}</span>
                      <strong style={{ fontSize: "0.9rem" }}>{paper.title}</strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
                      Author: {paper.author} • Citations: <strong>{paper.citationCount}</strong>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", background: "var(--emerald)22", color: "var(--emerald)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                    {paper.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 8: GLOBAL PARTNER NETWORK ──────────────────────────────────── */}
      {activeTab === "partners" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>🤝 Global Partner Network & Channel Operations</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              System Integrators, Telecom Operators, InsurTech OEMs, and Regional Consulting Partners.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CERTIFIED SYSTEM INTEGRATORS</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--sky)", margin: "4px 0" }}>42 Partners</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)" }}>Dimension Data, Safaricom, etc.</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>TELECOM CARRIER GATEWAYS</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>18 Operators</div>
                <div style={{ fontSize: "0.72rem", color: "var(--sky)" }}>Direct Baseband EIR Interconnect</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>ANNUAL PARTNER REVENUE SPLIT</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>$4.2M Distributed</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)" }}>100% Automated Royalty Settlement</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 9: CUSTOMER SUCCESS & EBR ─────────────────────────────────── */}
      {activeTab === "customer_success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>📈 Executive Business Reviews (EBR) & Renewal Planning</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Quarterly executive reviews, value realization metrics, and expansion account plans.
            </p>

            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div><strong>Kenya Customs CEIR:</strong> Q3 EBR Completed — Achieved 94% reduction in contraband device smuggling.</div>
              <div><strong>Safaricom Core:</strong> Q4 EBR Scheduled — In-progress expansion to 5G network slices.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULE 10: CORPORATE GOVERNANCE, LEGAL & RISK ───────────────────── */}
      {activeTab === "governance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "0.5rem" }}>⚖️ Corporate Governance, Legal Compliance & Risk</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              ISO 27001, SOC2 Type II, Kenya DPA 2019, and EU GDPR sovereign compliance oversight.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 4 }}>✓ SOC2 Type II Certified</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Annual audit completed with zero non-conformances.</div>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 4 }}>✓ Kenya Data Protection Act 2019</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Full compliance for East African Sovereign Data Enclaves.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EXAMINATION MODAL ────────────────────────────────────────────────── */}
      {examModalOpen && selectedExam && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, maxWidth: 500, width: "100%", padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", margin: 0, color: "var(--indigo)" }}>
                🎓 SimTrace Academy Certification Exam
              </h3>
              <button onClick={() => setExamModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form onSubmit={submitExam} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--bg)", padding: "0.75rem", borderRadius: 8, fontSize: "0.8rem" }}>
                <div>Course: <strong>{selectedExam.title}</strong></div>
                <div>Code: <code>{selectedExam.examCode}</code></div>
                <div>Passing Score required: <strong>85%</strong></div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  placeholder="e.g. Inspector Grace Wanjiku"
                  style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setExamModalOpen(false)} className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.8rem", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "6px 16px", fontSize: "0.8rem" }}>
                  Start & Submit Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
