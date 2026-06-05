# Spec — Hash `deviceKey` at rest (plaintext → SHA-256), backward-compatible

## Problem & goal
`Device.deviceKey` is stored **plaintext**. It is the credential a device presents
(`X-Device-Key`) to authenticate telemetry/lock/selfie callbacks. A DB leak (or any
read access to the `devices` collection) therefore exposes every device's
credential, letting an attacker lock, unlock, track, or upload "evidence" for any
device. Goal: store only a **SHA-256 hash**; verify by hashing the presented key.

**Key property:** the device keeps using the *same* key it was issued. Only the
server-side *storage* changes (plaintext → hash). **No device needs
re-provisioning**, and a backward-compatible lookup means **no device is ever
locked out** during rollout.

> Out of scope: `DeviceSession.deviceKey` (db/index.ts ~426) is a separate model and
> is **not** used in any auth lookup. Review separately; not part of this change.

## Design
- Hash = `sha256(plaintextKey)` → hex. (The key is 32 random bytes / high entropy,
  so a plain SHA-256 is fine — no salt/bcrypt needed for a 256-bit random secret;
  it also keeps lookups O(1) by indexed hash.)
- Store the hash in a new field `deviceKeyHash` (indexed). Keep the old `deviceKey`
  field **only during transition**, then drop it.
- Every lookup uses a backward-compatible match: **`deviceKeyHash == sha256(key)`
  OR legacy `deviceKey == key`** — so already-stored plaintext keys keep working
  until the migration hashes them.

## New shared helper — `lib/deviceKey.ts` (new file)
```ts
import crypto from "crypto";

/** SHA-256 hex of a device key. Deterministic so we can look up by hash. */
export function hashDeviceKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Mongo match clause for a presented device key. Matches the new hashed form OR a
 * legacy plaintext value, so existing devices keep authenticating until the
 * migration has hashed them. Remove the legacy `deviceKey` branch in Phase 3.
 */
export function deviceKeyMatch(key: string) {
  return { $or: [{ deviceKeyHash: hashDeviceKey(key) }, { deviceKey: key }] };
}
```

## Exact change set (Phase 1 — deploy backward-compatible code)

**1. `db/index.ts` — add the field to the main Device model**
- IDevice (near line 78): add `deviceKeyHash?: string;`
- deviceSchema (near line 94): after the `deviceKey` line add
  `deviceKeyHash: { type: String, index: true, sparse: true },`
- Leave `deviceKey` in place for now.

**2. `routes/imei.ts` (mint site, lines 65–71)** — store hash, never persist plaintext
```ts
import { hashDeviceKey } from "../lib/deviceKey.js";
// ...
const deviceKey = crypto.randomBytes(32).toString("hex");                 // plaintext, returned ONCE
const device = await Device.create({
  ...data, owner: req.user!.id, status: "active",
  deviceKeyHash: hashDeviceKey(deviceKey),                                // store hash only
});
// response still returns `deviceKey` (the plaintext) once, as today.
```

**3. `routes/track.ts` (deviceKeyAuth, lines 34–41)**
```ts
import { hashDeviceKey } from "../lib/deviceKey.js";
// ...
const device = await Device.findOne({ imei }).select("deviceKey deviceKeyHash").lean();
if (!device?.deviceKey && !device?.deviceKeyHash) {
  return res.status(401).json({ error: "Device not provisioned with a key" });
}
const ok = (device.deviceKeyHash && device.deviceKeyHash === hashDeviceKey(key))
        || device.deviceKey === key;                                      // legacy
if (!ok) return res.status(401).json({ error: "Invalid device key" });
```

**4. `routes/lock.ts` (lines 69 and 83)** — both occurrences
```ts
import { deviceKeyMatch } from "../lib/deviceKey.js";
// ...
const device = await Device.findOne({ _id: req.params.id, ...deviceKeyMatch(deviceKey) });
```

**5. `routes/deviceLock.ts` (line 67, the `requireDeviceKeyForLock` guard)**
```ts
import { deviceKeyMatch } from "../lib/deviceKey.js";
// ...
const device = await Device.findOne({ _id: (lock as any).deviceId, ...deviceKeyMatch(key) })
  .select("_id").lean();
```

**6. `routes/selfieCapture.ts` (line 43, the `requireDeviceKeyForCapture` guard)**
```ts
import { deviceKeyMatch } from "../lib/deviceKey.js";
// ...
const device = await Device.findOne({ ...deviceKeyMatch(key) }).select("_id imei").lean();
```

