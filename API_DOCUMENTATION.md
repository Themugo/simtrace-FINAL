# SimTrace API Documentation

## Overview

The SimTrace API provides endpoints for device tracking, IMEI verification, authentication, billing, and more. This document describes all available API endpoints, request/response formats, and authentication requirements.

**Base URL:** `https://simtrace-backend.onrender.com` (production) or `http://localhost:4000` (development)

**Authentication:** Most endpoints require a Bearer token in the `Authorization` header.

---

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+254712345678"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "plan": "free",
  "devices": []
}
```

### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "NewSecurePass123"
}
```

---

## IMEI Operations

### IMEI Lookup
```http
GET /api/imei/:imei
Authorization: Bearer {token}
```

**Response:**
```json
{
  "imei": "356938035643809",
  "status": "clean",
  "brand": "Apple",
  "model": "iPhone 13",
  "reportDate": "2024-01-15",
  "history": []
}
```

### Register Device
```http
POST /api/imei/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "imei": "356938035643809",
  "name": "My iPhone",
  "brand": "Apple",
  "model": "iPhone 13"
}
```

### Report Stolen
```http
POST /api/imei/report-stolen
Authorization: Bearer {token}
Content-Type: application/json

{
  "imei": "356938035643809",
  "reportDetails": "Stolen from coffee shop"
}
```

### Update Status
```http
PATCH /api/imei/:imei/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "recovered"
}
```

### IMEI History
```http
GET /api/imei/:imei/history?limit=100
Authorization: Bearer {token}
```

### My Reports
```http
GET /api/imei/my-reports
Authorization: Bearer {token}
```

---

## Device Management

### My Devices
```http
GET /api/devices
Authorization: Bearer {token}
```

**Response:**
```json
{
  "devices": [
    {
      "id": "device_id",
      "imei": "356938035643809",
      "name": "My iPhone",
      "status": "active",
      "lastSeen": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Device Stats
```http
GET /api/devices/stats
Authorization: Bearer {token}
```

### Device Detail
```http
GET /api/devices/:id
Authorization: Bearer {token}
```

### Delete Device
```http
DELETE /api/devices/:id
Authorization: Bearer {token}
```

### Lock Device
```http
POST /api/devices/:id/lock
Authorization: Bearer {token}
```

### Unlock Device
```http
POST /api/devices/:id/unlock
Authorization: Bearer {token}
```

---

## Alerts

### Get Alerts
```http
GET /api/alerts?limit=20&unread=true
Authorization: Bearer {token}
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_id",
      "type": "sim_swap",
      "message": "SIM card swapped",
      "deviceId": "device_id",
      "timestamp": "2024-01-15T10:30:00Z",
      "read": false
    }
  ]
}
```

### Mark as Read
```http
PATCH /api/alerts/:id/read
Authorization: Bearer {token}
```

### Mark All as Read
```http
PATCH /api/alerts/read-all
Authorization: Bearer {token}
```

### Unread Count
```http
GET /api/alerts/unread-count
Authorization: Bearer {token}
```

---

## AI Features

### IMEI Report
```http
POST /api/ai/imei-report
Authorization: Bearer {token}
Content-Type: application/json

{
  "imei": "356938035643809"
}
```

### Triage Alerts
```http
POST /api/ai/triage
Authorization: Bearer {token}
Content-Type: application/json

{
  "limit": 10
}
```

### Explain Alert
```http
POST /api/ai/explain-alert
Authorization: Bearer {token}
Content-Type: application/json

{
  "alertId": "alert_id"
}
```

### AI Chat
```http
POST /api/ai/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "How do I track my device?"
    }
  ]
}
```

---

## Billing

### Get Plans
```http
GET /api/billing/plans
```

**Response:**
```json
{
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "priceKES": 0,
      "priceUSD": 0,
      "deviceLimit": 2,
      "features": ["2 devices included", "5 IMEI checks/day"]
    },
    {
      "id": "pro",
      "name": "Pro",
      "priceKES": 799,
      "priceUSD": 6,
      "deviceLimit": 10,
      "features": ["10 devices included", "Unlimited IMEI checks"]
    }
  ]
}
```

### Get Subscription
```http
GET /api/billing/subscription
Authorization: Bearer {token}
```

### Upgrade with M-Pesa
```http
POST /api/billing/upgrade-mpesa
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "pro",
  "phone": "+254712345678"
}
```

### Upgrade with Stripe
```http
POST /api/billing/upgrade-stripe
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "pro"
}
```

### M-Pesa Status
```http
GET /api/billing/mpesa-status/:checkoutId
Authorization: Bearer {token}
```

### Stripe Webhook
```http
POST /api/billing/stripe-webhook
Content-Type: application/json
Stripe-Signature: {signature}
```

---

## Partner/Telecom

### Register Partner
```http
POST /api/partner/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "orgName": "Safaricom",
  "orgType": "telecom",
  "country": "KE",
  "webhookUrl": "https://example.com/webhook"
}
```

### Get Partner Info
```http
GET /api/partner/me
Authorization: Bearer {token}
```

### Regenerate API Key
```http
POST /api/partner/:id/regenerate-key
Authorization: Bearer {token}
```

### Update Webhook
```http
PATCH /api/partner/:id/webhook
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhookUrl": "https://example.com/webhook"
}
```

### Test Webhook
```http
POST /api/partner/:id/webhook-test
Authorization: Bearer {token}
```

---

## Community

### Get Sightings
```http
GET /api/community/sightings
Authorization: Bearer {token}
```

### Submit Sighting
```http
POST /api/community/sightings
Authorization: Bearer {token}
Content-Type: application/json

{
  "imei": "356938035643809",
  "location": "Nairobi, Kenya",
  "description": "Seen at local market"
}
```

---

## Admin

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer {token}
```

### Get User Details
```http
GET /api/admin/users/:id
Authorization: Bearer {token}
```

### Update User Role
```http
PATCH /api/admin/users/:id/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

### Get Revenue Stats
```http
GET /api/admin/revenue
Authorization: Bearer {token}
```

### Get Ads Stats
```http
GET /api/admin/ads
Authorization: Bearer {token}
```

---

## Health Check

### Health Status
```http
GET /api/health
```

**Response:**
```json
{
  "uptime": 123456,
  "message": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "requestId": "unique_request_id"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

All API endpoints are rate-limited. Rate limit headers are included in responses:

- `ratelimit-limit` - Maximum requests per window
- `ratelimit-remaining` - Remaining requests in current window
- `ratelimit-reset` - Time when the rate limit window resets

---

## WebSocket (Socket.IO)

**Connection URL:** `wss://simtrace-backend.onrender.com` (production) or `ws://localhost:4000` (development)

### Authentication
Connect with token in auth object:
```javascript
const socket = io(SOCKET_URL, {
  auth: { token: "your_jwt_token" }
});
```

### Events

#### Client → Server
- `subscribe_device` - Subscribe to device location updates
- `subscribe_all_admin` - Subscribe to all device updates (admin only)

#### Server → Client
- `location_update` - Device location update
- `alert` - New alert notification
- `device_status` - Device status change

---

## SDK/Client Libraries

### JavaScript/TypeScript
```javascript
import { api } from './lib/api';

// Authentication
const user = await api.login({ email, password });

// IMEI Lookup
const result = await api.imeiLookup('356938035643809');

// Get Devices
const devices = await api.myDevices();
```

### Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

---

## Support

For API support, contact:
- Email: api@simtrace.site
- Documentation: https://docs.simtrace.site
- Status: https://status.simtrace.site
