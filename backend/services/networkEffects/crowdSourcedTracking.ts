// services/networkEffects/crowdSourcedTracking.ts - Crowd-sourced tracking network
import crypto from 'crypto';

export interface CrowdSighting {
  sightingId: string;
  deviceId: string;
  imei: string;
  reporterId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
  photo?: string;
  notes?: string;
  verified: boolean;
  confidence: number;
  reward: number;
  rewardClaimed: boolean;
}

export interface CrowdParticipant {
  participantId: string;
  userId: string;
  reputation: number;
  totalSightings: number;
  verifiedSightings: number;
  rewardsEarned: number;
  isActive: boolean;
  joinedAt: number;
}

export interface TrackingCampaign {
  campaignId: string;
  deviceId: string;
  imei: string;
  ownerId: string;
  rewardAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: number;
  expiresAt: number;
  totalSightings: number;
  verifiedSightings: number;
}

export class CrowdSourcedTrackingService {
  private sightings: Map<string, CrowdSighting> = new Map();
  private participants: Map<string, CrowdParticipant> = new Map();
  private campaigns: Map<string, TrackingCampaign> = new Map();

  /**
   * Register participant
   */
  registerParticipant(userId: string): CrowdParticipant {
    const participantId = crypto.randomBytes(16).toString('hex');
    
    const participant: CrowdParticipant = {
      participantId,
      userId,
      reputation: 50, // Start at 50
      totalSightings: 0,
      verifiedSightings: 0,
      rewardsEarned: 0,
      isActive: true,
      joinedAt: Date.now()
    };

    this.participants.set(participantId, participant);
    return participant;
  }

  /**
   * Submit sighting
   */
  submitSighting(
    deviceId: string,
    imei: string,
    reporterId: string,
    location: { latitude: number; longitude: number; accuracy: number },
    photo?: string,
    notes?: string
  ): CrowdSighting {
    const sightingId = crypto.randomBytes(16).toString('hex');
    const participant = this.getParticipantByUserId(reporterId);
    
    const confidence = this.calculateConfidence(location.accuracy, participant?.reputation || 50);
    
    const sighting: CrowdSighting = {
      sightingId,
      deviceId,
      imei,
      reporterId,
      location,
      timestamp: Date.now(),
      photo,
      notes,
      verified: false,
      confidence,
      reward: 0,
      rewardClaimed: false
    };

    this.sightings.set(sightingId, sighting);

    // Update participant stats
    if (participant) {
      participant.totalSightings++;
      this.participants.set(participant.participantId, participant);
    }

    // Update campaign stats
    const campaign = this.getActiveCampaign(deviceId);
    if (campaign) {
      campaign.totalSightings++;
      this.campaigns.set(campaign.campaignId, campaign);
    }

    return sighting;
  }

  /**
   * Verify sighting
   */
  verifySighting(sightingId: string, verified: boolean): boolean {
    const sighting = this.sightings.get(sightingId);
    
    if (!sighting || sighting.verified) {
      return false;
    }

    sighting.verified = verified;
    this.sightings.set(sightingId, sighting);

    // Update participant reputation
    const participant = this.getParticipantByUserId(sighting.reporterId);
    if (participant) {
      if (verified) {
        participant.verifiedSightings++;
        participant.reputation = Math.min(100, participant.reputation + 5);
      } else {
        participant.reputation = Math.max(0, participant.reputation - 10);
      }
      this.participants.set(participant.participantId, participant);
    }

    // Update campaign stats
    if (verified) {
      const campaign = this.getActiveCampaign(sighting.deviceId);
      if (campaign) {
        campaign.verifiedSightings++;
        this.campaigns.set(campaign.campaignId, campaign);
      }
    }

    return true;
  }

