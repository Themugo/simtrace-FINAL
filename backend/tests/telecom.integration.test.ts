// tests/telecom.integration.test.ts - Integration tests for telecom module
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { User } from '../db/index.js';
import bcrypt from 'bcryptjs';

describe('Telecom Module Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let telecomUserId: string;
  let simId: string;
  let towerId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/simtrace-test');

    // Create test telecom admin
    const passwordHash = await bcrypt.hash('Telecom@123', 12);
    const telecomUser = await User.create({
      name: 'Test Telecom Admin',
      email: 'telecom-test@simtrace.site',
      passwordHash,
      role: 'telecom',
      phone: '+254700000007',
      emailVerified: true,
      phoneVerified: true,
    });
    telecomUserId = telecomUser._id.toString();

    // Create test admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      name: 'Test Admin',
      email: 'admin-test@simtrace.site',
      passwordHash: adminPasswordHash,
      role: 'admin',
      emailVerified: true,
    });

    // Login as telecom admin
    const telecomLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'telecom-test@simtrace.site', password: 'Telecom@123' });
    authToken = telecomLoginRes.body.token;

    // Login as admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-test@simtrace.site', password: 'Admin@123' });
    adminToken = adminLoginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /-test@simtrace\.site$/ });
    await mongoose.connection.close();
  });

  describe('SIM Card Management', () => {
    it('should register a SIM card', async () => {
      const res = await request(app)
        .post('/api/telecom/sim/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          imsi: '639010000000000',
          msisdn: '+254700000008',
          operator: 'safaricom',
          status: 'active',
          associatedDevice: '356938035643809',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('iccid', '89910000000000000001');
      expect(res.body).toHaveProperty('operator', 'safaricom');
      simId = res.body._id;
    });

    it('should get SIM card details', async () => {
      const res = await request(app)
        .get(`/api/telecom/sim/${simId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('iccid', '89910000000000000001');
    });

    it('should update SIM location', async () => {
      const res = await request(app)
        .post('/api/telecom/sim/location')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          location: {
            lat: -1.286389,
            lng: 36.817223,
            cellTowerId: 'NBO001',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lastActivity');
    });

    it('should flag SIM as stolen', async () => {
      const res = await request(app)
        .post('/api/telecom/sim/flag-stolen')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          reportedBy: telecomUserId,
          reason: 'Reported by owner as stolen',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'reported_stolen');
    });

    it('should detect SIM swap', async () => {
      const res = await request(app)
        .post('/api/telecom/sim/detect-swap')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          newIccid: '89910000000000000002',
          oldIccid: '89910000000000000001',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('swapDetected');
    });
  });

  describe('Network Activity Tracking', () => {
    it('should track call activity', async () => {
      const res = await request(app)
        .post('/api/telecom/activity/call')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          destination: '+254711111111',
          duration: 300,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('activityType', 'call');
    });

    it('should track SMS activity', async () => {
      const res = await request(app)
        .post('/api/telecom/activity/sms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          destination: '+254711111111',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('activityType', 'sms');
    });

    it('should track data activity', async () => {
      const res = await request(app)
        .post('/api/telecom/activity/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          iccid: '89910000000000000001',
          dataUsed: 1024000,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('activityType', 'data');
    });

    it('should get network activity for SIM', async () => {
      const res = await request(app)
        .get('/api/telecom/activity/sim/89910000000000000001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('activities');
      expect(Array.isArray(res.body.activities)).toBe(true);
    });
  });

  describe('Cell Tower Management', () => {
    it('should register a cell tower', async () => {
      const res = await request(app)
        .post('/api/telecom/tower/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          towerId: 'TEST001',
          operator: 'safaricom',
          location: {
            lat: -1.286389,
            lng: 36.817223,
            address: 'Nairobi CBD',
          },
          coverageRadius: 10,
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('towerId', 'TEST001');
      towerId = res.body._id;
    });

    it('should get cell tower details', async () => {
      const res = await request(app)
        .get(`/api/telecom/tower/${towerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('towerId', 'TEST001');
    });

    it('should get nearby cell towers', async () => {
      const res = await request(app)
        .get('/api/telecom/tower/nearby')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ lat: -1.286389, lng: 36.817223, radius: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('towers');
      expect(Array.isArray(res.body.towers)).toBe(true);
    });

    it('should list all cell towers', async () => {
      const res = await request(app)
        .get('/api/telecom/towers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('towers');
      expect(Array.isArray(res.body.towers)).toBe(true);
    });
  });

  describe('Cell Tower Triangulation', () => {
    it('should triangulate device location', async () => {
      const res = await request(app)
        .post('/api/telecom/triangulate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lat');
      expect(res.body).toHaveProperty('lng');
      expect(res.body).toHaveProperty('accuracy');
    });
  });

  describe('Provider Failover', () => {
    it('should test provider failover', async () => {
      const res = await request(app)
        .post('/api/telecom/failover/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          primaryProvider: 'safaricom',
          secondaryProvider: 'airtel',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('failoverStatus');
    });
  });

  describe('Telecom Statistics', () => {
    it('should get telecom statistics', async () => {
      const res = await request(app)
        .get('/api/telecom/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalSIMs');
      expect(res.body).toHaveProperty('activeSIMs');
      expect(res.body).toHaveProperty('reportedStolen');
    });
  });

  describe('Commission Calculation', () => {
    it('should calculate commission', async () => {
      const res = await request(app)
        .post('/api/telecom/commission/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          telecomCompanyId: telecomUserId,
          period: '2026-06',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalCommission');
      expect(res.body).toHaveProperty('successfulTriangulations');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for telecom endpoints', async () => {
      const res = await request(app)
        .get('/api/telecom/sims');

      expect(res.status).toBe(401);
    });

    it('should require telecom role for telecom endpoints', async () => {
      // Create regular user
      const passwordHash = await bcrypt.hash('User@123', 12);
      const regularUser = await User.create({
        name: 'Regular User',
        email: 'regular-test@simtrace.site',
        passwordHash,
        role: 'user',
        emailVerified: true,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'regular-test@simtrace.site', password: 'User@123' });
      const userToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/telecom/sims')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
