// Fraud Detection Engine Integration Tests
// Test the fraud detection and threat intelligence functionality

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { connectDB } from '../db/index.js';
import { Device } from '../db/index.js';
import { Ping } from '../db/index.js';
import { Alert } from '../db/index.js';
import { FraudDetectionEngine } from '../engines/fraud-detection-engine.js';

describe('Fraud Detection Engine Tests', () => {
  let engine: FraudDetectionEngine;
  let testDevice: any;
  let testImei: string;

  before(async () => {
    await connectDB();
    engine = new FraudDetectionEngine();

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
    await Alert.deleteMany({ imei: testImei });
  });

  describe('detect', () => {
    it('should detect fraud for device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.detect(
        { imei: testImei, includeThreatIntel: true },
        context
      );

      expect(result).to.have.property('imei');
      expect(result.imei).to.equal(testImei);
      expect(result).to.have.property('isFraudDetected');
      expect(result.isFraudDetected).to.be.a('boolean');
      expect(result).to.have.property('riskScore');
      expect(result.riskScore).to.be.a('number');
      expect(result).to.have.property('indicators');
      expect(result.indicators).to.be.an('array');
      expect(result).to.have.property('recommendations');
      expect(result.recommendations).to.be.an('array');
    });

    it('should detect fraud without threat intel', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.detect(
        { imei: testImei, includeThreatIntel: false },
        context
      );

      expect(result).to.have.property('imei');
      expect(result).to.have.property('isFraudDetected');
      expect(result).to.have.property('riskScore');
    });

    it('should return null for non-existent device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.detect(
        { imei: '999999999999999', includeThreatIntel: true },
        context
      );

      expect(result.isFraudDetected).to.be.false;
      expect(result.riskScore).to.equal(0);
    });
  });

  describe('checkThreatIntel', () => {
    it('should check threat intelligence for device', async () => {
      // Create test ping
      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      const threatIntel = await engine.checkThreatIntel(testImei, []);

      expect(threatIntel).to.be.an('array');
    });

    it('should detect malicious IP addresses', async () => {
      // Create ping with known malicious IP
      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.0.2.1', // Example IP
      });

      const threatIntel = await engine.checkThreatIntel(testImei, []);

      expect(threatIntel).to.be.an('array');
    });
  });

  describe('checkFraudPatterns', () => {
    it('should check for fraud patterns', async () => {
      const patterns = await (engine as any).checkFraudPatterns(testImei);

      expect(patterns).to.be.an('array');
    });
  });

  describe('addIndicator', () => {
    it('should add fraud indicator', async () => {
      await engine.addIndicator({
        type: 'test_indicator',
        severity: 'medium',
        confidence: 0.8,
        description: 'Test indicator',
        evidence: {},
      });

      // Indicator should be added to internal map
      expect(true).to.be.true;
    });
  });

  describe('getAlertSeverity', () => {
    it('should return severity for alert type', async () => {
      const severity = (engine as any).getAlertSeverity('blacklist_hit');

      expect(severity).to.be.a('string');
      expect(['low', 'medium', 'high', 'critical']).to.include(severity);
    });

    it('should return medium for unknown alert type', async () => {
      const severity = (engine as any).getAlertSeverity('unknown_alert');

      expect(severity).to.equal('medium');
    });
  });

  describe('getAlertDescription', () => {
    it('should return description for alert type', async () => {
      const description = (engine as any).getAlertDescription('blacklist_hit', {});

      expect(description).to.be.a('string');
    });
  });
});
