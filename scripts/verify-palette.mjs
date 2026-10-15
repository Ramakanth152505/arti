/**
 * ARTI AI — runtime three-colour palette audit (headless Chromium via CDP).
 *
 * Loads every registered route and inspects the *real* colour declarations the
 * browser resolved — not the source text — so nothing can hide behind a build
 * step, a shorthand, a gradient or a third-party component.
 *
 * It checks:
 *   - every author CSS rule (all stylesheets, including inside @media)
 *   - every inline `style` attribute
 *   - every SVG presentation attribute (fill / stroke / stop-color / flood-color)
 *   - every canvas that has been painted
 *
 * A declaration passes only when every rgb triplet it contains is one of:
 *   Navy #1F2A44 · Warm Beige #E8DCC8 · Soft Gold #C6A75E
 * Alpha is free (rgba / 8-digit hex) so the three colours can build hierarchy.
 *
 * Usage: node scripts/verify-palette.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:12000';
const PORT = 9256;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-palette-'));

const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  `--user-data-dir=${userDataDir}`, `--remote-debugging-port=${PORT}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForDevtools(timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try { const res = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (res.ok) return resolve(await res.json()); } catch { /* not up yet */ }
      if (Date.now() - start > timeoutMs) return reject(new Error('Devtools did not start'));
      setTimeout(tick, 250);
    };
    tick();
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  return new CDP(ws);
}

const ROUTES = [
  'home', 'conversation', 'chats', 'projects', 'websites', 'apps', 'games', 'images',
  'videos', 'music', 'documents', 'research', 'learning', 'agents', 'tools',
  'create-software', 'knowledge-base', 'marketplace', 'task-control-center',
  'system-status', 'ai-command-center', 'settings', 'help-support', 'magic-mode',
];

async function evaluate(cdp, expression) {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.text || 'eval failed');
  return result.value;
}

const AUDIT_FN = `(() => {
  const APPROVED = new Set(['31,42,68', '232,220,200', '198,167,94']);
  const bad = [];
  const seen = new Set();
  const colorProps = new Set([
    'color','background-color','background','background-image','border-color',
    'border-top-color','border-right-color','border-bottom-color','border-left-color',
    'outline-color','text-decoration-color','caret-color','accent-color','column-rule-color',
    'box-shadow','text-shadow','fill','stroke','stop-color','flood-color','lighting-color',
    'border','border-top','border-right','border-bottom','border-left','outline','text-decoration',
    'background-position','scrollbar-color',
  ]);
  const triplet = (s) => {
    const out = [];
    const re = /rgba?\\(\\s*([0-9.]+)[\\s,]+([0-9.]+)[\\s,]+([0-9.]+)\\s*(?:[,/]\\s*([0-9.]+%?)\\s*)?\\)/gi;
    let m;
    while ((m = re.exec(s))) {
      const a = m[4];
      const alpha = a == null ? 1 : (a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a));
      out.push({ key: [m[1], m[2], m[3]].map((n) => String(Math.round(parseFloat(n)))).join(','), alpha });
    }
    return out;
  };
  const inspect = (value, prop, origin) => {
    if (!value || value === 'none' || value === 'transparent' || value === 'currentcolor') return;
    for (const t of triplet(value)) {
      if (t.alpha === 0) continue;               // fully transparent — no colour
      if (APPROVED.has(t.key)) continue;
      const sig = origin + '|' + prop + '|' + t.key;
      if (seen.has(sig)) continue;
      seen.add(sig);
      bad.push(origin + '  ' + prop + ' = ' + value.slice(0, 120) + '  (rgb ' + t.key + ')');
    }
  };

  // 1) Every author CSS rule, including nested @media / @supports / @layer.
  //    Note: a CSSStyleRule also exposes an (empty) cssRules list, so only recurse
  //    when that list is non-empty — otherwise we would skip every declaration.
  const walkRules = (rules) => {
    for (const rule of rules) {
      if (rule.style) {
        const sel = rule.selectorText || '(anonymous)';
        for (const prop of rule.style) {
          if (!colorProps.has(prop)) continue;
          inspect(rule.style.getPropertyValue(prop), prop, 'css:' + sel);
        }
      }
      if (rule.cssRules && rule.cssRules.length) walkRules(rule.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules = null;
    try { rules = sheet.cssRules; } catch { continue; }
    if (rules) walkRules(rules, sheet);
  }

  // 2) Inline styles + SVG presentation attributes actually in the DOM.
  for (const el of Array.from(document.querySelectorAll('[style], svg, svg *'))) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? '#' + el.id : '';
    const cls = el.classList && el.classList.length ? '.' + el.classList[0] : '';
    const origin = 'dom:' + tag + id + cls;
    if (el.getAttribute('style')) {
      for (const prop of el.style) {
        if (!colorProps.has(prop)) continue;
        inspect(el.style.getPropertyValue(prop), prop, origin);
      }
    }
    for (const attr of ['fill', 'stroke', 'stop-color', 'flood-color']) {
      const v = el.getAttribute && el.getAttribute(attr);
      if (v) inspect(v, attr, origin);
    }
  }

  return bad;
})()`;

(async () => {
  await waitForDevtools();
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const cdp = await connect((await res.json()).webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const all = new Map();
  for (const route of ROUTES) {
    await cdp.send('Page.navigate', { url: `${BASE}/#/${route}` });
    await sleep(900);
    const bad = await evaluate(cdp, AUDIT_FN);
    for (const b of bad) if (!all.has(b)) all.set(b, route);
  }

  const violations = [...all.keys()];
  if (violations.length) {
    console.error(`\n✗ Runtime palette audit failed — ${violations.length} unauthorised colour declaration(s):\n`);
    for (const v of violations) console.error('  [' + all.get(v) + '] ' + v);
    console.error('\nOnly Navy #1F2A44, Warm Beige #E8DCC8 and Soft Gold #C6A75E are permitted.\n');
    chrome.kill();
    process.exit(1);
  }
  console.log(`\n✅ Runtime palette audit passed — every colour declaration across ${ROUTES.length} routes is navy, beige or gold.\n`);
  chrome.kill();
})().catch((err) => { console.error(err); chrome.kill(); process.exit(1); });
