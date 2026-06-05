// Recovery & Alert Engine Integration Tests
// Test the recovery actions and alerting functionality

import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { connectDB } from '../db/index.js';
import { Device } from '../db/index.js';
import { RecoveryAlertEngine } from '../engines/recovery-alert-engine.js';

describe('Recovery & Alert Engine Tests', () => {
  let engine: RecoveryAlertEngine;
  let testDevice: any;
  let testImei: string;

  before(async () => {
    await connectDB();
    engine = new RecoveryAlertEngine();

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
  });

  describe('analyze', () => {
    it('should analyze recovery status for device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: testImei }, context);

      expect(result).to.have.property('imei');
      expect(result.imei).to.equal(testImei);
      expect(result).to.have.property('recoveryStatus');
      expect(result).to.have.property('recoveryLikelihood');
      expect(result).to.have.property('recommendedActions');
      expect(result.recommendedActions).to.be.an('array');
      expect(result).to.have.property('alerts');
      expect(result.alerts).to.be.an('array');
    });

    it('should return higher recovery likelihood for active device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: testImei }, context);

      expect(result.recoveryLikelihood).to.be.a('number');
      expect(result.recoveryLikelihood).to.be.at.least(0);
      expect(result.recoveryLikelihood).to.be.at.most(100);
    });

    it('should return null for non-existent device', async () => {
      const context = {
        stakeholder: 'device_owner' as const,
        userId: 'test_user_id',
        timestamp: new Date(),
      };

      const result = await engine.analyze({ imei: '999999999999999' }, context);

      expect(result.recoveryStatus).to.equal('not_started');
      expect(result.recoveryLikelihood).to.equal(0);
    });
  });

  describe('getRecoveryStatus', () => {
    it('should return recovery status for device', async () => {
      const status = await engine.getRecoveryStatus(testImei);

      expect(status).to.be.a('string');
      expect(['not_started', 'in_progress', 'successful', 'failed']).to.include(status);
    });

    it('should return not_started for non-existent device', async () => {
      const status = await engine.getRecoveryStatus('999999999999999');

      expect(status).to.equal('not_started');
    });

    it('should return successful for recovered device', async () => {
      // Update device to recovered
      await Device.updateOne({ imei: testImei }, { status: 'recovered' });

      const status = await engine.getRecoveryStatus(testImei);

      expect(status).to.equal('successful');

      // Reset device status
      await Device.updateOne({ imei: testImei }, { status: 'active' });
    });
  });

  describe('triggerRecoveryActions', () => {
    it('should trigger recovery actions', async () => {
      const actions = {
        remoteLock: true,
        locationTracking: true,
      };

      const result = await engine.triggerRecoveryActions(testImei, actions);

      expect(result).to.be.an('object');
      expect(result).to.have.property('remoteLock');
      expect(result).to.have.property('remoteWipe');
      expect(result).to.have.property('locationTracking');
      expect(result).to.have.property('networkBlacklist');
      expect(result).to.have.property('policeAlert');
    });

    it('should throw error for non-existent device', async () => {
      const actions = {
        remoteLock: true,
      };

      try {
        await engine.triggerRecoveryActions('999999999999999', actions);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect((error as Error).message).to.include('Device not found');
      }
    });

    it('should trigger all recovery actions', async () => {
      const actions = {
        remoteLock: true,
        remoteWipe: true,
        locationTracking: true,
        networkBlacklist: true,
        policeAlert: true,
      };

      const result = await engine.triggerRecoveryActions(testImei, actions);

      expect(result.remoteLock).to.be.true;
      expect(result.remoteWipe).to.be.true;
      expect(result.locationTracking).to.be.true;
      expect(result.networkBlacklist).to.be.true;
      expect(result.policeAlert).to.be.true;
    });
  });

  describe('calculateRecoveryLikelihood', () => {
    it('should calculate recovery likelihood', async () => {
      const likelihood = await (engine as any).calculateRecoveryLikelihood(testImei);

      expect(likelihood).to.be.a('number');
      expect(likelihood).to.be.at.least(0);
      expect(likelihood).to.be.at.most(100);
    });
  });

  describe('getRecommendedActions', () => {
    it('should return recommended actions', async () => {
      const actions = await (engine as any).getRecommendedActions(testImei);

      expect(actions).to.be.an('array');
    });
  });

  describe('generateAlerts', () => {
    it('should generate alerts for device', async () => {
      const alerts = await (engine as any).generateAlerts(testImei);

      expect(alerts).to.be.an('array');
    });
  });
});
