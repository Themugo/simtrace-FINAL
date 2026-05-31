// ── External Marketplace Integrations ─────────────────────────────────────────────
// API integrations with Jiji, eBay, Facebook Marketplace for device verification

export interface MarketplaceVerification {
  marketplace: 'jiji' | 'ebay' | 'facebook';
  listingId: string;
  imei: string;
  verified: boolean;
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sellerTrustScore: number;
  warnings: string[];
  verifiedAt: Date;
}

export interface MarketplaceListing {
  marketplace: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
  };
  deviceInfo: {
    imei?: string;
    make?: string;
    model?: string;
  };
  url: string;
}

class ExternalMarketplaceService {
  private apiKeys: Map<string, string> = new Map();
  private verificationCache: Map<string, MarketplaceVerification> = new Map();
  private cacheTTL = 300000; // 5 minutes

  constructor() {
    // Initialize with environment variables if available
    if (process.env.JIJI_API_KEY) this.apiKeys.set('jiji', process.env.JIJI_API_KEY);
    if (process.env.EBAY_API_KEY) this.apiKeys.set('ebay', process.env.EBAY_API_KEY);
    if (process.env.FACEBOOK_API_KEY) this.apiKeys.set('facebook', process.env.FACEBOOK_API_KEY);
  }

  // Set API key for marketplace
  setApiKey(marketplace: string, apiKey: string): void {
    this.apiKeys.set(marketplace, apiKey);
  }

  // Verify device listing on Jiji
  async verifyJijiListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
    const cacheKey = `jiji:${listingId}:${imei}`;
    const cached = this.getCachedVerification(cacheKey);
    if (cached) return cached;

    // In production, this would make an actual API call to Jiji
    // For now, we'll simulate the verification
    const verification: MarketplaceVerification = {
      marketplace: 'jiji',
      listingId,
      imei,
      verified: Math.random() > 0.2, // 80% chance of being verified
      trustScore: Math.floor(Math.random() * 40) + 60, // 60-100
      riskLevel: Math.random() > 0.7 ? 'low' : Math.random() > 0.4 ? 'medium' : 'high',
      sellerTrustScore: Math.floor(Math.random() * 30) + 70, // 70-100
      warnings: [],
      verifiedAt: new Date(),
    };

    // Add warnings based on risk level
    if (verification.riskLevel === 'high') {
      verification.warnings.push('Seller has low trust score');
      verification.warnings.push('IMEI not verified by manufacturer');
    } else if (verification.riskLevel === 'medium') {
      verification.warnings.push('Limited seller history');
    }

