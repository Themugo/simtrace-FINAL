"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code,
  Smartphone,
  Shield,
  ShieldAlert,
  Terminal,
  Cpu,
  Layers,
  Copy,
  Check,
  Zap,
  Download,
  Key,
  FileCode,
  Activity,
  Lock,
  Radio,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Server,
  Play,
  CheckSquare,
  Square,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

interface FirmwareStep {
  id: string;
  title: string;
  category: "Kernel" | "Enclave" | "Baseband" | "Firmware";
  description: string;
  codeHint: string;
}

const FIRMWARE_STEPS: FirmwareStep[] = [
  {
    id: "step1",
    title: "1. Configure SELinux & System Partition Permissions",
    category: "Kernel",
    description: "Grant the baseband telemetry daemon read/write permissions for /dev/ttyUSB0, /dev/smd0, and secure enclave RPC nodes.",
    codeHint: "allow simtrace_daemon baseband_device:chr_file { read write open ioctl };"
  },
  {
    id: "step2",
    title: "2. Provision OEM Root Trust in Hardware Secure Enclave",
    category: "Enclave",
    description: "Burn SIMTRACE OEM public attestation key into TEE/Keystore for tamper-proof payload signatures.",
    codeHint: "SimTraceEnclave.bindOemRootKey(SHA256_OEM_PUB_KEY);"
  },
  {
    id: "step3",
    title: "3. Bind Baseband AT-Command Telemetry Listener",
    category: "Baseband",
    description: "Arm low-latency unsolicited result code (URC) handlers for instant physical SIM eject & eSIM profile mutations.",
    codeHint: "AT+CRSM=176,28589,0,0,15 // Monitor SIM EF_ICCID changes"
  },
  {
    id: "step4",
    title: "4. Hook Kernel Emergency Lockdown Trigger",
    category: "Firmware",
    description: "Connect hardware panic interrupt to instant screen blanking, memory zeroization, and biometric lockout.",
    codeHint: "register_kernel_panic_hook(&simtrace_instant_lockdown);"
  },
  {
    id: "step5",
    title: "5. Register Court Evidence Vault Encryption Keys",
    category: "Enclave",
    description: "Configure AES-256-GCM hardware key pair for sealing GPS, BTS TDOA, and camera snapshots.",
    codeHint: "SimTraceVault.initializeEnclaveKey(KeyPurpose.ENCRYPT_EVIDENCE);"
  },
  {
    id: "step6",
    title: "6. Execute End-to-End Firmware Attestation Diagnostics",
    category: "Firmware",
    description: "Run automated self-test verification to ensure FIPS 140-3 compliance and CEIR network relay readiness.",
    codeHint: "SimTraceDiagnostics.runFullAttestationCheck(); // Expected: PASSED"
  }
];

