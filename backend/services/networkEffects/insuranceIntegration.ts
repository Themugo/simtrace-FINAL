// services/networkEffects/insuranceIntegration.ts - Integration with insurance companies
import crypto from 'crypto';

export interface InsuranceProvider {
  providerId: string;
  name: string;
  countryCode: string;
  apiEndpoint: string;
  contactEmail: string;
  contactPhone: string;
  supportedPolicies: string[];
  isActive: boolean;
  averageClaimTime: number; // in days
  successRate: number;
}

export interface InsurancePolicy {
  policyId: string;
  deviceId: string;
  imei: string;
  userId: string;
  providerId: string;
  policyNumber: string;
  policyType: 'theft' | 'damage' | 'loss' | 'comprehensive';
  coverageAmount: number;
  premium: number;
  deductible: number;
  startDate: number;
  endDate: number;
  status: 'active' | 'expired' | 'cancelled' | 'claimed';
}

export interface InsuranceClaim {
  claimId: string;
  policyId: string;
  deviceId: string;
  userId: string;
  claimType: 'theft' | 'damage' | 'loss';
  incidentDate: number;
  claimDate: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'in_review' | 'paid';
  evidence: string[];
  description: string;
  policeReportNumber?: string;
  approvedAmount?: number;
  processedDate?: number;
}

export class InsuranceIntegrationService {
  private providers: Map<string, InsuranceProvider> = new Map();
  private policies: Map<string, InsurancePolicy> = new Map();
  private claims: Map<string, InsuranceClaim> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize insurance providers
   */
  private initializeProviders(): void {
    const providers: InsuranceProvider[] = [
      {
        providerId: 'aig',
        name: 'AIG',
        countryCode: 'US',
        apiEndpoint: 'https://api.aig.com',
        contactEmail: 'claims@aig.com',
        contactPhone: '+1 800 225 5324',
        supportedPolicies: ['theft', 'damage', 'loss', 'comprehensive'],
        isActive: true,
        averageClaimTime: 14,
        successRate: 85
      },
      {
        providerId: 'allianz',
        name: 'Allianz',
        countryCode: 'DE',
        apiEndpoint: 'https://api.allianz.com',
        contactEmail: 'claims@allianz.com',
        contactPhone: '+49 89 3800 0',
        supportedPolicies: ['theft', 'damage', 'loss', 'comprehensive'],
        isActive: true,
        averageClaimTime: 10,
        successRate: 88
      },
      {
        providerId: 'jubilee',
        name: 'Jubilee Insurance',
        countryCode: 'KE',
        apiEndpoint: 'https://api.jubilee.co.ke',
        contactEmail: 'claims@jubilee.co.ke',
        contactPhone: '+254 20 328 6000',
        supportedPolicies: ['theft', 'damage', 'comprehensive'],
        isActive: true,
        averageClaimTime: 7,
        successRate: 80
      },
      {
        providerId: 'santam',
        name: 'Santam',
        countryCode: 'ZA',
        apiEndpoint: 'https://api.santam.co.za',
        contactEmail: 'claims@santam.co.za',
        contactPhone: '+27 21 409 9111',
        supportedPolicies: ['theft', 'damage', 'loss', 'comprehensive'],
        isActive: true,
        averageClaimTime: 12,
        successRate: 82
      }
    ];

    for (const provider of providers) {
      this.providers.set(provider.providerId, provider);
    }
  }

  /**
   * Register new insurance provider
   */
  registerProvider(provider: Omit<InsuranceProvider, 'providerId'>): InsuranceProvider {
    const providerId = crypto.randomBytes(16).toString('hex');
    
    const newProvider: InsuranceProvider = {
      ...provider,
      providerId
    };

    this.providers.set(providerId, newProvider);
    return newProvider;
  }

  /**
   * Create insurance policy
   */
  createPolicy(
    deviceId: string,
    imei: string,
    userId: string,
    providerId: string,
    policyType: 'theft' | 'damage' | 'loss' | 'comprehensive',
    coverageAmount: number,
    premium: number,
    deductible: number,
    duration: number = 31536000000 // 1 year default
  ): InsurancePolicy {
    const policyId = crypto.randomBytes(16).toString('hex');
    const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const policy: InsurancePolicy = {
      policyId,
      deviceId,
      imei,
      userId,
      providerId,
      policyNumber,
      policyType,
      coverageAmount,
      premium,
      deductible,
      startDate: Date.now(),
      endDate: Date.now() + duration,
      status: 'active'
    };

    this.policies.set(policyId, policy);
    return policy;
  }

  /**
   * Submit insurance claim
   */
  submitClaim(
    policyId: string,
    claimType: 'theft' | 'damage' | 'loss',
    incidentDate: number,
    amount: number,
    evidence: string[],
    description: string,
    policeReportNumber?: string
  ): InsuranceClaim {
    const policy = this.policies.get(policyId);
    
    if (!policy) {
      throw new Error('Policy not found');
    }

    if (policy.status !== 'active') {
      throw new Error('Policy is not active');
    }

    if (Date.now() > policy.endDate) {
      throw new Error('Policy has expired');
    }

    const claimId = crypto.randomBytes(16).toString('hex');

    const claim: InsuranceClaim = {
      claimId,
      policyId,
      deviceId: policy.deviceId,
      userId: policy.userId,
      claimType,
      incidentDate,
      claimDate: Date.now(),
      amount,
      status: 'pending',
      evidence,
      description,
      policeReportNumber
    };

    this.claims.set(claimId, claim);

    // Update policy status
    policy.status = 'claimed';
    this.policies.set(policyId, policy);

    return claim;
  }

