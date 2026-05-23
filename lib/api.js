// lib/api.js — centralized API client
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("simtrace_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register:      (body)         => request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:         (body)         => request("/api/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  me:            ()             => request("/api/auth/me"),

  // IMEI
  imeiLookup:    (imei)         => request(`/api/imei/${imei}`),
  registerDevice:(body)         => request("/api/imei/register",      { method: "POST", body: JSON.stringify(body) }),
  reportStolen:  (body)         => request("/api/imei/report-stolen", { method: "POST", body: JSON.stringify(body) }),
  updateStatus:  (imei, status) => request(`/api/imei/${imei}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  imeiHistory:   (imei, limit)  => request(`/api/imei/${imei}/history?limit=${limit || 100}`),
  myReports:     ()             => request("/api/imei/my-reports"),

  // Devices
  myDevices:     ()             => request("/api/devices"),
  deviceStats:   ()             => request("/api/devices/stats"),
  deviceDetail:  (id)           => request(`/api/devices/${id}`),
  deleteDevice:  (id)           => request(`/api/devices/${id}`, { method: "DELETE" }),

  // Alerts
  alerts:        (params = {})  => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/alerts${q ? "?" + q : ""}`);
  },
  markRead:      (id)           => request(`/api/alerts/${id}/read`, { method: "PATCH" }),
  markAllRead:   ()             => request("/api/alerts/read-all",   { method: "PATCH" }),
  unreadCount:   ()             => request("/api/alerts/unread-count"),

  // AI
  imeiReport:    (imei)         => request("/api/ai/imei-report",   { method: "POST", body: JSON.stringify({ imei }) }),
  triageAlerts:  (limit)        => request("/api/ai/triage",        { method: "POST", body: JSON.stringify({ limit }) }),
  explainAlert:  (alertId)      => request("/api/ai/explain-alert", { method: "POST", body: JSON.stringify({ alertId }) }),
  aiChat:        (messages)     => request("/api/ai/chat",          { method: "POST", body: JSON.stringify({ messages }) }),

  // Remote lock
  lockDevice:   (id)  => request(`/api/devices/${id}/lock`,   { method: "POST", body: JSON.stringify({}) }),
  unlockDevice: (id)  => request(`/api/devices/${id}/unlock`, { method: "POST", body: JSON.stringify({}) }),

  // Community
  sightings:       ()     => request("/api/community/sightings"),
  submitSighting:  (body) => request("/api/community/sightings", { method: "POST", body: JSON.stringify(body) }),

  // Token refresh
  refreshToken: () => request("/api/auth/refresh"),

  // Ad campaigns
  myAds:         ()        => request("/api/ads/mine"),
  adStats:       (id)      => request(`/api/ads/${id}/stats`),
  createAd:      (body)    => request("/api/ads", { method:"POST", body:JSON.stringify(body) }),

  // Partner
  registerPartner:   (body) => request("/api/partner/register",      { method:"POST",  body:JSON.stringify(body) }),
  regenerateApiKey:  (id)   => request(`/api/partner/${id}/regenerate-key`, { method:"POST", body:JSON.stringify({}) }),
  updateWebhook:     (id,url) => request(`/api/partner/${id}/webhook`, { method:"PATCH", body:JSON.stringify({webhookUrl:url}) }),
  testWebhook:       (id)    => request(`/api/partner/${id}/webhook-test`, { method:"POST",  body:JSON.stringify({}) }),

  // Convenience REST helpers (used by billing, ads, partner pages)
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: "POST",  body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del:    (path)       => request(path, { method: "DELETE" }),
};

export function saveToken(token) {
  localStorage.setItem("simtrace_token", token);
}
export function clearToken() {
  localStorage.removeItem("simtrace_token");
}