    this.setCachedVerification(cacheKey, verification);
    return verification;
  }

  // Verify device listing on eBay
  async verifyEbayListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
    const cacheKey = `ebay:${listingId}:${imei}`;
    const cached = this.getCachedVerification(cacheKey);
    if (cached) return cached;

    // In production, this would make an actual API call to eBay
    const verification: MarketplaceVerification = {
      marketplace: 'ebay',
      listingId,
      imei,
      verified: Math.random() > 0.15, // 85% chance of being verified
      trustScore: Math.floor(Math.random() * 35) + 65, // 65-100
      riskLevel: Math.random() > 0.75 ? 'low' : Math.random() > 0.45 ? 'medium' : 'high',
      sellerTrustScore: Math.floor(Math.random() * 25) + 75, // 75-100
      warnings: [],
      verifiedAt: new Date(),
    };

    if (verification.riskLevel === 'high') {
      verification.warnings.push('New seller account');
      verification.warnings.push('Price significantly below market value');
    } else if (verification.riskLevel === 'medium') {
      verification.warnings.push('Limited feedback history');
    }

    this.setCachedVerification(cacheKey, verification);
    return verification;
  }

  // Verify device listing on Facebook Marketplace
  async verifyFacebookListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
    const cacheKey = `facebook:${listingId}:${imei}`;
    const cached = this.getCachedVerification(cacheKey);
    if (cached) return cached;

    // In production, this would make an actual API call to Facebook
    const verification: MarketplaceVerification = {
      marketplace: 'facebook',
      listingId,
      imei,
      verified: Math.random() > 0.3, // 70% chance of being verified (Facebook has more fraud)
      trustScore: Math.floor(Math.random() * 45) + 55, // 55-100
      riskLevel: Math.random() > 0.6 ? 'low' : Math.random() > 0.3 ? 'medium' : 'high',
      sellerTrustScore: Math.floor(Math.random() * 40) + 60, // 60-100
      warnings: [],
      verifiedAt: new Date(),
    };

    if (verification.riskLevel === 'high') {
      verification.warnings.push('Seller profile not verified');
      verification.warnings.push('Listing flagged for suspicious activity');
    } else if (verification.riskLevel === 'medium') {
      verification.warnings.push('No mutual friends with buyer');
    }

    this.setCachedVerification(cacheKey, verification);
    return verification;
  }

  // Verify listing across all marketplaces
  async verifyAcrossMarketplaces(listingId: string, imei: string, marketplaces: string[] = ['jiji', 'ebay', 'facebook']): Promise<MarketplaceVerification[]> {
    const verifications: MarketplaceVerification[] = [];

    for (const marketplace of marketplaces) {
      try {
        let verification: MarketplaceVerification;
        switch (marketplace) {
          case 'jiji':
            verification = await this.verifyJijiListing(listingId, imei);
            break;
          case 'ebay':
            verification = await this.verifyEbayListing(listingId, imei);
            break;
          case 'facebook':
            verification = await this.verifyFacebookListing(listingId, imei);
            break;
          default:
            continue;
        }
        verifications.push(verification);
      } catch (error) {
        console.error(`Failed to verify on ${marketplace}:`, error);
      }
    }

    return verifications;
  }

  // Get listing details from marketplace
  async getListingDetails(marketplace: string, listingId: string): Promise<MarketplaceListing | null> {
    // In production, this would make actual API calls
    // For now, return simulated data
    const listing: MarketplaceListing = {
      marketplace,
      listingId,
      title: 'iPhone 13 Pro Max - 256GB - Excellent Condition',
      price: 850,
      currency: 'USD',
      seller: {
        id: 'seller_123',
        name: 'TechTrader',
        rating: 4.5,
        reviews: 127,
      },
      deviceInfo: {
        make: 'Apple',
        model: 'iPhone 13 Pro Max',
      },
      url: `https://${marketplace}.com/item/${listingId}`,
    };

    return listing;
  }

  // Report suspicious listing to marketplace
  async reportSuspiciousListing(marketplace: string, listingId: string, reason: string): Promise<boolean> {
    // In production, this would make actual API calls to report the listing
    console.log(`Reporting listing ${listingId} on ${marketplace} for: ${reason}`);
    return true;
  }

  // Get cached verification
  private getCachedVerification(key: string): MarketplaceVerification | null {
    const cached = this.verificationCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.verifiedAt.getTime();
    if (age > this.cacheTTL) {
      this.verificationCache.delete(key);
      return null;
    }

    return cached;
  }

  // Set cached verification
  private setCachedVerification(key: string, verification: MarketplaceVerification): void {
    this.verificationCache.set(key, verification);
  }

  // Clear old cache entries
  clearOldCache(): void {
    const cutoff = Date.now() - this.cacheTTL;
    for (const [key, verification] of this.verificationCache) {
      if (verification.verifiedAt.getTime() < cutoff) {
        this.verificationCache.delete(key);
      }
    }
  }

  // Get statistics
  getStatistics(): {
    totalVerifications: number;
    verificationsByMarketplace: Record<string, number>;
    averageTrustScore: number;
    highRiskCount: number;
  } {
    const verifications = Array.from(this.verificationCache.values());
    const verificationsByMarketplace: Record<string, number> = {};
    let totalTrustScore = 0;
    let highRiskCount = 0;

    for (const v of verifications) {
      verificationsByMarketplace[v.marketplace] = (verificationsByMarketplace[v.marketplace] || 0) + 1;
      totalTrustScore += v.trustScore;
      if (v.riskLevel === 'high') highRiskCount++;
    }

    return {
      totalVerifications: verifications.length,
      verificationsByMarketplace,
      averageTrustScore: verifications.length > 0 ? totalTrustScore / verifications.length : 0,
      highRiskCount,
    };
  }
}

// Singleton instance
export const externalMarketplaceService = new ExternalMarketplaceService();

// ── Convenience Functions ───────────────────────────────────────────────────────
export async function verifyJijiListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
  return externalMarketplaceService.verifyJijiListing(listingId, imei);
}

export async function verifyEbayListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
  return externalMarketplaceService.verifyEbayListing(listingId, imei);
}

export async function verifyFacebookListing(listingId: string, imei: string): Promise<MarketplaceVerification> {
  return externalMarketplaceService.verifyFacebookListing(listingId, imei);
}

export async function verifyAcrossMarketplaces(listingId: string, imei: string, marketplaces?: string[]): Promise<MarketplaceVerification[]> {
  return externalMarketplaceService.verifyAcrossMarketplaces(listingId, imei, marketplaces);
}

export async function getListingDetails(marketplace: string, listingId: string): Promise<MarketplaceListing | null> {
  return externalMarketplaceService.getListingDetails(marketplace, listingId);
}

export async function reportSuspiciousListing(marketplace: string, listingId: string, reason: string): Promise<boolean> {
  return externalMarketplaceService.reportSuspiciousListing(marketplace, listingId, reason);
}

export function getMarketplaceStatistics() {
  return externalMarketplaceService.getStatistics();
}
