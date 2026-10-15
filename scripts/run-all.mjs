#!/usr/bin/env node
/**
 * ARTI AI — full verification runner.
 *
 * Runs every headless-Chromium suite in sequence, forwarding one base URL to
 * each (npm's `run a && run b -- url` only forwards the argument to the last
 * command, which is why this runner exists).
 *
 * Usage: node scripts/run-all.mjs [baseUrl]
 */
import { spawnSync } from 'node:child_process';

const BASE = process.argv[2] || 'http://localhost:12000';

const SUITES = [
  ['overflow-scan.mjs', 'Responsive overflow scan'],
  ['verify-games.mjs', 'Games suite'],
  ['verify-images.mjs', 'Images suite'],
  ['verify-videos.mjs', 'Videos suite'],
  ['verify-music.mjs', 'Music suite'],
  ['verify-redesign.mjs', 'Redesign guard'],
  ['verify-palette.mjs', 'Runtime palette audit'],
];

let failed = 0;
for (const [script, label] of SUITES) {
  console.log(`\n──────── ${label} (${script}) ────────`);
  const r = spawnSync('node', [`scripts/${script}`, BASE], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

console.log(`\n${failed === 0 ? '✅ All suites passed.' : `❌ ${failed} suite(s) failed.`}`);
process.exitCode = failed === 0 ? 0 : 1;
