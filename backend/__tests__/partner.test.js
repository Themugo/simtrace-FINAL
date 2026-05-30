// Partner API Tests
import request from 'supertest';
import express from 'express';
import partnerRoutes from '../routes/partner.js';

const app = express();
app.use(express.json());
app.use('/api/partner', partnerRoutes);

describe('Partner Bulk IMEI Check', () => {
  test('POST /api/partner/imei/bulk should require partner key', async () => {
    const response = await request(app)
      .post('/api/partner/imei/bulk')
      .send({ imeis: ['356938035643809', '490154203237518'] });
    
    expect(response.status).toBe(401);
  });

  test('Bulk check should validate IMEI array', async () => {
    const response = await request(app)
      .post('/api/partner/imei/bulk')
      .set('X-Partner-Key', 'test-key')
      .send({ imeis: 'invalid' });
    
    expect([400, 401]).toContain(response.status);
  });

  test('Bulk check should limit array size', async () => {
    const largeArray = Array(1001).fill('356938035643809');
    const response = await request(app)
      .post('/api/partner/imei/bulk')
      .set('X-Partner-Key', 'test-key')
      .send({ imeis: largeArray });
    
    expect([400, 413, 401]).toContain(response.status);
  });
});

describe('Partner Authentication', () => {
  test('Should reject requests without partner key', async () => {
    const response = await request(app)
      .post('/api/partner/imei/bulk')
      .send({ imeis: ['356938035643809'] });
    
    expect(response.status).toBe(401);
  });

  test('Should validate partner key format', async () => {
    const response = await request(app)
      .post('/api/partner/imei/bulk')
      .set('X-Partner-Key', 'invalid-key-format')
      .send({ imeis: ['356938035643809'] });
    
    expect([401, 403]).toContain(response.status);
  });
});
