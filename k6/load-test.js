// Load Test - Simulate 1000 concurrent users
import http from 'k6/http';
import { check, sleep } from 'k6';

const API_BASE = __ENV.API_BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 500 },  // Ramp up to 500 users
    { duration: '5m', target: 500 },  // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  // Health check
  let healthRes = http.get(`${API_BASE}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // IMEI check
  let imeiRes = http.post(`${API_BASE}/api/imei/check`, JSON.stringify({
    imei: '356938035643809',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(imeiRes, {
    'IMEI check status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
