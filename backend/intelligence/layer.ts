// ── Cyber Intelligence Layer ───────────────────────────────────────────────────────
// Threat intelligence, malicious IPs, proxy networks, fraud sources, attack patterns

export interface ThreatIntelligence {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  value: string;
  threatType: 'malware' | 'phishing' | 'botnet' | 'proxy' | 'vpn' | 'tor' | 'fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ProxyNetwork {
  id: string;
  name: string;
  type: 'vpn' | 'tor' | 'proxy' | 'datacenter' | 'residential';
  ipRanges: string[];
  riskScore: number;
  lastUpdated: Date;
}

export interface FraudSource {
  id: string;
  source: string;
  type: 'stolen_card' | 'account_takeover' | 'identity_theft' | 'device_theft';
  indicators: string[];
  confidence: number;
  lastReported: Date;
}

export interface AttackPattern {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  techniques: string[];
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
}

class CyberIntelligenceLayer {
  private threatIntel: Map<string, ThreatIntelligence> = new Map();
  private proxyNetworks: Map<string, ProxyNetwork> = new Map();
  private fraudSources: Map<string, FraudSource> = new Map();
  private attackPatterns: Map<string, AttackPattern> = new Map();

  // Add threat intelligence
  addThreatIntel(intel: Omit<ThreatIntelligence, 'id' | 'firstSeen' | 'lastSeen'>): ThreatIntelligence {
    const threatIntel: ThreatIntelligence = {
      ...intel,
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstSeen: new Date(),
      lastSeen: new Date(),
    };

    this.threatIntel.set(threatIntel.id, threatIntel);
    return threatIntel;
  }

  // Check if IP is malicious
  isMaliciousIP(ip: string): { isMalicious: boolean; threat?: ThreatIntelligence } {
    for (const threat of this.threatIntel.values()) {
      if (threat.type === 'ip' && threat.value === ip) {
        return { isMalicious: true, threat };
      }
    }

    // Check against proxy networks
    for (const network of this.proxyNetworks.values()) {
      if (this.isIPInNetwork(ip, network.ipRanges)) {
        return { 
          isMalicious: true, 
          threat: {
            id: network.id,
            type: 'ip',
            value: ip,
            threatType: network.type === 'tor' ? 'tor' : network.type === 'vpn' ? 'vpn' : 'proxy',
            severity: network.riskScore > 70 ? 'high' : 'medium',
            source: network.name,
            firstSeen: network.lastUpdated,
            lastSeen: new Date(),
            confidence: network.riskScore / 100,
          } as ThreatIntelligence,
        };
      }
    }

    return { isMalicious: false };
  }

  // Check if IP is in network range
  private isIPInNetwork(ip: string, ipRanges: string[]): boolean {
    for (const range of ipRanges) {
      if (this.ipInRange(ip, range)) {
        return true;
      }
    }
    return false;
  }

  // Check if IP is in CIDR range
  private ipInRange(ip: string, cidr: string): boolean {
    const [network, mask] = cidr.split('/');
    const maskBits = parseInt(mask, 10);
    
    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);
    const maskNum = -1 << (32 - maskBits);

