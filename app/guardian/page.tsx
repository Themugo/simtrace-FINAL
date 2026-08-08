"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  Users,
  AlertTriangle,
  Siren,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Radio,
  MapPin,
  Clock,
  UserPlus,
  PhoneCall,
  BellRing,
  Award,
} from "lucide-react";
import {
  GuardianService,
  Guardian,
  PanicAlert,
  DeviceIncidentReport,
  MinorDeviceRegistration,
} from "../../services/guardian.service";

export default function GuardianPortalPage() {
  const [activeTab, setActiveTab] = useState<"owner" | "guardian" | "minors">("owner");

  // Owner state
  const ownerId = "owner-user-01";
  const ownerName = "Alexander Jenkins";
  const deviceImei = "358992019921101";
  const [guardians, setGuardians] = useState<Guardian[]>(GuardianService.getGuardiansForOwner(ownerId));

  // System Users State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedSystemUser, setSelectedSystemUser] = useState<string>("");
  const [gRel, setGRel] = useState<Guardian["relationship"]>("SPOUSE");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const systemUsers = GuardianService.searchSystemUsers(userSearchQuery);

  // Handlers
  const handleAddGuardianFromSystemUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedSystemUser) {
      setErrorMsg("Please select a registered System User from the directory.");
      return;
    }

    const res = GuardianService.addGuardianFromSystemUser(ownerId, selectedSystemUser, gRel);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      setGuardians(GuardianService.getGuardiansForOwner(ownerId));
      setSelectedSystemUser("");
      setUserSearchQuery("");
    }
  };

  const handleRemoveGuardian = (id: string) => {
    GuardianService.removeGuardian(ownerId, id);
    setGuardians(GuardianService.getGuardiansForOwner(ownerId));
  };

  const handleTriggerPanic = () => {
    const alert = GuardianService.triggerPanicButton(ownerId, ownerName, deviceImei);
    setPanicAlerts([...GuardianService.getPanicAlerts()]);
    setSuccessMsg(`EMERGENCY PANIC ALERT TRIGGERED! Broadcast sent to ${guardians.length} registered guardians.`);
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDetails.trim()) return;

    GuardianService.reportDeviceIncident("g-101", "Sarah Jenkins", incImei, incOwner, incType, incDetails);
    setIncidents([...GuardianService.getDeviceIncidentReports()]);
    setIncDetails("");
  };

  const handleRegisterMinor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minorName.trim() || !minorImei.trim()) return;

    GuardianService.registerMinorDevice("g-101", "Sarah Jenkins", {
      minorName,
      minorAge,
      deviceImei: minorImei,
      deviceModel: minorModel,
      carrier: minorCarrier,
    });

    setMinorDevices([...GuardianService.getMinorDevices()]);
    setMinorName("");
    setMinorImei("");
  };

  const handleUpdateMinorStatus = (id: string, status: "ACTIVE" | "REMOTE_LOCKED" | "TRACKING_ONLY") => {
    GuardianService.updateMinorDeviceStatus(id, status);
    setMinorDevices([...GuardianService.getMinorDevices()]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 rounded-xl text-white shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">SimTrace Guardian & Safety Delegation Portal</h1>
              <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold rounded">
                GUARDIAN v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Emergency Panic Broadcasting, Device Loss Reports, Guardian Delegation (Max 3) & Minor Autonomous Controls
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerPanic}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-950 animate-pulse"
        >
          <Siren className="w-4 h-4" /> TEST PANIC BUTTON BROADCAST
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: "owner", label: "Device Owner (Manage Guardians)", icon: Users },
          { id: "guardian", label: "Guardian Emergency Console", icon: BellRing },
          { id: "minors", label: "Minor Device Delegation (Full Autonomy)", icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-400 bg-slate-900/50"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {/* TAB 1: Device Owner Guardian Management */}
      {activeTab === "owner" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Guardians List (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Designated System User Guardians for {ownerName}
                </h2>
                <p className="text-xs text-slate-400">Device owners have full right to add up to 3 verified system users as guardians or change them at wish.</p>
              </div>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300 rounded-lg">
                {guardians.length} / 3 GUARDIANS REGISTERED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guardians.map((g) => (
                <div key={g.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                        {g.guardianName}
                        <Award className="w-3.5 h-3.5 text-cyan-400" title="Verified System User" />
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                          {g.relationship}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                          {g.systemUserId}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuardian(g.id)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg transition"
                      title="Remove / Change Guardian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 font-mono pt-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <PhoneCall className="w-3.5 h-3.5 text-cyan-400" /> {g.guardianPhone}
                    </div>
                    <div className="text-[11px] text-slate-400">{g.guardianEmail}</div>
                  </div>
                </div>
              ))}

              {guardians.length < 3 && (
                <div className="p-6 bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <UserPlus className="w-6 h-6 text-slate-600" />
                  <div className="text-xs font-semibold text-slate-400">Guardian Slot Available</div>
                  <div className="text-[10px] text-slate-500">You can assign up to {3 - guardians.length} more system user(s).</div>
                </div>
              )}
            </div>
          </div>

          {/* Add Guardian Form (1 col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Assign System User as Guardian</h2>
            <form onSubmit={handleAddGuardianFromSystemUser} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Search System User (National ID / System ID / Name)</label>
                <input
                  type="text"
                  placeholder="e.g. 19283741 or Grace"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Registered System User</label>
                <select
                  value={selectedSystemUser}
                  onChange={(e) => setSelectedSystemUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                >
                  <option value="">-- Choose System User --</option>
                  {systemUsers.map((user) => (
                    <option key={user.systemUserId} value={user.systemUserId}>
                      {user.fullName} (ID: {user.nationalId} | {user.systemUserId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Relationship</label>
                <select
                  value={gRel}
                  onChange={(e) => setGRel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="SPOUSE">Spouse</option>
                  <option value="PARENT">Parent</option>
                  <option value="TRUSTED_RELATIVE">Trusted Relative</option>
                  <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={guardians.length >= 3}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition mt-2"
              >
                Assign System User Guardian (Max 3)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Guardian Emergency Console */}
      {activeTab === "guardian" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Panic Alerts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Siren className="w-5 h-5 text-rose-500" /> Active Emergency Panic Alerts
            </h2>

            <div className="space-y-3">
              {panicAlerts.map((a) => (
                <div key={a.id} className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" /> {a.ownerName}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold rounded">
                      {a.status}
                    </span>
                  </div>
                  <p className="text-slate-200">{a.message}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> {a.location.address}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Timestamp: {new Date(a.timestamp).toLocaleString()} | IMEI: {a.deviceImei}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Device Lost or Owner in Danger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Report Device Lost or Owner in Danger</h2>

            <form onSubmit={handleReportIncident} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Device IMEI</label>
                <input
                  type="text"
                  value={incImei}
                  onChange={(e) => setIncImei(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Device Owner Name</label>
                <input
                  type="text"
                  value={incOwner}
                  onChange={(e) => setIncOwner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Report Type</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="OWNER_IN_DANGER">OWNER IN DANGER (Immediate Dispatch)</option>
                  <option value="DEVICE_LOST">DEVICE LOST / STOLEN (Remote Vault Lock)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Observations / Details</label>
                <textarea
                  placeholder="Describe location or emergency circumstances..."
                  value={incDetails}
                  onChange={(e) => setIncDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-20"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl transition"
              >
                Submit Guardian Emergency Report
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Minor Device Delegation Portal */}
      {activeTab === "minors" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registered Minors List (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" /> Minor Registered Devices (Full Guardian Autonomy)
            </h2>

            <div className="space-y-4">
              {minorDevices.map((m) => (
                <div key={m.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-sm">{m.minorName} (Age: {m.minorAge})</h3>
                      <div className="text-slate-400 text-[11px]">Model: {m.deviceModel} | Carrier: {m.carrier}</div>
                      <div className="text-slate-500 text-[10px] font-mono">IMEI: {m.deviceImei}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 font-semibold text-[11px]">Guardian Autonomy Actions:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateMinorStatus(m.id, "ACTIVE")}
                        className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-semibold rounded-lg border border-emerald-500/30"
                      >
                        Set Active
                      </button>
                      <button
                        onClick={() => handleUpdateMinorStatus(m.id, "REMOTE_LOCKED")}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold rounded-lg border border-rose-500/30"
                      >
                        Remote Lock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Register Minor Device Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Register Device for Minor</h2>

            <form onSubmit={handleRegisterMinor} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Minor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ethan Jenkins"
                  value={minorName}
                  onChange={(e) => setMinorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Minor Age</label>
                <input
                  type="number"
                  value={minorAge}
                  onChange={(e) => setMinorAge(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Device IMEI</label>
                <input
                  type="text"
                  placeholder="e.g. 869123049182999"
                  value={minorImei}
                  onChange={(e) => setMinorImei(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Device Model</label>
                <input
                  type="text"
                  value={minorModel}
                  onChange={(e) => setMinorModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition mt-2"
              >
                Register Minor Device (Full Autonomy)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
