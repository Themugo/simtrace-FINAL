# SimTrace — Feature Wiring Roadmap

Turning the ~34 scaffolded-but-unmounted feature routes into shipped, type-safe,
reachable endpoints. The service logic already exists for all of them; what's
missing is the **data models** (and a handful of `req.params` type fixes per
route). This roadmap sequences that work into 6 clusters by **shared models**,
so building one cluster's models unlocks several routes at once.

## Status

- **Mounted & green:** 30 routes (core 23 + insurance, blockchain, cross-border,
  device-DNA, financials, recovery, gdpr).
- **Remaining:** 32 routes across clusters 1–6 below.
- **Models still to build:** ~64 unique Mongoose models.
- **Build gate:** `backend tsc` stays at **0** for the shipped graph throughout;
  each cluster only joins the build once it compiles and boots.

## Standard per-cluster workflow (proven on the 6 + GDPR)

1. Read each service's `.create({...})` / field usage to derive the schema shape.
2. Define the cluster's models in `backend/db/index.ts` (typed core fields +
   indexes; `strict:false`+`timestamps` safety net for evolving shapes — except
   legally sensitive models, which get strict typed schemas).
3. Mount the route(s) in `backend/server.ts`.
4. Fix the type errors mounting surfaces (mostly `String(req.params.x)` coercion,
   optional→required arg defaults, `Date` casts).
5. Verify: `backend tsc` = 0 (shipped graph) and the server boots clean.
6. Commit as one cluster patch; confirm the matching frontend page(s) resolve.

**Definition of done (per cluster):** routes mounted, models defined, tsc 0,
boots clean, frontend pages stop 404ing, one reviewable commit/patch.

---

## Cluster 1 — Device control  ·  *next, quick, high-value*

The heart of theft recovery: remotely lock a stolen phone, track ownership transfer.

| Route | Models to build |
|---|---|
| `deviceLock` | `DeviceLock` |
| `deviceTransfer` | `DeviceTransfer` |

- **Models:** 2 · **Risk:** low · **Effort:** ~1 short session.
- **Watch:** a `lockRoutes` is already mounted on `/api/devices/:id/*` — confirm
  `deviceLock` doesn't duplicate it; mount under a distinct path or merge.

## Cluster 2 — Law enforcement / police  ·  *product-critical, careful*

| Route | Models (cluster union, 17) |
|---|---|
| `lawEnforcement` | `PoliceReport`, `CourtCase`, `InterpolCase`, `LawEnforcementAgency`, `LawEnforcementDashboard`, `PoliceHierarchy` |
| `policeIntegration` | `CaseTransfer`, `CourtCase`, `InterpolCase`, `NationwideAlert`, `PoliceReport`, `PoliceStation`, `RecoveryWorkflow` |
| `policeHierarchy` | `PoliceHierarchy`, `PoliceReport`, `PoliceRole`, `PoliceUserAssignment`, `SeniorConfirmation`, `CooperationAlert`, `MissingPersonRule`, `DataAccessControl`, `EncryptedData` |
| `lawEnforcementDashboard` | `LawEnforcementAgency`, `LawEnforcementDashboard` |

- **Models:** 17 · **Risk:** HIGH (legal/evidence) · **Effort:** largest cluster.
- **Design rules:** strict typed schemas (no loose stubs). Every model carries
  `createdAt`/`createdBy` and immutable audit trails for chain-of-custody.
- **⚠ Needs review before production:** `EncryptedData` (encryption-at-rest
  scheme + key management), `DataAccessControl` (who-can-see-what enforcement),
  `PoliceReport`/`CourtCase` (retention + lawful-access rules). Flag for someone
  with Kenyan data-protection / criminal-procedure expertise.
- **Dependency:** pairs with the standalone authZ/audit-logging work (ensure the
  `audit` module records every access to these records).

## Cluster 3 — Telecom integration

| Route | Models (union, 6) |
|---|---|
| `telecomCompany` | `TelecomCompany`, `TelecomDashboard`, `SimCardTracking`, `NetworkActivity`, `CellTower` |
| `telecomDashboard` | `TelecomCompany`, `TelecomDashboard` |
| `telecomIntegration` | `TelecomCompany`, `SimCardTracking`, `NetworkActivity` |
| `cellTower` | `SatellitePing` |

- **Models:** 6 · **Risk:** medium · **Effort:** medium.
- **Unlocks:** carrier onboarding, SIM-swap/network tracking, cell-tower
  triangulation — strong synergy with the core tracking engine.
- **Note:** `SatellitePing` is shared with Cluster 5 — build it here first.

## Cluster 4 — Admin / super-admin

| Route | Models (union, 14) |
|---|---|
| `adminDashboard` | `Admin`, `AdminDashboard` |
| `adminManagement` | `Admin`, `SuperAdmin` |
| `adminRole` | `AdminRolePermission` |
| `superAdmin` | `Admin`, `SuperAdmin`, `OfficialEmail`, `SecurityOtp` |
| `superAdminDashboard` | `Admin`, `SuperAdmin`, `SuperAdminDashboard` |
| `dashboardSecurity` | `DashboardAccessLog`, `MinisterDashboard`, `NetworkChangeRequest`, `OfficialEmail`, `PasswordResetRequest`, `PoliceGeneralDashboard`, `SecurityOtp`, `StationAdminDashboard`, `UserDashboard` |

