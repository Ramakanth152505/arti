/**
 * ARTI AI — Games taxonomy.
 *
 * The catalogue of gameplay mechanics, world themes, game modes, engines,
 * technologies and target platforms a game project can be defined against.
 *
 * These are *project intent* choices, not proof that an engine, compiler, SDK,
 * asset pipeline or console authorisation is installed or connected. Capability
 * is reported separately and honestly (see `PLATFORM_STATUS` notes below and
 * `GAME_ENGINE_CAPABILITY`). Selecting an engine never silently substitutes a
 * different one.
 */
import type { PlatformMode, PlatformStatus } from './projectStore';

export interface TaxonomyOption {
  value: string;
  label: string;
}

/* ==========================================================================
   1. Gameplay mechanics — 13 required categories, each with its choices.
   ========================================================================== */

export interface MechanicGroup {
  id: string;
  label: string;
  summary: string;
  options: TaxonomyOption[];
}

export const MECHANIC_GROUPS: MechanicGroup[] = [
  {
    id: 'driving-racing',
    label: 'Driving & Racing',
    summary: 'Cars, bikes, futuristic vehicles, tracks and racing challenges.',
    options: [
      { value: 'cars-sports-cars', label: 'Cars & sports cars' },
      { value: 'bikes', label: 'Bikes' },
      { value: 'futuristic-vehicles-hovercrafts', label: 'Futuristic vehicles & hovercrafts' },
      { value: 'race-tracks-checkpoints', label: 'Race tracks & checkpoints' },
      { value: 'vehicle-handling-racing', label: 'Vehicle handling & racing challenges' },
    ],
  },
  {
    id: 'action-combat',
    label: 'Action & Combat',
    summary: 'Hand-to-hand, melee, martial arts, abilities and combat progression.',
    options: [
      { value: 'hand-to-hand-combat', label: 'Hand-to-hand combat' },
      { value: 'melee-combat', label: 'Melee combat' },
      { value: 'martial-arts', label: 'Martial arts' },
      { value: 'character-abilities', label: 'Character abilities' },
      { value: 'combat-encounters-progression', label: 'Combat encounters & progression' },
    ],
  },
  {
    id: 'shooter',
    label: 'Shooter — FPS & TPS',
    summary: 'First-person, third-person, tactical shooting, weapons and objectives.',
    options: [
      { value: 'first-person', label: 'First-person gameplay' },
      { value: 'third-person', label: 'Third-person gameplay' },
      { value: 'tactical-shooting', label: 'Tactical shooting' },
      { value: 'weapons-equipment', label: 'Weapons & equipment' },
      { value: 'enemies-objectives-combat', label: 'Enemies, objectives & combat encounters' },
    ],
  },
  {
    id: 'stealth-tactical',
    label: 'Stealth & Tactical',
    summary: 'Enemy awareness, hiding, distraction, infiltration and silent movement.',
    options: [
      { value: 'enemy-awareness', label: 'Enemy awareness' },
      { value: 'hiding-avoiding-detection', label: 'Hiding & avoiding detection' },
      { value: 'distraction-infiltration', label: 'Distraction & infiltration' },
      { value: 'silent-movement', label: 'Silent movement' },
      { value: 'tactical-objectives', label: 'Tactical objectives' },
    ],
  },
  {
    id: 'open-world',
    label: 'Open World & Exploration',
    summary: 'Free roam, discovery, vehicles, quests and world traversal.',
    options: [
      { value: 'free-roam-environments', label: 'Free-roam environments' },
      { value: 'exploration-discovery', label: 'Exploration & discovery' },
      { value: 'open-world-vehicles', label: 'Vehicles' },
      { value: 'quests-objectives', label: 'Quests & objectives' },
      { value: 'world-traversal', label: 'World traversal' },
    ],
  },
  {
    id: 'survival-crafting',
    label: 'Survival & Crafting',
    summary: 'Resource gathering, crafting, shelter, food, water and progression.',
    options: [
      { value: 'resource-gathering', label: 'Resource gathering' },
      { value: 'crafting-systems', label: 'Crafting systems' },
      { value: 'shelter-building', label: 'Shelter building' },
      { value: 'food-water-management', label: 'Food & water management' },
      { value: 'environmental-challenges', label: 'Environmental challenges' },
      { value: 'survival-progression', label: 'Survival progression' },
    ],
  },
  {
    id: 'strategy-base-building',
    label: 'Strategy & Base Building — RTS/TBS',
    summary: 'Resource management, base construction, armies, RTS/TBS progression.',
    options: [
      { value: 'resource-management', label: 'Resource management' },
      { value: 'base-construction', label: 'Base construction' },
      { value: 'army-unit-management', label: 'Army or unit management' },
      { value: 'turn-based-strategy', label: 'Turn-based strategy' },
      { value: 'real-time-strategy', label: 'Real-time strategy' },
      { value: 'progression-territory', label: 'Progression & territory management' },
    ],
  },
  {
    id: 'rpg',
    label: 'RPG — Role-Playing Game',
    summary: 'Statistics, levels, skill trees, equipment, dialogue and branching quests.',
    options: [
      { value: 'character-statistics', label: 'Character statistics' },
      { value: 'level-progression', label: 'Level progression' },
      { value: 'skill-trees', label: 'Skill trees' },
      { value: 'equipment-weapons', label: 'Equipment & weapons' },
      { value: 'dialogue-choices', label: 'Dialogue choices' },
      { value: 'quests-branching-stories', label: 'Quests & branching stories' },
    ],
  },
  {
    id: 'platformer-parkour',
    label: 'Platformer & Parkour',
    summary: 'Jumping, platforms, climbing, parkour, checkpoints and level progression.',
    options: [
      { value: 'jumping-movement', label: 'Jumping & movement' },
      { value: 'platforms-obstacles', label: 'Platforms & obstacles' },
      { value: 'climbing', label: 'Climbing' },
      { value: 'parkour', label: 'Parkour' },
      { value: 'platformer-checkpoints', label: 'Checkpoints' },
      { value: 'platformer-level-progression', label: 'Level progression' },
    ],
  },
  {
    id: 'puzzle-mind',
    label: 'Puzzle & Mind Logic',
    summary: 'Logic and environmental puzzles, escape rooms, brain teasers.',
    options: [
      { value: 'logic-puzzles', label: 'Logic puzzles' },
      { value: 'environmental-puzzles', label: 'Environmental puzzles' },
      { value: 'escape-rooms', label: 'Escape rooms' },
      { value: 'brain-teasers', label: 'Brain teasers' },
      { value: 'puzzle-progression', label: 'Puzzle progression' },
    ],
  },
  {
    id: 'flight-vehicle-sim',
    label: 'Flight & Vehicle Simulator',
    summary: 'Aircraft, spacecraft, ships, flight controls and vehicle physics.',
    options: [
      { value: 'aircraft', label: 'Aircraft' },
      { value: 'spacecraft', label: 'Spacecraft' },
      { value: 'ships', label: 'Ships' },
      { value: 'flight-controls', label: 'Flight controls' },
      { value: 'vehicle-physics', label: 'Vehicle physics' },
      { value: 'simulation-objectives', label: 'Simulation objectives' },
    ],
  },
  {
    id: 'sports-athletic',
    label: 'Sports & Athletic',
    summary: 'Football, cricket, basketball, tennis, other sports, arcade or sim.',
    options: [
      { value: 'football', label: 'Football' },
      { value: 'cricket', label: 'Cricket' },
      { value: 'basketball', label: 'Basketball' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'other-sports', label: 'Other sports' },
      { value: 'arcade-simulation-mechanics', label: 'Arcade or simulation-style mechanics' },
    ],
  },
  {
    id: 'rhythm-music',
    label: 'Rhythm & Music',
    summary: 'Rhythm inputs, timing, beat sync, music-driven levels and scoring.',
    options: [
      { value: 'rhythm-inputs', label: 'Rhythm-based inputs' },
      { value: 'timing-challenges', label: 'Timing challenges' },
      { value: 'beat-synchronization', label: 'Beat synchronization' },
      { value: 'music-driven-levels', label: 'Music-driven levels' },
      { value: 'rhythm-scoring', label: 'Scoring systems' },
    ],
  },
];

