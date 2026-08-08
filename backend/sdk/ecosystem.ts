// ── SDK Ecosystem ───────────────────────────────────────────────────────────────
// JavaScript SDK, Mobile SDK, Partner SDK

export interface SDKVersion {
  id: string;
  sdkType: 'javascript' | 'mobile' | 'partner';
  version: string;
  releaseDate: Date;
  changelog: string[];
  isLatest: boolean;
  downloadUrl: string;
  documentationUrl: string;
}

export interface SDKUsage {
  id: string;
  organizationId: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  lastUsed: Date;
  apiCalls: number;
  errors: number;
  performance: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
}

export interface SDKIntegration {
  id: string;
  organizationId: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  config: Record<string, any>;
  features: string[];
  status: 'active' | 'inactive' | 'deprecated';
  installedAt: Date;
  updatedAt: Date;
}

export interface SDKDocumentation {
  id: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  title: string;
  content: string;
  category: 'getting_started' | 'authentication' | 'tracking' | 'recovery' | 'advanced';
  order: number;
}

export interface SDKExample {
  id: string;
  sdkType: SDKVersion['sdkType'];
  language: string;
  title: string;
  description: string;
  code: string;
  category: SDKDocumentation['category'];
}

class SDKEcosystem {
  private versions: Map<string, SDKVersion> = new Map();
  private usage: Map<string, SDKUsage> = new Map();
  private integrations: Map<string, SDKIntegration> = new Map();
  private documentation: Map<string, SDKDocumentation> = new Map();
  private examples: Map<string, SDKExample> = new Map();

  // Create SDK version
  createVersion(version: Omit<SDKVersion, 'id' | 'isLatest'>): SDKVersion {
    const sdkVersion: SDKVersion = {
      ...version,
      id: `sdk_${version.sdkType}_${version.version.replace(/\./g, '_')}`,
      isLatest: false,
    };

    this.versions.set(sdkVersion.id, sdkVersion);
    this.updateLatestVersion(version.sdkType);
    return sdkVersion;
  }

  // Update latest version
  private updateLatestVersion(sdkType: SDKVersion['sdkType']): void {
    const typeVersions = Array.from(this.versions.values())
      .filter(v => v.sdkType === sdkType)
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

    for (const v of this.versions.values()) {
      if (v.sdkType === sdkType) {
        v.isLatest = v.id === typeVersions[0]?.id;
      }
    }
  }

  // Get SDK version
  getVersion(sdkType: SDKVersion['sdkType'], version: string): SDKVersion | undefined {
    const id = `sdk_${sdkType}_${version.replace(/\./g, '_')}`;
    return this.versions.get(id);
  }

  // Get latest version
  getLatestVersion(sdkType: SDKVersion['sdkType']): SDKVersion | undefined {
    return Array.from(this.versions.values()).find(v => v.sdkType === sdkType && v.isLatest);
  }

  // Get all versions
  getAllVersions(sdkType?: SDKVersion['sdkType']): SDKVersion[] {
    let versions = Array.from(this.versions.values());
    if (sdkType) {
      versions = versions.filter(v => v.sdkType === sdkType);
    }
    return versions.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
  }

  // Record SDK usage
  recordUsage(usage: Omit<SDKUsage, 'id'>): SDKUsage {
    const sdkUsage: SDKUsage = {
      ...usage,
      id: `usage_${usage.organizationId}_${usage.sdkType}_${Date.now()}`,
    };

    this.usage.set(sdkUsage.id, sdkUsage);
    return sdkUsage;
  }

  // Get usage by organization
  getUsageByOrganization(organizationId: string): SDKUsage[] {
    return Array.from(this.usage.values()).filter(u => u.organizationId === organizationId);
  }

  // Get usage by SDK type
  getUsageBySDKType(sdkType: SDKVersion['sdkType']): SDKUsage[] {
    return Array.from(this.usage.values()).filter(u => u.sdkType === sdkType);
  }

