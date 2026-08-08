# SimTrace — Integration Readiness

Every integration is **code-complete and env-gated**: the platform runs without
any of them, and each one activates the moment its keys are present in the
environment — no further code changes. Check live status anytime at:

```
GET /api/health/integrations
```

It returns `{ ready: [...], missing: [...], integrations: [...] }`.

## Matrix

| Integration | Enables | Required env | Behavior without keys |
|-------------|---------|--------------|------------------------|
| **MongoDB** | core datastore | `MONGO_URI` | server retries connection (required) |
| **Redis** | rate limits, queues, sessions | `REDIS_URL` | required for full function |
| **Stripe** | card billing + webhooks | `STRIPE_SECRET_KEY` (`STRIPE_WEBHOOK_SECRET`) | billing returns "not configured" |
| **M-Pesa** | mobile-money billing | `MPESA_CONSUMER_KEY/SECRET/SHORTCODE/PASSKEY` (`MPESA_ENV`) | STK push throws "not configured" |
| **Anthropic** | AI risk reports | `ANTHROPIC_API_KEY` | AI endpoints return "not set" |
| **SendGrid** | transactional email + email OTP | `SENDGRID_API_KEY` (`FROM_EMAIL`) | dev fallback logs to console |
| **Africa's Talking** | SMS alerts + SMS OTP | `AT_API_KEY` (`AT_USERNAME`, `AT_SENDER_ID`) | SMS no-ops; dev OTP echoed |
| **Twilio** | call (voice) OTP + Twilio SMS | `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER` | call OTP returns 501 |
| **Google OAuth** | "Continue with Google" | `GOOGLE_CLIENT_ID/SECRET` (`GOOGLE_REDIRECT_URI`, `OAUTH_SUCCESS_REDIRECT`) | button hidden; routes return 501 |
| **Cloudinary** | image/asset uploads | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` or `CLOUDINARY_URL` | `uploadImage()` returns null |
| **Sentry** | error monitoring | `SENTRY_DSN` | disabled |

## Plug-and-play steps

1. Copy `backend/.env.example` → `backend/.env`.
2. Fill in the keys for whichever integrations you want live. Leave the rest blank.
3. Restart the backend. Confirm with `GET /api/health/integrations`.

## Notes / honest boundaries
- All keys are read at runtime; nothing is hardcoded.
- Live API round-trips (Stripe charges, M-Pesa STK, Twilio calls, Google consent,
  Cloudinary uploads) can only be verified with real credentials in a reachable
  environment — they could not be exercised end-to-end in the build sandbox.
- You still create the provider accounts/apps (Stripe, Google OAuth client,
  Twilio number, Cloudinary, etc.) and paste their keys; that's the "plug" step.
