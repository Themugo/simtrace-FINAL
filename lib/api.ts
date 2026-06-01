// lib/api.ts — centralized API client
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('simtrace_token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),

  // IMEI
  imeiLookup: (imei: string) => request(`/api/imei/${imei}`),
  registerDevice: (body: any) => request('/api/imei/register', { method: 'POST', body: JSON.stringify(body) }),
  reportStolen: (body: any) => request('/api/imei/report-stolen', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (imei: string, status: string) => request(`/api/imei/${imei}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  imeiHistory: (imei: string, limit?: number) => request(`/api/imei/${imei}/history?limit=${limit || 100}`),
  myReports: () => request('/api/imei/my-reports'),

  // Devices
  myDevices: () => request('/api/devices'),
  deviceStats: () => request('/api/devices/stats'),
  deviceDetail: (id: string) => request(`/api/devices/${id}`),
  deleteDevice: (id: string) => request(`/api/devices/${id}`, { method: 'DELETE' }),

  // Alerts
  alerts: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/alerts${q ? '?' + q : ''}`);
  },
  markRead: (id: string) => request(`/api/alerts/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/api/alerts/read-all', { method: 'PATCH' }),
  unreadCount: () => request('/api/alerts/unread-count'),

  // AI
  imeiReport: (imei: string) => request('/api/ai/imei-report', { method: 'POST', body: JSON.stringify({ imei }) }),
  triageAlerts: (limit?: number) => request('/api/ai/triage', { method: 'POST', body: JSON.stringify({ limit }) }),
  explainAlert: (alertId: string) => request('/api/ai/explain-alert', { method: 'POST', body: JSON.stringify({ alertId }) }),
  aiChat: (messages: any[]) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),

  // Remote lock
  lockDevice: (id: string) => request(`/api/devices/${id}/lock`, { method: 'POST', body: JSON.stringify({}) }),
  unlockDevice: (id: string) => request(`/api/devices/${id}/unlock`, { method: 'POST', body: JSON.stringify({}) }),

  // Community
  sightings: () => request('/api/community/sightings'),
  submitSighting: (body: any) => request('/api/community/sightings', { method: 'POST', body: JSON.stringify(body) }),

  // Token refresh
  refreshToken: () => request('/api/auth/refresh'),

  // Ad campaigns
  myAds: () => request('/api/ads/mine'),
  adStats: (id: string) => request(`/api/ads/${id}/stats`),
  createAd: (body: any) => request('/api/ads', { method: 'POST', body: JSON.stringify(body) }),

  // Partner
  registerPartner: (body: any) => request('/api/partner/register', { method: 'POST', body: JSON.stringify(body) }),
  regenerateApiKey: (id: string) => request(`/api/partner/${id}/regenerate-key`, { method: 'POST', body: JSON.stringify({}) }),
  updateWebhook: (id: string, url: string) => request(`/api/partner/${id}/webhook`, { method: 'PATCH', body: JSON.stringify({ webhookUrl: url }) }),
  testWebhook: (id: string) => request(`/api/partner/${id}/webhook-test`, { method: 'POST', body: JSON.stringify({}) }),

  // Convenience REST helpers
  get: (path: string) => request(path),
  post: (path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path: string, body: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};

export function saveToken(token: string): void {
  localStorage.setItem('simtrace_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('simtrace_token');
}