/* ==========================================================================
   2. World themes & setting — 15 required categories.
   ========================================================================== */

export const WORLD_THEMES: TaxonomyOption[] = [
  { value: 'sci-fi-futuristic', label: 'Sci-Fi & Futuristic' },
  { value: 'historical-period', label: 'Historical & Period' },
  { value: 'fantasy-magic', label: 'Fantasy & Magic' },
  { value: 'dark-fantasy-gothic', label: 'Dark Fantasy & Gothic' },
  { value: 'mythological', label: 'Mythological' },
  { value: 'horror-survival-horror', label: 'Horror & Survival Horror' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic' },
  { value: 'superhero-comic', label: 'Superhero & Comic Universe' },
  { value: 'cyberpunk-dystopian', label: 'Cyberpunk & Dystopian' },
  { value: 'crime-gangster', label: 'Crime & Gangster' },
  { value: 'military-modern-warfare', label: 'Military & Modern Warfare' },
  { value: 'western-wild-west', label: 'Western & Wild West' },
  { value: 'realistic-modern', label: 'Realistic Modern World' },
  { value: 'abstract-experimental', label: 'Abstract & Experimental' },
  { value: 'custom-world', label: 'Custom World' },
];

export const CUSTOM_THEME_VALUE = 'custom-world';

/* ==========================================================================
   3. Multiplayer & game modes — 11 required options.
   ========================================================================== */

export const GAME_MODES: TaxonomyOption[] = [
  { value: 'single-player-story', label: 'Single Player / Story Mode' },
  { value: 'co-op', label: 'Co-op / Cooperative' },
  { value: 'pvp', label: 'PvP / Player versus Player' },
  { value: 'battle-royale', label: 'Battle Royale' },
  { value: 'mmorpg-persistent', label: 'MMORPG / Persistent Multiplayer World' },
  { value: 'local-multiplayer', label: 'Local Multiplayer' },
  { value: 'online-multiplayer', label: 'Online Multiplayer' },
  { value: 'asynchronous-multiplayer', label: 'Asynchronous Multiplayer' },
  { value: 'sandbox-creative', label: 'Sandbox / Creative Mode' },
  { value: 'training-practice', label: 'Training / Practice Mode' },
  { value: 'custom-game-mode', label: 'Custom Game Mode' },
];

export const CUSTOM_MODE_VALUE = 'custom-game-mode';

/** Multiplayer requirements captured when a network mode is selected. */
export interface ModeRequirementGroup {
  id: string;
  label: string;
  options: TaxonomyOption[];
}

export const MULTIPLAYER_REQUIREMENTS: ModeRequirementGroup[] = [
  {
    id: 'topology',
    label: 'Play topology',
    options: [
      { value: 'local-versus', label: 'Local versus / split-screen' },
      { value: 'online-play', label: 'Online play' },
    ],
  },
  {
    id: 'players',
    label: 'Expected player count',
    options: [
      { value: 'players-2', label: '2 players' },
      { value: 'players-2-4', label: '2–4 players' },
      { value: 'players-4-16', label: '4–16 players' },
      { value: 'players-16-64', label: '16–64 players' },
      { value: 'players-massive', label: 'Massive / persistent world' },
    ],
  },
  {
    id: 'networking',
    label: 'Networking requirements',
    options: [
      { value: 'server-authoritative', label: 'Server-authoritative gameplay' },
      { value: 'matchmaking', label: 'Matchmaking' },
      { value: 'persistent-player-data', label: 'Persistent player data' },
      { value: 'network-synchronization', label: 'Network synchronization' },
      { value: 'anti-cheat', label: 'Anti-cheat requirements' },
      { value: 'hosting-deployment', label: 'Hosting & deployment needs' },
    ],
  },
];

/* ==========================================================================
   4. Game engines & technology options.
   ========================================================================== */

export interface EngineOption extends TaxonomyOption {
  /** Honest capability note — never implies the engine is installed. */
  capability: string;
  /** True when this environment has a genuine, connected engine/build path. */
  connected: boolean;
}

export const GAME_ENGINES: EngineOption[] = [
  { value: 'unreal-engine', label: 'Unreal Engine', capability: 'Project intent recorded; no Unreal toolchain is installed or connected.', connected: false },
  { value: 'unity', label: 'Unity', capability: 'Project intent recorded; no Unity toolchain is installed or connected.', connected: false },
  { value: 'godot', label: 'Godot', capability: 'Project intent recorded; no Godot toolchain is installed or connected.', connected: false },
  { value: 'web-html-css-js', label: 'Web — HTML, CSS, JavaScript', capability: 'Web games are the closest to this environment; no automated build runs here.', connected: false },
  { value: 'web-typescript', label: 'Web — TypeScript', capability: 'Web games are the closest to this environment; no automated build runs here.', connected: false },
  { value: 'webgl', label: 'WebGL', capability: 'Rendering choice recorded; no shader/asset pipeline is connected.', connected: false },
  { value: 'webgpu', label: 'WebGPU (where supported)', capability: 'Rendering choice recorded; browser/GPU support varies and nothing is verified here.', connected: false },
  { value: 'native-platform', label: 'Native platform-specific technology', capability: 'Platform choice recorded; no native SDK or signing identity is connected.', connected: false },
  { value: 'custom-engine', label: 'Custom engine / custom technology stack', capability: 'Describe your own engine; capability depends on tooling you provide.', connected: false },
  { value: 'not-decided', label: 'Not decided yet', capability: 'ARTI can propose a technical plan from the brief; no engine is chosen yet.', connected: false },
];

export const CUSTOM_ENGINE_VALUE = 'custom-engine';
export const UNDECIDED_ENGINE_VALUE = 'not-decided';

/* ==========================================================================
   5. Target platforms (game-specific, including consoles and VR).
   ========================================================================== */

export interface GamePlatformOption extends TaxonomyOption {
  dependencies: string;
  status: PlatformStatus;
  statusNote: string;
}

export const GAME_PLATFORMS: GamePlatformOption[] = [
  { value: 'web-browser', label: 'Web browser', dependencies: 'Node.js + bundler (Vite)', status: 'architecture-supported', statusNote: 'Static web output is the only target this environment natively supports; no build is automated here.' },
  { value: 'windows', label: 'Windows', dependencies: 'Platform SDK / MSVC or a cross-compiler', status: 'dependencies-required', statusNote: 'No Windows packaging toolchain is connected.' },
  { value: 'macos', label: 'macOS', dependencies: 'Xcode command-line tools, notarization identity', status: 'dependencies-required', statusNote: 'No macOS packaging or notarization is connected.' },
  { value: 'linux', label: 'Linux', dependencies: 'Native toolchain, packaging (deb/rpm/AppImage)', status: 'dependencies-required', statusNote: 'No Linux packaging toolchain is connected.' },
  { value: 'android', label: 'Android', dependencies: 'Android SDK, Gradle, JDK, keystore for signing', status: 'dependencies-required', statusNote: 'No Android SDK or signing toolchain is connected.' },
  { value: 'ios', label: 'iOS / iPadOS', dependencies: 'Xcode, Apple Developer signing identity', status: 'dependencies-required', statusNote: 'No Xcode or Apple signing identity is connected.' },
  { value: 'console-playstation', label: 'Console — PlayStation', dependencies: 'Authorised console SDK, devkit, certification', status: 'not-supported', statusNote: 'No authorised console SDK or devkit access is present.' },
  { value: 'console-xbox', label: 'Console — Xbox', dependencies: 'Authorised console SDK, devkit, certification', status: 'not-supported', statusNote: 'No authorised console SDK or devkit access is present.' },
  { value: 'console-nintendo', label: 'Console — Nintendo', dependencies: 'Authorised console SDK, devkit, certification', status: 'not-supported', statusNote: 'No authorised console SDK or devkit access is present.' },
  { value: 'vr', label: 'Virtual reality', dependencies: 'XR runtime, headset SDK, performance budget', status: 'dependencies-required', statusNote: 'No XR runtime or headset SDK is connected.' },
  { value: 'other', label: 'Custom target', dependencies: 'Depends on the custom target', status: 'planned', statusNote: 'Describe the target; capability depends on its toolchain.' },
];

export const GAME_OTHER_PLATFORM_VALUE = 'other';

export interface ResolvedGameTarget {
  value: string;
  label: string;
  status: PlatformStatus;
  statusNote: string;
  dependencies: string;
}

export function getGamePlatformOption(value: string): GamePlatformOption | undefined {
  return GAME_PLATFORMS.find((p) => p.value === value);
}

/**
 * Resolve the platform matrix for a game configuration. `all-platforms`
 * enumerates every game target (including unsupported consoles and VR, with
 * their real status) so nothing requested is silently dropped.
 */
export function resolveGameTargets(
  platforms: string[],
  mode: PlatformMode,
  customPlatform?: string
): ResolvedGameTarget[] {
  const toTarget = (p: GamePlatformOption): ResolvedGameTarget => ({
    value: p.value,
    label: p.label,
    status: p.status,
    statusNote: p.statusNote,
    dependencies: p.dependencies,
  });

  if (mode === 'all-platforms') {
    return GAME_PLATFORMS.filter((p) => p.value !== GAME_OTHER_PLATFORM_VALUE).map(toTarget);
  }

  return platforms
    .map((v) => {
      if (v === GAME_OTHER_PLATFORM_VALUE) {
        return {
          value: 'other',
          label: customPlatform?.trim() ? `Custom — ${customPlatform.trim()}` : 'Custom target',
          status: 'planned' as PlatformStatus,
          statusNote: 'Describe the target; capability depends on its toolchain.',
          dependencies: 'Depends on the custom target',
        };
      }
      const p = getGamePlatformOption(v);
      return p ? toTarget(p) : null;
    })
    .filter((t): t is ResolvedGameTarget => t !== null);
}

/* ==========================================================================
   6. Technical requirements (advanced mode) — compact multi-select groups.
   ========================================================================== */

export const GAME_LANGUAGES: TaxonomyOption[] = [
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'gdscript', label: 'GDScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'rust', label: 'Rust' },
  { value: 'python', label: 'Python' },
  { value: 'lua', label: 'Lua' },
  { value: 'other-language', label: 'Other' },
];

export const GAME_DIMENSIONS: TaxonomyOption[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
  { value: '2.5d', label: '2.5D' },
];

export const GAME_RENDERING: TaxonomyOption[] = [
  { value: 'forward', label: 'Forward rendering' },
  { value: 'deferred', label: 'Deferred rendering' },
  { value: 'ray-tracing', label: 'Ray tracing' },
  { value: 'stylized', label: 'Stylized / hand-drawn' },
  { value: 'custom-shaders', label: 'Custom shaders' },
];

export const GAME_PHYSICS: TaxonomyOption[] = [
  { value: 'engine-physics', label: 'Engine built-in physics' },
  { value: 'custom-physics', label: 'Custom physics' },
  { value: 'rigid-body', label: 'Rigid-body dynamics' },
  { value: 'soft-body', label: 'Soft-body / cloth' },
  { value: 'no-physics', label: 'No physics simulation' },
];

export const GAME_AI: TaxonomyOption[] = [
  { value: 'fsm', label: 'Finite state machines' },
  { value: 'behavior-trees', label: 'Behavior trees' },
  { value: 'navmesh', label: 'Navmesh pathfinding' },
  { value: 'utility-ai', label: 'Utility AI' },
  { value: 'ml-agents', label: 'Machine-learning agents' },
];

export const GAME_PROCEDURAL: TaxonomyOption[] = [
  { value: 'proc-levels', label: 'Procedural levels' },
  { value: 'proc-terrain', label: 'Procedural terrain' },
  { value: 'proc-dungeons', label: 'Procedural dungeons' },
  { value: 'proc-loot', label: 'Procedural loot' },
  { value: 'no-procgen', label: 'No procedural generation' },
];

export const GAME_AUDIO: TaxonomyOption[] = [
  { value: 'engine-audio', label: 'Engine audio system' },
  { value: 'audio-middleware', label: 'Audio middleware (FMOD / Wwise)' },
  { value: 'adaptive-music', label: 'Adaptive / dynamic music' },
  { value: 'procedural-audio', label: 'Procedural audio' },
  { value: 'voice-acting', label: 'Voice acting' },
];

export const GAME_ANIMATION: TaxonomyOption[] = [
  { value: 'skeletal', label: 'Skeletal animation' },
  { value: 'blend-trees', label: 'Blend trees / IK' },
  { value: 'mocap', label: 'Motion capture' },
  { value: 'sprite-2d', label: '2D sprite animation' },
  { value: 'no-animation', label: 'Minimal / no character animation' },
];

export const GAME_INPUT: TaxonomyOption[] = [
  { value: 'keyboard-mouse', label: 'Keyboard & mouse' },
  { value: 'gamepad', label: 'Gamepad' },
  { value: 'touch', label: 'Touch' },
  { value: 'motion', label: 'Motion / gyro' },
  { value: 'voice', label: 'Voice' },
];

export const GAME_ACCESSIBILITY: TaxonomyOption[] = [
  { value: 'colorblind-modes', label: 'Colour-blind modes' },
  { value: 'subtitles-captions', label: 'Subtitles & captions' },
  { value: 'remappable-controls', label: 'Remappable controls' },
  { value: 'screen-reader', label: 'Screen-reader support' },
  { value: 'difficulty-options', label: 'Difficulty & assist options' },
];

export const GAME_SAVE_LOAD: TaxonomyOption[] = [
  { value: 'local-save', label: 'Local save files' },
  { value: 'cloud-save', label: 'Cloud save' },
  { value: 'save-slots', label: 'Multiple save slots' },
  { value: 'autosave', label: 'Autosave' },
];

export const GAME_PERFORMANCE: TaxonomyOption[] = [
  { value: 'target-60fps', label: '60 FPS target' },
  { value: 'target-120fps', label: '120 FPS target' },
  { value: 'mobile-friendly', label: 'Mobile-friendly budget' },
  { value: 'low-end-support', label: 'Low-end hardware support' },
];

export const GAME_ASSETS: TaxonomyOption[] = [
  { value: 'original-assets', label: 'Original assets' },
  { value: 'asset-store', label: 'Marketplace / asset store' },
  { value: 'procedural-assets', label: 'Procedurally generated' },
  { value: 'mixed-assets', label: 'Mixed sources' },
];

export const GAME_BUILD_PACKAGING: TaxonomyOption[] = [
  { value: 'web-build', label: 'Web build' },
  { value: 'desktop-build', label: 'Desktop build' },
  { value: 'mobile-build', label: 'Mobile build' },
  { value: 'console-build', label: 'Console build' },
  { value: 'custom-packaging', label: 'Custom packaging' },
];

/* ==========================================================================
   Lookup helpers.
   ========================================================================== */

export function mechanicLabel(value: string): string {
  for (const g of MECHANIC_GROUPS) {
    const o = g.options.find((x) => x.value === value);
    if (o) return o.label;
  }
  return value;
}

export function mechanicGroupLabelFor(value: string): string | undefined {
  return MECHANIC_GROUPS.find((g) => g.options.some((o) => o.value === value))?.id;
}

export function themeLabel(value: string): string {
  return WORLD_THEMES.find((t) => t.value === value)?.label ?? value;
}

export function modeLabel(value: string): string {
  return GAME_MODES.find((m) => m.value === value)?.label ?? value;
}

export function engineLabel(value: string): string {
  return GAME_ENGINES.find((e) => e.value === value)?.label ?? value;
}

export function optionLabel(options: TaxonomyOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
