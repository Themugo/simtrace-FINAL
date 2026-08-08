// tests/auth.integration.test.ts - Integration tests for authentication
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import { User } from '../db/index.js';
import bcrypt from 'bcryptjs';

describe('Authentication Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/simtrace-test');
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /-test@simtrace\.site$/ });
    await mongoose.connection.close();
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'auth-test@simtrace.site',
          password: 'Test@123',
          phone: '+254700000009',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', 'auth-test@simtrace.site');
      userId = res.body.user.id;
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'auth-test@simtrace.site',
          password: 'Test@123',
        });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'weak-test@simtrace.site',
          password: 'weak',
        });

      expect(res.status).toBe(400);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test@123',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@simtrace.site',
          password: 'Test@123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      authToken = res.body.token;
    });

    it('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@simtrace.site',
          password: 'Test@123',
        });

      expect(res.status).toBe(401);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@simtrace.site',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
    });

    it('should enforce rate limiting on login', async () => {
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'auth-test@simtrace.site',
              password: 'WrongPassword',
            })
        );
      }

      const results = await Promise.all(promises);
      const rateLimited = results.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Token Validation', () => {
    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });

    it('should not access protected route without token', async () => {
      const res = await request(app)
        .get('/api/user/profile');

      expect(res.status).toBe(401);
    });

    it('should not access protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Password Reset', () => {
    it('should request password reset', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'auth-test@simtrace.site',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should not request reset for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@simtrace.site',
        });

      // Should still return 200 for security (don't reveal email existence)
      expect(res.status).toBe(200);
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'auth-test@simtrace.site');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should update user profile', async () => {
      const res = await request(app)
        .patch('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test User',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Test User');
    });

    it('should not update email to existing email', async () => {
      // Create another user
      const passwordHash = await bcrypt.hash('Test@123', 12);
      await User.create({
        name: 'Another User',
        email: 'another-test@simtrace.site',
        passwordHash,
        emailVerified: true,
      });

      const res = await request(app)
        .patch('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'another-test@simtrace.site',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
      // Create admin user
      const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
      const adminUser = await User.create({
        name: 'Test Admin',
        email: 'admin-rbac@simtrace.site',
        passwordHash: adminPasswordHash,
        role: 'admin',
        emailVerified: true,
      });

      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin-rbac@simtrace.site', password: 'Admin@123' });
      adminToken = adminLoginRes.body.token;

      // Create regular user
      const userPasswordHash = await bcrypt.hash('User@123', 12);
      const regularUser = await User.create({
        name: 'Regular User',
        email: 'user-rbac@simtrace.site',
        passwordHash: userPasswordHash,
        role: 'user',
        emailVerified: true,
      });

      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user-rbac@simtrace.site', password: 'User@123' });
      userToken = userLoginRes.body.token;
    });

    it('should allow admin to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should not allow regular user to access admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
