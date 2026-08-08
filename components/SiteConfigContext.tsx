"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  SiteConfig,
  DEFAULT_SITE_CONFIG,
  getStoredSiteConfig,
  saveStoredSiteConfig,
  resetStoredSiteConfig,
} from "../lib/siteConfigStore";

interface SiteConfigContextType {
  config: SiteConfig;
  updateConfig: (newConfig: Partial<SiteConfig>) => void;
  resetConfig: () => void;
  exportConfigJson: () => string;
  importConfigJson: (jsonString: string) => boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_SITE_CONFIG,
  updateConfig: () => {},
  resetConfig: () => {},
  exportConfigJson: () => "",
  importConfigJson: () => false,
});

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    // Load config on mount
    const initial = getStoredSiteConfig();
    setConfig(initial);

    // Listen for cross-tab or component updates
    const handleUpdate = () => {
      setConfig(getStoredSiteConfig());
    };

    window.addEventListener("simtrace_config_updated", handleUpdate);
    return () => {
      window.removeEventListener("simtrace_config_updated", handleUpdate);
    };
  }, []);

  const updateConfig = (updates: Partial<SiteConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...updates };
      saveStoredSiteConfig(merged);
      return merged;
    });
  };

  const resetConfig = () => {
    const reset = resetStoredSiteConfig();
    setConfig(reset);
  };

  const exportConfigJson = (): string => {
    return JSON.stringify(config, null, 2);
  };

  const importConfigJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === "object" && parsed !== null) {
        const validated = { ...DEFAULT_SITE_CONFIG, ...parsed };
        setConfig(validated);
        saveStoredSiteConfig(validated);
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON configuration", e);
    }
    return false;
  };

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        exportConfigJson,
        importConfigJson,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
