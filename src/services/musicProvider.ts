/**
 * ARTI AI — music-generation provider boundary, style catalog and capability
 * registry.
 *
 * This is the single place where ARTI asks a real music engine to render audio.
 * No other module may fabricate, mock or simulate a track; when nothing is
 * configured callers get an honest `not-configured` error and the UI states the
 * real setup requirement.
 *
 * Only one path is genuinely integrated in this build:
 *
 *   `custom-server` — an owner-run bridge endpoint (`arti_endpoint_music`).
 *   ARTI POSTs JSON and expects either a synchronous result
 *   (`{ tracks: [{ url | b64_json, duration?, format?, title? }] }`) or a bare
 *   `{ jobId }` (reported honestly as not polled here). The owner's server holds
 *   the real engine credential, so no provider key ever lives in the browser.
 *
 * Named commercial engines (Suno, Udio, Stable Audio, MusicGen, …) are listed in
 * the registry for transparency with their real state. Their capability data is
 * NOT invented here: an unverified field is reported as `unknown`, and a
 * provider that is not connected is reported as `PLANNED`/`READY_TO_INTEGRATE`
 * with the exact credential it would need. Marking a capability `VERIFIED`
 * requires real evidence and testing, which this environment cannot supply.
 *
 * IMPORTANT: a language model that writes lyrics is a *text* model. It does not
 * prove that audio generation, vocals, or a given language's vocals are
 * implemented. The two are kept strictly separate.
 */

import { activityStore } from './activityStore';
import type { GeneratedTrackRecord } from './chatStore';

export type MusicProviderId = 'custom-server';

export type MusicProviderState =
  | 'PLANNED'
  | 'RESEARCHING'
  | 'READY_TO_INTEGRATE'
  | 'INTEGRATED'
  | 'VERIFIED'
  | 'BLOCKED';

export type MusicErrorCode =
  | 'not-configured'
  | 'unsupported'
  | 'auth'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'provider';

