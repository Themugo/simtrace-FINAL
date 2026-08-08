"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SCPPage() {
  const [activeTab, setActiveTab] = useState<
    | "control_plane"
    | "tenant_quotas"
    | "audit_log_replay"
    | "provisioning"
    | "environments"
    | "multiregion"
    | "whitelabel"
    | "ai_management"
    | "billing"
    | "operations_center"
    | "customer_success"
  >("control_plane");

  // ── 0. Tenant Usage & Quotas State ──────────────────────────────────────────
  interface TenantQuotaItem {
    id: string;
    name: string;
    plan: string;
    apiRateLimitRps: number;
    apiCurrentRps: number;
    storageCapGB: number;
    storageCurrentGB: number;
    aiTokenQuotaMonthly: number; // Millions
    aiTokenCurrentMonthly: number; // Millions
    enforcementMode: "HARD_CAP" | "SOFT_THROTTLE" | "AUTO_SCALE";
    alertThresholdPercent: number;
    lastUpdated: string;
  }

  const [tenantQuotas, setTenantQuotas] = useState<TenantQuotaItem[]>([
    {
      id: "TNT-001",
      name: "Safaricom PLC Enterprise CEIR",
      plan: "ENTERPRISE SOVEREIGN",
      apiRateLimitRps: 10000,
      apiCurrentRps: 6840,
      storageCapGB: 50000,
      storageCurrentGB: 34200,
      aiTokenQuotaMonthly: 250,
      aiTokenCurrentMonthly: 168,
      enforcementMode: "AUTO_SCALE",
      alertThresholdPercent: 85,
      lastUpdated: "Just now",
    },
    {
      id: "TNT-002",
      name: "Jubilee InsurTech Micro-Insurance",
      plan: "INSURTECH PRO",
      apiRateLimitRps: 3000,
      apiCurrentRps: 1420,
      storageCapGB: 10000,
      storageCurrentGB: 4800,
      aiTokenQuotaMonthly: 50,
      aiTokenCurrentMonthly: 22,
      enforcementMode: "SOFT_THROTTLE",
      alertThresholdPercent: 80,
      lastUpdated: "10 mins ago",
    },
    {
      id: "TNT-003",
      name: "DCI National Cybercrime Taskforce",
      plan: "GOVERNMENT DEDICATED",
      apiRateLimitRps: 15000,
      apiCurrentRps: 8900,
      storageCapGB: 100000,
      storageCurrentGB: 72000,
      aiTokenQuotaMonthly: 500,
      aiTokenCurrentMonthly: 390,
      enforcementMode: "AUTO_SCALE",
      alertThresholdPercent: 90,
      lastUpdated: "5 mins ago",
    },
    {
      id: "TNT-004",
      name: "iSpot Apple Authorized Reseller Hub",
      plan: "RETAIL PARTNER",
      apiRateLimitRps: 1000,
      apiCurrentRps: 820,
      storageCapGB: 2500,
      storageCurrentGB: 2150,
      aiTokenQuotaMonthly: 15,
      aiTokenCurrentMonthly: 13.8,
      enforcementMode: "HARD_CAP",
      alertThresholdPercent: 85,
      lastUpdated: "1 hour ago",
    },
  ]);

  const [editingQuota, setEditingQuota] = useState<TenantQuotaItem | null>(null);
  const [quotaToast, setQuotaToast] = useState<string | null>(null);

  const regions = [
    { code: "af-south-1", location: "Cape Town, South Africa", compliance: "ISO-27001 / GDPR", latency: "12ms", primaryFor: "Primary East & Southern Africa Cluster" },
    { code: "eu-west-2", location: "London, United Kingdom", compliance: "GDPR / UK DPA", latency: "42ms", primaryFor: "European Failover & Backup" },
    { code: "me-central-1", location: "Dubai, UAE", compliance: "NESA / UAE Data Law", latency: "38ms", primaryFor: "Middle East Enterprise Edge" },
  ];

  const [whiteLabelConfig, setWhiteLabelConfig] = useState({
    appName: "SIMTRACE Enterprise Portal",
    customDomain: "security.simtrace.io",
    primaryColor: "#2563EB",
    logoText: "SIMTRACE SOVEREIGN",
  });

  const aiModels = [
    { name: "Gemini 1.5 Pro Sovereign RAG", provider: "Google Vertex AI", monthlyTokens: "148.2M", latency: "120ms", status: "Active" },
    { name: "Gemini 1.5 Flash Real-time Alerting", provider: "Google Vertex AI", monthlyTokens: "842.0M", latency: "45ms", status: "Active" },
  ];

  const opsHealth = {
    clusterUptime: "99.998%",
    activeKubernetesPods: "142",
    backupSnapshotStatus: "Completed (Hourly Sync Active)",
  };

  // ── 0.1 Audit Log Replay State & Seed Events ──────────────────────────────
  interface AuditLogEvent {
    id: string;
    timestamp: string;
    relativeMs: number;
    tenantId: string;
    tenantName: string;
    eventType: "SECURITY_ALERT" | "TENANT_PROVISION" | "QUOTA_BREACH" | "CONFIG_CHANGE" | "FAILOVER_EVENT" | "AI_MODEL_DEPLOY" | "IAM_POLICY_UPDATE";
    severity: "CRITICAL" | "WARNING" | "INFO";
    actor: string;
    ipAddress: string;
    region: string;
    action: string;
    details: string;
    payloadJson: Record<string, any>;
    signatureVerified: boolean;
    complianceTag: string;
  }

  const [auditEvents, setAuditEvents] = useState<AuditLogEvent[]>([
    {
      id: "EVT-8091",
      timestamp: "2026-08-01 00:05:12 UTC",
      relativeMs: 0,
      tenantId: "TNT-001",
      tenantName: "Safaricom PLC Enterprise CEIR",
      eventType: "TENANT_PROVISION",
      severity: "INFO",
      actor: "root-ops@simtrace.io",
      ipAddress: "197.232.12.90",
      region: "AWS africa-south-1a",
      action: "Provisioned Sovereign K8s Node Pool",
      details: "Auto-scaled cluster capacity from 12 to 16 compute nodes to accommodate national MNO peak throughput.",
      payloadJson: {
        clusterId: "cls-saf-ke-01",
        nodesAdded: 4,
        nodeType: "c6i.4xlarge",
        zone: "af-south-1a",
        autoScaler: "Karpenter-v0.32",
        status: "SUCCESS"
      },
      signatureVerified: true,
      complianceTag: "ISO-27001"
    },
    {
      id: "EVT-8092",
      timestamp: "2026-08-01 00:12:44 UTC",
      relativeMs: 7000,
      tenantId: "TNT-001",
      tenantName: "Safaricom PLC Enterprise CEIR",
      eventType: "CONFIG_CHANGE",
      severity: "INFO",
      actor: "admin@safaricom.co.ke",
      ipAddress: "197.232.4.11",
      region: "AWS africa-south-1a",
      action: "Updated API Rate Limit & Storage Quotas",
      details: "Increased API Rate Limit to 10,000 RPS and Storage Cap to 50,000 GB via SCP Control Console.",
      payloadJson: {
        previousRateLimitRps: 8000,
        newRateLimitRps: 10000,
        previousStorageCapGB: 40000,
        newStorageCapGB: 50000,
        mfaVerified: true,
        sessionToken: "sess_saf_98a71b"
      },
      signatureVerified: true,
      complianceTag: "SOC2-TYPE-II"
    },
    {
      id: "EVT-8093",
      timestamp: "2026-08-01 00:24:08 UTC",
      relativeMs: 18000,
      tenantId: "TNT-004",
      tenantName: "iSpot Apple Authorized Reseller Hub",
      eventType: "QUOTA_BREACH",
      severity: "WARNING",
      actor: "system-quota-enforcer",
      ipAddress: "10.0.4.102 (Internal)",
      region: "Cloudflare Edge",
      action: "Storage Capacity Threshold Exceeded (85%)",
      details: "Tenant iSpot Reseller Hub reached 86% storage utilization (2.15 TB of 2.50 TB). Triggered SOFT_THROTTLE notice.",
      payloadJson: {
        currentStorageGB: 2150,
        maxStorageGB: 2500,
        utilizationPercent: 86.0,
        enforcementAction: "NOTIFY_ADMIN_EMAIL",
        autoPurgeEligible: false
      },
      signatureVerified: true,
      complianceTag: "EAC-CEIR-COMPLIANT"
    },
    {
      id: "EVT-8094",
      timestamp: "2026-08-01 00:31:55 UTC",
      relativeMs: 25000,
      tenantId: "TNT-003",
      tenantName: "DCI National Cybercrime Taskforce",
      eventType: "SECURITY_ALERT",
      severity: "CRITICAL",
      actor: "sentinel-ai-guard",
      ipAddress: "197.232.44.12",
      region: "Nairobi Sovereign Enclave",
      action: "Rapid Illegal IMEI Query Anomaly Blocked",
      details: "Detected 1,420 rapid unauthorized IMEI lookup bursts within 30 seconds. Automatic IP firewall drop rule generated.",
      payloadJson: {
        threatType: "DDOS_BRUTE_FORCE_LOOKUP",
        requestsCount: 1420,
        windowSeconds: 30,
        targetEndpoint: "/api/v1/imei/lookup",
        firewallRuleId: "fw-rule-9902",
        status: "AUTO_MITIGATED"
      },
      signatureVerified: true,
      complianceTag: "ISO-27001"
    },
    {
      id: "EVT-8095",
      timestamp: "2026-08-01 00:36:10 UTC",
      relativeMs: 34000,
      tenantId: "TNT-002",
      tenantName: "Jubilee InsurTech Micro-Insurance",
      eventType: "FAILOVER_EVENT",
      severity: "WARNING",
      actor: "auto-healer-bot",
      ipAddress: "10.0.12.4 (Control Loop)",
      region: "GCP europe-west2b",
      action: "Automatic Region Latency Shift Executed",
      details: "Latency spike detected in europe-west2b (48ms RTT). Shifted 30% carrier traffic to secondary failover node.",
      payloadJson: {
        primaryZone: "europe-west2b",
        backupZone: "europe-west2a",
        trafficShiftPercent: 30,
        latencyBeforeMs: 48,
        latencyAfterMs: 14,
        healthCheck: "PASSING"
      },
      signatureVerified: true,
      complianceTag: "GDPR-ART-32"
    },
    {
      id: "EVT-8096",
      timestamp: "2026-08-01 00:42:01 UTC",
      relativeMs: 42000,
      tenantId: "TNT-GLOBAL",
      tenantName: "SimTrace Enterprise Cloud Fleet",
      eventType: "AI_MODEL_DEPLOY",
      severity: "INFO",
      actor: "ai-mlops@simtrace.io",
      ipAddress: "41.204.188.10",
      region: "Global Sovereign Mesh",
      action: "Deployed Gemini 1.5 Flash Vision OCR v4.8",
      details: "Zero-downtime canary deployment of updated document device verification model across all 4 regional hubs.",
      payloadJson: {
        modelAlias: "gemini-1.5-flash",
        version: "v4.8-canary",
        canaryPercentage: 100,
        inferenceLatencyMs: 140,
        accuracyScore: 99.4,
        rollbackAvailable: true
      },
      signatureVerified: true,
      complianceTag: "SOC2-TYPE-II"
    },
    {
      id: "EVT-8097",
      timestamp: "2026-08-01 00:48:30 UTC",
      relativeMs: 50000,
      tenantId: "TNT-003",
      tenantName: "DCI National Cybercrime Taskforce",
      eventType: "IAM_POLICY_UPDATE",
      severity: "INFO",
      actor: "security-admin@dci.gov.ke",
      ipAddress: "102.68.16.44",
      region: "Nairobi Sovereign Enclave",
      action: "OAuth2 Client Credentials & Key Rotation",
      details: "Rotated mTLS certificates and JWT Signing keys for DCI evidence capture API integration.",
      payloadJson: {
        clientId: "client_dci_cyber_881",
        keyAlgorithm: "RS256_4096",
        expiresAt: "2027-08-01T00:00:00Z",
        previousKeyRevoked: true,
        mTLSRequired: true
      },
      signatureVerified: true,
      complianceTag: "ISO-27001"
    },
    {
      id: "EVT-8098",
      timestamp: "2026-08-01 00:54:18 UTC",
      relativeMs: 55000,
      tenantId: "TNT-001",
      tenantName: "Safaricom PLC Enterprise CEIR",
      eventType: "SECURITY_ALERT",
      severity: "CRITICAL",
      actor: "hsm-vault-guard",
      ipAddress: "41.204.188.9",
      region: "AWS africa-south-1a",
      action: "Invalid Signature Blacklist Request Rejected",
      details: "Blocked unauthorized request to /api/ceir/blacklist missing cryptographically valid HSM hardware signature.",
      payloadJson: {
        endpoint: "/api/ceir/blacklist",
        httpStatus: 403,
        error: "INVALID_HARDWARE_SIGNATURE",
        digestHeader: "sha256=invalid_token_99a",
        clientCertThumbprint: "UNKNOWN"
      },
      signatureVerified: false,
      complianceTag: "EAC-CEIR-COMPLIANT"
    },
    {
      id: "EVT-8099",
      timestamp: "2026-08-01 01:02:00 UTC",
      relativeMs: 60000,
      tenantId: "TNT-002",
      tenantName: "Jubilee InsurTech Micro-Insurance",
      eventType: "CONFIG_CHANGE",
      severity: "INFO",
      actor: "admin@jubilee.co.ke",
      ipAddress: "197.232.19.4",
      region: "GCP europe-west2",
      action: "Updated Policy Enforcement Mode",
      details: "Toggled tenant policy enforcement mode from HARD_CAP to SOFT_THROTTLE for claims queue microservices.",
      payloadJson: {
        previousMode: "HARD_CAP",
        newMode: "SOFT_THROTTLE",
        effectImmediate: true,
        reason: "Handling end-of-month claims influx"
      },
      signatureVerified: true,
      complianceTag: "GDPR-ART-32"
    }
  ]);

  // Replay controls state
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 5 | 10>(1);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterEventType, setFilterEventType] = useState<string>("ALL");
  const [filterTenant, setFilterTenant] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>("EVT-8091");
  const [replayToast, setReplayToast] = useState<string | null>(null);

  // Simulation Modal state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simForm, setSimForm] = useState({
    tenantId: "TNT-001",
    eventType: "SECURITY_ALERT" as const,
    severity: "CRITICAL" as const,
    actor: "sentinel-guard@simtrace.io",
    action: "Custom Infrastructure Event Simulated",
    details: "Triggered synthetic vulnerability test via SCP Audit Replay Harness.",
  });

  // Filtered Events computed list
  const filteredEvents = auditEvents.filter(evt => {
    if (filterSeverity !== "ALL" && evt.severity !== filterSeverity) return false;
    if (filterEventType !== "ALL" && evt.eventType !== filterEventType) return false;
    if (filterTenant !== "ALL" && evt.tenantId !== filterTenant) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        evt.id.toLowerCase().includes(q) ||
        evt.action.toLowerCase().includes(q) ||
        evt.actor.toLowerCase().includes(q) ||
        evt.tenantName.toLowerCase().includes(q) ||
        evt.ipAddress.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Handle auto-advance playback interval
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = Math.max(250, 2000 / replaySpeed);
    const timer = setInterval(() => {
      setReplayIndex(prev => {
        const next = prev + 1;
        if (next >= filteredEvents.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, replaySpeed, filteredEvents.length]);

  // Sync selected event when replayIndex changes
  useEffect(() => {
    if (filteredEvents[replayIndex]) {
      setSelectedEventId(filteredEvents[replayIndex].id);
    }
  }, [replayIndex, filteredEvents]);

  const activeSelectedEvent = auditEvents.find(e => e.id === selectedEventId) || filteredEvents[replayIndex] || auditEvents[0];

  // ── 1. Cloud Control Plane State ───────────────────────────────────────────
  const [tenants, setTenants] = useState([
    { id: "TNT-001", name: "Safaricom PLC Enterprise CEIR", region: "AWS africa-south-1 (Nairobi Local Zone)", status: "HEALTHY", plan: "ENTERPRISE SOVEREIGN", activeDevices: "12,400,000", nodes: 16 },
    { id: "TNT-002", name: "Jubilee InsurTech Micro-Insurance", region: "GCP europe-west2 (London Secondary)", status: "HEALTHY", plan: "INSURTECH PRO", activeDevices: "1,850,000", nodes: 6 },
    { id: "TNT-003", name: "DCI National Cybercrime Taskforce", region: "Sovereign On-Premise Cloud Enclave", status: "HEALTHY", plan: "GOVERNMENT DEDICATED", activeDevices: "4,200,000", nodes: 12 },
    { id: "TNT-004", name: "iSpot Apple Authorized Reseller Hub", region: "Vercel / Cloudflare Edge Network", status: "HEALTHY", plan: "RETAIL PARTNER", activeDevices: "450,000", nodes: 4 },
  ]);

  // ── 2. Self-Service Provisioning Wizard State ─────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [provisionForm, setProvisionForm] = useState({
    orgName: "",
    domain: "",
    cloudProvider: "aws",
    primaryRegion: "africa-south-1",
    drRegion: "europe-west2",
    selectedModules: ["identity", "trust_engine", "incident_platform"],
    customColor: "#6366f1",
    tags: ["cost-center:CC-4910", "proj:eac-ceir"],
  });

  const availableRegions = [
    { 
      code: "africa-south-1", 
      name: "Nairobi / Johannesburg (Africa Sovereign)", 
      latency: "6ms", 
      rtt: "6.2ms RTT (Direct Peering)", 
      status: "Optimal Sovereign Enclave",
      proximityGroup: "📍 Sovereign & Local Proximity (<15ms RTT)",
      zones: [
        { name: "af-south-1a", status: "ONLINE", type: "Primary DC", load: "14%" },
        { name: "af-south-1b", status: "ONLINE", type: "Secondary DC", load: "9%" },
        { name: "af-south-1c", status: "ONLINE", type: "Disaster Vault", load: "2%" },
      ]
    },
    { 
      code: "europe-west2", 
      name: "London / Frankfurt (EU GDPR Compliant)", 
      latency: "22ms", 
      rtt: "21.8ms RTT (IXP Transit)", 
      status: "Low-Latency Secondary",
      proximityGroup: "🇪🇺 Continental Proximity (15ms - 50ms RTT)",
      zones: [
        { name: "eu-west-2a", status: "ONLINE", type: "Primary DC", load: "32%" },
        { name: "eu-west-2b", status: "ONLINE", type: "Secondary DC", load: "28%" },
        { name: "eu-west-2c", status: "ONLINE", type: "Hot Standby", load: "11%" },
      ]
    },
    { 
      code: "me-central-1", 
      name: "Dubai / Riyadh (Middle East Hub)", 
      latency: "44ms", 
      rtt: "43.6ms RTT (Red Sea Optical)", 
      status: "Regional Subsea Edge",
      proximityGroup: "🇪🇺 Continental Proximity (15ms - 50ms RTT)",
      zones: [
        { name: "me-central-1a", status: "ONLINE", type: "Primary DC", load: "18%" },
        { name: "me-central-1b", status: "ONLINE", type: "Secondary DC", load: "11%" },
      ]
    },
    { 
      code: "us-east-1", 
      name: "N. Virginia (US Federal / SOC2)", 
      latency: "88ms", 
      rtt: "87.5ms RTT (Transatlantic Cable)", 
      status: "Transatlantic Mesh",
      proximityGroup: "🌐 Global Intercontinental (>50ms RTT)",
      zones: [
        { name: "us-east-1a", status: "ONLINE", type: "Primary DC", load: "45%" },
        { name: "us-east-1b", status: "ONLINE", type: "Secondary DC", load: "41%" },
        { name: "us-east-1c", status: "ONLINE", type: "Cold Vault", load: "0%" },
      ]
    },
    { 
      code: "ap-southeast-1", 
      name: "Singapore (Asia Pacific Edge)", 
      latency: "115ms", 
      rtt: "114.9ms RTT (Subsea Optical Link)", 
      status: "APAC Local Edge",
      proximityGroup: "🌐 Global Intercontinental (>50ms RTT)",
      zones: [
        { name: "ap-southeast-1a", status: "ONLINE", type: "Primary DC", load: "19%" },
        { name: "ap-southeast-1b", status: "ONLINE", type: "Edge Cache", load: "12%" },
      ]
    },
  ];
  const [showRegionTooltip, setShowRegionTooltip] = useState(false);
  const [provisioningSuccess, setProvisioningSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authKey, setAuthKey] = useState("");
  const [authError, setAuthError] = useState("");

  function handleAddTag(tagToAdd?: string) {
    const val = (tagToAdd || tagInput).trim();
    if (val && !provisionForm.tags.includes(val)) {
      setProvisionForm(prev => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setProvisionForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  }

  function openAuthConfirmation(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthKey("");
    setShowAuthModal(true);
  }

  function executeDeployment() {
    if (!authKey.trim()) {
      setAuthError("🔒 Authentication required. Please enter an admin password or API key.");
      return;
    }

    setProvisioningSuccess(true);
    setShowAuthModal(false);
    
    setTimeout(() => {
      setProvisioningSuccess(false);
      setWizardStep(1);
      const newTenant = {
        id: `TNT-00${tenants.length + 1}`,
        name: provisionForm.orgName || "New Enterprise Tenant",
        region: provisionForm.primaryRegion,
        status: "HEALTHY",
        plan: "ENTERPRISE CLOUD",
        activeDevices: "0 (Provisioning)",
        nodes: 4,
      };
      setTenants(prev => [...prev, newTenant]);
      alert(`🎉 SimTrace Environment '${provisionForm.orgName || "New Enterprise Tenant"}' successfully authorized and provisioned on ${provisionForm.cloudProvider.toUpperCase()} (${provisionForm.primaryRegion})!`);
    }, 1500);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.18))", borderColor: "var(--sky)44", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--sky), var(--indigo))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "#fff", fontWeight: 800 }}>
              ☁️
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", marginBottom: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                SimTrace Cloud Platform (SCP Control Plane)
                <span style={{ fontSize: "0.72rem", background: "var(--sky)22", color: "var(--sky)", border: "1px solid var(--sky)44", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Phase 16 Cloud Core
                </span>
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Centralized multi-tenant cloud control plane for provisioning, white-label branding, AI model governance, and multi-region deployment.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/stos" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)", textDecoration: "none" }}>
              🖥️ STOS Microkernel
            </Link>
            <button onClick={() => setActiveTab("provisioning")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }}>
              ⚡ Provision New Environment
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
        {[
          { id: "control_plane", label: "🌐 Multi-Tenant Control Plane" },
          { id: "tenant_quotas", label: "📊 Tenant Usage & Quotas" },
          { id: "audit_log_replay", label: "📜 Audit Log Replay" },
          { id: "provisioning", label: "⚡ Self-Service Provisioning" },
          { id: "environments", label: "🏢 Environment Lifecycle" },
          { id: "multiregion", label: "📍 Multi-Region & Sovereignty" },
          { id: "whitelabel", label: "🎨 White-Label Studio" },
          { id: "ai_management", label: "🤖 AI Model Governance" },
          { id: "billing", label: "💳 Enterprise Billing & Usage" },
          { id: "operations_center", label: "📊 Cloud Operations Center" },
          { id: "customer_success", label: "🏆 Customer Success Portal" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "var(--r)",
              border: `1px solid ${activeTab === tab.id ? "var(--sky)" : "var(--border)"}`,
              background: activeTab === tab.id ? "var(--surface)" : "transparent",
              color: activeTab === tab.id ? "var(--sky)" : "var(--text2)",
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

      {/* ── TAB 1: MULTI-TENANT CLOUD CONTROL PLANE ────────────────────────────── */}
      {activeTab === "control_plane" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🌐 Active Organization Environments & Cloud Fleet</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Monitors multi-tenant cloud deployments, dedicated regional nodes, and subscriber scale.</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setActiveTab("tenant_quotas")} className="btn-ghost" style={{ padding: "6px 14px", fontSize: "0.8rem", border: "1px solid var(--border)" }}>
                  📊 View & Edit Tenant Quotas
                </button>
                <button onClick={() => setActiveTab("provisioning")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                  + Provision New Organization
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tenants.map(t => (
                <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--sky)" }}>{t.id}</span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>{t.name}</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 6px", borderRadius: 4 }}>
                        {t.plan}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                      Region: {t.region} · Active Devices: <strong>{t.activeDevices}</strong> · Dedicated Kubernetes Nodes: {t.nodes}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                      {t.status}
                    </span>
                    <button onClick={() => {
                      setActiveTab("tenant_quotas");
                      const matched = tenantQuotas.find(q => q.id === t.id);
                      if (matched) setEditingQuota(matched);
                    }} className="btn-ghost" style={{ padding: "4px 10px", fontSize: "0.75rem", border: "1px solid var(--border)" }}>
                      ⚙️ Manage Quotas & Limits
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW TAB: TENANT USAGE & QUOTAS MANAGEMENT ─────────────────────────── */}
      {activeTab === "tenant_quotas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {quotaToast && (
            <div style={{ background: "var(--emerald)22", border: "1px solid var(--emerald)", color: "var(--emerald)", padding: "0.75rem 1rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{quotaToast}</span>
              <button onClick={() => setQuotaToast(null)} style={{ background: "transparent", border: "none", color: "var(--emerald)", cursor: "pointer", fontWeight: 800 }}>✕</button>
            </div>
          )}

          {/* Quota High-Level Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--sky)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Global Real-Time API Load</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>
                17,980 / 29,000 req/sec
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--sky)", marginTop: 4 }}>62.0% Fleet Utilization</div>
            </div>

            <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--indigo)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Storage Allocated</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>
                113.15 TB / 162.5 TB
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--indigo)", marginTop: 4 }}>69.6% Capacity Used</div>
            </div>

            <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--emerald)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Monthly AI Token Pool</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>
                593.8M / 815.0M Tokens
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>Gemini 1.5 Flash Proxied</div>
            </div>

            <div className="card" style={{ padding: "0.85rem 1rem", borderLeft: "4px solid var(--amber)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Quota Enforcement</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 2 }}>0 Hard Drops</div>
              <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>All Enclaves Compliant</div>
            </div>
          </div>

          {/* Tenant Environments Quotas Table */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>📊 Real-Time Tenant Quotas & Rate Limit Controls</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Adjust API throughput limits, storage caps, AI token quotas, and policy enforcement per organization environment.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const sample = tenantQuotas[0];
                    if (sample) {
                      setTenantQuotas(prev => prev.map(q => ({
                        ...q,
                        apiRateLimitRps: Math.round(q.apiRateLimitRps * 1.25),
                        storageCapGB: Math.round(q.storageCapGB * 1.25),
                        aiTokenQuotaMonthly: Math.round(q.aiTokenQuotaMonthly * 1.25),
                        lastUpdated: "Just now",
                      })));
                      setQuotaToast("🚀 All Organization Environment Quotas boosted +25% across Cloud Mesh!");
                    }
                  }}
                  className="btn-ghost"
                  style={{ padding: "6px 12px", fontSize: "0.78rem", border: "1px solid var(--sky)", color: "var(--sky)" }}
                >
                  ⚡ Boost All Tenants +25%
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {tenantQuotas.map(t => {
                const apiPercent = Math.round((t.apiCurrentRps / t.apiRateLimitRps) * 100);
                const storagePercent = Math.round((t.storageCurrentGB / t.storageCapGB) * 100);
                const aiPercent = Math.round((t.aiTokenCurrentMonthly / t.aiTokenQuotaMonthly) * 100);

                return (
                  <div key={t.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ fontWeight: 800, fontFamily: "var(--mono)", color: "var(--sky)", fontSize: "0.88rem" }}>{t.id}</span>
                          <strong style={{ fontSize: "1.05rem", color: "var(--text)" }}>{t.name}</strong>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)18", padding: "2px 8px", borderRadius: 4 }}>
                            {t.plan}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
                          Last Policy Refresh: <strong>{t.lastUpdated}</strong> · Alert Threshold: <strong>{t.alertThresholdPercent}%</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "3px 10px",
                          borderRadius: 12,
                          background: t.enforcementMode === "AUTO_SCALE" ? "var(--emerald)22" : t.enforcementMode === "SOFT_THROTTLE" ? "var(--amber)22" : "var(--rose)22",
                          color: t.enforcementMode === "AUTO_SCALE" ? "var(--emerald)" : t.enforcementMode === "SOFT_THROTTLE" ? "var(--amber)" : "var(--rose)",
                          border: `1px solid ${t.enforcementMode === "AUTO_SCALE" ? "var(--emerald)44" : t.enforcementMode === "SOFT_THROTTLE" ? "var(--amber)44" : "var(--rose)44"}`,
                        }}>
                          POLICIES: {t.enforcementMode}
                        </span>

                        <button
                          type="button"
                          onClick={() => setEditingQuota(t)}
                          className="btn-primary"
                          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        >
                          ⚙️ Set Quotas & Limits
                        </button>
                      </div>
                    </div>

                    {/* Progress meters grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", background: "var(--bg)", padding: "0.85rem 1rem", borderRadius: 8, border: "1px solid var(--border)" }}>
                      {/* Meter 1: API Rate Limit */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "var(--muted)" }}>⚡ Real-Time API Rate Limit</span>
                          <span style={{ fontWeight: 800, color: apiPercent >= 85 ? "var(--amber)" : "var(--emerald)" }}>
                            {t.apiCurrentRps.toLocaleString()} / {t.apiRateLimitRps.toLocaleString()} RPS ({apiPercent}%)
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(apiPercent, 100)}%`, height: "100%", background: apiPercent >= 85 ? "var(--amber)" : "var(--sky)", transition: "width 0.3s" }} />
                        </div>
                      </div>

                      {/* Meter 2: Storage Cap */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "var(--muted)" }}>💾 Storage Cap (GB)</span>
                          <span style={{ fontWeight: 800, color: storagePercent >= 85 ? "var(--amber)" : "var(--emerald)" }}>
                            {(t.storageCurrentGB / 1000).toFixed(1)} TB / {(t.storageCapGB / 1000).toFixed(1)} TB ({storagePercent}%)
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(storagePercent, 100)}%`, height: "100%", background: storagePercent >= 85 ? "var(--amber)" : "var(--indigo)", transition: "width 0.3s" }} />
                        </div>
                      </div>

                      {/* Meter 3: AI Token Quota */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "var(--muted)" }}>🤖 Monthly AI Token Quota</span>
                          <span style={{ fontWeight: 800, color: aiPercent >= 85 ? "var(--amber)" : "var(--emerald)" }}>
                            {t.aiTokenCurrentMonthly}M / {t.aiTokenQuotaMonthly}M Tokens ({aiPercent}%)
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(aiPercent, 100)}%`, height: "100%", background: aiPercent >= 85 ? "var(--amber)" : "var(--emerald)", transition: "width 0.3s" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT TENANT QUOTA MODAL ─────────────────────────────────────────── */}
      {editingQuota && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--sky)44", borderRadius: 12, maxWidth: 540, width: "100%", padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--sky)", fontWeight: 800, fontFamily: "var(--mono)" }}>{editingQuota.id}</span>
                <h3 style={{ fontSize: "1.1rem", margin: "2px 0 0 0", color: "var(--text)" }}>
                  Set Environment Quotas: {editingQuota.name}
                </h3>
              </div>
              <button onClick={() => setEditingQuota(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                setTenantQuotas(prev => prev.map(q => q.id === editingQuota.id ? { ...editingQuota, lastUpdated: "Just now" } : q));
                setQuotaToast(`✅ Quotas & Limits for '${editingQuota.name}' updated live across Cloud Mesh!`);
                setEditingQuota(null);
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
            >
              {/* Presets Bar */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.65rem 0.85rem", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>QUOTA PRESETS:</span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => setEditingQuota({ ...editingQuota, apiRateLimitRps: 20000, storageCapGB: 150000, aiTokenQuotaMonthly: 500, enforcementMode: "AUTO_SCALE" })}
                    style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4, background: "var(--sky)22", border: "1px solid var(--sky)44", color: "var(--sky)", fontWeight: 700, cursor: "pointer" }}
                  >
                    🚀 Sovereign Scale
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuota({ ...editingQuota, apiRateLimitRps: 5000, storageCapGB: 20000, aiTokenQuotaMonthly: 100, enforcementMode: "SOFT_THROTTLE" })}
                    style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4, background: "var(--amber)22", border: "1px solid var(--amber)44", color: "var(--amber)", fontWeight: 700, cursor: "pointer" }}
                  >
                    🛡️ Moderate Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuota({ ...editingQuota, apiRateLimitRps: 1000, storageCapGB: 5000, aiTokenQuotaMonthly: 25, enforcementMode: "HARD_CAP" })}
                    style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: 4, background: "var(--rose)22", border: "1px solid var(--rose)44", color: "var(--rose)", fontWeight: 700, cursor: "pointer" }}
                  >
                    🔒 Conservative Cap
                  </button>
                </div>
              </div>

              {/* API Rate Limit Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                  <label style={{ fontWeight: 700, color: "var(--text)" }}>⚡ Real-Time API Rate Limit (req/sec)</label>
                  <span style={{ fontWeight: 800, color: "var(--sky)" }}>{editingQuota.apiRateLimitRps.toLocaleString()} RPS</span>
                </div>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  step={100}
                  value={editingQuota.apiRateLimitRps}
                  onChange={e => setEditingQuota({ ...editingQuota, apiRateLimitRps: parseInt(e.target.value) || 100 })}
                  style={{ width: "100%", padding: "0.55rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.85rem" }}
                />
              </div>

              {/* Storage Cap Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                  <label style={{ fontWeight: 700, color: "var(--text)" }}>💾 Storage Capacity Cap (GB)</label>
                  <span style={{ fontWeight: 800, color: "var(--indigo)" }}>{(editingQuota.storageCapGB / 1000).toFixed(1)} TB ({editingQuota.storageCapGB.toLocaleString()} GB)</span>
                </div>
                <input
                  type="number"
                  min={500}
                  max={500000}
                  step={500}
                  value={editingQuota.storageCapGB}
                  onChange={e => setEditingQuota({ ...editingQuota, storageCapGB: parseInt(e.target.value) || 500 })}
                  style={{ width: "100%", padding: "0.55rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.85rem" }}
                />
              </div>

              {/* AI Token Quota Field */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                  <label style={{ fontWeight: 700, color: "var(--text)" }}>🤖 Monthly AI Token Quota (Millions)</label>
                  <span style={{ fontWeight: 800, color: "var(--emerald)" }}>{editingQuota.aiTokenQuotaMonthly} Million Tokens / mo</span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={2000}
                  step={5}
                  value={editingQuota.aiTokenQuotaMonthly}
                  onChange={e => setEditingQuota({ ...editingQuota, aiTokenQuotaMonthly: parseInt(e.target.value) || 5 })}
                  style={{ width: "100%", padding: "0.55rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.85rem" }}
                />
              </div>

              {/* Enforcement Policy Mode & Alert Threshold */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Quota Enforcement Policy</label>
                  <select
                    value={editingQuota.enforcementMode}
                    onChange={e => setEditingQuota({ ...editingQuota, enforcementMode: e.target.value as any })}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value="AUTO_SCALE">AUTO_SCALE (Pay-per-overage)</option>
                    <option value="SOFT_THROTTLE">SOFT_THROTTLE (Queue & Alert)</option>
                    <option value="HARD_CAP">HARD_CAP (Drop excess requests)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Alert Threshold %</label>
                  <select
                    value={editingQuota.alertThresholdPercent}
                    onChange={e => setEditingQuota({ ...editingQuota, alertThresholdPercent: parseInt(e.target.value) || 85 })}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.82rem" }}
                  >
                    <option value={70}>70% Capacity Alert</option>
                    <option value={80}>80% Capacity Alert</option>
                    <option value={85}>85% Standard Alert</option>
                    <option value={90}>90% Critical Alert</option>
                    <option value={95}>95% High Emergency</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingQuota(null)} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.82rem", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "8px 18px", fontSize: "0.82rem" }}>
                  💾 Save Quotas & Apply Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 2: SELF-SERVICE PROVISIONING WIZARD ───────────────────────────── */}
      {activeTab === "provisioning" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card" style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>⚡ Guided 4-Step Cloud Provisioning Wizard</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>
                  Automated Infrastructure-as-Code (Terraform & Helm) deployment of dedicated SimTrace cloud tenants.
                </p>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--sky)", fontWeight: 700, background: "var(--sky)15", padding: "4px 10px", borderRadius: 12 }}>
                Step {wizardStep} of 4
              </div>
            </div>

            {/* Step Progress Indicators */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {[
                { step: 1, label: "1. Org & Domain" },
                { step: 2, label: "2. Cloud & Region" },
                { step: 3, label: "3. Platform Modules" },
                { step: 4, label: "4. Deploy & Launch" },
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setWizardStep(s.step)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: 6,
                    border: `1px solid ${wizardStep === s.step ? "var(--sky)" : "var(--border)"}`,
                    background: wizardStep === s.step ? "var(--sky)22" : "var(--bg)",
                    color: wizardStep === s.step ? "var(--sky)" : "var(--muted)",
                    fontSize: "0.78rem",
                    fontWeight: wizardStep === s.step ? 800 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={openAuthConfirmation} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* STEP 1: ORGANIZATION & DOMAIN */}
              {wizardStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Organization & Tenant Name</label>
                    <input
                      type="text"
                      required
                      value={provisionForm.orgName}
                      onChange={e => setProvisionForm({ ...provisionForm, orgName: e.target.value })}
                      placeholder="e.g. Kenya Customs & Border Protection"
                      style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6 }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Dedicated CNAME Subdomain</label>
                      <input
                        type="text"
                        value={provisionForm.domain}
                        onChange={e => setProvisionForm({ ...provisionForm, domain: e.target.value })}
                        placeholder="e.g. customs-ceir.gov.ke"
                        style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Tenant Security Classification</label>
                      <select style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}>
                        <option>RESTRICTED NATIONAL SECURITY (DCI / POLICE)</option>
                        <option>CONFIDENTIAL TELECOM (CARRIER CORE)</option>
                        <option>COMMERCIAL INSURTECH (RETAIL PARTNER)</option>
                      </select>
                    </div>
                  </div>

                  {/* Environment & Cost Center Tagging */}
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8 }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", display: "block", marginBottom: 4 }}>
                      🏷️ Environment Tags & Cost Center Labels
                    </label>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                      Tag environments with project codes or cost centers for automated cloud bill allocation.
                    </p>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="e.g. cost-center:CC-8820 or dept:finance"
                        style={{ flex: 1, padding: "0.45rem 0.6rem", fontSize: "0.8rem", borderRadius: 6 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag()}
                        className="btn-ghost"
                        style={{ padding: "0.45rem 0.85rem", fontSize: "0.78rem", border: "1px solid var(--border)", whiteSpace: "nowrap" }}
                      >
                        + Add Tag
                      </button>
                    </div>

                    {/* Active Tags Pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                      {provisionForm.tags.map(t => (
                        <span key={t} style={{ fontSize: "0.72rem", background: "var(--sky)18", color: "var(--sky)", border: "1px solid var(--sky)33", padding: "3px 8px", borderRadius: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            style={{ background: "transparent", border: "none", color: "var(--sky)", cursor: "pointer", padding: 0, fontSize: "0.75rem", lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {provisionForm.tags.length === 0 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", italic: "true" }}>No tags assigned yet.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setWizardStep(2)} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                      Next: Select Cloud & Region →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CLOUD TARGET & SOVEREIGN REGIONS (PRIMARY & DR) */}
              {wizardStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>Infrastructure Cloud Target</label>
                    <select
                      value={provisionForm.cloudProvider}
                      onChange={e => setProvisionForm({ ...provisionForm, cloudProvider: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
                    >
                      <option value="aws">Amazon Web Services (AWS EKS Cluster)</option>
                      <option value="gcp">Google Cloud Platform (GKE Sovereign Enclave)</option>
                      <option value="azure">Microsoft Azure (AKS Multi-Region)</option>
                      <option value="onprem">Self-Hosted Sovereign On-Prem K8s Cluster</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {/* Primary Region Selection */}
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--sky)", display: "block" }}>
                          📍 Data Sovereignty Primary Region
                        </label>
                        
                        {/* Hover Tooltip Badge */}
                        <div 
                          style={{ position: "relative", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                          onMouseEnter={() => setShowRegionTooltip(true)}
                          onMouseLeave={() => setShowRegionTooltip(false)}
                        >
                          <span style={{ fontSize: "0.7rem", color: "var(--sky)", background: "var(--sky)18", border: "1px solid var(--sky)33", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                            ⚡ RTT & AZ Info ℹ️
                          </span>

                          {showRegionTooltip && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              right: 0,
                              marginTop: 6,
                              width: 300,
                              background: "var(--surface)",
                              border: "1px solid var(--sky)",
                              borderRadius: 8,
                              padding: "0.85rem",
                              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                              zIndex: 1000,
                            }}>
                              {(() => {
                                const currentRegion = availableRegions.find(r => r.code === provisionForm.primaryRegion) || availableRegions[0];
                                return (
                                  <div>
                                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--sky)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                                      <span>📡 TELEMETRY BREAKDOWN</span>
                                      <span style={{ color: "var(--emerald)" }}>99.999% SLA</span>
                                    </div>
                                    <div style={{ fontSize: "0.74rem", color: "var(--text)", marginBottom: 6 }}>
                                      Target: <strong>{currentRegion.name}</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg)", padding: "4px 8px", borderRadius: 4, fontSize: "0.72rem", marginBottom: 8, border: "1px solid var(--border)" }}>
                                      <span style={{ color: "var(--muted)" }}>Round-Trip Time:</span>
                                      <strong style={{ color: "var(--emerald)" }}>{currentRegion.rtt}</strong>
                                    </div>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase" }}>
                                      Cloud Availability Zones (AZs):
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                      {currentRegion.zones.map(z => (
                                        <div key={z.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", background: "var(--bg)", padding: "4px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
                                          <span style={{ fontFamily: "var(--mono)", color: "var(--sky)", fontWeight: 700 }}>{z.name}</span>
                                          <span style={{ color: "var(--muted)", fontSize: "0.68rem" }}>{z.type}</span>
                                          <span style={{ color: "var(--emerald)", fontWeight: 700 }}>● {z.status} ({z.load})</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      <select
                        id="primary-region-select"
                        value={provisionForm.primaryRegion}
                        onChange={e => setProvisionForm({ ...provisionForm, primaryRegion: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--sky)44" }}
                      >
                        {Array.from(new Set(availableRegions.map(r => r.proximityGroup))).map(groupLabel => (
                          <optgroup key={groupLabel} label={groupLabel}>
                            {availableRegions.filter(r => r.proximityGroup === groupLabel).map(r => (
                              <option key={r.code} value={r.code}>
                                {r.name} — {r.latency}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Disaster Recovery Region Selection */}
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--indigo)", display: "block", marginBottom: 4 }}>
                        🛡️ Disaster Recovery (DR) Secondary Region
                      </label>
                      <select
                        value={provisionForm.drRegion}
                        onChange={e => setProvisionForm({ ...provisionForm, drRegion: e.target.value })}
                        style={{ width: "100%", padding: "0.6rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--indigo)44" }}
                      >
                        {Array.from(new Set(availableRegions.map(r => r.proximityGroup))).map(groupLabel => (
                          <optgroup key={groupLabel} label={groupLabel}>
                            {availableRegions.filter(r => r.proximityGroup === groupLabel).map(r => (
                              <option key={r.code} value={r.code}>
                                {r.name} — {r.latency}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estimated Latency & Replication Metrics Card */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {/* Primary Region Metric Card */}
                    {(() => {
                      const primary = availableRegions.find(r => r.code === provisionForm.primaryRegion) || availableRegions[0];
                      return (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--sky)33", padding: "0.85rem", borderRadius: 8 }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sky)", textTransform: "uppercase" }}>
                            Primary Enclave Latency
                          </div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--emerald)", margin: "4px 0" }}>
                            ⚡ {primary.latency}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                            Region: {primary.name}
                          </div>
                        </div>
                      );
                    })()}

                    {/* DR Region Metric Card */}
                    {(() => {
                      const dr = availableRegions.find(r => r.code === provisionForm.drRegion) || availableRegions[1];
                      return (
                        <div style={{ background: "var(--bg)", border: "1px solid var(--indigo)33", padding: "0.85rem", borderRadius: 8 }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--indigo)", textTransform: "uppercase" }}>
                            DR Failover Latency & Sync
                          </div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--sky)", margin: "4px 0" }}>
                            ⏱️ {dr.latency}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                            Region: {dr.name}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* High Availability Replication Status Banner */}
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)", marginBottom: 2 }}>
                      ✓ Multi-Region Database Mirroring & Failover SLA Active
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      Active-passive replication with automated failover (&lt; 30s RTO) between Primary (<strong>{provisionForm.primaryRegion}</strong>) and DR (<strong>{provisionForm.drRegion}</strong>).
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setWizardStep(1)} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
                      ← Back
                    </button>
                    <button type="button" onClick={() => setWizardStep(3)} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                      Next: Select Modules →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PLATFORM MODULE ARCHITECTURE */}
              {wizardStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Select STOS OS Modules to Auto-Deploy into Tenant Cluster</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {[
                      { title: "Identity & Zero-Trust IAM", desc: "SAML 2.0 / OAuth 2.0 multi-factor authentication" },
                      { title: "Explainable Device Trust Engine", desc: "Real-time trust scoring and carrier binding" },
                      { title: "National Incident Platform", desc: "Theft dispatch linking police & carrier networks" },
                      { title: "Fraud Intelligence Exchange", desc: "Cross-carrier IMEI cloning & SIM swap prevention" },
                      { title: "Gemini AI Forensic OCR", desc: "Automated receipt & box serial extraction" },
                      { title: "M-Pesa Micro-Payouts Escrow", desc: "Instant automated victim compensation settlement" },
                    ].map((m, i) => (
                      <label key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.75rem", borderRadius: 8, display: "flex", gap: "0.6rem", cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked={i < 4} style={{ marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{m.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 2 }}>{m.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                    <button type="button" onClick={() => setWizardStep(2)} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
                      ← Back
                    </button>
                    <button type="button" onClick={() => setWizardStep(4)} className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                      Next: Review & Launch →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW ARCHITECTURE & DEPLOYMENT */}
              {wizardStep === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--sky)", marginBottom: "0.5rem" }}>
                      PROVISIONING SUMMARY PREVIEW
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                      <div>Organization: <strong>{provisionForm.orgName || "Kenya Customs"}</strong></div>
                      <div>Cloud Provider: <strong style={{ textTransform: "uppercase" }}>{provisionForm.cloudProvider}</strong></div>
                      <div>Primary Region: <strong style={{ color: "var(--sky)" }}>{provisionForm.primaryRegion}</strong></div>
                      <div>DR Region: <strong style={{ color: "var(--indigo)" }}>{provisionForm.drRegion}</strong></div>
                      <div>Subdomain: <code style={{ color: "var(--sky)" }}>{provisionForm.domain || "customs-ceir.gov.ke"}</code></div>
                      <div style={{ gridColumn: "span 2", marginTop: 4 }}>
                        Assigned Tags: {provisionForm.tags.map(t => (
                          <span key={t} style={{ fontSize: "0.7rem", background: "var(--sky)18", color: "var(--sky)", border: "1px solid var(--sky)33", padding: "1px 6px", borderRadius: 8, marginRight: 4, fontWeight: 700 }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={provisioningSuccess} className="btn-primary" style={{ padding: "12px", fontSize: "0.95rem" }}>
                    {provisioningSuccess ? "Deploying Infrastructure & Spinning Up Pods…" : "🚀 Launch Automated Terraform & Helm Pipeline"}
                  </button>

                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <button type="button" onClick={() => setWizardStep(3)} className="btn-ghost" style={{ padding: "6px 12px", fontSize: "0.8rem", border: "1px solid var(--border)" }}>
                      ← Edit Configuration
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── AUTHORIZATION CONFIRMATION MODAL ─────────────────────────────── */}
          {showAuthModal && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, maxWidth: 520, width: "100%", padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--sky)" }}>
                    🔐 Authorize Infrastructure Deployment
                  </h3>
                  <button onClick={() => setShowAuthModal(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}>
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  Please review the provisioning configuration summary below. Admin authorization is required to execute automated Terraform & Helm pipelines.
                </p>

                {/* Provisioning Configuration Summary Box */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div><strong>Organization Name:</strong> {provisionForm.orgName || "Kenya Customs & Border Protection"}</div>
                  <div><strong>Infrastructure Cloud Target:</strong> <span style={{ textTransform: "uppercase", color: "var(--sky)", fontWeight: 700 }}>{provisionForm.cloudProvider}</span></div>
                  <div><strong>Primary Region:</strong> <span style={{ color: "var(--sky)", fontWeight: 700 }}>{provisionForm.primaryRegion}</span></div>
                  <div><strong>Disaster Recovery (DR) Region:</strong> <span style={{ color: "var(--indigo)", fontWeight: 700 }}>{provisionForm.drRegion}</span></div>
                  <div><strong>Target CNAME:</strong> <code style={{ color: "var(--sky)" }}>{provisionForm.domain || "customs-ceir.gov.ke"}</code></div>
                  <div><strong>Modules Selected:</strong> Identity IAM, Trust Engine, Incident Platform, Fraud Exchange</div>
                  {provisionForm.tags.length > 0 && (
                    <div>
                      <strong>Assigned Labels:</strong>{" "}
                      {provisionForm.tags.map(t => (
                        <span key={t} style={{ fontSize: "0.7rem", background: "var(--sky)18", color: "var(--sky)", border: "1px solid var(--sky)33", padding: "1px 6px", borderRadius: 6, marginRight: 4, fontWeight: 700 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Authentication Input */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>
                    Admin Password or API Key Authorization Token
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={authKey}
                    onChange={e => {
                      setAuthKey(e.target.value);
                      if (authError) setAuthError("");
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        executeDeployment();
                      }
                    }}
                    placeholder="Enter root admin password or SCP key (e.g. SCP-ADMIN-2026)"
                    style={{ width: "100%", padding: "0.6rem 0.75rem", fontSize: "0.85rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)" }}
                  />
                  {authError && (
                    <div style={{ fontSize: "0.78rem", color: "var(--rose)", marginTop: 6, fontWeight: 700 }}>
                      {authError}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(false)}
                    className="btn-ghost"
                    style={{ padding: "8px 16px", fontSize: "0.85rem", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeDeployment}
                    className="btn-primary"
                    style={{ padding: "8px 20px", fontSize: "0.85rem" }}
                  >
                    ⚡ Authorize & Trigger API Deployment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ENVIRONMENT LIFECYCLE MANAGEMENT ─────────────────────────── */}
      {activeTab === "environments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏢 Environment Lifecycle Management (Dev / Staging / Production)</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Isolated staging sandboxes, automated schema migration rollouts, and single-click production promote.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {[
                { name: "Development Sandbox", url: "https://dev.ceir.safaricom.co.ke", status: "HEALTHY", sync: "Auto-Build on PR", db: "Dev Firestore + Postgres" },
                { name: "Staging / QA Enclave", url: "https://staging.ceir.safaricom.co.ke", status: "HEALTHY", sync: "Nightly Integration Sync", db: "Anonymized Prod Mirror" },
                { name: "Production Sovereign Core", url: "https://ceir.safaricom.co.ke", status: "HEALTHY", sync: "Zero-Downtime Blue/Green", db: "Multi-Region Spanner Mesh" },
              ].map((env, idx) => (
                <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--sky)", textTransform: "uppercase" }}>{env.name}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, margin: "6px 0 2px 0", fontFamily: "var(--mono)" }}>{env.url}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>Pipeline: {env.sync}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--emerald)", fontWeight: 700, marginTop: 4 }}>Database: {env.db}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: MULTI-REGION & DATA SOVEREIGNTY ──────────────────────────── */}
      {activeTab === "multiregion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📍 Multi-Region Mesh & Data Residency Controls</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Configurable primary/secondary replication, automatic cross-datacenter failover, and data sovereignty compliance.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {regions.map(r => (
                <div key={r.code} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{r.location} (<code style={{ color: "var(--sky)" }}>{r.code}</code>)</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                      Compliance: <strong style={{ color: "var(--emerald)" }}>{r.compliance}</strong> · Network Latency: {r.latency}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--indigo)", background: "var(--indigo)22", padding: "2px 8px", borderRadius: 4 }}>
                    {r.primaryFor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: WHITE-LABEL STUDIO ────────────────────────────────────────── */}
      {activeTab === "whitelabel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>🎨 Visual White-Label Branding Studio</h3>
                <p className="text-muted" style={{ fontSize: "0.82rem", margin: 0 }}>Customize portal branding, domain mapping, logos, and primary accents without code.</p>
              </div>
              <button onClick={() => alert("White-Label Theme & Domain Configuration Published!")} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                💾 Publish White-Label Theme
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 2 }}>Portal Display Title</label>
                  <input
                    type="text"
                    value={whiteLabelConfig.appName}
                    onChange={e => setWhiteLabelConfig({ ...whiteLabelConfig, appName: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block", marginBottom: 2 }}>Custom CNAME Domain</label>
                  <input
                    type="text"
                    value={whiteLabelConfig.customDomain}
                    onChange={e => setWhiteLabelConfig({ ...whiteLabelConfig, customDomain: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", borderRadius: 6, fontFamily: "var(--mono)" }}
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div style={{ background: "var(--bg)", border: `2px solid ${whiteLabelConfig.primaryColor}`, padding: "1.25rem", borderRadius: 12 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>LIVE PORTAL BRANDING PREVIEW:</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: whiteLabelConfig.primaryColor }}>
                  {whiteLabelConfig.logoText}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: 4 }}>{whiteLabelConfig.appName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>Domain: https://{whiteLabelConfig.customDomain}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: AI MODEL GOVERNANCE ───────────────────────────────────────── */}
      {activeTab === "ai_management" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🤖 Enterprise AI Model Governance & RAG Costs</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Centralized token quota enforcement, model selection, prompt versioning, and latency benchmarks.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {aiModels.map((m, i) => (
                <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{m.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                      Provider: {m.provider} · Monthly Token Volume: <strong>{m.monthlyTokens}</strong> · Latency: {m.latency}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--emerald)", background: "var(--emerald)22", padding: "2px 8px", borderRadius: 4 }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: ENTERPRISE BILLING & USAGE ────────────────────────────────── */}
      {activeTab === "billing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>💳 Enterprise Subscription & API Metering Billing</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Metered billing for active device IMEIs, GSMA lookup calls, AI token consumption, and M-Pesa micro-payouts.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>MONTHLY RECURRING REVENUE (MRR)</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--emerald)" }}>$184,500.00</div>
                <div style={{ fontSize: "0.72rem", color: "var(--emerald)", marginTop: 4 }}>+18.4% MoM Growth</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>METERED GSMA LOOKUP API CALLS</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--sky)" }}>42.8 Million</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>$0.001 per verification</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: CLOUD OPERATIONS CENTER ──────────────────────────────────── */}
      {activeTab === "operations_center" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📊 Cloud Infrastructure Operations Center</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Real-time Kubernetes cluster health, database replication lag, and hourly disaster recovery snapshots.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>CLUSTER UPTIME SLA</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald)" }}>{opsHealth.clusterUptime}</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>RUNNING K8S PODS</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sky)" }}>{opsHealth.activeKubernetesPods} Pods</div>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>BACKUP SNAPSHOT STATUS</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--emerald)", marginTop: 4 }}>{opsHealth.backupSnapshotStatus}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: CUSTOMER SUCCESS PORTAL ──────────────────────────────────── */}
      {activeTab === "customer_success" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🏆 Customer Success & Adoption Health Portal</h3>
            <p className="text-muted" style={{ fontSize: "0.82rem", marginBottom: "1rem" }}>
              Onboarding milestone tracking, product health scores, and dedicated partner support tickets.
            </p>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "1rem", borderRadius: 8 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--emerald)", marginBottom: "0.5rem" }}>
                Partner Product Health Score: 98.4 / 100 (EXCELLENT)
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text2)", margin: 0 }}>
                100% of onboarded telecom operators have configured automated SS7 CEIR sync within 7 days of provisioning.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
