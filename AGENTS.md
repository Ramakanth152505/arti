# ARTI AI — Project Instructions

## Typography (permanent)

**ARTI AI USES A THREE-FAMILY SYSTEM. All three are self-hosted under
`public/fonts/` (OFL-licensed `*-OFL.txt` beside each) and must be used via the
central tokens — never hardcoded per component.**

- **Orbitron** — brand/wordmark + major product identity titles. Token:
  `--font-brand`. Use it on brand-level headings only, not long body headings.
- **Inter** — the whole functional interface: dashboard, navigation, projects,
  search, chat, composer, forms, settings, errors, mobile. Token:
  `--font-primary` / `--font-sans`.
- **JetBrains Mono** — code blocks, terminal output, logs, structured technical
  output. Token: `--font-mono`. Never for ordinary interface text.
- `--font-serif` is a legacy alias kept for older rules; it resolves to the
  interface family, not to a serif.

Rules:
- Never hardcode a `font-family` with a named unrelated family, and never add a
  `<link>`/`@import` to an external font provider.
- Verified weights are only 300 (Light) and 400 (Regular). Use the `--fw-*`
  tokens; do not request other weights.
- Prefer the semantic utility classes (`.t-hero`, `.t-page-title`, `.t-h2`…`.t-h5`,
  `.t-body`, `.t-label`, `.t-caption`).
- The approved families cover Latin + Latin Extended. Telugu/Devanagari fall
  back to the system font; that fallback must never become the default for
  ordinary UI text.
- Enforce with `npm run check:typography` (also runs as part of `npm run lint`).

## Integrated inputs (permanent)

Premium pill composers/search fields must show exactly one border and one focus
ring, at the container level — never a nested second rectangle from the inner
`<input>`.

- Any `<input>`/`<textarea>` placed inside a rounded, bordered wrapper must carry
  the `.field-integrated` class. Its policy block lives in
  `src/styles/responsive.css` (`.field-integrated`, with the container
  `:focus-within` as the sole focus surface).
- Do not add a broad `input { border: none }` rule; the opt-in class is the
  contract so native inputs on ordinary forms keep their borders.

## Conversation workspace (Home → chat)

- The Home prompt composer (`src/components/home/PromptBox.tsx`) submits to the
  dedicated conversation route: `navigate('conversation', { prompt })`. The
  initial message travels in the URL, is sent from the workspace, and is then
  replaced in history (`replace`) so refresh/back never resends it.
- Route ids live in `src/types/navigation.ts` (`RouteId`); the switch is in
  `src/components/shell/AppShell.tsx`. `conversation` renders
  `ConversationWorkspace`; `chats` keeps the multi-conversation list view.
- Conversation state is the single observable store `src/services/chatStore.ts`
  (`useSyncExternalStore` + localStorage `arti_ws_chats`). Chats and the
  conversation workspace both read it, so they never diverge. Persistence is
  browser-local only — never claim server-side history.
- Message UI is shared and **speakerless** (`src/components/conversation/`):
  `MessageList` conveys ownership by alignment/surface only (user right, AI
  left). Never render names, avatars, role badges or speaker headings on
  individual messages; expose them to assistive tech via `aria-label` instead.
  `Composer` is the shared multiline composer (Enter sends, Shift+Enter
  newline, IME-safe, Stop while pending).
