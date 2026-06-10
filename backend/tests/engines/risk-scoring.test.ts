// Risk Scoring Engine Integration Tests
// Test the risk scoring and threat detection functionality

import { connectDB } from '../../db/index.js';
import { Device } from '../../db/index.js';
import { Ping } from '../../db/index.js';
import { TrackingEvent } from '../../db/index.js';
import { RiskScoringEngine } from '../../engines/risk-scoring-engine.js';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Risk Scoring Engine Tests', () => {
  let engine: RiskScoringEngine;
  let testDevice: any;
  let testImei: string;

  beforeAll(async () => {
    await connectDB();
    engine = new RiskScoringEngine();

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

  afterAll(async () => {
    // Cleanup test data
    await Device.deleteOne({ imei: testImei });
    await Ping.deleteMany({ imei: testImei });
    await TrackingEvent.deleteMany({ imei: testImei });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score for device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.calculateRiskScore({ imei: testImei }, context);

      expect(result).to.have.property('imei');
      expect(result.imei).to.equal(testImei);
      expect(result).to.have.property('riskScore');
      expect(result.riskScore).to.be.a('number');
      expect(result.riskScore).to.be.at.least(0);
      expect(result.riskScore).to.be.at.most(100);
      expect(result).to.have.property('threatLevel');
      expect(result).to.have.property('factors');
      expect(result.factors).to.be.an('array');
    });

    it('should return higher risk for blacklisted device', async () => {
      // Update device to blacklisted
      await Device.updateOne({ imei: testImei }, { status: 'blacklisted' });

      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.calculateRiskScore({ imei: testImei }, context);

      expect(result.riskScore).to.be.greaterThan(50);
      expect(result.threatLevel).to.equal('HIGH' || 'CRITICAL');

      // Reset device status
      await Device.updateOne({ imei: testImei }, { status: 'active' });
    });
  });

  describe('getRiskFactors', () => {
    it('should return risk factors for device', async () => {
      // Create test pings
      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      const factors = await engine.getRiskFactors(testImei);

      expect(factors).to.be.an('array');
      expect(factors).to.have.property('length');
    });

    it('should detect SIM swap as risk factor', async () => {
      // Create pings with different SIM
      await Ping.create({
        imei: testImei,
        ts: new Date(Date.now() - 7200000), // 2 hours ago
        lat: 1.0,
        lng: 1.0,
        sim: '1234567890123456789',
        ip: '192.168.1.1',
      });

      await Ping.create({
        imei: testImei,
        ts: new Date(),
        lat: 1.0,
        lng: 1.0,
        sim: '9876543210987654321', // Different SIM
        ip: '192.168.1.1',
      });

      const factors = await engine.getRiskFactors(testImei);

      expect(factors).to.be.an('array');
      // Check if SIM swap is detected
      const simSwapFactor = factors.find(f => f.type === 'sim_swap');
      expect(simSwapFactor).to.exist;
    });
  });

  describe('getRiskHistory', () => {
    it('should return risk history for device', async () => {
      // Create tracking events with risk scores
      await TrackingEvent.create({
        imei: testImei,
        timestamp: new Date(),
        riskScore: 50,
        threatLevel: 'MEDIUM',
      });

      const history = await engine.getRiskHistory(testImei, 30);

      expect(history).to.be.an('array');
      expect(history).to.have.property('length');
    });

    it('should filter history by date range', async () => {
      const history = await engine.getRiskHistory(testImei, 7); // Last 7 days

      expect(history).to.be.an('array');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', async () => {
      const distance = (engine as any).calculateDistance(0, 0, 1, 1);

      expect(distance).to.be.a('number');
      expect(distance).to.be.greaterThan(0);
    });

    it('should return 0 for same point', async () => {
      const distance = (engine as any).calculateDistance(0, 0, 0, 0);

      expect(distance).to.equal(0);
    });
  });
});
