// Device Intelligence Engine Integration Tests
// Test the device intelligence analysis functionality

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { connectDB } from '../db/index.js';
import { Device } from '../db/index.js';
import { Ping } from '../db/index.js';
import { DeviceIntelligenceEngine } from '../engines/device-intelligence-engine.js';

describe('Device Intelligence Engine Tests', () => {
  let engine: DeviceIntelligenceEngine;
  let testDevice: any;
  let testImei: string;

  before(async () => {
    await connectDB();
    engine = new DeviceIntelligenceEngine();

    // Create test device
    testImei = '123456789012345';
    testDevice = await Device.create({
      imei: testImei,
      status: 'active',
      owner: 'test_user_id',
      make: 'Test',
      model: 'Test Device',
      serial: 'TEST123',
    });
  });

  after(async () => {
    // Cleanup test data
    await Device.deleteOne({ imei: testImei });
    await Ping.deleteMany({ imei: testImei });
  });

  describe('analyze', () => {
    it('should analyze device with no pings', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: testImei }, context);

      expect(result).to.have.property('imei');
      expect(result.imei).to.equal(testImei);
      expect(result).to.have.property('profile');
      expect(result).to.have.property('behavior');
      expect(result).to.have.property('anomalies');
      expect(result).to.have.property('confidence');
    });

    it('should analyze device with recent pings', async () => {
      // Create test pings
      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: testImei }, context);

      expect(result).to.have.property('imei');
      expect(result.imei).to.equal(testImei);
      expect(result).to.have.property('profile');
      expect(result).to.have.property('behavior');
      expect(result).to.have.property('anomalies');
      expect(result).to.have.property('confidence');
    });

    it('should detect location anomalies', async () => {
      // Create pings with location jump
      await Ping.create({
        imei: testImei,
        ts: new Date(Date.now() - 3600000), // 1 hour ago
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 50.0, // Large jump
        lng: 50.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: testImei }, context);

      expect(result).to.have.property('anomalies');
      expect(result.anomalies).to.be.an('array');
    });
  });

  describe('getDeviceProfile', () => {
    it('should return device profile', async () => {
      const profile = await engine.getDeviceProfile(testImei);

      expect(profile).to.be.an('object');
      expect(profile).to.have.property('imei');
      expect(profile.imei).to.equal(testImei);
    });

    it('should return null for non-existent device', async () => {
      const profile = await engine.getDeviceProfile('999999999999999');

      expect(profile).to.be.null;
    });
  });

  describe('analyzeBehavior', () => {
    it('should analyze device behavior', async () => {
      const behavior = await engine.analyzeBehavior(testImei);

      expect(behavior).to.be.an('object');
      expect(behavior).to.have.property('activityLevel');
      expect(behavior).to.have.property('movementPattern');
      expect(behavior).to.have.property('networkUsage');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in device data', async () => {
      const anomalies = await engine.detectAnomalies(testImei);

      expect(anomalies).to.be.an('array');
    });
  });
});
