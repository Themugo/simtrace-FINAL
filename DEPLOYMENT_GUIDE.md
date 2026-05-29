# SimTrace Deployment Guide

This guide provides step-by-step instructions for deploying SimTrace to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
6. [Cache Setup (Redis)](#cache-setup-redis)
7. [Monitoring Setup (Sentry)](#monitoring-setup-sentry)
8. [Payment Integration](#payment-integration)
9. [Post-Deployment Steps](#post-deployment-steps)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- GitHub account with repository access
- Vercel account (for frontend)
- Render account (for backend)
- MongoDB Atlas account (for database)
- Redis account (for caching)
- Sentry account (for error monitoring)
- Stripe account (for payment processing)
- Safaricom Daraja account (for M-Pesa payments)

---

## Environment Variables

### Required Variables

Create a `.env` file with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/simtrace

# Authentication
JWT_SECRET=<32+ character random string>
ANTHROPIC_API_KEY=sk-ant-...

# Server
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=https://simtrace-final.vercel.app,https://simtrace.site
FRONTEND_URL=https://simtrace-final.vercel.app

# Tracking
TRACK_REQUIRE_AUTH=true

# M-Pesa (Safaricom)
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
BACKEND_URL=https://simtrace-backend.onrender.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid)
SENDGRID_API_KEY=SG...
FROM_EMAIL=alerts@simtrace.site

# SMS (Africa's Talking)
AT_API_KEY=your_api_key
AT_USERNAME=your_username

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENV=production
```

### Frontend-Specific Variables

```env
NEXT_PUBLIC_API_URL=https://simtrace-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://simtrace-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

---

## Frontend Deployment (Vercel)

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `Themugo/simtrace-FINAL`
4. Vercel will auto-detect Next.js

### Step 2: Configure Build Settings

Vercel auto-detects Next.js settings. Verify:

- **Framework Preset:** Next.js
- **Root Directory:** `./` (not `frontend/`)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://simtrace-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://simtrace-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your frontend will be available at: `https://simtrace-final.vercel.app`

### Step 5: Configure Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain (e.g., `simtrace.site`)
3. Configure DNS records as instructed by Vercel

---

## Backend Deployment (Render)

### Step 1: Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository: `Themugo/simtrace-FINAL`

### Step 2: Configure Build Settings

- **Root Directory:** `backend/`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Runtime:** Node 20.x

### Step 3: Add Environment Variables

In Render Dashboard → Environment:

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/simtrace
JWT_SECRET=<32+ character random string>
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=https://simtrace-final.vercel.app
FRONTEND_URL=https://simtrace-final.vercel.app
TRACK_REQUIRE_AUTH=true
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
BACKEND_URL=https://simtrace-backend.onrender.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
FROM_EMAIL=alerts@simtrace.site
AT_API_KEY=your_api_key
AT_USERNAME=your_username
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENV=production
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Your backend will be available at: `https://simtrace-backend.onrender.com`

### Step 5: Configure Health Check

Render automatically checks the `/health` endpoint. Ensure your backend has this route implemented.

---

## Database Setup (MongoDB Atlas)

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click "Build a Database"
3. Choose "M0 Free" (for testing) or "M10+" (for production)
4. Select a region close to your backend (e.g., AWS us-east-1)

### Step 2: Configure Security

1. **Database Access:** Create a database user
   - Username: `simtrace`
   - Password: Generate a strong password
   - Authentication Method: SCRAM-SHA-256

2. **Network Access:** Whitelist IP addresses
   - For Render: Use "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific Render egress IPs

### Step 3: Get Connection String

1. Click "Connect" → "Connect your application"
2. Select Node.js version 4.0 or later
3. Copy the connection string:

```
mongodb+srv://simtrace:password@cluster.mongodb.net/simtrace
```

### Step 4: Update Environment Variables

Add the connection string to:
- Render environment variables (`MONGO_URI`)
- Local `.env` file for testing

---

## Cache Setup (Redis)

### Option 1: Redis Cloud (Recommended)

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account
3. Create a new database
4. Get the connection string

### Option 2: Upstash (Serverless Redis)

1. Go to [Upstash](https://upstash.com)
2. Create a free account
3. Create a new Redis database
4. Get the connection string

### Configure Environment Variables

Add to backend environment:

```
REDIS_URL=redis://user:pass@host:port
```

---

## Monitoring Setup (Sentry)

### Step 1: Create Sentry Project

1. Go to [Sentry](https://sentry.io)
2. Create a new organization
3. Create a new project
4. Select platform: Next.js (frontend) and Node (backend)

### Step 2: Get DSN

For each project, copy the DSN:
- Frontend DSN: `https://...@sentry.io/project-id`
- Backend DSN: `https://...@sentry.io/project-id`

### Step 3: Configure Frontend

Add to Vercel environment variables:

```
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

The `instrumentation.ts` file will automatically initialize Sentry.

### Step 4: Configure Backend

Add to Render environment variables:

```
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENV=production
```

The `sentry.js` file will automatically initialize Sentry.

### Step 5: Verify

Check Sentry dashboard for incoming errors and performance data.

---

## Payment Integration

### Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

3. Configure webhook:
   ```bash
   stripe login
   stripe listen --forward-to https://simtrace-backend.onrender.com/api/billing/stripe-webhook
   ```
   Copy the webhook secret: `whsec_...`

4. Add to environment variables:
   - Frontend: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### M-Pesa (Safaricom Daraja) Setup

1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create a new app
3. Enable "Lipa na M-Pesa"
4. Get credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode (Paybill)
   - Passkey

5. Configure callback URL:
   - Production: `https://simtrace-backend.onrender.com/api/billing/mpesa-callback`
   - Sandbox: Use ngrok for local testing

6. Add to environment variables:
   ```
   MPESA_ENV=production
   MPESA_CONSUMER_KEY=your_key
   MPESA_CONSUMER_SECRET=your_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   BACKEND_URL=https://simtrace-backend.onrender.com
   ```

---

## Post-Deployment Steps

### 1. Seed Demo Data

```bash
# Set production MONGO_URI in local .env
MONGO_URI="mongodb+srv://..." node backend/scripts/seed-demo.js
```

### 2. Verify Health Checks

```bash
# Backend health
curl https://simtrace-backend.onrender.com/api/health

# Should return:
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

### 3. Test Authentication

```bash
# Register a test user
curl -X POST https://simtrace-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}'
```

### 4. Test Frontend

1. Visit `https://simtrace-final.vercel.app`
2. Try logging in with demo credentials
3. Test IMEI lookup
4. Test device registration

### 5. Monitor Logs

- **Vercel:** Dashboard → Logs
- **Render:** Dashboard → Logs
- **Sentry:** Dashboard → Issues

---

## Troubleshooting

### Frontend Build Fails

**Issue:** Build fails on Vercel

**Solutions:**
1. Check environment variables are set correctly
2. Verify Node version is 20.x
3. Check for missing dependencies: `npm install`
4. Review build logs for specific errors

### Backend Health Check Fails

**Issue:** `/api/health` returns 503

**Solutions:**
1. Check MongoDB connection string
2. Verify database user credentials
3. Check network access whitelist
4. Review Render logs for connection errors

### CORS Errors

**Issue:** Frontend can't connect to backend

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check backend CORS configuration
3. Ensure both services are running

### Socket.IO Connection Fails

**Issue:** Real-time updates not working

**Solutions:**
1. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
2. Check backend Socket.IO initialization
3. Ensure authentication token is valid
4. Review browser console for errors

### Payment Webhook Not Received

**Issue:** Stripe/M-Pesa webhooks not triggering

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check webhook secret matches environment variable
3. Review Stripe/M-Pesa dashboard for webhook events
4. Check backend logs for webhook processing

### Sentry Not Capturing Errors

**Issue:** No errors appearing in Sentry

**Solutions:**
1. Verify DSN is correct
2. Check `instrumentation.ts` is properly configured
3. Ensure environment is set to `production`
4. Test with a deliberate error

---

## Maintenance

### Regular Tasks

1. **Monitor Logs:** Check Vercel, Render, and Sentry logs daily
2. **Database Backups:** Enable MongoDB Atlas automated backups
3. **Security Updates:** Keep dependencies updated
4. **Performance:** Monitor response times and optimize as needed
5. **Scaling:** Scale resources based on traffic

### Scaling Recommendations

- **Frontend:** Vercel auto-scales, but consider upgrading plan for higher limits
- **Backend:** Render offers scaling options; upgrade based on CPU/memory usage
- **Database:** MongoDB Atlas M10+ for production with automatic scaling
- **Cache:** Redis Cloud for improved performance

---

## Support

For deployment issues:
- Check logs in Vercel, Render, and Sentry
- Review this guide's troubleshooting section
- Consult [API Documentation](API_DOCUMENTATION.md)
- Contact support: support@simtrace.site

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] JWT_SECRET is a strong random string (32+ characters)
- [ ] Database credentials are strong
- [ ] API keys are not committed to git
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Input validation is in place
- [ ] Error handling doesn't leak sensitive data
- [ ] Webhook secrets are configured
- [ ] Database backups are enabled
- [ ] Monitoring is active (Sentry)
- [ ] Log retention policies are set

---

## Cost Estimation

### Monthly Costs (Production)

- **Vercel (Frontend):** $0-20 (Hobby plan)
- **Render (Backend):** $7-25 (Standard plan)
- **MongoDB Atlas:** $0-57 (M0 free or M10)
- **Redis Cloud:** $0-10 (Free tier)
- **Sentry:** $0-26 (Developer plan)
- **Stripe:** 2.9% + $0.30 per transaction
- **M-Pesa:** Transaction fees apply
- **SendGrid:** $0-15 (Free tier)
- **Africa's Talking:** Pay per SMS

**Estimated Total:** $15-150/month depending on usage

---

## Next Steps

After deployment:

1. Set up CI/CD pipeline (GitHub Actions)
2. Configure automated backups
3. Set up alerting (Sentry, uptime monitoring)
4. Document custom configurations
5. Train team on deployment process
6. Create runbook for common issues
