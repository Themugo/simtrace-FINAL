# SimTrace — Production Readiness Scorecard

**Short answer: not 100/100, and not yet ready to launch to the public.** The code
is in genuinely good shape — but "the code compiles and the security logic is
sound" is a different claim from "this is safe to run a device-theft / police-data
platform on in production." Below is the honest breakdown, scored by category,
with evidence. Use it as the launch gate.

## Scorecard

| Area | Score | Why |
|---|---|---|
| **Shipped-code type safety** | 100/100 | The server.ts import graph compiles at `tsc` 0; all 63 routes mount; boots cleanly (4 engines). |
| **Security hardening (code)** | ~90/100 | P0.1–P0.5 + P1 done: authz/IDOR, webhook verification (Stripe/PayPal), encryption key handling, consent gating, stateful JWT + revocation, rate limiting, audit logging, plus this audit's fixes. Remaining code gaps below. |
| **Runtime verification** | **0/100** | **Nothing has executed against a live DB.** Every result is "type-sound + boots." No login, webhook, query, or write has run against Mongo/Redis. This is the single biggest unknown. |
| **Payments** | ~60/100 | Stripe + PayPal verified + idempotent (need live round-trip). **M-Pesa callback (`/api/billing/mpesa-callback`) is unauthenticated and unverified** — forgeable payment confirmations. Not yet hardened. |
| **Legal / compliance** | **~20/100** | See COMPLIANCE_REVIEW §0: a private entity holding police/court/Interpol records likely needs statutory authority / an MOU. ODPC registration, a DPIA, verifiable child consent, and cross-border safeguards are all outstanding. **These can block launch regardless of code quality.** |
| **Codebase health (full tree)** | ~50/100 | The shipped graph is clean, but the **full tree has 942 `tsc` errors** in unmounted/dead infra (`_quarantine/`, parallel `session.ts`, duplicate modules). It doesn't ship, but it's a maintenance/foot-gun risk. |
| **Operational readiness** | ~40/100 | OTP delivery is a **stub** (dev logs the code) → privileged-dashboard flows can't complete in prod. No verified breach runbook, no WORM audit storage, encryption `ENCRYPTION_KEY` must come from a real KMS. Live site is a **stale deploy** (older than this repo). |
| **Truthful public content** | needs work | Landing page hardcodes testimonials + "Integrated with DCI Kenya" + (now-fixed) fabricated stat fallbacks. Verify or remove before launch (also a §0 legal tie-in). |

## This audit's findings (fixed in this pass)
- **`POST /api/super-admin`** created a SuperAdmin entity with **no auth** → now
  `authenticate, requireRole("super_admin")` (bootstrap the first via the seed).
- **`POST /api/selfie-capture`** injected biometric capture records (image, location,
  userId) with **no auth** → now device-key authenticated (consistent with
  record-attempt / track / lock).

## Must-fix before launch (the launch gate)

**Blocking — legal (not code; get counsel):**
1. Authority to hold police/court/Interpol data (§0) — or stop originating it.
2. ODPC registration; DPIA; verifiable parental consent; cross-border safeguards.

**Blocking — engineering/ops:**
3. **Run the live-DB smoke test pass** (see TESTING_GUIDE §4) — until then, "works"
   is unproven. This is the prerequisite for trusting everything else.
4. ~~Harden the M-Pesa callback~~ **DONE** — `processMpesaCallback` now confirms the
   transaction with Safaricom via `queryMpesaSTK` before crediting (fail-closed in
   prod) and is idempotent (no double-credit on retries). Needs a live round-trip
   to confirm against real Daraja.
5. ~~Wire real OTP/email delivery~~ **DONE** — the dashboard OTP / official-email /
   password-reset flows now send via the existing `sendEmail` (SendGrid) and
   `sendSMS` (Africa's Talking) helpers, with a dev-log fallback only when the
   provider is unconfigured. **Set `SENDGRID_API_KEY` (+ `FROM_EMAIL`) and
   `AT_API_KEY`/`AT_USERNAME`/`AT_SENDER_ID` in prod** or delivery silently no-ops.
6. **Provision `ENCRYPTION_KEY` from a KMS** + plan key rotation; re-encrypt any
   legacy `EncryptedData` rows (pre-authTag-fix rows are undecryptable).
7. **Redeploy** frontend (Vercel) + backend (Render) from this repo, then **seed**
   the live DB; verify `NEXT_PUBLIC_API_URL`/CORS so the homepage stats and login
   actually work.

**Strongly recommended before scale:**
8. ~~Verify/replace the DCI-integration claim + testimonials~~ **DONE** — the
   fabricated testimonials and "Integrated with DCI Kenya" claim are replaced with
   an honest "how recovery works" section and a capability description; the
   homepage stats now come from `/api/devices/public-stats` (real or 0), not
   fabricated fallbacks.
9. Move audit logs to immutable/WORM storage; wire breach-response (72h) + the
   `suspiciousActivity` alerting (currently a stub).
10. P2 cleanup: **`_quarantine/` (89 dead files) removed.** Remaining: **hash
    `deviceKey`** everywhere it's used (imei/track/lock/deviceLock/selfieCapture +
    the seed) — currently plaintext, so a DB leak exposes every device credential.
    This is a cross-cutting change to how every device authenticates, so do it as
    its own change *with the live-DB smoke test* (use a backward-compatible
    `hash OR plaintext` lookup so existing devices aren't locked out, then migrate
    legacy rows). Also: the ~942 `tsc` errors live in unmounted files excluded from
    the build (`tsconfig include: server.ts`) — delete or fix them; resolve the
    duplicate lock systems + Request-augmentation conflicts.

## Honest framing
You have a large, feature-rich, and now substantially hardened codebase — the
security *logic* is in good shape and the shipped surface is clean. But three
things genuinely gate a public launch: (a) **it has never run against a real
database**, (b) the **legal authority** question around police data is unresolved,
and (c) **payments (M-Pesa) and OTP delivery** aren't production-safe yet. None of
those are "polish" — they're the difference between a demo that compiles and a
service real people (and law enforcement) would rely on. Close the gate items
above and you're in a defensible position to launch; skipping them to hit a date
is the kind of risk that's very expensive to unwind on a platform handling theft,
biometrics, children's data, and criminal records.
