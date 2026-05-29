# Infrastructure Setup Guide

This guide provides step-by-step instructions for setting up the production infrastructure for SimTrace.

---

## Table of Contents

1. [Restart Backend on Render](#restart-backend-on-render)
2. [Configure MongoDB Atlas Production Cluster](#configure-mongodb-atlas-production-cluster)
3. [Configure Redis Production Instance](#configure-redis-production-instance)
4. [Set Up Production Environment Variables](#set-up-production-environment-variables)
5. [Configure Custom Domain](#configure-custom-domain)
6. [Run End-to-End Tests](#run-end-to-end-tests)

---

## Restart Backend on Render

### Step 1: Access Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Log in with your account
3. Navigate to your SimTrace backend service

### Step 2: Check Service Status

1. Look at the service status indicator
2. If it shows "Deploy failed" or "Suspended", proceed to restart

### Step 3: Restart the Service

**Option A: Manual Restart**
1. Click on the service name
2. Scroll to "Manual Deploy" section
3. Click "Deploy latest commit"

**Option B: Redeploy from Git**
1. Click "Redeploy" button
2. Select "Deploy latest commit from main branch"
3. Click "Deploy"

### Step 4: Monitor Deployment

1. Watch the deployment logs
2. Wait for the deployment to complete
3. Verify the service shows "Live" status

### Step 5: Verify Health Check

```bash
curl https://simtrace-backend.onrender.com/api/health
```

Expected response:
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

## Configure MongoDB Atlas Production Cluster

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign up or log in
3. Verify your email address

### Step 2: Create a New Cluster

1. Click "Build a Database"
2. Choose "M10" or higher for production (M0 is free but limited)
3. Select a region (e.g., AWS us-east-1)
4. Choose cluster name: `simtrace-production`
5. Click "Create"

### Step 3: Configure Database Access

1. Go to "Database Access" → "Add New Database User"
2. Set username: `simtrace`
3. Set password: Generate a strong password (save it securely)
4. Authentication Method: SCRAM-SHA-256
5. Click "Add Database User"

### Step 4: Configure Network Access

1. Go to "Network Access" → "Add IP Address"
2. For Render deployment: Select "Allow Access from Anywhere" (0.0.0.0/0)
3. For production: Add specific Render egress IPs
4. Click "Confirm"

### Step 5: Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Choose Node.js version 4.0 or later
4. Copy the connection string

Example:
```
mongodb+srv://simtrace:password@simtrace-production.xxxxx.mongodb.net/simtrace
```

### Step 6: Update Environment Variables

Add the connection string to:
- Render environment variables: `MONGO_URI`
- Local `.env.production` file

### Step 7: Enable Backups (Production Only)

1. Go to cluster settings
2. Enable automated backups
3. Set retention period (e.g., 7 days)
4. Enable point-in-time recovery if needed

---

## Configure Redis Production Instance

### Option A: Redis Cloud (Recommended)

#### Step 1: Create Redis Cloud Account

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free account
3. Verify email address

#### Step 2: Create Database

1. Click "Create Database"
2. Choose "Free" tier for testing or "Fixed" for production
3. Select region (close to your backend)
4. Set database name: `simtrace-cache`
5. Click "Activate"

#### Step 3: Get Connection String

1. Go to database details
2. Copy the connection string

Example:
```
redis://default:password@host:port
```

#### Step 4: Update Environment Variables

Add to Render environment variables: `REDIS_URL`

### Option B: Upstash (Serverless Redis)

#### Step 1: Create Upstash Account

1. Go to [Upstash](https://upstash.com)
2. Sign up for free account
3. Verify email address

#### Step 2: Create Redis Database

1. Click "Create Database"
2. Select region
3. Set database name: `simtrace-cache`
4. Click "Create"

#### Step 3: Get Connection String

1. Go to database details
2. Copy the REST URL or Redis URL

#### Step 4: Update Environment Variables

Add to Render environment variables: `REDIS_URL`

---

## Set Up Production Environment Variables

### Step 1: Copy Template

```bash
cp env.production.template .env.production
```

### Step 2: Fill in Values

Edit `.env.production` and fill in all required values:

```env
# Database
MONGO_URI=mongodb+srv://simtrace:password@cluster.mongodb.net/simtrace
REDIS_URL=redis://default:password@host:port

# Authentication
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# API Keys
ANTHROPIC_API_KEY=sk-ant-...

# Server
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=https://simtrace-final.vercel.app,https://www.simtrace.site
FRONTEND_URL=https://www.simtrace.site
BACKEND_URL=https://simtrace-backend.onrender.com

# Payment (M-Pesa)
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
FROM_EMAIL=alerts@simtrace.site

# SMS
AT_API_KEY=your_key
AT_USERNAME=your_username

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENV=production
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Step 3: Add to Render

1. Go to Render Dashboard → Your Service → Environment
2. Add each variable from `.env.production`
3. Click "Save Changes"
4. Redeploy the service

### Step 4: Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add frontend-specific variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
3. Click "Save"
4. Redeploy the project

---

## Configure Custom Domain

### Step 1: Purchase Domain

1. Buy domain `www.simtrace.site` from a registrar (e.g., Namecheap, GoDaddy)
2. Verify ownership

### Step 2: Add Domain to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `www.simtrace.site`
4. Click "Add"

### Step 3: Configure DNS Records

Vercel will provide DNS records to add:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Add these records in your domain registrar's DNS settings.

### Step 4: Wait for Propagation

1. Wait for DNS propagation (usually 5-30 minutes)
2. Vercel will automatically configure SSL certificates
3. Wait for SSL to be issued (usually 1-5 minutes)

### Step 5: Verify

1. Visit `https://www.simtrace.site`
2. Verify it redirects to your Vercel deployment
3. Check SSL certificate is valid

### Step 6: Update Environment Variables

Update `ALLOWED_ORIGINS` and `FRONTEND_URL` in Render to include `https://www.simtrace.site`

---

## Run End-to-End Tests

### Step 1: Install Test Script Dependencies

The test scripts use curl and standard shell commands. No additional dependencies needed.

### Step 2: Run Tests (Windows PowerShell)

```powershell
cd scripts
.\e2e-test.ps1
```

### Step 3: Run Tests (Linux/Mac)

```bash
cd scripts
chmod +x e2e-test.sh
./e2e-test.sh
```

### Step 4: Run Tests with Custom URLs

```powershell
$env:FRONTEND_URL="https://www.simtrace.site"
$env:BACKEND_URL="https://simtrace-backend.onrender.com"
.\scripts\e2e-test.ps1
```

### Step 5: Review Results

The test script will output:
- Backend health checks
- Frontend accessibility
- API endpoint tests
- Performance tests
- Summary of passed/failed tests

### Step 6: Troubleshoot Failures

If tests fail:
1. Check service logs in Render and Vercel
2. Verify environment variables are set correctly
3. Check database and Redis connectivity
4. Review Sentry for errors

---

## Post-Setup Checklist

After completing all steps, verify:

- [ ] Backend is running on Render
- [ ] Backend health check returns 200
- [ ] Frontend is accessible on Vercel
- [ ] Custom domain `www.simtrace.site` is working
- [ ] MongoDB Atlas is connected
- [ ] Redis is connected
- [ ] All environment variables are set
- [ ] SSL certificates are valid
- [ ] End-to-end tests pass
- [ ] Sentry is receiving errors
- [ ] Payment webhooks are configured

---

## Support

For issues:
- Check logs in Render and Vercel dashboards
- Review Sentry for errors
- Consult [API Documentation](API_DOCUMENTATION.md)
- Contact support: support@simtrace.site
