# SimTrace — Demo & Admin Logins (for live testing)

> **Local/demo doc — not committed to git.** Rotate or delete these accounts
> after testing. Anyone with these passwords has full access to the matching role.

## 1. Seed the accounts

Point `MONGO_URI` at the target database, then run the seed with these passwords.
The site runs with `NODE_ENV=production`, so the seed needs the explicit override:

```bash
cd backend
SEED_ALLOW_PRODUCTION=true \
SEED_SUPERADMIN_EMAIL='owner@simtrace.site' \
SEED_SUPERADMIN_PASSWORD='SimTrace#Owner#2026!' \
SEED_ADMIN_PASSWORD='SimTrace#Admin#2026!' \
SEED_DEMO_PASSWORD='SimTrace#Demo#2026!' \
SEED_TELECOM_PASSWORD='SimTrace#Telecom#2026!' \
SEED_LAW_PASSWORD='SimTrace#Law#2026!' \
npm run seed
```

(Prefer a **staging** database first. Only seed production deliberately, and
rotate these passwords once testing is done.)

## 2. Ready logins

| Purpose | Email | Password | Role |
|---------|-------|----------|------|
| Owner / web host | `owner@simtrace.site` | `SimTrace#Owner#2026!` | super_admin |
| Admin | `admin@simtrace.site` | `SimTrace#Admin#2026!` | admin |
| Demo user (Pro) | `jane@demo.simtrace.site` | `SimTrace#Demo#2026!` | user |
| Demo user (Free) | `john@demo.simtrace.site` | `SimTrace#Demo#2026!` | user |
| Telecom partner | `api@safaricom-demo.simtrace.site` | `SimTrace#Telecom#2026!` | telecom |
| Law enforcement | `dci@demo.simtrace.site` | `SimTrace#Law#2026!` | law_enforcement |

> Set `SEED_SUPERADMIN_EMAIL` to whatever owner address you want — the table
> assumes `owner@simtrace.site`. If you omit any `SEED_*_PASSWORD`, the seed
> generates a strong random one and prints it once at the end of the run.

## 3. Reset password after login

1. Log in with a credential above.
2. Go to **Profile → Change password** (or `POST /api/auth/change-password`
   with `{ currentPassword, newPassword }`).
3. Forgot password (logged out) uses **Forgot password → email reset link**
   (`/api/auth/forgot-password` → `/api/auth/reset-password`).

## 4. Everyone else

All non-demo users self-register at `/register` with email + password
(working today). The "continue with social account" and OTP/call verification
enhancements are described in `AUTH_ENHANCEMENTS.md`.
