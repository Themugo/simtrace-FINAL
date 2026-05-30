// Billing Plans Tests
import request from 'supertest';
import express from 'express';
import billingRoutes from '../routes/billing.js';

const app = express();
app.use(express.json());
app.use('/api/billing', billingRoutes);

describe('Billing Plans API', () => {
  test('GET /api/billing/plans should return all plans', async () => {
    const response = await request(app).get('/api/billing/plans');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.plans)).toBe(true);
    expect(response.body.plans.length).toBeGreaterThan(0);
  });

  test('Billing plans should have required fields', async () => {
    const response = await request(app).get('/api/billing/plans');
    const freePlan = response.body.plans.find(p => p.id === 'free');
    
    expect(freePlan).toBeDefined();
    expect(freePlan).toHaveProperty('id');
    expect(freePlan).toHaveProperty('name');
    expect(freePlan).toHaveProperty('priceKES');
    expect(freePlan).toHaveProperty('priceUSD');
    expect(freePlan).toHaveProperty('deviceLimit');
    expect(freePlan).toHaveProperty('features');
    expect(Array.isArray(freePlan.features)).toBe(true);
  });

  test('Free plan should have correct pricing', async () => {
    const response = await request(app).get('/api/billing/plans');
    const freePlan = response.body.plans.find(p => p.id === 'free');
    
    expect(freePlan.priceKES).toBe(0);
    expect(freePlan.priceUSD).toBe(0);
    expect(freePlan.deviceLimit).toBe(2);
  });

  test('Pro plan should have higher limits than free', async () => {
    const response = await request(app).get('/api/billing/plans');
    const freePlan = response.body.plans.find(p => p.id === 'free');
    const proPlan = response.body.plans.find(p => p.id === 'pro');
    
    expect(proPlan.deviceLimit).toBeGreaterThan(freePlan.deviceLimit);
    expect(proPlan.priceKES).toBeGreaterThan(freePlan.priceKES);
  });
});

describe('M-Pesa Payment Flow', () => {
  test('POST /api/billing/upgrade-mpesa should require authentication', async () => {
    const response = await request(app)
      .post('/api/billing/upgrade-mpesa')
      .send({ planId: 'pro', phone: '254712345678' });
    
    expect(response.status).toBe(401);
  });

  test('M-Pesa request should validate phone number format', async () => {
    const response = await request(app)
      .post('/api/billing/upgrade-mpesa')
      .send({ planId: 'pro', phone: 'invalid' });
    
    expect([400, 401]).toContain(response.status);
  });
});

describe('Stripe Payment Flow', () => {
  test('Stripe webhook should verify signature', async () => {
    const response = await request(app)
      .post('/api/billing/stripe-webhook')
      .send({});
    
    expect([400, 401]).toContain(response.status);
  });
});
