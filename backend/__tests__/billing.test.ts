import request from 'supertest';
import express from 'express';
import billingRoutes from '../routes/billing.js';
import { connectDB, User, Subscription, Plan } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Billing Routes', () => {
  let app: express.Application;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    await connectDB();

    // Seed plans
    await Plan.create([
      { id: 'free', name: 'Free', priceKES: 0, deviceLimit: 3, features: ['Basic tracking'] },
      { id: 'pro', name: 'Pro', priceKES: 500, deviceLimit: 10, features: ['Advanced tracking', 'AI reports'] },
    ]);

    app = express();
    app.use(express.json());
    app.use('/api/billing', billingRoutes);
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
  });

  describe('GET /api/billing/plans', () => {
    it('should return all available plans', async () => {
      const response = await request(app).get('/api/billing/plans');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/billing/upgrade-stripe', () => {
    it('should create a Stripe checkout session', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);

      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
      });

      await Subscription.create({
        user: user._id,
        plan: 'free',
        status: 'active',
      });

      const jwt = (await import('jsonwebtoken')).default;
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/billing/upgrade-stripe')
        .set('Authorization', `Bearer ${token}`)
        .send({ planId: 'pro' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
    });
  });
});
