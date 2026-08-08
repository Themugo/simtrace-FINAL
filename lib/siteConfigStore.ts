export interface NavItemConfig {
  id: string;
  label: string;
  route: string;
  badge?: string;
  visible: boolean;
  order: number;
}

export interface SectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface SiteConfig {
  // Brand & Identity
  brandName: string;
  tagline: string;
  version: string;
  accentColor: string; // e.g. '#1769FF'
  secondaryColor: string; // e.g. '#18C8FF'
  themeStyle: 'sovereign' | 'cyber' | 'enterprise';

  // Announcement Banner
  bannerEnabled: boolean;
  bannerMessage: string;
  bannerType: 'info' | 'warning' | 'critical' | 'success';

  // Hero Copy & Buttons
  heroHeadingLine1: string;
  heroHeadingLine2: string;
  heroSubtext: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  tertiaryCtaText: string;

  // Live Telemetry Numbers
  telemetry: {
    status: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
    protectedDevices: string;
    activeProtection: string;
    openIncidents: number;
    recoveryCases: number;
    networkPartners: number;
    lastSync: string;
  };

  // Section Ordering and Toggles
  sections: SectionConfig[];

  // Navigation Items
  navigation: NavItemConfig[];

  // Custom Footer Copy
  footerText: string;
  copyrightText: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: "SIMTRACE™ CONTROL CENTRE",
  tagline: "Sovereign Device Security, Threat Detection & Recovery Network",
  version: "v2.4.0 — SOVEREIGN CORE",
  accentColor: "#1769FF",
  secondaryColor: "#18C8FF",
  themeStyle: "sovereign",

  bannerEnabled: true,
  bannerMessage: "● SYSTEM NOTICE: Sovereign Core Node v2.4 Active Across East Africa & Global Carriers",
  bannerType: "info",

  heroHeadingLine1: "DEVICE SECURITY.",
  heroHeadingLine2: "ONE NETWORK.",
  heroSubtext: "Protect, verify, detect and recover devices through one connected security infrastructure connecting owners, carriers, marketplaces, and law enforcement.",
  primaryCtaText: "VERIFY DEVICE",
  secondaryCtaText: "REPORT STOLEN",
  tertiaryCtaText: "OPEN RECOVERY",

  telemetry: {
    status: "OPERATIONAL",
    protectedDevices: "12,482,910",
    activeProtection: "9,840,120",
    openIncidents: 14,
    recoveryCases: 42,
    networkPartners: 87,
    lastSync: "2 sec ago",
  },

  sections: [
    { id: "commandHeader", name: "Command Header", enabled: true, order: 1 },
    { id: "heroPanel", name: "Hero & IMEI Verifier Console", enabled: true, order: 2 },
    { id: "telemetryStrip", name: "Network Telemetry Strip", enabled: true, order: 3 },
    { id: "quickCommands", name: "Quick Response Commands", enabled: true, order: 4 },
    { id: "networkIntelligence", name: "Topology & Live Activity Map", enabled: true, order: 5 },
    { id: "securityOperations", name: "SOC Security Operations Modules", enabled: true, order: 6 },
    { id: "incidentPipeline", name: "Incident Response Pipeline", enabled: true, order: 7 },
    { id: "workspacesGrid", name: "Ecosystem Launchers & Workspaces", enabled: true, order: 8 },
    { id: "operationsPreview", name: "Operations Command SOC Preview", enabled: true, order: 9 },
    { id: "developerNetwork", name: "Developer API & Connectivity", enabled: true, order: 10 },
    { id: "commandLauncher", name: "Final Command Entry Launcher", enabled: true, order: 11 },
  ],

  navigation: [
    { id: "nav-1", label: "Control Centre", route: "/", visible: true, order: 1 },
    { id: "nav-2", label: "Devices", route: "/devices", visible: true, order: 2 },
    { id: "nav-3", label: "Security", route: "/alerts", visible: true, order: 3 },
    { id: "nav-4", label: "Recovery", route: "/cases", visible: true, order: 4 },
    { id: "nav-5", label: "Telecom", route: "/telecom-portal", visible: true, order: 5 },
    { id: "nav-6", label: "Marketplace", route: "/advertise", visible: true, order: 6 },
    { id: "nav-7", label: "Developer", route: "/developer", visible: true, order: 7 },
  ],

  footerText: "CONNECT · PROTECT · DETECT · VERIFY · RECOVER",
  copyrightText: "© 2026 SIMTRACE™ Global Infrastructure Network. All rights reserved.",
};

const STORAGE_KEY = "simtrace_site_config_v2";

export function getStoredSiteConfig(): SiteConfig {
  if (typeof window === "undefined") {
    return DEFAULT_SITE_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SITE_CONFIG, ...parsed };
  } catch (e) {
    console.error("Failed to parse site config from storage", e);
    return DEFAULT_SITE_CONFIG;
  }
}

export function saveStoredSiteConfig(config: SiteConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch a custom event so open tabs react instantly
    window.dispatchEvent(new Event("simtrace_config_updated"));
  } catch (e) {
    console.error("Failed to save site config to storage", e);
  }
}

export function resetStoredSiteConfig(): SiteConfig {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("simtrace_config_updated"));
  }
  return DEFAULT_SITE_CONFIG;
}
