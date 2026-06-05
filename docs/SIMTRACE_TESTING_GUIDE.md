# SimTrace — Portal-by-Portal Testing Guide & Logins

> Dev/staging only. The seed creates admin/super-admin accounts — **never run it
> against production** (it self-guards on `NODE_ENV=production`). No passwords are
> hardcoded; you choose them via env vars (below) or the script prints strong
> random ones once.

## 1. Create the logins (one command)

The seed (`backend/scripts/seed-demo.ts`, `npm run seed`) upserts one account per
role plus demo devices, pings, alerts, theft reports, plans, and partner records.
Set the passwords you want first, then run it:

```bash
cd backend
# choose your own dev passwords (>= 8 chars). If you omit any, a strong random one
# is generated and printed ONCE at the end of the run.
export SEED_SUPERADMIN_PASSWORD='ChangeMe_Super#2026'
export SEED_ADMIN_PASSWORD='ChangeMe_Admin#2026'
export SEED_DEMO_PASSWORD='ChangeMe_Demo#2026'
export SEED_TELECOM_PASSWORD='ChangeMe_Telco#2026'
export SEED_LAW_PASSWORD='ChangeMe_Law#2026'
export SEED_SUPERADMIN_EMAIL='you@yourdomain.com'   # optional; defaults to the owner email
npm run seed
```

## 2. The accounts

| Portal / role | Email | Password (env) | Notes |
|---|---|---|---|
| **Super Admin** (owner) | `mugo.james27@gmail.com` *(or `SEED_SUPERADMIN_EMAIL`)* | `SEED_SUPERADMIN_PASSWORD` | full access; **forced password change on 1st login** |
| **Admin** | `admin@simtrace.site` | `SEED_ADMIN_PASSWORD` | platform admin; **forced password change on 1st login** |
| **User — Pro** | `jane@demo.simtrace.site` | `SEED_DEMO_PASSWORD` | paid plan, no ads, AI reports |
| **User — Free** | `john@demo.simtrace.site` | `SEED_DEMO_PASSWORD` | 2 devices + 1 extra; ads + IMEI limits |
| **Telecom partner** | `api@safaricom-demo.simtrace.site` | `SEED_TELECOM_PASSWORD` | also has a Partner `apiKey` (printed in seed log) |
| **Law enforcement** | `dci@demo.simtrace.site` | `SEED_LAW_PASSWORD` | also has a Partner `apiKey` |

The two partner `apiKey`s are printed in the seed output (look for "Telecom
partner:" / the law key). Use them as `x-api-key` for partner API calls.

> **First-login note:** admin + super-admin are seeded with `mustChangePassword`,
> so the UI should route them to change-password before the dashboard. That's
> expected — set a new password, then proceed.

## 3. Portals → tabs → backend, and what to test

### Super Admin — `mugo.james27@gmail.com`
Sees everything below, plus the super-admin surfaces.
- **`/admin`** and all admin tabs (see Admin section).
- Super-admin dashboards → `/api/super-admin`, `/api/super-admin-dashboard`.
- Test: can reach every dashboard; role management works; nothing returns 403
  that shouldn't (this exercises the P0.1 `requireAdmin`→super_admin fix — before
  it, super-admins were wrongly locked out of `requireAdmin` routes).

### Admin — `admin@simtrace.site`
| Tab (frontend) | Backend | Test |
|---|---|---|
| `/admin/users` | `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` | list users; change a user's role; confirm you **cannot** change your own role (400) |
| `/admin/revenue` | `/api/billing`, `/api/financials` | revenue figures load |
| `/admin/devices` | `/api/devices`, `PATCH /api/devices/bulk-status` | device list; bulk status change (admin-only) |
| `/admin/ads` | `/api/ads`, `/api/ads-enhanced` | ad campaigns list/moderate |
| `/admin/audit-logs` | `GET /api/audit-logs`, `/statistics`, `/export` | **audit trail loads** (admin-only). After doing actions elsewhere, confirm entries appear — this is the P1 audit enforcement |
| admin mgmt / roles | `/api/admin-management`, `/api/admin-roles`, `/api/admin-dashboard` | role hierarchy, permissions |

