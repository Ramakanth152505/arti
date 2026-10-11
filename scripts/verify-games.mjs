/**
 * ARTI AI — Games milestone functional verification (headless Chromium via CDP).
 *
 * Seeds real records into the repository's localStorage stores, then asserts:
 *   - Games lists only game records; Projects lists only non-game records
 *     (component isolation, no duplicate records).
 *   - A game opens its own workspace and its conversation is linked to it.
 *   - Distraction-free focus mode engages after the first prompt and the
 *     navigation rail is restored by mouse movement and by the explicit toggle.
 *   - Shared search/composer inputs carry `.field-integrated` (single border).
 *
 * Usage: node scripts/verify-games.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173';
const PORT = 9223;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-verify-'));

const chrome = spawn('chromium', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForDevtools(timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (res.ok) return resolve(await res.json());
      } catch { /* not up yet */ }
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
  return (await res.json()).webSocketDebuggerUrl;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  return new CDP(ws);
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

let navSeq = 0;
async function goto(cdp, hash, waitMs = 1200) {
  navSeq += 1;
  // A changing query forces a real document navigation, so the hash router
  // initialises from a clean load rather than a same-document hash change.
  await cdp.send('Page.navigate', { url: `${BASE}/?n=${navSeq}#${hash}` });
  await sleep(waitMs);
}

