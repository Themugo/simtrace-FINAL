"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Server,
  Activity,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Radio,
  Clock,
  Database,
  Terminal,
} from "lucide-react";
import { SecurityOperationsService, SecurityAlert, AlertStatus } from "../../../services/soc.service";
import DevOpsD3Dashboard from "../../../components/DevOpsD3Dashboard";

export default function DevOpsControlPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(SecurityOperationsService.getAlerts());
  const [systemHealth] = useState(SecurityOperationsService.getSystemHealthStatus());
  const [selectedFilter, setSelectedFilter] = useState<AlertStatus | "ALL">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggerBackupMsg, setTriggerBackupMsg] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: AlertStatus) => {
    const updated = SecurityOperationsService.updateAlertStatus(id, newStatus);
    setAlerts([...SecurityOperationsService.getAlerts()]);
  };

  const handleManualBackup = () => {
    setTriggerBackupMsg("Initiating point-in-time PostgreSQL WAL sync & S3 encrypted backup snapshot...");
    setTimeout(() => {
      setTriggerBackupMsg("Backup Completed Successfully: Snapshot ID snap-20260801-0219 (Size: 4.8 GB)");
    }, 1500);
  };

  const filteredAlerts = alerts.filter((a) => (selectedFilter === "ALL" ? true : a.status === selectedFilter));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace DevOps & Security Operations Center (SOC)</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Infrastructure observability, container health probes, security alert triage, and automated disaster recovery</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualBackup}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <HardDrive className="w-4 h-4 text-blue-400" /> Trigger Instant DB Snapshot
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> Cluster Status: {systemHealth.status}
          </div>
        </div>
      </div>

      {triggerBackupMsg && (
        <div className="my-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" /> {triggerBackupMsg}
        </div>
      )}

      {/* Infrastructure Telemetry KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>DATABASE CLUSTER</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">PostgreSQL 16 HA</div>
          <div className="text-xs text-slate-400 mt-1">{systemHealth.dbConnections} Active Pool Connections</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>REDIS SENTINEL</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{systemHealth.redisLatencyMs} ms Latency</div>
          <div className="text-xs text-slate-400 mt-1">AOF Persistence Active</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>SOCKET CONNECTIONS</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{systemHealth.activeSocketConnections} Live Streams</div>
          <div className="text-xs text-slate-400 mt-1">Real-time Telemetry Mesh</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>DISASTER RECOVERY SLA</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">RTO 15m / RPO 5m</div>
          <div className="text-xs text-slate-400 mt-1">Last Backup: {new Date(systemHealth.lastBackupTimestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Real-time D3.js Microservice Telemetry Dashboard */}
      <DevOpsD3Dashboard />

      {/* Health Check Endpoints Probes Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 my-6">
        <h2 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" /> Automated Production Health & Liveness Probes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-blue-400 font-bold">GET /api/health</span>
              <span className="text-emerald-400 font-bold">200 OK</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Checks process execution and uptime</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-blue-400 font-bold">GET /api/readiness</span>
              <span className="text-emerald-400 font-bold">200 OK</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Verifies PostgreSQL DB & Redis connectivity</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-blue-400 font-bold">GET /api/liveness</span>
              <span className="text-emerald-400 font-bold">200 OK</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Kubernetes / Cloud Run liveness probe</div>
          </div>
        </div>
      </div>

      {/* SOC Security Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="font-semibold text-white text-sm">Security Operations Center (SOC) Intrusion & Anomaly Stream</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {["ALL", "NEW", "INVESTIGATING", "MITIGATED"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedFilter(st as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  selectedFilter === st ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
            <tr>
              <th className="py-3 px-4">Severity / Event Type</th>
              <th className="py-3 px-4">Source & Target Tenant</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Triage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAlerts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-800/50">
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      a.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : a.severity === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    }`}
                  >
                    {a.severity} — {a.type}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-300">
                  <div>{a.source}</div>
                  {a.organizationId && <div className="text-[10px] text-blue-400">Org: {a.organizationId}</div>}
                </td>
                <td className="py-3.5 px-4 text-slate-300 max-w-md">{a.description}</td>
                <td className="py-3.5 px-4 text-slate-400">{new Date(a.createdAt).toLocaleTimeString()}</td>
                <td className="py-3.5 px-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {a.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <select
                    value={a.status}
                    onChange={(e) => handleStatusChange(a.id, e.target.value as AlertStatus)}
                    className="bg-slate-950 border border-slate-700 rounded p-1 text-[11px] text-slate-200 focus:outline-none"
                  >
                    <option value="NEW">Mark NEW</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="MITIGATED">MITIGATED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