export class MusicServiceError extends Error {
  readonly code: MusicErrorCode;
  readonly retryable: boolean;
  constructor(code: MusicErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'MusicServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** A capability value is only `true`/`false` when it is genuinely known. */
export type CapabilityValue = boolean | 'unknown';

export interface MusicCapabilityProfile {
  /** Text/theme → full song with vocals. */
  textToSong: CapabilityValue;
  /** Text/theme → instrumental. */
  textToInstrumental: CapabilityValue;
  /** The provider sings supplied lyrics. */
  lyricsToSong: CapabilityValue;
  /** The provider writes lyrics itself (separate from ARTI's own lyrics writer). */
  nativeLyrics: CapabilityValue;
  /** Vocal configurations genuinely available. */
  vocals: VocalCapabilityValue;
  /** Real maximum clip length, in seconds; null = unknown. */
  maxDurationSeconds: number | null;
  /** Languages the provider can sing in; `null` = not declared. */
  vocalLanguages: string[] | null;
  /** Named instrumental styles the provider claims. `null` = not declared. */
  instrumentalStyles: string[] | null;
  /** Real transformations the provider supports. */
  transformations: CapabilityValue;
  /** The provider accepts an explicit seed. */
  seedControl: CapabilityValue;
  /** Commercial-use rights of the returned audio. */
  commercialUse: CapabilityValue;
  /** Whether the provider reports real generation progress. */
  progressReporting: CapabilityValue;
  /** Whether the provider supports cancellation of an in-flight job. */
  cancellation: CapabilityValue;
}

export type VocalCapabilityValue =
  | { kind: 'declared'; male: boolean; female: boolean; duet: boolean; instrumental: boolean }
  | 'unknown';

export interface MusicProviderInfo {
  id: string;
  label: string;
  state: MusicProviderState;
  /** Where the credential lives / what a real integration would need. */
  credential: string;
  /** Honest note about what is actually wired up in this build. */
  note: string;
  capability?: MusicCapabilityProfile;
  operational?: string;
}

/**
 * The owner-run bridge's capability profile. ARTI never assumes a limit it has
 * not been told: the bridge declares its own profile, and anything undeclared is
 * reported as `unknown` rather than guessed.
 */
export const BRIDGE_CAPABILITY: MusicCapabilityProfile = {
  textToSong: true,
  textToInstrumental: true,
  lyricsToSong: true,
  nativeLyrics: 'unknown',
  vocals: 'unknown',
  maxDurationSeconds: null,
  vocalLanguages: null,
  instrumentalStyles: null,
  transformations: 'unknown',
  seedControl: 'unknown',
  commercialUse: 'unknown',
  progressReporting: 'unknown',
  cancellation: 'unknown',
};

export const MUSIC_PROVIDERS: MusicProviderInfo[] = [
  {
    id: 'custom-server',
    label: 'Custom music bridge (server-side)',
    state: 'INTEGRATED',
    credential:
      'Endpoint + optional key configured in Settings > Connected Services. Engine credentials stay on your server.',
    note:
      'ARTI POSTs JSON and plays back whatever your bridge returns. Capabilities beyond text-to-song / text-to-instrumental / lyrics-to-song are reported as unknown until your server declares them.',
    capability: BRIDGE_CAPABILITY,
    operational: 'Rate limits, cost and retention are governed by your own bridge and engine account.',
  },
  {
    id: 'suno',
    label: 'Suno',
    state: 'PLANNED',
    credential: 'Requires a Suno API account and key (not configured).',
    note: 'No Suno endpoint or credential is connected in this build. Capability data is not verified here and is therefore not claimed.',
  },
  {
    id: 'udio',
    label: 'Udio',
    state: 'PLANNED',
    credential: 'Requires a Udio API account and key (not configured).',
    note: 'No Udio endpoint or credential is connected. Capability data is unverified and not claimed.',
  },
  {
    id: 'stable-audio',
    label: 'Stable Audio (self-hosted)',
    state: 'READY_TO_INTEGRATE',
    credential: 'Requires a local GPU worker exposing an HTTP endpoint. Wire it through the custom bridge.',
    note: 'A local audio-diffusion worker can be reached through the custom bridge endpoint; no GPU worker is connected here.',
  },
  {
    id: 'musicgen',
    label: 'MusicGen (self-hosted)',
    state: 'READY_TO_INTEGRATE',
    credential: 'Requires a local GPU worker exposing an HTTP endpoint. Wire it through the custom bridge.',
    note: 'Meta MusicGen can be run locally and reached through the custom bridge; no GPU worker is connected here. MusicGen is primarily instrumental.',
  },
];

export function getMusicProviderInfo(id: string): MusicProviderInfo | undefined {
  return MUSIC_PROVIDERS.find((p) => p.id === id);
}

/* --------------------------------------------------------------------------
   Connection resolution. Endpoint and key are read from the same localStorage
   the Settings workspace writes; nothing is bundled.
   -------------------------------------------------------------------------- */
export interface MusicConnection {
  providerId: MusicProviderId;
  key: string;
  endpoint: string;
}

function read(name: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(name) || '').trim();
  } catch {
    return '';
  }
}

export function getSelectedMusicProvider(): MusicProviderId {
  // Only the bridge is integrated; the selector is kept for forward
  // compatibility but always resolves to the integrated path.
  return 'custom-server';
}

/** Resolve the active music connection, or `null` when nothing is configured. */
export function getMusicConnection(): MusicConnection | null {
  const endpoint = read('arti_endpoint_music');
  if (!endpoint) return null;
  return { providerId: 'custom-server', endpoint, key: read('arti_key_music') };
}

export function isMusicProviderConfigured(): boolean {
  return getMusicConnection() !== null;
}

export function getSelectedMusicModel(): string {
  return read('arti_music_model');
}

