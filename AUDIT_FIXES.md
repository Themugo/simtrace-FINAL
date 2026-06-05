# SimTrace — Audit Fixes (P0 / P1 / P2)

This pass addresses the repo audit. Backend verified after changes: `tsc` 0 errors,
4 engines register, 63/63 routes mounted, clean boot.

## P0 — Critical (secret exposure)
- **render.yaml** no longer carries live credentials. `MONGO_URI` and `REDIS_URL`
  are now `sync: false` (set in the Render dashboard, never in the repo).
- **Action still required by you (not code):** rotate the MongoDB user password and
  the Redis password — they were public in git history and must be assumed
  compromised. Update the new values in the Render dashboard + local `backend/.env`.

## P1 — High (deploy config correctness)
- **render.yaml** `ALLOWED_ORIGINS` / `FRONTEND_URL` corrected from the stale
  `https://simtrace.vercel.app` to `https://www.simtrace.site` (+ apex in origins).
  render.yaml is now a valid, secret-free Blueprint.
- **vercel.json** — removed the unused `/api/* → backend` rewrite. The app calls the
  backend directly (`NEXT_PUBLIC_API_URL`) and Socket.IO connects directly over WSS
  (Vercel cannot proxy WebSockets), so CORS via `ALLOWED_ORIGINS` is required either
  way. Keeping everything direct is consistent; the dead rewrite is removed.

## P2 — Done (safe hygiene)
- Removed `backend/_quarantine/` (90 dead files, confirmed not imported anywhere).
- Consolidated env templates to two canonical files: root `.env.example`
  (frontend + docker-compose) and `backend/.env.example` (backend service).
  Deleted the redundant `env.example` and `env.production.template`.

## P2 — Deferred on purpose (NOT changed blindly — would risk breakage)
These need careful, tested work rather than a bulk sweep:
- **~1,870 `as any` casts** in the backend. Erodes type safety (the OTel drift that
  hung startup was one symptom). Tighten gradually, module by module, with tests.
- **tsconfig `include: ["server.ts"]`** is intentional — the build type-checks the
  shipping import graph, which is why `tsc` is 0. Widening it surfaces ~900 errors in
  unmounted/dead files and would break the build. Recommend a separate, non-blocking
  `typecheck:all` script for visibility instead of changing the build gate.
- **~79 `console.log`** in backend (outside scripts) — migrate to the pino logger for
  structured production logs.
- **CSP `'unsafe-inline'` / `'unsafe-eval'`** in `vercel.json` — removing these can
  break Next.js inline scripts/styles and Stripe; needs nonce/hash migration + testing.
- **~67 TODO/FIXME/HACK** markers — triage into tracked issues.
