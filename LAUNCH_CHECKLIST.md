# SimTrace Production Launch Checklist

## Stage 1 — Accounts & Keys (30 min)

- [ ] **MongoDB Atlas** — create M10+ cluster (not M0 for production)
  - Create DB user: `simtrace_prod` with strong password
  - Network access: allow Railway egress IPs (or use VPC peering)
  - Connection string format: `mongodb+srv://simtrace_prod:<password>@cluster.mongodb.net/simtrace?retryWrites=true&w=majority`

- [ ] **Anthropic API** — get key from https://console.anthropic.com
  - Set spend limit: recommend KES 50,000/month to start

- [ ] **SendGrid** — https://app.sendgrid.com
  - Verify sender domain `simtrace.site` (DNS records)
  - Create API key with Mail Send permission only

- [ ] **Africa's Talking** — https://account.africastalking.com
  - Go Live: submit ID + business registration
  - Get production API key + Sender ID approved

- [ ] **Safaricom Daraja** — https://developer.safaricom.co.ke
  - Go Live: submit business docs
  - Get production Consumer Key, Consumer Secret, Shortcode, Passkey
  - Register callback URL: `https://api.simtrace.site/api/billing/mpesa-callback`

- [ ] **Stripe** — https://dashboard.stripe.com
  - Complete account verification (KYC)
  - Get live keys: `sk_live_...` and `pk_live_...`
  - Webhook endpoint: `https://api.simtrace.site/api/billing/stripe-webhook`
  - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

## Stage 2 — Backend → Railway (20 min)

1. Push code to GitHub: `git push origin main`

2. Railway dashboard → New Project → Deploy from GitHub → select repo
   - Set root directory: `backend/`
   - Railway auto-detects `Dockerfile`

3. Add environment variables (Settings → Variables):

```
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
ALLOWED_ORIGINS=https://simtrace.site,https://www.simtrace.site
FRONTEND_URL=https://simtrace.site
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
SENDGRID_API_KEY=SG....
FROM_EMAIL=alerts@simtrace.site
AT_API_KEY=...
AT_USERNAME=simtrace
AT_SENDER_ID=SimTrace
```

4. Generate a custom domain: `api.simtrace.site` → point to Railway URL

5. Verify: `curl https://api.simtrace.site/health`
   Expected: `{"status":"ok","env":"production"}`

## Stage 3 — Stripe Webhook (5 min)

```bash
# On your local machine, point at production backend
stripe listen --forward-to https://api.simtrace.site/api/billing/stripe-webhook
# Copy the whsec_... value → STRIPE_WEBHOOK_SECRET in Railway
```

Or in Stripe Dashboard → Webhooks → Add endpoint → `https://api.simtrace.site/api/billing/stripe-webhook`

## Stage 4 — Frontend → Vercel (10 min)

1. Vercel dashboard → Import Project → select repo
   - Set root directory: `frontend/`
   - Framework: Next.js (auto-detected)

2. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://api.simtrace.site
NEXT_PUBLIC_SOCKET_URL=https://api.simtrace.site
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

3. Add environment secrets in Vercel dashboard:
   - `simtrace_api_url` = `https://api.simtrace.site`
   - `simtrace_socket_url` = `https://api.simtrace.site`
   - `stripe_publishable_key` = `pk_live_...`

4. Custom domain: `simtrace.site` → point to Vercel
5. Deploy → check https://simtrace.site

## Stage 5 — Seed Production Data (5 min)

```bash
# Run from local machine with production MONGO_URI
MONGO_URI="mongodb+srv://..." node backend/scripts/seed-demo.js

# Then IMMEDIATELY change demo account passwords in the admin panel
# Or remove seed accounts before going live to real users
```

## Stage 6 — GitHub Actions (2 min)

Add secrets in GitHub → Settings → Secrets → Actions:
- `RAILWAY_TOKEN` — from Railway dashboard → Account → Tokens

Push to `main` → GitHub Actions deploys automatically.

## Stage 7 — Post-Launch Verification

```bash
# 1. Health check
curl https://api.simtrace.site/health

# 2. IMEI check (public endpoint)
curl https://api.simtrace.site/api/imei/356938035643809

# 3. Register + login
curl -X POST https://api.simtrace.site/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test@1234"}'

# 4. M-Pesa STK push test (use your own number)
curl -X POST https://api.simtrace.site/api/billing/upgrade-mpesa \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","phone":"2547XXXXXXXX"}'

# 5. Verify callback fires (watch Railway logs)
# 6. Check MongoDB — payment record should be "completed"
# 7. Check subscription — should be "pro"
```

## Stage 8 — DNS & SSL

| Record | Type | Value |
|--------|------|-------|
| `simtrace.site` | A / CNAME | Vercel IP (from Vercel dashboard) |
| `www.simtrace.site` | CNAME | `cname.vercel-dns.com` |
| `api.simtrace.site` | CNAME | Railway domain |

SSL is automatic on both Vercel and Railway.

## Monitoring (post-launch)

- Railway logs: real-time pino JSON logs
- Set up **Logtail** (free tier): add `LOGTAIL_SOURCE_TOKEN` to Railway
- Set up **UptimeRobot**: monitor `https://api.simtrace.site/health` every 1 min
- Set up MongoDB Atlas alerts: CPU > 70%, connections > 80%
- Stripe Dashboard: monitor payment success rate

## Emergency contacts

| Service | Support |
|---------|---------|
| Safaricom Daraja | developers@safaricom.co.ke / +254 722 000 000 |
| Atlas | support.mongodb.com |
| Railway | help.railway.app |
| Stripe | support.stripe.com |
| SendGrid | support.sendgrid.com |
