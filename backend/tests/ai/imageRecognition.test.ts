// tests/ai/imageRecognition.test.ts - Tests for image recognition service
import { imageRecognitionService } from '../../services/ai/imageRecognition.js';
import type { DeviceImageData } from '../../services/ai/imageRecognition.js';

describe('ImageRecognitionService', () => {
  const mockDeviceId = 'test-device-999';
  const mockImageData: DeviceImageData = {
    deviceId: mockDeviceId,
    imageId: 'test-image-123',
    timestamp: Date.now(),
    imageData: Buffer.from('mock-image-data'),
    imageType: 'photo',
    metadata: {
      resolution: { width: 1920, height: 1080 },
      deviceOrientation: 'portrait',
    },
  };

  beforeEach(() => {
    // Clear any existing data for the test device
    imageRecognitionService.removeDevice(mockDeviceId);
  });

  afterEach(() => {
    // Clean up after each test
    imageRecognitionService.removeDevice(mockDeviceId);
  });

  describe('registerDeviceImage', () => {
    it('should register device image', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const knownDevices = imageRecognitionService.getKnownDevices();
      expect(knownDevices).toContain(mockDeviceId);
    });

    it('should extract features from image data', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      // The service should have stored features for this device
      const knownDevices = imageRecognitionService.getKnownDevices();
      expect(knownDevices.length).toBeGreaterThan(0);
    });
  });

  describe('identifyDevice', () => {
    it('should return no match for unknown device', async () => {
      const result = await imageRecognitionService.identifyDevice(Buffer.from('unknown-image'));
      
      expect(result.isDevice).toBe(false);
      expect(result.matchScore).toBe(0);
      expect(result.deviceId).toBe('');
    });

    it('should identify registered device', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const result = await imageRecognitionService.identifyDevice(mockImageData.imageData);
      
      expect(result).toBeDefined();
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(1);
    });

    it('should provide device type and brand when available', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const result = await imageRecognitionService.identifyDevice(mockImageData.imageData);
      
      if (result.isDevice) {
        expect(result.deviceType).toBeDefined();
        expect(result.deviceBrand).toBeDefined();
      }
    });
  });

  describe('verifyDeviceImage', () => {
    it('should return no match for unregistered device', async () => {
      const result = await imageRecognitionService.verifyDeviceImage('unknown-device', Buffer.from('test-image'));
      
      expect(result.isDevice).toBe(false);
      expect(result.matchScore).toBe(0);
    });

    it('should verify registered device image', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const result = await imageRecognitionService.verifyDeviceImage(mockDeviceId, mockImageData.imageData);
      
      expect(result.deviceId).toBe(mockDeviceId);
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(1);
    });

    it('should provide visual features in result', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const result = await imageRecognitionService.verifyDeviceImage(mockDeviceId, mockImageData.imageData);
      
      expect(result.details).toBeDefined();
      expect(result.details.visualFeatures).toBeDefined();
      expect(Array.isArray(result.details.visualFeatures)).toBe(true);
    });
  });

  describe('getKnownDevices', () => {
    it('should return empty array initially', () => {
      const knownDevices = imageRecognitionService.getKnownDevices();
      expect(knownDevices).toEqual([]);
    });

    it('should return list of registered devices', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      const knownDevices = imageRecognitionService.getKnownDevices();
      expect(knownDevices).toContain(mockDeviceId);
    });
  });

  describe('removeDevice', () => {
    it('should remove device from known devices', async () => {
      await imageRecognitionService.registerDeviceImage(mockImageData);
      
      expect(imageRecognitionService.getKnownDevices()).toContain(mockDeviceId);
      
      imageRecognitionService.removeDevice(mockDeviceId);
      
      expect(imageRecognitionService.getKnownDevices()).not.toContain(mockDeviceId);
    });

    it('should handle removing non-existent device', () => {
      expect(() => {
        imageRecognitionService.removeDevice('non-existent-device');
      }).not.toThrow();
    });
  });

  describe('detectDeviceType', () => {
    it('should return device type prediction', async () => {
      const result = await imageRecognitionService.detectDeviceType(Buffer.from('test-image'));
      
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('detectDeviceBrand', () => {
    it('should return device brand prediction', async () => {
      const result = await imageRecognitionService.detectDeviceBrand(Buffer.from('test-image'));
      
      expect(result).toBeDefined();
      expect(result.brand).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
