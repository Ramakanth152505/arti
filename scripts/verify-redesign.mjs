/**
 * ARTI AI — redesign guard (headless Chromium via CDP).
 *
 * The premium refinement layer (src/styles/premium.css) must transform every
 * non-Home workspace while leaving the approved Home screen provably unchanged.
 * This suite asserts that contract directly against the rendered DOM:
 *
 *   Home preservation
 *     - the approved Home content, background composition and prompt bar render;
 *     - Home carries none of the premium shell refinements (no entrance
 *       animation, no premium sidebar material, no premium card border).
 *
 * Non-Home refinement
 *     - the shell refines on every other route (entrance animation + sidebar
 *       material) and the Home-only rules never leak.
 *
 * Route integrity
 *     - every registered route renders its workspace with no console errors.
 *
 * Usage: node scripts/verify-redesign.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:12000';
const PORT = 9254;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-redesign-'));

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

const results = [];
function check(name, ok, detail = '') { results.push({ name, ok, detail }); }

const ROUTES = [
  'conversation', 'chats', 'projects', 'websites', 'apps', 'games', 'images', 'videos',
  'music', 'documents', 'research', 'learning', 'agents', 'tools', 'create-software',
  'knowledge-base', 'marketplace', 'task-control-center', 'system-status',
  'ai-command-center', 'settings', 'help-support', 'magic-mode',
];

async function evaluate(cdp, expression) {
  const { result } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return result.value;
}

(async () => {
  await waitForDevtools();
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const cdp = await connect((await res.json()).webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const errors = [];
  cdp.ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.text || 'exception');
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value || a.description || '').join(' '));
  });

  // ---- Home preservation -------------------------------------------------
  errors.length = 0;
  await cdp.send('Page.navigate', { url: `${BASE}/#/home` });
  await sleep(1800);
  const home = JSON.parse(await evaluate(cdp, `(() => {
    const q = (s) => document.querySelector(s);
    const shell = q('.app-shell');
    const mount = q('.active-workspace-mount');
    const sidebar = q('.sidebar');
    const hero = q('.hero-heading');
    const prompt = q('.prompt-input');
    const quick = Array.from(document.querySelectorAll('.quick-action-pill')).map((b) => b.innerText.trim());
    const bg = q('.cinematic-bg');
    const card = q('.project-card, .production-card, .image-result, .audio-player-card, .library-card, .style-tile, .workspace-header');
    return JSON.stringify({
      shellHome: shell ? shell.classList.contains('route-home') : false,
      hero: hero ? hero.innerText.trim() : '',
      greeting: q('.hero-greeting') ? q('.hero-greeting').innerText.trim() : '',
      subtitle: q('.hero-subtitle') ? q('.hero-subtitle').innerText.trim() : '',
      placeholder: prompt ? prompt.getAttribute('placeholder') : '',
      quick,
      hasCrown: !!q('.hero-crown-icon'),
      hasSpark: !!q('.prompt-spark-icon'),
      hasFooter: !!q('.home-footer'),
      bgSrc: bg ? bg.getAttribute('src') : '',
      mountAnimation: mount ? getComputedStyle(mount).animationName : 'x',
      sidebarBgImage: sidebar ? getComputedStyle(sidebar).backgroundImage : 'x',
      cardBorderTop: card ? getComputedStyle(card).borderTopColor : 'x',
    });
  })()`));

  check('Home route is active with the approved shell', home.shellHome === true);
  check('Home hero heading is unchanged',
    /What would you like to .*create.* today\?/i.test(home.hero), home.hero);
  check('Home greeting is unchanged', /Hello, Ramakanth/i.test(home.greeting), home.greeting);
  check('Home subtitle is unchanged', /Dream bigger\. Build faster\. Explore further\./i.test(home.subtitle), home.subtitle);
  check('Home prompt bar placeholder is unchanged',
    /Ask ARTI anything, create a project, or synthesize ideas/i.test(home.placeholder), home.placeholder);
  check('Home quick actions are unchanged',
    ['Create Project', 'Search', 'Generate', 'Explore', 'More'].every((l) => home.quick.includes(l)), home.quick.join(' | '));
  check('Home identity elements (crown, spark, footer) are present',
    home.hasCrown && home.hasSpark && home.hasFooter);
  check('Home cinematic background is unchanged',
    home.bgSrc === '/assets/arti_cinematic_bg.png', home.bgSrc);
  check('Home carries no premium entrance animation', home.mountAnimation === 'none', home.mountAnimation);
  check('Home sidebar material is unchanged (no premium gradient)',
    home.sidebarBgImage === 'none', home.sidebarBgImage);
  check('Home surface carries no premium card border',
    home.cardBorderTop !== 'rgb(198, 167, 94)', home.cardBorderTop);
  check('Home renders with no console errors', errors.length === 0, errors.slice(0, 2).join(' '));

  // ---- Non-Home refinement + route integrity -----------------------------
  let refined = 0; let rendered = 0; let routeErrors = 0;
  for (const route of ROUTES) {
    errors.length = 0;
    await cdp.send('Page.navigate', { url: `${BASE}/#/${route}` });
    await sleep(1100);
    const r = JSON.parse(await evaluate(cdp, `(() => {
      const mount = document.querySelector('.active-workspace-mount');
      const sidebar = document.querySelector('.sidebar');
      const shell = document.querySelector('.app-shell');
      return JSON.stringify({
        home: shell ? shell.classList.contains('route-home') : true,
        mountChildren: mount ? mount.children.length : 0,
        text: (document.body.innerText || '').length,
        anim: mount ? getComputedStyle(mount).animationName : 'x',
        sidebarBg: sidebar ? getComputedStyle(sidebar).backgroundImage : 'x',
      });
    })()`));
    if (r.mountChildren > 0 && r.text > 40 && !r.home) rendered++;
    if (r.anim === 'premWorkspaceIn' && r.sidebarBg !== 'none') refined++;
    if (errors.length > 0) { routeErrors++; console.log(`  console error on ${route}:`, errors.slice(0, 2).join(' ')); }
  }
  check(`Every non-Home route renders its workspace (${rendered}/${ROUTES.length})`, rendered === ROUTES.length);
  check(`Every non-Home route receives the premium shell refinement (${refined}/${ROUTES.length})`, refined === ROUTES.length);
  check('No console errors across non-Home routes', routeErrors === 0);

  // ---- Report ------------------------------------------------------------
  let passed = 0;
  for (const r of results) {
    if (r.ok) passed++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log(`\n${passed === results.length ? '✅' : '❌'} ${passed}/${results.length} checks passed.`);

  chrome.kill('SIGKILL');
  rmSync(userDataDir, { recursive: true, force: true });
  process.exitCode = passed === results.length ? 0 : 1;
})().catch((err) => { console.error('Verification failed:', err); chrome.kill('SIGKILL'); process.exitCode = 1; });