  // Create integration
  createIntegration(integration: Omit<SDKIntegration, 'id' | 'installedAt' | 'updatedAt'>): SDKIntegration {
    const sdkIntegration: SDKIntegration = {
      ...integration,
      id: `integration_${integration.organizationId}_${integration.sdkType}_${Date.now()}`,
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    this.integrations.set(sdkIntegration.id, sdkIntegration);
    return sdkIntegration;
  }

  // Update integration
  updateIntegration(integrationId: string, updates: Partial<Omit<SDKIntegration, 'id' | 'installedAt'>>): SDKIntegration | null {
    const integration = this.integrations.get(integrationId);
    if (!integration) return null;

    Object.assign(integration, updates);
    integration.updatedAt = new Date();
    return integration;
  }

  // Get integration
  getIntegration(integrationId: string): SDKIntegration | undefined {
    return this.integrations.get(integrationId);
  }

  // Get integrations by organization
  getIntegrationsByOrganization(organizationId: string): SDKIntegration[] {
    return Array.from(this.integrations.values()).filter(i => i.organizationId === organizationId);
  }

  // Add documentation
  addDocumentation(doc: Omit<SDKDocumentation, 'id'>): SDKDocumentation {
    const sdkDoc: SDKDocumentation = {
      ...doc,
      id: `doc_${doc.sdkType}_${doc.version}_${doc.category}_${doc.order}`,
    };

    this.documentation.set(sdkDoc.id, sdkDoc);
    return sdkDoc;
  }

  // Get documentation
  getDocumentation(sdkType: SDKVersion['sdkType'], version?: string, category?: SDKDocumentation['category']): SDKDocumentation[] {
    let docs = Array.from(this.documentation.values()).filter(d => d.sdkType === sdkType);

    if (version) {
      docs = docs.filter(d => d.version === version);
    }

    if (category) {
      docs = docs.filter(d => d.category === category);
    }

    return docs.sort((a, b) => a.order - b.order);
  }

  // Add example
  addExample(example: Omit<SDKExample, 'id'>): SDKExample {
    const sdkExample: SDKExample = {
      ...example,
      id: `example_${example.sdkType}_${example.language}_${Date.now()}`,
    };

    this.examples.set(sdkExample.id, sdkExample);
    return sdkExample;
  }

  // Get examples
  getExamples(sdkType: SDKVersion['sdkType'], language?: string, category?: SDKDocumentation['category']): SDKExample[] {
    let examples = Array.from(this.examples.values()).filter(e => e.sdkType === sdkType);

    if (language) {
      examples = examples.filter(e => e.language === language);
    }

    if (category) {
      examples = examples.filter(e => e.category === category);
    }

    return examples;
  }

  // Get statistics
  getStatistics(): {
    totalVersions: number;
    javascriptVersions: number;
    mobileVersions: number;
    partnerVersions: number;
    totalUsage: number;
    totalIntegrations: number;
    activeIntegrations: number;
    totalDocumentation: number;
    totalExamples: number;
  } {
    const javascriptVersions = Array.from(this.versions.values()).filter(v => v.sdkType === 'javascript').length;
    const mobileVersions = Array.from(this.versions.values()).filter(v => v.sdkType === 'mobile').length;
    const partnerVersions = Array.from(this.versions.values()).filter(v => v.sdkType === 'partner').length;
    const activeIntegrations = Array.from(this.integrations.values()).filter(i => i.status === 'active').length;

    return {
      totalVersions: this.versions.size,
      javascriptVersions,
      mobileVersions,
      partnerVersions,
      totalUsage: this.usage.size,
      totalIntegrations: this.integrations.size,
      activeIntegrations,
      totalDocumentation: this.documentation.size,
      totalExamples: this.examples.size,
    };
  }

  // Initialize with sample data
  initializeSampleData(): void {
    // Create SDK versions
    this.createVersion({
      sdkType: 'javascript',
      version: '1.0.0',
      releaseDate: new Date('2024-01-01'),
      changelog: ['Initial release', 'Basic tracking functionality', 'Authentication support'],
      downloadUrl: `${process.env.SDK_CDN_URL || 'https://cdn.simtrace.com'}/sdk/js/1.0.0/simtrace.js`,
      documentationUrl: `${process.env.SDK_DOCS_URL || 'https://docs.simtrace.com'}/sdk/js/1.0.0`,
    });

    this.createVersion({
      sdkType: 'javascript',
      version: '1.1.0',
      releaseDate: new Date('2024-02-01'),
      changelog: ['Added recovery API', 'Improved error handling', 'Performance optimizations'],
      downloadUrl: `${process.env.SDK_CDN_URL || 'https://cdn.simtrace.com'}/sdk/js/1.1.0/simtrace.js`,
      documentationUrl: `${process.env.SDK_DOCS_URL || 'https://docs.simtrace.com'}/sdk/js/1.1.0`,
    });

    this.createVersion({
      sdkType: 'mobile',
      version: '1.0.0',
      releaseDate: new Date('2024-01-15'),
      changelog: ['Initial release', 'iOS and Android support', 'Background tracking'],
      downloadUrl: `${process.env.SDK_CDN_URL || 'https://cdn.simtrace.com'}/sdk/mobile/1.0.0`,
      documentationUrl: `${process.env.SDK_DOCS_URL || 'https://docs.simtrace.com'}/sdk/mobile/1.0.0`,
    });

    this.createVersion({
      sdkType: 'partner',
      version: '1.0.0',
      releaseDate: new Date('2024-01-20'),
      changelog: ['Initial release', 'REST API client', 'Webhook support'],
      downloadUrl: `${process.env.SDK_CDN_URL || 'https://cdn.simtrace.com'}/sdk/partner/1.0.0`,
      documentationUrl: `${process.env.SDK_DOCS_URL || 'https://docs.simtrace.com'}/sdk/partner/1.0.0`,
    });

    // Add documentation
    this.addDocumentation({
      sdkType: 'javascript',
      version: '1.1.0',
      title: 'Getting Started',
      content: 'Learn how to integrate the SimTrace JavaScript SDK into your web application.',
      category: 'getting_started',
      order: 1,
    });

    this.addDocumentation({
      sdkType: 'javascript',
      version: '1.1.0',
      title: 'Authentication',
      content: 'Configure authentication for your SDK integration.',
      category: 'authentication',
      order: 1,
    });

    // Add examples
    this.addExample({
      sdkType: 'javascript',
      language: 'javascript',
      title: 'Initialize SDK',
      description: 'Basic SDK initialization',
      code: `
import SimTrace from '@simtrace/sdk';

const simtrace = new SimTrace({
  apiKey: 'your-api-key',
  environment: 'production',
});

simtrack.track('device_detected', {
  imei: '123456789012345',
  model: 'Samsung Galaxy S21',
});
      `,
      category: 'getting_started',
    });

    this.addExample({
      sdkType: 'mobile',
      language: 'swift',
      title: 'Initialize SDK',
      description: 'Basic SDK initialization for iOS',
      code: `
import SimTraceSDK

let simtrace = SimTraceSDK(apiKey: "your-api-key")
simtrack.trackDevice(imei: "123456789012345", model: "iPhone 13")
      `,
      category: 'getting_started',
    });
  }
}

// Singleton instance
export const sdkEcosystem = new SDKEcosystem();

// Initialize sample data
sdkEcosystem.initializeSampleData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createSDKVersion(version: Omit<SDKVersion, 'id' | 'isLatest'>): SDKVersion {
  return sdkEcosystem.createVersion(version);
}

export function getLatestSDKVersion(sdkType: SDKVersion['sdkType']): SDKVersion | undefined {
  return sdkEcosystem.getLatestVersion(sdkType);
}

export function recordSDKUsage(usage: Omit<SDKUsage, 'id'>): SDKUsage {
  return sdkEcosystem.recordUsage(usage);
}

export function createSDKIntegration(integration: Omit<SDKIntegration, 'id' | 'installedAt' | 'updatedAt'>): SDKIntegration {
  return sdkEcosystem.createIntegration(integration);
}

export function getSDKDocumentation(sdkType: SDKVersion['sdkType'], version?: string, category?: SDKDocumentation['category']): SDKDocumentation[] {
  return sdkEcosystem.getDocumentation(sdkType, version, category);
}

export function getSDKExamples(sdkType: SDKVersion['sdkType'], language?: string, category?: SDKDocumentation['category']): SDKExample[] {
  return sdkEcosystem.getExamples(sdkType, language, category);
}

export function getSDKStatistics() {
  return sdkEcosystem.getStatistics();
}
