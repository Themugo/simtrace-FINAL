// ── High-Availability Infrastructure ───────────────────────────────────────────────
// Multi-region DB, active-active services, failover systems, autoscaling

export interface Region {
  id: string;
  name: string;
  location: string;
  primary: boolean;
  status: 'active' | 'degraded' | 'offline';
  latency: number;
  lastHealthCheck: Date;
}

export interface DatabaseCluster {
  id: string;
  regionId: string;
  type: 'primary' | 'replica';
  status: 'healthy' | 'degraded' | 'offline';
  connectionString: string;
  lag?: number;
  lastSync: Date;
}

export interface ServiceInstance {
  id: string;
  service: string;
  regionId: string;
  status: 'running' | 'stopped' | 'degraded';
  cpu: number;
  memory: number;
  requests: number;
  lastHealthCheck: Date;
}

export interface FailoverConfig {
  enabled: boolean;
  healthCheckInterval: number;
  failoverThreshold: number;
  autoFailover: boolean;
  regions: string[];
}

export interface AutoscalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

class HighAvailabilityInfrastructure {
  private regions: Map<string, Region> = new Map();
  private databaseClusters: Map<string, DatabaseCluster> = new Map();
  private serviceInstances: Map<string, ServiceInstance> = new Map();
  private failoverConfig: FailoverConfig;
  private autoscalingConfig: AutoscalingConfig;
  private failoverHistory: Array<{ timestamp: Date; from: string; to: string; reason: string }> = [];

  constructor() {
    this.failoverConfig = {
      enabled: true,
      healthCheckInterval: 30000,
      failoverThreshold: 3,
      autoFailover: true,
      regions: [],
    };

    this.autoscalingConfig = {
      enabled: true,
      minInstances: 2,
      maxInstances: 10,
      targetCPU: 70,
      targetMemory: 80,
      scaleUpCooldown: 300000,
      scaleDownCooldown: 600000,
    };

    this.initializeDefaultRegions();
  }

  // Initialize default regions
  private initializeDefaultRegions(): void {
    this.addRegion({
      id: 'us-east-1',
      name: 'US East (N. Virginia)',
      location: 'North America',
      primary: true,
      status: 'active',
      latency: 50,
    });

    this.addRegion({
      id: 'eu-west-1',
      name: 'Europe (Ireland)',
      location: 'Europe',
      primary: false,
      status: 'active',
      latency: 120,
    });

    this.addRegion({
      id: 'af-south-1',
      name: 'Africa (Cape Town)',
      location: 'Africa',
      primary: false,
      status: 'active',
      latency: 180,
    });
  }

  // Add region
  addRegion(region: Omit<Region, 'lastHealthCheck'>): Region {
    const newRegion: Region = {
      ...region,
      lastHealthCheck: new Date(),
    };

    this.regions.set(region.id, newRegion);
    return newRegion;
  }

  // Update region status
  updateRegionStatus(regionId: string, status: Region['status']): Region | null {
    const region = this.regions.get(regionId);
    if (!region) return null;

    region.status = status;
    region.lastHealthCheck = new Date();

    return region;
  }

  // Get region
  getRegion(regionId: string): Region | undefined {
    return this.regions.get(regionId);
  }

  // Get all regions
  getAllRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  // Get primary region
  getPrimaryRegion(): Region | undefined {
    return Array.from(this.regions.values()).find(r => r.primary);
  }

  // Get healthy regions
  getHealthyRegions(): Region[] {
    return Array.from(this.regions.values()).filter(r => r.status === 'active');
  }

  // Add database cluster
  addDatabaseCluster(cluster: Omit<DatabaseCluster, 'lastSync'>): DatabaseCluster {
    const newCluster: DatabaseCluster = {
      ...cluster,
      lastSync: new Date(),
    };

    this.databaseClusters.set(cluster.id, newCluster);
    return newCluster;
  }

  // Update database cluster status
  updateDatabaseClusterStatus(clusterId: string, status: DatabaseCluster['status'], lag?: number): DatabaseCluster | null {
    const cluster = this.databaseClusters.get(clusterId);
    if (!cluster) return null;

    cluster.status = status;
    cluster.lag = lag;
    cluster.lastSync = new Date();

    return cluster;
  }

  // Get database cluster
  getDatabaseCluster(clusterId: string): DatabaseCluster | undefined {
    return this.databaseClusters.get(clusterId);
  }

  // Get all database clusters
  getAllDatabaseClusters(): DatabaseCluster[] {
    return Array.from(this.databaseClusters.values());
  }

  // Get database clusters by region
  getDatabaseClustersByRegion(regionId: string): DatabaseCluster[] {
    return Array.from(this.databaseClusters.values()).filter(c => c.regionId === regionId);
  }

  // Get primary database cluster
  getPrimaryDatabaseCluster(): DatabaseCluster | undefined {
    return Array.from(this.databaseClusters.values()).find(c => c.type === 'primary');
  }