async function evaluate(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

async function main() {
  await waitForDevtools();
  const cdp = await connect(await newPage());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  // Seed one general project, one software project, one game, and one chat
  // bound to the game — exactly the shapes the stores persist.
  await goto(cdp, '/home', 900);
  await evaluate(cdp, `(() => {
    const now = new Date().toISOString();
    const projects = [
      { id: 'proj_general_1', name: 'General Website', description: 'A marketing site', goal: '', techStack: '', type: 'website', customType: '', isStarred: false, isSoftware: false, createdAt: now, updatedAt: now },
      { id: 'proj_soft_1', name: 'Billing App', description: 'An app', goal: '', techStack: '', type: 'app', customType: '', isStarred: false, isSoftware: true, createdAt: now, updatedAt: now,
        coreClassification: 'business', coreCustom: '', domains: [], domainCustom: '', platforms: ['web-browser'], platformMode: 'single', customPlatform: '' },
      { id: 'proj_game_1', name: 'Sky Drifters', description: 'Aerial racing game', goal: '', techStack: '', type: 'game', customType: '', isStarred: false, isGame: true, createdAt: now, updatedAt: now,
        game: { mechanics: ['aircraft', 'race-tracks-checkpoints'], themes: ['sci-fi-futuristic'], modes: ['single-player'], engine: 'godot', platforms: ['web-browser', 'windows'], platformMode: 'cross-platform', languages: [], dimensions: '3d', rendering: '', physics: '', ai: '', procedural: '', audio: '', animation: '', input: [], accessibility: '', saveLoad: '', performance: '', buildPackaging: [] } },
    ];
    localStorage.setItem('arti_saved_projects', JSON.stringify(projects));
    localStorage.setItem('arti_ws_chats', JSON.stringify([
      { id: 'conv_game_1', title: 'Sky Drifters design', isPinned: false, dateGroup: 'today', updatedAt: now, model: 'ARTI', projectId: 'proj_game_1',
        messages: [{ id: 'm1', sender: 'user', content: 'Plan the flight model', timestamp: now, status: 'complete' }] },
      { id: 'conv_proj_1', title: 'General Website brief', isPinned: false, dateGroup: 'today', updatedAt: now, model: 'ARTI', projectId: 'proj_general_1',
        messages: [{ id: 'm2', sender: 'user', content: 'Draft the homepage structure', timestamp: now, status: 'complete' }] },
    ]));
    return true;
  })()`);

  // 1. Games lists only the game.
  await goto(cdp, '/games');
  const gamesText = await evaluate(cdp, `document.body.innerText`);
  check('Games lists the game record', gamesText.includes('Sky Drifters'));
  check('Games excludes general/software records', !gamesText.includes('General Website') && !gamesText.includes('Billing App'));

  // 2. Projects lists only non-game records.
  await goto(cdp, '/projects');
  const projText = await evaluate(cdp, `document.body.innerText`);
  check('Projects lists the general project', projText.includes('General Website'));
  check('Projects excludes the game (isolation)', !projText.includes('Sky Drifters'));

  // 3. Apps lists only the software project.
  await goto(cdp, '/apps');
  const appsText = await evaluate(cdp, `document.body.innerText`);
  check('Apps lists the software project', appsText.includes('Billing App'));
  check('Apps excludes the game (isolation)', !appsText.includes('Sky Drifters'));

  // 4. Open the game workspace: focus mode engages (a message already exists).
  await goto(cdp, '/games?id=proj_game_1', 1500);
  const focus = await evaluate(cdp, `(() => {
    const shell = document.querySelector('.app-shell');
    const sidebar = document.querySelector('.sidebar');
    return {
      focusMode: shell ? shell.classList.contains('focus-mode') : null,
      sidebarWidth: sidebar ? Math.round(sidebar.getBoundingClientRect().width) : -1,
      hasConversation: document.body.innerText.includes('Plan the flight model'),
      hasToggle: !!Array.from(document.querySelectorAll('button')).find((b) => /panels/i.test(b.innerText)),
    };
  })()`);
  check('Focus mode class engages on an active conversation', focus.focusMode === true);
  check('Navigation rail collapses in focus mode', focus.sidebarWidth <= 2, `width=${focus.sidebarWidth}`);
  check('Conversation history preserved in focus mode', focus.hasConversation === true);
  check('Explicit reveal control present (touch/keyboard)', focus.hasToggle === true);

  // 5. Mouse movement reveals the rail again.
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 300, y: 300 });
  await sleep(900);
  const revealed = await evaluate(cdp, `(() => {
    const shell = document.querySelector('.app-shell');
    const sidebar = document.querySelector('.sidebar');
    return { focusMode: shell.classList.contains('focus-mode'), sidebarWidth: Math.round(sidebar.getBoundingClientRect().width) };
  })()`);
  check('Mouse movement reveals the navigation rail', revealed.focusMode === false && revealed.sidebarWidth > 50, `width=${revealed.sidebarWidth}`);

  // 7. Multiple chats per game, each bound to the correct game id.
  await evaluate(cdp, `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'New Chat');
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(500);
  const chatState = await evaluate(cdp, `(() => {
    const convs = JSON.parse(localStorage.getItem('arti_ws_chats') || '[]');
    const mine = convs.filter((c) => c.projectId === 'proj_game_1');
    const proj = convs.filter((c) => c.projectId === 'proj_general_1').length;
    return { total: convs.length, mine: mine.length, proj, allBound: mine.length >= 2 && mine.every((c) => c.projectId === 'proj_game_1') };
  })()`);
  check('A game can hold multiple conversations', chatState.mine >= 2, `${chatState.mine} for the game`);
  check('Every game conversation is bound to the game id', chatState.allBound === true);
  check('Project conversations stay with their own project', chatState.proj === 1, `${chatState.proj} for the project`);

  // 8. Deleting a conversation keeps the game.
  // The conversation panel is a collapsed disclosure by default; expand it
  // first so its per-chat delete controls are rendered. Poll until the panel
  // and its delete controls are actually mounted rather than guessing a delay.
  await evaluate(cdp, `(() => {
    const body = document.querySelector('.project-workspace-body');
    const disc = document.querySelector('.project-chat-disclosure');
    if (body && body.classList.contains('panel-collapsed') && disc) disc.click();
    return true;
  })()`);
  let deleteReady = false;
  for (let i = 0; i < 20 && !deleteReady; i += 1) {
    deleteReady = await evaluate(cdp, `document.querySelectorAll('.project-chat-delete-btn').length > 0`);
    if (!deleteReady) await sleep(100);
  }
  check('Conversation panel exposes per-chat delete controls', deleteReady === true);
  await evaluate(cdp, `(() => {
    const dels = Array.from(document.querySelectorAll('.project-chat-delete-btn'));
    if (dels[0]) { window.confirm = () => true; dels[0].click(); }
    return true;
  })()`);
  await sleep(500);
  const afterDelete = await evaluate(cdp, `(() => {
    const projects = JSON.parse(localStorage.getItem('arti_saved_projects') || '[]');
    const gameStillThere = projects.some((p) => p.id === 'proj_game_1' && p.isGame);
    const convs = JSON.parse(localStorage.getItem('arti_ws_chats') || '[]').filter((c) => c.projectId === 'proj_game_1');
    return { gameStillThere, remaining: convs.length };
  })()`);
  check('Deleting a chat keeps its parent game', afterDelete.gameStillThere === true);
  check('Deleting a chat removes only that conversation', afterDelete.remaining === 1, `${afterDelete.remaining} remaining`);

  // 6. Shared inputs use the opt-in integrated class (one border).
  const inputs = await evaluate(cdp, `(() => {
    const all = Array.from(document.querySelectorAll('input, textarea'));
    const bare = all.filter((el) => !el.classList.contains('field-integrated') && !el.classList.contains('form-input') && !el.classList.contains('form-textarea'));
    return { total: all.length, bare: bare.length };
  })()`);
  check('Shared inputs opt into the integrated border policy', inputs.bare === 0, `${inputs.total} inputs, ${inputs.bare} bare`);

  // 8b. The same shared focus model applies to a project workspace.
  await goto(cdp, '/projects?id=proj_general_1', 1500);
  const projFocus = await evaluate(cdp, `(() => {
    const shell = document.querySelector('.app-shell');
    const sidebar = document.querySelector('.sidebar');
    return {
      focusMode: shell.classList.contains('focus-mode'),
      sidebarWidth: Math.round(sidebar.getBoundingClientRect().width),
      hasHistory: document.body.innerText.includes('Plan the flight model') || document.body.innerText.includes('General Website'),
    };
  })()`);
  check('Focus mode is shared with the Projects workspace', projFocus.focusMode === true, `sidebar=${projFocus.sidebarWidth}`);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 300, y: 300 });
  await sleep(900);
  const projReveal = await evaluate(cdp, `(() => {
    const shell = document.querySelector('.app-shell');
    return { focusMode: shell.classList.contains('focus-mode') };
  })()`);
  check('Projects workspace reveals chrome on interaction', projReveal.focusMode === false);

  // 8c. The creation form exposes the full required taxonomy.
  await goto(cdp, '/games', 1200);
  await evaluate(cdp, `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /Create a New Game/i.test(b.innerText));
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(600);
  const taxo = await evaluate(cdp, `(() => {
    const groups = document.querySelectorAll('.game-mechanic-group-head').length;
    const legends = Array.from(document.querySelectorAll('.game-fieldset legend'));
    const chipsIn = (re) => {
      const fs = legends.find((l) => re.test(l.innerText));
      return fs ? fs.parentElement.querySelectorAll('.game-chip-grid button').length : -1;
    };
    return {
      mechanicGroups: groups,
      themes: chipsIn(/World theme/i),
      modes: chipsIn(/Multiplayer/i),
      engines: chipsIn(/engine|technology/i),
      platforms: chipsIn(/platform|target/i),
    };
  })()`);
  check('13 gameplay-mechanic categories are present', taxo.mechanicGroups === 13, `found ${taxo.mechanicGroups}`);
  check('15 world-theme options are present', taxo.themes === 15, `found ${taxo.themes}`);
  check('11 multiplayer/game-mode options are present', taxo.modes === 11, `found ${taxo.modes}`);
  check('Game engines/technology options are offered', taxo.engines >= 9, `found ${taxo.engines}`);
  check('Target-platform options are offered', taxo.platforms >= 11, `found ${taxo.platforms}`);

  // 8d. Platform and lifecycle status are reported honestly (no fake passes).
  await goto(cdp, '/games?id=proj_game_1', 1500);
  const honest = await evaluate(cdp, `(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => /Game Settings/i.test(b.innerText));
    if (btn) btn.click();
    return true;
  })()`);
  void honest;
  await sleep(700);
  const honesty = await evaluate(cdp, `(() => {
    const text = document.body.innerText;
    return {
      mentionsUnsupported: /not supported|unsupported|dependencies required|blocked/i.test(text),
      claimsPlayable: /\bplayable\b|build verified|100% complete|generated successfully/i.test(text),
      hasDialog: !!document.querySelector('[role="dialog"]'),
    };
  })()`);
  check('Game settings dialog opens', honesty.hasDialog === true);
  check('Platform limits are reported honestly', honesty.mentionsUnsupported === true);
  check('No fabricated playable/build claims are shown', honesty.claimsPlayable === false);

  // 9. The approved typefaces are actually loaded from the self-hosted assets.
  const fonts = await evaluate(cdp, `(async () => {
    await document.fonts.ready;
    return {
      orbitron: document.fonts.check('16px Orbitron'),
      inter: document.fonts.check('16px Inter'),
      mono: document.fonts.check('16px "JetBrains Mono"'),
    };
  })()`);
  check('Orbitron (brand) is loaded', fonts.orbitron === true);
  check('Inter (interface) is loaded', fonts.inter === true);
  check('JetBrains Mono (code) is loaded', fonts.mono === true);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${failed.length === 0 ? '✅' : '❌'} ${results.length - failed.length}/${results.length} checks passed.`);

  cdp.ws.close();
  chrome.kill('SIGKILL');
  rmSync(userDataDir, { recursive: true, force: true });
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  chrome.kill('SIGKILL');
  process.exit(1);
});
