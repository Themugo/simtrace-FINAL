#!/usr/bin/env node
/**
 * Backend module-load smoke test.
 *
 * tsc only checks types — it does not verify that every imported package is
 * actually installed (especially under moduleResolution: "bundler", which is
 * more lenient about this than Node's real runtime resolution), and it does
 * not catch module-scope ordering bugs like a const referenced before its
 * declaration further down in the same file (a real ReferenceError at
 * runtime, not a type error). This script actually imports server.ts in a
 * real process and confirms it doesn't throw during module load.
 *
 * It does NOT start the HTTP server or require a real database/Redis — it
 * only confirms every module in the import graph loads without crashing.
 * Connection errors to Mongo/Redis printed during this run are expected and
 * harmless; the import either resolves (pass) or throws (fail).
 *
 * Usage: npm run smoke-test:backend   (from the repo root)
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const backendDir = path.resolve(__dirname, "..", "backend");
const harness = path.join(backendDir, ".smoke-test-harness.mjs");

const harnessSource = `
process.env.JWT_SECRET ||= 'smoke-test-secret';
process.env.MONGO_URI ||= 'mongodb://placeholder-smoke-test/db';
process.env.NODE_ENV ||= 'test';

// Give any fire-and-forget connection attempts (Redis, Mongo) a moment to
// fail quietly in the background, then exit. We only care whether the
// import itself throws synchronously/via a rejected top-level await.
try {
  await import('./server.ts');
  console.log('SMOKE_TEST_RESULT: PASS');
  setTimeout(() => process.exit(0), 500);
} catch (e) {
  console.error('SMOKE_TEST_RESULT: FAIL —', e.message);
  process.exit(1);
}
`;

fs.writeFileSync(harness, harnessSource);

console.log("→ Running backend module-load smoke test...\n");
const result = spawnSync("npx", ["tsx", ".smoke-test-harness.mjs"], {
  cwd: backendDir,
  encoding: "utf-8",
  timeout: 15000,
});

fs.unlinkSync(harness);

const output = (result.stdout || "") + (result.stderr || "");
console.log(output);

if (output.includes("SMOKE_TEST_RESULT: PASS")) {
  console.log("\n✓ PASS — backend loads without crashing.\n");
  process.exit(0);
} else {
  console.log("\n✗ FAIL — backend crashed during module load. See output above.\n");
  process.exit(1);
}
