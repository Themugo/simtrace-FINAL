// tests/ai/predictiveAnalytics.test.ts - Tests for predictive analytics service
import { predictiveAnalyticsService } from '../../services/ai/predictiveAnalytics.js';
import type { LocationData } from '../../services/ai/predictiveAnalytics.js';

describe('PredictiveAnalyticsService', () => {
  const mockDeviceId = 'test-device-456';
  const mockLocationData: LocationData = {
    deviceId: mockDeviceId,
    timestamp: Date.now(),
    location: { lat: -1.2921, lng: 36.8219 },
    locationType: 'home',
    timeOfDay: 14,
    dayOfWeek: 3,
  };

  beforeEach(() => {
    // Clear any existing data for the test device
    predictiveAnalyticsService.clearHistory(mockDeviceId);
  });

  afterEach(() => {
    // Clean up after each test
    predictiveAnalyticsService.clearHistory(mockDeviceId);
  });

  describe('recordLocation', () => {
    it('should record location data', async () => {
      await predictiveAnalyticsService.recordLocation(mockLocationData);
      
      const history = predictiveAnalyticsService.getLocationHistory(mockDeviceId);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockLocationData);
    });

    it('should maintain history window limit', async () => {
      const windowSize = 205; // Slightly above the HISTORY_WINDOW of 200
      
      for (let i = 0; i < windowSize; i++) {
        await predictiveAnalyticsService.recordLocation({
          ...mockLocationData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const history = predictiveAnalyticsService.getLocationHistory(mockDeviceId);
      expect(history.length).toBeLessThanOrEqual(200);
    });
  });

  describe('calculateRiskScore', () => {
    it('should return risk score with confidence', async () => {
      const result = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, mockLocationData);
      
      expect(result).toBeDefined();
      expect(result.deviceId).toBe(mockDeviceId);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(1);
      expect(result.riskLevel).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide risk factors breakdown', async () => {
      const result = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, mockLocationData);
      
      expect(result.factors).toBeDefined();
      expect(result.factors.locationRisk).toBeGreaterThanOrEqual(0);
      expect(result.factors.timeRisk).toBeGreaterThanOrEqual(0);
      expect(result.factors.patternRisk).toBeGreaterThanOrEqual(0);
      expect(result.factors.historicalRisk).toBeGreaterThanOrEqual(0);
    });

    it('should provide recommendations based on risk level', async () => {
      const result = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, mockLocationData);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should increase risk for night time locations', async () => {
      const dayResult = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, {
        ...mockLocationData,
        timeOfDay: 14, // 2 PM
      });
      
      const nightResult = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, {
        ...mockLocationData,
        timeOfDay: 23, // 11 PM
      });
      
      expect(nightResult.factors.timeRisk).toBeGreaterThan(dayResult.factors.timeRisk);
    });

    it('should increase confidence with more data', async () => {
      // Record some location data
      for (let i = 0; i < 20; i++) {
        await predictiveAnalyticsService.recordLocation({
          ...mockLocationData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const result = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, mockLocationData);
      expect(result.confidence).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('recordTheftIncident', () => {
    it('should record theft incident at location', async () => {
      const location = { lat: -1.3, lng: 36.9 };
      
      predictiveAnalyticsService.recordTheftIncident(location);
      
      // This should increase historical risk for this location
      const result = await predictiveAnalyticsService.calculateRiskScore(mockDeviceId, {
        ...mockLocationData,
        location,
      });
      
      expect(result.factors.historicalRisk).toBeGreaterThan(0);
    });
  });

  describe('getLocationHistory', () => {
    it('should return empty array for unknown device', () => {
      const history = predictiveAnalyticsService.getLocationHistory('unknown-device');
      expect(history).toEqual([]);
    });

    it('should return recorded location history', async () => {
      await predictiveAnalyticsService.recordLocation(mockLocationData);
      
      const history = predictiveAnalyticsService.getLocationHistory(mockDeviceId);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockLocationData);
    });
  });

  describe('clearHistory', () => {
    it('should clear device location history', async () => {
      await predictiveAnalyticsService.recordLocation(mockLocationData);
      await predictiveAnalyticsService.recordLocation({
        ...mockLocationData,
        timestamp: Date.now() + 1000,
      });
      
      expect(predictiveAnalyticsService.getLocationHistory(mockDeviceId)).toHaveLength(2);
      
      predictiveAnalyticsService.clearHistory(mockDeviceId);
      
      expect(predictiveAnalyticsService.getLocationHistory(mockDeviceId)).toEqual([]);
    });
  });
});
