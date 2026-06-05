// API Stress Test - Simulate API bursts
import http from 'k6/http';
import { check, sleep } from 'k6';

const API_BASE = __ENV.API_BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Quick ramp to 50
    { duration: '1m', target: 500 },   // Ramp to 500
    { duration: '1m', target: 1000 },  // Ramp to 1000
    { duration: '2m', target: 1000 },  // Sustain at 1000
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% under 1s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

export default function () {
  const endpoints = [
    '/api/health',
    '/api/imei/check',
    '/api/devices',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  if (endpoint === '/api/imei/check') {
    let res = http.post(`${API_BASE}${endpoint}`, JSON.stringify({
      imei: '356938035643809',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'IMEI check response': (r) => r.status === 200 || r.status === 401 });
  } else {
    let res = http.get(`${API_BASE}${endpoint}`);
    check(res, { 'API response': (r) => r.status === 200 || r.status === 401 });
  }

  sleep(Math.random() * 2);
}
