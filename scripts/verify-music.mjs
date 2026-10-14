/**
 * ARTI AI — Music Studio functional verification (headless Chromium via CDP).
 *
 * Seeds real records into the repository's localStorage stores, then asserts the
 * behaviours the product requires:
 *   - The Music Studio shell: four tabs, twelve creation modes in five groups,
 *     a large searchable language catalog and a broad style catalog.
 *   - Honest not-connected states: with no bridge configured, no generation is
 *     attempted and no track is fabricated.
 *   - The in-component generation indicator appears ONLY while a real request is
 *     running and is removed when it completes — it is never a permanent
 *     background and never blocks the composer.
 *   - A real provider response becomes a playable track record; a provider
 *     failure yields an honest failed record (never a fake URL).
 *   - Duplicate requests are prevented (the generate control is disabled while
 *     a request is in flight).
 *   - The track library shows real metadata; playback uses the real asset;
 *     download is a genuine client-side download with no upload.
 *   - Tempo transforms distinguish playback-speed (real, local) from
 *     pitch-preserving time stretch (reported as not connected).
 *   - Language and vocal capability are shown honestly (undeclared ≠ supported).
 *   - Music conversations never leak into other workspaces and vice versa.
 *   - Fonts load and the integrated-input policy holds.
 *   - Existing routes still render.
 *
 * Usage: node scripts/verify-music.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173';
const PORT = 9226;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-music-'));

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
async function goto(cdp, hash, waitMs = 1300) {
  navSeq += 1;
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

async function waitFor(cdp, expr, timeoutMs = 6000, interval = 150) {
  const start = Date.now();
  for (;;) {
    const v = await evaluate(cdp, expr);
    if (v) return v;
    if (Date.now() - start > timeoutMs) return v;
    await sleep(interval);
  }
}

/* A minimal, valid 16-bit PCM WAV (mono, 8 kHz, ~0.5 s of a quiet tone). It is
   a genuine audio asset so the player, the local transform and the download
   path are all exercised against real bytes. */
function tinyWavDataUrl() {
  const sampleRate = 8000;
  const samples = sampleRate / 2;
  const dataSize = samples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i += 1) {
    const v = Math.round(Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 3000);
    buf.writeInt16LE(v, 44 + i * 2);
  }
  return `data:audio/wav;base64,${buf.toString('base64')}`;
}

const WAV = tinyWavDataUrl();

const MUSIC_ENDPOINT = 'https://mock-music.local/generate-music';