export function musicConnectionLabel(): string {
  const conn = getMusicConnection();
  if (!conn) return 'Not connected';
  const model = getSelectedMusicModel();
  return model ? `Custom music bridge · ${model}` : 'Custom music bridge';
}

/** The active capability profile, or the bridge's declared profile. */
export function getActiveMusicCapability(): MusicCapabilityProfile {
  const info = getMusicProviderInfo(getSelectedMusicProvider());
  return info?.capability ?? BRIDGE_CAPABILITY;
}

/* ==========================================================================
   Instrumental preset catalog (background music)
   ========================================================================== */

export interface InstrumentalPreset {
  id: string;
  label: string;
  /** Intended use. */
  use: string;
  mood: string;
  energy: string;
  guidance: string;
}

export const INSTRUMENTAL_PRESETS: InstrumentalPreset[] = [
  { id: 'cinematic-background', label: 'Cinematic background', use: 'Film / trailer', mood: 'Epic', energy: 'Medium', guidance: 'Wide orchestral bed, slow build, restrained dynamics behind dialogue.' },
  { id: 'emotional-scene', label: 'Emotional scene', use: 'Film / drama', mood: 'Emotional', energy: 'Low', guidance: 'Sparse piano and strings, warm harmonic movement, room to breathe.' },
  { id: 'suspense', label: 'Suspense', use: 'Film / thriller', mood: 'Tense', energy: 'Low–medium', guidance: 'Sustained dissonant pads, ticking pulse, unresolved harmony.' },
  { id: 'action', label: 'Action', use: 'Film / game', mood: 'Intense', energy: 'High', guidance: 'Driving percussion, brass stabs, rising ostinato.' },
  { id: 'documentary', label: 'Documentary', use: 'Documentary', mood: 'Neutral', energy: 'Low', guidance: 'Unobtrusive ambient bed, gentle motion, no strong melodic hook.' },
  { id: 'ambient-soundscape', label: 'Ambient soundscape', use: 'Any', mood: 'Calm', energy: 'Low', guidance: 'Textural drones, slow evolution, no percussion.' },
  { id: 'relaxation', label: 'Relaxation', use: 'Wellness', mood: 'Calm', energy: 'Low', guidance: 'Soft pads, gentle arpeggios, warm low end.' },
  { id: 'study-focus', label: 'Study & focus', use: 'Productivity', mood: 'Focused', energy: 'Low–medium', guidance: 'Minimal lo-fi texture, steady unobtrusive rhythm.' },
  { id: 'podcast-background', label: 'Podcast background', use: 'Podcast', mood: 'Friendly', energy: 'Low', guidance: 'Light groove under speech, mid-range dip so the voice stays clear.' },
  { id: 'game-environment', label: 'Game environment', use: 'Game', mood: 'Varied', energy: 'Low–medium', guidance: 'Loopable ambient bed with subtle variation, no hard ending.' },
  { id: 'short-intro', label: 'Short intro / ident', use: 'Branding', mood: 'Bold', energy: 'High', guidance: 'Short sting, strong opening hit, quick resolve.' },
  { id: 'custom-score', label: 'Custom soundtrack', use: 'Any', mood: 'Your choice', energy: 'Your choice', guidance: 'Describe the theme and ARTI shapes the arrangement from your words.' },
];

/* ==========================================================================
   Request / response shapes
   ========================================================================== */

export interface MusicGenerationRequest {
  /** The structured, provider-facing prompt (built by `musicPrompt`). */
  prompt: string;
  /** Optional negative prompt. */
  negativePrompt?: string;
  /** The lyrics body actually sent (empty for instrumental). */
  lyrics?: string;
  instrumental: boolean;
  /** Vocal type requested (may be declined by an undeclared provider). */
  vocalType?: string;
  /** ISO-ish language code the vocals are requested in. */
  language?: string;
  /** Requested duration in seconds (fractional allowed). */
  durationSeconds: number;
  genre?: string;
  mood?: string;
  model: string;
  seed?: string;
}

