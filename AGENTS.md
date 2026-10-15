# ARTI AI — Project Instructions

## Colour system (permanent, strict)

**ARTI AI USES EXACTLY THREE COLOURS. No fourth colour is permitted anywhere
in the product — not in CSS, not in inline styles, not in SVG, not in image
assets, not in meta tags.**

- **Navy `#1F2A44`** — backgrounds, shell, sidebar, primary surfaces. The base
  canvas for every route.
- **Warm Beige `#E8DCC8`** — light content surfaces and text. The primary
  reading colour on navy.
- **Soft Gold `#C6A75E`** — the single accent: focus rings, active indicators,
  primary buttons, emphasis, dividers.

Rules:
- The canonical tokens live in `src/styles/base.css` `:root`
  (`--arti-navy`, `--arti-beige`, `--arti-gold`, plus the derived
  `--bg-*`, `--gold-*`, `--text-*`, `--border-*`). Reference those; do not
  introduce a new token for a new hue — there is none.
- Hierarchy comes from **type scale**, **weight**, **spacing** and **surface
  elevation** — never from a new hue and never from translucency. The palette is
  declared as solid hex only: no `rgba()`/`hsla()`, no `opacity`/`color-mix()`,
  no filters, no blending and no extra hex values. A translucent wash resolves
  either to `transparent` (so the navy shell shows through) or to one of the
  three solid colours.
- The palette is **fixed and not user-selectable**. There is no theme switcher:
  `AppTheme` is the single token `'arti-approved'`, and Settings presents the
  three colours as informational swatches. Do not reintroduce a theme picker,
  a `data-theme` attribute or any alternate palette name.
- Status is never carried by hue alone. `idle` / `running` / `failed` /
  `blocked` are distinguished by surface, motion and the accompanying text label
  (`--mo-state-*` in `motion.css`, `INDICATOR_ACCENT` in `motion/primitives.tsx`).
- `transparent`, `currentColor`, `inherit` and `none` are keywords, not colours,
  and remain permitted.
- Image assets (`public/assets/*.png`) are quantised to the three colours; do
  not add an asset that introduces an off-palette colour. The brand mark and
  cinematic backdrop are intentionally palette-mapped PNGs.
- Enforce with `npm run check:colors` (source-level, also runs as part of
  `npm run lint`) and `npm run test:palette` (runtime CSSOM audit across every
  route — catches gradients, shorthands and third-party components).

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

## Videos workspace (video-linked productions)

- Videos is its own conversation + production workspace, **not** a project. A
  video conversation is tagged `workspace: 'videos'` on the shared `chatStore`
  (`chatStore.createVideoConversation`) and carries a `videoMeta` blob
  (`category`, `videoType`, `styleId`, `styleGuidance`, `settings`, `results[]`,
  `pendingGeneration`, `productionId?`). Chats lists only `general`
  conversations, so video chats never leak into Chats/Projects/Games/Images —
  and vice versa. A video chat is never moved into Projects automatically.
- Two creation modes live in the same workspace and are never confused:
  **Individual Video Creation** (one video with configurable duration, style,
  resolution, aspect ratio, settings) and **Series & Cinematic Universe
  Creation** (a production with seasons → episodes → scenes → shots).
- `src/services/videoStyles.ts` is the single source for the visual style
  library: 7 categories and ~137 data-driven `VIDEO_STYLES`, each with real
  `promptGuidance`. Style describes *how* a video looks.
- `src/services/videoTypes.ts` is the single source for the video *type*
  taxonomy (82 `VIDEO_TYPES`, 5 categories, each flagged `structured`) plus the
  duration model (`parseDuration`/`formatDuration`, 0.1 s → 1,000 h+) and
  `classifyVideoIntent`, which reads a request and reports whether it is one
  clip, a long continuous video, an episodic/multi-season series, a franchise,
  a continuation, or genuinely `ambiguous`. Type is independent of style.
- Selecting a style inserts the style's real guidance into the composer via
  `insertStyleIntoPrompt` (never the bare name), preserves the user's text,
  never duplicates, and **never auto-submits**. Removing it uses
  `removeStyleFromPrompt`.
- `src/services/videoProvider.ts` is the single generation boundary and the
  honest capability registry. Only `custom-server` (an owner-run bridge at
  `arti_endpoint_video`) is genuinely integrated; commercial engines are listed
  with their real state and an unverified capability is reported `unknown`.
  `validateContinuousDuration` reports the engine's real clip limit (or that it
  is unknown), and `sixteenKStatement` never claims native 16K.
- `src/services/videoGeneration.ts` builds the structured prompt
  (`videoPrompt.ts`) and maps a real bridge response into a persisted result; a
  failure yields a `failed` record with the real error and no engine yields a
  `blocked` record.
