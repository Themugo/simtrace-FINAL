import request from 'supertest';
import express from 'express';
import imeiRoutes from '../routes/imei';
import { connectDB, Device } from '../db/index';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('IMEI Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();

    app = express();
    app.use(express.json());
    app.use('/api/imei', imeiRoutes);
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Device.deleteMany({});
  });

  describe('GET /api/imei/:imei', () => {
    it('should return device status for valid IMEI', async () => {
      // Create a test device
      await Device.create({
        imei: '356938035643809',
        status: 'safe',
        brand: 'Samsung',
        model: 'Galaxy S21',
        owner: null,
        registrationDate: new Date(),
      });

      const response = await request(app).get('/api/imei/356938035643809');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('imei', '356938035643809');
      expect(response.body).toHaveProperty('status');
      // Should not expose PII
      expect(response.body).not.toHaveProperty('owner');
    });

    it('should return 404 for non-existent IMEI', async () => {
      const response = await request(app).get('/api/imei/999999999999999');

      expect(response.status).toBe(404);
    });

    it('should validate IMEI format', async () => {
      const response = await request(app).get('/api/imei/invalid-imei');

      expect(response.status).toBe(400);
    });

    it('should not expose sensitive information', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const { User } = await import('../db/index.js');
      
      // Create user with device
      const passwordHash = await bcrypt.hash('password123', 12);
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
      });

      await Device.create({
        imei: '356938035643809',
        status: 'stolen',
        brand: 'Samsung',
        model: 'Galaxy S21',
        owner: user._id,
        registrationDate: new Date(),
      });

      const response = await request(app).get('/api/imei/356938035643809');

      expect(response.status).toBe(200);
      // Should not expose owner details
      expect(response.body).not.toHaveProperty('owner');
      expect(response.body).not.toHaveProperty('ownerEmail');
      expect(response.body).not.toHaveProperty('ownerName');
    });
  });

  describe('POST /api/imei/report-stolen', () => {
    it('should report device as stolen with authentication', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const { User } = await import('../db/index.js');
      
      const passwordHash = await bcrypt.hash('password123', 12);
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
      });

      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // First register the device
      await request(app)
        .post('/api/imei/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          imei: '356938035643809',
          brand: 'Samsung',
          model: 'Galaxy S21',
        });

      // Report as stolen
      const response = await request(app)
        .post('/api/imei/report-stolen')
        .set('Authorization', `Bearer ${token}`)
        .send({
          imei: '356938035643809',
          location: { lat: -1.2921, lng: 36.8219 },
          circumstances: 'Lost at airport',
        });

      expect(response.status).toBe(200);
      expect(response.body.device).toHaveProperty('status', 'stolen');
    });

    it('should reject stolen report without authentication', async () => {
      const response = await request(app)
        .post('/api/imei/report-stolen')
        .send({
          imei: '356938035643809',
          location: { lat: -1.2921, lng: 36.8219 },
          circumstances: 'Lost at airport',
        });

      expect(response.status).toBe(401);
    });

    it('should reject stolen report for unowned device', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const { User } = await import('../db/index.js');
      
      const passwordHash = await bcrypt.hash('password123', 12);
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
      });

      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/imei/report-stolen')
        .set('Authorization', `Bearer ${token}`)
        .send({
          imei: '356938035643809',
          location: { lat: -1.2921, lng: 36.8219 },
          circumstances: 'Lost at airport',
        });

      expect(response.status).toBe(404);
    });
  });
});