export interface GeneratedTrack {
  id: string;
  /** Provider URL or a data URL. ARTI never copies it to its own storage. */
  url: string;
  durationSeconds: number;
  format: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface MusicGenerationResponse {
  tracks: GeneratedTrack[];
  providerId: MusicProviderId;
  model: string;
  requested: { durationSeconds: number; instrumental: boolean; language?: string };
  /** What the engine actually produced (may differ; never hidden). */
  effective: { durationSeconds?: number; format?: string };
  note?: string;
}

const REQUEST_TIMEOUT_MS = 900_000;

function classifyStatus(status: number): MusicErrorCode {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  if (status === 400 || status === 404 || status === 422) return 'unsupported';
  return 'provider';
}

function withTimeout(signal: AbortSignal, ms: number): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = window.setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    done: () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    },
  };
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text
      .slice(0, 300)
      .replace(/(sk-[A-Za-z0-9_-]{8,})/g, 'sk-***')
      .replace(/(bearer\s+)[A-Za-z0-9._-]{8,}/gi, '$1***');
  } catch {
    return '';
  }
}

interface BridgeTrackRow {
  url?: string;
  b64_json?: string;
  duration?: number;
  format?: string;
  title?: string;
  width?: number;
  height?: number;
}

function guessFormat(url: string): string {
  const m = url.split('?')[0].match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i);
  return m ? m[1].toLowerCase() : 'mp3';
}

function decodeTrack(row: BridgeTrackRow, index: number, fallbackDuration: number): GeneratedTrack {
  const id = 'trk_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 6);
  const durationSeconds = typeof row.duration === 'number' ? row.duration : fallbackDuration;
  if (typeof row.b64_json === 'string' && row.b64_json) {
    return {
      id,
      url: `data:audio/mpeg;base64,${row.b64_json}`,
      durationSeconds,
      format: row.format || 'mp3',
      title: row.title,
      width: row.width,
      height: row.height,
    };
  }
  if (typeof row.url === 'string' && row.url) {
    return {
      id,
      url: row.url,
      durationSeconds,
      format: row.format || guessFormat(row.url),
      title: row.title,
      width: row.width,
      height: row.height,
    };
  }
  throw new MusicServiceError('provider', 'The music bridge returned an entry without a URL or data.', true);
}

