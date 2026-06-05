# SimTrace — Hardening & Completion Blueprint

Status at time of writing: **63/63 routes mounted, backend `tsc` 0, boots clean.**
This document maps what still needs attention before production, in priority
order. "Wired + type-sound + boots" proves the code compiles and endpoints
mount — it does **not** prove correctness against a live DB, nor that sensitive
surfaces are safe to expose.

## Already resolved (verified in current code)
- **Secret hashing** — `OfficialEmail.verificationToken`, `SecurityOtp.otpNumber`,
  `PasswordResetRequest.verificationCode` hashed via `hashSecret()` on write +
  verify; dev-only `console.log`s gated to non-production. (`services/dashboardSecurity.ts`)
- **Admin/super-admin RBAC** — router-level `requireRole(...)` on all five admin
  routers.
- **Police/LE routers locked** — router-level `requireRole("law_enforcement",
  "admin","super_admin")` on lawEnforcement, policeIntegration, policeHierarchy,
  lawEnforcementDashboard.
- **Privileged dashboard provisioning** — minister / police-general /
  station-admin create+patch now `requireRole("admin","super_admin")`.

---

## P0 — Must fix before any production deploy

### 1. Authorization completeness
- **FINAL-AUDIT FIX — partner self-promotion (was a critical escalation).**
  `POST /api/partner/register` (any authenticated user) created a `pending`
  Partner **but immediately set the caller's `User.role`** to `law_enforcement`
  (or `telecom` for any other org type) — so any user could self-promote and
  reach the criminal/PII routes hardened in P0, with no review. The role grant is
  removed; the application stays `pending` and an admin promotes via
  `PATCH /api/admin/users/:id/role` (already `requireAdmin`). VERIFIED safe in the
  same sweep: `/api/auth/update-profile` only writes name/phone (no role);
  `admin /users/:id/role` is admin-gated and blocks self-role-change; `sanitize()`
  strips passwordHash/apiKey. NOTE: `services/session.ts` (a parallel JWT util
  that trusts `data.role`) is **not mounted** — dead infra, fold into P2 cleanup.
  NOTE: privileged-dashboard OTP delivery is still a TODO (dev logs the OTP) — those
  OTP-gated actions can't complete in prod until a real SMS/email channel is wired.
- **FINAL-AUDIT FIX — public login page leaked demo admin credentials.**
  `app/login/page.tsx` displayed `admin@simtrace.site / Admin@2024!` (+ a user
  cred) on the **live** site. The passwords were stale (don't match the
  env-driven seed, hence "not working") AND advertising an admin login publicly is
  a security risk. Block removed. Demo logins belong on staging via the seed, not
  the prod login page.
- **FLAGGED (not code) — landing page shows fabricated metrics & claims.**
  `app/page.tsx`: "Active Cases 18,000" is hardcoded (the public endpoint doesn't
  return it); "47+ Telecom Partners" is hardcoded (no data source); "Devices
  Protected"/"Recovered" try `/api/devices/public-stats` (real counts) but
  silently fall back to 2,400,000 / 9,100 on fetch failure (`.catch(()=>{})`), and
  that fallback is what shows on the live site. Testimonials (named individuals),
  "Trusted by thousands", and "Integrated with DCI Kenya" are hardcoded marketing
  copy. On a live site these are misrepresentation / false-advertising risk; the
  DCI claim ties directly to the §0 authority question. Decision needed from owner.
- **`requireAdmin` excludes `super_admin` — RESOLVED (central fix).**
  `middleware/auth.ts requireAdmin` now allows `admin` **and** `super_admin`,
  consistent with `requireSelfOrAdmin`/`requireRecordOwner`, which already treat
  super_admin as admin-equivalent. Fixes the super-admin lockout everywhere
  `requireAdmin` is used in one place. (Also aligned the `IUser.role` union to
  include `super_admin`.)
