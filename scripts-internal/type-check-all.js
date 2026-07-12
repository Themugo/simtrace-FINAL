#!/usr/bin/env node
/**
 * Workspace-wide TypeScript type-check orchestrator.
 *
 * Runs every project's type-check, continuing past failures so a single
 * invocation shows the complete picture across the whole workspace rather
 * than stopping at the first error. Prints a per-project summary and exits
 * non-zero if any project failed.
 *
 * Usage: npm run type-check:all   (from the repo root)
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Order matters for the composite (tsc -b) projects: packages/types has no
// internal deps and must build first so backend can resolve its declarations.
const steps = [
  { name: "packages/types",      cmd: "npx tsc -b packages/types" },
  { name: "backend (build)",     cmd: "npx tsc -b backend" },
  { name: "backend (tests)",     cmd: "npx tsc -p backend/tsconfig.test.json --noEmit" },
  { name: "backend (smoke test)", cmd: "node scripts-internal/smoke-test-backend.js" },
  { name: "frontend",            cmd: "npx tsc --noEmit" },
  { name: "frontend (tests)",    cmd: "npx tsc -p tsconfig.test.json --noEmit" },
  { name: "mobile",              cmd: "npx tsc -p mobile/tsconfig.json --noEmit" },
  { name: "e2e",                 cmd: "npx tsc -p e2e/tsconfig.json --noEmit" },
  { name: "scripts",             cmd: "npx tsc -p scripts/tsconfig.json --noEmit" },
];

const results = [];

for (const step of steps) {
  process.stdout.write(`\n\u2192 Type-checking ${step.name}...\n`);
  const start = Date.now();
  try {
    execSync(step.cmd, { cwd: root, stdio: "inherit" });
    results.push({ name: step.name, ok: true, ms: Date.now() - start });
  } catch {
    results.push({ name: step.name, ok: false, ms: Date.now() - start });
  }
}

const nameWidth = Math.max(...results.map(r => r.name.length)) + 2;
console.log("\n" + "=".repeat(nameWidth + 20));
console.log("Workspace type-check summary");
console.log("=".repeat(nameWidth + 20));
for (const r of results) {
  const status = r.ok ? "PASS" : "FAIL";
  console.log(`${r.ok ? "\u2713" : "\u2717"} ${status.padEnd(5)} ${r.name.padEnd(nameWidth)} (${r.ms}ms)`);
}
console.log("=".repeat(nameWidth + 20));

const failed = results.filter(r => !r.ok);
if (failed.length > 0) {
  console.log(`\n${failed.length} of ${results.length} project(s) failed type-checking.\n`);
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} projects passed type-checking.\n`);
  process.exit(0);
}