- `src/services/videoProduction.ts` is the single observable store
  (`useSyncExternalStore`, localStorage `arti_video_productions`) for the
  hierarchy Franchise → Series → Season → Episode → Scene → Shot → Job → Asset,
  plus the series bible and continuity records. `productionOverview` and
  `buildManifest` compute the dashboard and the (paginated) episode manifest
  from real records — completion is never fabricated. Every node has a stable id
  so regenerating one shot never touches a sibling or the rest of the season;
  a failed job never removes successful output.
- The workspace (route `videos`) renders five tabs — Create Video, Create
  Series, My Productions, Video Chats, Previous Videos — plus contextual tools
  (`ProductionWorkspaceView`, `SceneShotEditor`, `SeriesBiblePanel`,
  `ContinuityPanel`, `VideoProviderStatus`). Sub-components live in
  `src/components/videos/`. Styles in `src/styles/videos.css` (imported between
  `images.css` and `conversation.css`).
- Configure the video bridge in Settings > Connected Services
  (`arti_endpoint_video`, `arti_key_video`, `arti_video_model`). When nothing is
  configured the workspace states the real setup requirement and never
  fabricates a video. No engine, SDK, renderer or FFmpeg pipeline is connected:
  the UI never claims a generated/compiled/playable render it did not receive.

## Music Studio (music-linked conversations)

- Music is its own conversation + generation workspace, **not** a project. A
  music conversation is tagged `workspace: 'music'` on the shared `chatStore`
  and carries a `musicMeta` blob (`mode`, `language`, `genre`, `vocalType`,
  `lyrics`, `settings`, `results[]`, `pendingGeneration`, `pendingStage`).
  Chats/Projects/Games/Images/Videos never list music conversations, and music
  never lists theirs. Route `music` renders `MusicWorkspace` with four tabs —
  Create, Chat, Library, Gallery.
- `src/services/musicTypes.ts` is the single source for the mode taxonomy: 12
  creation modes in 5 families, plus transform, brief and track-meta types.
- `src/services/musicProvider.ts` is the single generation boundary and the
  honest capability registry. Only `custom-server` (an owner-run bridge at
  `arti_endpoint_music`) is genuinely integrated; commercial engines are listed
  with their real state and an undeclared capability is reported `unverified`.
  The bridge key stays on the owner's server — no engine key lives in the
  browser.
- `src/services/musicStyles.ts` (95 discoverable genre/style chips) and
  `src/services/musicLanguages.ts` (57 languages with native-script names) are
  the style/language catalogues. Provider-declared vocal languages are shown as
  supported; every other language is shown `unverified`, never silently swapped.
- `src/services/musicPrompt.ts` builds the structured prompt, `musicLyrics.ts`
  writes original lyrics (never copyrighted material), `musicClarify.ts`
  interprets a natural-language brief into reviewable settings, and
  `musicGeneration.ts` maps a real bridge response into a persisted track; a
  failure yields a `failed` record with the real error and no engine yields a
  `blocked` record. `musicDownload.ts` performs a genuine client-side download
  (the file is never uploaded).
- The in-component generation indicator (`src/components/music/GenerationIndicator.tsx`)
  reuses the removed boot animation's visual language but lives **inside** the
  music workspace and renders only while a real request is running — never as a
  background or full-screen layer, never blocking the composer or controls.
  It is driven by real stages (preparing / writing-lyrics / generating /
  processing) and shows an honest indeterminate state; no fabricated percentage.
- Tempo transforms distinguish three distinct operations: playback-speed (real,
  local, Web Audio `playbackRate`), tempo-preserving time stretch (needs a real
  DSP service — reported not connected) and AI rearrangement (calls the real
  provider). Every variation is stored as a separate track linked to its source
  (`sourceTrackId`); the original is never overwritten.
- Configure the music bridge in Settings > Connected Services
  (`arti_endpoint_music`, `arti_key_music`, `arti_music_model`). When nothing is
  configured the workspace states the real setup requirement and never
  fabricates audio. No engine, SDK or renderer is connected: the UI never claims
  a generated/playable render it did not receive.

## Verification

- `npm run test:all [baseUrl]` — runs every suite below in sequence and forwards
  one base URL to each (`scripts/run-all.mjs`).
- `npm run check:colors` — source-level strict three-colour audit
  (`scripts/check-colors.mjs`). Fails on any hex / rgb / hsl / named colour
  outside Navy `#1F2A44`, Warm Beige `#E8DCC8`, Soft Gold `#C6A75E`. Also runs
  as the last step of `npm run lint`.
