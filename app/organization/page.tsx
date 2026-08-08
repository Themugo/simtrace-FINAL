"use client";

import React, { useState } from "react";
import {
  Building2,
  CreditCard,
  Key,
  Shield,
  Activity,
  LifeBuoy,
  CheckCircle,
  Plus,
  Download,
  ArrowUpRight,
  Lock,
  Zap,
} from "lucide-react";

export default function CustomerOrganizationPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "billing" | "usage" | "api" | "tickets">("subscription");

  // State Mock Data
  const [subscription, setSubscription] = useState({
    planName: "Enterprise Global",
    tier: "ENTERPRISE",
    price: "$9,999 / mo",
    status: "ACTIVE",
    renewalDate: "31 Dec 2026",
    paymentMethod: "Enterprise Invoice (Net 30)",
  });

  const [usage] = useState([
    { metric: "Tracked Devices", current: 384, limit: 25000, unit: "Devices" },
    { metric: "Intelligence Searches", current: 12450, limit: 100000, unit: "Queries" },
    { metric: "Investigation Reports", current: 42, limit: 5000, unit: "Reports" },
    { metric: "API Telemetry Calls", current: 89120, limit: 1000000, unit: "Requests" },
  ]);

  const [invoices] = useState([
    { id: "inv-2026-001", date: "01 Jan 2026", amount: "$99,990.00", status: "PAID", gateway: "Enterprise Invoice" },
    { id: "inv-2026-002", date: "01 Jul 2026", amount: "$1,450.00", status: "PAID", gateway: "M-Pesa Business" },
  ]);

  const [apiKeys, setApiKeys] = useState([
    { id: "k1", name: "NPS Telemetry Ingest Key", prefix: "st_live_89a1", created: "15 Jan 2026", permissions: "Full Read/Write" },
  ]);

  const [tickets, setTickets] = useState([
    { id: "tkt-1", subject: "Requesting custom ML feature weights for SIM swap alerts", priority: "HIGH", status: "IN_PROGRESS" },
  ]);

  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newRawKey, setNewRawKey] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    const rawSecret = `st_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const createdKey = {
      id: `k-${Date.now()}`,
      name: newKeyName,
      prefix: rawSecret.substring(0, 12),
      created: "Just now",
      permissions: "Standard Telemetry",
    };
    setApiKeys([...apiKeys, createdKey]);
    setNewRawKey(rawSecret);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">National Police Service — Organization Portal</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Tenant ID: <span className="font-mono text-blue-400 font-semibold">org-police-01</span> | Security Level: <span className="text-amber-400">HIGH_ASSURANCE</span></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Plan: {subscription.planName}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 my-6 overflow-x-auto pb-1">
        {[
          { key: "subscription", label: "Subscription Plan", icon: Zap },
          { key: "billing", label: "Billing & Invoices", icon: CreditCard },
          { key: "usage", label: "Usage Metering", icon: Activity },
          { key: "api", label: "API Keys", icon: Key },
          { key: "tickets", label: "Support Tickets", icon: LifeBuoy },
          { key: "profile", label: "Org Profile & Security", icon: Shield },
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

      {/* TAB CONTENT: SUBSCRIPTION */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Plan</span>
              <h2 className="text-2xl font-bold text-white mt-1">{subscription.planName}</h2>
              <p className="text-sm text-slate-400 mt-1">Enterprise multi-org data isolation, unlimited graphs, and dedicated account manager.</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">{subscription.price}</div>
              <div className="text-xs text-slate-400 mt-1">Renews on {subscription.renewalDate}</div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mt-6">Available Commercial SaaS Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">STARTER</div>
                <div className="text-xl font-bold text-white mt-1">$499 <span className="text-xs text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400 mt-2">Up to 100 devices, 5 users, basic reporting.</p>
              </div>
              <button className="mt-4 w-full py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-xs font-semibold border border-slate-700">
                Downgrade to Starter
              </button>
            </div>

            <div className="bg-slate-900 border-2 border-blue-500 rounded-xl p-5 flex flex-col justify-between relative">
              <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">Active Plan</span>
              <div>
                <div className="text-xs font-semibold text-blue-400">ENTERPRISE GLOBAL</div>
                <div className="text-xl font-bold text-white mt-1">$9,999 <span className="text-xs text-slate-400">/ mo</span></div>
                <p className="text-xs text-slate-400 mt-2">25,000 devices, full AI fraud engine, dedicated TAM.</p>
              </div>
              <button disabled className="mt-4 w-full py-2 bg-blue-600/20 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/30">
                Current Active Plan
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-amber-400">SOVEREIGN GOVERNMENT</div>
                <div className="text-xl font-bold text-white mt-1">Custom Tier</div>
                <p className="text-xs text-slate-400 mt-2">Private sovereign Cloud Run deployment, air-gapped support.</p>
              </div>
              <button className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold">
                Contact Sovereign Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BILLING & INVOICES */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-bold text-white mb-4 text-sm">Commercial Invoices & Payment Receipts</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">{inv.id}</td>
                    <td className="py-3 px-4 text-slate-300">{inv.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{inv.amount}</td>
                    <td className="py-3 px-4 text-slate-400">{inv.gateway}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold">
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USAGE METERING */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usage.map((u, i) => {
              const pct = Math.round((u.current / u.limit) * 100);
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{u.metric}</span>
                    <span className="font-mono text-blue-400">{u.current.toLocaleString()} / {u.limit.toLocaleString()} {u.unit}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 mt-3 overflow-hidden border border-slate-800">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                    <span>Quota Consumption</span>
                    <span>{pct}% Used</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: API KEYS */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Commercial REST API Keys</h3>
            <button
              onClick={() => setIsCreatingKey(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Provision New API Key
            </button>
          </div>

          {isCreatingKey && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h4 className="font-bold text-white text-xs mb-3">Create New Service API Key</h4>
              <form onSubmit={handleCreateKey} className="space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="Key description e.g. Safaricom Ingestion Webhook"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingKey(false);
                      setNewRawKey(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold">
                    Generate Key
                  </button>
                </div>
              </form>

              {newRawKey && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 font-mono">
                  Copy your secret key now (it will not be shown again):
                  <div className="p-2 bg-slate-950 rounded mt-1 text-white select-all">{newRawKey}</div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Prefix</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-semibold text-white">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-blue-400">{k.prefix}...</td>
                    <td className="py-3 px-4 text-slate-400">{k.created}</td>
                    <td className="py-3 px-4 text-slate-300">{k.permissions}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-rose-400 hover:underline font-semibold">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-bold text-white text-sm mb-4">Support & Ticket Portal</h3>
            {tickets.map((t) => (
              <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">{t.subject}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ticket ID: {t.id} | Priority: <span className="text-rose-400">{t.priority}</span></div>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-400 font-semibold px-2.5 py-0.5 rounded border border-amber-500/30">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Organization Governance & Security Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Country Jurisdiction</label>
              <input type="text" disabled value="Kenya (National Police HQ)" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-300" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Data Retention Period</label>
              <input type="text" disabled value="3,650 Days (10 Years Sovereign Policy)" className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-300" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
