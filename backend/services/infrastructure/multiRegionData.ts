// services/infrastructure/multiRegionData.ts - Multi-region data residency compliance
import crypto from 'crypto';

export interface DataRegion {
  regionId: string;
  name: string;
  countryCode: string;
  dataCenter: string;
  latency: number;
  isActive: boolean;
  complianceFrameworks: string[];
}

export interface DataResidencyRule {
  ruleId: string;
  userId: string;
  deviceId?: string;
  entityType: string;
  requiredRegion: string;
  createdAt: number;
  expiresAt?: number;
}

export interface DataTransfer {
  transferId: string;
  dataId: string;
  sourceRegion: string;
  destinationRegion: string;
  transferType: 'replication' | 'migration' | 'backup';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
  dataSize: number;
  complianceCheck: boolean;
}

export class MultiRegionDataService {
  private regions: Map<string, DataRegion> = new Map();
  private residencyRules: Map<string, DataResidencyRule> = new Map();
  private dataTransfers: Map<string, DataTransfer> = new Map();
  private dataLocations: Map<string, string> = new Map(); // dataId -> regionId

  constructor() {
    this.initializeRegions();
  }

  /**
   * Initialize data regions
   */
  private initializeRegions(): void {
    const regions: DataRegion[] = [
      {
        regionId: 'us-east',
        name: 'US East',
        countryCode: 'US',
        dataCenter: 'AWS US-East-1',
        latency: 50,
        isActive: true,
        complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA']
      },
      {
        regionId: 'us-west',
        name: 'US West',
        countryCode: 'US',
        dataCenter: 'AWS US-West-2',
        latency: 60,
        isActive: true,
        complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA']
      },
      {
        regionId: 'eu-west',
        name: 'EU West',
        countryCode: 'IE',
        dataCenter: 'AWS EU-West-1',
        latency: 80,
        isActive: true,
        complianceFrameworks: ['GDPR']
      },
      {
        regionId: 'eu-central',
        name: 'EU Central',
        countryCode: 'DE',
        dataCenter: 'AWS EU-Central-1',
        latency: 75,
        isActive: true,
        complianceFrameworks: ['GDPR']
      },
      {
        regionId: 'ap-south',
        name: 'Asia Pacific South',
        countryCode: 'IN',
        dataCenter: 'AWS AP-South-1',
        latency: 120,
        isActive: true,
        complianceFrameworks: ['DPDP']
      },
      {
        regionId: 'ap-southeast',
        name: 'Asia Pacific Southeast',
        countryCode: 'SG',
        dataCenter: 'AWS AP-Southeast-1',
        latency: 100,
        isActive: true,
        complianceFrameworks: ['PDPA']
      },
      {
        regionId: 'sa-east',
        name: 'South America East',
        countryCode: 'BR',
        dataCenter: 'AWS SA-East-1',
        latency: 150,
        isActive: true,
        complianceFrameworks: ['LGPD']
      }
    ];

    for (const region of regions) {
      this.regions.set(region.regionId, region);
    }
  }

  /**
   * Set data residency rule for user
   */
  setResidencyRule(
    userId: string,
    entityType: string,
    requiredRegion: string,
    deviceId?: string,
    ttl?: number
  ): DataResidencyRule {
    const ruleId = crypto.randomBytes(16).toString('hex');
    
    const rule: DataResidencyRule = {
      ruleId,
      userId,
      deviceId,
      entityType,
      requiredRegion,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined
    };

    this.residencyRules.set(ruleId, rule);
    return rule;
  }