- **IDOR / object ownership (broad pattern).**
  - DONE: `requireSelfOrAdmin("userId")` middleware (`middleware/auth.ts`) added
    and applied to the 10 user-scoped `:userId` reads that had only
    `authenticate` (dashboardSecurity ×5, deviceLock, deviceTransfer ×2,
    selfieCapture ×2). A user can now only read their own; admins/super-admins
    any.
  - DONE (dashboardSecurity resource-id reads): GET by id of admin-managed
    secret-bearing records now role-guarded — `/official-emails/:emailId`,
    `/security-otps/:otpId`, `/password-resets/:requestId` →
    `requireRole("admin","super_admin")`; `/network-changes/:requestId` and
    `/network-changes/agency/:agencyId` → privileged roles only (no regular
    users). Legit user access is unaffected (verify-POST + `/user/:userId`
    lists).
  - DONE (device-scoped direct-owner endpoints): new `requireRecordOwner`
    middleware (`middleware/auth.ts`) loads the record and checks its owner
    field (admins bypass). Applied to deviceLock `GET /:lockId`, `POST
    /:lockId/unlock|wipe` (owner `userId`); deviceTransfer `GET /:transferId`,
    `POST /:transferId/accept|confirm|cancel|dispute` (parties `userId`,
    `toUserId`); selfieCapture `GET /:captureId` (owner `user`). Needs a live
    round-trip to confirm at runtime.
  - DONE (device-list reads): `requireDeviceOwner` (loads Device, checks `owner`,
    admin bypass) on the six `/device/:deviceId` reads — deviceLock ×3,
    deviceTransfer ×1, selfieCapture (`/device/:deviceId` + `/reports/device/:deviceId`).
  - DONE (thief reports + dispute resolve): selfieCapture `/reports/:reportId`
    GET/PATCH/resolve → `requireRecordOwner` on `createdBy` (reporter-or-admin);
    deviceTransfer `/:transferId/resolve` → `requireRole("admin","super_admin")`
    (dispute arbiter, not a party).
  - DONE (office dashboards): minister / police-general / station-admin are
    office-based security-organ accounts (not individual office-holders);
    system admin provisions each office a login. So create/patch stay
    `requireRole("admin","super_admin")`, and the GET reads are now
    `requireRole("law_enforcement","admin","super_admin")` (the office login maps
    to law_enforcement in the current taxonomy) — out of reach of regular users
    and telecom.
  - DONE (member management, per decision): network-lock member management is a
    telecom concern (to avoid legal exposure), so telecomDashboard
    `/:dashboardId/users/:userId` -> `requireRole("telecom","admin","super_admin")`;
    lawEnforcementDashboard equivalent already covered by its router guard.
    Screen-lock stays device-owner (requireRecordOwner / requireDeviceOwner).
  - DONE (org member management): new `requireOrgAdmin` middleware
    (`middleware/auth.ts`; caller must be owner/admin member via
    OrganizationMember, system-admin bypass) applied to enterprise
    `/organizations/:id` patch, `/upgrade`, `/members` add, and
    `/members/:userId` delete/patch.
  - DONE (network lock = telecom, per decision): regulatory (CEIR/network-block)
    route mutations changed from `requireAdmin` (admin-only — excluded telecom +
    super_admin) to `requireRole("telecom","admin","super_admin")` so carriers
    own network locking; also fixes the super_admin exclusion on that route.
  - DONE (device-key auth): deviceLock `/:lockId/record-attempt` now authenticates
    with the **per-device key** (`x-device-key`) minted at enrolment
    (`POST /api/imei/register`), consistent with `/api/track` and `/api/lock`. A
    single lookup (`Device.findOne({ _id: lock.deviceId, deviceKey })`) proves the
    key is valid AND that the lock belongs to that device, so one device can't
    touch another's lock. Was previously `authenticate` (any logged-in user could
    inflate another lock's counter). Also fixed a real bug in `recordUnlockAttempt`:
    it incremented a non-existent `unlockAttempts` (`undefined + 1 = NaN`) instead
    of the schema's `failedAttempts`, and **dropped the attempt location** the
    route passed in — now counts correctly and persists `lastAttemptLocation`
    (valuable recovery telemetry). NOTE (cross-cutting, P2/P3): `deviceKey` is
    stored plaintext across imei/track/lock/deviceLock — harden to a stored hash
    everywhere in one migration rather than piecemeal.