  /**
   * Process claim (simulate provider processing)
   */
  async processClaim(claimId: string): Promise<InsuranceClaim> {
    const claim = this.claims.get(claimId);
    
    if (!claim) {
      throw new Error('Claim not found');
    }

    const policy = this.policies.get(claim.policyId);
    const provider = policy ? this.providers.get(policy.providerId) : null;

    claim.status = 'in_review';
    this.claims.set(claimId, claim);

    // Simulate processing delay based on provider
    const processingTime = provider ? provider.averageClaimTime * 86400000 : 1209600000; // Convert days to ms
    await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 5000))); // Cap at 5s for demo

    // Simulate approval based on provider success rate
    const successRate = provider ? provider.successRate : 80;
    const approved = Math.random() * 100 < successRate;

    if (approved) {
      claim.status = 'approved';
      claim.approvedAmount = Math.min(claim.amount, policy ? policy.coverageAmount : claim.amount);
      claim.processedDate = Date.now();
    } else {
      claim.status = 'rejected';
      claim.processedDate = Date.now();
    }

    this.claims.set(claimId, claim);

    return claim;
  }

  /**
   * Get claim status
   */
  getClaimStatus(claimId: string): InsuranceClaim | null {
    return this.claims.get(claimId) || null;
  }

  /**
   * Get claims for user
   */
  getClaimsForUser(userId: string): InsuranceClaim[] {
    return Array.from(this.claims.values())
      .filter(claim => claim.userId === userId)
      .sort((a, b) => b.claimDate - a.claimDate);
  }

  /**
   * Get claims for device
   */
  getClaimsForDevice(deviceId: string): InsuranceClaim[] {
    return Array.from(this.claims.values())
      .filter(claim => claim.deviceId === deviceId)
      .sort((a, b) => b.claimDate - a.claimDate);
  }

  /**
   * Get policies for user
   */
  getPoliciesForUser(userId: string): InsurancePolicy[] {
    return Array.from(this.policies.values())
      .filter(policy => policy.userId === userId)
      .sort((a, b) => b.startDate - a.startDate);
  }

  /**
   * Get policy for device
   */
  getPolicyForDevice(deviceId: string): InsurancePolicy | null {
    const policies = Array.from(this.policies.values())
      .filter(policy => policy.deviceId === deviceId && policy.status === 'active');
    
    return policies.length > 0 ? policies[0] : null;
  }

  /**
   * Get all providers
   */
  getAllProviders(): InsuranceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get active providers
   */
  getActiveProviders(): InsuranceProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): InsuranceProvider | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get providers by country
   */
  getProvidersByCountry(countryCode: string): InsuranceProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.countryCode === countryCode);
  }

  /**
   * Cancel policy
   */
  cancelPolicy(policyId: string): boolean {
    const policy = this.policies.get(policyId);
    
    if (!policy || policy.status === 'claimed') {
      return false;
    }

    policy.status = 'cancelled';
    this.policies.set(policyId, policy);
    return true;
  }

  /**
   * Renew policy
   */
  renewPolicy(policyId: string, duration: number = 31536000000): InsurancePolicy | null {
    const policy = this.policies.get(policyId);
    
    if (!policy || policy.status !== 'active') {
      return null;
    }

    policy.endDate = Date.now() + duration;
    this.policies.set(policyId, policy);
    return policy;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalProviders: number;
    activeProviders: number;
    totalPolicies: number;
    activePolicies: number;
    totalClaims: number;
    claimsByStatus: { [key: string]: number };
    totalClaimedAmount: number;
    totalApprovedAmount: number;
    averageClaimTime: number;
  } {
    const providers = Array.from(this.providers.values());
    const policies = Array.from(this.policies.values());
    const claims = Array.from(this.claims.values());

    const claimsByStatus: { [key: string]: number } = {};
    let totalClaimedAmount = 0;
    let totalApprovedAmount = 0;

    for (const claim of claims) {
      claimsByStatus[claim.status] = (claimsByStatus[claim.status] || 0) + 1;
      totalClaimedAmount += claim.amount;
      if (claim.approvedAmount) {
        totalApprovedAmount += claim.approvedAmount;
      }
    }

    const averageClaimTime = providers.length > 0
      ? providers.reduce((sum, p) => sum + p.averageClaimTime, 0) / providers.length
      : 0;

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.isActive).length,
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.status === 'active').length,
      totalClaims: claims.length,
      claimsByStatus,
      totalClaimedAmount,
      totalApprovedAmount,
      averageClaimTime
    };
  }

  /**
   * Activate provider
   */
  activateProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    
    if (provider) {
      provider.isActive = true;
      this.providers.set(providerId, provider);
      return true;
    }

    return false;
  }

  /**
   * Deactivate provider
   */
  deactivateProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    
    if (provider) {
      provider.isActive = false;
      this.providers.set(providerId, provider);
      return true;
    }

    return false;
  }

  /**
   * Clear expired policies
   */
  clearExpiredPolicies(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [policyId, policy] of this.policies.entries()) {
      if (now > policy.endDate && policy.status === 'active') {
        policy.status = 'expired';
        this.policies.set(policyId, policy);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export policies
   */
  exportPolicies(userId?: string): string {
    const policies = userId
      ? Array.from(this.policies.values()).filter(p => p.userId === userId)
      : Array.from(this.policies.values());
    
    return JSON.stringify(policies, null, 2);
  }

  /**
   * Import policies
   */
  importPolicies(policies: InsurancePolicy[]): number {
    let imported = 0;

    for (const policy of policies) {
      if (!this.policies.has(policy.policyId)) {
        this.policies.set(policy.policyId, policy);
        imported++;
      }
    }

    return imported;
  }
}

export const insuranceIntegrationService = new InsuranceIntegrationService();
