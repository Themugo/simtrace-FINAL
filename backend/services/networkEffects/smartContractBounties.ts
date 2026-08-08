// services/networkEffects/smartContractBounties.ts - Smart contract-based recovery bounties
import crypto from 'crypto';

export interface BountyContract {
  contractId: string;
  deviceId: string;
  imei: string;
  ownerId: string;
  bountyAmount: number;
  currency: 'ETH' | 'BTC' | 'USDC' | 'USDT';
  status: 'active' | 'claimed' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  contractAddress: string;
  blockchain: 'ethereum' | 'bitcoin' | 'polygon' | 'bsc';
  terms: string;
}

export interface BountyClaim {
  claimId: string;
  contractId: string;
  claimantId: string;
  evidence: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  transactionHash?: string;
}

export interface BountyEscrow {
  escrowId: string;
  contractId: string;
  amount: number;
  currency: string;
  depositedAt: number;
  status: 'locked' | 'released' | 'refunded';
  releaseCondition: string;
}

export class SmartContractBountyService {
  private contracts: Map<string, BountyContract> = new Map();
  private claims: Map<string, BountyClaim> = new Map();
  private escrows: Map<string, BountyEscrow> = new Map();

  /**
   * Create bounty contract
   */
  createContract(
    deviceId: string,
    imei: string,
    ownerId: string,
    bountyAmount: number,
    currency: 'ETH' | 'BTC' | 'USDC' | 'USDT' = 'USDC',
    blockchain: 'ethereum' | 'bitcoin' | 'polygon' | 'bsc' = 'polygon',
    ttl: number = 2592000000 // 30 days default
  ): BountyContract {
    const contractId = crypto.randomBytes(16).toString('hex');
    const contractAddress = this.generateContractAddress(blockchain);

    const contract: BountyContract = {
      contractId,
      deviceId,
      imei,
      ownerId,
      bountyAmount,
      currency,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      contractAddress,
      blockchain,
      terms: 'Bounty will be paid to the first verified claimant who provides verifiable evidence of device location and recovery assistance.'
    };

    this.contracts.set(contractId, contract);

    // Create escrow
    this.createEscrow(contractId, bountyAmount, currency);

    return contract;
  }

  /**
   * Generate mock contract address
   */
  private generateContractAddress(blockchain: string): string {
    const prefix = blockchain === 'ethereum' || blockchain === 'polygon' ? '0x' : '';
    const address = crypto.randomBytes(20).toString('hex');
    return prefix + address;
  }

  /**
   * Create escrow for bounty
   */
  private createEscrow(contractId: string, amount: number, currency: string): BountyEscrow {
    const escrowId = crypto.randomBytes(16).toString('hex');

    const escrow: BountyEscrow = {
      escrowId,
      contractId,
      amount,
      currency,
      depositedAt: Date.now(),
      status: 'locked',
      releaseCondition: 'device_recovered'
    };

    this.escrows.set(escrowId, escrow);
    return escrow;
  }

  /**
   * Submit bounty claim
   */
  submitClaim(
    contractId: string,
    claimantId: string,
    evidence: string[],
    location: { latitude: number; longitude: number }
  ): BountyClaim {
    const contract = this.contracts.get(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'active') {
      throw new Error('Contract is not active');
    }

    if (Date.now() > contract.expiresAt) {
      throw new Error('Contract has expired');
    }

    const claimId = crypto.randomBytes(16).toString('hex');

    const claim: BountyClaim = {
      claimId,
      contractId,
      claimantId,
      evidence,
      location,
      timestamp: Date.now(),
      status: 'pending',
      verified: false
    };

    this.claims.set(claimId, claim);
    return claim;
  }

  /**
   * Verify claim
   */
  verifyClaim(claimId: string, verified: boolean): boolean {
    const claim = this.claims.get(claimId);
    
    if (!claim || claim.verified) {
      return false;
    }

    claim.verified = verified;
    
    if (verified) {
      claim.status = 'approved';
      
      // Generate transaction hash
      claim.transactionHash = this.generateTransactionHash();
      
      // Release escrow
      this.releaseEscrow(claim.contractId);
      
      // Update contract status
      const contract = this.contracts.get(claim.contractId);
      if (contract) {
        contract.status = 'claimed';
        this.contracts.set(contract.contractId, contract);
      }
    } else {
      claim.status = 'rejected';
    }

    this.claims.set(claimId, claim);
    return true;
  }