- **Models:** 14 · **Risk:** medium-high (privileged access) · **Effort:** medium.
- **Shared:** `OfficialEmail`, `SecurityOtp` are reused in Cluster 6 — build once here.
- **Security:** enforce role checks + step-up auth (`SecurityOtp`) on every
  privileged action; rate-limit; audit-log.

## Cluster 5 — Safety & family

| Route | Models (union, 8 new) |
|---|---|
| `securityEnhanced` | `Guardian`, `PanicMode`, `ParentChild`, `NearbyDeviceDetection`, `SatellitePing`* |
| `selfieCapture` | `SelfieCapture`, `ThiefReport` |
| `predictiveAnalytics` | `AnomalyDetection`, `RiskPrediction` |

- **Models:** 8 (+`SatellitePing`* from Cluster 3) · **Risk:** medium · **Effort:** medium.
- **⚠ Child-safety sensitivity:** `ParentChild`/`Guardian` involve minors — handle
  consent, minimal data, and access restrictions deliberately. `selfieCapture`
  (capturing a suspected thief's photo) has its own privacy/legal implications.

## Cluster 6 — Commercial

| Route | Models |
|---|---|
| `stripeEnhanced` | *(ready — 0 models, wire first)* |
| `reseller` | `Reseller` |
| `sellerReseller` | `SellerReseller`, `DeviceRegistration`, `OfficialEmail`*, `SecurityOtp`* |
| `partnerMarketplace` | `PartnerListing` |
| `repairShop` | `RepairShop`, `RepairRecord`, `OfficialEmail`*, `SecurityOtp`* |
| `whiteLabel` / `adsEnhanced` | `WhiteLabelInstance` |
| `paypal` | `PayPalPayment` |
| `rewards` | `RecoveryReward` |
| `publicApi` | `PublicApiKey` |
| `webhooks` | `WebhookSubscription`, `WebhookDeliveryLog` |
| `enterprise` | `DeviceFleet` |
| `regulatory` | `RegulatoryBlock` |
| `configurationManagement` | `AgencyConfig`, `CountryConfig`, `PolicyRule` |

- **Models:** ~17 new · **Risk:** low-medium · **Effort:** large but parallelizable.
- **Start with** `stripeEnhanced` (0 models) for an immediate win.
- **Note:** `paypal` payments + `publicApi`/`webhooks` need the same idempotency
  and key-security care flagged in the earlier audit.

---

## Cross-cutting tracks (run alongside, not in the clusters)

1. **Quarantine the unfinished infra** — `telemetry/`, `streaming/kafka`,
   `routes/v1/*`, `routes/v2/*`, `modules/automation`, `modules/command-center`,
   `infrastructure/ha`, `workers/`, `queues/`. These hold most of the ~324
   full-tree type errors and ship nothing today. Move to `_quarantine/` (or fix +
   wire deliberately) so a full-tree build can eventually go green.
2. **Resolve the global-type conflict** — `modules/audit/middleware.ts` and
   `modules/organizations/middleware.ts` declare conflicting Express `Request`
   augmentations (the `TS2430 AuthRequest` errors). Reconcile to a single
   augmentation before wiring anything that imports them.
3. **Security & compliance baseline** (gates Cluster 2 for production): authZ/IDOR
   review, JWT refresh/revocation, audit logging on sensitive reads, encryption-
   at-rest for `EncryptedData`, and a data-retention policy.

## Suggested sequence

`stripeEnhanced` (free win) → **C1 Device control** → **C3 Telecom** (feeds the
tracking engine) → **C4 Admin** (build shared `OfficialEmail`/`SecurityOtp`) →
**C2 Law enforcement** (with legal review running in parallel) → **C5 Safety/family**
→ **C6 Commercial remainder**. Infra quarantine (track 1) can happen anytime.

## Progress checklist

- [x] Core (23) + insurance, blockchain, cross-border, device-DNA, financials, recovery, gdpr — **mounted, green**
- [ ] C1 Device control — `deviceLock`, `deviceTransfer`
- [ ] C2 Law enforcement — `lawEnforcement`, `policeIntegration`, `policeHierarchy`, `lawEnforcementDashboard`
- [ ] C3 Telecom — `telecomCompany`, `telecomDashboard`, `telecomIntegration`, `cellTower`
- [ ] C4 Admin — `adminDashboard`, `adminManagement`, `adminRole`, `superAdmin`, `superAdminDashboard`, `dashboardSecurity`
- [ ] C5 Safety & family — `securityEnhanced`, `selfieCapture`, `predictiveAnalytics`
- [ ] C6 Commercial — `stripeEnhanced`, `reseller`, `sellerReseller`, `partnerMarketplace`, `repairShop`, `whiteLabel`, `adsEnhanced`, `paypal`, `rewards`, `publicApi`, `webhooks`, `enterprise`, `regulatory`, `configurationManagement`
- [ ] Track 1 — quarantine/fix unfinished infra
- [ ] Track 2 — resolve global `Request` augmentation conflict
- [ ] Track 3 — security & compliance baseline (gates C2 production)