**7. `scripts/seed-demo.ts` (lines 163–166)** — seed stores the hash
```ts
import { hashDeviceKey } from "../lib/deviceKey.js"; // or inline sha256 (seed uses inline models)
const deviceKey = crypto.randomBytes(32).toString("hex");
await Device.create({ ...d, lastSeen: ..., deviceKeyHash: hashDeviceKey(deviceKey) });
// (optional) push `${d.imei}=${deviceKey}` into the printed creds so you can test device auth.
```
> Note: the seed defines models inline. Either import the helper or inline
> `crypto.createHash("sha256").update(deviceKey).digest("hex")`, and add
> `deviceKeyHash: String` to the inline Device schema.

**8. `scripts/optimizeIndexes.ts` (line 14)** — index the new field
```ts
await Device.collection.createIndex({ deviceKeyHash: 1 }, { sparse: true });
```

After Phase 1: `npx tsc --noEmit` (shipped graph) must be 0; boot clean; deploy.
New devices are hashed; existing plaintext devices still authenticate via the
legacy branch.

## Phase 2 — migrate existing rows (`scripts/migrate-device-keys.ts`, new)
Run once, after Phase 1 is deployed:
```ts
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/simtrace");
const Device = mongoose.connection.collection("devices");

const cursor = Device.find({ deviceKey: { $exists: true, $ne: null }, deviceKeyHash: { $exists: false } });
let migrated = 0;
for await (const d of cursor) {
  await Device.updateOne(
    { _id: d._id },
    { $set: { deviceKeyHash: sha256(d.deviceKey) }, $unset: { deviceKey: "" } }
  );
  migrated++;
}
console.log(`Migrated ${migrated} device keys to hashes (plaintext removed).`);
await mongoose.disconnect();
```
The device's stored key is unchanged — it still presents the same plaintext, which
now matches via `deviceKeyHash`. After this runs, `deviceKey` is gone from every row.

## Phase 3 — drop the legacy branch (after Phase 2 verified)
- `lib/deviceKey.ts`: change `deviceKeyMatch` to `{ deviceKeyHash: hashDeviceKey(key) }`
  (remove the `$or`/legacy branch); in `track.ts` drop the `|| device.deviceKey === key`
  and stop selecting `deviceKey`.
- `db/index.ts`: remove the `deviceKey` field from IDevice + deviceSchema.
- `scripts/optimizeIndexes.ts`: drop the old `deviceKey` index.
- Re-run `tsc`/boot; deploy.

## Test plan (live DB — this is why it isn't shipped blind)
Phase 1 (backward-compat deployed, before migration):
1. **Legacy device still works:** existing device pings `/api/track` with its
   current key → 200. (proves no lockout)
2. **New device hashed:** `POST /api/imei/register` → returns `deviceKey` once;
   in DB that device has `deviceKeyHash` set and **no** `deviceKey`. Ping with the
   returned key → 200; in the DB the plaintext was never stored.
3. **Wrong key:** ping with a bad key → 401 on track, lock, deviceLock, selfie.
4. Repeat 1–3 for `/api/lock`, `/api/device-locks/:id/record-attempt`,
   `/api/selfie-capture`.

Phase 2 (after migration):
5. The legacy device from (1): DB row now has `deviceKeyHash`, no `deviceKey`;
   the device still authenticates with its unchanged key → 200.
6. `db.devices.countDocuments({ deviceKey: { $exists: true } })` → **0**.

Phase 3 (after legacy branch removed):
7. All devices authenticate via hash; a row manually given a plaintext `deviceKey`
   would **not** authenticate (legacy path gone).

## Rollback
- Phase 1 is additive (new field + `$or`); revert the commit to roll back — existing
  plaintext rows are untouched and keep working.
- **Do not roll back code to before Phase 1 after Phase 2 has run** — once plaintext
  is removed, old code that matches only `{ deviceKey }` would lock out every device.
  If you must, restore from the pre-migration DB backup. (Take a `devices` backup
  before Phase 2.)

## Touch-point checklist
- [ ] `lib/deviceKey.ts` (new)
- [ ] `db/index.ts` — IDevice + deviceSchema `deviceKeyHash`
- [ ] `routes/imei.ts` — mint stores hash
- [ ] `routes/track.ts` — hash-or-legacy compare
- [ ] `routes/lock.ts` — ×2 lookups
- [ ] `routes/deviceLock.ts` — `requireDeviceKeyForLock`
- [ ] `routes/selfieCapture.ts` — `requireDeviceKeyForCapture`
- [ ] `scripts/seed-demo.ts` — seed stores hash
- [ ] `scripts/optimizeIndexes.ts` — index `deviceKeyHash`
- [ ] `scripts/migrate-device-keys.ts` (new, Phase 2)
- [ ] Phase 3 cleanup (remove legacy branch + `deviceKey` field)
