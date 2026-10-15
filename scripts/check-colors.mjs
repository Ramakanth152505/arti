#!/usr/bin/env node
/**
 * ARTI AI — strict three-colour audit.
 *
 * Scans every source file for explicit colour declarations and fails if any
 * value outside the approved palette is found.
 *
 *   Navy        #1F2A44  rgb(31, 42, 68)
 *   Warm Beige  #E8DCC8  rgb(232, 220, 200)
 *   Soft Gold   #C6A75E  rgb(198, 167, 94)
 *
 * Alpha is allowed (rgba / 8-digit hex) so the three colours can build
 * hierarchy, but the RGB triplet must always be one of the three.
 *
 * `transparent`, `currentColor`, `inherit` and `none` are keywords, not
 * colours, and are permitted.
 *
 * It deliberately ignores numbers, identifiers and prose: only real colour
 * literals (hex, rgb/rgba, hsl/hsla) and named CSS colours in value position
 * are reported.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src'];
const SCAN_FILES = ['index.html'];
const EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.js', '.mjs', '.html', '.svg']);

const APPROVED = new Map([
  ['#1F2A44', 'Navy'],
  ['#E8DCC8', 'Warm Beige'],
  ['#C6A75E', 'Soft Gold'],
]);

const APPROVED_RGB = new Map([
  ['31,42,68', 'Navy'],
  ['232,220,200', 'Warm Beige'],
  ['198,167,94', 'Soft Gold'],
]);

// Named CSS colours that must never appear in a value position.
const NAMED_COLOURS =
  /\b(?:white|black|red|green|blue|gray|grey|orange|purple|pink|cyan|teal|magenta|yellow|silver|maroon|navy|lime|aqua|fuchsia|olive|brown|gold|beige|coral|salmon|khaki|indigo|violet|turquoise|lavender|crimson|tomato|orchid|plum|azure|ivory|chocolate|peru|sienna|tan|wheat|linen|snow|seashell|honeydew|mintcream|aliceblue|ghostwhite)\b/gi;

const HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const RGB_RE = /\brgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)\s*(?:[,/]\s*[0-9.%]+\s*)?\)/gi;
const HSL_RE = /\bhsla?\(/gi;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(extname(name))) out.push(full);
  }
  return out;
}

/** Blank out comments (preserving line structure) so prose is never scanned. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

function normalizeHex(h) {
  if (h.length === 3) return '#' + [...h].map((c) => c + c).join('').toUpperCase();
  if (h.length === 4) return '#' + [...h.slice(0, 3)].map((c) => c + c).join('').toUpperCase();
  if (h.length === 6) return '#' + h.toUpperCase();
  if (h.length === 8) return '#' + h.slice(0, 6).toUpperCase();
  return null;
}

const violations = [];
const files = [
  ...SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...SCAN_FILES.map((f) => join(ROOT, f)),
];

for (const file of files) {
  const rel = file.replace(ROOT + '/', '');
  const ext = extname(file);
  const isCssLike = ext === '.css' || ext === '.html' || ext === '.svg';
  const raw = readFileSync(file, 'utf8');
  const lines = stripComments(raw).split('\n');

  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;

    for (const m of line.matchAll(HEX_RE)) {
      const norm = normalizeHex(m[1]);
      if (norm && !APPROVED.has(norm)) {
        violations.push(`${where}  hex ${m[0]} (${norm}) is not in the approved palette`);
      }
    }

    for (const m of line.matchAll(RGB_RE)) {
      const key = [m[1], m[2], m[3]]
        .map((n) => String(Math.round(parseFloat(n))))
        .join(',');
      if (!APPROVED_RGB.has(key)) {
        violations.push(`${where}  rgb(${key}) is not in the approved palette`);
      }
    }

    for (const _ of line.matchAll(HSL_RE)) {
      violations.push(`${where}  hsl() colours are not permitted — use navy, beige or gold`);
    }

    // Named colours only in real CSS value positions (property: <colour>;).
    if (isCssLike) {
      for (const m of line.matchAll(/:\s*([a-zA-Z]{3,20})\s*(?:[;}]|$)/g)) {
        const token = m[1];
        NAMED_COLOURS.lastIndex = 0;
        if (
          NAMED_COLOURS.test(token) &&
          !['none', 'transparent', 'inherit', 'currentColor'].includes(token)
        ) {
          violations.push(`${where}  named colour "${token}" is not permitted`);
        }
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✗ Colour audit failed — ${violations.length} unauthorised colour declaration(s):\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nOnly #1F2A44 (Navy), #E8DCC8 (Warm Beige) and #C6A75E (Soft Gold) are permitted.\n');
  process.exit(1);
}

console.log(
  `Colour policy OK — only Navy #1F2A44, Warm Beige #E8DCC8 and Soft Gold #C6A75E are declared across ${files.length} source files.`
);
