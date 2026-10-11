#!/usr/bin/env node
/**
 * ARTI AI — typography policy check.
 *
 * The approved type system is Orbitron (brand), Inter (interface) and
 * JetBrains Mono (code/technical). This check fails when ordinary UI styling
 * declares a font family other than the approved project tokens. Exceptions:
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

// Previous / unrelated families that must never (re)appear.
const FORBIDDEN = /\b(Ronaldson Gothic|Cinzel|Plus Jakarta Sans|Playfair Display|Poppins|Montserrat|Roboto|Open Sans|Lato)\b/;

// Allowed absolute font-family targets: the approved tokens (which resolve to
// Orbitron/Inter/JetBrains Mono) plus reset keywords and the @font-face names.
const ALLOWED_FAMILY = /^\s*(var\(--font-(brand|primary|sans|serif|mono)\)|inherit|unset|initial|'?(Orbitron|Inter|JetBrains Mono)'?|none)\s*$/i;

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
        // The @font-face declarations in the central file are the exceptions.
        if (isTypographySource && /^(Orbitron|Inter|JetBrains Mono)/.test(value)) return;
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
  console.error('Typography policy violated — only Orbitron, Inter and JetBrains Mono are approved UI typefaces.\n');
  for (const p of problems) console.error('  ' + p);
  console.error(`\n${problems.length} issue(s). See README "Typography Standard".`);
  process.exit(1);
}

console.log('Typography policy OK — Orbitron / Inter / JetBrains Mono are the approved UI typefaces.');
