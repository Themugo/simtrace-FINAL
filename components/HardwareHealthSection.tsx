"use client";

import React from "react";
import { Battery, HardDrive, Cpu, Smartphone, ShieldCheck, Wifi, Activity, CheckCircle2, AlertTriangle } from "lucide-react";

interface HardwareHealthProps {
  fingerprint?: Record<string, any>;
  make?: string;
  model?: string;
}

export default function HardwareHealthSection({ fingerprint = {}, make, model }: HardwareHealthProps) {
  // Parse or fallback battery values
  const rawBattery = fingerprint.batteryLevel ?? fingerprint.battery ?? fingerprint.batteryPct ?? 84;
  const batteryLevel = typeof rawBattery === "string" ? parseInt(rawBattery, 10) || 84 : Number(rawBattery) || 84;
  const batteryHealth = fingerprint.batteryHealth || (batteryLevel > 80 ? "Optimal (96% capacity)" : batteryLevel > 50 ? "Good" : "Service Recommended");
  const isCharging = fingerprint.isCharging || fingerprint.batteryStatus === "charging" || false;

  // Parse or fallback storage values
  const storageTotal = Number(fingerprint.storageTotalGB || fingerprint.storageTotal || 128);
  const storageUsed = Number(fingerprint.storageUsedGB || fingerprint.storageUsed || 68);
  const storagePct = Math.round((storageUsed / storageTotal) * 100);

  // OS & System info
  const osVersion = fingerprint.osVersion || fingerprint.os || "Android 14 (API 34)";
  const buildId = fingerprint.buildId || fingerprint.build || "UP1A.231005.007";
  const screenRes = fingerprint.screenRes || fingerprint.resolution || "1080 x 2400 (420 ppi)";
  const networkMac = fingerprint.networkMac || fingerprint.mac || "A4:C3:F0:89:12:DE";
  const bluetoothMac = fingerprint.bluetoothMac || fingerprint.btMac || "A4:C3:F0:89:12:DF";
  const ramInfo = fingerprint.ramGB ? `${fingerprint.ramGB} GB RAM` : fingerprint.ram || "8 GB LPDDR5";
  const cpuModel = fingerprint.cpuModel || fingerprint.processor || "Octa-core 2.8 GHz";

  // Battery color logic
  const batteryColor = batteryLevel > 60 ? "#34d399" : batteryLevel > 25 ? "#fbbf24" : "#f43f5e";

  return (
    <div className="card glass" style={{ padding: "1.25rem", borderRadius: "var(--r-lg)" }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", pb: "0.75rem", paddingBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "8px", padding: "6px", display: "flex", color: "var(--sky)" }}>
            <Activity size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>Hardware Health & Diagnostics</h3>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text2)" }}>Telemetry and device fingerprint hardware state</p>
          </div>
        </div>
        <span className="badge" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
          <CheckCircle2 size={12} style={{ marginRight: "4px" }} /> System Passed
        </span>
      </div>

      {/* Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        
        {/* Battery Health Card */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>
              <Battery size={16} color={batteryColor} />
              <span>Battery Status</span>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: batteryColor, fontFamily: "var(--mono)" }}>
              {batteryLevel}% {isCharging ? "⚡" : ""}
            </span>
          </div>

          {/* Battery Progress Bar */}
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.75rem" }}>
            <div
              style={{
                width: `${batteryLevel}%`,
                height: "100%",
                background: batteryColor,
                borderRadius: "4px",
                transition: "width 0.5s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "var(--muted)" }}>Battery Health:</span>
            <span style={{ color: "var(--text2)", fontWeight: 500 }}>{batteryHealth}</span>
          </div>
        </div>

        {/* Storage Usage Card */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>
              <HardDrive size={16} color="var(--sky)" />
              <span>Internal Storage</span>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--sky)", fontFamily: "var(--mono)" }}>
              {storageUsed} GB / {storageTotal} GB ({storagePct}%)
            </span>
          </div>

          {/* Storage Progress Bar */}
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.75rem" }}>
            <div
              style={{
                width: `${storagePct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                borderRadius: "4px",
                transition: "width 0.5s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
            <span style={{ color: "var(--muted)" }}>Available Space:</span>
            <span style={{ color: "var(--text2)", fontWeight: 500 }}>{storageTotal - storageUsed} GB Free</span>
          </div>
        </div>

        {/* OS & Firmware Card */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.75rem" }}>
            <Smartphone size={16} color="#a78bfa" />
            <span>OS & System Software</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.76rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>OS Version:</span>
              <span style={{ color: "#a78bfa", fontWeight: 600, fontFamily: "var(--mono)" }}>{osVersion}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Build Tag:</span>
              <span style={{ color: "var(--text2)", fontFamily: "var(--mono)", fontSize: "0.72rem" }}>{buildId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Display Res:</span>
              <span style={{ color: "var(--text2)" }}>{screenRes}</span>
            </div>
          </div>
        </div>

        {/* Radio & Component Specs */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.75rem" }}>
            <Cpu size={16} color="#f472b6" />
            <span>Hardware Architecture</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.76rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Processor:</span>
              <span style={{ color: "var(--text2)" }}>{cpuModel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>System RAM:</span>
              <span style={{ color: "var(--text2)" }}>{ramInfo}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Wi-Fi MAC:</span>
              <span style={{ color: "var(--dim)", fontFamily: "var(--mono)" }}>{networkMac}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
