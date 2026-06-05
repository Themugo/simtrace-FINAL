# Infrastructure Setup Guide

This guide walks through setting up the production infrastructure for SimTrace.

## MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to https://cloud.mongodb.com
2. Sign up for a free account or log in
3. Create a new organization (if needed)

### Step 2: Create Production Cluster
1. Click "Build a Database"
2. Choose "M10" or higher for production (NOT M0 free tier)
3. Select cloud provider (AWS/Azure/GCP)
4. Choose region closest to your users (e.g., us-east-1)
5. Cluster name: `simtrace-prod`
6. Click "Create"

### Step 3: Configure Database Access
1. Go to "Database Access" → "Add New Database User"
2. Username: `simtrace_prod`
3. Password: Generate a strong password (save it securely)
4. Database User Privileges: "Read and write to any database"
5. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. For Railway deployment, add Railway egress IPs:
   - Check Railway documentation for current egress IPs
   - Or use "Allow Access from Anywhere" (0.0.0.0/0) for testing
3. For production, consider VPC peering or Private Endpoint

### Step 5: Get Connection String
1. Go to "Database" → "Connect" → "Connect your application"
2. Choose "Node.js" and version 6.0 or later
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Format: `mongodb+srv://simtrace_prod:<password>@cluster.mongodb.net/simtrace?retryWrites=true&w=majority`

### Step 6: Update Environment Variables
Add to Railway backend environment variables:
```
MONGO_URI=mongodb+srv://simtrace_prod:<password>@cluster.mongodb.net/simtrace?retryWrites=true&w=majority
```

## Redis Setup

### Option 1: Railway Redis (Recommended)
1. Go to Railway dashboard
2. Click "New Project" → "Add Service" → "Redis"
3. Railway will provide Redis connection URL
4. Add to environment variables: `REDIS_URL=<railway-redis-url>`

### Option 2: Redis Cloud
1. Go to https://redis.com/try-free/
2. Create a free Redis Cloud account
3. Create a new database
4. Get connection URL
5. Add to environment variables

### Option 3: AWS ElastiCache
1. Go to AWS Console → ElastiCache
2. Create Redis cluster
3. Configure security groups
4. Get endpoint URL

## Sentry Setup

### Step 1: Create Sentry Account
1. Go to https://sentry.io
2. Sign up for a free account
3. Create a new organization: `simtrace`

### Step 2: Create Projects
1. Create "simtrace-frontend" project (JavaScript/Next.js)
2. Create "simtrace-backend" project (Node.js/Express)
3. Note the DSN for each project

### Step 3: Configure Frontend
Add to Vercel environment variables:
```
NEXT_PUBLIC_SENTRY_DSN=<frontend-dsn>
SENTRY_DSN=<frontend-dsn>
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=simtrace-frontend
```

### Step 4: Configure Backend
Add to Railway environment variables:
```
SENTRY_DSN=<backend-dsn>
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=simtrace-backend
```

## Railway Setup

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Deploy Backend
1. Click "New Project" → "Deploy from GitHub"
2. Select `Themugo/simtrace-FINAL` repository
3. Set root directory: `backend/`
4. Railway will detect Dockerfile
5. Add environment variables (see Environment Variables section)
6. Deploy

### Step 3: Get Railway Token
1. Go to Railway dashboard → Account → Tokens
2. Create new token
3. Add to GitHub secrets: `RAILWAY_TOKEN`

### Step 4: Configure Domain
1. Go to backend service → Settings → Domains
2. Add custom domain: `api.simtrace.site`
3. Update DNS records

## Vercel Setup

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### Step 2: Deploy Frontend
1. Click "Add New Project" → Import from GitHub
2. Select `Themugo/simtrace-FINAL` repository
3. Set root directory: `./` (project root)
4. Add environment variables (see Environment Variables section)
5. Deploy

### Step 3: Get Vercel Credentials
1. Go to Vercel dashboard → Settings → Tokens
2. Create token
3. Add to GitHub secrets: `VERCEL_TOKEN`
4. Get Org ID and Project ID from settings
5. Add to GitHub secrets: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Step 4: Configure Domain
1. Go to project → Settings → Domains
2. Add custom domain: `simtrace.site`
3. Update DNS records

## GitHub Secrets Configuration

Add these secrets to GitHub repository (Settings → Secrets → Actions):

```
RAILWAY_TOKEN=<your-railway-token>
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

## Environment Variables Reference

### Backend (Railway)
```
NODE_ENV=production
MONGO_URI=<mongodb-atlas-connection-string>
JWT_SECRET=<generate-secure-random-string>
ALLOWED_ORIGINS=https://simtrace.site,https://www.simtrace.site
FRONTEND_URL=https://simtrace.site
TRACK_REQUIRE_AUTH=true
ANTHROPIC_API_KEY=<your-anthropic-key>
REDIS_URL=<redis-connection-string>
BACKEND_URL=https://api.simtrace.site
MPESA_ENV=production
MPESA_CONSUMER_KEY=<safaricom-consumer-key>
MPESA_CONSUMER_SECRET=<safaricom-consumer-secret>
MPESA_SHORTCODE=<safaricom-shortcode>
MPESA_PASSKEY=<safaricom-passkey>
STRIPE_SECRET_KEY=<stripe-live-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
SENDGRID_API_KEY=<sendgrid-api-key>
FROM_EMAIL=alerts@simtrace.site
AT_API_KEY=<africas-talking-api-key>
AT_USERNAME=simtrace
AT_SENDER_ID=SimTrace
SENTRY_DSN=<sentry-backend-dsn>
SENTRY_ORG=<sentry-org>
SENTRY_PROJECT=simtrace-backend
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://api.simtrace.site
NEXT_PUBLIC_SOCKET_URL=https://api.simtrace.site
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-live-publishable-key>
SENTRY_DSN=<sentry-frontend-dsn>
SENTRY_ORG=<sentry-org>
SENTRY_PROJECT=simtrace-frontend
```

## DNS Configuration

Update your DNS records for `simtrace.site`:

```
Type: A / CNAME
Name: @
Value: <Vercel IP from dashboard>

Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: api
Value: <Railway domain>
```

## Verification Steps

After setup, verify:

1. **Backend Health**: `curl https://api.simtrace.site/health`
2. **Frontend Load**: Visit `https://simtrace.site`
3. **MongoDB Connection**: Check Railway logs
4. **Redis Connection**: Check Railway logs
5. **Sentry Errors**: Check Sentry dashboard
6. **Stripe Webhooks**: Test payment flow
7. **M-Pesa Callbacks**: Test STK push

## Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in Network Access
- Verify username/password in connection string
- Check cluster status in Atlas dashboard

### Redis Connection Issues  
- Verify Redis URL format
- Check Redis instance status
- Ensure security groups allow connections

### Deployment Failures
- Check build logs in Railway/Vercel
- Verify all environment variables are set
- Ensure Dockerfile is valid
- Check for missing dependencies

### Sentry Not Receiving Errors
- Verify DSN is correct
- Check SDK initialization
- Ensure environment is set to production
