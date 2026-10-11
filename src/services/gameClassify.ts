/**
 * ARTI AI — game-creation form state and validation.
 *
 * The single source of the game-creation form's shape, so the Games overview
 * dialog and any other entry point capture exactly the same data and apply the
 * same validation. Only the minimum fields are required; every advanced field
 * stays optional so beginners are not overwhelmed.
 */
import type { PlatformMode } from './projectStore';
import {
  CUSTOM_ENGINE_VALUE,
  CUSTOM_MODE_VALUE,
  CUSTOM_THEME_VALUE,
  GAME_OTHER_PLATFORM_VALUE,
} from './gameTaxonomy';

export interface GameCreateState {
  /** Required: game name. */
  name: string;
  /** Required: short description / concept. */
  description: string;
  /** Required: at least one gameplay mechanic. */
  mechanics: string[];
  /** Required: at least one world theme. */
  themes: string[];
  /** Details when the `custom-world` theme is selected. */
  customTheme: string;
  /** Required: at least one game mode. */
  modes: string[];
  /** Details when the `custom-game-mode` mode is selected. */
  customMode: string;
  /** Multiplayer requirement values (only meaningful for network modes). */
  multiplayerRequirements: string[];
  /** Preferred engine value (may be `not-decided`). */
  engine: string;
  /** Details when the `custom-engine` engine is selected. */
  customEngine: string;
  /** Required: at least one target platform (single mode). */
  platforms: string[];
  platformMode: PlatformMode;
  customPlatform: string;
  /** Optional: visual style. */
  visualStyle: string;
  /** Optional: additional instructions. */
  instructions: string;
  /** Optional (advanced): programming languages. */
  languages: string[];
  /** Optional (advanced): 2D / 3D. */
  dimensions: string[];
  /** Optional (advanced): rendering requirements. */
  rendering: string[];
  /** Optional (advanced): physics requirements. */
  physics: string[];
  /** Optional (advanced): AI behaviour. */
  ai: string[];
  /** Optional (advanced): procedural generation. */
  procedural: string[];
  /** Optional (advanced): audio & music. */
  audio: string[];
  /** Optional (advanced): animation. */
  animation: string[];
  /** Optional (advanced): input methods. */
  input: string[];
  /** Optional (advanced): accessibility requirements. */
  accessibility: string[];
  /** Optional (advanced): save / load functionality. */
  saveLoad: string[];
  /** Optional (advanced): performance targets. */
  performance: string[];
  /** Optional (advanced): target hardware (free text). */
  targetHardware: string;
  /** Optional (advanced): asset requirements. */
  assetRequirements: string;
  /** Optional (advanced): build & packaging requirements. */
  buildPackaging: string[];
}

export const initialGameCreateState: GameCreateState = {
  name: '',
  description: '',
  mechanics: [],
  themes: [],
  customTheme: '',
  modes: [],
  customMode: '',
  multiplayerRequirements: [],
  engine: 'not-decided',
  customEngine: '',
  platforms: [],
  platformMode: 'single',
  customPlatform: '',
  visualStyle: '',
  instructions: '',
  languages: [],
  dimensions: [],
  rendering: [],
  physics: [],
  ai: [],
  procedural: [],
  audio: [],
  animation: [],
  input: [],
  accessibility: [],
  saveLoad: [],
  performance: [],
  targetHardware: '',
  assetRequirements: '',
  buildPackaging: [],
};

/** A mode that implies a network/server component (used to gate MP details). */
const NETWORK_MODE_VALUES = new Set([
  'co-op',
  'pvp',
  'battle-royale',
  'mmorpg-persistent',
  'online-multiplayer',
  'asynchronous-multiplayer',
]);

export function hasNetworkMode(modes: string[]): boolean {
  return modes.some((m) => NETWORK_MODE_VALUES.has(m));
}

/** Client-side validation. Returns a human-readable problem, or ''. */
export function validateGameCreateState(s: GameCreateState): string {
  if (!s.name.trim()) return 'Enter a game name.';
  if (!s.description.trim()) return 'Describe the game concept in a line or two.';
  if (s.mechanics.length === 0) return 'Select at least one gameplay mechanic.';
  if (s.themes.length === 0) return 'Select at least one world theme.';
  if (s.themes.includes(CUSTOM_THEME_VALUE) && !s.customTheme.trim()) {
    return 'Describe your custom world theme.';
  }
  if (s.modes.length === 0) return 'Select at least one game mode.';
  if (s.modes.includes(CUSTOM_MODE_VALUE) && !s.customMode.trim()) {
    return 'Describe your custom game mode.';
  }
  if (s.engine === CUSTOM_ENGINE_VALUE && !s.customEngine.trim()) {
    return 'Describe your custom engine or technology stack.';
  }
  if (s.platformMode === 'single' && s.platforms.length === 0) {
    return 'Select at least one target platform, or choose Cross-Platform / All Platforms.';
  }
  if (s.platforms.includes(GAME_OTHER_PLATFORM_VALUE) && !s.customPlatform.trim()) {
    return 'Describe your custom target platform.';
  }
  return '';
}

/** Toggle a value in a string array. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