**Partner approval (changed in this audit):** partner sign-ups now stay
`pending` and do **not** auto-grant a role. To approve a telecom/law applicant,
promote them here: `PATCH /api/admin/users/:id/role`.

### Law Enforcement — `dci@demo.simtrace.site`
| Tab | Backend | Test |
|---|---|---|
| `/law-enforcement` | `/api/law-enforcement`, `/api/police-integration`, `/api/police-hierarchy`, `/api/le-dashboard` | dashboards load for this role; a **plain user gets 403** here |
| `/law-enforcement/cases` | `/api/law-enforcement-cases` | list/open cases; add collaborator |
| `/evidence` | encrypted-data / case evidence | evidence views (sensitive — audited) |

### Telecom — `api@safaricom-demo.simtrace.site`
| Tab | Backend | Test |
|---|---|---|
| `/telecom-portal` | `/api/telecom-company`, `/api/telecom-integration`, `/api/telecom-dashboard` | portal loads for telecom role |
| `/telecom-analytics` | `/api/telecom-analytics`, `/api/cell-tower` | analytics, tower data |
| (CEIR / network block) | `/api/regulatory` | network-block actions allowed for telecom/admin/super_admin (P0 decision) |

### User (Pro `jane@…`, Free `john@…`)
| Tab | Backend | Test |
|---|---|---|
| `/dashboard` | `/api/auth/me`, `/api/devices`, `/api/alerts` | overview loads |
| `/devices`, `/devices/[id]` | `/api/devices` | list; detail; you only see **your own** devices |
| `/imei` | `/api/imei` | IMEI check/register (returns `deviceKey` once); Free tier hits daily limit |
| `/alerts` | `/api/alerts` | alert feed |
| `/remote-lock` | `/api/device-locks`, `/api/devices/:id/lock` | lock/unlock your device; confirm you can't lock someone else's |
| `/report`, `/reports` | theft report / `/api/recovery` | file/track a theft report |
| `/recovery-network` | `/api/recovery` | recovery network |
| `/device-dna` | `/api/dna` | device fingerprint |
| `/insurance` | `/api/insurance` | policies/claims |
| `/cross-border` | `/api/cross-border` | cross-border checks |
| `/blockchain-ledger` | `/api/blockchain` | ledger entries |
| `/financial-dashboard` | `/api/financials` | financial views |
| `/ai-assistant` | `/api/ai`, `/api/ai-integration` | AI report (Pro has quota; rate-limited) |
| `/advertise`, `/my-campaigns` | `/api/ads`, `/api/ads-enhanced` | create/track ads |
| `/community` | `/api/community` | community feed |
| `/pricing` | `/api/billing` | plans; upgrade flow (Stripe/PayPal/M-Pesa) |
| `/profile` | `/api/auth/me`, `/api/auth/update-profile`, `/api/auth/change-password`, `POST /api/auth/logout-all` | edit name/phone (role can't change here); change password; **log out all sessions** |
| `/status` | `/api/health` | health/status |

## 4. Smoke tests for the hardened paths (run these to confirm the security work)

Replace `$API` with your backend URL and tokens as you get them.

**Login → token**
```bash
curl -s $API/api/auth/login -H 'content-type: application/json' \
  -d '{"email":"jane@demo.simtrace.site","password":"ChangeMe_Demo#2026"}'
# → { token, user }.  export TOKEN=...
```

**Stateful role / revocation (P1).** Call `logout-all`, then reuse the OLD token:
```bash
curl -s $API/api/auth/logout-all -H "authorization: Bearer $TOKEN"   # bumps tokenVersion
curl -s $API/api/auth/me        -H "authorization: Bearer $TOKEN"   # → 401 "Token has been revoked"
```

**Privilege-escalation fix (this audit).** As a plain user, apply as a partner,
then confirm you did NOT gain access:
```bash
curl -s $API/api/partner/register -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"orgName":"X","orgType":"law_enforcement"}'
# → "pending admin review"
curl -s $API/api/law-enforcement -H "authorization: Bearer $TOKEN"   # → 403 (was 200 before the fix)
```

**Device-key callback (P0.1).** `record-attempt` needs the device key, not a user token:
```bash
curl -s -X POST $API/api/device-locks/$LOCK_ID/record-attempt \
  -H "x-device-key: $DEVICE_KEY" -H 'content-type: application/json' \
  -d '{"location":{"latitude":-1.29,"longitude":36.82,"accuracy":10}}'   # → ok; wrong/absent key → 401
```

**Webhook verification (P0.2).** A forged PayPal event is now rejected:
```bash
curl -s -X POST $API/api/paypal/webhook -H 'content-type: application/json' \
  -d '{"event_type":"PAYMENT.CAPTURE.COMPLETED","id":"evt_fake"}'   # → 400 (verification failed) in prod
```

**Audit trail (P1).** After the calls above, as admin:
```bash
curl -s $API/api/audit-logs -H "authorization: Bearer $ADMIN_TOKEN"
# → entries for the sensitive calls, including the denied 403/401 attempts
```

## 4b. Why the LIVE site currently looks wrong (deploy staleness)

The live `simtrace.site` is running an **older build than this repo**, which
explains both symptoms you saw:

- **The "Demo accounts: admin@simtrace.site / Admin@2024!" box** on the login
  page does **not exist in this repo anymore** — the current `app/login/page.tsx`
  has no demo-credentials block at all. It's leftover from an earlier deploy. And
  even where shown, those passwords won't work: the seed sets passwords from your
  `SEED_*` env vars (or random), not `Admin@2024!`. (Showing an **admin**
  credential on a public login page is also a security problem — good that it's
  already gone from the codebase.)
- **The landing-page numbers** (2.4M devices, 18k cases, 9.1k recovered, 47+
  partners) are **fallback defaults** shown when `GET /api/devices/public-stats`
  returns nothing. The page does fetch that endpoint — but the deployed backend
  is older/unreachable, so it falls back to those figures. Also fixed here: the
  endpoint previously returned `recentPings` (not `openReports`), so "Active
  Cases" always showed the fake fallback even when the API worked. `public-stats`
  now returns `{ total, recovered, recentPings, openReports, telecomPartners }`
  and the homepage renders the real values (or 0 / "…"), never fabricated numbers.

**To make the live site correct:**
1. **Redeploy the backend** (Render) from this repo → `public-stats` returns the
   right fields; all the security hardening ships.
2. **Redeploy the frontend** (Vercel) from this repo → stale demo-cred box gone,
   stats wired to real data.
3. **Seed the live DB** with your chosen passwords (section 1) so the accounts
   exist and you can log in.
4. If stats still look empty after redeploy, the frontend can't reach the API —
   check `NEXT_PUBLIC_API_URL` and backend CORS.

> **Unverified marketing claims (recommend addressing before launch):** the
> landing page hardcodes testimonials (James Mwangi, Sarah Ochieng, "Safaricom
> Tech") and the line **"Integrated with DCI Kenya and law enforcement
> nationwide."** If those aren't literally true, they're a trust + advertising
> risk and tie directly to §0 of the compliance review (authority to act as a
> police-data intermediary). Replace or qualify them until they're real.

## 5. Caveats
- These flows are **type-sound and boot**, but several were only confirmable
  against a live DB (Mongo/Redis) — that's what this pass verifies in your env.
- Webhook checks need real `STRIPE_WEBHOOK_SECRET` / `PAYPAL_WEBHOOK_ID` set to
  fully prove (and to fail-closed correctly in production).
- OTP delivery for the privileged dashboard flows is still a TODO (dev logs the
  OTP to console) — in production those OTP-gated actions can't complete until a
  real SMS/email channel is wired. See the blueprint.