- **OTP-gated flows — DONE (role checks layered on top of OTP).** password-reset
  approve/reject/complete -> `requireRole("admin","super_admin")`; network-change
  create/approve/reject/execute/rollback -> `requireRole("telecom","admin",
  "super_admin")` (network = telecom domain). verify steps stay on
  authenticate+OTP (requester proves possession). OTP multi-party check remains
  the second factor.
- **9-level RBAC hierarchy** is not enforced at the route layer; only the coarse
  roles (`admin/super_admin/law_enforcement/telecom`) are. Map each privileged
  endpoint to its hierarchy level.

### 2. Payment integrity (`routes/paypal.ts`, `routes/billing.ts`, `routes/webhooks.ts`)
- **DONE (inbound signature verification).**
  - Stripe (`billing.ts /stripe-webhook`): raw body already wired in server.ts
    (`express.raw` before `express.json`); `constructEvent` verifies. Hardened to
    **fail-closed in production** — if the signing secret/sig is absent it now
    returns 400 instead of falling back to `JSON.parse` (dev still allows the
    fallback for local testing).
  - PayPal (`paypal.ts /webhook`): `verifyPayPalWebhook` now actually calls
    PayPal's `/v1/notifications/verify-webhook-signature` API (was a no-op
    `return true`). Fail-closed in production when `PAYPAL_WEBHOOK_ID` is set; the
    route rejects with 400 on failure. Was previously unauthenticated **and**
    unverified — forged `PAYMENT.CAPTURE.COMPLETED` events could trigger captures.
- **DONE (idempotency).** New `ProcessedWebhookEvent` model (unique on
  `provider`+`eventId`); both webhook handlers record the event id first and
  no-op (`{received,duplicate:true}`) on the duplicate-key error, so provider
  retries can't double-credit (`Payment`/`Subscription`, `PayPalPayment`).
- **CAVEAT — needs a live round-trip.** Verified to compile + boot, but the
  Stripe raw-body signature path and the PayPal verify API call can only be
  fully confirmed against a real test webhook from each provider. Set
  `STRIPE_WEBHOOK_SECRET` and `PAYPAL_WEBHOOK_ID` and send a test event before
  trusting in production.
- **REMAINING — outbound webhooks** (`WebhookSubscription.secret`): partner.ts
  already HMAC-signs deliveries; confirm the generic outbound delivery path signs
  too and add retry/backoff.

### 3. `EncryptedData` key management (M2)
- **DONE (key handling).** The symmetric key is NOT stored with the ciphertext —
  it comes from `process.env.ENCRYPTION_KEY`, now derived to a proper 32-byte key
  via SHA-256 and **fail-closed in production** if unset (was silently using an
  ephemeral `randomBytes` key → data-loss + false security). The misnamed
  `encryptionKey` field (which held the IV) is now stored as `iv`, and the
  **`authTag` is persisted** — previously it was dropped, which made GCM
  decryption impossible. Decrypt reads `iv ?? encryptionKey` for back-compat.
  (`services/policeHierarchy.ts`, `db/index.ts` EncryptedData)
- **REMAINING (infra/ops):** provision `ENCRYPTION_KEY` from a real KMS / secret
  store at deploy, set up key rotation, and migrate/re-encrypt any legacy rows
  (and any rows written before the authTag fix are undecryptable — re-encrypt).