  /**
   * Get required region for data
   */
  getRequiredRegion(userId: string, entityType: string, deviceId?: string): string | null {
    const rules = Array.from(this.residencyRules.values())
      .filter(rule => 
        rule.userId === userId &&
        rule.entityType === entityType &&
        (!rule.deviceId || rule.deviceId === deviceId) &&
        (!rule.expiresAt || Date.now() < rule.expiresAt)
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    if (rules.length > 0) {
      return rules[0].requiredRegion;
    }

    // Default to US-East if no rule
    return 'us-east';
  }

  /**
   * Store data in specified region
   */
  storeData(
    dataId: string,
    userId: string,
    entityType: string,
    data: any,
    deviceId?: string
  ): { regionId: string; success: boolean } {
    const requiredRegion = this.getRequiredRegion(userId, entityType, deviceId);
    
    if (!requiredRegion) {
      return { regionId: '', success: false };
    }

    const region = this.regions.get(requiredRegion);
    
    if (!region || !region.isActive) {
      return { regionId: '', success: false };
    }

    // Store data location
    this.dataLocations.set(dataId, requiredRegion);

    return { regionId: requiredRegion, success: true };
  }

  /**
   * Retrieve data location
   */
  getDataLocation(dataId: string): string | null {
    return this.dataLocations.get(dataId) || null;
  }

  /**
   * Check if data transfer is compliant
   */
  checkTransferCompliance(
    sourceRegion: string,
    destinationRegion: string,
    dataId: string
  ): { compliant: boolean; reason?: string } {
    const sourceRegionData = this.regions.get(sourceRegion);
    const destRegionData = this.regions.get(destinationRegion);

    if (!sourceRegionData || !destRegionData) {
      return { compliant: false, reason: 'Invalid region' };
    }

    if (!destRegionData.isActive) {
      return { compliant: false, reason: 'Destination region not active' };
    }

    // Check if both regions have compatible compliance frameworks
    const sourceFrameworks = sourceRegionData.complianceFrameworks;
    const destFrameworks = destRegionData.complianceFrameworks;

    // If source has GDPR, destination must also have GDPR
    if (sourceFrameworks.includes('GDPR') && !destFrameworks.includes('GDPR')) {
      return { compliant: false, reason: 'GDPR data cannot be transferred to non-GDPR region' };
    }

    return { compliant: true };
  }

  /**
   * Initiate data transfer
   */
  async initiateTransfer(
    dataId: string,
    destinationRegion: string,
    transferType: 'replication' | 'migration' | 'backup'
  ): Promise<DataTransfer> {
    const sourceRegion = this.getDataLocation(dataId);
    
    if (!sourceRegion) {
      throw new Error('Data location not found');
    }

    const complianceCheck = this.checkTransferCompliance(sourceRegion, destinationRegion, dataId);
    
    if (!complianceCheck.compliant) {
      throw new Error(complianceCheck.reason || 'Transfer not compliant');
    }

    const transferId = crypto.randomBytes(16).toString('hex');
    const dataSize = Math.floor(Math.random() * 1000000); // Simulated data size

    const transfer: DataTransfer = {
      transferId,
      dataId,
      sourceRegion,
      destinationRegion,
      transferType,
      status: 'pending',
      timestamp: Date.now(),
      dataSize,
      complianceCheck: true
    };

    this.dataTransfers.set(transferId, transfer);

    // Process transfer
    await this.processTransfer(transferId);

    return transfer;
  }

  /**
   * Process data transfer
   */
  private async processTransfer(transferId: string): Promise<void> {
    const transfer = this.dataTransfers.get(transferId);
    
    if (!transfer) {
      return;
    }

    transfer.status = 'in_progress';
    this.dataTransfers.set(transferId, transfer);

    // Simulate transfer delay based on region latency
    const sourceRegion = this.regions.get(transfer.sourceRegion);
    const destRegion = this.regions.get(transfer.destinationRegion);
    const latency = (sourceRegion?.latency || 50) + (destRegion?.latency || 50);
    
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate transfer success (95% success rate)
    const success = Math.random() > 0.05;

    if (success) {
      transfer.status = 'completed';
      
      // Update data location if migration
      if (transfer.transferType === 'migration') {
        this.dataLocations.set(transfer.dataId, transfer.destinationRegion);
      }
    } else {
      transfer.status = 'failed';
    }

    this.dataTransfers.set(transferId, transfer);
  }

  /**
   * Get transfer status
   */
  getTransferStatus(transferId: string): DataTransfer | null {
    return this.dataTransfers.get(transferId) || null;
  }

  /**
   * Get all regions
   */
  getAllRegions(): DataRegion[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get active regions
   */
  getActiveRegions(): DataRegion[] {
    return Array.from(this.regions.values()).filter(r => r.isActive);
  }

  /**
   * Get region by ID
   */
  getRegion(regionId: string): DataRegion | null {
    return this.regions.get(regionId) || null;
  }

  /**
   * Get residency rules for user
   */
  getResidencyRules(userId: string): DataResidencyRule[] {
    return Array.from(this.residencyRules.values())
      .filter(rule => rule.userId === userId);
  }

  /**
   * Delete residency rule
   */
  deleteResidencyRule(ruleId: string): boolean {
    return this.residencyRules.delete(ruleId);
  }

  /**
   * Activate region
   */
  activateRegion(regionId: string): boolean {
    const region = this.regions.get(regionId);
    
    if (region) {
      region.isActive = true;
      this.regions.set(regionId, region);
      return true;
    }

    return false;
  }

  /**
   * Deactivate region
   */
  deactivateRegion(regionId: string): boolean {
    const region = this.regions.get(regionId);
    
    if (region) {
      region.isActive = false;
      this.regions.set(regionId, region);
      return true;
    }

    return false;
  }

  /**
   * Get data distribution
   */
  getDataDistribution(): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};

    for (const regionId of this.dataLocations.values()) {
      distribution[regionId] = (distribution[regionId] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get transfer statistics
   */
  getTransferStatistics(): {
    totalTransfers: number;
    transfersByStatus: { [key: string]: number };
    transfersByType: { [key: string]: number };
    totalDataTransferred: number;
  } {
    const transfers = Array.from(this.dataTransfers.values());

    const transfersByStatus: { [key: string]: number } = {};
    const transfersByType: { [key: string]: number } = {};
    let totalDataTransferred = 0;

    for (const transfer of transfers) {
      transfersByStatus[transfer.status] = (transfersByStatus[transfer.status] || 0) + 1;
      transfersByType[transfer.transferType] = (transfersByType[transfer.transferType] || 0) + 1;
      
      if (transfer.status === 'completed') {
        totalDataTransferred += transfer.dataSize;
      }
    }

    return {
      totalTransfers: transfers.length,
      transfersByStatus,
      transfersByType,
      totalDataTransferred
    };
  }

  /**
   * Clear old transfers
   */
  clearOldTransfers(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [transferId, transfer] of this.dataTransfers.entries()) {
      if (now - transfer.timestamp > maxAge && transfer.status === 'completed') {
        this.dataTransfers.delete(transferId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export residency rules
   */
  exportResidencyRules(userId?: string): string {
    const rules = userId
      ? Array.from(this.residencyRules.values()).filter(r => r.userId === userId)
      : Array.from(this.residencyRules.values());
    
    return JSON.stringify(rules, null, 2);
  }

  /**
   * Import residency rules
   */
  importResidencyRules(rules: DataResidencyRule[]): number {
    let imported = 0;

    for (const rule of rules) {
      if (!this.residencyRules.has(rule.ruleId)) {
        this.residencyRules.set(rule.ruleId, rule);
        imported++;
      }
    }

    return imported;
  }
}

export const multiRegionDataService = new MultiRegionDataService();
