// services/security/blockchainEvidence.ts - Blockchain-based immutable evidence chain
import crypto from 'crypto';

export interface EvidenceBlock {
  blockNumber: number;
  timestamp: number;
  evidenceHash: string;
  previousHash: string;
  data: EvidenceData;
  signature: string;
  validator: string;
}

export interface EvidenceData {
  deviceId: string;
  eventType: string;
  eventData: any;
  userId?: string;
  location?: { lat: number; lng: number };
  metadata: {
    source: string;
    trustLevel: number;
    verified: boolean;
  };
}

export interface BlockchainEvidence {
  block: EvidenceBlock;
  chainLength: number;
  isValid: boolean;
  confirmationCount: number;
}

export class BlockchainEvidenceService {
  private chain: EvidenceBlock[] = [];
  private validators: string[] = [];

  constructor() {
    // Initialize genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the genesis block
   */
  private createGenesisBlock(): void {
    const genesisBlock: EvidenceBlock = {
      blockNumber: 0,
      timestamp: Date.now(),
      evidenceHash: this.calculateHash('genesis', '', 0),
      previousHash: '0',
      data: {
        deviceId: 'genesis',
        eventType: 'system_init',
        eventData: { message: 'Genesis block created' },
        metadata: {
          source: 'system',
          trustLevel: 1.0,
          verified: true
        }
      },
      signature: this.signBlock('genesis', 0),
      validator: 'system'
    };

    this.chain.push(genesisBlock);
  }

  /**
   * Add evidence to the blockchain
   */
  async addEvidence(evidenceData: EvidenceData): Promise<BlockchainEvidence> {
    // Validate evidence data
    if (!this.validateEvidenceData(evidenceData)) {
      throw new Error('Invalid evidence data');
    }

    // Calculate evidence hash
    const evidenceHash = this.calculateEvidenceHash(evidenceData);

    // Get previous block
    const previousBlock = this.chain[this.chain.length - 1];

    // Create new block
    const newBlock: EvidenceBlock = {
      blockNumber: this.chain.length,
      timestamp: Date.now(),
      evidenceHash,
      previousHash: previousBlock.evidenceHash,
      data: evidenceData,
      signature: this.signBlock(evidenceHash, this.chain.length),
      validator: this.selectValidator()
    };

    // Add to chain
    this.chain.push(newBlock);

    // Verify chain integrity
    const isValid = this.verifyChain();

    return {
      block: newBlock,
      chainLength: this.chain.length,
      isValid,
      confirmationCount: this.calculateConfirmations(newBlock.blockNumber)
    };
  }

  /**
   * Get evidence by block number
   */
  getEvidence(blockNumber: number): BlockchainEvidence | null {
    const block = this.chain[blockNumber];
    
    if (!block) {
      return null;
    }

    return {
      block,
      chainLength: this.chain.length,
      isValid: this.verifyChain(),
      confirmationCount: this.calculateConfirmations(blockNumber)
    };
  }

  /**
   * Get evidence by device ID
   */
  getEvidenceByDevice(deviceId: string): EvidenceBlock[] {
    return this.chain.filter(block => block.data.deviceId === deviceId);
  }

  /**
   * Get evidence by event type
   */
  getEvidenceByEventType(eventType: string): EvidenceBlock[] {
    return this.chain.filter(block => block.data.eventType === eventType);
  }

  /**
   * Verify the integrity of the blockchain
   */
  verifyChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify hash chain
      if (currentBlock.previousHash !== previousBlock.evidenceHash) {
        return false;
      }

      // Verify block hash
      const calculatedHash = this.calculateHash(
        JSON.stringify(currentBlock.data),
        currentBlock.previousHash,
        currentBlock.blockNumber
      );

      if (calculatedHash !== currentBlock.evidenceHash) {
        return false;
      }

      // Verify signature
      if (!this.verifySignature(currentBlock)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify a specific block
   */
  verifyBlock(blockNumber: number): boolean {
    const block = this.chain[blockNumber];
    
    if (!block) {
      return false;
    }

    if (blockNumber === 0) {
      return true; // Genesis block is always valid
    }

    const previousBlock = this.chain[blockNumber - 1];

    // Verify hash chain
    if (block.previousHash !== previousBlock.evidenceHash) {
      return false;
    }

    // Verify block hash
    const calculatedHash = this.calculateHash(
      JSON.stringify(block.data),
      block.previousHash,
      block.blockNumber
    );

    if (calculatedHash !== block.evidenceHash) {
      return false;
    }

    // Verify signature
    return this.verifySignature(block);
  }

  /**
   * Get blockchain statistics
   */
  getStatistics(): {
    totalBlocks: number;
    totalEvidence: number;
    chainValid: boolean;
    latestBlock: EvidenceBlock;
    validators: string[];
    evidenceTypes: { [key: string]: number };
  } {
    const evidenceTypes: { [key: string]: number } = {};
    
    for (const block of this.chain) {
      const eventType = block.data.eventType;
      evidenceTypes[eventType] = (evidenceTypes[eventType] || 0) + 1;
    }

    return {
      totalBlocks: this.chain.length,
      totalEvidence: this.chain.length - 1, // Exclude genesis block
      chainValid: this.verifyChain(),
      latestBlock: this.chain[this.chain.length - 1],
      validators: this.validators,
      evidenceTypes
    };
  }

  /**
   * Add a validator to the network
   */
  addValidator(validatorId: string): void {
    if (!this.validators.includes(validatorId)) {
      this.validators.push(validatorId);
    }
  }

  /**
   * Remove a validator from the network
   */
  removeValidator(validatorId: string): boolean {
    const index = this.validators.indexOf(validatorId);
    if (index > -1) {
      this.validators.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get evidence chain for a device
   */
  getDeviceEvidenceChain(deviceId: string): EvidenceBlock[] {
    return this.getEvidenceByDevice(deviceId)
      .sort((a, b) => a.blockNumber - b.blockNumber);
  }

  /**
   * Search evidence by time range
   */
  searchEvidenceByTime(startTime: number, endTime: number): EvidenceBlock[] {
    return this.chain.filter(block => 
      block.timestamp >= startTime && block.timestamp <= endTime
    );
  }

  /**
   * Search evidence by location
   */
  searchEvidenceByLocation(
    center: { lat: number; lng: number },
    radius: number
  ): EvidenceBlock[] {
    return this.chain.filter(block => {
      if (!block.data.location) return false;
      
      const distance = this.calculateDistance(
        center,
        block.data.location
      );
      
      return distance <= radius;
    });
  }

  /**
   * Export blockchain for backup
   */
  exportChain(): string {
    return JSON.stringify(this.chain, null, 2);
  }

  /**
   * Import blockchain from backup
   */
  importChain(chainData: string): boolean {
    try {
      const importedChain = JSON.parse(chainData) as EvidenceBlock[];
      
      // Validate imported chain
      if (!Array.isArray(importedChain) || importedChain.length === 0) {
        return false;
      }

      // Verify each block
      for (const block of importedChain) {
        if (!this.validateBlockStructure(block)) {
          return false;
        }
      }

      // Replace current chain
      this.chain = importedChain;
      
      return this.verifyChain();
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate hash for a block
   */
  private calculateHash(data: string, previousHash: string, blockNumber: number): string {
    return crypto.createHash('sha256')
      .update(data)
      .update(previousHash)
      .update(blockNumber.toString())
      .digest('hex');
  }

  /**
   * Calculate evidence hash
   */
  private calculateEvidenceHash(evidenceData: EvidenceData): string {
    return crypto.createHash('sha256')
      .update(JSON.stringify(evidenceData))
      .digest('hex');
  }

  /**
   * Sign a block
   */
  private signBlock(hash: string, blockNumber: number): string {
    const signatureData = `${hash}:${blockNumber}:${Date.now()}`;
    return crypto.createHash('sha256').update(signatureData).digest('hex');
  }

  /**
   * Verify block signature
   */
  private verifySignature(block: EvidenceBlock): boolean {
    // In production, this would use actual cryptographic signature verification
    // For now, we simulate it by recalculating the signature
    const expectedSignature = this.signBlock(block.evidenceHash, block.blockNumber);
    return block.signature === expectedSignature;
  }

  /**
   * Validate evidence data structure
   */
  private validateEvidenceData(data: EvidenceData): boolean {
    return !!(
      data.deviceId &&
      data.eventType &&
      data.eventData &&
      data.metadata &&
      data.metadata.source &&
      typeof data.metadata.trustLevel === 'number'
    );
  }

  /**
   * Validate block structure
   */
  private validateBlockStructure(block: EvidenceBlock): boolean {
    return !!(
      block.blockNumber !== undefined &&
      block.timestamp &&
      block.evidenceHash &&
      block.previousHash &&
      block.data &&
      block.signature &&
      block.validator
    );
  }

  /**
   * Select a validator for the next block
   */
  private selectValidator(): string {
    if (this.validators.length === 0) {
      return 'system';
    }
    
    const randomIndex = Math.floor(Math.random() * this.validators.length);
    return this.validators[randomIndex];
  }

  /**
   * Calculate confirmations for a block
   */
  private calculateConfirmations(blockNumber: number): number {
    return this.chain.length - blockNumber - 1;
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get chain length
   */
  getChainLength(): number {
    return this.chain.length;
  }

  /**
   * Get latest block
   */
  getLatestBlock(): EvidenceBlock {
    return this.chain[this.chain.length - 1];
  }
}

export const blockchainEvidenceService = new BlockchainEvidenceService();