  // Add service instance
  addServiceInstance(instance: Omit<ServiceInstance, 'lastHealthCheck'>): ServiceInstance {
    const newInstance: ServiceInstance = {
      ...instance,
      lastHealthCheck: new Date(),
    };

    this.serviceInstances.set(instance.id, newInstance);
    return newInstance;
  }

  // Update service instance
  updateServiceInstance(instanceId: string, updates: Partial<Omit<ServiceInstance, 'id' | 'service' | 'regionId'>>): ServiceInstance | null {
    const instance = this.serviceInstances.get(instanceId);
    if (!instance) return null;

    Object.assign(instance, updates);
    instance.lastHealthCheck = new Date();

    return instance;
  }

  // Get service instance
  getServiceInstance(instanceId: string): ServiceInstance | undefined {
    return this.serviceInstances.get(instanceId);
  }

  // Get all service instances
  getAllServiceInstances(): ServiceInstance[] {
    return Array.from(this.serviceInstances.values());
  }

  // Get service instances by service
  getServiceInstancesByService(service: string): ServiceInstance[] {
    return Array.from(this.serviceInstances.values()).filter(i => i.service === service);
  }

  // Get service instances by region
  getServiceInstancesByRegion(regionId: string): ServiceInstance[] {
    return Array.from(this.serviceInstances.values()).filter(i => i.regionId === regionId);
  }

  // Perform health check
  async performHealthCheck(): Promise<{ region: string; status: 'healthy' | 'unhealthy' }[]> {
    const results: { region: string; status: 'healthy' | 'unhealthy' }[] = [];

    for (const region of this.regions.values()) {
      // Simulate health check
      const isHealthy = Math.random() > 0.1; // 90% chance of healthy

      results.push({
        region: region.id,
        status: isHealthy ? 'healthy' : 'unhealthy',
      });

      this.updateRegionStatus(region.id, isHealthy ? 'active' : 'degraded');
    }

    return results;
  }

  // Perform failover
  async performFailover(reason: string): Promise<{ success: boolean; from: string; to: string }> {
    const primaryRegion = this.getPrimaryRegion();
    if (!primaryRegion) {
      return { success: false, from: '', to: '' };
    }

    const healthyRegions = this.getHealthyRegions().filter(r => r.id !== primaryRegion.id);
    if (healthyRegions.length === 0) {
      return { success: false, from: primaryRegion.id, to: '' };
    }

    // Select region with lowest latency
    const newPrimary = healthyRegions.reduce((prev, curr) => 
      prev.latency < curr.latency ? prev : curr
    );

    // Update primary status
    this.updateRegionStatus(primaryRegion.id, 'degraded');
    primaryRegion.primary = false;

    // Set new primary
    newPrimary.primary = true;
    this.updateRegionStatus(newPrimary.id, 'active');

    // Record failover
    this.failoverHistory.push({
      timestamp: new Date(),
      from: primaryRegion.id,
      to: newPrimary.id,
      reason,
    });

    return { success: true, from: primaryRegion.id, to: newPrimary.id };
  }

  // Scale service
  async scaleService(service: string, action: 'up' | 'down'): Promise<{ success: boolean; newCount: number }> {
    const instances = this.getServiceInstancesByService(service);
    const currentCount = instances.length;

    if (action === 'up') {
      if (currentCount >= this.autoscalingConfig.maxInstances) {
        return { success: false, newCount: currentCount };
      }

      // Add new instance
      const region = this.getPrimaryRegion();
      if (region) {
        this.addServiceInstance({
          id: `${service}_${Date.now()}`,
          service,
          regionId: region.id,
          status: 'running',
          cpu: 0,
          memory: 0,
          requests: 0,
        });

        return { success: true, newCount: currentCount + 1 };
      }
    } else if (action === 'down') {
      if (currentCount <= this.autoscalingConfig.minInstances) {
        return { success: false, newCount: currentCount };
      }

      // Remove an instance
      const instance = instances.find(i => i.status === 'running');
      if (instance) {
        this.serviceInstances.delete(instance.id);
        return { success: true, newCount: currentCount - 1 };
      }
    }

    return { success: false, newCount: currentCount };
  }

  // Check autoscaling
  async checkAutoscaling(): Promise<{ scaled: boolean; action?: 'up' | 'down' }> {
    if (!this.autoscalingConfig.enabled) {
      return { scaled: false };
    }

    const instances = this.getAllServiceInstances();
    const avgCPU = instances.reduce((sum, i) => sum + i.cpu, 0) / instances.length;
    const avgMemory = instances.reduce((sum, i) => sum + i.memory, 0) / instances.length;

    if (avgCPU > this.autoscalingConfig.targetCPU || avgMemory > this.autoscalingConfig.targetMemory) {
      // Scale up
      const result = await this.scaleService('api', 'up');
      return { scaled: result.success, action: 'up' };
    } else if (avgCPU < this.autoscalingConfig.targetCPU * 0.5 && avgMemory < this.autoscalingConfig.targetMemory * 0.5) {
      // Scale down
      const result = await this.scaleService('api', 'down');
      return { scaled: result.success, action: 'down' };
    }

    return { scaled: false };
  }

