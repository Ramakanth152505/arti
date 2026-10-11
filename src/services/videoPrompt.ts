/**
 * ARTI AI — Videos prompt preparation & output presets.
 *
 * Builds the final prompt from structured data instead of fragile string
 * concatenation: the user's original wording is always preserved, the selected
 * style contributes its real guidance (inserted once, never duplicated), and
 * the technical request (duration, aspect, resolution, camera, lighting, audio)
 * is appended as a clearly-labelled instruction block.
 *
 * Style selection is separate from video type. This module only ever touches
 * the prompt; it never changes the user's type, category or settings.
 */

import { getVideoStyleById } from './videoStyles';
import { formatDuration } from './videoTypes';

/* ==========================================================================
   Output presets
   ========================================================================== */
export interface AspectRatioOption {
  value: string;
  label: string;
  /** width / height */
  ratio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '16:9', label: '16:9 — Landscape (default)', ratio: 16 / 9, orientation: 'landscape' },
  { value: '9:16', label: '9:16 — Vertical', ratio: 9 / 16, orientation: 'portrait' },
  { value: '1:1', label: '1:1 — Square', ratio: 1, orientation: 'square' },
  { value: '4:5', label: '4:5 — Portrait social', ratio: 4 / 5, orientation: 'portrait' },
  { value: '4:3', label: '4:3 — Classic', ratio: 4 / 3, orientation: 'landscape' },
  { value: '2.39:1', label: '2.39:1 — Anamorphic scope', ratio: 2.39, orientation: 'landscape' },
  { value: '21:9', label: '21:9 — Ultrawide', ratio: 21 / 9, orientation: 'landscape' },
];

export function getAspectRatio(value: string): AspectRatioOption {
  return ASPECT_RATIOS.find((r) => r.value === value) ?? ASPECT_RATIOS[0];
}

export interface ResolutionPreset {
  value: string;
  label: string;
  width: number;
  height: number;
  /** Honest capability note — presets are requests, not guarantees. */
  note?: string;
  /** True when this preset cannot be produced natively by any known engine. */
  aspirational?: boolean;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { value: '480p', label: '480p (854×480)', width: 854, height: 480 },
  { value: '720p', label: '720p (1280×720)', width: 1280, height: 720 },
  { value: '1080p', label: '1080p Full HD (1920×1080)', width: 1920, height: 1080 },
  { value: '1440p', label: '1440p QHD (2560×1440)', width: 2560, height: 1440 },
  { value: '2160p', label: '2160p 4K UHD (3840×2160)', width: 3840, height: 2160 },
  { value: '8K', label: '8K (7680×4320)', width: 7680, height: 4320, note: 'Requires a native 8K engine or a real upscale step.' },
  {
    value: '16K',
    label: '16K target (15360×8640)',
    width: 15360,
    height: 8640,
    note: 'No connected engine generates 16K natively. This is a target only — a 16K result would require native generation or a real upscale step, and upscaling never restores detail that was never captured.',
    aspirational: true,
  },
  { value: 'custom', label: 'Custom width × height', width: 0, height: 0 },
];

export function getResolutionPreset(value: string): ResolutionPreset | undefined {
  return RESOLUTION_PRESETS.find((r) => r.value === value);
}

export const FRAME_RATES = [12, 15, 24, 25, 30, 48, 60, 120];

/** Default output settings (spec §11.1): 1920×1080, 16:9, landscape. */
export const DEFAULT_RESOLUTION = '1080p';
export const DEFAULT_ASPECT_RATIO = '16:9';
export const DEFAULT_FPS = 24;

export const CAMERA_MOVEMENTS = [
  'Static',
  'Slow push in',
  'Pull back',
  'Pan left',
  'Pan right',
  'Tilt up',
  'Tilt down',
  'Tracking shot',
  'Crane up',
  'Orbit',
  'Handheld',
  'Aerial drone',
  'Dolly zoom',
];

export const LIGHTING_OPTIONS = [
  'Natural daylight',
  'Golden hour',
  'Blue hour',
  'Overcast soft',
  'Dramatic key light',
  'Low-key chiaroscuro',
  'Neon night',
  'Candlelit',
  'Volumetric haze',
  'High-key bright',
];

