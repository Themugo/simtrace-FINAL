"use client";

import React, { useState } from "react";
import {
  Code2,
  Key,
  Webhook,
  Boxes,
  Activity,
  Download,
  Terminal,
  Plus,
  Copy,
  CheckCircle,
  FileCode,
  Globe,
  UploadCloud,
  Layers,
  Shield,
  Zap,
} from "lucide-react";
import { ApiGatewayService, ApiKeyRecord } from "../../services/apiGateway.service";
import { WebhookService, WebhookSubscription, WebhookDeliveryRecord } from "../../services/webhook.service";
import { IntegrationService, ExternalIntegration, AppDirectoryListing, BulkDataImportJob } from "../../services/integrations.service";

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "docs" | "analytics" | "webhooks" | "marketplace" | "sdks" | "imports">("keys");

  const [orgId] = useState("org-police-01");
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(ApiGatewayService.getApiKeys(orgId));
  const [analytics, setAnalytics] = useState(ApiGatewayService.getUsageAnalytics(orgId));
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(WebhookService.getWebhooks(orgId));
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRecord[]>(WebhookService.getDeliveries(orgId));
  const [integrations] = useState<ExternalIntegration[]>(IntegrationService.getIntegrations(orgId));
  const [marketplaceApps] = useState<AppDirectoryListing[]>(IntegrationService.getMarketplaceApps());
  const [importJobs, setImportJobs] = useState<BulkDataImportJob[]>(IntegrationService.getImportJobs(orgId));

  // Modal / Form states
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["devices.search", "cases.read"]);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);

  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [importFileName, setImportFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const availableScopes = [
    "cases.read",
    "cases.write",
    "devices.search",
    "devices.track",
    "reports.generate",
    "intelligence.graph.read",
    "webhooks.manage",
  ];

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    const { apiKey, secretKey } = ApiGatewayService.createApiKey(orgId, keyName, selectedScopes);
    setApiKeys(ApiGatewayService.getApiKeys(orgId));
    setNewSecretKey(secretKey);
  };

  const handleRevokeKey = (id: string) => {
    ApiGatewayService.revokeApiKey(id);
    setApiKeys(ApiGatewayService.getApiKeys(orgId));
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    WebhookService.createWebhook(orgId, webhookUrl, ["DEVICE_ALERT", "RISK_ALERT", "CASE_CREATED"]);
    setWebhooks(WebhookService.getWebhooks(orgId));
    setShowWebhookModal(false);
    setWebhookUrl("");
  };

  const handleSimulateImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFileName) return;
    setIsImporting(true);
    setTimeout(() => {
      const job = IntegrationService.runBulkImport(orgId, "DEVICE_TELEMETRY", importFileName, 50000);
      setImportJobs(IntegrationService.getImportJobs(orgId));
      setIsImporting(false);
      setImportFileName("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Developer & API Platform</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">REST API Gateway, Webhook Subscriptions, SDK Libraries, SIEM Integrations & Developer Hub</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-mono font-semibold">
            API Version: /api/v1 (REST & WebSockets)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 my-6 overflow-x-auto pb-1">
        {[
          { key: "keys", label: "API Keys & Scopes", icon: Key },
          { key: "docs", label: "OpenAPI Documentation", icon: FileCode },
          { key: "analytics", label: "Usage Analytics", icon: Activity },
          { key: "webhooks", label: "Webhooks Engine", icon: Webhook },
          { key: "marketplace", label: "App Directory", icon: Boxes },
          { key: "sdks", label: "SDK Downloads", icon: Terminal },
          { key: "imports", label: "Bulk Data Imports", icon: UploadCloud },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-400 bg-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: API KEYS & SCOPES */}
      {activeTab === "keys" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Active REST API Keys</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage credentials and granular scope access for external applications.</p>
            </div>
            <button
              onClick={() => {
                setShowKeyModal(true);
                setNewSecretKey(null);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Provision New API Key
            </button>
          </div>

          {showKeyModal && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Provision New API Key</h3>
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Key Description / Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. National Police Field Telemetry Service"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-2">Target OAuth API Scopes</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableScopes.map((scope) => {
                      const isChecked = selectedScopes.includes(scope);
                      return (
                        <label
                          key={scope}
                          className={`flex items-center gap-2 p-2 rounded border text-[11px] font-mono cursor-pointer ${
                            isChecked ? "bg-blue-500/10 border-blue-500 text-blue-300" : "bg-slate-950 border-slate-800 text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) setSelectedScopes(selectedScopes.filter((s) => s !== scope));
                              else setSelectedScopes([...selectedScopes, scope]);
                            }}
                            className="hidden"
                          />
                          {scope}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold">
                    Generate Credentials
                  </button>
                </div>
              </form>

              {newSecretKey && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Secret Key Generated Successfully
                  </div>
                  <p className="text-slate-300">Copy your secret key now. It will never be shown again:</p>
                  <div className="p-2.5 bg-slate-950 rounded font-mono text-white select-all border border-emerald-500/20">
                    {newSecretKey}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Key Name</th>
                  <th className="py-3.5 px-4">Prefix</th>
                  <th className="py-3.5 px-4">Permissions / Scopes</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4">Last Used</th>
                  <th className="py-3.5 px-4 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-semibold text-white">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono text-blue-400">{k.keyPrefix}...</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {k.permissions.map((p) => (
                          <span key={p} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{k.createdAt.substring(0, 10)}</td>
                    <td className="py-3.5 px-4 text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : "Never"}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => handleRevokeKey(k.id)} className="text-rose-400 hover:underline font-semibold">
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OPENAPI DOCS */}
      {activeTab === "docs" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">SimTrace REST API Reference (v1)</h2>
                <p className="text-xs text-slate-400">OpenAPI 3.0 Specification — Server Base URL: <span className="font-mono text-blue-400">https://simtrace.enterprise.gov/api/v1</span></p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded">
                Bearer Auth / X-API-Key
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">GET</span>
                  <span className="text-white font-bold">/api/v1/devices/{`{imei}`}/track</span>
                </div>
                <p className="text-slate-400 text-[11px] mb-2 font-sans">Query real-time subscriber activity, tower pings, and risk score for a target IMEI/IMSI.</p>
                <div className="p-2.5 bg-slate-900 rounded text-slate-300 select-all overflow-x-auto">
{`curl -X GET "https://simtrace.enterprise.gov/api/v1/devices/864209123456789/track" \\
  -H "Authorization: Bearer st_live_89a1..." \\
  -H "Content-Type: application/json"`}
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">POST</span>
                  <span className="text-white font-bold">/api/v1/intelligence/graph/query</span>
                </div>
                <p className="text-slate-400 text-[11px] mb-2 font-sans">Execute multi-hop link analysis to discover hidden co-location relationships between suspects.</p>
                <div className="p-2.5 bg-slate-900 rounded text-slate-300 select-all overflow-x-auto">
{`curl -X POST "https://simtrace.enterprise.gov/api/v1/intelligence/graph/query" \\
  -H "Authorization: Bearer st_live_89a1..." \\
  -d '{"targetImei": "864209123456789", "depth": 3}'`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USAGE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-semibold text-slate-400">TOTAL API REQUESTS (24H)</div>
              <div className="text-2xl font-bold text-white mt-1">{analytics.totalRequests}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-semibold text-slate-400">AVERAGE LATENCY</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{analytics.avgResponseTimeMs} ms</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-semibold text-slate-400">HTTP ERRORS</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{analytics.errorCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-xs">Recent API Traffic Logs</div>
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {analytics.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-blue-400">{log.method}</td>
                    <td className="py-3 px-4 text-slate-300">{log.endpoint}</td>
                    <td className="py-3 px-4 text-emerald-400">{log.statusCode}</td>
                    <td className="py-3 px-4 text-slate-400">{log.responseTimeMs} ms</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS */}
      {activeTab === "webhooks" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Outbound Event Webhooks</h2>
              <p className="text-xs text-slate-400 mt-0.5">Stream real-time SIM swap alerts, case updates, and device risk events to external HTTPS endpoints.</p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add Webhook Subscription
            </button>
          </div>

          {showWebhookModal && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-bold text-white text-xs mb-3">Register HTTPS Webhook Endpoint</h3>
              <form onSubmit={handleCreateWebhook} className="space-y-3 text-xs">
                <input
                  type="url"
                  placeholder="https://siem.nps.go.ke/api/v1/simtrace-ingest"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowWebhookModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold">
                    Save Webhook
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Endpoint URL</th>
                  <th className="py-3.5 px-4">Subscribed Events</th>
                  <th className="py-3.5 px-4">Signing Secret</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {webhooks.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{w.url}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {w.events.map((e) => (
                          <span key={e} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{w.secret.substring(0, 16)}...</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          WebhookService.deleteWebhook(w.id);
                          setWebhooks(WebhookService.getWebhooks(orgId));
                        }}
                        className="text-rose-400 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MARKETPLACE */}
      {activeTab === "marketplace" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">App Directory & External Connectors</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pre-built integrations for SIEM platforms, telecom carriers, and law enforcement databases.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplaceApps.map((app) => (
              <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{app.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${app.installed ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      {app.installed ? "INSTALLED" : "AVAILABLE"}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-2">{app.name}</h3>
                  <div className="text-[11px] text-slate-500">By {app.developer}</div>
                  <p className="text-xs text-slate-400 mt-2">{app.description}</p>
                </div>
                <button
                  className={`mt-4 py-2 w-full rounded-lg text-xs font-semibold transition ${
                    app.installed
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {app.installed ? "Configure Connector" : "Install Connector"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SDK DOWNLOADS */}
      {activeTab === "sdks" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">SimTrace Official Client Libraries</h2>
            <p className="text-xs text-slate-400">Official SDKs for Node.js / TypeScript and Python to accelerate enterprise integration.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="font-bold text-white text-sm">JavaScript / TypeScript SDK</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-blue-300 select-all">npm install @simtrace/sdk</div>
                <p className="text-slate-400 text-[11px]">Supports Node.js 18+ and browser environments with auto-retry and HMAC webhook verification.</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="font-bold text-white text-sm">Python Client Library</div>
                <div className="p-2 bg-slate-900 rounded font-mono text-blue-300 select-all">pip install simtrace-py</div>
                <p className="text-slate-400 text-[11px]">Designed for data science, Pandas dataframes, and automated intelligence ingestion pipelines.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: BULK IMPORTS */}
      {activeTab === "imports" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Bulk Data Ingestion & Deduplication Utility</h2>
            <form onSubmit={handleSimulateImport} className="flex flex-col md:flex-row gap-3 text-xs">
              <input
                type="text"
                placeholder="Upload file name e.g. tower_telemetry_dump_nairobi.csv"
                value={importFileName}
                onChange={(e) => setImportFileName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={isImporting}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
              >
                {isImporting ? "Processing Bulk Dump..." : "Simulate Bulk Import"}
              </button>
            </form>

            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden mt-4">
              <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-300">Bulk Import History</div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Processed</th>
                    <th className="py-2.5 px-3">Duplicates Filtered</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {importJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 text-blue-400">{j.id}</td>
                      <td className="py-2.5 px-3 text-slate-300">{j.fileName}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{j.recordsProcessed.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-bold">{j.duplicateCount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{j.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
