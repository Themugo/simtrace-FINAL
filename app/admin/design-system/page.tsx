"use client";

import React, { useState } from "react";
import {
  Palette,
  Layers,
  Sliders,
  CheckCircle2,
  Sparkles,
  Search,
  Shield,
  Smartphone,
  Radio,
  Building2,
  Database,
  BarChart3,
  Flame,
  Key,
  Bell,
  Code,
  Terminal,
  MousePointer,
  Maximize2,
  Zap,
} from "lucide-react";
import { MODULE_THEMES, SimTraceModule, DESIGN_TOKENS } from "../../../lib/design-tokens";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Select,
  Textarea,
  SearchInput,
  PasswordInput,
  DropzoneInput,
  Table,
  Badge,
  Alert,
  Tabs,
  TabPanel,
  MetricCard,
  DashboardGrid,
  DashboardHeader,
  ChartCard,
  Modal,
  ToastProvider,
  useToast,
  Timeline,
  EmptyState,
  Skeleton,
} from "../../../components/ui";

function DesignSystemShowcaseContent() {
  const { showToast } = useToast();
  const [selectedModule, setSelectedModule] = useState<SimTraceModule>("device-dna");
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<"sm" | "md" | "lg" | "xl">("md");

  const moduleList = Object.values(MODULE_THEMES);

  // Table Sample Data
  const tableData = [
    { id: "DEV-8821", name: "iPhone 15 Pro Max", owner: "Safaricom Enterprise", status: "VERIFIED", riskScore: 12, region: "Nairobi CBD" },
    { id: "DEV-8822", name: "Samsung Galaxy S24 Ultra", owner: "Equity Bank Fleet", status: "FLAGGED", riskScore: 84, region: "Mombasa Port" },
    { id: "DEV-8823", name: "Google Pixel 8 Pro", owner: "KRA Investigation Unit", status: "RESTRICTED", riskScore: 92, region: "Kisumu West" },
    { id: "DEV-8824", name: "iPad Pro M3 13-inch", owner: "Airtel Logistics", status: "VERIFIED", riskScore: 5, region: "Eldoret Hub" },
    { id: "DEV-8825", name: "OnePlus 12", owner: "NCBA Field Assets", status: "SUSPENDED", riskScore: 78, region: "Nakuru East" },
  ];

  const tableColumns = [
    { key: "id", header: "Device ID", cell: (row: any) => <span className="font-mono font-bold text-cyan-300">{row.id}</span>, sortable: true },
    { key: "name", header: "Device Hardware", cell: (row: any) => <span className="font-semibold text-white">{row.name}</span>, sortable: true },
    { key: "owner", header: "Registered Owner", cell: (row: any) => <span className="text-slate-300">{row.owner}</span> },
    {
      key: "status",
      header: "Status",
      cell: (row: any) => (
        <Badge variant={row.status === "VERIFIED" ? "ok" : row.status === "FLAGGED" ? "danger" : "warn"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "riskScore",
      header: "Risk Score",
      cell: (row: any) => (
        <span className={`font-mono font-bold ${row.riskScore > 50 ? "text-rose-400" : "text-emerald-400"}`}>
          {row.riskScore}/100
        </span>
      ),
      sortable: true,
      align: "right" as const,
    },
  ];

  // Timeline Sample Data
  const timelineData = [
    {
      id: "TL-01",
      title: "Device Registration & DNA Fingerprint Hashed",
      timestamp: "2026-08-06 09:12 UTC",
      description: "Cryptographic hardware identity bound to SIMTRACE™ Blockchain Ledger.",
      status: "completed" as const,
      actor: "Operator #049",
      badge: "DNA REGISTERED",
      module: "device-dna" as const,
    },
    {
      id: "TL-02",
      title: "Carrier Network Tower Handover Detected",
      timestamp: "2026-08-06 10:45 UTC",
      description: "Safaricom Tower CBD-01 telemetry match confirmed with 98.4% confidence.",
      status: "completed" as const,
      actor: "Safaricom API",
      badge: "TELEMETRY",
      module: "operations" as const,
    },
    {
      id: "TL-03",
      title: "Geofence Breach Triggered",
      timestamp: "2026-08-06 11:30 UTC",
      description: "Device crossed active Central Bank Security Zone perimeter without authorization.",
      status: "alert" as const,
      actor: "Guardian AI Engine",
      badge: "BREACH ALERT",
      module: "guardian" as const,
    },
    {
      id: "TL-04",
      title: "Police Law Enforcement Warrant Issued",
      timestamp: "2026-08-06 12:00 UTC",
      description: "Remote IMEI Lock command placed on active queue pending network propagation.",
      status: "active" as const,
      actor: "Inspector Omwamba",
      badge: "WARRANT ACTIVE",
      module: "police" as const,
    },
  ];

  // Chart Sample Data
  const chartData = [
    { label: "00:00", value: 42 },
    { label: "04:00", value: 18 },
    { label: "08:00", value: 85 },
    { label: "12:00", value: 120 },
    { label: "16:00", value: 95 },
    { label: "20:00", value: 60 },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <DashboardHeader
        title="SIMTRACE™ Enterprise Design System"
        subtitle="Universal component architecture combining Stripe precision, Apple translucency, Notion structural hierarchy, and Linear keyboard density."
        badgeText="v3.4 PRODUCTION SYSTEM"
        module={selectedModule}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
              onClick={() =>
                showToast({
                  title: "Design System Ready",
                  message: "All 14 design component variants loaded into current runtime context.",
                  variant: "module",
                  module: selectedModule,
                })
              }
            >
              Test Toast Notification
            </Button>
            <Button
              variant="module"
              module={selectedModule}
              size="sm"
              leftIcon={<Maximize2 className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Modal Preview
            </Button>
          </div>
        }
      />

      {/* Module Color Switcher Bar */}
      <Card variant="glass" className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <h2 className="font-bold text-white text-xs flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" /> Platform Module Primary Color Tokens
          </h2>
          <span className="font-mono text-[10px] text-slate-400">10 Module Palettes Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {moduleList.map((m) => {
            const isSelected = selectedModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 border-white shadow-xl scale-[1.03]"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.primaryHex }} />
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="mt-2 text-[10px] font-bold text-white capitalize truncate">{m.id}</div>
                <div className="font-mono text-[9px] text-slate-400">{m.primaryHex}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Tabs
        module={selectedModule}
        variant="pills"
        activeTabId={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "overview", label: "Design Tokens & Palettes", icon: <Palette className="w-4 h-4" /> },
          { id: "buttons", label: "Buttons & Badges", icon: <Zap className="w-4 h-4" /> },
          { id: "forms", label: "Inputs & Forms", icon: <Sliders className="w-4 h-4" /> },
          { id: "cards", label: "Cards & Modals", icon: <Layers className="w-4 h-4" /> },
          { id: "data", label: "Tables & Graphs", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "feedback", label: "Alerts, Toasts & Skeletons", icon: <Bell className="w-4 h-4" /> },
        ]}
      />

      {/* TAB 1: DESIGN TOKENS */}
      <TabPanel tabId="overview" activeTabId={activeTab}>
        <div className="space-y-6">
          <DashboardGrid cols={3}>
            <Card variant="module" module={selectedModule}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sky-400" /> Current Module Token
                </CardTitle>
                <CardDescription>
                  {MODULE_THEMES[selectedModule].name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">Primary Hex:</span>
                  <span className="font-bold" style={{ color: MODULE_THEMES[selectedModule].primaryHex }}>
                    {MODULE_THEMES[selectedModule].primaryHex}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">Glow Token:</span>
                  <span className="text-slate-200 text-[10px] truncate max-w-[150px]">
                    {MODULE_THEMES[selectedModule].bgGlow}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" /> Typography Scale
                </CardTitle>
                <CardDescription>Inter Sans & JetBrains Mono scale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 font-sans">
                <div className="text-xs text-slate-400">
                  xs (12px) | sm (13.6px) | base (15.2px) | lg (20px) | xl (24px)
                </div>
                <div className="font-mono text-[11px] text-cyan-300">
                  const fontMono = &apos;JetBrains Mono&apos;
                </div>
              </CardContent>
            </Card>

            <Card variant="surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Radii & Shadows
                </CardTitle>
                <CardDescription>Apple rounded radii + Linear elevation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 text-[10px] font-mono text-slate-300">
                  <span className="p-1 bg-slate-800 rounded">sm (6px)</span>
                  <span className="p-1 bg-slate-800 rounded-md">md (10px)</span>
                  <span className="p-1 bg-slate-800 rounded-lg">lg (14px)</span>
                  <span className="p-1 bg-slate-800 rounded-2xl">xl (20px)</span>
                </div>
              </CardContent>
            </Card>
          </DashboardGrid>

          {/* Module Colors Matrix */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>All Module Color Assignments</CardTitle>
              <CardDescription>
                Every core feature domain of SIMTRACE™ maintains an isolated primary color identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {moduleList.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full shadow" style={{ backgroundColor: m.primaryHex }} />
                      <div>
                        <div className="font-bold text-xs text-white capitalize">{m.id}</div>
                        <div className="text-[10px] text-slate-400">{m.name}</div>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                      style={{ backgroundColor: m.badgeBg, color: m.primaryHex }}
                    >
                      {m.primaryHex}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* TAB 2: BUTTONS & BADGES */}
      <TabPanel tabId="buttons" activeTabId={activeTab}>
        <div className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Button Component Variants</CardTitle>
              <CardDescription>
                Supports sizes (xs to xl), loading spinners, keyboard shortcuts (Linear style), and module color bindings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variant Rows */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400">Variants:</div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Gradient</Button>
                  <Button variant="secondary">Secondary Dark</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="glass">Glass Translucent</Button>
                  <Button variant="module" module={selectedModule}>
                    Module Primary ({selectedModule})
                  </Button>
                </div>
              </div>

              {/* Sizes Row */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="text-xs font-mono text-slate-400">Button Sizes:</div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs" variant="secondary">
                    Extra Small (xs)
                  </Button>
                  <Button size="sm" variant="secondary">
                    Small (sm)
                  </Button>
                  <Button size="md" variant="secondary">
                    Medium (md)
                  </Button>
                  <Button size="lg" variant="secondary">
                    Large (lg)
                  </Button>
                  <Button size="xl" variant="secondary">
                    Extra Large (xl)
                  </Button>
                </div>
              </div>

              {/* Functional States Row */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="text-xs font-mono text-slate-400">Functional Features:</div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button isLoading variant="primary">
                    Saving Ledger
                  </Button>
                  <Button shortcut="⌘K" leftIcon={<Search className="w-4 h-4" />}>
                    Search Console
                  </Button>
                  <Button rightIcon={<Zap className="w-4 h-4" />} variant="success">
                    Deploy Lock
                  </Button>
                  <Button disabled variant="outline">
                    Disabled State
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Badge Component Variants</CardTitle>
              <CardDescription>Status indicators, risk levels, and module tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="ok">SYSTEM ONLINE</Badge>
                <Badge variant="danger">SECURITY BREACH</Badge>
                <Badge variant="warn">DEGRADED TOWER</Badge>
                <Badge variant="info">GEOLOCATION ACTIVE</Badge>
                <Badge variant="indigo">POLICE WARRANT</Badge>
                <Badge variant="purple">EXECUTIVE REPORT</Badge>
                <Badge variant="neutral">ARCHIVED</Badge>
                <Badge variant="outline font-mono">EPSG:4326</Badge>
                <Badge variant="dot">LIVE STREAM</Badge>
                <Badge variant="module" module={selectedModule}>
                  {selectedModule.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <Badge size="xs" variant="ok">
                  xs size
                </Badge>
                <Badge size="sm" variant="ok">
                  sm size
                </Badge>
                <Badge size="md" variant="ok">
                  md size
                </Badge>
                <Badge size="lg" variant="ok">
                  lg size
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* TAB 3: INPUTS & FORMS */}
      <TabPanel tabId="forms" activeTabId={activeTab}>
        <Card variant="default">
          <CardHeader>
            <CardTitle>Form Control Components</CardTitle>
            <CardDescription>Text inputs, selects, textareas, search shortcuts, and drag-and-drop file upload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Device Serial Number" placeholder="e.g. SN-KE-2026-9012" leftIcon={<Key className="w-4 h-4" />} />
              <PasswordInput label="Administrator Master Key" placeholder="Enter security passphrase" />
              <Select
                label="Primary Regional Network Operator"
                options={[
                  { value: "safaricom", label: "Safaricom PLC (M-Pesa SCP)" },
                  { value: "airtel", label: "Airtel Networks Kenya" },
                  { value: "telkom", label: "Telkom Kenya Telecommunications" },
                ]}
              />
              <SearchInput label="Universal Global Search" />
            </div>

            <Textarea
              label="Forensic Investigation Case Summary"
              placeholder="Record detailed field operational notes and telemetry observations..."
              helperText="Encrypted with AES-256 before committing to ledger."
            />

            <DropzoneInput
              label="Upload Hardware Firmware Binary or PDF Evidence"
              onFileDrop={(files) =>
                showToast({
                  title: "File Received",
                  message: `${files.length} file(s) staged for cryptographic validation.`,
                  variant: "success",
                })
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* TAB 4: CARDS & MODALS */}
      <TabPanel tabId="cards" activeTabId={activeTab}>
        <div className="space-y-6">
          <DashboardGrid cols={3}>
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Surface Card</CardTitle>
                <CardDescription>Standard slate container for operational forms and detail lists.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-300">
                Standard background color with 1px border.
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-sky-300">Glass Translucent Card</CardTitle>
                <CardDescription>Apple-inspired backdrop-blur element for overlay panels.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-300">
                Backdrop filter blur with soft inner border highlights.
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle className="text-emerald-300">Interactive Hover Card</CardTitle>
                <CardDescription>Linear-style hover elevation and border transition.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-300">
                Hover cursor feedback with subtle -2px translate effect.
              </CardContent>
            </Card>
          </DashboardGrid>

          {/* Modal Demo Button */}
          <Card variant="surface" className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Modal Dialog System</h3>
              <p className="text-xs text-slate-400">Esc key dismissable with Apple blur backdrop and scroll locking.</p>
            </div>
            <div className="flex items-center gap-2">
              {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                <Button
                  key={sz}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setModalSize(sz);
                    setIsModalOpen(true);
                  }}
                >
                  Open {sz.toUpperCase()}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </TabPanel>

      {/* TAB 5: TABLES & GRAPHS */}
      <TabPanel tabId="data" activeTabId={activeTab}>
        <div className="space-y-6">
          {/* Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm">Enterprise Data Grid Table</h3>
            <Table
              data={tableData}
              columns={tableColumns}
              keyExtractor={(item) => item.id}
              pageSize={3}
              onRowClick={(item) =>
                showToast({
                  title: `Selected ${item.id}`,
                  message: `${item.name} (${item.owner})`,
                  variant: "info",
                })
              }
            />
          </div>

          {/* Graphs */}
          <DashboardGrid cols={2}>
            <ChartCard
              title="Real-Time Telemetry Event Ingestion"
              subtitle="Location events logged per 4-hour window"
              data={chartData}
              type="area"
              module={selectedModule}
            />
            <ChartCard
              title="Geofence Perimeter Breaches"
              subtitle="Daily count across active monitoring sectors"
              data={chartData}
              type="bar"
              module="guardian"
            />
          </DashboardGrid>

          {/* Metric Cards */}
          <DashboardGrid cols={4}>
            <MetricCard
              title="Active Tracked Devices"
              value="14,892"
              change="+12.4%"
              changeType="positive"
              description="vs prior 24h"
              module="device-dna"
              icon={<Smartphone className="w-5 h-5" />}
            />
            <MetricCard
              title="Carrier Network Masts"
              value="1,204"
              change="0.0%"
              changeType="neutral"
              description="100% operational"
              module="operations"
              icon={<Radio className="w-5 h-5" />}
            />
            <MetricCard
              title="Police Recovery Warrants"
              value="84"
              change="-4.2%"
              changeType="negative"
              description="Resolved cases"
              module="police"
              icon={<Shield className="w-5 h-5" />}
            />
            <MetricCard
              title="M-Pesa SCP Clearances"
              value="KES 4.2M"
              change="+18.9%"
              changeType="positive"
              description="Daily transaction flow"
              module="financial"
              icon={<Building2 className="w-5 h-5" />}
            />
          </DashboardGrid>
        </div>
      </TabPanel>

      {/* TAB 6: FEEDBACK & UTILITIES */}
      <TabPanel tabId="feedback" activeTabId={activeTab}>
        <div className="space-y-6">
          {/* Alerts */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Alert Notification Banners</CardTitle>
              <CardDescription>Inline feedback components for system statuses and errors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert
                variant="info"
                title="System Information"
                description="SIMTRACE™ Blockchain node synchronization running on primary cluster KE-01."
              />
              <Alert
                variant="success"
                title="Cryptographic Hardware Lock Confirmed"
                description="Remote kill-switch signal confirmed by Safaricom Tower NRB-01."
              />
              <Alert
                variant="warning"
                title="Geofence High-Risk Warning"
                description="Target entity entity-089 crossed airport boundary perimeter."
              />
              <Alert
                variant="error"
                title="API Authentication Failure"
                description="Invalid HMAC signature provided in X-SIMTRACE-AUTH header."
                onDismiss={() => {}}
              />
              <Alert
                variant="module"
                module={selectedModule}
                title={`${MODULE_THEMES[selectedModule].name} Active`}
                description="Dynamic module accent style applied automatically based on selected domain token."
              />
            </CardContent>
          </Card>

          {/* Timelines */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Forensic Event Timeline</CardTitle>
              <CardDescription>Vertical event history for audit logs and investigation tracks.</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline items={timelineData} />
            </CardContent>
          </Card>

          {/* Empty State */}
          <EmptyState
            title="No Active Investigations Found"
            description="All active cases in Nairobi Metropolitan Sector are currently cleared."
            tags={["CASE-KE-2026", "GEOFENCE-BREACH", "IMEI-LOCK"]}
            onTagClick={(tag) =>
              showToast({ title: "Tag Filter", message: `Filtering by #${tag}`, variant: "info" })
            }
            primaryAction={<Button size="sm">Create New Case</Button>}
          />

          {/* Skeleton Loaders */}
          <Card variant="default">
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
              <CardDescription>Shimmer placeholders for asynchronous data fetching states.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton variant="card" />
              <Skeleton variant="table" count={3} />
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`SIMTRACE™ Design System Modal (${modalSize.toUpperCase()})`}
        description="Encapsulated dialog with backdrop blur and custom module primary border."
        module={selectedModule}
        size={modalSize}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="module"
              module={selectedModule}
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                showToast({
                  title: "Action Saved",
                  message: "Modal confirmation successfully submitted.",
                  variant: "success",
                });
              }}
            >
              Confirm Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>
            This modal component adheres strictly to SIMTRACE™ design tokens. It locks background body scrolling and responds dynamically to the ESC key.
          </p>
          <Input label="Modal Input Example" placeholder="Type something..." />
        </div>
      </Modal>
    </div>
  );
}

export default function DesignSystemShowcasePage() {
  return (
    <ToastProvider>
      <DesignSystemShowcaseContent />
    </ToastProvider>
  );
}
