// ── National Blacklist Network ───────────────────────────────────────────────────────
// Shared intelligence network for stolen device data, IMEI verification, fraud cross-check

export interface BlacklistEntry {
  imei: string;
  iccid?: string;
  status: 'stolen' | 'lost' | 'fraud' | 'blacklisted';
  reportedBy: string;
  reportedAt: Date;
  lastSeen?: Date;
  location?: { lat: number; lng: number };
  notes?: string;
  source: 'internal' | 'telecom' | 'police' | 'insurance' | 'partner';
}

export interface BlacklistCheckResult {
  imei: string;
  isBlacklisted: boolean;
  status?: string;
  sources: string[];
  lastReported?: Date;
  confidence: number;
}

export interface FraudCrossCheckResult {
  imei: string;
  fraudDetected: boolean;
  fraudTypes: string[];
  relatedDevices: string[];
  riskScore: number;
}

class BlacklistNetwork {
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private partnerBlacklists: Map<string, BlacklistEntry[]> = new Map();
  private fraudDatabase: Map<string, FraudCrossCheckResult> = new Map();

  // Add device to blacklist
  addToBlacklist(entry: BlacklistEntry): void {
    this.blacklist.set(entry.imei, entry);
  }

  // Remove device from blacklist
  removeFromBlacklist(imei: string): void {
    this.blacklist.delete(imei);
  }

  // Check if device is blacklisted
  checkBlacklist(imei: string): BlacklistCheckResult {
    const entry = this.blacklist.get(imei);
    
    if (entry) {
      return {
        imei,
        isBlacklisted: true,
        status: entry.status,
        sources: [entry.source],
        lastReported: entry.reportedAt,
        confidence: 1.0,
      };
    }

    // Check partner blacklists
    const partnerEntries: BlacklistEntry[] = [];
    for (const entries of this.partnerBlacklists.values()) {
      const found = entries.find(e => e.imei === imei);
      if (found) partnerEntries.push(found);
    }

    if (partnerEntries.length > 0) {
      const sources = [...new Set(partnerEntries.map(e => e.source))];
      const latest = partnerEntries.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())[0];
      
      return {
        imei,
        isBlacklisted: true,
        status: latest.status,
        sources,
        lastReported: latest.reportedAt,
        confidence: 0.8,
      };
    }

