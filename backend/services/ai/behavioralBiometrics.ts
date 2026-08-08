// services/ai/behavioralBiometrics.ts - Behavioral biometrics for user authentication

export interface BiometricData {
  userId: string;
  deviceId: string;
  timestamp: number;
  typingPattern: {
    keystrokeIntervals: number[]; // Time between keystrokes in ms
    typingSpeed: number; // Characters per second
    errorRate: number; // Percentage of typos
  };
  usagePattern: {
    appSequence: string[]; // Order of app usage
    sessionDuration: number; // Session length in minutes
    interactionFrequency: number; // Interactions per minute
  };
  movementPattern: {
    accelerometer: number[]; // Accelerometer readings
    gyroscope: number[]; // Gyroscope readings
    touchPattern: number[]; // Touch coordinates and pressure
  };
}

export interface BiometricScore {
  userId: string;
  deviceId: string;
  timestamp: number;
  matchScore: number; // 0-1, higher is better match
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  details: {
    typingMatch: number;
    usageMatch: number;
    movementMatch: number;
  };
}

class BehavioralBiometricsService {
  private biometricProfiles: Map<string, BiometricData[]> = new Map();
  private readonly PROFILE_WINDOW = 50;

  constructor() {
    console.log('Behavioral biometrics service initialized');
  }

  public async recordBiometricData(data: BiometricData): Promise<void> {
    const profileKey = `${data.userId}_${data.deviceId}`;
    const profile = this.biometricProfiles.get(profileKey) || [];
    profile.push(data);

    if (profile.length > this.PROFILE_WINDOW) {
      profile.shift();
    }

    this.biometricProfiles.set(profileKey, profile);
  }

  public async verifyBiometrics(data: BiometricData): Promise<BiometricScore> {
    const profileKey = `${data.userId}_${data.deviceId}`;
    const profile = this.biometricProfiles.get(profileKey);

    if (!profile || profile.length < 5) {
      return {
        userId: data.userId,
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        matchScore: 0.5,
        confidence: 0.2,
        riskLevel: 'medium',
        details: {
          typingMatch: 0.5,
          usageMatch: 0.5,
          movementMatch: 0.5
        }
      };
    }

    try {
      // Use statistical methods for biometric verification
      const typingMatch = this.calculateTypingMatch(profile, data);
      const usageMatch = this.calculateUsageMatch(profile, data);
      const movementMatch = this.calculateMovementMatch(profile, data);

      // Calculate overall match score
      const matchScore = (typingMatch * 0.4 + usageMatch * 0.3 + movementMatch * 0.3);
      const confidence = Math.min(profile.length / this.PROFILE_WINDOW, 1);

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (matchScore < 0.4) riskLevel = 'high';
      else if (matchScore < 0.7) riskLevel = 'medium';

      return {
        userId: data.userId,
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        matchScore,
        confidence,
        riskLevel,
        details: {
          typingMatch,
          usageMatch,
          movementMatch
        }
      };
    } catch (error) {
      console.error('Error verifying biometrics:', error);
      return {
        userId: data.userId,
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        matchScore: 0.5,
        confidence: 0.2,
        riskLevel: 'medium',
        details: {
          typingMatch: 0.5,
          usageMatch: 0.5,
          movementMatch: 0.5
        }
      };
    }
  }

  private calculateTypingMatch(profile: BiometricData[], currentData: BiometricData): number {
    const avgTypingSpeed = profile.reduce((sum, d) => sum + d.typingPattern.typingSpeed, 0) / profile.length;
    const avgErrorRate = profile.reduce((sum, d) => sum + d.typingPattern.errorRate, 0) / profile.length;

    const speedDiff = Math.abs(currentData.typingPattern.typingSpeed - avgTypingSpeed) / avgTypingSpeed;
    const errorDiff = Math.abs(currentData.typingPattern.errorRate - avgErrorRate) / (avgErrorRate || 1);

    return Math.max(0, 1 - (speedDiff + errorDiff) / 2);
  }

  private calculateUsageMatch(profile: BiometricData[], currentData: BiometricData): number {
    const avgSessionDuration = profile.reduce((sum, d) => sum + d.usagePattern.sessionDuration, 0) / profile.length;
    const avgInteractionFreq = profile.reduce((sum, d) => sum + d.usagePattern.interactionFrequency, 0) / profile.length;

    const durationDiff = Math.abs(currentData.usagePattern.sessionDuration - avgSessionDuration) / avgSessionDuration;
    const freqDiff = Math.abs(currentData.usagePattern.interactionFrequency - avgInteractionFreq) / avgInteractionFreq;

    return Math.max(0, 1 - (durationDiff + freqDiff) / 2);
  }

  private calculateMovementMatch(profile: BiometricData[], currentData: BiometricData): number {
    // Simplified movement matching
    const avgAccel = profile.reduce((sum, d) => {
      return sum + d.movementPattern.accelerometer.reduce((a, b) => a + b, 0);
    }, 0) / profile.length;
    
    const currentAccel = currentData.movementPattern.accelerometer.reduce((a, b) => a + b, 0);
    const diff = Math.abs(currentAccel - avgAccel) / (avgAccel || 1);

    return Math.max(0, 1 - diff);
  }





  public getBiometricProfile(userId: string, deviceId: string): BiometricData[] {
    const profileKey = `${userId}_${deviceId}`;
    return this.biometricProfiles.get(profileKey) || [];
  }

  public clearProfile(userId: string, deviceId: string): void {
    const profileKey = `${userId}_${deviceId}`;
    this.biometricProfiles.delete(profileKey);
  }
}

export const behavioralBiometricsService = new BehavioralBiometricsService();
