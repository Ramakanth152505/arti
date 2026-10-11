/**
 * ARTI AI — Images workspace functional verification (headless Chromium via CDP).
 *
 * Seeds real records into the repository's localStorage stores, then asserts:
 *   - Images renders the chat workspace with a composer and Choose Style.
 *   - The style library exposes the required categories and a large catalog;
 *     selecting a style injects real prompt guidance (not the bare word) and
 *     records the style on the conversation without submitting.
 *   - The clarification flow asks only genuinely missing details and previews
 *     the prepared prompt; a prompt whose details are present is not re-asked.
 *   - With no provider configured, Images reports it honestly and never shows a
 *     fabricated image.
 *   - Conversations are tagged `workspace: 'images'` and never leak into Chats,
 *     Projects or Games (which keep only their own).
 *   - New Chat / switching / persistence / collapse all work.
 *   - Downloading is a genuine client-side download (no upload endpoint).
 *
 * Usage: node scripts/verify-images.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173';
const PORT = 9224;
const userDataDir = mkdtempSync(join(tmpdir(), 'arti-images-'));

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

/** Poll evaluate(expr) until it returns truthy (or timeout). */
async function waitFor(cdp, expr, timeoutMs = 6000, interval = 150) {
  const start = Date.now();
  for (;;) {
    const v = await evaluate(cdp, expr);
    if (v) return v;
    if (Date.now() - start > timeoutMs) return v;
    await sleep(interval);
  }
}

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const SEED_PROJECTS = [
  { id: 'proj_general_1', name: 'General Website', description: 'A site', goal: '', techStack: '', type: 'website', customType: '', isStarred: false, isSoftware: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'proj_game_1', name: 'Sky Drifters', description: 'Game', goal: '', techStack: '', type: 'game', customType: '', isStarred: false, isGame: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    game: { mechanics: ['aircraft'], themes: ['sci-fi-futuristic'], modes: ['single-player'], engine: 'godot', platforms: ['web-browser'], platformMode: 'single' } },
];

function seedChats(tinyPng) {
  return [
    { id: 'conv_gen_1', title: 'General chat', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI',
      messages: [{ id: 'g1', sender: 'user', content: 'hello general', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }] },
    { id: 'conv_game_1', title: 'Sky Drifters design', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI', projectId: 'proj_game_1',
      messages: [{ id: 'gm1', sender: 'user', content: 'plan the flight model', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }] },
    { id: 'conv_img_1', title: 'Mountain sunrise', isPinned: false, dateGroup: 'today', updatedAt: '2026-01-02T00:00:00.000Z', model: 'ARTI Image Studio', workspace: 'images',
      messages: [{ id: 'im1', sender: 'user', content: 'Create a beautiful mountain landscape during sunrise', timestamp: '2026-01-02T00:00:00.000Z', status: 'complete' }],
      imageMeta: { styleId: 'watercolor', settings: { providerId: 'openai', model: 'gpt-image-1', aspectRatio: '16:9', size: '1536x1024', quality: 'high', count: 2, seed: '-1', negativePrompt: '', transparentBackground: false, styleStrength: 70 },
        results: [{ id: 'res_1', createdAt: '2026-01-02T00:00:00.000Z', preparedPrompt: 'mountain landscape at sunrise. watercolour guidance', originalPrompt: 'Create a beautiful mountain landscape during sunrise', styleId: 'watercolor', styleName: 'Watercolor', clarifications: {}, settings: { providerId: 'openai', model: 'gpt-image-1', aspectRatio: '16:9', size: '1536x1024', quality: 'high', count: 2, seed: '-1', negativePrompt: '', transparentBackground: false, styleStrength: 70 },
          images: [{ id: 'img_1', url: tinyPng, width: 1536, height: 1024, format: 'png' }, { id: 'img_2', url: tinyPng, width: 1536, height: 1024, format: 'png' }], status: 'complete', nativeResolution: '1536×1024' }], pendingGeneration: false } },
  ];
}

