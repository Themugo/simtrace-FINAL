import request from 'supertest';
import express from 'express';
import alertRoutes from '../routes/alerts';
import { connectDB, User, Device, Alert } from '../db/index';
import { MongoMemoryServer } from 'mongodb-memory-server';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Alert Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();

    const bcrypt = (await import('bcryptjs')).default;
    
    // Create regular user
    const userPasswordHash = await bcrypt.hash('password123', 12);
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: userPasswordHash,
      role: 'user',
    });

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    const jwt = (await import('jsonwebtoken')).default;
    authToken = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    adminToken = jwt.sign(
      { id: admin._id.toString(), email: admin.email, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    app = express();
    app.use(express.json());
    app.use('/api/alerts', alertRoutes);
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Alert.deleteMany({});
    await Device.deleteMany({});
  });

  describe('GET /api/alerts', () => {
    it('should return user alerts with authentication', async () => {
      // Create test alert
      const user = await User.findOne({ email: 'test@example.com' });
      const device = await Device.create({
        imei: '356938035643809',
        status: 'stolen',
        brand: 'Samsung',
        model: 'Galaxy S21',
        owner: user!._id,
        registrationDate: new Date(),
      });

      await Alert.create({
        type: 'location_detected',
        imei: '356938035643809',
        device: device._id,
        user: user!._id,
        payload: { lat: -1.2921, lng: 36.8219 },
        read: false,
        timestamp: new Date(),
      });

      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return all alerts for admin', async () => {
      // Create alerts for different users
      const user1 = await User.findOne({ email: 'test@example.com' });
      const user2 = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        passwordHash: await (await import('bcryptjs')).default.hash('password123', 12),
      });

      await Alert.create([
        {
          type: 'location_detected',
          imei: '356938035643809',
          user: user1!._id,
          payload: { lat: -1.2921, lng: 36.8219 },
          read: false,
          timestamp: new Date(),
        },
        {
          type: 'location_detected',
          imei: '356938035643808',
          user: user2._id,
          payload: { lat: -1.2921, lng: 36.8219 },
          read: false,
          timestamp: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app).get('/api/alerts');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/alerts/read-all', () => {
    it('should mark all user alerts as read', async () => {
      const user = await User.findOne({ email: 'test@example.com' });
      
      await Alert.create([
        {
          type: 'location_detected',
          imei: '356938035643809',
          user: user!._id,
          payload: { lat: -1.2921, lng: 36.8219 },
          read: false,
          timestamp: new Date(),
        },
        {
          type: 'device_detected',
          imei: '356938035643808',
          user: user!._id,
          payload: { lat: -1.2921, lng: 36.8219 },
          read: false,
          timestamp: new Date(),
        },
      ]);

      const response = await request(app)
        .patch('/api/alerts/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      // Verify all alerts are marked as read
      const alerts = await Alert.find({ user: user!._id });
      expect(alerts.every(alert => alert.read === true)).toBe(true);
    });

    it('should allow admin to mark all alerts as read', async () => {
      await Alert.create([
        {
          type: 'location_detected',
          imei: '356938035643809',
          user: (await User.findOne({ email: 'test@example.com' }))!._id,
          payload: { lat: -1.2921, lng: 36.8219 },
          read: false,
          timestamp: new Date(),
        },
      ]);

      const response = await request(app)
        .patch('/api/alerts/read-all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app).patch('/api/alerts/read-all');

      expect(response.status).toBe(401);
    });
  });
});