const SEED_PROJECTS = [
  { id: 'proj_general_1', name: 'General Website', description: 'A site', goal: '', techStack: '', type: 'website', customType: '', isStarred: false, isSoftware: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

function seedChats() {
  const completeTrack = {
    id: 'track_seed_ok', createdAt: '2026-01-02T00:00:00.000Z', title: 'Mock Telugu Duet',
    mode: 'full-song-vocals', providerId: 'custom-server', model: 'mock-model',
    originalPrompt: 'An emotional Telugu romantic duet', preparedPrompt: 'Create a full song with vocals.',
    lyrics: '[Verse 1] [MALE]\nLine one\n\n[Chorus] [BOTH]\nLine two',
    language: 'te', genre: 'pop', instrumental: false, vocalType: 'duet',
    durationSeconds: 180, format: 'wav', audioUrl: WAV, provenance: 'ai-vocals-and-music',
    favorite: true, status: 'complete',
  };
  const failedTrack = {
    id: 'track_seed_fail', createdAt: '2026-01-02T00:00:00.000Z', title: 'Failed Take',
    mode: 'instrumental', providerId: 'custom-server', model: '',
    originalPrompt: 'ambient', preparedPrompt: 'Create an instrumental piece.',
    language: 'en', genre: 'ambient', instrumental: true,
    durationSeconds: 120, format: 'mp3', provenance: 'ai-instrumental',
    favorite: false, status: 'failed', error: 'Music bridge error 500: engine exploded',
  };
  return [
    { id: 'conv_gen_1', title: 'General chat', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI',
      messages: [{ id: 'g1', sender: 'user', content: 'hello general', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }] },
    { id: 'conv_img_1', title: 'Mountain sunrise', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Image Studio', workspace: 'images',
      messages: [{ id: 'im1', sender: 'user', content: 'mountain landscape', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      imageMeta: { styleId: 'watercolor', settings: {}, results: [], pendingGeneration: false } },
    { id: 'conv_vid_1', title: 'Ocean clip', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Video Studio', workspace: 'videos', category: 'standalone',
      messages: [{ id: 'vm1', sender: 'user', content: 'ocean video', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      videoMeta: { category: 'standalone', videoType: 'single-video', settings: {}, results: [], pendingGeneration: false } },
    { id: 'conv_music_1', title: 'Telugu romantic duet', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Music Studio', workspace: 'music',
      messages: [{ id: 'm1', sender: 'assistant', content: 'Generated "Mock Telugu Duet".', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      musicMeta: {
        mode: 'full-song-vocals', language: 'te', genre: 'pop', vocalType: 'duet', lyrics: completeTrack.lyrics,
        settings: { mood: 'romantic', energy: 'medium', structure: 'intro,verse,chorus,bridge,chorus,outro', duration: '180', instruments: 'sitar,tabla,strings' },
        results: [completeTrack, failedTrack], pendingGeneration: false,
      } },
  ];
}

async function main() {
  await waitForDevtools();
  const cdp = await connect(await newPage());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await goto(cdp, '/home', 900);
  await evaluate(cdp, `(() => {
    localStorage.setItem('arti_saved_projects', ${JSON.stringify(JSON.stringify(SEED_PROJECTS))});
    localStorage.setItem('arti_ws_chats', ${JSON.stringify(JSON.stringify(seedChats()))});
    localStorage.removeItem('arti_endpoint_music');
    localStorage.removeItem('arti_key_music');
    localStorage.removeItem('arti_key_anthropic');
    localStorage.removeItem('arti_key_openai');
    return true;
  })()`);

  /* ---- 1. Workspace shell ------------------------------------------------ */
  await goto(cdp, '/music', 1500);
  const shell = await evaluate(cdp, `(() => ({
    tabs: Array.from(document.querySelectorAll('.music-tab')).map((b) => b.innerText.trim()),
    modeGroups: document.querySelectorAll('.music-mode-group').length,
    modeTiles: document.querySelectorAll('.music-mode-tile').length,
    langRows: document.querySelectorAll('.music-lang-row').length,
    genreChips: document.querySelectorAll('.music-style-section .music-chip').length,
    hasComposer: !!document.querySelector('.chat-composer-textarea'),
  }))()`);
  check('Music renders the four primary tabs',
    ['Create', 'Chat', 'Library', 'Gallery'].every((t) => shell.tabs.includes(t)),
    shell.tabs.join(' | '));
  check('Creation modes are grouped into five families', shell.modeGroups === 5, `${shell.modeGroups} groups`);
  check('All twelve creation modes are present', shell.modeTiles === 12, `${shell.modeTiles} modes`);
  check('The language catalog is large and searchable', shell.langRows >= 40, `${shell.langRows} languages`);
  check('The style catalog is broad', shell.genreChips >= 40, `${shell.genreChips} chips`);

  /* ---- 2. Chat tab: composer + honest not-connected state ---------------- */
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Chat');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const idle = await evaluate(cdp, `(() => ({
    hasComposer: !!document.querySelector('.chat-composer-textarea'),
    notice: document.querySelector('.chat-composer-notice') ? document.querySelector('.chat-composer-notice').innerText : '',
    indicator: !!document.querySelector('.music-gen-indicator'),
  }))()`);
  check('Music shows the prompt composer', idle.hasComposer === true);
  check('Idle music workspace shows a Not connected notice', /not connected/i.test(idle.notice), idle.notice.slice(0, 60));
  check('No generation indicator is shown while idle', idle.indicator === false);

  /* ---- 3. No provider → no request, no fabricated track ------------------ */
  await evaluate(cdp, `(() => {
    window.__posts = [];
    const orig = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || 'GET';
      if (method !== 'GET') window.__posts.push({ url, method });
      return orig.apply(this, arguments);
    };
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'Create an emotional Telugu romantic duet with male and female vocals.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const send = document.querySelector('.chat-send-btn');
    if (send) send.click();
    return true;
  })()`);
  await sleep(1200);
  const noProvider = await evaluate(cdp, `(() => ({
    posts: window.__posts || [],
    text: document.body.innerText,
    indicator: !!document.querySelector('.music-gen-indicator'),
  }))()`);
  check('With no bridge, no generation request is sent', noProvider.posts.length === 0, `${noProvider.posts.length} posts`);
  check('With no bridge, the workspace says so honestly',
    /no music provider is connected/i.test(noProvider.text));
  check('With no bridge, no generation indicator is shown', noProvider.indicator === false);

  /* ---- 4. Configure the bridge and run a real request -------------------- */
  await evaluate(cdp, `(() => {
    localStorage.setItem('arti_endpoint_music', ${JSON.stringify(MUSIC_ENDPOINT)});
    return true;
  })()`);
  await goto(cdp, '/music', 1500);

  // Install the mock bridge: a delayed, valid music response.
  await evaluate(cdp, `(() => {
    window.__musicPosts = [];
    window.__uploads = [];
    const orig = window.fetch;
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || 'GET';
      if (method !== 'GET') window.__uploads.push({ url, method });
      if (url.includes('mock-music')) {
        window.__musicPosts.push({ url, method, body: init && init.body });
        await new Promise((r) => setTimeout(r, 900));
        return new Response(JSON.stringify({
          tracks: [{ url: ${JSON.stringify(WAV)}, duration: 180, format: 'wav', title: 'Mock Duet Result' }],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return orig.apply(this, arguments);
    };
    return true;
  })()`);

  // Go to Create, confirm the mode and set the theme (separate action so React
  // re-renders before the generate click).
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Create');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(300);
  await evaluate(cdp, `(() => {
    const tile = Array.from(document.querySelectorAll('.music-mode-tile')).find((t) => /Full Song with Vocals/i.test(t.innerText));
    if (tile) tile.click();
    return true;
  })()`);
  await sleep(250);
  await evaluate(cdp, `(() => {
    const theme = document.querySelector('#music-theme');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(theme, 'A Telugu romantic duet about meeting again');
    theme.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(300);
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('.music-create-actions button')).find((x) => /Generate track/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  await sleep(400);
  const duringGen = await evaluate(cdp, `(() => ({
    indicator: !!document.querySelector('.music-gen-indicator'),
    stageText: document.querySelector('.music-gen-stage') ? document.querySelector('.music-gen-stage').innerText : '',
  }))()`);
  check('The generation indicator appears while the request runs', duringGen.indicator === true);
  check('The indicator reports a real stage', /generating music/i.test(duringGen.stageText), duringGen.stageText);

  // Duplicate-request protection: the generate control is disabled while pending.
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Create');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(250);
  const dupGuard = await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('.music-create-actions button')).find((x) => /Generating|Generate track/i.test(x.innerText));
    return b ? b.disabled : null;
  })()`);
  check('The generate control is disabled while a request is in flight', dupGuard === true, String(dupGuard));

  // Wait for completion, then view the result on the Chat tab.
  await waitFor(cdp, `!document.querySelector('.music-gen-indicator')`, 6000);
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Chat');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const afterGen = await evaluate(cdp, `(() => ({
    posts: (window.__musicPosts || []).length,
    indicator: !!document.querySelector('.music-gen-indicator'),
    hasPlayer: !!document.querySelector('.music-player'),
    audioSrc: document.querySelector('.music-player audio') ? document.querySelector('.music-player audio').src.slice(0, 24) : '',
    body: document.body.innerText,
  }))()`);
  check('Exactly one real generation request was sent', afterGen.posts === 1, `${afterGen.posts} posts`);
  check('The generation indicator is removed once the request completes', afterGen.indicator === false);
  check('A real, playable track is shown after success',
    afterGen.hasPlayer === true && afterGen.audioSrc.startsWith('data:audio/wav'), afterGen.audioSrc);

  /* ---- 5. Provider failure yields an honest failed record ---------------- */
  await evaluate(cdp, `(() => {
    const orig = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.includes('mock-music')) {
        return Promise.resolve(new Response('{"error":"engine exploded"}', { status: 500 }));
      }
      return orig.apply(this, arguments);
    };
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Create');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(300);
  await evaluate(cdp, `(() => {
    const theme = document.querySelector('#music-theme');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(theme, 'A failing request for testing');
    theme.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(300);
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('.music-create-actions button')).find((x) => /Generate track/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  await waitFor(cdp, `!document.querySelector('.music-gen-indicator') && document.body.innerText.includes('Mock Telugu Duet')`, 6000);
  await sleep(400);
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Library');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const failState = await evaluate(cdp, `(() => ({
    failedRows: document.querySelectorAll('.music-library-row.status-failed').length,
    body: document.body.innerText,
    playerOnFailed: !!document.querySelector('.music-library-row.status-failed .music-library-play[disabled]'),
  }))()`);
  check('A provider failure creates an honest failed record', failState.failedRows >= 2, `${failState.failedRows} failed rows`);
  check('A failed record is not offered as playable', failState.playerOnFailed === true);

  /* ---- 6. Track library metadata ---------------------------------------- */
  const library = await evaluate(cdp, `(() => {
    const rows = Array.from(document.querySelectorAll('.music-library-row'));
    const seeded = rows.find((r) => /Mock Telugu Duet/i.test(r.innerText));
    return {
      count: rows.length,
      seededText: seeded ? seeded.innerText : '',
      hasProvenance: seeded ? /AI-generated music with AI-generated vocals/i.test(seeded.innerText) : false,
      hasVariationBadge: !!document.querySelector('.music-library-variation'),
    };
  })()`);
  check('The library lists the real seeded track', /Mock Telugu Duet/i.test(library.seededText));
  check('A track shows its real provenance', library.hasProvenance === true);

  /* ---- 7. Playback uses the real asset ---------------------------------- */
  const play = await evaluate(cdp, `(() => {
    const row = Array.from(document.querySelectorAll('.music-library-row')).find((r) => /Mock Telugu Duet/i.test(r.innerText));
    if (row) row.click();
    return true;
  })()`);
  void play;
  await sleep(350);
  await evaluate(cdp, `(() => {
    const row = Array.from(document.querySelectorAll('.music-library-row')).find((r) => /Mock Telugu Duet/i.test(r.innerText));
    const btn = row ? row.querySelector('.music-library-play') : null;
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(350);
  const playState = await evaluate(cdp, `(() => {
    const audio = document.querySelector('.music-player audio');
    return { hasAudio: !!audio, src: audio ? audio.src.slice(0, 24) : '' };
  })()`);
  check('Playing a track uses its real audio asset', playState.hasAudio === true && playState.src.startsWith('data:audio/wav'), playState.src);

  /* ---- 8. Genuine download, no upload ----------------------------------- */
  await evaluate(cdp, `(() => {
    window.__downloads = [];
    window.__dlUploads = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) window.__downloads.push({ name: this.download });
      else return origClick.apply(this, arguments);
    };
    const orig = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || 'GET';
      if (method !== 'GET') window.__dlUploads.push({ url, method });
      return orig.apply(this, arguments);
    };
    return true;
  })()`);
  await evaluate(cdp, `(() => {
    const row = Array.from(document.querySelectorAll('.music-library-row')).find((r) => /Mock Telugu Duet/i.test(r.innerText));
    const btn = row ? row.querySelector('[aria-label="Download track"]') : null;
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(900);
  const dlResult = await evaluate(cdp, `(() => ({ downloads: window.__downloads || [], uploads: window.__dlUploads || [] }))()`);
  check('Downloading triggers a browser download with a filename', dlResult.downloads.length >= 1, JSON.stringify(dlResult.downloads[0] || {}));
  check('Downloading does not upload the track anywhere', dlResult.uploads.length === 0, `${dlResult.uploads.length} uploads`);

  /* ---- 9. Tempo transforms: playback-speed vs time stretch -------------- */
  await evaluate(cdp, `(() => {
    const row = Array.from(document.querySelectorAll('.music-library-row')).find((r) => /Mock Telugu Duet/i.test(r.innerText));
    const btn = row ? row.querySelector('[aria-label="Transform track"]') : null;
    if (btn) btn.click();
    return true;
  })()`);
  const transformOpen = await waitFor(cdp, `!!document.querySelector('.music-transform-panel')`);
  check('The transform panel opens for a track', transformOpen === true);

  // Choose the "Slower version" transform so the three speed methods appear.
  await evaluate(cdp, `(() => {
    const slower = Array.from(document.querySelectorAll('.music-transform-panel .music-chip')).find((c) => /Slower version/i.test(c.innerText));
    if (slower) slower.click();
    return true;
  })()`);
  await sleep(250);
  check('Tempo transforms offer all three distinct methods',
    (await evaluate(cdp, `document.querySelectorAll('.music-transform-method').length`)) === 3);

  // Time stretch is honestly blocked (no DSP service). Select the method, let it
  // render, then apply.
  await evaluate(cdp, `(() => {
    const ts = Array.from(document.querySelectorAll('.music-transform-method')).find((m) => /Time stretch/i.test(m.innerText));
    if (ts) ts.click();
    return true;
  })()`);
  await sleep(250);
  const tsSelected = await evaluate(cdp, `(() => {
    const ts = Array.from(document.querySelectorAll('.music-transform-method')).find((m) => /Time stretch/i.test(m.innerText));
    return ts ? ts.classList.contains('active') : false;
  })()`);
  check('The pitch-preserving time-stretch method is selectable', tsSelected === true);
  await evaluate(cdp, `(() => {
    const apply = Array.from(document.querySelectorAll('.music-transform-actions button')).find((b) => /Create this variation/i.test(b.textContent));
    if (apply) apply.click();
    return true;
  })()`);
  await sleep(700);
  const tsBlocked = await evaluate(cdp, `document.body.innerText`);
  check('Pitch-preserving time stretch is reported as not connected',
    /needs a real DSP service/i.test(tsBlocked));
  const afterTs = await evaluate(cdp, `document.querySelectorAll('.music-library-row').length`);

  // Playback-speed is real, local and preserves the original. Select the method,
  // let it render, then apply.
  await evaluate(cdp, `(() => {
    const pb = Array.from(document.querySelectorAll('.music-transform-method')).find((m) => /Playback speed/i.test(m.innerText));
    if (pb) pb.click();
    return true;
  })()`);
  await sleep(250);
  await evaluate(cdp, `(() => {
    const apply = Array.from(document.querySelectorAll('.music-transform-actions button')).find((b) => /Create this variation/i.test(b.textContent));
    if (apply) apply.click();
    return true;
  })()`);
  await sleep(3000);
  const afterTransform = await evaluate(cdp, `(() => ({
    count: document.querySelectorAll('.music-library-row').length,
    body: document.body.innerText,
    variation: !!document.querySelector('.music-library-variation'),
    processed: /processed by a real, separate transformation step/i.test(document.body.innerText),
  }))()`);
  check('Playback-speed creates a new variation track', afterTransform.count === afterTs + 1, `${afterTs} → ${afterTransform.count}`);
  check('The variation is linked to its source (variation badge shown)', afterTransform.variation === true);
  check('The original track is preserved', /Mock Telugu Duet/i.test(afterTransform.body));

  /* ---- 10. Language & vocal capability honesty -------------------------- */
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.music-tab')).find((b) => b.innerText.trim() === 'Create');
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const honesty = await evaluate(cdp, `(() => {
    const statuses = Array.from(document.querySelectorAll('.music-lang-status')).map((s) => s.innerText.trim());
    return {
      unverified: statuses.filter((s) => /Unverified/i.test(s)).length,
      body: document.body.innerText,
      langNote: !!document.querySelector('.music-lang-note'),
    };
  })()`);
  check('Undeclared vocal languages are shown as unverified', honesty.unverified >= 40, `${honesty.unverified} unverified`);
  check('The language catalog states the provider has not declared its languages',
    /has not declared which languages it can sing/i.test(honesty.body));

  /* ---- 11. Isolation between workspaces --------------------------------- */
  const isolation = await evaluate(cdp, `(() => {
    const items = Array.from(document.querySelectorAll('.project-chat-item')).map((i) => i.innerText.trim());
    return {
      musicItems: items,
      hasVideoLeak: items.some((t) => /Ocean clip/i.test(t)),
      hasImageLeak: items.some((t) => /Mountain sunrise/i.test(t)),
      hasGeneralLeak: items.some((t) => /General chat/i.test(t)),
    };
  })()`);
  check('Music panel lists only Music conversations', isolation.hasVideoLeak === false && isolation.hasImageLeak === false && isolation.hasGeneralLeak === false);

  await goto(cdp, '/chats', 1200);
  const chatsLeak = await evaluate(cdp, `document.body.innerText`);
  check('Music conversations do not leak into Chats', !/Telugu romantic duet/i.test(chatsLeak));

  /* ---- 12. Fonts + integrated inputs ------------------------------------ */
  await goto(cdp, '/music', 1300);
  const fonts = await evaluate(cdp, `(async () => {
    await document.fonts.ready;
    return {
      orbitron: document.fonts.check('16px Orbitron'),
      inter: document.fonts.check('16px Inter'),
      mono: document.fonts.check('16px "JetBrains Mono"'),
    };
  })()`);
  check('Orbitron, Inter and JetBrains Mono are loaded', fonts.orbitron && fonts.inter && fonts.mono);

  const inputs = await evaluate(cdp, `(() => {
    const all = Array.from(document.querySelectorAll('input, textarea'));
    const bare = all.filter((el) => !el.classList.contains('field-integrated') && !el.classList.contains('form-input') && !el.classList.contains('form-select') && !el.classList.contains('form-textarea') && el.type !== 'checkbox' && el.type !== 'number' && el.type !== 'range');
    return { total: all.length, bare: bare.length };
  })()`);
  check('Music inputs opt into the integrated border policy', inputs.bare === 0, `${inputs.total} inputs, ${inputs.bare} bare`);

  /* ---- 13. Existing routes still work ----------------------------------- */
  for (const route of ['home', 'settings', 'help-support']) {
    await goto(cdp, `/${route}`, 900);
    const ok = await evaluate(cdp, `document.body.innerText.length > 40`);
    check(`Existing route /${route} still renders`, ok === true);
  }

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