### 4. Child-data & image consent (M5)
- **DONE (`ParentChild`, minors' location/tracking).** `addChild` now records
  `guardianConsent`, `consentRecordedAt`, and `dataRetentionUntil` (+1yr when
  consent is given). `enableLiveTracking` is hard-gated — it throws "Guardian
  consent is required before enabling live tracking of a minor" unless
  `guardianConsent === true`. (`services/securityEnhanced.ts`)
- **DONE (`SelfieCapture`, captures a person's image).** `captureSelfie` now
  records a `consentBasis` (default `legitimate_interest_stolen_device_recovery`
  — captures only occur on a locked, reported lost/stolen device) and a
  `retentionUntil` of 90 days. (`services/selfieCapture.ts`)
- **REMAINING:** surface the consent-capture step in the UI/registration flow
  (so `guardianConsent` is a real recorded act, not just an API flag); add a
  scheduled retention-cleanup job that purges rows past `dataRetentionUntil` /
  `retentionUntil`; and the defamation/accusation review stays in P0.5.

### 5. Legal / compliance review (Kenya DPA 2019 + criminal procedure)
- **DELIVERED as a written review** → `docs/COMPLIANCE_REVIEW_P0.5.md` (also in
  outputs as `SIMTRACE_COMPLIANCE_REVIEW.md`). Engineering-grounded gap analysis
  mapping the real schemas/flows (`PoliceReport`, `CourtCase`, `InterpolCase`,
  `CaseTransfer`, `DataAccessControl`, `EncryptedData`, `SelfieCapture`/
  `ThiefReport`, `ParentChild`, telecom + reseller PII) to DPA 2019, the General
  & Registration Regulations 2021, and the ODPC 2025 Children's Data Guidance.
- **Not legal advice** — it is structured to hand to a qualified Kenyan
  data-protection advocate. Headline (blocking) items it surfaces, most of which
  are **legal/organizational, not code**:
  - **§0 authority** — a *private* entity originating/holding police/court/Interpol
    records likely needs a statutory basis or MOU with NPS/DCI/Judiciary/Interpol
    NCB; this gates the whole law-enforcement module.
  - **§1 ODPC registration** mandatory (telecom + sensitive + children data).
  - **§3 DPIA** mandatory (biometrics, children, criminal data, AI risk/fraud
    scoring → automated-decision safeguards + human-in-the-loop).
  - **§4 verifiable parental consent + age gate** (P0.4's boolean is necessary
    but not sufficient).
  - **§5 cross-border** — Vercel/Render/AI hosting is transfer outside Kenya
    (safeguards + proof-to-Commissioner + explicit consent for sensitive;
    possible localization).
  - **§7 selfie/ThiefReport defamation** — never auto-label a "thief"; treat as
    evidence only; balancing test in the DPIA.
  - **§6 DSAR**, **§8 processor/data-sharing contracts**, **§9 72h breach
    runbook + enforced audit logs**, **§10 retention purge job**.

---

## P1 — Correctness & reliability before scale

6. **Live integration testing** (needs Mongo/Redis/Stripe/PayPal/Twilio).
   End-to-end round-trips per cluster. The sandbox only proves compile + mount +
   boot; no request has been executed against a real DB. **Still the biggest
   open P1** — everything below is type-sound + boots but unproven at runtime.
7. **JWT lifecycle — DONE (revocation + live role).** `authenticate` is now
   **stateful**: it loads the live `User`, so role/permission changes take effect
   immediately (previously the role came from the 7-day token — a demoted/banned
   user kept old access until expiry, which silently weakened every P0 RBAC
   guard). `tokenVersion` (in the token + on `User`) enables revocation: bumped on
   password change, password reset, and a new `POST /api/auth/logout-all`.
   Backward-compatible (old tokens lack the field → match default 0 until a bump).
   CAVEAT: adds one indexed `findById` per authenticated request; revocation +
   fresh-role behavior compiles + boots but needs a live-DB request to confirm.
   Refresh-token *rotation* (vs the current re-sign `/refresh`) + re-confirming
   the socket `userId` spoofing fix remain.
8. **Audit logging — DONE (enforced).** The `auditLog` middleware
   (`middleware/audit.ts`) + `AuditLog` model (proper indexes, 1-year TTL) already
   existed but were **never wired**. Now applied selectively in server.ts to the
   sensitive surfaces — auth events; all law-enforcement/police/criminal routes;
   admin/super-admin/dashboards; biometric (`selfie-capture`) + minor tracking
   (`security-enhanced`); telecom PII; device control (`device-locks`,
   `device-transfers`); `regulatory`; `gdpr`; and access to the audit log itself
   (`audit-logs`). It records actor/role, action, resource(+id), method, path, IP,
   user-agent, status, and success — **including denied 401/403 attempts** — and
   writes async (non-blocking). High-volume/low-sensitivity paths (`/track`,
   `/imei`, `/ai`, marketplace) are deliberately excluded. Read/export of the trail
   is `requireAdmin` (now incl. super_admin). CAVEATS: writes via `AuditLog.create`
   can only be confirmed against a live DB; only `res.json` responses are captured
   (the norm here); TTL gives auto-retention but the immutability/WORM guarantee
   §9 wants is a storage-layer concern, not enforced in app code; `suspiciousActivity`
   alerting in `logDashboardAccess` is still a TODO (socket emit stub).
9. **Rate limiting / abuse controls — DONE (verify).** Global cap +
   `authLimiter` (`/api/auth`,`/api/verify`), `imeiLimiter`, `trackLimiter`,
   `aiLimiter`, `intelligenceBrokerLimiter` are all defined **and applied**.
   CAVEAT: in-memory store is per-instance — on multi-instance Render, move to a
   Redis-backed store so limits are shared. OTP brute-force is additionally
   bounded by the existing attempt-limit + short TTL.
10. **Input validation coverage** — confirm every route validates body/params
    (zod) and that `strict:false` Mongoose models aren't accepting unexpected
    fields on write paths that matter.

---

## P2 — Codebase health (post-wiring cleanup)

11. **Full-tree type safety.** Build is scoped to the `server.ts` import graph,
    which is honest for "what ships" but hides the rest. Re-scope `tsconfig`
    `include` to `**/*.ts` and work down the ~324 errors in the ~95 unmounted
    infra files: `telemetry/`, `streaming/` (kafka), `workers/`, `queues/`,
    `modules/automation`, `modules/command-center`, `infrastructure/ha`,
    `gateway/`, `routes/v1`, `routes/v2`, `maps/`. Decide per-area: wire, fix,
    or quarantine.
12. **Conflicting global `Request` augmentations** — `modules/audit/middleware.ts`
    and `modules/organizations/middleware.ts` both declare global Express
    `Request` augmentations (TS2430). Reconcile into a single declaration.
13. **Duplicate lock systems** — `lock.ts` (mounted `/api/devices`) vs
    `deviceLock.ts` (`/api/device-locks`); also a duplicate `/api/devices`
    mount. Reconcile to one lock model/flow.
14. **Build/deps** — ensure CI runs full `tsc`; confirm no other missing runtime
    deps (a missing `crypto-js` was already swapped for `node:crypto`); lockfile
    integrity.

---

## P3 — Operational readiness

15. **Env validation at boot** — fail-fast if critical env vars (DB, JWT secret,
    Stripe/PayPal keys, KMS) are missing; never silently degrade auth/crypto.
16. **Observability** — Sentry `onRequestError` hook is in place; add structured
    request logging + the `/api/health/integrations` endpoint to monitoring.
17. **Credential hygiene** — the old hardcoded demo passwords (`Admin@2024!`
    etc.) remain in **git history**; rotate/scrub before the repo is shared
    beyond the trusted circle. Seed script is already env-driven + production-
    guarded.
18. **Infra-as-code** — `terraform/`, `kubernetes/`, `monitoring/`, `runbooks/`
    review for parity with the deployed Render/Vercel setup.

---

## Suggested execution order
1. IDOR ownership checks (P0.1) + `requireAdmin`/super_admin decision — highest
   risk-to-effort ratio, mostly mechanical once the rule is set.
2. Webhook signature verification + idempotency (P0.2) — build against Stripe
   test webhooks.
3. Consent capture + gating (P0.4).
4. KMS for `EncryptedData` (P0.3) in parallel with the legal review (P0.5).
5. Then P1 (live testing, JWT, audit, rate limits), then P2 cleanup.
