# SimTrace — Global Device Intelligence Platform

> Connect. Protect. Recover.

## 🚀 Production Status

**Current Production Readiness: ~95%**

### ✅ Completed (Phase 1 & 2)
- ✅ Git repository initialized and connected to GitHub
- ✅ Next.js upgraded to 15.1.0 (from 9.3.3)
- ✅ React stabilized at 18.3.1 (from 19.0.0)
- ✅ Security vulnerabilities fixed (backend: 0, root: 2 moderate, frontend: 6 high dev-only)
- ✅ Environment configuration created
- ✅ CI/CD pipeline improved with health checks
- ✅ Production environment validation script added
- ✅ Infrastructure setup guide created
- ✅ Deployment runbook created
- ✅ Input validation middleware added
- ✅ Error handling improvements implemented
- ✅ Test coverage expanded (devices, IMEI, alerts, billing, auth)
- ✅ Frontend deployed to Vercel (https://simtrace-final.vercel.app/)
- ✅ Backend deployed to Render (https://simtrace-backend.onrender.com/)
- ✅ Sentry monitoring enabled
- ✅ API documentation created
- ✅ All frontend pages implemented (admin dashboards, telecom portal)
- ✅ All backend services implemented (60+ services)
- ✅ Payment processing UI complete (Stripe/M-Pesa)
- ✅ Authentication flows complete (login, register, password reset)
- ✅ Real-time features implemented (Socket.IO)
- ✅ Duplicate files removed (JS/TS, mobile-app, quarantine)
- ✅ Lockfile consistency fixed
- ✅ Node version locked to 22.x
- ✅ TypeScript noImplicitAny enabled (gradual strict mode)
- ✅ Dynamic imports for Leaflet (SSR compatibility)

### 🔄 Pending (Optional Enhancements)
- Complete TypeScript strict mode enablement (gradual)
- Increase test coverage to 50%
- Performance optimization
- Additional UI/UX polish

### 📋 Deployment Status
- **Frontend:** ✅ Deployed on Vercel - https://simtrace-final.vercel.app/
- **Backend:** ⚠️ Deployed on Render - https://simtrace-backend.onrender.com/ (may need restart)

### 📋 Documentation
- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Infrastructure Setup](INFRASTRUCTURE_SETUP.md) - MongoDB, Redis, deployment guides
- [Sentry Setup](SENTRY_SETUP.md) - Error monitoring configuration
- [Security Hardening](SECURITY_HARDENING.md) - Security measures and best practices
- [Performance Optimization](PERFORMANCE_OPTIMIZATION.md) - Performance improvements and monitoring

## Quick start (local)

```bash
# 1. Copy env file and fill in required secrets
cp .env.example .env
# Edit .env — JWT_SECRET and ANTHROPIC_API_KEY are required

# 2. Start MongoDB + backend
docker compose up

# 3. Seed demo data (first time only)
cd backend && npm run seed

# 4. Frontend
npm run dev
# → http://localhost:3000
```

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@simtrace.site | Admin@123 |
| Regular user | user@simtrace.site | User@123 |
| Law enforcement | police@simtrace.site | Police@123 |
| Telecom | telecom@simtrace.site | Telecom@123 |

---

## Production deployment

### Step 1 — MongoDB Atlas

1. Create free M0 cluster at https://cloud.mongodb.com
2. Create a DB user with a strong password
3. Whitelist Railway egress IPs (or use Atlas Private Endpoint)
4. Copy the `mongodb+srv://` connection string → `MONGO_URI`

### Step 2 — Backend → Railway

1. New project → Deploy from GitHub → select your repo
2. Set root directory: `backend/`
3. Railway auto-detects the Dockerfile
4. Add environment variables (Settings → Variables):

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/simtrace
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ALLOWED_ORIGINS=https://simtrace.site,https://www.simtrace.site
NODE_ENV=production
TRACK_REQUIRE_AUTH=true
ANTHROPIC_API_KEY=sk-ant-...
MPESA_ENV=production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
BACKEND_URL=https://api.simtrace.site
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
FROM_EMAIL=alerts@simtrace.site
AT_API_KEY=...
AT_USERNAME=simtrace
```

5. Note your Railway URL (e.g. `https://simtrace-api.up.railway.app`)

### Step 3 — Frontend → Vercel

1. Import repo → set root directory to project root
2. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://api.simtrace.site
NEXT_PUBLIC_SOCKET_URL=https://api.simtrace.site
```

3. Deploy

### Step 4 — Stripe webhook

```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to https://api.simtrace.site/api/billing/stripe-webhook
# Copy the webhook secret → STRIPE_WEBHOOK_SECRET env var
```

### Step 5 — M-Pesa Daraja (production)

1. Go to https://developer.safaricom.co.ke → go live
2. Set `MPESA_ENV=production`
3. Add your production `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`
4. Callback URL: `https://api.simtrace.site/api/billing/mpesa-callback`

### Step 6 — Run seed on production DB

```bash
# Set production MONGO_URI in your local .env temporarily
MONGO_URI="mongodb+srv://..." node backend/scripts/seed-demo.js
```

---

## Mobile agent integration

The tracking agent (Android/iOS app) sends pings to `/api/track`:

```http
POST /api/track
X-Device-Key: <deviceKey from registration>
Content-Type: application/json

{
  "imei": "356938035643809",
  "lat": -1.2921,
  "lng": 36.8219,
  "accuracy": 15,
  "simIccid": "8954030000012345",
  "networkOp": "Safaricom",
  "fingerprint": {
    "osVersion": "Android 14",
    "buildId": "UP1A.231005.007"
  }
}
```

The `deviceKey` is returned once when the device is registered via `POST /api/imei/register`.
Store it securely in Android Keystore or iOS Secure Enclave.

Set `TRACK_REQUIRE_AUTH=true` in production to reject pings without a valid key.

---

## Partner API

```http
POST /api/partner/imei/bulk
X-Partner-Key: st_...your_key...
Content-Type: application/json

{"imeis": ["356938035643809", "490154203237518"]}
```

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | public | Health check |
| POST | /api/auth/register | public | Register user |
| POST | /api/auth/login | public | Login → JWT |
| GET | /api/auth/me | JWT | Current user |
| POST | /api/auth/change-password | JWT | Change password |
| GET | /api/imei/:imei | public | IMEI lookup (no PII) |
| POST | /api/imei/register | JWT | Register device → returns deviceKey |
| POST | /api/imei/report-stolen | JWT | Report device stolen |
| PATCH | /api/imei/:imei/status | admin | Update device status |
| POST | /api/track | X-Device-Key | Location ping from agent |
| GET | /api/devices | JWT | My devices (admin: all) |
| GET | /api/devices/stats | admin | Platform stats |
| GET | /api/alerts | JWT | Alerts (admin: all) |
| PATCH | /api/alerts/read-all | admin | Mark all read |
| POST | /api/ai/imei-report | optional JWT | AI risk report |
| POST | /api/ai/chat | optional JWT | AI security assistant |
| POST | /api/ai/triage | admin | Batch alert triage |
| GET | /api/billing/plans | public | Plan list |
| POST | /api/billing/upgrade-mpesa | JWT | M-Pesa STK push |
| POST | /api/billing/stripe-webhook | Stripe sig | Payment confirmation |
| POST | /api/partner/imei/bulk | X-Partner-Key | Bulk IMEI check |

## Socket.io events

| Direction | Event | Payload |
|-----------|-------|---------|
| client→server | `subscribe_device(imei)` | Subscribe to one device |
| client→server | `subscribe_all_admin` | Admin: all device updates |
| server→client | `location_update` | `{imei, lat, lng, ts, status, verified}` |
| server→client | `alert` | `{type, imei, payload, narrative, ts}` |

---

## Testing M-Pesa (Daraja) locally

### 1. Get Daraja sandbox credentials
1. Go to https://developer.safaricom.co.ke → Create App
2. Enable **Lipa na M-Pesa Sandbox**
3. Copy **Consumer Key** and **Consumer Secret**
4. Use test shortcode: `174379`, passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

### 2. Set up ngrok (for callbacks)
```bash
npm install -g @ngrok/ngrok
ngrok http 4000
# Copy the https URL e.g. https://abc123.ngrok.io
```

### 3. Update .env
```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<from Daraja>
MPESA_CONSUMER_SECRET=<from Daraja>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
BACKEND_URL=https://abc123.ngrok.io
```

### 4. Test STK push
```bash
curl -X POST http://localhost:4000/api/billing/upgrade-mpesa \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","phone":"254712345678"}'
```
Use Daraja test phone: `254708374149` (always succeeds in sandbox).

### 5. Verify callback
Watch your server logs — Daraja will POST to `{BACKEND_URL}/api/billing/mpesa-callback` within ~10 seconds.
The payment record in MongoDB will update from `pending` → `completed` and the subscription will activate.

---

## Testing Stripe locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to http://localhost:4000/api/billing/stripe-webhook
# Copy the whsec_... → STRIPE_WEBHOOK_SECRET in .env

# Trigger a test payment
stripe trigger payment_intent.succeeded
```

---

## Environment variable reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | 32+ char random hex string |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `NODE_ENV` | — | `production` or `development` |
| `PORT` | — | Default 4000 |
| `ALLOWED_ORIGINS` | ✅ prod | Comma-separated frontend URLs |
| `FRONTEND_URL` | ✅ prod | Frontend URL for password reset emails |
| `TRACK_REQUIRE_AUTH` | — | `true` to require X-Device-Key on pings |
| `MPESA_ENV` | — | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` | M-Pesa | Daraja API key |
| `MPESA_CONSUMER_SECRET` | M-Pesa | Daraja API secret |
| `MPESA_SHORTCODE` | M-Pesa | Paybill number |
| `MPESA_PASSKEY` | M-Pesa | Daraja passkey |
| `STRIPE_SECRET_KEY` | Stripe | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe | `whsec_...` from CLI |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | `pk_live_...` (frontend) |
| `SENDGRID_API_KEY` | Email | SendGrid API key |
| `FROM_EMAIL` | Email | Verified sender address |
| `AT_API_KEY` | SMS | Africa's Talking key |
| `AT_USERNAME` | SMS | `sandbox` or your username |
