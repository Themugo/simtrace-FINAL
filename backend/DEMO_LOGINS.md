# SimTrace — Demo Logins & Auth Setup

## Demo / admin accounts

Run the seed against your dev/staging database, choosing the passwords yourself:

```bash
cd backend
SEED_ADMIN_PASSWORD='DemoAdmin#2026'      \
SEED_SUPERADMIN_PASSWORD='DemoOwner#2026' \
SEED_DEMO_PASSWORD='DemoUser#2026'        \
SEED_TELECOM_PASSWORD='DemoTelco#2026'    \
SEED_LAW_PASSWORD='DemoLaw#2026'          \
npm run seed
```

(Leave any `SEED_*_PASSWORD` unset and the seed generates a strong random one and
prints it once.)

| Role | Email | Password (the value you passed) | Notes |
|------|-------|--------------------------------|-------|
| admin | `admin@simtrace.site` | `SEED_ADMIN_PASSWORD` | **must reset on first login** |
| super_admin | `SEED_SUPERADMIN_EMAIL` (default `mugo.james27@gmail.com`) | `SEED_SUPERADMIN_PASSWORD` | **must reset on first login** |
| user (Pro) | `jane@demo.simtrace.site` | `SEED_DEMO_PASSWORD` | verified |
| user (Free) | `john@demo.simtrace.site` | `SEED_DEMO_PASSWORD` | verified |
| telecom | `api@safaricom-demo.simtrace.site` | `SEED_TELECOM_PASSWORD` | verified |
| law_enforcement | `dci@demo.simtrace.site` | `SEED_LAW_PASSWORD` | verified |

- **Reset after login:** admin & super_admin have `mustChangePassword` set — the
  login response returns this flag; send them to Profile → Change Password (or
  `POST /api/auth/change-password`), which clears the flag.
- The seed refuses to run when `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`.

## New-user registration

- **Email + password** — `POST /api/auth/register`.
- **Continue with Google** — appears on the register page automatically once
  `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` are set
  (see `backend/.env.example`). Backend routes: `/api/auth/oauth/google`,
  `/api/auth/oauth/google/callback`, `/api/auth/oauth/providers`.
- **OTP verification** — `POST /api/verify/send` `{channel:'email'|'sms'|'call', destination}`
  then `POST /api/verify/check` `{destination, code}`.
  - Email OTP uses `SENDGRID_API_KEY`; SMS OTP uses `AT_API_KEY` (Africa's Talking).
  - In non-production with no provider key set, the code is logged to the server
    console and echoed as `devCode` so you can test the flow.
  - **Call/voice OTP** returns `501 not configured` until you wire a voice
    provider (`VOICE_OTP_PROVIDER`) — it's intentionally not pretend-implemented.

## Still required from you before live use
- A Google OAuth app (client id/secret + authorized redirect URI) for social login.
- A voice provider if you want call-based OTP.
- Real SendGrid / Africa's Talking keys for email & SMS delivery (otherwise dev fallback only).