- `npm run test:palette [baseUrl]` — headless-Chromium runtime palette audit
  (`scripts/verify-palette.mjs`). Walks every author CSS rule (all stylesheets,
  including `@media`), every inline style and every SVG presentation attribute
  on all 24 routes, and fails on any rgb triplet outside the three approved
  colours. This catches what a text scan cannot: gradients, shorthands and
  third-party component styles.
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
- `npm run test:videos [baseUrl]` — headless-Chromium Videos suite: five tabs,
  default 1080p/16:9, style → guidance injection without erasing the prompt and
  without duplication, separate type taxonomy, structured-type routing, the
  3×5=15 series hierarchy with per-episode independence, season expansion,
  series bible + continuity, the 1,000-hour ambiguity decision, duration presets,
  16K honesty, provider capability honesty, category grouping / persistence /
  isolation, collapse, a genuine download with no upload, fonts and the
  integrated-input policy. Currently 53 checks.
- `npm run test:music [baseUrl]` — headless-Chromium Music Studio suite: four
  tabs, 12 creation modes in 5 families, the 57-language and 95-style
  catalogues, honest not-connected state (no request, no fabricated track), the
  in-component generation indicator appearing only during a real request and
  disappearing on completion, duplicate-request protection, a real provider
  response becoming a playable track, a provider failure becoming an honest
  failed record, the track library metadata + provenance, real playback, a
  genuine client-side download with no upload, the three distinct tempo
  transform methods (playback-speed real vs time-stretch not connected),
  language/vocal capability honesty, workspace isolation, fonts and the
  integrated-input policy. Currently 40 checks.

## Premium UI refinement (non-Home)

- `src/styles/premium.css` is the premium refinement layer for every workspace
  **except** the approved Home screen. It is imported **last** in `src/index.css`
  (after `responsive.css`) so its refinements win at equal specificity.
- Isolation contract: the file never targets Home-only selectors
  (`.home-page`, `.home-center-group`, `.hero-*`, `.prompt-box*`,
  `.quick-action*`, `.home-footer`, `.footer-*`, `.cinematic-*`) and guards
  every shell-level rule with `.app-shell:not(.route-home)`. It changes only
  visual properties (surfaces, borders, radii, shadows, accents, motion) and
  never structural sizing owned by `responsive.css`.
- Per-route identity is driven by one `--prem-accent` custom property set on the
  route class (`route-chats`, `route-projects`, …). Because the palette is
  strictly three colours, every route resolves to the same Soft Gold accent —
  workspace identity comes from surface and type, not from a fourth hue.
- Motion is transform/opacity only, honours `prefers-reduced-motion` (all
  non-Home animation/transition is neutralised there) and disables hover
  translation on `@media (hover: none)`.
- `npm run test:redesign [baseUrl]` — headless-Chromium (CDP, no extra deps)
  guard: proves the Home content, background, prompt bar and shell material are
  unchanged (no premium entrance animation, sidebar material or card border on
  Home) and that every non-Home route renders with the premium shell refinement
  and no console errors. Currently 15 checks.

## Motion design system (shared)

- `src/motion/tokens.ts` is the single source of truth for durations (`DUR`),
  easings (`EASE`), springs (`SPRING`), stagger steps (`STAGGER`) and the shared
  `Variants` (`fade`, `rise`, `riseScale`, `slideIn`, `staggerContainer`,
  `overlayVariants`, `dialogVariants`, `drawerVariants`, `sheetUpVariants`,
  `menuVariants`). Components reference these tokens; never invent local timings.
- Motion for React (`motion/react`) is the one animation library. `main.tsx`
  mounts `<MotionConfig reducedMotion="user">`, so the OS reduce-motion setting
  is honoured globally (Motion's default is `never`). `styles/motion.css` holds
  the CSS-level layer and the `prefers-reduced-motion` neutralisers.
- There is **no decorative 3D background scene** and **no full-screen loading
  animation**. The former Three.js "AI core" (a faceted sphere in orbital rings)
  and the one-time boot overlay were removed along with `@react-three/fiber`,
  `@react-three/drei` and `three`. Do not reintroduce a globe, planet, sphere,
  floating orb, animated background object or full-screen loading layer unless
  explicitly requested. The removed boot animation's visual language is reused
  *inside* the Music Studio as an in-component generation indicator only.
- `src/services/activityStore.ts` is the single observable activity log
  (`useSyncExternalStore`) behind the execution timeline; `chatStore` and
  `musicGeneration` publish `begin`/`settle` for genuine in-flight work.
  `progress` stays `null` (indeterminate) because the provider cannot report
  fractional progress.
- Shared-element indicators: the sidebar active rail (`sidebar-active-indicator`)
  and the settings section rail (`settings-nav-indicator`) each use one
  `layoutId`, so the accent slides between items instead of blinking. Modal,
  drawer, command-palette and settings-section enter/exit are owned by Motion
  variants — do not re-add a competing CSS `animation` on those surfaces.


