/**
 * ARTI AI — cross-device overflow scan (headless Chromium via CDP).
 *
 * Launches a headless Chromium (no external deps; Node's built-in WebSocket),
 * walks every route at every required viewport, and reports any horizontal
 * overflow (document scrollWidth > clientWidth) plus the offending elements.
 * The acceptance bar is zero horizontal overflow.
 *
 * Usage: node scripts/overflow-scan.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:12000';
const PORT = 9222;

const VIEWPORTS = [
  [320, 568],
  [360, 800],
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
];

const ROUTES = [
  'home',
  'chats',
  'projects',
  'apps',
  'create-software',
  'websites',
  'tools',
  'settings',
  'help-support',
];

const userDataDir = mkdtempSync(join(tmpdir(), 'arti-cdp-'));

const chrome = spawn('chromium', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank',
], { stdio: 'ignore' });

function waitForDevtools(timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) return resolve(await res.json());
      } catch {
        /* not up yet */
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('Devtools did not start'));
      setTimeout(tick, 250);
    };
    tick();
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function newPage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const target = await res.json();
  return target.webSocketDebuggerUrl;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  return new CDP(ws);
}

const OVERFLOW_SCRIPT = `(() => {
  const de = document.documentElement;
  const docOverflow = de.scrollWidth - de.clientWidth;
  const offenders = [];
  const vw = de.clientWidth;
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
      offenders.push({ tag: el.tagName, cls: (el.className && el.className.toString().slice(0,60)) || '', right: Math.round(r.right), left: Math.round(r.left) });
    }
  }
  return { docOverflow, offenders: offenders.slice(0, 5) };
})()`;

async function main() {
  await waitForDevtools();
  const cdp = await connect(await newPage());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const problems = [];
  for (const route of ROUTES) {
    for (const [w, h] of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile: w < 768,
      });
      await cdp.send('Page.navigate', { url: `${BASE}/#/${route}` });
      await new Promise((r) => setTimeout(r, 500));
      // Re-apply metrics after navigation (override persists, but be safe).
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile: w < 768,
      });
      const { result } = await cdp.send('Runtime.evaluate', {
        expression: OVERFLOW_SCRIPT, returnByValue: true,
      });
      const { docOverflow, offenders } = result.value;
      if (docOverflow > 1) {
        problems.push({ route, size: `${w}x${h}`, docOverflow, offenders });
        console.log(`OVERFLOW ${route} ${w}x${h} by ${docOverflow}px`, JSON.stringify(offenders));
      }
    }
  }

  if (problems.length === 0) {
    console.log(`\n✅ Zero horizontal overflow across ${ROUTES.length} routes × ${VIEWPORTS.length} viewports (${ROUTES.length * VIEWPORTS.length} checks).`);
  } else {
    console.log(`\n❌ ${problems.length} overflow problems found.`);
    process.exitCode = 1;
  }

  chrome.kill('SIGKILL');
  rmSync(userDataDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('Scan failed:', err);
  chrome.kill('SIGKILL');
  process.exitCode = 1;
});