export const COLOR_GRADES = [
  'Neutral',
  'Warm cinematic',
  'Cool cinematic',
  'Teal & orange',
  'Desaturated',
  'High-contrast noir',
  'Pastel',
  'Bleach bypass',
];

export const MOTION_OPTIONS = ['Slow and deliberate', 'Natural', 'Dynamic', 'Slow-motion', 'Time-lapse', 'Fast-paced'];

export const AUDIO_OPTIONS = [
  'No audio',
  'Ambient only',
  'Dialogue',
  'Narration',
  'Music',
  'Music + effects',
  'Full mix',
];

/* ==========================================================================
   Prepared prompt
   ========================================================================== */
export interface PreparedPromptInput {
  originalPrompt: string;
  styleId?: string;
  durationSeconds: number;
  aspectRatio: string;
  resolutionLabel: string;
  fps: number;
  cameraMovement?: string;
  lighting?: string;
  colorGrade?: string;
  motion?: string;
  audio?: string;
  narration?: string;
  music?: string;
  language?: string;
  subtitles?: boolean;
  negativePrompt?: string;
  /** Extra creative context (production/series bible, episode synopsis). */
  context?: string;
}

/**
 * Build the final prompt. The original text is preserved verbatim and comes
 * first; the style guidance and the technical instruction block follow. Calling
 * this repeatedly with the same style never duplicates the guidance because the
 * style text is only ever appended once, from the style definition.
 */
export function buildVideoPrompt(input: PreparedPromptInput): string {
  const style = getVideoStyleById(input.styleId);
  const lines: string[] = [];

  lines.push(input.originalPrompt.trim());

  if (input.context?.trim()) {
    lines.push(`\nProduction context: ${input.context.trim()}`);
  }

  if (style) {
    lines.push(`\nVisual style — ${style.name}: ${style.promptGuidance}`);
  }

  const tech: string[] = [];
  tech.push(`duration ${formatDuration(input.durationSeconds)}`);
  tech.push(`aspect ratio ${input.aspectRatio}`);
  tech.push(`resolution ${input.resolutionLabel}`);
  tech.push(`${input.fps} fps`);
  if (input.cameraMovement && input.cameraMovement !== 'Static') tech.push(`camera: ${input.cameraMovement.toLowerCase()}`);
  if (input.lighting) tech.push(`lighting: ${input.lighting.toLowerCase()}`);
  if (input.colorGrade && input.colorGrade !== 'Neutral') tech.push(`colour grade: ${input.colorGrade.toLowerCase()}`);
  if (input.motion) tech.push(`motion: ${input.motion.toLowerCase()}`);
  if (input.audio && input.audio !== 'No audio') tech.push(`audio: ${input.audio.toLowerCase()}`);
  if (input.narration) tech.push(`narration: ${input.narration}`);
  if (input.music) tech.push(`music: ${input.music}`);
  if (input.language) tech.push(`language: ${input.language}`);
  if (input.subtitles) tech.push('include subtitles');

  lines.push(`\nTechnical requirements: ${tech.join(', ')}.`);

  if (input.negativePrompt?.trim()) {
    lines.push(`\nAvoid: ${input.negativePrompt.trim()}`);
  }

  return lines.join('\n').trim();
}

/** The exact style sentence inserted into the composer, so it can be removed. */
export function styleComposerText(styleId: string): string | undefined {
  const style = getVideoStyleById(styleId);
  if (!style) return undefined;
  return `Create a ${style.name.toLowerCase()} sequence: ${style.promptGuidance}.`;
}

/**
 * Insert a style instruction into the composer text without overwriting the
 * user's prompt and without duplicating an existing style instruction.
 */
export function insertStyleIntoPrompt(current: string, styleId: string): string {
  const addition = styleComposerText(styleId);
  if (!addition) return current;
  if (current.includes(addition)) return current;
  return current.trim() ? `${current.trim()}\n\n${addition}` : addition;
}

/** Remove a previously-inserted style instruction from the composer text. */
export function removeStyleFromPrompt(current: string, styleId: string | undefined): string {
  if (!styleId) return current;
  const addition = styleComposerText(styleId);
  if (!addition) return current;
  return current.replace(addition, '').replace(/\n{3,}/g, '\n\n').trim();
}
