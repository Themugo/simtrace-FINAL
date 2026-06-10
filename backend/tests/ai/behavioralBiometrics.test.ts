// tests/ai/behavioralBiometrics.test.ts - Tests for behavioral biometrics service
import { behavioralBiometricsService } from '../../services/ai/behavioralBiometrics.js';
import type { BiometricData } from '../../services/ai/behavioralBiometrics.js';

describe('BehavioralBiometricsService', () => {
  const mockUserId = 'test-user-789';
  const mockDeviceId = 'test-device-789';
  const mockBiometricData: BiometricData = {
    userId: mockUserId,
    deviceId: mockDeviceId,
    timestamp: Date.now(),
    typingPattern: {
      keystrokeIntervals: [100, 120, 95, 110],
      typingSpeed: 45,
      errorRate: 2,
    },
    usagePattern: {
      appSequence: ['app1', 'app2', 'app3'],
      sessionDuration: 300,
      interactionFrequency: 15,
    },
    movementPattern: {
      accelerometer: [0.5, 0.3, 0.2],
      gyroscope: [0.1, 0.2, 0.3],
      touchPattern: [500, 800, 0.5, 1000, 2, 1],
    },
  };

  beforeEach(() => {
    // Clear any existing data for the test user/device
    behavioralBiometricsService.clearProfile(mockUserId, mockDeviceId);
  });

  afterEach(() => {
    // Clean up after each test
    behavioralBiometricsService.clearProfile(mockUserId, mockDeviceId);
  });

  describe('recordBiometricData', () => {
    it('should record biometric data', async () => {
      await behavioralBiometricsService.recordBiometricData(mockBiometricData);
      
      const profile = behavioralBiometricsService.getBiometricProfile(mockUserId, mockDeviceId);
      expect(profile).toHaveLength(1);
      expect(profile[0]).toEqual(mockBiometricData);
    });

    it('should maintain profile window limit', async () => {
      const windowSize = 55; // Slightly above the PROFILE_WINDOW of 50
      
      for (let i = 0; i < windowSize; i++) {
        await behavioralBiometricsService.recordBiometricData({
          ...mockBiometricData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const profile = behavioralBiometricsService.getBiometricProfile(mockUserId, mockDeviceId);
      expect(profile.length).toBeLessThanOrEqual(50);
    });
  });

  describe('verifyBiometrics', () => {
    it('should return low confidence for insufficient data', async () => {
      const result = await behavioralBiometricsService.verifyBiometrics(mockBiometricData);
      
      expect(result.matchScore).toBe(0.5);
      expect(result.confidence).toBe(0.2);
      expect(result.riskLevel).toBe('medium');
    });

    it('should verify biometrics with sufficient data', async () => {
      // Record baseline data
      for (let i = 0; i < 10; i++) {
        await behavioralBiometricsService.recordBiometricData({
          ...mockBiometricData,
          timestamp: Date.now() + i * 1000,
          typingPattern: {
            keystrokeIntervals: [100 + Math.random() * 20, 120 + Math.random() * 20, 95 + Math.random() * 20, 110 + Math.random() * 20],
            typingSpeed: 45 + Math.random() * 5,
            errorRate: 2 + Math.random(),
          },
        });
      }
      
      // Test with similar data (should match)
      const matchResult = await behavioralBiometricsService.verifyBiometrics({
        ...mockBiometricData,
        typingPattern: {
          keystrokeIntervals: [105, 118, 98, 112],
          typingSpeed: 46,
          errorRate: 2.1,
        },
      });
      
      expect(matchResult.matchScore).toBeGreaterThan(0);
      expect(matchResult.matchScore).toBeLessThanOrEqual(1);
      expect(matchResult.confidence).toBeGreaterThan(0.1);
      
      // Test with different data (should have lower match)
      const mismatchResult = await behavioralBiometricsService.verifyBiometrics({
        ...mockBiometricData,
        typingPattern: {
          keystrokeIntervals: [200, 250, 180, 220],
          typingSpeed: 20,
          errorRate: 15,
        },
      });
      
      expect(mismatchResult.matchScore).toBeLessThan(matchResult.matchScore);
    });

    it('should provide detailed biometric breakdown', async () => {
      // Record baseline data
      for (let i = 0; i < 10; i++) {
        await behavioralBiometricsService.recordBiometricData({
          ...mockBiometricData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const result = await behavioralBiometricsService.verifyBiometrics(mockBiometricData);
      
      expect(result.details).toBeDefined();
      expect(result.details.typingMatch).toBeDefined();
      expect(result.details.usageMatch).toBeDefined();
      expect(result.details.movementMatch).toBeDefined();
    });

    it('should set appropriate risk level based on match score', async () => {
      // Record baseline data
      for (let i = 0; i < 10; i++) {
        await behavioralBiometricsService.recordBiometricData({
          ...mockBiometricData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const lowMatchResult = await behavioralBiometricsService.verifyBiometrics({
        ...mockBiometricData,
        typingPattern: {
          keystrokeIntervals: [300, 350, 280, 320],
          typingSpeed: 10,
          errorRate: 25,
        },
      });
      
      expect(lowMatchResult.riskLevel).toBe('high');
      
      const highMatchResult = await behavioralBiometricsService.verifyBiometrics({
        ...mockBiometricData,
        typingPattern: {
          keystrokeIntervals: [102, 118, 97, 111],
          typingSpeed: 44,
          errorRate: 2.2,
        },
      });
      
      expect(['low', 'medium']).toContain(highMatchResult.riskLevel);
    });
  });

  describe('getBiometricProfile', () => {
    it('should return empty array for unknown user/device', () => {
      const profile = behavioralBiometricsService.getBiometricProfile('unknown-user', 'unknown-device');
      expect(profile).toEqual([]);
    });

    it('should return recorded biometric profile', async () => {
      await behavioralBiometricsService.recordBiometricData(mockBiometricData);
      
      const profile = behavioralBiometricsService.getBiometricProfile(mockUserId, mockDeviceId);
      expect(profile).toHaveLength(1);
      expect(profile[0]).toEqual(mockBiometricData);
    });
  });

  describe('clearProfile', () => {
    it('should clear user biometric profile', async () => {
      await behavioralBiometricsService.recordBiometricData(mockBiometricData);
      await behavioralBiometricsService.recordBiometricData({
        ...mockBiometricData,
        timestamp: Date.now() + 1000,
      });
      
      expect(behavioralBiometricsService.getBiometricProfile(mockUserId, mockDeviceId)).toHaveLength(2);
      
      behavioralBiometricsService.clearProfile(mockUserId, mockDeviceId);
      
      expect(behavioralBiometricsService.getBiometricProfile(mockUserId, mockDeviceId)).toEqual([]);
    });
  });
});
