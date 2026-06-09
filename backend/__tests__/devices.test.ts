import request from 'supertest';
import express from 'express';
import deviceRoutes from '../routes/devices';
import { connectDB, User, Device } from '../db/index';
import { MongoMemoryServer } from 'mongodb-memory-server';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Device Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let authToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();

    // Create test user
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash('password123', 12);
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
      role: 'user',
    });

    // Generate auth token
    const jwt = (await import('jsonwebtoken')).default;
    authToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    app = express();
    app.use(express.json());
    app.use('/api/devices', deviceRoutes);
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Device.deleteMany({});
  });

  describe('GET /api/devices', () => {
    it('should return user devices with authentication', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app).get('/api/devices');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/devices', () => {
    it('should register a new device', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('deviceKey');
      expect(response.body.device).toHaveProperty('imei', '356938035643809');
    });

    it('should reject duplicate IMEI', async () => {
      // Register first device
      await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      // Try to register same IMEI again
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      expect(response.status).toBe(409);
    });

    it('should validate IMEI format', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imei: 'invalid-imei',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/devices/stats', () => {
    it('should return platform statistics for admin', async () => {
      // Create admin user
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

      const response = await request(app)
        .get('/api/devices/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalDevices');
      expect(response.body).toHaveProperty('activeDevices');
    });

    it('should reject stats request from non-admin', async () => {
      const response = await request(app)
        .get('/api/devices/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });
});