  // Get failover history
  getFailoverHistory(): Array<{ timestamp: Date; from: string; to: string; reason: string }> {
    return this.failoverHistory;
  }

  // Get failover config
  getFailoverConfig(): FailoverConfig {
    return { ...this.failoverConfig };
  }

  // Update failover config
  updateFailoverConfig(config: Partial<FailoverConfig>): FailoverConfig {
    Object.assign(this.failoverConfig, config);
    return { ...this.failoverConfig };
  }

  // Get autoscaling config
  getAutoscalingConfig(): AutoscalingConfig {
    return { ...this.autoscalingConfig };
  }

  // Update autoscaling config
  updateAutoscalingConfig(config: Partial<AutoscalingConfig>): AutoscalingConfig {
    Object.assign(this.autoscalingConfig, config);
    return { ...this.autoscalingConfig };
  }

  // Get statistics
  getStatistics(): {
    totalRegions: number;
    healthyRegions: number;
    totalDatabaseClusters: number;
    healthyDatabaseClusters: number;
    totalServiceInstances: number;
    runningServiceInstances: number;
    avgCPU: number;
    avgMemory: number;
    totalFailovers: number;
  } {
    const healthyRegions = this.getHealthyRegions().length;
    const healthyDatabaseClusters = Array.from(this.databaseClusters.values()).filter(c => c.status === 'healthy').length;
    const runningServiceInstances = Array.from(this.serviceInstances.values()).filter(i => i.status === 'running').length;
    const avgCPU = Array.from(this.serviceInstances.values()).reduce((sum, i) => sum + i.cpu, 0) / this.serviceInstances.size || 0;
    const avgMemory = Array.from(this.serviceInstances.values()).reduce((sum, i) => sum + i.memory, 0) / this.serviceInstances.size || 0;

    return {
      totalRegions: this.regions.size,
      healthyRegions,
      totalDatabaseClusters: this.databaseClusters.size,
      healthyDatabaseClusters,
      totalServiceInstances: this.serviceInstances.size,
      runningServiceInstances,
      avgCPU,
      avgMemory,
      totalFailovers: this.failoverHistory.length,
    };
  }
}

// Singleton instance
export const haInfrastructure = new HighAvailabilityInfrastructure();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addRegion(region: Omit<Region, 'lastHealthCheck'>): Region {
  return haInfrastructure.addRegion(region);
}

export function updateRegionStatus(regionId: string, status: Region['status']): Region | null {
  return haInfrastructure.updateRegionStatus(regionId, status);
}

export function getRegion(regionId: string): Region | undefined {
  return haInfrastructure.getRegion(regionId);
}

export function getAllRegions(): Region[] {
  return haInfrastructure.getAllRegions();
}

export function addDatabaseCluster(cluster: Omit<DatabaseCluster, 'lastSync'>): DatabaseCluster {
  return haInfrastructure.addDatabaseCluster(cluster);
}

export function updateDatabaseClusterStatus(clusterId: string, status: DatabaseCluster['status'], lag?: number): DatabaseCluster | null {
  return haInfrastructure.updateDatabaseClusterStatus(clusterId, status, lag);
}

export function getDatabaseCluster(clusterId: string): DatabaseCluster | undefined {
  return haInfrastructure.getDatabaseCluster(clusterId);
}

export function addServiceInstance(instance: Omit<ServiceInstance, 'lastHealthCheck'>): ServiceInstance {
  return haInfrastructure.addServiceInstance(instance);
}

export function updateServiceInstance(instanceId: string, updates: Partial<Omit<ServiceInstance, 'id' | 'service' | 'regionId'>>): ServiceInstance | null {
  return haInfrastructure.updateServiceInstance(instanceId, updates);
}

export function getServiceInstance(instanceId: string): ServiceInstance | undefined {
  return haInfrastructure.getServiceInstance(instanceId);
}

export async function performHealthCheck(): Promise<{ region: string; status: 'healthy' | 'unhealthy' }[]> {
  return haInfrastructure.performHealthCheck();
}

export async function performFailover(reason: string): Promise<{ success: boolean; from: string; to: string }> {
  return haInfrastructure.performFailover(reason);
}

export async function scaleService(service: string, action: 'up' | 'down'): Promise<{ success: boolean; newCount: number }> {
  return haInfrastructure.scaleService(service, action);
}

export async function checkAutoscaling(): Promise<{ scaled: boolean; action?: 'up' | 'down' }> {
  return haInfrastructure.checkAutoscaling();
}

export function getFailoverHistory(): Array<{ timestamp: Date; from: string; to: string; reason: string }> {
  return haInfrastructure.getFailoverHistory();
}

export function getHAStatistics() {
  return haInfrastructure.getStatistics();
}