export default function ForensicSdkGuide() {
  const [platform, setPlatform] = useState<"android" | "ios" | "react-native" | "native-c">("android");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"setup" | "init" | "listeners" | "evidence">("setup");
  
  // Firmware Binding Checklist State
  const [firmwareChecklist, setFirmwareChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: true,
    step4: false,
    step5: false,
    step6: false
  });
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>("step3");

  const completedCount = Object.values(firmwareChecklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / FIRMWARE_STEPS.length) * 100);

  function toggleStep(id: string) {
    setFirmwareChecklist((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function resetChecklist() {
    setFirmwareChecklist({
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false
    });
  }

  function runAutoDiagnostics() {
    setIsRunningDiag(true);
    let current = 0;
    const stepIds = FIRMWARE_STEPS.map((s) => s.id);
    const interval = setInterval(() => {
      if (current < stepIds.length) {
        const id = stepIds[current];
        setFirmwareChecklist((prev) => ({ ...prev, [id]: true }));
        setExpandedStep(id);
        current++;
      } else {
        clearInterval(interval);
        setIsRunningDiag(false);
      }
    }, 400);
  }

  // Interactive Simulator State
  const [simConfig, setSimConfig] = useState({
    autoLockOnSimSwap: true,
    silentSnapshot: true,
    biometricChallenge: true,
    ceirBlacklistRelay: true,
    backgroundIntervalSec: 15
  });

  const [simLogs, setSimLogs] = useState<Array<{ id: string; time: string; event: string; type: "info" | "warn" | "danger" | "success"; payload: string }>>([
    {
      id: "log_1",
      time: new Date().toLocaleTimeString(),
      event: "SDK_INITIALIZED",
      type: "info",
      payload: '{"status": "READY", "hardwareDnaHash": "0x8f41...2390", "enclaveState": "SECURE", "fipsCompliant": true}'
    },
    {
      id: "log_2",
      time: new Date().toLocaleTimeString(),
      event: "BASEBAND_MONITOR_ARMED",
      type: "success",
      payload: '{"imsi": "639021002341098", "eSimEid": "89000000000000000000", "radioState": "CONNECTED"}'
    }
  ]);

  const [activeSimEvent, setActiveSimEvent] = useState<string | null>(null);

  function triggerSimEvent(eventType: "sim_swap" | "tamper" | "ss7_anomaly" | "evidence_snap") {
    setActiveSimEvent(eventType);
    const time = new Date().toLocaleTimeString();

    let eventLog = {
      id: "log_" + Date.now(),
      time,
      event: "",
      type: "info" as "info" | "warn" | "danger" | "success",
      payload: ""
    };

    if (eventType === "sim_swap") {
      eventLog = {
        id: "log_" + Date.now(),
        time,
        event: "SIM_SWAP_DETECTED_ALERT",
        type: "danger",
        payload: JSON.stringify({
          eventType: "SIM_SWAP_UNAUTHORIZED",
          previousImsi: "639021002341098",
          newImsi: "639021998877665",
          imei: "356938035643809",
          location: { lat: -1.286389, lng: 36.817223, accuracy: "4.2m" },
          actionTaken: simConfig.autoLockOnSimSwap ? "REMOTE_LOCK_ENFORCED" : "ALERT_DISPATCHED",
          signature: "0x7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f"
        }, null, 2)
      };
    } else if (eventType === "tamper") {
      eventLog = {
        id: "log_" + Date.now(),
        time,
        event: "HARDWARE_TAMPER_ALERT",
        type: "warn",
        payload: JSON.stringify({
          eventType: "HARDWARE_STATE_MUTATION",
          subsystem: "SECURE_ELEMENT_ENCLAVE",
          tamperDetails: "Voltage variation or pin trace interruption detected",
          chainOfCustody: "RECORDED_IN_LEDGER",
          evidenceHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        }, null, 2)
      };
    } else if (eventType === "ss7_anomaly") {
      eventLog = {
        id: "log_" + Date.now(),
        time,
        event: "SS7_DIAMETER_INTRUSION_BLOCKED",
        type: "warn",
        payload: JSON.stringify({
          eventType: "SS7_MAP_CANCEL_LOCATION_SPOOF",
          originatingGt: "+447911123456",
          carrierNetwork: "Safaricom_4G_LTE",
          threatLevel: "CRITICAL",
          mitigation: "SILENT_REJECTION_HUB_SYNC"
        }, null, 2)
      };
    } else {
      eventLog = {
        id: "log_" + Date.now(),
        time,
        event: "FORENSIC_EVIDENCE_VAULT_PACKAGED",
        type: "success",
        payload: JSON.stringify({
          eventType: "COURT_AFFIDAVIT_GENERATED",
          frontCamSnapshot: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
          cellTowerTDOA: ["BTS_4102", "BTS_4109", "BTS_4188"],
          sha256Proof: "0x49f82103a8f712e98c0b12a34f56789012345678901234567890123456789012"
        }, null, 2)
      };
    }

    setSimLogs(prev => [eventLog, ...prev.slice(0, 7)]);
    setTimeout(() => setActiveSimEvent(null), 1200);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Code snippets by platform
  const codeSnippets = {
    android: {
      setup: `// build.gradle.kts (Module: app)
dependencies {
    // SIMTRACE Forensic Hardware Telemetry SDK
    implementation("com.simtrace.sdk:forensic-core:2.8.4")
    implementation("com.simtrace.sdk:hardware-attestation:2.8.4")
}`,
      init: `import com.simtrace.sdk.SimTraceForensic
import com.simtrace.sdk.config.SimTraceConfig

class SecurityApplication : Application() {
    override function onCreate() {
        super.onCreate()
        
        val config = SimTraceConfig.Builder()
            .setApiKey("st_live_98f4a27b1c8e0d9f3a5b7c1e")
            .enableBasebandListener(true)
            .setFipsEnclaveMode(true)
            .setAutoLockOnSimSwap(true)
            .setCheckIntervalSeconds(15)
            .build()
            
        SimTraceForensic.initialize(this, config) { result ->
            if (result.isSuccess) {
                Log.i("SimTrace", "Forensic Hardware SDK bound. Hardware DNA: \${result.hardwareDna}")
            }
        }
    }
}`,
      listeners: `import com.simtrace.sdk.events.SimTraceEventListener
import com.simtrace.sdk.events.SimSwapEvent

SimTraceForensic.registerEventListener(object : SimTraceEventListener {
    override fun onSimSwapDetected(event: SimSwapEvent) {
        Log.w("SimTrace", "Unauthorized SIM Swap! Prev IMSI: \${event.previousImsi}")
        
        // Secure court-admissible evidence capture
        val evidencePackage = event.captureForensicSnapshot()
        SimTraceForensic.dispatchCeirAlert(evidencePackage)
    }

    override fun onHardwareTamperDetected(tamper: HardwareTamperEvent) {
        // Enforce instant kernel level lockdown
        SimTraceForensic.lockDeviceImmediately("UNAUTHORIZED_HARDWARE_MODIFICATION")
    }
})`,
      evidence: `// Generate SHA-256 signed evidence bundle for law enforcement
val forensicVault = SimTraceForensic.getEvidenceVault()
val legalAffidavit = forensicVault.generateCourtPackage(
    caseId = "ST-2026-90412",
    includeGpsBreadcrumbs = true,
    includeCellTowerTdoa = true
)

// Affidavit is tamper-proof signed with hardware enclave private key
Log.i("SimTrace", "Legal Affidavit Digest: \${legalAffidavit.sha256Digest}")`
    },
    ios: {
      setup: `// Podfile
target 'MobileSecurityApp' do
  use_frameworks!
  pod 'SimTraceForensicSDK', '~> 2.8.4'
end`,
      init: `import UIKit
import SimTraceForensicSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        let config = SimTraceConfig(
            apiKey: "st_live_98f4a27b1c8e0d9f3a5b7c1e",
            enableSecureEnclaveBinding: true,
            autoLockOnSimSwap: true
        )
        
        SimTraceForensic.shared.configure(with: config) { success, hardwareDna in
            print("SIMTRACE iOS Forensic SDK Armed. DNA: \\(hardwareDna ?? "")")
        }
        
        return true
    }
}`,
      listeners: `SimTraceForensic.shared.delegate = self

extension AppDelegate: SimTraceForensicDelegate {
    func simTrace(_ sdk: SimTraceForensic, didDetectSimSwap event: SimSwapEvent) {
        print("SIM Swap alert: \\(event.newImsiHash)")
        sdk.enforceRemoteLockdown(reason: "UNAUTHORIZED_SIM_SWAP")
    }
    
    func simTrace(_ sdk: SimTraceForensic, didDetectHardwareTamper tamper: TamperEvent) {
        sdk.uploadEvidenceSnapshotToVault()
    }
}`,
      evidence: `let evidence = SimTraceForensic.shared.createCourtEvidenceBundle()
print("iOS Enclave Cryptographic Signature: \\(evidence.secureEnclaveSignature)")`
    },
    "react-native": {
      setup: `npm install @simtrace/react-native-forensic-sdk
# or yarn add @simtrace/react-native-forensic-sdk

cd ios && pod install`,
      init: `import { SimTraceSdk } from '@simtrace/react-native-forensic-sdk';

useEffect(() => {
  async function initSimTrace() {
    await SimTraceSdk.initialize({
      apiKey: "st_live_98f4a27b1c8e0d9f3a5b7c1e",
      autoLockOnSimSwap: true,
      enableBasebandMonitoring: true,
    });
    
    const dna = await SimTraceSdk.getHardwareDna();
    console.log("SIMTRACE Hardware DNA:", dna);
  }
  
  initSimTrace();
}, []);`,
      listeners: `import { SimTraceSdk, EventTypes } from '@simtrace/react-native-forensic-sdk';

const subscription = SimTraceSdk.addListener(
  EventTypes.SIM_SWAP_DETECTED,
  (event) => {
    console.warn("SIM Swap Alert!", event);
    SimTraceSdk.triggerEmergencyLockout("SIM_SWAP_ALERT");
  }
);`,
      evidence: `const courtPackage = await SimTraceSdk.generateForensicAffidavit({
  caseNumber: "ST-2026-90412",
  signWithHardwareKey: true
});
console.log("SHA-256 Proof:", courtPackage.sha256Proof);`
    },
    "native-c": {
      setup: `// CMakeLists.txt
find_package(SimTraceForensic REQUIRED)
target_link_libraries(mobile_telemetry_agent PRIVATE SimTrace::ForensicCore)`,
      init: `#include <simtrace/forensic.h>

int main(int argc, char** argv) {
    simtrace_config_t config = {
        .api_key = "st_live_98f4a27b1c8e0d9f3a5b7c1e",
        .baseband_dev = "/dev/ttyUSB0",
        .fips_mode = 1,
        .autolock_enabled = 1
    };
    
    if (simtrace_init(&config) == SIMTRACE_OK) {
        printf("SIMTRACE C/Baseband SDK initialized. State: ARMED\\n");
    }
    return 0;
}`,
      listeners: `static void on_sim_swap(const simtrace_event_t* evt) {
    printf("[SIMTRACE] Critical SIM Swap: IMSI %s -> %s\\n", evt->prev_imsi, evt->new_imsi);
    simtrace_dispatch_ceir_blacklist(evt);
}

int arm_listeners() {
    return simtrace_register_callback(SIMTRACE_EVT_SIM_SWAP, on_sim_swap);
}`,
      evidence: `simtrace_evidence_t evidence;
simtrace_generate_court_affidavit(&evidence, "ST-2026-90412");
printf("C-SDK Enclave Digest: %s\\n", evidence.sha256_hash);`
    }
  };

  const currentCode = codeSnippets[platform][activeTab];

  return (
    <div className="forensic-sdk-guide" style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: "4rem" }}>
      
      {/* ── Top Header / Operational Banner ───────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: 20,
          padding: "2rem",
          marginBottom: "2rem",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.25rem", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: 780 }}>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(168, 85, 247, 0.15)",
                  color: "#a855f7",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)"
                }}
              >
                <Code size={13} />
                FORENSIC SDK v2.8.4
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)"
                }}
              >
                <CheckCircle2 size={13} />
                FIPS 140-3 COMPLIANT
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)"
                }}
              >
                <Zap size={13} />
                LATENCY &lt; 10MS
              </span>
            </div>

            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                marginBottom: "0.75rem"
              }}
            >
              SIMTRACE™ Forensic Hardware SDK Integration Guide
            </h1>

            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
              Embed low-level baseband telemetry listeners, secure element hardware attestation, and court-admissible forensic evidence capture directly into mobile applications, OEM firmware, and telecom management agents.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minWidth: 220 }}>
            <Link
              href="/developer"
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: 12,
                fontSize: "0.88rem",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              <Key size={16} />
              Get Production API Key
            </Link>
            
            <button
              onClick={() => handleCopy("npm install @simtrace/react-native-forensic-sdk")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: copied ? "#10b981" : "#cbd5e1",
                padding: "0.65rem 1rem",
                borderRadius: 12,
                fontSize: "0.8rem",
                fontFamily: "var(--mono)",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied Package Name!" : "Copy NPM Package"}
            </button>
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Overhead</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>&lt; 0.2% CPU / 2.8MB</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Security</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>Hardware Enclave AES-256</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Detection</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>Sub-Second SIM Swap</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileCode size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--mono)", textTransform: "uppercase" }}>Evidence</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>SHA-256 Court Affidavits</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Firmware Binding Interactive Checklist ───────────────────────── */}
      <div className="card" style={{ marginBottom: "2rem", border: "1px solid rgba(56, 189, 248, 0.3)", background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={20} style={{ color: "var(--sky)" }} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                Mobile Firmware Binding Checklist
              </h2>
              <span style={{ fontSize: "0.72rem", background: "rgba(56, 189, 248, 0.15)", color: "var(--sky)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "2px 8px", borderRadius: 12, fontWeight: 700, fontFamily: "var(--mono)" }}>
                OEM FIRMWARE SPEC
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "4px 0 0 0" }}>
              Step-by-step verification protocol for binding baseband telemetry and secure enclave attestation into mobile devices and OEM images.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              onClick={runAutoDiagnostics}
              disabled={isRunningDiag}
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 0.95rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                borderRadius: 8
              }}
            >
              <Play size={14} className={isRunningDiag ? "animate-spin" : ""} />
              {isRunningDiag ? "Running Diagnostics..." : "Run Diagnostics & Verify All"}
            </button>

            <button
              onClick={resetChecklist}
              disabled={isRunningDiag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text2)",
                padding: "0.55rem 0.85rem",
                fontSize: "0.78rem",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>

        {/* Progress Bar Header */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "0.85rem 1rem", borderRadius: 10, marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: progressPercent === 100 ? "#10b981" : "var(--sky)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {progressPercent === 100 ? <CheckCircle2 size={16} /> : <Activity size={16} />}
              <span>{completedCount} of {FIRMWARE_STEPS.length} Steps Verified ({progressPercent}%)</span>
            </div>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)" }}>
              {progressPercent === 100 ? "FIRMWARE BOUND & ARMED" : "BINDING IN PROGRESS"}
            </span>
          </div>

          <div style={{ height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #38bdf8, #818cf8)",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>

        {/* Checklist Steps Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }} className="responsive-stack">
          {FIRMWARE_STEPS.map((step) => {
            const isChecked = !!firmwareChecklist[step.id];
            const isExpanded = expandedStep === step.id;

            return (
              <div
                key={step.id}
                style={{
                  background: isChecked ? "rgba(16, 185, 129, 0.05)" : "var(--bg)",
                  border: `1px solid ${isChecked ? "rgba(16, 185, 129, 0.3)" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "0.85rem",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <button
                    onClick={() => toggleStep(step.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: isChecked ? "#10b981" : "var(--muted)",
                      marginTop: 2
                    }}
                    title={isChecked ? "Mark incomplete" : "Mark complete"}
                  >
                    {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span
                        onClick={() => toggleStep(step.id)}
                        style={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: isChecked ? "#f8fafc" : "var(--text)",
                          cursor: "pointer",
                          textDecoration: isChecked ? "line-through" : "none",
                          opacity: isChecked ? 0.9 : 1
                        }}
                      >
                        {step.title}
                      </span>

                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          fontFamily: "var(--mono)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: step.category === "Kernel" ? "rgba(56, 189, 248, 0.15)" : step.category === "Enclave" ? "rgba(168, 85, 247, 0.15)" : step.category === "Baseband" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: step.category === "Kernel" ? "#38bdf8" : step.category === "Enclave" ? "#a855f7" : step.category === "Baseband" ? "#f59e0b" : "#10b981"
                        }}
                      >
                        {step.category}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 6px 0", lineHeight: 1.4 }}>
                      {step.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          color: "var(--sky)",
                          fontSize: "0.72rem",
                          fontFamily: "var(--mono)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        {isExpanded ? "Hide Code Hint ▲" : "View Code Hint ▼"}
                      </button>

                      {isChecked && (
                        <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                          <Check size={12} /> Verified
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <pre
                        style={{
                          marginTop: "0.5rem",
                          background: "#030712",
                          border: "1px solid #1e293b",
                          borderRadius: 6,
                          padding: "0.5rem",
                          fontFamily: "var(--mono)",
                          fontSize: "0.72rem",
                          color: "#38bdf8",
                          overflowX: "auto",
                          margin: "0.5rem 0 0 0"
                        }}
                      >
                        <code>{step.codeHint}</code>
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Grid: SDK Code Interactive Guide + Live Simulator ─────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="responsive-stack">
        
        {/* Left Column: Interactive Code Guide & Platform Chooser */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Terminal size={18} style={{ color: "var(--sky)" }} />
                Integration Code Walkthrough
              </h3>
              <span style={{ fontSize: "0.72rem", fontFamily: "var(--mono)", color: "var(--dim)", background: "var(--bg)", padding: "2px 8px", borderRadius: 6 }}>
                SIMTRACE CORE API
              </span>
            </div>

            {/* Platform Selector Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.4rem", marginBottom: "1.25rem" }}>
              {[
                { id: "android", label: "Android", icon: "🤖" },
                { id: "ios", label: "iOS Swift", icon: "🍏" },
                { id: "react-native", label: "React Native", icon: "⚛️" },
                { id: "native-c", label: "C / Baseband", icon: "⚙️" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    padding: "0.6rem 0.4rem",
                    borderRadius: 10,
                    border: `1px solid ${platform === p.id ? "var(--sky)" : "var(--border)"}`,
                    background: platform === p.id ? "rgba(56, 189, 248, 0.12)" : "var(--surface)",
                    color: platform === p.id ? "var(--sky)" : "var(--text2)",
                    fontWeight: platform === p.id ? 700 : 500,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Implementation Step Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
              {[
                { id: "setup", label: "1. Setup & Gradle" },
                { id: "init", label: "2. Bind Hardware" },
                { id: "listeners", label: "3. Event Handlers" },
                { id: "evidence", label: "4. Court Evidence" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "0.6rem 0.85rem",
                    borderBottom: activeTab === tab.id ? "2px solid var(--sky)" : "2px solid transparent",
                    background: "transparent",
                    color: activeTab === tab.id ? "var(--sky)" : "var(--muted)",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Snippet Container */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => handleCopy(currentCode)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid var(--border)",
                  color: copied ? "#10b981" : "#cbd5e1",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer"
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>

              <pre
                style={{
                  background: "#030712",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  padding: "1rem",
                  fontFamily: "var(--mono)",
                  fontSize: "0.82rem",
                  color: "#38bdf8",
                  overflowX: "auto",
                  lineHeight: 1.5,
                  minHeight: 280,
                  margin: 0
                }}
              >
                <code>{currentCode}</code>
              </pre>
            </div>

            <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--muted)" }}>
              <span style={{ color: "var(--amber)", fontWeight: 700 }}>💡 Pro-Tip:</span> Hardware DNA signatures are generated using zero-knowledge hashes derived from IMEI1, IMEI2, e-SIM EID, and Secure Enclave public keys. Raw PII is never exposed to the cloud network.
            </div>
          </div>

          {/* Forensic Capabilities Cards */}
          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--emerald)" }} />
              Key Security Capabilities Enforced by SDK
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--sky)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Radio size={14} /> Sub-Second SIM Swap
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                  Baseband state monitor detects physical SIM eject or eSIM profile swap in under 200 milliseconds.
                </p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--indigo)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Lock size={14} /> Hardware Enclave Lock
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                  Enforces device hardware lockout requiring biometric or carrier secret key to bypass.
                </p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--rose)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldAlert size={14} /> Anti-Cloning DNA
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                  Multi-factor hardware parameter fingerprinting prevents IMEI spoofing and baseband replication.
                </p>
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "0.85rem", borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--amber)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <FileCode size={14} /> Court Evidence Vault
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                  Generates cryptographic SHA-256 signed evidence packages with cell tower TDOA & GPS logs.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive SDK Simulator & Telemetry Console */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="card" style={{ borderColor: "rgba(168, 85, 247, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "#f8fafc" }}>
                  <Activity size={18} style={{ color: "#a855f7" }} />
                  Interactive Forensic Telemetry Console
                </h3>
                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                  Test real-time baseband triggers & telemetry event dispatches
                </div>
              </div>

              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "2px 8px", borderRadius: 12, fontSize: "0.72rem", fontFamily: "var(--mono)", fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                SANDBOX ACTIVE
              </span>
            </div>

            {/* Config Toggles */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--sky)", fontFamily: "var(--mono)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
                SDK Runtime Policies
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={simConfig.autoLockOnSimSwap}
                    onChange={e => setSimConfig(p => ({ ...p, autoLockOnSimSwap: e.target.checked }))}
                  />
                  Auto-Lock on SIM Swap
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={simConfig.silentSnapshot}
                    onChange={e => setSimConfig(p => ({ ...p, silentSnapshot: e.target.checked }))}
                  />
                  Silent Camera Evidence
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={simConfig.biometricChallenge}
                    onChange={e => setSimConfig(p => ({ ...p, biometricChallenge: e.target.checked }))}
                  />
                  Require Biometric Challenge
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--text2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={simConfig.ceirBlacklistRelay}
                    onChange={e => setSimConfig(p => ({ ...p, ceirBlacklistRelay: e.target.checked }))}
                  />
                  Relay to National CEIR
                </label>
              </div>
            </div>

            {/* Trigger Simulation Event Buttons */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>
                Simulate Baseband & Security Triggers:
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  onClick={() => triggerSimEvent("sim_swap")}
                  disabled={activeSimEvent !== null}
                  style={{
                    padding: "0.65rem",
                    borderRadius: 8,
                    border: "1px solid rgba(244, 63, 94, 0.4)",
                    background: "rgba(244, 63, 94, 0.12)",
                    color: "#f43f5e",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  <Radio size={14} />
                  Simulate SIM Swap
                </button>

                <button
                  onClick={() => triggerSimEvent("tamper")}
                  disabled={activeSimEvent !== null}
                  style={{
                    padding: "0.65rem",
                    borderRadius: 8,
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    background: "rgba(245, 158, 11, 0.12)",
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  <Cpu size={14} />
                  Hardware Tamper
                </button>

                <button
                  onClick={() => triggerSimEvent("ss7_anomaly")}
                  disabled={activeSimEvent !== null}
                  style={{
                    padding: "0.65rem",
                    borderRadius: 8,
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    background: "rgba(99, 102, 241, 0.12)",
                    color: "#818cf8",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  <Server size={14} />
                  SS7 Network Intrusion
                </button>

                <button
                  onClick={() => triggerSimEvent("evidence_snap")}
                  disabled={activeSimEvent !== null}
                  style={{
                    padding: "0.65rem",
                    borderRadius: 8,
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer"
                  }}
                >
                  <Sparkles size={14} />
                  Package Evidence
                </button>
              </div>
            </div>

            {/* Live Terminal Log Stream */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--mono)", color: "var(--muted)", fontWeight: 700 }}>
                  TELEMETRY EVENT STREAM
                </span>
                <button
                  onClick={() => setSimLogs([])}
                  style={{ background: "transparent", border: "none", color: "var(--dim)", fontSize: "0.72rem", cursor: "pointer" }}
                >
                  Clear Terminal
                </button>
              </div>

              <div
                style={{
                  background: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                  padding: "0.85rem",
                  fontFamily: "var(--mono)",
                  fontSize: "0.75rem",
                  height: 320,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                {simLogs.map((log) => {
                  const logColor = log.type === "danger" ? "#f43f5e" : log.type === "warn" ? "#f59e0b" : log.type === "success" ? "#10b981" : "#38bdf8";
                  return (
                    <div key={log.id} style={{ borderLeft: `2px solid ${logColor}`, paddingLeft: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 2 }}>
                        <span style={{ color: "var(--dim)", fontSize: "0.7rem" }}>[{log.time}]</span>
                        <span style={{ color: logColor, fontWeight: 700 }}>{log.event}</span>
                      </div>
                      <pre style={{ margin: 0, color: "#94a3b8", fontSize: "0.72rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {log.payload}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Quick Download Links & API Docs */}
          <div className="card" style={{ background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={16} style={{ color: "var(--sky)" }} />
              Developer Downloads & Resources
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <a
                href="/developer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text2)",
                  textDecoration: "none",
                  fontSize: "0.82rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileCode size={15} style={{ color: "var(--sky)" }} />
                  <span>SIMTRACE Android AAR Package (v2.8.4)</span>
                </div>
                <span style={{ color: "var(--sky)", fontWeight: 600 }}>1.4 MB →</span>
              </a>

              <a
                href="/developer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text2)",
                  textDecoration: "none",
                  fontSize: "0.82rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileCode size={15} style={{ color: "var(--a855f7)" }} />
                  <span>SIMTRACE iOS Swift XCFramework</span>
                </div>
                <span style={{ color: "var(--a855f7)", fontWeight: 600 }}>2.1 MB →</span>
              </a>

              <a
                href="/docs"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text2)",
                  textDecoration: "none",
                  fontSize: "0.82rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Terminal size={15} style={{ color: "var(--emerald)" }} />
                  <span>Full API Reference & Webhook Specs</span>
                </div>
                <span style={{ color: "var(--emerald)", fontWeight: 600 }}>View Docs →</span>
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
