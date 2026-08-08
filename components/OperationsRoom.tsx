"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  ShieldCheck,
  ShieldAlert,
  Radio,
  MapPin,
  Building2,
  Users,
  Sparkles,
  Sliders,
  Landmark,
  Code,
  Grid,
  BarChart2,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Sun,
  ChevronDown,
  Download,
  Plus,
  Minus,
  Maximize2,
  Headset,
  MessageSquare,
  CheckCircle2,
  Folder,
  Lock,
  Camera,
  TrendingUp,
  Activity,
  Phone,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Check,
  X,
  Play,
  RotateCcw,
  Zap
} from "lucide-react";
import SimTraceLogo from "./SimTraceLogo";

export default function OperationsRoom() {
  // State for interactive popups & live updates
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [allAlertsFilter, setAllAlertsFilter] = useState("All Alerts");
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("10:24:28 AM");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello Purity! Welcome to SIMTRACE Operations Support. How can we assist you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState("Home");
  const [mapZoom, setMapZoom] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: `Support Agent assigned: "All systems operational. Request regarding '${userMsg}' logged in SIMTRACE Dispatch Ticket #ST-${Math.floor(
            10000 + Math.random() * 90000
          )}."`
        }
      ]);
    }, 1000);
  };

  const navItems = [
    { name: "Command Center", icon: Home, href: "/dashboard" },
    { name: "IMEI Verification", icon: ShieldCheck, href: "/imei" },
    { name: "Recovery Cases", icon: MapPin, href: "/cases" },
    { name: "Fraud Intelligence", icon: Sparkles, href: "/intelligence" },
    { name: "Support Desk", icon: Headset, href: "/customer-success" },
    { name: "Partner Monitoring", icon: Radio, href: "/partners" },
    { name: "Communications", icon: Phone, href: "/communications" },
    { name: "Analytics", icon: BarChart2, href: "/reports" },
    { name: "Settings", icon: Settings, href: "/profile" },
    { name: "Guardian Network", icon: ShieldAlert, href: "/guardian" },
    { name: "Police Portal", icon: Landmark, href: "/police/dashboard" },
    { name: "Developer APIs", icon: Code, href: "/developer" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in text-xs font-medium">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Layout Container (Sidebar + Workspace) */}
      <div className="flex flex-1 min-h-0">
        
        {/* ── 1. LEFT NAVIGATION SIDEBAR ────────────────────────────────── */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 hidden lg:flex sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 space-y-6">
            
            {/* Top Brand Logo */}
            <div className="flex items-center gap-2.5 pb-2">
              <SimTraceLogo size={36} showText={false} />
              <div>
                <div className="font-extrabold text-lg tracking-tight text-[#0F172A] leading-tight flex items-center">
                  SIM<span className="text-[#2563EB]">TRACE</span>
                  <sup className="text-[9px] text-slate-400 font-normal ml-0.5">™</sup>
                </div>
                <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                  CONNECT · PROTECT · RECOVER
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-semibold"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom App Download Box */}
          <div className="p-4 m-4 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-900">SIMTRACE Guardian App</div>
              <div className="text-[11px] text-slate-500">Stay protected. Always.</div>
            </div>

            <div className="space-y-1.5">
              <a
                href="#download-app"
                onClick={(e) => {
                  e.preventDefault();
                  triggerToast("Redirecting to App Store installer...");
                }}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl py-2 px-3 flex items-center gap-2 text-[10px] font-medium transition"
              >
                <div className="text-base leading-none">🍎</div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase leading-none">Download on the</div>
                  <div className="font-bold leading-tight">App Store</div>
                </div>
              </a>

              <a
                href="#download-play"
                onClick={(e) => {
                  e.preventDefault();
                  triggerToast("Redirecting to Google Play Store...");
                }}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl py-2 px-3 flex items-center gap-2 text-[10px] font-medium transition"
              >
                <div className="text-base leading-none">▶</div>
                <div>
                  <div className="text-[8px] text-slate-400 uppercase leading-none">GET IT ON</div>
                  <div className="font-bold leading-tight">Google Play</div>
                </div>
              </a>
            </div>

            <div className="text-[10px] font-mono text-slate-400 text-center">Version 4.2.1</div>
          </div>
        </aside>

        {/* ── 2. RIGHT WORKSPACE AREA ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header Bar */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search IMEI, Device, Case, User..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-14 py-2 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition"
              />
              <span className="absolute right-3 top-2 px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-mono text-slate-400 bg-white">
                ⌘ K
              </span>
            </div>

            {/* Header Right Tools */}
            <div className="flex items-center gap-3">
              
              {/* Live Protection Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Protection</span>
              </div>

              {/* Bell Notifications */}
              <button
                onClick={() => triggerToast("12 Active security alerts loaded in buffer")}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  12
                </span>
              </button>

              {/* Help */}
              <button
                onClick={() => triggerToast("SIMTRACE Knowledge Base & Operations Guide")}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Sun Light Mode */}
              <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition">
                <Sun className="w-4 h-4" />
              </button>

              {/* Language Picker */}
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <span>EN</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  P
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">Purity Kamau</div>
                  <div className="text-[10px] text-slate-400 leading-tight">Administrator</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </div>
            </div>
          </header>

          {/* Main Dashboard Canvas */}
          <main className="p-6 space-y-6 flex-1">
            
            {/* ── 3. GREETING & QUICK ACTIONS ───────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                  Good afternoon, Purity! 👋
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Here's what's happening across the SIMTRACE network.
                </p>
              </div>

              {/* Quick Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Quick Actions</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {quickActionsOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                    <button
                      onClick={() => {
                        setQuickActionsOpen(false);
                        triggerToast("Dispatched instant GSMA IMEI lookup query");
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl font-medium"
                    >
                      🔍 Instant IMEI Verification
                    </button>
                    <button
                      onClick={() => {
                        setQuickActionsOpen(false);
                        triggerToast("Dispatched AES-256 Remote Lock command to buffer");
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
                    >
                      🔒 Lock Stolen Hardware
                    </button>
                    <button
                      onClick={() => {
                        setQuickActionsOpen(false);
                        triggerToast("Generated Court Evidence Affidavit Packet");
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl font-medium"
                    >
                      📄 Export Evidence Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4. TOP 5 KPI SUMMARY CARDS ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              
              {/* Card 1: TOTAL PROTECTED */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    TOTAL PROTECTED
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-sans">
                  8,241 <span className="text-xs font-normal text-slate-400">Devices</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>↑ 12.5%</span>
                  <span className="text-slate-400 font-normal">from last 7 days</span>
                </div>
              </div>

              {/* Card 2: ACTIVE CASES */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ACTIVE CASES
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-sans">
                  294 <span className="text-xs font-normal text-slate-400">Under Investigation</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>↑ 8.7%</span>
                  <span className="text-slate-400 font-normal">from last 7 days</span>
                </div>
              </div>

              {/* Card 3: DEVICES RECOVERED */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    DEVICES RECOVERED
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-sans">
                  1,273 <span className="text-xs font-normal text-slate-400">This Month</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>↑ 15.3%</span>
                  <span className="text-slate-400 font-normal">from last 7 days</span>
                </div>
              </div>

              {/* Card 4: TELECOM PARTNERS */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    TELECOM PARTNERS
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-sans">
                  128+ <span className="text-xs font-normal text-slate-400">Carriers Integrated</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>↑ 5</span>
                  <span className="text-slate-400 font-normal">new this month</span>
                </div>
              </div>

              {/* Card 5: COMMUNITY NODES */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    COMMUNITY NODES
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-sans">
                  14,820 <span className="text-xs font-normal text-slate-400">Active Members</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>↑ 9.2%</span>
                  <span className="text-slate-400 font-normal">from last 7 days</span>
                </div>
              </div>
            </div>

            {/* ── 5. MIDDLE SECTION: LIVE MONITORING MAP + RIGHT ALERTS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LIVE MONITORING MAP (8 Cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                
                {/* Map Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                      LIVE MONITORING MAP
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE</span>
                    </span>
                  </div>

                  <button
                    onClick={() => triggerToast("Expanded Map Full Screen")}
                    className="text-slate-400 hover:text-slate-700 transition p-1"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Map Canvas with Clusters & Overlay */}
                <div className="relative min-h-[360px] bg-[#EEF5FF] flex items-center justify-center p-4 overflow-hidden">
                  
                  {/* Styled World Map SVG Backdrop */}
                  <div
                    className="absolute inset-0 transition-transform duration-300 pointer-events-none flex items-center justify-center"
                    style={{ transform: `scale(${mapZoom})` }}
                  >
                    <svg viewBox="0 0 1000 500" className="w-full h-full opacity-60">
                      {/* World Continents simplified shapes */}
                      {/* North America */}
                      <path
                        d="M 120 100 Q 180 80 260 120 T 220 220 T 130 180 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                      {/* South America */}
                      <path
                        d="M 230 250 Q 280 270 290 350 T 230 440 T 200 320 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                      {/* Europe */}
                      <path
                        d="M 450 80 Q 520 70 560 110 T 490 180 T 440 120 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                      {/* Africa */}
                      <path
                        d="M 450 200 Q 550 180 580 260 T 540 390 T 450 320 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                      {/* Asia */}
                      <path
                        d="M 580 90 Q 750 60 850 130 T 780 260 T 600 200 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                      {/* Australia */}
                      <path
                        d="M 760 320 Q 840 310 860 380 T 780 410 Z"
                        fill="#CBD5E1"
                        stroke="#94A3B8"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>

                  {/* Cluster Markers */}
                  <div className="absolute inset-0 pointer-events-auto">
                    
                    {/* NA Marker (27) */}
                    <div className="absolute top-[28%] left-[22%] bg-blue-600 text-white font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      27
                    </div>

                    {/* SA Marker (19) */}
                    <div className="absolute top-[62%] left-[32%] bg-blue-600 text-white font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      19
                    </div>

                    {/* Europe Marker (14) */}
                    <div className="absolute top-[22%] left-[51%] bg-amber-500 text-white font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      14
                    </div>

                    {/* Central Africa Marker (103 RED) */}
                    <div className="absolute top-[48%] left-[48%] bg-rose-500 text-white font-bold text-sm w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-2xl animate-pulse cursor-pointer hover:scale-110 transition">
                      103
                    </div>

                    {/* East Africa Marker (88 YELLOW) */}
                    <div className="absolute top-[58%] left-[52%] bg-amber-500 text-white font-bold text-xs w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      88
                    </div>

                    {/* Middle East Marker (22) */}
                    <div className="absolute top-[32%] left-[62%] bg-blue-600 text-white font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      22
                    </div>

                    {/* Asia Marker (11) */}
                    <div className="absolute top-[55%] left-[71%] bg-blue-600 text-white font-bold text-xs w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition">
                      11
                    </div>
                  </div>

                  {/* Map Floating Overlay Card */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 w-52 space-y-3 z-10">
                    <div className="bg-[#2563EB] text-white p-2.5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold">294</div>
                        <div className="text-[10px] text-blue-100">Active Cases</div>
                      </div>
                      <Activity className="w-4 h-4 text-blue-200" />
                    </div>

                    <div className="space-y-1.5 text-xs font-medium">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>High Priority</span>
                        </span>
                        <span className="font-bold text-slate-800">72</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Medium Priority</span>
                        </span>
                        <span className="font-bold text-slate-800">118</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>Low Priority</span>
                        </span>
                        <span className="font-bold text-slate-800">104</span>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerToast("Loading all 294 investigation cases...")}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1.5 rounded-xl transition text-center"
                    >
                      View All Cases
                    </button>
                  </div>

                  {/* Map Controls */}
                  <div className="absolute bottom-4 right-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-col z-10 overflow-hidden">
                    <button
                      onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 2))}
                      className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                      className="p-2 hover:bg-slate-100 text-slate-700 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Map Footer Bar */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Real-time updates from SIMTRACE Global Network</span>
                  <span className="font-mono text-slate-600">
                    Last updated: {currentTime} <span className="text-emerald-500 font-bold">●</span>
                  </span>
                </div>
              </div>

              {/* RIGHT PANEL (4 Cols): LIVE ALERTS + SYSTEM STATUS */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* LIVE ALERTS CARD */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                      LIVE ALERTS
                    </span>

                    {/* Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                        className="text-[11px] text-slate-500 font-medium flex items-center gap-1 hover:text-slate-800"
                      >
                        <span>{allAlertsFilter}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {alertsDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                          {["All Alerts", "Critical Only", "SIM Swap", "Remote Lock"].map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setAllAlertsFilter(f);
                                setAlertsDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List of Live Operations Feed Alerts */}
                  <div className="space-y-3 text-xs">
                    
                    {/* Event 1: Device reported stolen */}
                    <div className="flex items-start gap-3 p-2 bg-rose-50/60 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition shadow-xs">
                      <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">Device reported stolen</span>
                          <span className="text-[10px] text-rose-700 font-mono font-bold bg-rose-100/90 px-1.5 py-0.5 rounded">JUST NOW</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate font-medium">
                          iPhone 15 Pro Max • IMEI #86102...
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Nairobi, Kenya • Flagged by Owner</div>
                      </div>
                    </div>

                    {/* Event 2: Fraud detected */}
                    <div className="flex items-start gap-3 p-2 bg-amber-50/60 hover:bg-amber-50 border border-amber-200/80 rounded-xl transition shadow-xs">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">Fraud detected</span>
                          <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100/90 px-1.5 py-0.5 rounded">2m ago</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate font-medium">
                          SIM Swap anomaly on IMSI #6390...
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Risk Score: 98/100 (Critical)</div>
                      </div>
                    </div>

                    {/* Event 3: Recovery completed */}
                    <div className="flex items-start gap-3 p-2 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition shadow-xs">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">Recovery completed</span>
                          <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100/90 px-1.5 py-0.5 rounded">5m ago</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate font-medium">
                          Case #STM-98231 • Samsung S24 Ultra
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Dispatched to Owner • Custody Verified</div>
                      </div>
                    </div>

                    {/* Event 4: Partner API alert */}
                    <div className="flex items-start gap-3 p-2 bg-blue-50/60 hover:bg-blue-50 border border-blue-200/80 rounded-xl transition shadow-xs">
                      <div className="p-2 rounded-xl bg-blue-100 text-[#2563EB] shrink-0">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate">Partner API alert</span>
                          <span className="text-[10px] text-blue-800 font-mono font-bold bg-blue-100/90 px-1.5 py-0.5 rounded">8m ago</span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate font-medium">
                          Safaricom Core Gateway • Latency 12ms
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">SS7 Sync Active • 100% Health</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/alerts"
                    className="block w-full text-center text-xs text-[#2563EB] font-bold py-1.5 hover:underline"
                  >
                    View All Alerts &gt;
                  </Link>
                </div>

                {/* SYSTEM STATUS CARD */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-2">
                    SYSTEM STATUS
                  </div>

                  <div className="space-y-2 text-xs font-medium text-slate-700">
                    {[
                      { name: "GPS Tracking", status: "Operational" },
                      { name: "SIM Swap Detection", status: "Operational" },
                      { name: "AI Engine", status: "Operational" },
                      { name: "Evidence Capture", status: "Operational" },
                      { name: "Remote Lock", status: "Operational" },
                      { name: "Community Network", status: "Operational" },
                      { name: "Police Integration", status: "Operational" },
                      { name: "Telecom Sync", status: "Operational" },
                    ].map((sys) => (
                      <div key={sys.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{sys.name}</span>
                        </span>
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          {sys.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/status"
                    className="block w-full text-center text-xs text-[#2563EB] font-bold py-1 hover:underline pt-2 border-t border-slate-100"
                  >
                    View System Health &gt;
                  </Link>
                </div>
              </div>
            </div>

            {/* ── 6. BOTTOM ANALYTICS GRID (4 CARDS) ───────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* CARD 1: RECOVERY TREND */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    RECOVERY TREND
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 cursor-pointer">
                    <span>This Month</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="h-32 w-full pt-2">
                  <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
                    
                    {/* Area fill */}
                    <path
                      d="M 10 90 Q 60 80 100 70 T 180 50 T 250 30 T 290 10 L 290 110 L 10 110 Z"
                      fill="url(#blue-gradient)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>

                    {/* Smooth Line */}
                    <path
                      d="M 10 90 L 40 85 L 70 88 L 100 70 L 130 75 L 160 55 L 190 60 L 220 40 L 250 45 L 280 20 L 290 10"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Data Dots */}
                    {[
                      [10, 90], [40, 85], [70, 88], [100, 70], [130, 75],
                      [160, 55], [190, 60], [220, 40], [250, 45], [280, 20], [290, 10]
                    ].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="3" fill="#2563EB" stroke="#ffffff" strokeWidth="1.5" />
                    ))}
                  </svg>

                  {/* X Axis Dates */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1">
                    <span>May 1</span>
                    <span>May 8</span>
                    <span>May 15</span>
                    <span>May 22</span>
                    <span>May 29</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Total Recovered</span>
                  <span className="font-extrabold text-slate-900 flex items-center gap-1">
                    1,273 <span className="text-emerald-600 text-[11px]">↑ 15.3%</span>
                  </span>
                </div>
              </div>

              {/* CARD 2: CASE PRIORITY */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  CASE PRIORITY
                </div>

                {/* Donut Chart */}
                <div className="flex items-center justify-center relative py-1">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                    {/* Circle Low Priority Blue 36% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="14" strokeDasharray="86 152" strokeDashoffset="0" />
                    {/* Circle Medium Priority Orange 40% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="95 143" strokeDashoffset="-86" />
                    {/* Circle High Priority Red 24% */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="14" strokeDasharray="57 181" strokeDashoffset="-181" />
                  </svg>

                  <div className="absolute text-center">
                    <div className="text-lg font-extrabold text-slate-900 leading-none">294</div>
                    <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Total Cases</div>
                  </div>
                </div>

                {/* Priority Breakdown Legend */}
                <div className="space-y-1 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>High Priority</span>
                    </span>
                    <span className="font-bold text-slate-800">72 (24%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Medium Priority</span>
                    </span>
                    <span className="font-bold text-slate-800">118 (40%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Low Priority</span>
                    </span>
                    <span className="font-bold text-slate-800">104 (36%)</span>
                  </div>
                </div>

                <button
                  onClick={() => triggerToast("Navigating to Investigation Cases ledger...")}
                  className="w-full text-center text-xs text-[#2563EB] font-bold hover:underline pt-1"
                >
                  View All Cases
                </button>
              </div>

              {/* CARD 3: TOP DEVICE BRANDS */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    TOP DEVICE BRANDS
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <span>This Month</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2 text-xs font-medium">
                  {/* Samsung */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Samsung</span>
                      <span className="font-bold">42.5%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#2563EB] h-full rounded-full w-[42.5%]" />
                    </div>
                  </div>

                  {/* Apple */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Apple</span>
                      <span className="font-bold">28.7%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full w-[28.7%]" />
                    </div>
                  </div>

                  {/* Xiaomi */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Xiaomi</span>
                      <span className="font-bold">12.4%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-[12.4%]" />
                    </div>
                  </div>

                  {/* Infinix */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Infinix</span>
                      <span className="font-bold">8.6%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[8.6%]" />
                    </div>
                  </div>

                  {/* Others */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Others</span>
                      <span className="font-bold">7.8%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full w-[7.8%]" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => triggerToast("Generating full Hardware Brand Telemetry analytics...")}
                  className="w-full text-center text-xs text-[#2563EB] font-bold hover:underline pt-1"
                >
                  View Full Report
                </button>
              </div>

              {/* CARD 4: AI THREAT SCORE */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  AI THREAT SCORE
                </div>

                {/* Gauge Meter */}
                <div className="flex flex-col items-center justify-center py-1 space-y-1">
                  <div className="relative w-32 h-16 overflow-hidden flex items-end justify-center">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      {/* Grey background arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      {/* Green active gauge arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 82 22"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute bottom-0 text-center">
                      <div className="text-2xl font-extrabold text-slate-900 leading-none">92</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                        Excellent
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex justify-between text-[9px] text-slate-400 font-mono px-4">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  AI is actively monitoring and protecting the network.
                </p>

                <button
                  onClick={() => triggerToast("Opening AI Forensic Insights dashboard...")}
                  className="w-full text-center text-xs text-[#2563EB] font-bold hover:underline pt-1"
                >
                  View AI Insights
                </button>
              </div>
            </div>

            {/* ── 7. PERSISTENT NAVY BOTTOM BANNER ──────────────────────── */}
            <div className="bg-[#0B1E36] text-white rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
              
              {/* Metrics Row */}
              <div className="flex flex-wrap items-center justify-around gap-4 sm:gap-8 text-center sm:text-left flex-1">
                
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold leading-tight">8,241</div>
                    <div className="text-[10px] text-blue-200/80">Protected Devices</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold leading-tight">294</div>
                    <div className="text-[10px] text-blue-200/80">Active Cases</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold leading-tight">1,273</div>
                    <div className="text-[10px] text-blue-200/80">Devices Recovered</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold leading-tight">14,820</div>
                    <div className="text-[10px] text-blue-200/80">Community Members</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-extrabold leading-tight">128+</div>
                    <div className="text-[10px] text-blue-200/80">Telecom Partners</div>
                  </div>
                </div>
              </div>

              {/* Support Chat Widget Button */}
              <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-blue-900/80 pt-3 lg:pt-0 lg:pl-6 shrink-0">
                <div className="flex items-center gap-2">
                  <Headset className="w-5 h-5 text-blue-400" />
                  <div className="text-xs">
                    <div className="font-bold text-white">Need Help?</div>
                    <div className="text-[10px] text-blue-200/70">Our support team is ready 24/7</div>
                  </div>
                </div>

                <button
                  onClick={() => setChatModalOpen(true)}
                  className="bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Chat Now</span>
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── 8. SUPPORT CHAT MODAL ────────────────────────────────────── */}
      {chatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[500px] animate-scale-in">
            
            {/* Modal Header */}
            <div className="bg-[#0B1E36] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center">
                  <Headset className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">SIMTRACE 24/7 Operations Support</div>
                  <div className="text-[10px] text-blue-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Agent Connected</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setChatModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#2563EB] text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-800 shadow-sm rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Type message to operations..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