    return (ipNum & maskNum) === (networkNum & maskNum);
  }

  // Convert IP to number
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  // Add proxy network
  addProxyNetwork(network: Omit<ProxyNetwork, 'id' | 'lastUpdated'>): ProxyNetwork {
    const proxyNetwork: ProxyNetwork = {
      ...network,
      id: `proxy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
    };

    this.proxyNetworks.set(proxyNetwork.id, proxyNetwork);
    return proxyNetwork;
  }

  // Add fraud source
  addFraudSource(source: Omit<FraudSource, 'id' | 'lastReported'>): FraudSource {
    const fraudSource: FraudSource = {
      ...source,
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastReported: new Date(),
    };

    this.fraudSources.set(fraudSource.id, fraudSource);
    return fraudSource;
  }

  // Check for fraud indicators
  checkFraudIndicators(indicators: string[]): FraudSource[] {
    const matches: FraudSource[] = [];

    for (const fraudSource of this.fraudSources.values()) {
      for (const indicator of indicators) {
        if (fraudSource.indicators.includes(indicator)) {
          matches.push(fraudSource);
          break;
        }
      }
    }

    return matches;
  }

  // Add attack pattern
  addAttackPattern(pattern: Omit<AttackPattern, 'id'>): AttackPattern {
    const attackPattern: AttackPattern = {
      ...pattern,
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.attackPatterns.set(attackPattern.id, attackPattern);
    return attackPattern;
  }

  // Detect attack pattern from indicators
  detectAttackPattern(indicators: string[]): AttackPattern[] {
    const matches: AttackPattern[] = [];

    for (const pattern of this.attackPatterns.values()) {
      let matchCount = 0;
      for (const indicator of indicators) {
        if (pattern.indicators.includes(indicator)) {
          matchCount++;
        }
      }

      // If 50% or more indicators match
      if (matchCount >= pattern.indicators.length / 2) {
        matches.push(pattern);
      }
    }

    return matches.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Get threat intelligence
  getThreatIntel(threatId: string): ThreatIntelligence | undefined {
    return this.threatIntel.get(threatId);
  }

  // Get all threat intelligence
  getAllThreatIntel(): ThreatIntelligence[] {
    return Array.from(this.threatIntel.values());
  }

  // Get threat intelligence by type
  getThreatIntelByType(type: ThreatIntelligence['type']): ThreatIntelligence[] {
    return Array.from(this.threatIntel.values()).filter(t => t.type === type);
  }

  // Get threat intelligence by threat type
  getThreatIntelByThreatType(threatType: ThreatIntelligence['threatType']): ThreatIntelligence[] {
    return Array.from(this.threatIntel.values()).filter(t => t.threatType === threatType);
  }

  // Get proxy network
  getProxyNetwork(networkId: string): ProxyNetwork | undefined {
    return this.proxyNetworks.get(networkId);
  }

  // Get all proxy networks
  getAllProxyNetworks(): ProxyNetwork[] {
    return Array.from(this.proxyNetworks.values());
  }

  // Get fraud source
  getFraudSource(sourceId: string): FraudSource | undefined {
    return this.fraudSources.get(sourceId);
  }

  // Get all fraud sources
  getAllFraudSources(): FraudSource[] {
    return Array.from(this.fraudSources.values());
  }

  // Get attack pattern
  getAttackPattern(patternId: string): AttackPattern | undefined {
    return this.attackPatterns.get(patternId);
  }

  // Get all attack patterns
  getAllAttackPatterns(): AttackPattern[] {
    return Array.from(this.attackPatterns.values());
  }

  // Update threat intelligence
  updateThreatIntel(threatId: string, updates: Partial<Omit<ThreatIntelligence, 'id' | 'firstSeen'>>): ThreatIntelligence | null {
    const threat = this.threatIntel.get(threatId);
    if (!threat) return null;

    const updated: ThreatIntelligence = {
      ...threat,
      ...updates,
      lastSeen: new Date(),
    };

    this.threatIntel.set(threatId, updated);
    return updated;
  }

  // Remove threat intelligence
  removeThreatIntel(threatId: string): boolean {
    return this.threatIntel.delete(threatId);
  }

  // Clear old threat intelligence
  clearOldThreatIntel(maxAgeDays = 30): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const [id, threat] of this.threatIntel) {
      if (threat.lastSeen.getTime() < cutoff) {
        this.threatIntel.delete(id);
      }
    }
  }

  // Get statistics
  getStatistics(): {
    totalThreatIntel: number;
    totalProxyNetworks: number;
    totalFraudSources: number;
    totalAttackPatterns: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
  } {
    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};

    for (const threat of this.threatIntel.values()) {
      threatsByType[threat.threatType] = (threatsByType[threat.threatType] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    }

    return {
      totalThreatIntel: this.threatIntel.size,
      totalProxyNetworks: this.proxyNetworks.size,
      totalFraudSources: this.fraudSources.size,
      totalAttackPatterns: this.attackPatterns.size,
      threatsByType,
      threatsBySeverity,
    };
  }

  // Initialize default data
  initializeDefaultData(): void {
    // Add common proxy networks
    this.addProxyNetwork({
      name: 'Tor Exit Nodes',
      type: 'tor',
      ipRanges: ['103.0.0.0/8', '185.0.0.0/8'],
      riskScore: 90,
    });

    this.addProxyNetwork({
      name: 'Known VPN Providers',
      type: 'vpn',
      ipRanges: ['104.0.0.0/8', '198.0.0.0/8'],
      riskScore: 60,
    });

    // Add common attack patterns
    this.addAttackPattern({
      name: 'SIM Swap Attack',
      description: 'Attackers port a victim phone number to a SIM card they control',
      tactics: ['Initial Access', 'Persistence'],
      techniques: ['SIM Porting', 'Social Engineering'],
      indicators: ['sim_change', 'account_takeover', 'unusual_location'],
      severity: 'high',
      mitigation: ['Multi-factor authentication', 'SIM port protection'],
    });

    this.addAttackPattern({
      name: 'Device Theft',
      description: 'Physical theft of device followed by unauthorized access',
      tactics: ['Initial Access', 'Credential Access'],
      techniques: ['Physical Theft', 'Brute Force'],
      indicators: ['device_theft', 'unusual_location', 'multiple_failed_attempts'],
      severity: 'critical',
      mitigation: ['Device encryption', 'Remote wipe', 'Biometric authentication'],
    });
  }
}

// Singleton instance
export const cyberIntelligence = new CyberIntelligenceLayer();

// Initialize default data
cyberIntelligence.initializeDefaultData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addThreatIntel(intel: Omit<ThreatIntelligence, 'id' | 'firstSeen' | 'lastSeen'>): ThreatIntelligence {
  return cyberIntelligence.addThreatIntel(intel);
}

export function isMaliciousIP(ip: string): { isMalicious: boolean; threat?: ThreatIntelligence } {
  return cyberIntelligence.isMaliciousIP(ip);
}

export function addProxyNetwork(network: Omit<ProxyNetwork, 'id' | 'lastUpdated'>): ProxyNetwork {
  return cyberIntelligence.addProxyNetwork(network);
}

export function addFraudSource(source: Omit<FraudSource, 'id' | 'lastReported'>): FraudSource {
  return cyberIntelligence.addFraudSource(source);
}

export function checkFraudIndicators(indicators: string[]): FraudSource[] {
  return cyberIntelligence.checkFraudIndicators(indicators);
}

export function addAttackPattern(pattern: Omit<AttackPattern, 'id'>): AttackPattern {
  return cyberIntelligence.addAttackPattern(pattern);
}

export function detectAttackPattern(indicators: string[]): AttackPattern[] {
  return cyberIntelligence.detectAttackPattern(indicators);
}

export function getThreatIntel(threatId: string): ThreatIntelligence | undefined {
  return cyberIntelligence.getThreatIntel(threatId);
}

export function getAllThreatIntel(): ThreatIntelligence[] {
  return cyberIntelligence.getAllThreatIntel();
}

export function getProxyNetwork(networkId: string): ProxyNetwork | undefined {
  return cyberIntelligence.getProxyNetwork(networkId);
}

export function getAllProxyNetworks(): ProxyNetwork[] {
  return cyberIntelligence.getAllProxyNetworks();
}

export function getFraudSource(sourceId: string): FraudSource | undefined {
  return cyberIntelligence.getFraudSource(sourceId);
}

export function getAllFraudSources(): FraudSource[] {
  return cyberIntelligence.getAllFraudSources();
}

export function getAttackPattern(patternId: string): AttackPattern | undefined {
  return cyberIntelligence.getAttackPattern(patternId);
}

export function getAllAttackPatterns(): AttackPattern[] {
  return cyberIntelligence.getAllAttackPatterns();
}

export function getCyberIntelligenceStatistics() {
  return cyberIntelligence.getStatistics();
}
