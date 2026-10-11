#!/usr/bin/env node
/**
 * ARTI AI — typography policy check.
 *
 * RONALDSON GOTHIC IS THE PERMANENT DEFAULT TYPEFACE FOR ALL ARTI AI UI.
 *
 * This check fails when ordinary UI styling declares a font family other than
 * the approved project tokens. Only two exceptions are allowed:
 *   1. Genuine code / mono contexts (declared via the --font-mono token).
 *   2. The single centralized @font-face block in src/styles/typography.css.
 *
 * Run with `npm run check:typography`. Wired into `npm run lint`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN_DIRS = ['src'];
const EXT = /\.(css|tsx|ts|jsx|js|html)$/;

// Font stacks that must never appear (previous / unrelated families).
const FORBIDDEN = /\b(Cinzel|Plus Jakarta Sans|Playfair Display|Inter|Poppins|Montserrat|Roboto|Open Sans|Lato)\b/;

// Allowed absolute font-family targets. Tokens resolve to the single typeface.
const ALLOWED_FAMILY = /^\s*(var\(--font-(primary|sans|serif|mono)\)|inherit|unset|initial|'?Ronaldson Gothic'?|none)\s*$/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXT.test(p)) out.push(p);
  }
  return out;
}

const problems = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    const isTypographySource = rel === 'src/styles/typography.css';
    const lines = readFileSync(file, 'utf8').split('\n');

    lines.forEach((line, i) => {
      // Token definitions legitimately name the font + fallback stack.
      if (/^\s*--font[-a-z]*\s*:/.test(line)) return;

      // CSS font-family declarations.
      const m = line.match(/font-family\s*:\s*([^;]+);?/i);
      if (m) {
        const value = m[1].trim();
        // The @font-face src in the central file is the one legitimate exception.
        if (isTypographySource && /Ronaldson Gothic/.test(value)) return;
        if (!ALLOWED_FAMILY.test(value)) {
          problems.push(`${rel}:${i + 1}  font-family: ${value}`);
        }
      }
      // Inline React style objects.
      const j = line.match(/fontFamily\s*:\s*['"`]([^'"`]+)['"`]/);
      if (j && !ALLOWED_FAMILY.test(j[1])) {
        problems.push(`${rel}:${i + 1}  fontFamily: ${j[1]}`);
      }
    });

    // Forbidden previous families anywhere.
    lines.forEach((line, i) => {
      if (/^\s*--font[-a-z]*\s*:/.test(line)) return;
      const f = line.match(FORBIDDEN);
      if (f) problems.push(`${rel}:${i + 1}  forbidden font family "${f[1]}"`);
    });
  }
}

if (problems.length) {
  console.error('Typography policy violated — Ronaldson Gothic must remain the only UI typeface.\n');
  for (const p of problems) console.error('  ' + p);
  console.error(`\n${problems.length} issue(s). See README "Typography Standard".`);
  process.exit(1);
}

console.log('Typography policy OK — Ronaldson Gothic is the single UI typeface.');
