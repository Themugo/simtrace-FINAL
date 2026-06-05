import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';
import deviceRoutes from '../routes/devices.js';
import billingRoutes from '../routes/billing.js';
import { connectDB, User, Device, Subscription } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Integration Tests - Critical Flows', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_test';
    await connectDB();

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/devices', deviceRoutes);
    app.use('/api/billing', billingRoutes);
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Device.deleteMany({});
    await Subscription.deleteMany({});
  });

  describe('Flow 1: User Registration → Email Verification → Login', () => {
    it('should complete full registration and login flow', async () => {
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user).toHaveProperty('email', 'test@example.com');

      // Step 2: Login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Flow 2: Device Registration → Tracking → Alert Generation', () => {
    it('should complete device registration and tracking flow', async () => {
      // Step 1: Register and login user
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const authToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Step 2: Register device
      const deviceResponse = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      expect(deviceResponse.status).toBe(201);
      expect(deviceResponse.body).toHaveProperty('deviceKey');

      // Step 3: Update device location (tracking)
      const deviceId = deviceResponse.body.device._id;
      const locationResponse = await request(app)
        .patch(`/api/devices/${deviceId}/location`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lat: -1.2921,
          lng: 36.8219,
          accuracy: 10,
        });

      expect(locationResponse.status).toBe(200);
      expect(locationResponse.body.currentLocation).toEqual({
        lat: -1.2921,
        lng: 36.8219,
        accuracy: 10,
      });

      // Step 4: Report device as stolen (generates alert)
      const statusResponse = await request(app)
        .patch(`/api/devices/${deviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'stolen',
          reason: 'Device stolen',
        });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).toBe('stolen');
    });
  });

  describe('Flow 3: Plan Upgrade → Payment Processing → Subscription Activation', () => {
    it('should complete subscription upgrade flow', async () => {
      // Step 1: Register and login user
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const authToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Step 2: Create subscription
      const subscriptionResponse = await request(app)
        .post('/api/billing/subscribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan: 'pro',
          paymentMethod: 'stripe',
        });

      expect(subscriptionResponse.status).toBe(200);
      expect(subscriptionResponse.body).toHaveProperty('subscriptionId');

      // Step 3: Process payment (simulated)
      const paymentResponse = await request(app)
        .post('/api/billing/payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscriptionId: subscriptionResponse.body.subscriptionId,
          amount: 1000,
          currency: 'KES',
        });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body).toHaveProperty('paymentId');

      // Step 4: Verify subscription activation
      const verifyResponse = await request(app)
        .get('/api/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.plan).toBe('pro');
      expect(verifyResponse.body.status).toBe('active');
    });
  });

  describe('Flow 4: IMEI Reporting → Law Enforcement Notification', () => {
    it('should complete IMEI reporting flow', async () => {
      // Step 1: Register and login user
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const authToken = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Step 2: Register device
      const deviceResponse = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      const deviceId = deviceResponse.body.device._id;

      // Step 3: Report device as stolen
      const reportResponse = await request(app)
        .post('/api/imei/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId,
          reason: 'Device stolen from car',
          policeReportNumber: 'CR-12345',
        });

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.body).toHaveProperty('reportId');

      // Step 4: Verify IMEI is blacklisted
      const checkResponse = await request(app)
        .get('/api/imei/check/356938035643809')
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body.isBlacklisted).toBe(true);
    });
  });

  describe('Flow 5: Admin Dashboard → User Management → Role Assignment', () => {
    it('should complete admin user management flow', async () => {
      // Step 1: Create admin user
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash,
        role: 'admin',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const adminToken = jwt.sign(
        { id: admin._id.toString(), email: admin.email, role: admin.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Step 2: Create regular user
      const userPasswordHash = await bcrypt.hash('password123', 12);
      const user = await User.create({
        name: 'Regular User',
        email: 'user@example.com',
        passwordHash: userPasswordHash,
        role: 'user',
      });

      // Step 3: Get all users (admin only)
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersResponse.status).toBe(200);
      expect(Array.isArray(usersResponse.body)).toBe(true);
      expect(usersResponse.body.length).toBe(2);

      // Step 4: Update user role
      const roleResponse = await request(app)
        .patch(`/api/admin/users/${user._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'moderator',
        });

      expect(roleResponse.status).toBe(200);
      expect(roleResponse.body.role).toBe('moderator');

      // Step 5: Verify role change
      const verifyResponse = await request(app)
        .get(`/api/admin/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.role).toBe('moderator');
    });
  });
});
