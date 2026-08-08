"use client";

import React, { useState } from "react";
import {
  Sliders,
  Palette,
  Megaphone,
  Type,
  Layers,
  Activity,
  Navigation,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ShieldCheck,
  Globe,
  Radio,
  FileCode,
  Save
} from "lucide-react";
import { useSiteConfig } from "../SiteConfigContext";
import { NavItemConfig, SectionConfig } from "../../lib/siteConfigStore";

export default function AdminRedesignStudio() {
  const { config, updateConfig, resetConfig, exportConfigJson, importConfigJson } = useSiteConfig();
  const [studioTab, setStudioTab] = useState<"branding" | "banner" | "hero" | "layout" | "telemetry" | "navigation" | "json">("branding");
  const [saveToast, setSaveToast] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");

  // New Nav item state
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavRoute, setNewNavRoute] = useState("");
  const [newNavBadge, setNewNavBadge] = useState("");

  function triggerSaveFeedback() {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  }

  // Section Order handlers
  function moveSection(index: number, direction: "up" | "down") {
    const sections = [...config.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    // Recalculate orders
    const reordered = sections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    updateConfig({ sections: reordered });
    triggerSaveFeedback();
  }

  function toggleSectionEnabled(id: string) {
    const updated = config.sections.map((sec) =>
      sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
    );
    updateConfig({ sections: updated });
    triggerSaveFeedback();
  }

  // Nav Item Handlers
  function toggleNavVisible(id: string) {
    const updated = config.navigation.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    updateConfig({ navigation: updated });
    triggerSaveFeedback();
  }

  function deleteNavItem(id: string) {
    const updated = config.navigation.filter((item) => item.id !== id);
    updateConfig({ navigation: updated });
    triggerSaveFeedback();
  }

  function addNavItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newNavLabel || !newNavRoute) return;
    const newItem: NavItemConfig = {
      id: `nav-${Date.now()}`,
      label: newNavLabel,
      route: newNavRoute,
      badge: newNavBadge || undefined,
      visible: true,
      order: config.navigation.length + 1,
    };
    updateConfig({ navigation: [...config.navigation, newItem] });
    setNewNavLabel("");
    setNewNavRoute("");
    setNewNavBadge("");
    triggerSaveFeedback();
  }

  function handleImportJson() {
    if (!jsonInput) return;
    const success = importConfigJson(jsonInput);
    if (success) {
      setJsonError("");
      triggerSaveFeedback();
    } else {
      setJsonError("Invalid JSON structure. Please check the format.");
    }
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> ABSOLUTE ADMIN CONTROL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Site Redesign & Dynamic CMS Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Customize branding, text copy, homepage section layout, live telemetry numbers, navigation, and theme colors in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm("Reset site design and layout back to factory defaults?")) {
                resetConfig();
                triggerSaveFeedback();
              }
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Factory Reset
          </button>
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between font-mono text-xs font-bold shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>CHANGES SAVED LIVE — Applied across the entire SIMTRACE network!</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">SYNCED</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs font-mono font-bold">
        <button
          onClick={() => setStudioTab("branding")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "branding"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Palette className="w-4 h-4" /> Branding & Theme
        </button>

        <button
          onClick={() => setStudioTab("banner")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "banner"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4" /> Announcement Banner
        </button>

        <button
          onClick={() => setStudioTab("hero")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "hero"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Type className="w-4 h-4" /> Hero Copywriting
        </button>

        <button
          onClick={() => setStudioTab("layout")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "layout"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" /> Section Layout & Order
        </button>

        <button
          onClick={() => setStudioTab("telemetry")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "telemetry"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" /> Telemetry Controls
        </button>

        <button
          onClick={() => setStudioTab("navigation")}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "navigation"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Navigation className="w-4 h-4" /> Navigation Links
        </button>

        <button
          onClick={() => {
            setStudioTab("json");
            setJsonInput(exportConfigJson());
          }}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
            studioTab === "json"
              ? "bg-[#2563EB] text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileCode className="w-4 h-4" /> JSON Preset
        </button>
      </div>

      {/* TAB 1: BRANDING & THEME */}
      {studioTab === "branding" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Brand Platform Name
              </label>
              <input
                type="text"
                value={config.brandName}
                onChange={(e) => updateConfig({ brandName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Tagline & Subtitle
              </label>
              <input
                type="text"
                value={config.tagline}
                onChange={(e) => updateConfig({ tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                System Version Code
              </label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => updateConfig({ version: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Footer Tagline
              </label>
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => updateConfig({ footerText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              Copyright Notice Text
            </label>
            <input
              type="text"
              value={config.copyrightText}
              onChange={(e) => updateConfig({ copyrightText: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={triggerSaveFeedback}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" /> Save Branding Changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENT BANNER */}
      {studioTab === "banner" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <div className="font-bold text-slate-900 text-sm">Global Top Announcement Banner</div>
              <div className="text-xs text-slate-500">Show a urgent broadcast banner at the top of the homepage</div>
            </div>
            <button
              onClick={() => {
                updateConfig({ bannerEnabled: !config.bannerEnabled });
                triggerSaveFeedback();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                config.bannerEnabled
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {config.bannerEnabled ? "BANNER ENABLED" : "BANNER DISABLED"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              Announcement Message
            </label>
            <input
              type="text"
              value={config.bannerMessage}
              onChange={(e) => updateConfig({ bannerMessage: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              Banner Alert Severity
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["info", "warning", "critical", "success"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    updateConfig({ bannerType: type });
                    triggerSaveFeedback();
                  }}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold uppercase transition ${
                    config.bannerType === type
                      ? "bg-[#2563EB] text-white border-blue-600 shadow-md"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={triggerSaveFeedback}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" /> Save Banner Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: HERO COPYWRITING */}
      {studioTab === "hero" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Hero Headline (Line 1 - Primary)
              </label>
              <input
                type="text"
                value={config.heroHeadingLine1}
                onChange={(e) => updateConfig({ heroHeadingLine1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Hero Headline (Line 2 - Gradient Accent)
              </label>
              <input
                type="text"
                value={config.heroHeadingLine2}
                onChange={(e) => updateConfig({ heroHeadingLine2: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              Hero Paragraph / Supporting Subtext
            </label>
            <textarea
              rows={3}
              value={config.heroSubtext}
              onChange={(e) => updateConfig({ heroSubtext: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Primary Button Label
              </label>
              <input
                type="text"
                value={config.primaryCtaText}
                onChange={(e) => updateConfig({ primaryCtaText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Secondary Button Label
              </label>
              <input
                type="text"
                value={config.secondaryCtaText}
                onChange={(e) => updateConfig({ secondaryCtaText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Tertiary Button Label
              </label>
              <input
                type="text"
                value={config.tertiaryCtaText}
                onChange={(e) => updateConfig({ tertiaryCtaText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={triggerSaveFeedback}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" /> Save Hero Text
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LAYOUT & SECTION ORDER */}
      {studioTab === "layout" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-mono">
            Enable, disable or re-order homepage sections. Changes apply live immediately!
          </p>

          <div className="space-y-3">
            {config.sections.map((section, idx) => (
              <div
                key={section.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs hover:border-blue-400 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{section.name}</div>
                    <div className="text-[10px] text-slate-400">ID: {section.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveSection(idx, "up")}
                    disabled={idx === 0}
                    className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveSection(idx, "down")}
                    disabled={idx === config.sections.length - 1}
                    className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 text-slate-700"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleSectionEnabled(section.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                      section.enabled
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-200 text-slate-500 border border-slate-300"
                    }`}
                  >
                    {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{section.enabled ? "VISIBLE" : "HIDDEN"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TELEMETRY & LIVE DATA */}
      {studioTab === "telemetry" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Protected Device Count
              </label>
              <input
                type="text"
                value={config.telemetry.protectedDevices}
                onChange={(e) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, protectedDevices: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Active Encrypted Vaults
              </label>
              <input
                type="text"
                value={config.telemetry.activeProtection}
                onChange={(e) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, activeProtection: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Open Incidents Count
              </label>
              <input
                type="number"
                value={config.telemetry.openIncidents}
                onChange={(e) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, openIncidents: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Active Recovery Cases
              </label>
              <input
                type="number"
                value={config.telemetry.recoveryCases}
                onChange={(e) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, recoveryCases: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Network Partners Count
              </label>
              <input
                type="number"
                value={config.telemetry.networkPartners}
                onChange={(e) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, networkPartners: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Global Network Status
              </label>
              <select
                value={config.telemetry.status}
                onChange={(e: any) =>
                  updateConfig({
                    telemetry: { ...config.telemetry, status: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={triggerSaveFeedback}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" /> Save Telemetry Numbers
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: NAVIGATION LINKS */}
      {studioTab === "navigation" && (
        <div className="space-y-6">
          {/* List existing nav items */}
          <div className="space-y-3 font-mono text-xs">
            {config.navigation.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{item.label}</span>
                  <span className="text-slate-400 text-[11px]">{item.route}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleNavVisible(item.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      item.visible
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {item.visible ? "VISIBLE" : "HIDDEN"}
                  </button>

                  <button
                    onClick={() => deleteNavItem(item.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                    title="Delete Link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Navigation Link Form */}
          <form onSubmit={addNavItem} className="p-4 bg-slate-100 rounded-2xl space-y-4">
            <div className="font-mono font-bold text-xs text-slate-800">ADD NEW NAVIGATION LINK</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Link Label (e.g. Analytics)"
                value={newNavLabel}
                onChange={(e) => setNewNavLabel(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
              <input
                type="text"
                placeholder="Route Path (e.g. /telecom-analytics)"
                value={newNavRoute}
                onChange={(e) => setNewNavRoute(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
              <input
                type="text"
                placeholder="Optional Badge (e.g. NEW)"
                value={newNavBadge}
                onChange={(e) => setNewNavBadge(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563EB] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Link
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: JSON PRESET EXPORT / IMPORT */}
      {studioTab === "json" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-slate-700 uppercase">
              Full Site Design JSON Configuration
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(exportConfigJson());
                triggerSaveFeedback();
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold rounded-lg transition"
            >
              Copy JSON to Clipboard
            </button>
          </div>

          <textarea
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />

          {jsonError && (
            <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-mono">
              {jsonError}
            </div>
          )}

          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              onClick={handleImportJson}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Upload className="w-4 h-4" /> Apply & Import JSON Design
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
