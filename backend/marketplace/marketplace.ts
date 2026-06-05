// ── Enterprise App Marketplace ───────────────────────────────────────────────────
// Extension ecosystem, plugins, custom integrations, workflows, dashboards

export interface AppExtension {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'plugin' | 'integration' | 'workflow' | 'dashboard';
  category: string;
  author: string;
  icon?: string;
  screenshots: string[];
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
    trialDays?: number;
  };
  features: string[];
  requirements: {
    apiVersion: string;
    permissions: string[];
  };
  status: 'draft' | 'published' | 'deprecated' | 'removed';
  downloads: number;
  rating: number;
  reviews: number;
  publishedAt?: Date;
  updatedAt: Date;
}

export interface AppInstallation {
  id: string;
  organizationId: string;
  extensionId: string;
  version: string;
  status: 'installing' | 'active' | 'inactive' | 'error' | 'updating';
  config: Record<string, any>;
  installedAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface AppReview {
  id: string;
  extensionId: string;
  organizationId: string;
  userId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AppWorkflow {
  id: string;
  extensionId: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'error';
  lastRun?: Date;
  runCount: number;
  successCount: number;
  errorCount: number;
}

export interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'notification';
  config: Record<string, any>;
  order: number;
}

export interface AppDashboard {
  id: string;
  extensionId: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  type: 'grid' | 'tabs' | 'custom';
  columns: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'map' | 'list';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

class EnterpriseMarketplace {
  private extensions: Map<string, AppExtension> = new Map();
  private installations: Map<string, AppInstallation> = new Map();
  private reviews: Map<string, AppReview> = new Map();
  private workflows: Map<string, AppWorkflow> = new Map();
  private dashboards: Map<string, AppDashboard> = new Map();

  // Create extension
  createExtension(extension: Omit<AppExtension, 'id' | 'downloads' | 'rating' | 'reviews' | 'updatedAt'>): AppExtension {
    const appExtension: AppExtension = {
      ...extension,
      id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      downloads: 0,
      rating: 0,
      reviews: 0,
      updatedAt: new Date(),
    };

    this.extensions.set(appExtension.id, appExtension);
    return appExtension;
  }

  // Get extension
  getExtension(extensionId: string): AppExtension | undefined {
    return this.extensions.get(extensionId);
  }

  // Get extensions by type
  getExtensionsByType(type: AppExtension['type']): AppExtension[] {
    return Array.from(this.extensions.values()).filter(e => e.type === type && e.status === 'published');
  }

  // Get extensions by category
  getExtensionsByCategory(category: string): AppExtension[] {
    return Array.from(this.extensions.values()).filter(e => e.category === category && e.status === 'published');
  }

  // Search extensions
  searchExtensions(query: string): AppExtension[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.extensions.values()).filter(
      e => e.status === 'published' &&
      (e.name.toLowerCase().includes(lowerQuery) ||
       e.description.toLowerCase().includes(lowerQuery) ||
       e.category.toLowerCase().includes(lowerQuery))
    );
  }

  // Install extension
  installExtension(organizationId: string, extensionId: string, config: Record<string, any> = {}): AppInstallation {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }

    const installation: AppInstallation = {
      id: `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      extensionId,
      version: extension.version,
      status: 'installing',
      config,
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    this.installations.set(installation.id, installation);
    
    // Simulate installation
    setTimeout(() => {
      installation.status = 'active';
      installation.updatedAt = new Date();
      extension.downloads++;
    }, 100);

    return installation;
  }

  // Get installations by organization
  getInstallationsByOrganization(organizationId: string): AppInstallation[] {
    return Array.from(this.installations.values()).filter(i => i.organizationId === organizationId);
  }

  // Uninstall extension
  uninstallExtension(installationId: string): boolean {
    const installation = this.installations.get(installationId);
    if (!installation) return false;

    this.installations.delete(installationId);
    return true;
  }

  // Add review
  addReview(review: Omit<AppReview, 'id' | 'createdAt'>): AppReview {
    const appReview: AppReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.reviews.set(appReview.id, appReview);

    // Update extension rating
    this.updateExtensionRating(appReview.extensionId);

    return appReview;
  }

  // Update extension rating
  private updateExtensionRating(extensionId: string): void {
    const extension = this.extensions.get(extensionId);
    if (!extension) return;

    const reviews = Array.from(this.reviews.values()).filter(r => r.extensionId === extensionId);
    extension.reviews = reviews.length;

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      extension.rating = totalRating / reviews.length;
    }
  }

  // Get reviews by extension
  getReviewsByExtension(extensionId: string): AppReview[] {
    return Array.from(this.reviews.values()).filter(r => r.extensionId === extensionId);
  }

  // Create workflow
  createWorkflow(workflow: Omit<AppWorkflow, 'id' | 'lastRun' | 'runCount' | 'successCount' | 'errorCount'>): AppWorkflow {
    const appWorkflow: AppWorkflow = {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastRun: undefined,
      runCount: 0,
      successCount: 0,
      errorCount: 0,
    };

    this.workflows.set(appWorkflow.id, appWorkflow);
    return appWorkflow;
  }

  // Get workflows by extension
  getWorkflowsByExtension(extensionId: string): AppWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.extensionId === extensionId);
  }

  // Execute workflow
  async executeWorkflow(workflowId: string): Promise<AppWorkflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.lastRun = new Date();
    workflow.runCount++;

    // Simulate workflow execution
    await new Promise(resolve => setTimeout(resolve, 100));

    workflow.successCount++;
    return workflow;
  }

  // Create dashboard
  createDashboard(dashboard: Omit<AppDashboard, 'id' | 'createdAt' | 'updatedAt'>): AppDashboard {
    const appDashboard: AppDashboard = {
      ...dashboard,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(appDashboard.id, appDashboard);
    return appDashboard;
  }

  // Get dashboards by extension
  getDashboardsByExtension(extensionId: string): AppDashboard[] {
    return Array.from(this.dashboards.values()).filter(d => d.extensionId === extensionId);
  }

  // Get public dashboards
  getPublicDashboards(): AppDashboard[] {
    return Array.from(this.dashboards.values()).filter(d => d.isPublic);
  }

  // Get statistics
  getStatistics(): {
    totalExtensions: number;
    publishedExtensions: number;
    totalInstallations: number;
    activeInstallations: number;
    totalReviews: number;
    totalWorkflows: number;
    activeWorkflows: number;
    totalDashboards: number;
    publicDashboards: number;
  } {
    const publishedExtensions = Array.from(this.extensions.values()).filter(e => e.status === 'published').length;
    const activeInstallations = Array.from(this.installations.values()).filter(i => i.status === 'active').length;
    const activeWorkflows = Array.from(this.workflows.values()).filter(w => w.status === 'active').length;
    const publicDashboards = Array.from(this.dashboards.values()).filter(d => d.isPublic).length;

    return {
      totalExtensions: this.extensions.size,
      publishedExtensions,
      totalInstallations: this.installations.size,
      activeInstallations,
      totalReviews: this.reviews.size,
      totalWorkflows: this.workflows.size,
      activeWorkflows,
      totalDashboards: this.dashboards.size,
      publicDashboards,
    };
  }

  // Initialize with sample data
  initializeSampleData(): void {
    // Create production-ready extensions
    
    // Slack Integration
    this.createExtension({
      name: 'Slack Integration',
      description: 'Send real-time alerts and notifications to Slack channels',
      version: '1.2.0',
      type: 'integration',
      category: 'Communication',
      author: 'SimTrace',
      icon: 'slack',
      screenshots: [],
      pricing: { type: 'free' },
      features: ['Channel notifications', 'Direct messages', 'File sharing', 'Custom webhooks', 'Alert filtering'],
      requirements: { apiVersion: 'v1', permissions: ['notifications.send', 'devices.read'] },
      status: 'published',
    });

    // Microsoft Teams Integration
    this.createExtension({
      name: 'Microsoft Teams Integration',
      description: 'Integrate SimTrace alerts with Microsoft Teams for enterprise collaboration',
      version: '1.0.0',
      type: 'integration',
      category: 'Communication',
      author: 'SimTrace',
      icon: 'teams',
      screenshots: [],
      pricing: { type: 'paid', price: 15, currency: 'USD', trialDays: 30 },
      features: ['Teams channel notifications', 'Adaptive cards', 'Meeting integration', 'Alert routing'],
      requirements: { apiVersion: 'v1', permissions: ['notifications.send', 'devices.read'] },
      status: 'published',
    });

    // Custom Dashboard Builder
    this.createExtension({
      name: 'Custom Dashboard Builder',
      description: 'Build and deploy custom analytics dashboards with drag-and-drop widgets',
      version: '2.1.0',
      type: 'dashboard',
      category: 'Analytics',
      author: 'SimTrace',
      icon: 'dashboard',
      screenshots: [],
      pricing: { type: 'freemium', price: 29, currency: 'USD', trialDays: 14 },
      features: ['Drag-and-drop builder', 'Real-time metrics', 'Custom widgets', 'Export reports', 'Dashboard sharing'],
      requirements: { apiVersion: 'v1', permissions: ['analytics.read', 'analytics.write'] },
      status: 'published',
    });

    // Auto-Recovery Workflow
    this.createExtension({
      name: 'Auto-Recovery Workflow',
      description: 'Automated recovery workflow for stolen devices with telecom integration',
      version: '1.1.0',
      type: 'workflow',
      category: 'Automation',
      author: 'SimTrace',
      icon: 'workflow',
      screenshots: [],
      pricing: { type: 'paid', price: 49, currency: 'USD', trialDays: 30 },
      features: ['Automatic recovery initiation', 'Telecom integration', 'Status updates', 'Multi-step workflows', 'Conditional logic'],
      requirements: { apiVersion: 'v1', permissions: ['recovery.manage', 'telecom.access', 'devices.write'] },
      status: 'published',
    });

    // SMS Gateway Integration
    this.createExtension({
      name: 'SMS Gateway Integration',
      description: 'Send SMS alerts via custom SMS gateway providers',
      version: '1.0.0',
      type: 'integration',
      category: 'Communication',
      author: 'SimTrace',
      icon: 'sms',
      screenshots: [],
      pricing: { type: 'paid', price: 19, currency: 'USD', trialDays: 14 },
      features: ['Custom SMS provider', 'Bulk SMS', 'Message templates', 'Delivery tracking'],
      requirements: { apiVersion: 'v1', permissions: ['notifications.send'] },
      status: 'published',
    });

    // Advanced Analytics Dashboard
    this.createExtension({
      name: 'Advanced Analytics Dashboard',
      description: 'Pre-built analytics dashboard with advanced metrics and insights',
      version: '2.0.0',
      type: 'dashboard',
      category: 'Analytics',
      author: 'SimTrace',
      icon: 'analytics',
      screenshots: [],
      pricing: { type: 'paid', price: 29, currency: 'USD', trialDays: 14 },
      features: ['Real-time metrics', 'Custom widgets', 'Export reports', 'Trend analysis'],
      requirements: { apiVersion: 'v1', permissions: ['analytics.read'] },
      status: 'published',
    });

    // Create sample workflow for auto-recovery
    const recoveryWorkflow = this.createWorkflow({
      extensionId: 'ext_4',
      name: 'Device Recovery Automation',
      description: 'Automatically initiate recovery when device is marked as stolen',
      triggers: [
        { id: 'trigger_1', type: 'event', config: { event: 'device.stolen' } },
      ],
      steps: [
        { id: 'step_1', name: 'Notify Team', type: 'notification', config: { channel: 'slack' }, order: 1 },
        { id: 'step_2', name: 'Contact Telecom', type: 'action', config: { action: 'block_sim' }, order: 2 },
        { id: 'step_3', name: 'Update Case', type: 'action', config: { action: 'update_status' }, order: 3 },
        { id: 'step_4', name: 'Send SMS Alert', type: 'notification', config: { type: 'sms' }, order: 4 },
      ],
      status: 'active',
    });

    // Create sample dashboard for recovery analytics
    this.createDashboard({
      extensionId: 'ext_6',
      name: 'Recovery Analytics',
      description: 'Analytics dashboard for recovery operations',
      layout: { type: 'grid', columns: 3 },
      widgets: [
        { id: 'widget_1', type: 'metric', title: 'Total Recoveries', config: {}, position: { x: 0, y: 0, w: 1, h: 1 } },
        { id: 'widget_2', type: 'chart', title: 'Recovery Rate', config: { type: 'line' }, position: { x: 1, y: 0, w: 2, h: 1 } },
        { id: 'widget_3', type: 'chart', title: 'Recovery by Region', config: { type: 'bar' }, position: { x: 0, y: 1, w: 3, h: 1 } },
      ],
      isPublic: true,
    });

    // Create custom dashboard template
    this.createDashboard({
      extensionId: 'ext_3',
      name: 'Device Risk Overview',
      description: 'Custom dashboard template for device risk monitoring',
      layout: { type: 'grid', columns: 4 },
      widgets: [
        { id: 'widget_1', type: 'metric', title: 'High Risk Devices', config: { color: 'red' }, position: { x: 0, y: 0, w: 1, h: 1 } },
        { id: 'widget_2', type: 'metric', title: 'Medium Risk Devices', config: { color: 'yellow' }, position: { x: 1, y: 0, w: 1, h: 1 } },
        { id: 'widget_3', type: 'metric', title: 'Low Risk Devices', config: { color: 'green' }, position: { x: 2, y: 0, w: 1, h: 1 } },
        { id: 'widget_4', type: 'chart', title: 'Risk Trend', config: { type: 'line' }, position: { x: 3, y: 0, w: 1, h: 1 } },
        { id: 'widget_5', type: 'map', title: 'Device Locations', config: {}, position: { x: 0, y: 1, w: 2, h: 2 } },
        { id: 'widget_6', type: 'table', title: 'Recent Alerts', config: {}, position: { x: 2, y: 1, w: 2, h: 2 } },
      ],
      isPublic: true,
    });
  }
}

// Singleton instance
export const enterpriseMarketplace = new EnterpriseMarketplace();

// Initialize sample data
enterpriseMarketplace.initializeSampleData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createAppExtension(extension: Omit<AppExtension, 'id' | 'downloads' | 'rating' | 'reviews' | 'updatedAt'>): AppExtension {
  return enterpriseMarketplace.createExtension(extension);
}

export function installAppExtension(organizationId: string, extensionId: string, config?: Record<string, any>): AppInstallation {
  return enterpriseMarketplace.installExtension(organizationId, extensionId, config);
}

export function addAppReview(review: Omit<AppReview, 'id' | 'createdAt'>): AppReview {
  return enterpriseMarketplace.addReview(review);
}

export function createAppWorkflow(workflow: Omit<AppWorkflow, 'id' | 'lastRun' | 'runCount' | 'successCount' | 'errorCount'>): AppWorkflow {
  return enterpriseMarketplace.createWorkflow(workflow);
}

export async function executeAppWorkflow(workflowId: string): Promise<AppWorkflow> {
  return enterpriseMarketplace.executeWorkflow(workflowId);
}

export function createAppDashboard(dashboard: Omit<AppDashboard, 'id' | 'createdAt' | 'updatedAt'>): AppDashboard {
  return enterpriseMarketplace.createDashboard(dashboard);
}

export function getMarketplaceStatistics() {
  return enterpriseMarketplace.getStatistics();
}
