// tests/devices.integration.test.ts - Integration tests for device management
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { User, Device } from '../db/index.js';
import bcrypt from 'bcryptjs';

describe('Device Management Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let userId: string;
  let deviceId: string;
  let deviceKey: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/simtrace-test');

    // Create test user
    const passwordHash = await bcrypt.hash('User@123', 12);
    const user = await User.create({
      name: 'Test User',
      email: 'device-test@simtrace.site',
      passwordHash,
      role: 'user',
      phone: '+254700000010',
      emailVerified: true,
      phoneVerified: true,
    });
    userId = user._id.toString();

    // Create test admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      name: 'Test Admin',
      email: 'admin-device@simtrace.site',
      passwordHash: adminPasswordHash,
      role: 'admin',
      emailVerified: true,
    });

    // Login as user
    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'device-test@simtrace.site', password: 'User@123' });
    authToken = userLoginRes.body.token;

    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-device@simtrace.site', password: 'Admin@123' });
    adminToken = adminLoginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /-test@simtrace\.site$/ });
    await Device.deleteMany({ owner: userId });
    await mongoose.connection.close();
  });

  describe('Device Registration', () => {
    it('should register a new device', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          name: 'Test Device',
          brand: 'Samsung',
          model: 'Galaxy S24',
          os: 'Android',
          osVersion: '14',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('imei', '356938035643809');
      expect(res.body).toHaveProperty('deviceKey');
      expect(res.body).toHaveProperty('owner', userId);
      deviceId = res.body._id;
      deviceKey = res.body.deviceKey;
    });

    it('should not register device with existing IMEI', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          name: 'Duplicate Device',
        });

      expect(res.status).toBe(409);
    });

    it('should validate IMEI format', async () => {
      const res = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: 'invalid-imei',
          name: 'Invalid Device',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Device Listing', () => {
    it('should list user devices', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('devices');
      expect(Array.isArray(res.body.devices)).toBe(true);
      expect(res.body.devices.length).toBeGreaterThan(0);
    });

    it('should list all devices for admin', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ all: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('devices');
    });

    it('should not list all devices for regular user', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ all: true });

      expect(res.status).toBe(403);
    });
  });

  describe('Device Details', () => {
    it('should get device details', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('imei', '356938035643809');
      expect(res.body).toHaveProperty('name', 'Test Device');
    });

    it('should not get device without ownership', async () => {
      // Create another user
      const passwordHash = await bcrypt.hash('User@123', 12);
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another-device@simtrace.site',
        passwordHash,
        role: 'user',
        emailVerified: true,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'another-device@simtrace.site', password: 'User@123' });
      const anotherToken = loginRes.body.token;

      const res = await request(app)
        .get(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });

    it('should get device details with risk score', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ includeRisk: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('riskScore');
    });
  });

  describe('Device Update', () => {
    it('should update device details', async () => {
      const res = await request(app)
        .patch(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Device Name',
          status: 'active',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Device Name');
    });

    it('should not update device without ownership', async () => {
      const res = await request(app)
        .patch(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Update',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Device Deletion', () => {
    let deleteDeviceId: string;

    beforeAll(async () => {
      // Create a device to delete
      const device = await Device.create({
        imei: '356938035643810',
        name: 'Device to Delete',
        brand: 'Samsung',
        model: 'Galaxy S23',
        owner: userId,
        deviceKey: 'delete-test-key',
      });
      deleteDeviceId = device._id.toString();
    });

    it('should delete device', async () => {
      const res = await request(app)
        .delete(`/api/devices/${deleteDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not delete device without ownership', async () => {
      const res = await request(app)
        .delete(`/api/devices/${deviceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Device Status Update', () => {
    it('should update device status to stolen', async () => {
      const res = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'stolen',
          incidentDate: new Date().toISOString(),
          incidentLocation: {
            lat: -1.286389,
            lng: 36.817223,
            address: 'Nairobi CBD',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'stolen');
    });

    it('should update device status to recovered', async () => {
      const res = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'recovered',
          recoveryNotes: 'Device recovered by police',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'recovered');
    });
  });

  describe('Device Tracking', () => {
    it('should accept device ping with device key', async () => {
      const res = await request(app)
        .post('/api/track/ping')
        .send({
          deviceKey: deviceKey,
          lat: -1.286389,
          lng: 36.817223,
          accuracy: 10,
          battery: 80,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not accept ping without device key', async () => {
      const res = await request(app)
        .post('/api/track/ping')
        .send({
          lat: -1.286389,
          lng: 36.817223,
        });

      expect(res.status).toBe(400);
    });

    it('should not accept ping with invalid device key', async () => {
      const res = await request(app)
        .post('/api/track/ping')
        .send({
          deviceKey: 'invalid-key',
          lat: -1.286389,
          lng: 36.817223,
        });

      expect(res.status).toBe(401);
    });

    it('should enforce rate limiting on track endpoint', async () => {
      const promises = [];
      for (let i = 0; i < 125; i++) {
        promises.push(
          request(app)
            .post('/api/track/ping')
            .send({
              deviceKey: deviceKey,
              lat: -1.286389,
              lng: 36.817223,
            })
        );
      }

      const results = await Promise.all(promises);
      const rateLimited = results.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Device Evidence', () => {
    it('should upload device evidence', async () => {
      const res = await request(app)
        .post(`/api/devices/${deviceId}/evidence`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'photo',
          url: 'https://example.com/evidence.jpg',
          timestamp: new Date().toISOString(),
          location: {
            lat: -1.286389,
            lng: 36.817223,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('type', 'photo');
    });

    it('should get device evidence', async () => {
      const res = await request(app)
        .get(`/api/devices/${deviceId}/evidence`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('evidence');
      expect(Array.isArray(res.body.evidence)).toBe(true);
    });
  });

  describe('IMEI Check', () => {
    it('should check IMEI status', async () => {
      const res = await request(app)
        .post('/api/imei/check')
        .send({
          imei: '356938035643809',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('risk');
    });

    it('should enforce rate limiting on IMEI check', async () => {
      const promises = [];
      for (let i = 0; i < 35; i++) {
        promises.push(
          request(app)
            .post('/api/imei/check')
            .send({ imei: '356938035643809' })
        );
      }

      const results = await Promise.all(promises);
      const rateLimited = results.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Admin Device Management', () => {
    it('should get admin device statistics', async () => {
      const res = await request(app)
        .get('/api/admin/devices/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalDevices');
      expect(res.body).toHaveProperty('activeDevices');
    });

    it('should not get admin stats without admin role', async () => {
      const res = await request(app)
        .get('/api/admin/devices/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });
  });
});