    return {
      imei,
      isBlacklisted: false,
      sources: [],
      confidence: 0.95,
    };
  }

  // Batch check multiple IMEIs
  batchCheckBlacklist(imeis: string[]): Map<string, BlacklistCheckResult> {
    const results = new Map<string, BlacklistCheckResult>();

    for (const imei of imeis) {
      results.set(imei, this.checkBlacklist(imei));
    }

    return results;
  }

  // Add partner blacklist
  addPartnerBlacklist(partnerId: string, entries: BlacklistEntry[]): void {
    this.partnerBlacklists.set(partnerId, entries);
  }

  // Remove partner blacklist
  removePartnerBlacklist(partnerId: string): void {
    this.partnerBlacklists.delete(partnerId);
  }

  // Get all blacklisted devices
  getBlacklistedDevices(source?: string): BlacklistEntry[] {
    const allEntries = Array.from(this.blacklist.values());

    if (source) {
      return allEntries.filter(e => e.source === source);
    }

    return allEntries;
  }

  // Cross-check for fraud
  crossCheckFraud(imei: string): FraudCrossCheckResult {
    const cached = this.fraudDatabase.get(imei);
    if (cached) {
      return cached;
    }

    const blacklistCheck = this.checkBlacklist(imei);
    const fraudTypes: string[] = [];

    if (blacklistCheck.isBlacklisted) {
      if (blacklistCheck.status === 'fraud') {
        fraudTypes.push('known_fraud_device');
      }
      if (blacklistCheck.status === 'stolen') {
        fraudTypes.push('stolen_device');
      }
    }

    // Check for related devices (same location, similar patterns)
    const relatedDevices = this.findRelatedDevices(imei);

    // Calculate risk score
    let riskScore = 0;
    if (blacklistCheck.isBlacklisted) riskScore += 50;
    if (fraudTypes.length > 0) riskScore += 30;
    if (relatedDevices.length > 2) riskScore += 20;

    const result: FraudCrossCheckResult = {
      imei,
      fraudDetected: riskScore > 50,
      fraudTypes,
      relatedDevices,
      riskScore,
    };

    this.fraudDatabase.set(imei, result);
    return result;
  }

  // Find related devices
  private findRelatedDevices(imei: string): string[] {
    const entry = this.blacklist.get(imei);
    if (!entry) return [];

    const related: string[] = [];

    // Find devices reported by same source
    for (const [otherImei, otherEntry] of this.blacklist) {
      if (otherImei !== imei && otherEntry.reportedBy === entry.reportedBy) {
        related.push(otherImei);
      }
    }

    // Find devices in same location
    if (entry.location) {
      for (const [otherImei, otherEntry] of this.blacklist) {
        if (otherImei !== imei && otherEntry.location) {
          const distance = this.calculateDistance(
            entry.location.lat,
            entry.location.lng,
            otherEntry.location.lat,
            otherEntry.location.lng
          );
          if (distance < 10) { // Within 10km
            related.push(otherImei);
          }
        }
      }
    }

    return [...new Set(related)];
  }

  // Sync with partner network
  async syncWithPartner(partnerId: string, _partnerUrl: string): Promise<void> {
    // In production, this would make an HTTP request to the partner's API
    // For now, we'll simulate the sync
    
    const simulatedEntries: BlacklistEntry[] = [
      {
        imei: '123456789012345',
        status: 'stolen',
        reportedBy: partnerId,
        reportedAt: new Date(),
        source: 'partner',
      },
    ];

    this.addPartnerBlacklist(partnerId, simulatedEntries);
  }

  // Get blacklist statistics
  getStatistics(): {
    totalBlacklisted: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentReports: number;
  } {
    const entries = Array.from(this.blacklist.values());
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const entry of entries) {
      byStatus[entry.status] = (byStatus[entry.status] || 0) + 1;
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentReports = entries.filter(e => e.reportedAt.getTime() > oneWeekAgo).length;

    return {
      totalBlacklisted: entries.length,
      byStatus,
      bySource,
      recentReports,
    };
  }

  // Calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Clear old data
  clearOldData(maxAgeDays = 90): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const [imei, entry] of this.blacklist) {
      if (entry.reportedAt.getTime() < cutoff) {
        this.blacklist.delete(imei);
      }
    }

    this.fraudDatabase.clear();
  }
}

// Singleton instance
export const blacklistNetwork = new BlacklistNetwork();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addToBlacklist(entry: BlacklistEntry): void {
  blacklistNetwork.addToBlacklist(entry);
}

export function removeFromBlacklist(imei: string): void {
  blacklistNetwork.removeFromBlacklist(imei);
}

export function checkBlacklist(imei: string): BlacklistCheckResult {
  return blacklistNetwork.checkBlacklist(imei);
}

export function batchCheckBlacklist(imeis: string[]): Map<string, BlacklistCheckResult> {
  return blacklistNetwork.batchCheckBlacklist(imeis);
}

export function crossCheckFraud(imei: string): FraudCrossCheckResult {
  return blacklistNetwork.crossCheckFraud(imei);
}

export function getBlacklistedDevices(source?: string): BlacklistEntry[] {
  return blacklistNetwork.getBlacklistedDevices(source);
}

export function getBlacklistStatistics() {
  return blacklistNetwork.getStatistics();
}

export async function syncWithPartner(partnerId: string, partnerUrl: string): Promise<void> {
  await blacklistNetwork.syncWithPartner(partnerId, partnerUrl);
}
