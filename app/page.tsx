"use client";

import React from "react";
import CommandHeader from "../components/control-centre/CommandHeader";
import HeroControlPanel from "../components/control-centre/HeroControlPanel";
import NetworkTelemetryStrip from "../components/control-centre/NetworkTelemetryStrip";
import QuickCommands from "../components/control-centre/QuickCommands";
import NetworkIntelligence from "../components/control-centre/NetworkIntelligence";
import SecurityOperations from "../components/control-centre/SecurityOperations";
import IncidentPipeline from "../components/control-centre/IncidentPipeline";
import WorkspacesGrid from "../components/control-centre/WorkspacesGrid";
import OperationsSOCPreview from "../components/control-centre/OperationsSOCPreview";
import DeveloperNetwork from "../components/control-centre/DeveloperNetwork";
import CommandLauncher from "../components/control-centre/CommandLauncher";
import ControlCentreFooter from "../components/control-centre/ControlCentreFooter";
import { SiteConfigProvider, useSiteConfig } from "../components/SiteConfigContext";

function HomePageContent() {
  const { config } = useSiteConfig();

  // Map section IDs to components
  const sectionMap: Record<string, React.ReactNode> = {
    commandHeader: <CommandHeader key="commandHeader" />,
    heroPanel: <HeroControlPanel key="heroPanel" />,
    telemetryStrip: <NetworkTelemetryStrip key="telemetryStrip" />,
    quickCommands: <QuickCommands key="quickCommands" />,
    networkIntelligence: <NetworkIntelligence key="networkIntelligence" />,
    securityOperations: <SecurityOperations key="securityOperations" />,
    incidentPipeline: <IncidentPipeline key="incidentPipeline" />,
    workspacesGrid: <WorkspacesGrid key="workspacesGrid" />,
    operationsPreview: <OperationsSOCPreview key="operationsPreview" />,
    developerNetwork: <DeveloperNetwork key="developerNetwork" />,
    commandLauncher: <CommandLauncher key="commandLauncher" />,
  };

  // Sort sections by order and filter enabled ones
  const activeSections = [...(config.sections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Structured Microdata JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": config.brandName,
    "operatingSystem": "iOS, Android, Web, Embedded",
    "applicationCategory": "SecurityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": config.tagline
  };

  return (
    <div className="min-h-screen bg-[#071A3A] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden flex flex-col justify-between">
      
      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background Mesh & Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1769ff0d_1px,transparent_1px),linear-gradient(to_bottom,#1769ff0d_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[#1769FF]/20 via-[#18C8FF]/05 to-transparent blur-3xl opacity-90" />
        <div className="absolute top-[600px] -left-40 w-[600px] h-[600px] bg-radial from-blue-600/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-40 -right-40 w-[600px] h-[600px] bg-radial from-cyan-500/10 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Main Command Surface Body */}
      <main className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-20 space-y-12 sm:space-y-16">
        {activeSections.map((sec) => sectionMap[sec.id])}
      </main>

      {/* CONTROL CENTRE FOOTER */}
      <ControlCentreFooter />

    </div>
  );
}

export default function HomePage() {
  return (
    <SiteConfigProvider>
      <HomePageContent />
    </SiteConfigProvider>
  );
}