  /**
   * Create tracking campaign
   */
  createCampaign(
    deviceId: string,
    imei: string,
    ownerId: string,
    rewardAmount: number,
    ttl: number = 2592000000 // 30 days default
  ): TrackingCampaign {
    const campaignId = crypto.randomBytes(16).toString('hex');
    
    const campaign: TrackingCampaign = {
      campaignId,
      deviceId,
      imei,
      ownerId,
      rewardAmount,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      totalSightings: 0,
      verifiedSightings: 0
    };

    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  /**
   * Get active campaign for device
   */
  getActiveCampaign(deviceId: string): TrackingCampaign | null {
    const campaigns = Array.from(this.campaigns.values())
      .filter(c => c.deviceId === deviceId && c.status === 'active' && Date.now() < c.expiresAt);
    
    return campaigns.length > 0 ? campaigns[0] : null;
  }

  /**
   * Get sightings for device
   */
  getSightingsForDevice(deviceId: string, verifiedOnly: boolean = false): CrowdSighting[] {
    const sightings = Array.from(this.sightings.values())
      .filter(s => s.deviceId === deviceId);
    
    return verifiedOnly 
      ? sightings.filter(s => s.verified)
      : sightings;
  }

  /**
   * Get sightings by location
   */
  getSightingsByLocation(
    center: { latitude: number; longitude: number },
    radius: number,
    timeWindow?: number
  ): CrowdSighting[] {
    const now = Date.now();
    const startTime = timeWindow ? now - timeWindow : 0;

    return Array.from(this.sightings.values())
      .filter(s => {
        if (timeWindow && s.timestamp < startTime) return false;
        
        const distance = this.calculateDistance(center, s.location);
        return distance <= radius;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Claim reward for sighting
   */
  claimReward(sightingId: string): { success: boolean; reward: number } {
    const sighting = this.sightings.get(sightingId);
    
    if (!sighting || !sighting.verified || sighting.rewardClaimed) {
      return { success: false, reward: 0 };
    }

    const campaign = this.getActiveCampaign(sighting.deviceId);
    
    if (!campaign) {
      return { success: false, reward: 0 };
    }

    // Calculate reward based on confidence and campaign reward
    const reward = Math.floor(campaign.rewardAmount * sighting.confidence);
    
    sighting.reward = reward;
    sighting.rewardClaimed = true;
    this.sightings.set(sightingId, sighting);

    // Update participant rewards
    const participant = this.getParticipantByUserId(sighting.reporterId);
    if (participant) {
      participant.rewardsEarned += reward;
      this.participants.set(participant.participantId, participant);
    }

    return { success: true, reward };
  }

  /**
   * Get participant by user ID
   */
  getParticipantByUserId(userId: string): CrowdParticipant | null {
    return Array.from(this.participants.values())
      .find(p => p.userId === userId) || null;
  }

  /**
   * Get participant stats
   */
  getParticipantStats(userId: string): CrowdParticipant | null {
    return this.getParticipantByUserId(userId);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 50): CrowdParticipant[] {
    return Array.from(this.participants.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, limit);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(accuracy: number, reputation: number): number {
    // Higher accuracy = higher confidence
    const accuracyScore = Math.max(0, 1 - (accuracy / 1000));
    
    // Higher reputation = higher confidence
    const reputationScore = reputation / 100;
    
    // Combine scores
    return (accuracyScore * 0.6) + (reputationScore * 0.4);
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.latitude - coord1.latitude);
    const dLng = this.toRad(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.latitude)) * Math.cos(this.toRad(coord2.latitude)) *
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
   * Get statistics
   */
  getStatistics(): {
    totalSightings: number;
    verifiedSightings: number;
    totalParticipants: number;
    activeCampaigns: number;
    totalRewardsPaid: number;
    averageConfidence: number;
  } {
    const sightings = Array.from(this.sightings.values());
    const participants = Array.from(this.participants.values());
    const campaigns = Array.from(this.campaigns.values());

    const verifiedSightings = sightings.filter(s => s.verified).length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalRewardsPaid = sightings.filter(s => s.rewardClaimed).reduce((sum, s) => sum + s.reward, 0);
    const averageConfidence = sightings.length > 0
      ? sightings.reduce((sum, s) => sum + s.confidence, 0) / sightings.length
      : 0;

    return {
      totalSightings: sightings.length,
      verifiedSightings,
      totalParticipants: participants.length,
      activeCampaigns,
      totalRewardsPaid,
      averageConfidence
    };
  }

  /**
   * Clear expired campaigns
   */
  clearExpiredCampaigns(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [campaignId, campaign] of this.campaigns.entries()) {
      if (now > campaign.expiresAt && campaign.status === 'active') {
        campaign.status = 'completed';
        this.campaigns.set(campaignId, campaign);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export sightings
   */
  exportSightings(deviceId?: string): string {
    const sightings = deviceId
      ? Array.from(this.sightings.values()).filter(s => s.deviceId === deviceId)
      : Array.from(this.sightings.values());
    
    return JSON.stringify(sightings, null, 2);
  }

  /**
   * Import sightings
   */
  importSightings(sightings: CrowdSighting[]): number {
    let imported = 0;

    for (const sighting of sightings) {
      if (!this.sightings.has(sighting.sightingId)) {
        this.sightings.set(sighting.sightingId, sighting);
        imported++;
      }
    }

    return imported;
  }
}

export const crowdSourcedTrackingService = new CrowdSourcedTrackingService();