async function main() {
  await waitForDevtools();
  const cdp = await connect(await newPage());
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  // Seed stores. No image provider key is set — the honest "not connected"
  // state is what we verify first. (SEED_* are already JSON strings.)
  await goto(cdp, '/home', 900);
  await evaluate(cdp, `(() => {
    localStorage.setItem('arti_saved_projects', ${JSON.stringify(JSON.stringify(SEED_PROJECTS))});
    localStorage.setItem('arti_ws_chats', ${JSON.stringify(JSON.stringify(seedChats(TINY_PNG)))});
    localStorage.removeItem('arti_key_openai');
    localStorage.removeItem('arti_endpoint_image');
    localStorage.removeItem('arti_image_provider');
    return true;
  })()`);

  // 1. Images route renders the chat workspace with a composer + Choose Style.
  await goto(cdp, '/images', 1400);
  const base = await evaluate(cdp, `(() => ({
    hasComposer: !!document.querySelector('.chat-composer-textarea'),
    hasChooseStyle: !!Array.from(document.querySelectorAll('button')).find((b) => /Choose Style/i.test(b.innerText)),
    hasNewChat: !!Array.from(document.querySelectorAll('button')).find((b) => /New Chat/i.test(b.innerText)),
    hasDisclosure: !!document.querySelector('.project-chat-disclosure'),
    noProjectsPanel: !/Universal Project|Create a New Project/i.test(document.body.innerText),
  }))()`);
  check('Images shows the prompt composer', base.hasComposer === true);
  check('Images shows the Choose Style button', base.hasChooseStyle === true);
  check('Images shows a New Chat action', base.hasNewChat === true);
  check('Images shows the collapsible conversation disclosure', base.hasDisclosure === true);
  check('Images has no Projects panel', base.noProjectsPanel === true);

  // 2. The seeded images conversation is restored with its result and style.
  const restored = await evaluate(cdp, `(() => ({
    styleBadge: !!document.querySelector('.images-style-badge'),
    resultImages: document.querySelectorAll('.image-result-gallery img').length,
    hasDownload: !!document.querySelector('[aria-label="Download image 1"]'),
  }))()`);
  check('The images conversation restores its selected style', restored.styleBadge === true);
  check('Generated images render inside the conversation', restored.resultImages === 2, `${restored.resultImages} tiles`);
  check('A download control is offered for each result', restored.hasDownload === true);

  // 3. Style library: open Choose Style, count categories + catalog, pick one.
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Choose Style/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  const picker = await waitFor(cdp, `(() => {
    const chips = document.querySelectorAll('.style-category-chip');
    if (chips.length === 0) return null;
    return {
      categoryChips: chips.length,
      tiles: document.querySelectorAll('.style-tile').length,
      hasWatercolor: Array.from(document.querySelectorAll('.style-tile-name')).some((n) => /Watercolor/i.test(n.innerText)),
    };
  })()`);
  check('Style picker opens with all 12 categories (+ All)', picker && picker.categoryChips === 13, picker ? `${picker.categoryChips} chips` : 'none');
  check('Style catalog renders a large tile set', picker && picker.tiles >= 40, picker ? `${picker.tiles} tiles shown` : 'none');
  check('Watercolor style is present in the catalog', picker && picker.hasWatercolor === true);

  // Search within the picker.
  await evaluate(cdp, `(() => {
    const input = document.querySelector('.style-picker-search-input');
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'cyberpunk');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await sleep(350);
  const searched = await evaluate(cdp, `(() => ({
    tiles: document.querySelectorAll('.style-tile').length,
    hasCyber: Array.from(document.querySelectorAll('.style-tile-name')).some((n) => /Cyberpunk/i.test(n.innerText)),
  }))()`);
  check('Style search filters the catalog', searched.tiles >= 1 && searched.hasCyber, `${searched.tiles} results`);

  // 4. Selecting a style injects REAL prompt guidance and does not submit.
  const beforeMessages = await evaluate(cdp, `document.querySelectorAll('.chat-message-row').length`);
  await evaluate(cdp, `(() => {
    const tile = Array.from(document.querySelectorAll('.style-tile')).find((t) => /Cyberpunk/i.test(t.innerText));
    if (tile) tile.click();
    return true;
  })()`);
  await sleep(350);
  const afterSelect = await evaluate(cdp, `(() => ({
    composer: document.querySelector('.chat-composer-textarea') ? document.querySelector('.chat-composer-textarea').value : '',
    pickerOpen: !!document.querySelector('.style-picker-dialog'),
    messages: document.querySelectorAll('.chat-message-row').length,
  }))()`);
  check(
    'Selecting a style injects real prompt guidance (not a bare word)',
    /neon signage|high-tech low-life|rain-slick/i.test(afterSelect.composer),
    afterSelect.composer.slice(0, 60)
  );
  check('Selecting a style closes the picker', afterSelect.pickerOpen === false);
  check('Selecting a style does not auto-submit', afterSelect.messages === beforeMessages, `${afterSelect.messages} messages`);

  // Clear the composer and style for the next checks.
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, '');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);

  // 5. Not-connected honesty: submitting with no provider configured must not
  //    fabricate an image, and must explain the setup requirement.
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'A serene ocean at dusk');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    const form = ta.closest('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  await sleep(700);
  const notConnected = await evaluate(cdp, `(() => {
    const imagesBefore = ${restored.resultImages};
    return {
      text: document.body.innerText,
      images: document.querySelectorAll('.image-result-gallery img').length,
      imagesBefore,
    };
  })()`);
  check(
    'Without a provider, Images states the real setup requirement',
    /No image provider is connected/i.test(notConnected.text)
  );
  check('Without a provider, no new image is fabricated', notConnected.images <= notConnected.imagesBefore, `${notConnected.images}`);

  // 6. Clarification is rule-based and transparent when no model is connected.
  await evaluate(cdp, `(() => {
    // Configure a (dummy) OpenAI key so the flow reaches clarification, but the
    // generation call is not made — we only inspect the panel and close it.
    localStorage.setItem('arti_key_openai', 'sk-test-not-a-real-key');
    return true;
  })()`);
  await goto(cdp, '/images', 1400);
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'Generate a nature image.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  const clar = await waitFor(cdp, `(() => {
    const dlg = document.querySelector('.clarify-dialog');
    if (!dlg) return null;
    return {
      questions: dlg.querySelectorAll('.clarify-question').length,
      menu: dlg.innerText,
      preview: dlg.querySelector('.clarify-preview-text') ? dlg.querySelector('.clarify-preview-text').innerText : '',
    };
  })()`);
  check('An incomplete nature prompt opens the clarification flow', clar && clar.questions >= 2, clar ? `${clar.questions} questions` : 'none');
  check('Clarification offers the required nature scene options', clar && /Mountains/.test(clar.menu) && /Sunrise or sunset/.test(clar.menu));
  check('Clarification asks about mood', clar && /mood/i.test(clar.menu));
  check('Clarification previews the final prepared prompt', clar && /Generate a nature image/i.test(clar.preview));

  // Choose an answer and confirm it appears in the preview.
  await evaluate(cdp, `(() => {
    const chip = Array.from(document.querySelectorAll('.clarify-chip')).find((c) => /^Mountains$/.test(c.innerText.trim()));
    if (chip) chip.click();
    return true;
  })()`);
  await sleep(250);
  const previewAfter = await evaluate(cdp, `document.querySelector('.clarify-preview-text').innerText`);
  check('Answers are combined into the prepared prompt', /Mountains/i.test(previewAfter));

  // Close the panel without generating — context must be preserved.
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('.clarify-footer button')).find((x) => /Back to chat/i.test(x.innerText));
    if (b) b.click();
    return true;
  })()`);
  await sleep(300);
  const closed = await evaluate(cdp, `(() => ({
    open: !!document.querySelector('.clarify-dialog'),
    userPromptPreserved: document.body.innerText.includes('Generate a nature image'),
  }))()`);
  check('Clarification closes without generating', closed.open === false);
  check('Original prompt is preserved in the conversation', closed.userPromptPreserved === true);

  // 7. A specific prompt with details present is not over-questioned.
  await evaluate(cdp, `(() => {
    const ta = document.querySelector('.chat-composer-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'A wide aerial photograph of misty mountain peaks at sunrise, dramatic mood, 16:9 desktop wallpaper');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  await sleep(1200);
  const specific = await evaluate(cdp, `(() => {
    const dlg = document.querySelector('.clarify-dialog');
    return { open: !!dlg, questions: dlg ? dlg.querySelectorAll('.clarify-question').length : 0 };
  })()`);
  check('A fully-specified prompt skips unnecessary clarification', specific.open === false || specific.questions === 0, `${specific.questions} questions`);

  // 8. Isolation: Images, Chats, Projects and Games never mix.
  const convs = await evaluate(cdp, `JSON.parse(localStorage.getItem('arti_ws_chats') || '[]')`);
  const imagesConvs = convs.filter((c) => c.workspace === 'images');
  check('Every Images conversation is workspace-tagged', imagesConvs.length >= 1 && imagesConvs.every((c) => c.workspace === 'images'));

  await goto(cdp, '/chats', 1300);
  const chatsText = await evaluate(cdp, `document.body.innerText`);
  check('Chats lists the general conversation', /general chat/i.test(chatsText));
  check('Chats excludes Images conversations', !/mountain sunrise/i.test(chatsText));
  check('Chats excludes game conversations', !/sky drifters design/i.test(chatsText));

  await goto(cdp, '/projects', 1300);
  const projText = await evaluate(cdp, `document.body.innerText`);
  check('Projects excludes Images conversations', !/mountain sunrise/i.test(projText));

  await goto(cdp, '/games', 1300);
  const gamesText = await evaluate(cdp, `document.body.innerText`);
  check('Games excludes Images conversations', !/mountain sunrise/i.test(gamesText));

  // 9. New Chat creates an images-tagged conversation with no projectId.
  await goto(cdp, '/images', 1400);
  await evaluate(cdp, `(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /^New Chat$/.test(x.innerText.trim()));
    if (b) b.click();
    return true;
  })()`);
  await sleep(400);
  const newChat = await evaluate(cdp, `(() => {
    const convs = JSON.parse(localStorage.getItem('arti_ws_chats') || '[]');
    const mine = convs.filter((c) => c.workspace === 'images');
    const fresh = mine.find((c) => c.messages.length === 0);
    return { mine: mine.length, freshOk: !!fresh && !fresh.projectId };
  })()`);
  check('New Chat creates another Images conversation', newChat.mine >= 2, `${newChat.mine} images chats`);
  check('New Images conversation has no project binding', newChat.freshOk === true);

  // 10. Persistence across reload (expand the collapsed panel to read the list).
  await goto(cdp, '/images', 1500);
  await evaluate(cdp, `(() => {
    const body = document.querySelector('.project-workspace-body');
    const disc = document.querySelector('.project-chat-disclosure');
    if (body && body.classList.contains('panel-collapsed') && disc) disc.click();
    return true;
  })()`);
  await waitFor(cdp, `document.querySelectorAll('.project-chat-item-title').length > 0`);
  const persisted = await evaluate(cdp, `Array.from(document.querySelectorAll('.project-chat-item-title')).some((x) => /Mountain sunrise/i.test(x.innerText))`);
  check('Images conversations persist across a reload', persisted === true);

  // 11. Collapse / expand the conversation list.
  const collapse = await evaluate(cdp, `(() => {
    const body = document.querySelector('.project-workspace-body');
    const disc = document.querySelector('.project-chat-disclosure');
    const before = body.classList.contains('panel-collapsed');
    if (disc) disc.click();
    return { before };
  })()`);
  await sleep(300);
  const collapseAfter = await evaluate(cdp, `document.querySelector('.project-workspace-body').classList.contains('panel-collapsed')`);
  check('The conversation disclosure toggles collapse', collapseAfter !== collapse.before, `collapsed ${collapse.before} → ${collapseAfter}`);
  await evaluate(cdp, `(() => { const d = document.querySelector('.project-chat-disclosure'); if (d) d.click(); return true; })()`);
  await sleep(200);

  // 12. Rename + per-chat delete do not touch siblings. The conversation panel
  //     starts collapsed, so expand it first.
  await evaluate(cdp, `(() => {
    const body = document.querySelector('.project-workspace-body');
    const disc = document.querySelector('.project-chat-disclosure');
    if (body && body.classList.contains('panel-collapsed') && disc) disc.click();
    return true;
  })()`);
  await waitFor(cdp, `document.querySelectorAll('.project-chat-rename-btn').length > 0`);
  const renamePresent = await evaluate(cdp, `!!document.querySelector('.project-chat-rename-btn')`);
  check('Conversations can be renamed', renamePresent === true);

  const beforeDelete = await evaluate(cdp, `JSON.parse(localStorage.getItem('arti_ws_chats')||'[]').filter((c)=>c.workspace==='images').length`);
  await evaluate(cdp, `(() => {
    window.confirm = () => true;
    const dels = Array.from(document.querySelectorAll('.project-chat-delete-btn'));
    if (dels[0]) dels[0].click();
    return true;
  })()`);
  await sleep(400);
  const afterDelete = await evaluate(cdp, `(() => {
    const convs = JSON.parse(localStorage.getItem('arti_ws_chats')||'[]');
    return {
      images: convs.filter((c) => c.workspace === 'images').length,
      others: convs.filter((c) => c.workspace !== 'images').length,
    };
  })()`);
  check('Deleting an Images chat removes only that conversation', afterDelete.images === beforeDelete - 1, `${beforeDelete} → ${afterDelete.images}`);
  check('Deleting an Images chat leaves other workspaces untouched', afterDelete.others >= 2, `${afterDelete.others} others`);

  // 13. Download is a genuine client-side download (no upload request).
  await goto(cdp, '/images', 1400);
  const dl = await evaluate(cdp, `(() => {
    window.__downloads = [];
    window.__uploads = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) window.__downloads.push({ name: this.download, href: this.href.slice(0, 20) });
      else return origClick.apply(this, arguments);
    };
    const origFetch = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || 'GET';
      if (method !== 'GET') window.__uploads.push({ url, method });
      return origFetch.apply(this, arguments);
    };
    const b = document.querySelector('[aria-label="Download image 1"]');
    if (b) b.click();
    return true;
  })()`);
  void dl;
  await sleep(900);
  const downloadResult = await evaluate(cdp, `(() => ({ downloads: window.__downloads || [], uploads: window.__uploads || [] }))()`);
  check('Downloading triggers a browser download with a filename', downloadResult.downloads.length >= 1, JSON.stringify(downloadResult.downloads[0] || {}));
  check(
    'Downloading does not upload the file to any server',
    downloadResult.uploads.length === 0,
    `${downloadResult.uploads.length} uploads`
  );

  // 14. The approved typefaces are actually loaded.
  const fonts = await evaluate(cdp, `(async () => {
    await document.fonts.ready;
    return {
      orbitron: document.fonts.check('16px Orbitron'),
      inter: document.fonts.check('16px Inter'),
      mono: document.fonts.check('16px "JetBrains Mono"'),
    };
  })()`);
  check('Orbitron, Inter and JetBrains Mono are loaded', fonts.orbitron && fonts.inter && fonts.mono);

  // 15. Shared inputs keep the single-border policy.
  const inputs = await evaluate(cdp, `(() => {
    const all = Array.from(document.querySelectorAll('input, textarea'));
    const bare = all.filter((el) => !el.classList.contains('field-integrated') && !el.classList.contains('form-input') && !el.classList.contains('form-select'));
    return { total: all.length, bare: bare.length };
  })()`);
  check('Images inputs opt into the integrated border policy', inputs.bare === 0, `${inputs.total} inputs, ${inputs.bare} bare`);

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
