// tests/police.integration.test.ts - Integration tests for police module
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { User } from '../db/index.js';
import bcrypt from 'bcryptjs';

describe('Police Module Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let policeUserId: string;
  let stationId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/simtrace-test');

    // Create test police officer
    const passwordHash = await bcrypt.hash('Police@123', 12);
    const policeUser = await User.create({
      name: 'Test Police Officer',
      email: 'police-test@simtrace.site',
      passwordHash,
      role: 'law_enforcement',
      phone: '+254700000005',
      emailVerified: true,
      phoneVerified: true,
    });
    policeUserId = policeUser._id.toString();

    // Create test admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    await User.create({
      name: 'Test Admin',
      email: 'admin-test@simtrace.site',
      passwordHash: adminPasswordHash,
      role: 'admin',
      emailVerified: true,
    });

    // Login as police officer
    const policeLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'police-test@simtrace.site', password: 'Police@123' });
    authToken = policeLoginRes.body.token;

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

  describe('Police Station Management', () => {
    it('should create a police station (admin only)', async () => {
      const res = await request(app)
        .post('/api/police/stations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stationCode: 'TEST001',
          name: 'Test Police Station',
          jurisdiction: 'Test County',
          address: 'Test Address',
          phone: '+254700000006',
          email: 'test@police.go.ke',
          stationHead: 'Test Inspector',
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('stationCode', 'TEST001');
      expect(res.body).toHaveProperty('name', 'Test Police Station');
      stationId = res.body._id;
    });

    it('should not create station without admin role', async () => {
      const res = await request(app)
        .post('/api/police/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stationCode: 'TEST002',
          name: 'Unauthorized Station',
        });

      expect(res.status).toBe(403);
    });

    it('should list all police stations', async () => {
      const res = await request(app)
        .get('/api/police/stations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stations');
      expect(Array.isArray(res.body.stations)).toBe(true);
    });

    it('should get a specific police station', async () => {
      const res = await request(app)
        .get(`/api/police/stations/${stationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stationCode', 'TEST001');
    });

    it('should update a police station (admin only)', async () => {
      const res = await request(app)
        .patch(`/api/police/stations/${stationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Test Station' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Test Station');
    });
  });

  describe('Police Report Management', () => {
    let reportId: string;

    it('should create a police report', async () => {
      const res = await request(app)
        .post('/api/police/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stationId: stationId,
          imei: '356938035643809',
          incidentDate: new Date().toISOString(),
          incidentLocation: {
            lat: -1.286389,
            lng: 36.817223,
            address: 'Nairobi CBD',
          },
          description: 'Test theft report',
          status: 'pending',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('reportNumber');
      expect(res.body).toHaveProperty('imei', '356938035643809');
      reportId = res.body._id;
    });

    it('should get a specific police report', async () => {
      const res = await request(app)
        .get(`/api/police/reports/${reportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reportNumber');
    });

    it('should get reports by station', async () => {
      const res = await request(app)
        .get(`/api/police/reports/station/${stationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    it('should confirm a police report', async () => {
      const res = await request(app)
        .patch(`/api/police/reports/${reportId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmationNotes: 'Report confirmed by officer' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'confirmed');
    });
  });

  describe('Nationwide Alerts', () => {
    let alertId: string;

    it('should create a nationwide alert', async () => {
      const res = await request(app)
        .post('/api/police/alerts/nationwide')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          alertType: 'stolen_device',
          priority: 'high',
          description: 'Test nationwide alert',
          lastKnownLocation: {
            lat: -1.286389,
            lng: 36.817223,
            timestamp: new Date().toISOString(),
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('imei', '356938035643809');
      expect(res.body).toHaveProperty('priority', 'high');
      alertId = res.body._id;
    });

    it('should get a specific nationwide alert', async () => {
      const res = await request(app)
        .get(`/api/police/alerts/nationwide/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('imei', '356938035643809');
    });

    it('should list all nationwide alerts', async () => {
      const res = await request(app)
        .get('/api/police/alerts/nationwide')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('alerts');
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });
  });

  describe('Recovery Workflow', () => {
    let workflowId: string;

    it('should create a recovery workflow', async () => {
      const res = await request(app)
        .post('/api/police/recovery/workflow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          policeReportId: stationId, // Using stationId as placeholder
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('stage', 'reported');
      workflowId = res.body._id;
    });

    it('should update recovery workflow stage', async () => {
      const res = await request(app)
        .patch(`/api/police/recovery/workflow/${workflowId}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stage: 'investigating',
          location: { lat: -1.286389, lng: 36.817223 },
          notes: 'Investigation started',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stage', 'investigating');
    });

    it('should get recovery workflow', async () => {
      const res = await request(app)
        .get(`/api/police/recovery/workflow/${workflowId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stage');
    });
  });

  describe('Police Statistics', () => {
    it('should get police statistics (admin only)', async () => {
      const res = await request(app)
        .get('/api/police/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalReports');
      expect(res.body).toHaveProperty('openCases');
      expect(res.body).toHaveProperty('closedCases');
    });

    it('should not get statistics without admin role', async () => {
      const res = await request(app)
        .get('/api/police/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for police endpoints', async () => {
      const res = await request(app)
        .get('/api/police/stations');

      expect(res.status).toBe(401);
    });

    it('should require law_enforcement role for police endpoints', async () => {
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
        .get('/api/police/stations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
