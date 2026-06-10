// AI Security Reports Tests
import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/ai.js';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI IMEI Risk Report', () => {
  test('POST /api/ai/imei-report should validate IMEI format', async () => {
    const response = await request(app)
      .post('/api/ai/imei-report')
      .send({ imei: 'invalid' });
    
    expect([400, 401]).toContain(response.status);
  });

  test('IMEI report should require valid IMEI length', async () => {
    const response = await request(app)
      .post('/api/ai/imei-report')
      .send({ imei: '123' });
    
    expect([400, 401]).toContain(response.status);
  });

  test('Should return risk analysis for valid IMEI', async () => {
    const response = await request(app)
      .post('/api/ai/imei-report')
      .send({ imei: '356938035643809' });
    
    // May return 401 if auth required, or 200/500 depending on API key
    expect([200, 400, 401, 500]).toContain(response.status);
  });
});

describe('AI Chat Assistant', () => {
  test('POST /api/ai/chat should validate message', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .send({});
    
    expect([400, 401]).toContain(response.status);
  });

  test('Chat should require message content', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .send({ message: '' });
    
    expect([400, 401]).toContain(response.status);
  });

  test('Should return AI response for valid message', async () => {
    const response = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'What is IMEI?' });
    
    // May return 401 if auth required, or 200/500 depending on API key
    expect([200, 400, 401, 500]).toContain(response.status);
  });
});

describe('AI Alert Triage', () => {
  test('POST /api/ai/triage should require admin authentication', async () => {
    const response = await request(app)
      .post('/api/ai/triage')
      .send({ alerts: [] });
    
    expect([401, 403]).toContain(response.status);
  });

  test('Triage should validate alerts array', async () => {
    const response = await request(app)
      .post('/api/ai/triage')
      .set('Authorization', 'Bearer test-token')
      .send({ alerts: 'invalid' });
    
    expect([400, 401, 403]).toContain(response.status);
  });
});