async function requestBridge(
  conn: MusicConnection,
  req: MusicGenerationRequest,
  signal: AbortSignal
): Promise<MusicGenerationResponse> {
  // The endpoint is owner-configured in Settings (not user input from untrusted
  // content); only http(s) is accepted so no other scheme can be reached.
  let url: URL;
  try {
    url = new URL(conn.endpoint);
  } catch {
    throw new MusicServiceError('not-configured', 'The configured music endpoint is not a valid URL.', false);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new MusicServiceError('not-configured', 'The music endpoint must use http or https.', false);
  }

  const payload: Record<string, unknown> = {
    prompt: req.prompt,
    instrumental: req.instrumental,
    duration: req.durationSeconds,
    model: req.model || 'custom',
  };
  if (req.lyrics) payload.lyrics = req.lyrics;
  if (req.vocalType) payload.vocal_type = req.vocalType;
  if (req.language) payload.language = req.language;
  if (req.genre) payload.genre = req.genre;
  if (req.mood) payload.mood = req.mood;
  if (req.negativePrompt) payload.negative_prompt = req.negativePrompt;
  if (req.seed && req.seed !== '-1') payload.seed = Number(req.seed) || req.seed;

  const res = await fetch(url.toString(), {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      ...(conn.key ? { authorization: `Bearer ${conn.key}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await safeErrorText(res);
    throw new MusicServiceError(
      classifyStatus(res.status),
      `Music bridge error ${res.status}${detail ? `: ${detail}` : ''}`,
      res.status >= 500 || res.status === 429
    );
  }

  const data = (await res.json()) as {
    tracks?: BridgeTrackRow[];
    data?: BridgeTrackRow[];
    jobId?: string;
    note?: string;
  };
  const rows = data.tracks ?? data.data ?? [];
  if (rows.length === 0) {
    if (data.jobId) {
      throw new MusicServiceError(
        'provider',
        `The bridge accepted the job (id ${data.jobId}) but asynchronous polling is not connected here. Return the finished audio synchronously or poll from your own server.`,
        false
      );
    }
    throw new MusicServiceError('provider', 'The music bridge returned no track.', true);
  }

  const tracks = rows.map((row, i) => decodeTrack(row, i, req.durationSeconds));
  return {
    tracks,
    providerId: 'custom-server',
    model: req.model || 'custom',
    requested: { durationSeconds: req.durationSeconds, instrumental: req.instrumental, language: req.language },
    effective: { durationSeconds: tracks[0]?.durationSeconds, format: tracks[0]?.format },
    note: data.note,
  };
}

/**
 * Ask the configured provider to render the track(s). Throws
 * {@link MusicServiceError} on every failure path; never returns a fabricated
 * result. The real request lifecycle is published to the shared activity store.
 */
export async function generateMusic(
  req: MusicGenerationRequest,
  signal: AbortSignal
): Promise<MusicGenerationResponse> {
  const conn = getMusicConnection();
  const activityId = activityStore.begin('music', req.instrumental ? 'Instrumental generation' : 'Song generation');
  if (!conn) {
    const message =
      'No music provider is connected. Add a music bridge endpoint in Settings > Connected Services. No audio is generated until then.';
    activityStore.settle(activityId, 'blocked', message);
    throw new MusicServiceError('not-configured', message, false);
  }

  const { signal: linked, done } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  try {
    const response = await requestBridge(conn, req, linked);
    activityStore.settle(activityId, 'complete');
    return response;
  } catch (err) {
    if (err instanceof MusicServiceError) {
      activityStore.settle(activityId, err.code === 'not-configured' ? 'blocked' : 'failed', err.message);
      throw err;
    }
    if (isAbort(err)) {
      if (signal.aborted) {
        activityStore.settle(activityId, 'cancelled', 'Stopped by the operator.');
        throw err;
      }
      activityStore.settle(activityId, 'failed', 'The music provider timed out before returning a result.');
      throw new MusicServiceError('timeout', 'The music provider timed out before returning a result.', true);
    }
    activityStore.settle(activityId, 'failed', 'Could not reach the music provider.');
    throw new MusicServiceError('network', 'Could not reach the music provider. Check your network and endpoint.', true);
  } finally {
    done();
  }
}

/**
 * Map a real provider response into a persisted track record. A response with
 * no playable asset yields a `blocked` record — never a fake URL or a
 * placeholder file presented as the user's song.
 */
export function toTrackRecord(
  response: MusicGenerationResponse,
  meta: {
    originalPrompt: string;
    preparedPrompt: string;
    mode: string;
    title: string;
    language: string;
    genre: string;
    lyrics?: string;
    instrumental: boolean;
    vocalType?: string;
    provenance: GeneratedTrackRecord['provenance'];
  }
): GeneratedTrackRecord {
  const first = response.tracks[0];
  const hasAudio = Boolean(first && first.url);
  return {
    id: 'track_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    title: first?.title?.trim() || meta.title,
    mode: meta.mode,
    providerId: response.providerId,
    model: response.model,
    originalPrompt: meta.originalPrompt,
    preparedPrompt: meta.preparedPrompt,
    lyrics: meta.lyrics,
    language: meta.language,
    genre: meta.genre,
    instrumental: meta.instrumental,
    vocalType: meta.vocalType,
    durationSeconds: first?.durationSeconds ?? response.requested.durationSeconds,
    format: first?.format ?? 'mp3',
    audioUrl: first?.url,
    provenance: meta.provenance,
    favorite: false,
    status: hasAudio ? 'complete' : 'blocked',
    error: hasAudio ? undefined : 'The provider returned no playable audio for this request.',
  };
}
