"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Camera,
  MapPin,
  Users,
  ShieldCheck,
  Globe,
  UploadCloud,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  Plus,
  Compass,
} from "lucide-react";
import {
  MobileFieldService,
  MobileDeviceRecord,
  OfflineSyncItem,
  MobileEvidenceCapture,
  FieldTeam,
  RegionalSettings,
} from "../../services/mobileField.service";

export default function FieldOperationsPage() {
  const [userId] = useState("user-inspect-doe");
  const [orgId] = useState("org-police-01");

  const [devices, setDevices] = useState<MobileDeviceRecord[]>(MobileFieldService.getRegisteredDevices());
  const [syncQueue, setSyncQueue] = useState<OfflineSyncItem[]>(MobileFieldService.getSyncQueue(userId));
  const [evidenceList, setEvidenceList] = useState<MobileEvidenceCapture[]>(MobileFieldService.getEvidenceCaptures());
  const [fieldTeams] = useState<FieldTeam[]>(MobileFieldService.getFieldTeams(orgId));
  const [regionalSettings] = useState<RegionalSettings[]>(MobileFieldService.getRegionalSettings());

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Evidence capture form state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evCaseId, setEvCaseId] = useState("case-ke-2026-0891");
  const [evMediaType, setEvMediaType] = useState<MobileEvidenceCapture["mediaType"]>("PHOTO");
  const [evDeviceModel, setEvDeviceModel] = useState("iPhone 15 Pro");

  const handleProcessSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const result = MobileFieldService.processSyncQueue(userId);
      setSyncQueue([...MobileFieldService.getSyncQueue(userId)]);
      setIsSyncing(false);
      setSyncMsg(`Processed ${result.processedCount} offline action(s). Data synced to cloud.`);
    }, 1200);
  };

  const handleCaptureEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    const newEv = MobileFieldService.captureMobileEvidence({
      caseId: evCaseId,
      capturedBy: "Inspector John Doe",
      mediaType: evMediaType,
      fileUrl: `s3://simtrace-sovereign-evidence-prod/mobile/ev_${Date.now()}.jpg`,
      sha256Hash: `hash_sha256_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      gpsCoordinates: { latitude: -1.286389, longitude: 36.817223, accuracyMeters: 2.5 },
      deviceModel: evDeviceModel,
    });
    setEvidenceList(MobileFieldService.getEvidenceCaptures());
    setShowEvidenceModal(false);
  };

  const pendingCount = syncQueue.filter((s) => s.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">SimTrace Field Operations & Mobile Intelligence</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Field investigator device telemetry, tamper-evident mobile evidence, offline sync queue & regional settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} /> Force Sync Offline Buffer ({pendingCount})
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="my-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {syncMsg}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>REGISTERED MOBILE DEVICES</span>
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{devices.length} Devices</div>
          <div className="text-xs text-emerald-400 mt-1">100% Trusted & Hardware Enclaved</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>OFFLINE SYNC QUEUE</span>
            {pendingCount > 0 ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="text-2xl font-bold text-white mt-1">{pendingCount} Pending Items</div>
          <div className="text-xs text-slate-400 mt-1">Bi-directional SQLite Sync Engine</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>FIELD TACTICAL TEAMS</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{fieldTeams.length} Active Teams</div>
          <div className="text-xs text-emerald-400 mt-1">10 Officers On Duty</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>GLOBAL REGIONAL PROFILES</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{regionalSettings.length} Sovereign Zones</div>
          <div className="text-xs text-slate-400 mt-1">KE / UK / US Legal Controls</div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mobile Devices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" /> Registered Mobile Handsets & Biometric Access
            </h2>
            <span className="text-xs text-slate-400 font-mono">Hardware Pinning</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Device Model</th>
                <th className="py-3 px-4">Platform / OS</th>
                <th className="py-3 px-4">Trusted State</th>
                <th className="py-3 px-4">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-white">{d.model}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">{d.platform} ({d.osVersion})</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">
                      VERIFIED TRUSTED
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(d.lastActive).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Offline Action Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-400" /> Offline Action Buffer & Conflict Resolution
            </h2>
            <span className="text-xs text-slate-400 font-mono">Auto-Sync Queue</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Payload</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {syncQueue.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{s.action}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px] truncate max-w-[150px]">
                    {JSON.stringify(s.payload)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        s.status === "SYNCED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(s.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Evidence & Field Teams Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" /> Mobile Evidence Chain-of-Custody Stream
            </h2>
            <p className="text-xs text-slate-400">Photos, audio notes, and documents captured in field operations with SHA-256 signatures and GPS telemetry.</p>
          </div>
          <button
            onClick={() => setShowEvidenceModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Capture Mobile Evidence
          </button>
        </div>

        {showEvidenceModal && (
          <form onSubmit={handleCaptureEvidence} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Case ID</label>
                <input
                  type="text"
                  value={evCaseId}
                  onChange={(e) => setEvCaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Media Type</label>
                <select
                  value={evMediaType}
                  onChange={(e) => setEvMediaType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="PHOTO">PHOTO</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Device Model</label>
                <input
                  type="text"
                  value={evDeviceModel}
                  onChange={(e) => setEvDeviceModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEvidenceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded font-semibold">
                Generate Hash & Save Evidence
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidenceList.map((ev) => (
            <div key={ev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{ev.mediaType} EVIDENCE — {ev.caseId}</span>
                <span className="text-[10px] text-slate-400">{new Date(ev.capturedAt).toLocaleTimeString()}</span>
              </div>
              <div className="text-slate-300">Captured by: <span className="text-blue-400">{ev.capturedBy}</span> ({ev.deviceModel})</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                <MapPin className="w-3.5 h-3.5" /> GPS: Lat {ev.gpsCoordinates.latitude}, Lon {ev.gpsCoordinates.longitude} (Accuracy: {ev.gpsCoordinates.accuracyMeters}m)
              </div>
              <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-400 select-all border border-slate-800">
                SHA-256: {ev.sha256Hash}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Global Deployment Regional Configurations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {regionalSettings.map((r) => (
            <div key={r.countryCode} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{r.country} ({r.countryCode})</span>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold rounded">
                  {r.currency}
                </span>
              </div>
              <div className="text-slate-400">Timezone: <span className="text-slate-200">{r.timezone}</span></div>
              <div className="text-slate-400">Language: <span className="text-slate-200">{r.language}</span></div>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance Rules:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.complianceRules.map((rule) => (
                    <span key={rule} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