- AI responses go through the single boundary `src/services/aiService.ts`
  (Anthropic or OpenAI, key read from Settings' localStorage). No other module
  may fabricate, mock, or simulate a model response. When no provider is
  configured the workspace shows an honest "Not connected" state with a link to
  Settings > Connected Services.

## Build / verify

- `npm run build` — `tsc -b && vite build` must pass.
- `npm run lint` — `oxlint` + typography policy check must pass.
- `npm run test:responsive [baseUrl]` — headless-Chromium (CDP, no extra
  deps) overflow scan of every route × the required viewport set. The bar is
  zero horizontal overflow.

## Projects & Create Software (project-linked conversations)

- Projects are the parent record. `src/services/projectStore.ts` is the single
  observable store (`useSyncExternalStore`, localStorage `arti_saved_projects`),
  replacing the old in-component project state. Stable ids are `proj_*`.
- Conversations live in `src/services/chatStore.ts`; a project conversation
  carries `projectId`. Every project chat must store the correct `projectId` so
  chats never appear under an unrelated project. Create/switch/delete all target
  a single conversation id and never touch the parent project.
- The Projects route (`projects`) renders the overview; `projects?id=<id>`
  renders that project's workspace (`ProjectWorkspaceView`) with its own
  collapsible conversation panel, `New Chat`, and per-chat delete. No artificial
  chat-count limit is imposed.
- The project conversation panel is a disclosure control: `.project-chat-panel`
  starts collapsed (`panel-collapsed`, no persisted open state) and the
  `.project-chat-disclosure` button toggles `panel-open`; the choice is
  remembered in localStorage `arti_project_chat_panel_open`. Collapsing must
  preserve the active conversation and never delete data.
- `create-software` (`CreateSoftwareWorkspace`) and the Apps workspace share the
  one creation form: `src/components/software/SoftwareClassificationForm.tsx`.
  It captures the two independent classifications (core functional +
  technology/domain, defined in `projectStore.ts`) and the target-platform
  configuration, then creates a real `isSoftware` project seeded with a first
  planning conversation. It must never claim to generate, compile, sign, or
  deploy software — that engine is not connected.
- Every software project carries `coreClassification`, `domains[]`,
  `platforms[]`, `platformMode` (`single` | `cross-platform` | `all-platforms`)
  in `projectStore`. `resolveTargets()` enumerates the honest platform matrix;
  no target is marked build-ready/verified in this build.
- Project Settings (`src/components/software/ProjectSettingsPanel.tsx`) is
  reachable from the project header and from Apps cards. Its `Perform Tests`
  action calls `src/services/testRunner.ts`, which reports `not-configured` when
  nothing is set up and `blocked` when a command exists but cannot run here —
  never a fabricated pass/fail or coverage number.
- Project delete removes the project **and** its conversations
  (`chatStore.deleteProjectConversations`) behind an explicit confirm.

## Sidebar navigation

- Primary items run Home → Tools, then `Create Software` (route `create-software`),
  then the Preferences group. Knowledge Base, Marketplace, Websites and the
  former System Operations entries are intentionally **not** in the primary
  sidebar; their routes/workspaces remain registered in `AppShell` and reachable
  (e.g. via Ctrl+K search) so nothing was deleted. Websites keeps its route and
  implementation — it is only removed from the visible primary list.


## Honesty rules

- Never present fabricated data as real. Demo/sample content must be labelled
  (see `DemoDataNotice`) or persisted locally via `useWorkspaceData`
  (localStorage, local-first).

## Responsive architecture

- Stylesheet entry is `src/index.css`; import order is fixed and must stay:
  `typography.css` → `base.css` → `workspaces.css` → `conversation.css` →
  `responsive.css`.
  `base.css` holds the original base component rules; `conversation.css` refines
  the chat/conversation surfaces; `responsive.css` is the responsive layer.
  Base rules must never be re-inlined after the `@import`s or they win the
  equal-specificity cascade and silently break responsive overrides.
- Responsive tokens (`--page-pad-x`, `--content-max-w`, `--mobile-drawer-w`,
  `--touch-target`, fluid `--fs-*` clamps, …) live at the top of
  `responsive.css`. Prefer them over new hardcoded breakpoints.
- Breakpoints: `<=767.98px` phone, `<=1023.98px` overlay-drawer navigation,
  `>=1600px` / `>=1920px` wide-screen content caps.
- JS-only responsive behaviour (drawer, chat sidebar) uses
  `src/hooks/useMediaQuery.ts` (`useIsMobileNav`), which is backed by
  `useSyncExternalStore`. Layout must not depend on resize listeners.
- Every interactive control needs a comfortable target on small screens; the
  `max-width: 767.98px` block guarantees `--touch-target` (44px) regardless of
  the reported pointer type.
- Verify with an emulated cross-device overflow scan (headless Chromium via CDP)
  across the viewport set 320/360/375/390/430/768/820/1024/1280/1366/1440/1920/2560
  for every route; the acceptance bar is zero horizontal overflow.

## Games workspace (game-linked projects)

- Games is its own record type, **not** a general project. `projectStore.createGame`
  writes `isGame: true`, `type: 'game'` and a `game: GameMetadata` blob.
- Isolation is by flag, not by a second store: the general Projects list filters
  `!isGame && !isSoftware`, Apps filters `isSoftware`, Games filters `isGame`.
  A game must never appear in Projects, and a software/general project must never
  appear in Games.
- `src/services/gameTaxonomy.ts` is the single source for the game catalogue:
  13 `MECHANIC_GROUPS`, 15 `WORLD_THEMES`, 11 `GAME_MODES`, `GAME_ENGINES`
  (each with an honest `capability` note), `GAME_PLATFORMS` (each with a real
  `status`/`statusNote`) and `MULTIPLAYER_REQUIREMENTS`. `resolveGameTargets`
  enumerates `single` / `cross-platform` / `all-platforms`; consoles and VR stay
  `not-supported` / `dependencies-required` — never marked verified.
- `src/components/games/GameCreationForm.tsx` (creation), `GameWorkspaceView.tsx`
  (workspace) and `GameSettingsPanel.tsx` (settings/status) reuse the shared
  `Composer`/`MessageList`, the project chat panel pattern, and
  `useConversationFocus`. Game chats live in the shared `chatStore` keyed by
  `projectId`; opening a game re-selects one of **its own** conversations.
- No engine, SDK, compiler or asset pipeline is connected here: never claim a
  generated/compiled/playable build. Statuses come from real capability data only.

## Distraction-free conversation mode (shared)

- `src/hooks/useConversationFocus.ts` is the one interaction model (Games,
  Projects/Apps workspaces, and other conversation surfaces). It publishes
  `isFocusMode` / `isFocusChromeRevealed` to `WorkspaceContext`; `AppShell`
  derives `focusActive` and applies `.focus-mode` to temporarily de-emphasise the
  navigation rail.
- Reveal is never mouse-only: mouse move, keyboard `focusin`, key presses and an
  explicit toggle (`focus-reveal-pill`) all work. Chrome is never hidden while
  typing, while a `[role="dialog"][aria-modal="true"]` is open, or while the
  pointer is inside the workspace. Route changes always reset focus state so the
  shell can never be stranded collapsed.

## Images workspace (image-linked conversations)

- Images is its own conversation workspace, **not** a project. Every Images
  conversation is tagged `workspace: 'images'` on the shared `chatStore` record
  (via `chatStore.createWorkspaceConversation('images', …)`) and carries an
  optional `imageMeta` blob (`styleId`, `settings`, `results[]`,
  `pendingGeneration`). Chats list only `general` conversations, so Images chats
  never leak into Chats/Projects/Games — and vice versa. An image conversation is
  never moved into Projects automatically.
- `src/services/imageStyles.ts` is the single source for the style library:
  12 categories and 167 data-driven `IMAGE_STYLES`, each with real
  `promptGuidance` (and optional `negativeGuidance`). Select a style →
  `handleSelectStyle` records `styleId` and appends the style's *guidance* to the
  composer (never the bare style name) **and never auto-submits**.
- `src/services/imageService.ts` is the single generation boundary. Two honest
  paths: `openai` (direct browser call using the OpenAI key already in
  `arti_key_openai`, opt-in) and `custom-server` (owner-run bridge at
  `arti_endpoint_image` — recommended; provider credentials stay server-side).
  `resolveSize` maps an aspect ratio to a size token the model actually accepts.
  Capability data (`IMAGE_PROVIDERS`) drives which settings controls render; a
  model-unsupported control is shown as "not supported", never as a working
  toggle. No 16K native generation is claimed — resolution is whatever the
  provider returns, and upscaling is only reported when a real step produced it.
- `src/services/imageClarify.ts` is the intelligent clarification engine. With a
  language model connected it uses `aiService`; otherwise a transparent
  rule-based analyser (labelled as such in the UI). It only asks genuinely
  unresolved details and previews the final prepared prompt before submitting.
- `src/services/imageDownload.ts` performs a genuine client-side download. The
  file is never uploaded to ARTI or any other service; a failed remote fetch is
  reported honestly, not faked as success.
- `src/components/workspaces/images/ImagesWorkspace.tsx` is the workspace (route
  `images`): collapsible conversation disclosure + New Chat, the shared
  `Composer`/`MessageList` (speakerless), `Choose Style` in the upper right, a
  `Settings` panel, a `Gallery` dialog, and `focus-reveal-pill` distraction-free
  mode via `useConversationFocus`. Sub-components live in
  `src/components/images/`. Styles in `src/styles/images.css` (imported between
  `workspaces.css` and `conversation.css`).
- Configure the image provider in Settings > Connected Services
  (`arti_image_provider`, `arti_endpoint_image`, `arti_key_image`,
  `arti_image_model`). When nothing is configured the workspace states the real
  setup requirement and never fabricates an image.

## Verification

- `npm run test:games [baseUrl]` — headless-Chromium (CDP, no extra deps)
  functional suite: Games/Projects/Apps isolation, focus mode, multi-chat
  binding, per-chat delete, taxonomy counts, platform honesty, font loading and
  the integrated-input policy. Currently 31 checks.
- `npm run test:images [baseUrl]` — headless-Chromium Images suite: workspace
  shell, style library (12 categories, 167 tiles), style → guidance injection
  without submit, rule-based clarification and prepared-prompt preview,
  not-connected honesty, workspace isolation from Chats/Projects/Games,
  New Chat / persistence / collapse / rename / delete, genuine client-side
  download with no upload, font loading and input policy. Currently 42 checks.


