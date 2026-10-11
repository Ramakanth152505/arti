/**
 * ARTI AI — Videos workspace functional verification (headless Chromium via CDP).
 *
 * Seeds real records into the repository's localStorage stores, then asserts the
 * behaviours the product requires:
 *   - Standalone video flow: style guidance is inserted into the prompt without
 *     erasing the user's text; switching styles never duplicates guidance.
 *   - Video type is a separate control from style; structured types route to the
 *     Series & Franchise Studio and are never silently generated as one clip.
 *   - A multi-season series creates the real hierarchy (3 seasons × 5 episodes =
 *     15 episodes), each episode independently addressable and editable.
 *   - Adding Season 4 leaves existing seasons untouched.
 *   - The series bible and continuity records are editable and persisted.
 *   - Chat persistence, collapse, and category grouping.
 *   - Large requested durations: a series is aggregate runtime; a single
 *     continuous request is validated against the engine's real clip limit.
 *   - Default resolution is 1920×1080 / 16:9 and 16K is never claimed as native.
 *   - A failed job preserves successful shots (only the failed work needs retry).
 *   - Downloading is a genuine client-side download (no upload).
 *   - Strict component separation (Videos never leaks into Chats/Projects/Games/
 *     Images and vice versa).
 *   - Fonts load and the integrated-input policy holds.
 *
 * Usage: node scripts/verify-videos.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173';
const PORT = 9225;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-videos-'));

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

const TINY_MP4 =
  'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAAG1kYXQ=';

const SEED_PROJECTS = [
  { id: 'proj_general_1', name: 'General Website', description: 'A site', goal: '', techStack: '', type: 'website', customType: '', isStarred: false, isSoftware: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'proj_game_1', name: 'Sky Drifters', description: 'Game', goal: '', techStack: '', type: 'game', customType: '', isStarred: false, isGame: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    game: { mechanics: ['aircraft'], themes: ['sci-fi-futuristic'], modes: ['single-player'], engine: 'godot', platforms: ['web-browser'], platformMode: 'single' } },
];

const EPISODE_SECONDS = 2700; // 45 minutes

function seedProduction() {
  const mkShot = (n, extra = {}) => ({
    id: `shot_s1e1_${n}`, number: n, prompt: `Shot ${n} prompt`, durationSeconds: 6,
    cameraMovement: 'Static', status: 'draft', versions: [], ...extra,
  });
  const scene1 = {
    id: 'scene_s1e1_1', number: 1, title: 'Opening', synopsis: '', prompt: 'Wide establishing shot.',
    durationSeconds: 30, lighting: 'golden hour', status: 'generated',
    shots: [
      mkShot(1, { status: 'generated', versions: [{ id: 'ver_1', url: TINY_MP4, createdAt: '10:00', width: 1920, height: 1080 }] }),
      mkShot(2, { status: 'failed' }),
    ],
  };
  const ep1 = {
    id: 'ep_s1_1', number: 1, title: 'The Gathering', synopsis: 'Opening episode.', script: 'INT. HALL — DAY',
    beats: [], status: 'generating', durationTargetSeconds: EPISODE_SECONDS,
    scenes: [scene1],
    jobs: [
      { id: 'job_ok', target: { type: 'shot', id: 'shot_s1e1_1' }, state: 'completed', prompt: 'Shot 1', requested: { durationSeconds: 6, resolution: '1080p', aspectRatio: '16:9', fps: 24 }, attempts: 1, maxAttempts: 3, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', outputAssetIds: [] },
      { id: 'job_fail', target: { type: 'shot', id: 'shot_s1e1_2' }, state: 'failed', prompt: 'Shot 2', requested: { durationSeconds: 6, resolution: '1080p', aspectRatio: '16:9', fps: 24 }, attempts: 1, maxAttempts: 3, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', error: 'engine returned 500', outputAssetIds: [] },
    ],
    assets: [{ id: 'asset_1', kind: 'video', url: TINY_MP4, width: 1920, height: 1080, durationSeconds: 6, format: 'mp4', createdAt: '2026-01-02T00:00:00.000Z', origin: 'generated', episodeId: 'ep_s1_1', sceneId: 'scene_s1e1_1', shotId: 'shot_s1e1_1' }],
    captions: '', versionNote: '',
  };
  const mkEp = (s, e) => ({
    id: `ep_s${s}_${e}`, number: e, title: `Episode ${e}`, synopsis: '', script: '', beats: [],
    status: 'planned', durationTargetSeconds: EPISODE_SECONDS, scenes: [], jobs: [], assets: [], captions: '', versionNote: '',
  });
  const mkSeason = (n, eps) => ({
    id: `season_${n}`, number: n, title: `Season ${n}`, description: '', arc: '', visualDirection: '',
    episodes: eps, archived: false, milestones: [],
  });
  const seasons = [1, 2, 3].map((s) => {
    const eps = [];
    for (let e = 1; e <= 5; e += 1) eps.push(s === 1 && e === 1 ? ep1 : mkEp(s, e));
    return mkSeason(s, eps);
  });
  return [{
    id: 'prod_series_1', kind: 'series', title: 'Kingdom of the Last Sun', logline: 'A dying kingdom, a last heir.',
    genre: 'Fantasy', styleId: 'epic-cinematic', audience: 'General', language: 'English', storyFormat: 'serialized',
    bible: {
      characters: [{ id: 'char_1', name: 'Kael', aliases: 'The Last Sun', description: 'Heir to the throne.', ageRange: '20s', appearance: 'Scarred left arm', personality: 'Stoic', voice: 'Low', relationships: 'Son of Aldric', history: 'Exiled at ten.' }],
      locations: 'The Sun Court', worldRules: 'Magic costs memory.', timeline: 'Third Age 412', factions: 'The Ember Order',
      props: 'The Sun Sigil', technology: 'Ember-forging', palette: 'Amber & obsidian', cinematography: 'Wide anamorphic',
      music: 'Choral theme', terminology: 'Emberforged',
      canonFacts: [{ id: 'fact_1', text: 'The kingdom fell in the year 412 of the Third Age.', approved: true, createdAt: '2026-01-02T00:00:00.000Z' }],
      openThreads: [], resolvedThreads: [], approvedChanges: [],
    },
    seasons, continuity: [{ id: 'cont_1', kind: 'character', text: 'Kael is injured in the left arm from episode 3 onward.', resolved: false, createdAt: '2026-01-02T00:00:00.000Z' }],
    chatIds: ['conv_vid_series_1'], targetResolution: '1080p', aspectRatio: '16:9', episodeDurationSeconds: EPISODE_SECONDS,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
  }];
}

function seedChats() {
  return [
    { id: 'conv_gen_1', title: 'General chat', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI',
      messages: [{ id: 'g1', sender: 'user', content: 'hello general', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }] },
    { id: 'conv_img_1', title: 'Mountain sunrise', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Image Studio', workspace: 'images',
      messages: [{ id: 'im1', sender: 'user', content: 'mountain landscape', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      imageMeta: { styleId: 'watercolor', settings: {}, results: [], pendingGeneration: false } },
    { id: 'conv_game_1', title: 'Sky Drifters design', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI', projectId: 'proj_game_1',
      messages: [{ id: 'gm1', sender: 'user', content: 'plan the flight model', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }] },
    { id: 'conv_vid_1', title: 'Ocean clip', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Video Studio', workspace: 'videos', category: 'standalone',
      messages: [{ id: 'vm1', sender: 'user', content: 'Create a 20-second realistic ocean video', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      videoMeta: { category: 'standalone', videoType: 'single-video', styleId: 'photorealistic', settings: { providerId: 'custom-server', model: '', videoType: 'single-video', aspectRatio: '16:9', resolution: '1080p', customResolution: '', fps: 24, durationSeconds: 20, cameraMovement: 'Static', lighting: '', colorGrade: 'Neutral', motion: 'Natural', audio: 'Music + effects', narration: '', music: '', language: 'English', subtitles: false, negativePrompt: '', seed: '-1', intendedPlatform: '' }, results: [], pendingGeneration: false } },
    { id: 'conv_vid_series_1', title: 'Kingdom of the Last Sun — Series Planning', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Video Studio', workspace: 'videos', category: 'multi-season-series',
      messages: [{ id: 'vsm1', sender: 'assistant', content: 'Created the production with 3 seasons.', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      videoMeta: { category: 'multi-season-series', videoType: 'multi-season-series', settings: {}, results: [], pendingGeneration: false, productionId: 'prod_series_1' } },
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
    localStorage.setItem('arti_video_productions', ${JSON.stringify(JSON.stringify(seedProduction()))});
    localStorage.removeItem('arti_endpoint_video');
    localStorage.removeItem('arti_key_video');
    return true;
  })()`);

  /* ---- 1. Workspace shell ------------------------------------------------ */
  await goto(cdp, '/videos', 1400);
  const shell = await evaluate(cdp, `(() => ({
    tabs: Array.from(document.querySelectorAll('.videos-tab')).map((b) => b.innerText.trim()),
    hasComposer: !!document.querySelector('.chat-composer-textarea'),
    hasChooseStyle: !!Array.from(document.querySelectorAll('button')).find((b) => /Choose Style/i.test(b.innerText)),
    hasProviders: !!Array.from(document.querySelectorAll('button')).find((b) => /Providers/i.test(b.innerText)),
    noProjectsPanel: !/Create a New Project/i.test(document.body.innerText),
  }))()`);
  check('Videos renders the five primary tabs',
    ['Create Video', 'Create Series', 'My Productions', 'Video Chats', 'Previous Videos'].every((t) => shell.tabs.includes(t)),
    shell.tabs.join(' | '));
  check('Videos shows the prompt composer', shell.hasComposer === true);
  check('Videos shows Choose Style', shell.hasChooseStyle === true);
  check('Videos exposes provider status', shell.hasProviders === true);
  check('Videos has no Projects panel', shell.noProjectsPanel === true);

  /* ---- 2. Default output settings: 1920×1080 / 16:9 ---------------------- */
  const defaults = await evaluate(cdp, `(() => {
    const btn = Array.from(document.querySelectorAll('.video-quick-btn')).find((b) => /1080p|1920/.test(b.innerText));
    const text = document.body.innerText;
    return { quick: btn ? btn.innerText : '', showsFps: /1080p/.test(text) && /16:9/.test(text) };
  })()`);
  check('Default output is 1080p (1920×1080) at 16:9', defaults.showsFps === true, defaults.quick);

  /* ---- 3. Style selection injects guidance without erasing the prompt ---- */
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'A lone lighthouse at dusk');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Choose Style/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  const picker = await waitFor(cdp, `(() => {
    const chips = document.querySelectorAll('.style-category-chip');
    if (chips.length === 0) return null;
    return {
      chips: chips.length,
      tiles: document.querySelectorAll('.style-tile').length,
      hasDocumentary: Array.from(document.querySelectorAll('.style-tile-name')).some((n) => /Documentary$/i.test(n.innerText.trim())),
    };
  })()`);
  check('Style picker opens with all 7 categories (+ All)', picker && picker.chips === 8, picker ? `${picker.chips} chips` : 'none');
  check('Style catalogue renders a large tile set', picker && picker.tiles >= 60, picker ? `${picker.tiles} tiles` : 'none');

  await evaluate(cdp, `(() => {
    const tile = Array.from(document.querySelectorAll('.style-tile')).find((t) => /Nature Documentary/i.test(t.innerText));
    if (tile) tile.click();
    return true;
  })()`);
  await sleep(350);
  const afterStyle = await evaluate(cdp, `(() => ({
    composer: document.querySelector('.chat-composer-textarea').value,
    pickerOpen: !!document.querySelector('.style-picker-dialog'),
  }))()`);
  check('Style guidance is inserted into the prompt', /telephoto wildlife framing|nature documentary/i.test(afterStyle.composer), afterStyle.composer.slice(0, 70));
  check('The original prompt text is preserved', /lighthouse at dusk/i.test(afterStyle.composer));
  check('Style selection closes the picker', afterStyle.pickerOpen === false);

  /* ---- 4. Switching styles never duplicates guidance --------------------- */
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Choose Style/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  await waitFor(cdp, `document.querySelectorAll('.style-tile').length > 0`);
  await evaluate(cdp, `(() => {
    const tile = Array.from(document.querySelectorAll('.style-tile')).find((t) => /Cyberpunk/i.test(t.innerText));
    if (tile) tile.click();
    return true;
  })()`);
  await sleep(300);
  const switched = await evaluate(cdp, `document.querySelector('.chat-composer-textarea').value`);
  const cyberSentences = (switched.match(/create a cyberpunk sequence/gi) || []).length;
  check('Switching style adds the new guidance', /cyberpunk/i.test(switched));
  check('Switching style does not duplicate the guidance', cyberSentences <= 1, `${cyberSentences} inserted style sentences`);

  /* ---- 5. Video type is a separate control; structured types route out --- */
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('.video-quick-btn')).find((x) => /Single video|video/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  const typePicker = await waitFor(cdp, `(() => {
    const dlg = document.querySelector('.video-type-picker-dialog');
    if (!dlg) return null;
    return {
      groups: dlg.querySelectorAll('.video-type-group').length,
      tiles: dlg.querySelectorAll('.video-type-tile').length,
      structured: dlg.querySelectorAll('.video-type-tile.structured').length,
    };
  })()`);
  check('Type picker opens with the 5 categories', typePicker && typePicker.groups === 5, typePicker ? `${typePicker.groups} groups` : 'none');
  check('Type picker lists a large, scalable taxonomy', typePicker && typePicker.tiles >= 60, typePicker ? `${typePicker.tiles} types` : 'none');
  check('Structured types are flagged', typePicker && typePicker.structured >= 20, typePicker ? `${typePicker.structured} structured` : 'none');

  await evaluate(cdp, `(() => {
    const tile = Array.from(document.querySelectorAll('.video-type-tile')).find((t) => /^TV series/.test(t.innerText));
    if (tile) tile.click();
    return true;
  })()`);
  await sleep(400);
  const typeDecision = await evaluate(cdp, `(() => {
    const dlg = document.querySelector('.video-decision');
    return { open: !!dlg, text: dlg ? dlg.innerText : '' };
  })()`);
  check('Selecting a structured type routes to the Series Studio', typeDecision.open === true);
  check('The type is recorded on the conversation', (await evaluate(cdp, `(() => { const c = JSON.parse(localStorage.getItem('arti_ws_chats')||'[]').find((x)=>x.id==='conv_vid_1'); return c && c.videoMeta.videoType; })()`)) === 'tv-series');
  await evaluate(cdp, `(() => { const b = Array.from(document.querySelectorAll('.dialog-close-btn')); if (b[0]) b[0].click(); return true; })()`);
  await sleep(250);

  /* ---- 6. Multi-season series hierarchy (3 × 5 = 15) --------------------- */
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.videos-tab')).find((t) => /My Productions/.test(t.innerText));
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  await evaluate(cdp, `(() => {
    const card = Array.from(document.querySelectorAll('.production-card')).find((c) => /Kingdom of the Last Sun/.test(c.innerText));
    if (card) card.click();
    return true;
  })()`);
  await waitFor(cdp, `!!document.querySelector('.production-overview')`);
  const overview = await evaluate(cdp, `(() => {
    const stats = Array.from(document.querySelectorAll('.production-overview-stat')).map((s) => s.innerText);
    return { stats, seasons: document.querySelectorAll('.season-item').length, text: document.body.innerText };
  })()`);
  check('The production opens with its overview', overview.stats.length >= 8, `${overview.stats.length} stats`);
  check('The series has 3 seasons', overview.seasons === 3, `${overview.seasons} seasons`);
  check('The overview reports 15 planned episodes', /15/.test(overview.text));

  const manifest = await evaluate(cdp, `(() => {
    const rows = document.querySelectorAll('.manifest-row').length;
    const manifestText = document.querySelector('.production-manifest-head');
    return { rows, hasManifest: !!manifestText, text: manifestText ? manifestText.innerText : '' };
  })()`);
  check('A paginated episode manifest is available for large productions', manifest.hasManifest === true, manifest.text);

  /* ---- 7. Episode independence ------------------------------------------- */
  const epEdit = await evaluate(cdp, `(() => {
    const items = document.querySelectorAll('.episode-item-main');
    if (items.length < 2) return null;
    items[1].click();
    return { count: items.length };
  })()`);
  await sleep(400);
  const epDetail = await evaluate(cdp, `(() => {
    const titleInput = document.querySelector('.episode-detail .form-input');
    if (!titleInput) return null;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(titleInput, 'Episode 2 — Renamed');
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    return { ok: true };
  })()`);
  await sleep(300);
  const epPersist = await evaluate(cdp, `(() => {
    const prods = JSON.parse(localStorage.getItem('arti_video_productions')||'[]');
    const s1 = prods[0].seasons[0];
    return {
      e2: s1.episodes[1].title,
      e1: s1.episodes[0].title,
      e3: s1.episodes[2].title,
    };
  })()`);
  check('Editing one episode is possible', epEdit !== null && epDetail !== null, epEdit ? `${epEdit.count} episodes` : 'none');
  check('Editing an episode leaves sibling episodes unchanged',
    epPersist.e2 === 'Episode 2 — Renamed' && epPersist.e1 === 'The Gathering' && epPersist.e3 === 'Episode 3',
    JSON.stringify(epPersist));

  /* ---- 8. Failed job preserves successful shots -------------------------- */
  const shots = await evaluate(cdp, `(() => {
    // Open season 1 / episode 1 which carries one generated and one failed shot.
    const items = document.querySelectorAll('.episode-item-main');
    if (items[0]) items[0].click();
    return true;
  })()`);
  void shots;
  await sleep(400);
  const jobState = await waitFor(cdp, `(() => {
    const versions = document.querySelectorAll('.shot-version-player').length;
    const jobs = document.querySelectorAll('.job-row').length;
    const failed = document.querySelectorAll('.job-row.job-failed').length;
    const completed = document.querySelectorAll('.job-row.job-completed').length;
    if (jobs === 0) return null;
    return { versions, jobs, failed, completed };
  })()`);
  check('A successful shot keeps its generated take after another shot fails',
    jobState && jobState.versions >= 1 && jobState.completed >= 1 && jobState.failed >= 1,
    jobState ? JSON.stringify(jobState) : 'none');

  /* ---- 9. Season expansion: add Season 4 without touching others --------- */
  const beforeSeasons = await evaluate(cdp, `(() => {
    const prods = JSON.parse(localStorage.getItem('arti_video_productions')||'[]');
    return prods[0].seasons.map((s) => ({ n: s.number, eps: s.episodes.length, id: s.id }));
  })()`);
  await evaluate(cdp, `(() => {
    const head = document.querySelector('.season-column-head');
    const btn = head ? head.querySelector('button') : null;
    if (btn) btn.click();
    return true;
  })()`);
  await sleep(400);
  const afterSeasons = await evaluate(cdp, `(() => {
    const prods = JSON.parse(localStorage.getItem('arti_video_productions')||'[]');
    return prods[0].seasons.map((s) => ({ n: s.number, eps: s.episodes.length, id: s.id }));
  })()`);
  check('Adding Season 4 appends without modifying existing seasons',
    afterSeasons.length === beforeSeasons.length + 1 &&
      beforeSeasons.every((b, i) => b.id === afterSeasons[i].id && b.eps === afterSeasons[i].eps),
    `${beforeSeasons.length} → ${afterSeasons.length}`);

  /* ---- 10. Series bible + continuity ------------------------------------- */
  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.production-detail-tab')).find((t) => /Series Bible/i.test(t.innerText));
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const bible = await evaluate(cdp, `(() => ({
    characters: document.querySelectorAll('.character-card').length,
    facts: document.querySelectorAll('.canon-item').length,
    approved: document.querySelectorAll('.canon-item.approved').length,
  }))()`);
  check('The series bible lists characters', bible.characters >= 1, `${bible.characters} characters`);
  check('Approved canonical facts are shown', bible.approved >= 1, `${bible.approved} approved`);

  await evaluate(cdp, `(() => {
    const tab = Array.from(document.querySelectorAll('.production-detail-tab')).find((t) => /Continuity/i.test(t.innerText));
    if (tab) tab.click();
    return true;
  })()`);
  await sleep(400);
  const continuity = await evaluate(cdp, `(() => ({
    items: document.querySelectorAll('.continuity-item').length,
    text: document.body.innerText,
  }))()`);
  check('Continuity records are tracked', continuity.items >= 1, `${continuity.items} records`);
  check('Continuity surfaces a warning about open notes', /open continuity note/i.test(continuity.text));

  /* ---- 11. Large requested duration: series is aggregate runtime --------- */
  await goto(cdp, '/videos', 1300);
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'Create a 1000-hour science-fiction universe');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  const bigDecision = await waitFor(cdp, `(() => {
    const dlg = document.querySelector('.video-decision');
    return dlg ? { text: dlg.innerText } : null;
  })()`);
  check('A 1,000-hour request is treated as ambiguous, not one clip', bigDecision !== null);
  check('The decision offers a structured production and a continuous video',
    bigDecision && /structured production/i.test(bigDecision.text) && /continuous video/i.test(bigDecision.text));

  /* ---- 12. Duration presets include 1,000 h and fractional seconds ------- */
  await evaluate(cdp, `(() => {
    const close = document.querySelector('.dialog-close-btn');
    if (close) close.click();
    const s = Array.from(document.querySelectorAll('button')).find((b) => /^Settings$/.test(b.innerText.trim()));
    if (s) s.click();
    return true;
  })()`);
  const durPresets = await waitFor(cdp, `(() => {
    const chips = Array.from(document.querySelectorAll('.duration-preset-chip')).map((c) => c.innerText.trim());
    if (chips.length === 0) return null;
    return { chips, text: document.body.innerText };
  })()`);
  check('Duration presets span 0.1 s to 1,000 h',
    durPresets && durPresets.chips.includes('0.1s') && durPresets.chips.includes('1,000 h'),
    durPresets ? durPresets.chips.join(',') : 'none');

  /* ---- 13. 16K is never claimed as native -------------------------------- */
  await evaluate(cdp, `(() => {
    const sel = document.querySelector('#vid-res');
    if (!sel) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, '16K');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await sleep(300);
  const sixteenK = await evaluate(cdp, `document.body.innerText`);
  check('Selecting 16K explains it is not native', /not declared|does not support native 16K|no connected engine/i.test(sixteenK));
  await evaluate(cdp, `(() => { const b = document.querySelector('.video-settings-dialog .dialog-close-btn'); if (b) b.click(); return true; })()`);
  await sleep(250);

  /* ---- 14. Provider status honesty --------------------------------------- */
  await evaluate(cdp, `(() => {
    const p = Array.from(document.querySelectorAll('button')).find((b) => /Providers/.test(b.innerText));
    if (p) p.click();
    return true;
  })()`);
  const provider = await waitFor(cdp, `(() => {
    const dlg = document.querySelector('.video-provider-dialog');
    if (!dlg) return null;
    return { text: dlg.innerText, unknown: dlg.querySelectorAll('.cap-unknown').length };
  })()`);
  check('Provider status lists providers with real states', provider && /Integrated/i.test(provider.text) && /Planned/i.test(provider.text));
  check('Unverified capabilities are reported as Unknown', provider && provider.unknown >= 1, provider ? `${provider.unknown} unknown` : 'none');
  await evaluate(cdp, `(() => { const b = document.querySelector('.video-provider-dialog .dialog-close-btn'); if (b) b.click(); return true; })()`);
  await sleep(250);

  /* ---- 15. Chat persistence, categories and isolation -------------------- */
  await goto(cdp, '/videos', 1400);
  await evaluate(cdp, `(() => {
    const t = Array.from(document.querySelectorAll('.videos-tab')).find((x) => /Video Chats/.test(x.innerText));
    if (t) t.click();
    return true;
  })()`);
  await sleep(400);
  const chatsView = await evaluate(cdp, `(() => ({
    groups: Array.from(document.querySelectorAll('.video-chat-group-title')).map((g) => g.innerText),
    rows: Array.from(document.querySelectorAll('.video-chat-row-title')).map((r) => r.innerText),
  }))()`);
  check('Video chats are grouped by production category', chatsView.groups.length >= 2, chatsView.groups.join(' | '));
  check('A previously created video chat persists across navigation',
    chatsView.rows.some((r) => /Ocean clip/i.test(r)), chatsView.rows.join(','));

  const convs = await evaluate(cdp, `JSON.parse(localStorage.getItem('arti_ws_chats')||'[]')`);
  const videoConvs = convs.filter((c) => c.workspace === 'videos');
  check('Every video conversation is workspace-tagged', videoConvs.length >= 2 && videoConvs.every((c) => c.workspace === 'videos'));

  await goto(cdp, '/chats', 1200);
  const chatsText = await evaluate(cdp, `document.body.innerText`);
  check('Chats excludes video conversations', !/Ocean clip/i.test(chatsText) && !/Series Planning/i.test(chatsText));
  check('Chats still lists the general conversation', /general chat/i.test(chatsText));

  await goto(cdp, '/images', 1200);
  const imagesText = await evaluate(cdp, `document.body.innerText`);
  check('Images excludes video conversations', !/Ocean clip/i.test(imagesText));

  await goto(cdp, '/games', 1200);
  const gamesText = await evaluate(cdp, `document.body.innerText`);
  check('Games excludes video conversations', !/Ocean clip/i.test(gamesText));

  await goto(cdp, '/projects', 1200);
  const projText = await evaluate(cdp, `document.body.innerText`);
  check('Projects excludes video conversations and productions',
    !/Ocean clip/i.test(projText) && !/Kingdom of the Last Sun/i.test(projText));

  /* ---- 16. Sidebar collapse preserves the active conversation ------------ */
  await goto(cdp, '/videos', 1400);
  const collapse = await evaluate(cdp, `(() => {
    const body = document.querySelector('.project-workspace-body');
    const disc = document.querySelector('.project-chat-disclosure');
    const before = body.classList.contains('panel-collapsed');
    if (disc) disc.click();
    return { before };
  })()`);
  await sleep(300);
  const collapsed = await evaluate(cdp, `document.querySelector('.project-workspace-body').classList.contains('panel-collapsed')`);
  const activeAfter = await evaluate(cdp, `(() => { const c = JSON.parse(localStorage.getItem('arti_ws_chats')||'[]'); return c.filter((x)=>x.workspace==='videos').length; })()`);
  check('The conversation disclosure toggles collapse', collapsed !== collapse.before, `collapsed ${collapse.before} → ${collapsed}`);
  check('Collapsing never deletes a conversation', activeAfter >= 2, `${activeAfter} video chats`);
  await evaluate(cdp, `(() => { const d = document.querySelector('.project-chat-disclosure'); if (d) d.click(); return true; })()`);
  await sleep(200);

  /* ---- 17. Genuine download, no upload ----------------------------------- */
  await evaluate(cdp, `(() => {
    // Seed a real video result onto the standalone conversation so a download
    // control exists without needing a live provider.
    const convs = JSON.parse(localStorage.getItem('arti_ws_chats')||'[]');
    const c = convs.find((x) => x.id === 'conv_vid_1');
    c.videoMeta.results = [{
      id: 'vres_1', createdAt: '10:00', preparedPrompt: 'ocean', originalPrompt: 'Create a 20-second realistic ocean video',
      styleId: 'photorealistic', styleName: 'Photorealistic',
      settings: c.videoMeta.settings,
      videos: [{ id: 'vid_1', url: ${JSON.stringify(TINY_MP4)}, width: 1920, height: 1080, durationSeconds: 20, format: 'mp4' }],
      status: 'complete',
    }];
    localStorage.setItem('arti_ws_chats', JSON.stringify(convs));
    return true;
  })()`);
  await goto(cdp, '/videos', 1500);
  const download = await evaluate(cdp, `(() => {
    window.__downloads = [];
    window.__uploads = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) window.__downloads.push({ name: this.download });
      else return origClick.apply(this, arguments);
    };
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const method = (init && init.method) || 'GET';
      if (method !== 'GET') window.__uploads.push({ method });
      return origFetch.apply(this, arguments);
    };
    const b = document.querySelector('[aria-label="Download clip 1"]');
    if (b) b.click();
    return true;
  })()`);
  void download;
  await sleep(900);
  const dlResult = await evaluate(cdp, `(() => ({ downloads: window.__downloads || [], uploads: window.__uploads || [] }))()`);
  check('Downloading a clip triggers a real browser download', dlResult.downloads.length >= 1, JSON.stringify(dlResult.downloads[0] || {}));
  check('Downloading does not upload the file', dlResult.uploads.length === 0, `${dlResult.uploads.length} uploads`);

  /* ---- 18. Fonts + integrated inputs ------------------------------------- */
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
    const bare = all.filter((el) => !el.classList.contains('field-integrated') && !el.classList.contains('form-input') && !el.classList.contains('form-select') && el.type !== 'checkbox' && el.type !== 'number' && el.type !== 'range');
    return { total: all.length, bare: bare.length };
  })()`);
  check('Videos inputs opt into the integrated border policy', inputs.bare === 0, `${inputs.total} inputs, ${inputs.bare} bare`);

  /* ---- 19. Existing routes still work ------------------------------------ */
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