  /**
   * Generate mock transaction hash
   */
  private generateTransactionHash(): string {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Release escrow
   */
  private releaseEscrow(contractId: string): void {
    for (const [escrowId, escrow] of this.escrows.entries()) {
      if (escrow.contractId === contractId && escrow.status === 'locked') {
        escrow.status = 'released';
        this.escrows.set(escrowId, escrow);
      }
    }
  }

  /**
   * Refund escrow
   */
  refundEscrow(contractId: string): boolean {
    let refunded = false;

    for (const [escrowId, escrow] of this.escrows.entries()) {
      if (escrow.contractId === contractId && escrow.status === 'locked') {
        escrow.status = 'refunded';
        this.escrows.set(escrowId, escrow);
        refunded = true;
      }
    }

    return refunded;
  }

  /**
   * Cancel contract
   */
  cancelContract(contractId: string): boolean {
    const contract = this.contracts.get(contractId);
    
    if (!contract || contract.status !== 'active') {
      return false;
    }

    contract.status = 'cancelled';
    this.contracts.set(contractId, contract);

    // Refund escrow
    this.refundEscrow(contractId);

    return true;
  }

  /**
   * Get contract status
   */
  getContract(contractId: string): BountyContract | null {
    return this.contracts.get(contractId) || null;
  }

  /**
   * Get contracts for device
   */
  getContractsForDevice(deviceId: string): BountyContract[] {
    return Array.from(this.contracts.values())
      .filter(c => c.deviceId === deviceId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get contracts for owner
   */
  getContractsForOwner(ownerId: string): BountyContract[] {
    return Array.from(this.contracts.values())
      .filter(c => c.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get active contracts
   */
  getActiveContracts(): BountyContract[] {
    const now = Date.now();
    return Array.from(this.contracts.values())
      .filter(c => c.status === 'active' && now < c.expiresAt);
  }

  /**
   * Get claim status
   */
  getClaim(claimId: string): BountyClaim | null {
    return this.claims.get(claimId) || null;
  }

  /**
   * Get claims for contract
   */
  getClaimsForContract(contractId: string): BountyClaim[] {
    return Array.from(this.claims.values())
      .filter(c => c.contractId === contractId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get claims for claimant
   */
  getClaimsForClaimant(claimantId: string): BountyClaim[] {
    return Array.from(this.claims.values())
      .filter(c => c.claimantId === claimantId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get escrow status
   */
  getEscrow(contractId: string): BountyEscrow | null {
    for (const escrow of this.escrows.values()) {
      if (escrow.contractId === contractId) {
        return escrow;
      }
    }
    return null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalContracts: number;
    activeContracts: number;
    claimedContracts: number;
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    totalBountyAmount: number;
    totalPaidAmount: number;
    byBlockchain: { [key: string]: number };
    byCurrency: { [key: string]: number };
  } {
    const contracts = Array.from(this.contracts.values());
    const claims = Array.from(this.claims.values());

    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const claimedContracts = contracts.filter(c => c.status === 'claimed').length;
    const approvedClaims = claims.filter(c => c.status === 'approved').length;
    const rejectedClaims = claims.filter(c => c.status === 'rejected').length;

    const totalBountyAmount = contracts.reduce((sum, c) => sum + c.bountyAmount, 0);
    const totalPaidAmount = contracts.filter(c => c.status === 'claimed').reduce((sum, c) => sum + c.bountyAmount, 0);

    const byBlockchain: { [key: string]: number } = {};
    const byCurrency: { [key: string]: number } = {};

    for (const contract of contracts) {
      byBlockchain[contract.blockchain] = (byBlockchain[contract.blockchain] || 0) + 1;
      byCurrency[contract.currency] = (byCurrency[contract.currency] || 0) + 1;
    }

    return {
      totalContracts: contracts.length,
      activeContracts,
      claimedContracts,
      totalClaims: claims.length,
      approvedClaims,
      rejectedClaims,
      totalBountyAmount,
      totalPaidAmount,
      byBlockchain,
      byCurrency
    };
  }

  /**
   * Clear expired contracts
   */
  clearExpiredContracts(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [contractId, contract] of this.contracts.entries()) {
      if (now > contract.expiresAt && contract.status === 'active') {
        contract.status = 'expired';
        this.contracts.set(contractId, contract);
        
        // Refund escrow
        this.refundEscrow(contractId);
        
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export contracts
   */
  exportContracts(ownerId?: string): string {
    const contracts = ownerId
      ? Array.from(this.contracts.values()).filter(c => c.ownerId === ownerId)
      : Array.from(this.contracts.values());
    
    return JSON.stringify(contracts, null, 2);
  }

  /**
   * Import contracts
   */
  importContracts(contracts: BountyContract[]): number {
    let imported = 0;

    for (const contract of contracts) {
      if (!this.contracts.has(contract.contractId)) {
        this.contracts.set(contract.contractId, contract);
        imported++;
      }
    }

    return imported;
  }
}

export const smartContractBountyService = new SmartContractBountyService();
