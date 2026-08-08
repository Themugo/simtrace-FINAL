// tests/ai/anomalyDetection.test.ts - Tests for anomaly detection service
import { anomalyDetectionService } from '../../services/ai/anomalyDetection.js';
import type { DeviceBehaviorData } from '../../services/ai/anomalyDetection.js';

describe('AnomalyDetectionService', () => {
  const mockDeviceId = 'test-device-123';
  const mockBehaviorData: DeviceBehaviorData = {
    deviceId: mockDeviceId,
    timestamp: Date.now(),
    location: { lat: -1.2921, lng: 36.8219 },
    batteryLevel: 85,
    networkType: 'wifi',
    appUsage: [
      { appId: 'app1', duration: 30 },
      { appId: 'app2', duration: 45 },
    ],
    screenTime: 120,
    dataUsage: 150,
  };

  beforeEach(() => {
    // Clear any existing data for the test device
    anomalyDetectionService.clearHistory(mockDeviceId);
  });

  afterEach(() => {
    // Clean up after each test
    anomalyDetectionService.clearHistory(mockDeviceId);
  });

  describe('recordBehavior', () => {
    it('should record device behavior data', async () => {
      await anomalyDetectionService.recordBehavior(mockBehaviorData);
      
      const history = anomalyDetectionService.getBehaviorHistory(mockDeviceId);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockBehaviorData);
    });

    it('should maintain history window limit', async () => {
      const windowSize = 105; // Slightly above the HISTORY_WINDOW of 100
      
      for (let i = 0; i < windowSize; i++) {
        await anomalyDetectionService.recordBehavior({
          ...mockBehaviorData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const history = anomalyDetectionService.getBehaviorHistory(mockDeviceId);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('detectAnomaly', () => {
    it('should return no anomaly for insufficient data', async () => {
      const result = await anomalyDetectionService.detectAnomaly(mockDeviceId, mockBehaviorData);
      
      expect(result.anomalyScore).toBe(0);
      expect(result.anomalyType).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should detect anomalies with sufficient data', async () => {
      // Record enough data points to establish a baseline
      for (let i = 0; i < 15; i++) {
        await anomalyDetectionService.recordBehavior({
          ...mockBehaviorData,
          timestamp: Date.now() + i * 1000,
          location: { lat: -1.2921, lng: 36.8219 },
          batteryLevel: 80 + Math.random() * 10, // Normal variation
        });
      }
      
      // Test with normal data
      const normalResult = await anomalyDetectionService.detectAnomaly(mockDeviceId, {
        ...mockBehaviorData,
        location: { lat: -1.2921, lng: 36.8219 },
        batteryLevel: 85,
      });
      
      expect(normalResult.anomalyScore).toBeGreaterThan(0);
      expect(normalResult.anomalyScore).toBeLessThan(1);
      
      // Test with anomalous data
      const anomalousResult = await anomalyDetectionService.detectAnomaly(mockDeviceId, {
        ...mockBehaviorData,
        location: { lat: -1.5, lng: 37.0 }, // Significant location change
        batteryLevel: 10, // Significant battery drop
      });
      
      expect(anomalousResult.anomalyScore).toBeGreaterThan(normalResult.anomalyScore);
    });

    it('should provide detailed anomaly breakdown', async () => {
      // Record baseline data
      for (let i = 0; i < 15; i++) {
        await anomalyDetectionService.recordBehavior({
          ...mockBehaviorData,
          timestamp: Date.now() + i * 1000,
        });
      }
      
      const result = await anomalyDetectionService.detectAnomaly(mockDeviceId, mockBehaviorData);
      
      expect(result.details).toBeDefined();
      expect(result.details.locationAnomaly).toBeDefined();
      expect(result.details.usageAnomaly).toBeDefined();
      expect(result.details.networkAnomaly).toBeDefined();
      expect(result.details.batteryAnomaly).toBeDefined();
    });
  });

  describe('getBehaviorHistory', () => {
    it('should return empty array for unknown device', () => {
      const history = anomalyDetectionService.getBehaviorHistory('unknown-device');
      expect(history).toEqual([]);
    });

    it('should return recorded behavior history', async () => {
      await anomalyDetectionService.recordBehavior(mockBehaviorData);
      
      const history = anomalyDetectionService.getBehaviorHistory(mockDeviceId);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockBehaviorData);
    });
  });

  describe('clearHistory', () => {
    it('should clear device behavior history', async () => {
      await anomalyDetectionService.recordBehavior(mockBehaviorData);
      await anomalyDetectionService.recordBehavior({
        ...mockBehaviorData,
        timestamp: Date.now() + 1000,
      });
      
      expect(anomalyDetectionService.getBehaviorHistory(mockDeviceId)).toHaveLength(2);
      
      anomalyDetectionService.clearHistory(mockDeviceId);
      
      expect(anomalyDetectionService.getBehaviorHistory(mockDeviceId)).toEqual([]);
    });
  });
});
