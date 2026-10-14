/**
 * ARTI AI — video-generation provider boundary and capability registry.
 *
 * The single place where ARTI asks a real engine to render video. No other
 * module may fabricate, mock or simulate footage; when nothing is configured
 * callers get an honest `not-configured` error and the UI states the real setup
 * requirement.
 *
 * Only one path is genuinely integrated in this build:
 *
 *   `custom-server` — an owner-run bridge endpoint (`arti_endpoint_video`).
 *   ARTI POSTs JSON and expects either a synchronous result
 *   (`{ videos: [{ url | b64_json, width?, height?, duration?, format?, poster? }] }`)
 *   or an asynchronous job (`{ jobId }`) it can poll. The owner's server holds
 *   the real engine credential, so no provider key ever lives in the browser.
 *
 * Named commercial engines (Runway, Luma, Veo, Sora, Pika, …) are listed in the
 * registry for transparency with their real state. Their capability data is
 * NOT invented here: an unverified field is reported as `unknown` and a
 * provider that is not connected is reported as `PLANNED`/`READY_TO_INTEGRATE`
 * with the exact credential it would need. Marking a feature `VERIFIED` requires
 * real evidence and testing, which this environment cannot supply.
 */

import { activityStore } from './activityStore';

export type VideoProviderId = 'custom-server';

export type VideoProviderState =
  | 'PLANNED'
  | 'RESEARCHING'
  | 'READY_TO_INTEGRATE'
  | 'INTEGRATED'
  | 'VERIFIED'
  | 'BLOCKED';

export type VideoErrorCode =
  | 'not-configured'
  | 'unsupported'
  | 'auth'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'provider';

export class VideoServiceError extends Error {
  readonly code: VideoErrorCode;
  readonly retryable: boolean;
  constructor(code: VideoErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'VideoServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** A capability value is only `true`/`false` when it is genuinely known. */
export type CapabilityValue = boolean | 'unknown';

export interface VideoCapabilityProfile {
  textToVideo: CapabilityValue;
  imageToVideo: CapabilityValue;
  videoToVideo: CapabilityValue;
  /** Longest single continuous clip the engine renders, in seconds; null = unknown. */
  maxClipSeconds: number | null;
  aspectRatios: string[];
  resolutions: string[];
  native16k: CapabilityValue;
  upscaling: CapabilityValue;
  audioGeneration: CapabilityValue;
  dialogue: CapabilityValue;
  lipSync: CapabilityValue;
  referenceImage: CapabilityValue;
  characterConsistency: CapabilityValue;
  startEndFrame: CapabilityValue;
  seedControl: CapabilityValue;
  batchGeneration: CapabilityValue;
  longForm: CapabilityValue;
  videoExtension: CapabilityValue;
  commercialUse: CapabilityValue;
}

export interface VideoProviderInfo {
  id: string;
  label: string;
  state: VideoProviderState;
  /** Where the credential lives / what a real integration would need. */
  credential: string;
  /** Honest note about what is actually wired up in this build. */
  note: string;
  capability?: VideoCapabilityProfile;
  /** Rate-limit / cost / regional notes where known, else an honest gap. */
  operational?: string;
}

/** The capability profile of the owner-run bridge: declared by the server, so
 * ARTI never assumes a limit it has not been told. */
export const BRIDGE_CAPABILITY: VideoCapabilityProfile = {
  textToVideo: true,
  imageToVideo: 'unknown',
  videoToVideo: 'unknown',
  maxClipSeconds: null,
  aspectRatios: ['16:9', '9:16', '1:1', '2.39:1', '4:5', '21:9'],
  resolutions: ['480p', '720p', '1080p', '1440p', '2160p', 'custom'],
  native16k: 'unknown',
  upscaling: 'unknown',
  audioGeneration: 'unknown',
  dialogue: 'unknown',
  lipSync: 'unknown',
  referenceImage: 'unknown',
  characterConsistency: 'unknown',
  startEndFrame: 'unknown',
  seedControl: 'unknown',
  batchGeneration: 'unknown',
  longForm: 'unknown',
  videoExtension: 'unknown',
  commercialUse: 'unknown',
};

export const VIDEO_PROVIDERS: VideoProviderInfo[] = [
  {
    id: 'custom-server',
    label: 'Custom video bridge (server-side)',
    state: 'INTEGRATED',
    credential: 'Endpoint + optional key configured in Settings > Connected Services. Engine credentials stay on your server.',
    note: 'ARTI POSTs JSON and renders whatever your bridge returns. Capabilities beyond text-to-video are reported as unknown until your server declares them.',
    capability: BRIDGE_CAPABILITY,
    operational: 'Rate limits, cost and retention are governed by your own bridge and engine account.',
  },
  {
    id: 'runway',
    label: 'Runway',
    state: 'PLANNED',
    credential: 'Requires a Runway API account and key (not configured).',
    note: 'No Runway endpoint or credential is connected in this build. Capability data is not verified here and is therefore not claimed.',
  },
  {
    id: 'luma',
    label: 'Luma Dream Machine',
    state: 'PLANNED',
    credential: 'Requires a Luma API account and key (not configured).',
    note: 'No Luma endpoint or credential is connected. Capability data is unverified and not claimed.',
  },
  {
    id: 'veo',
    label: 'Google Veo',
    state: 'PLANNED',
    credential: 'Requires Google Cloud / Vertex AI credentials (not configured).',
    note: 'No Veo endpoint or credential is connected. Capability data is unverified and not claimed.',
  },
  {
    id: 'sora',
    label: 'OpenAI Sora',
    state: 'PLANNED',
    credential: 'Requires an OpenAI video-capable account and key (not configured).',
    note: 'No Sora endpoint or credential is connected. Capability data is unverified and not claimed.',
  },
  {
    id: 'pika',
    label: 'Pika',
    state: 'PLANNED',
    credential: 'Requires a Pika API account and key (not configured).',
    note: 'No Pika endpoint or credential is connected. Capability data is unverified and not claimed.',
  },
  {
    id: 'stable-video',
    label: 'Stable Video Diffusion (self-hosted)',
    state: 'READY_TO_INTEGRATE',
    credential: 'Requires a local GPU worker exposing an HTTP endpoint. Wire it through the custom bridge.',
    note: 'A local diffusion worker can be reached through the custom bridge endpoint; no GPU worker is connected here.',
  },
];

export function getProviderInfo(id: string): VideoProviderInfo | undefined {
  return VIDEO_PROVIDERS.find((p) => p.id === id);
}

/* --------------------------------------------------------------------------
   Connection resolution. Provider choice, endpoint and key are read from the
   same localStorage the Settings workspace writes; nothing is bundled.
   -------------------------------------------------------------------------- */
export interface VideoConnection {
  providerId: VideoProviderId;
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

export function getSelectedVideoProvider(): VideoProviderId {
  // Only the bridge is integrated; the selector is kept for forward
  // compatibility but always resolves to the integrated path.
  return 'custom-server';
}

/** Resolve the active video connection, or `null` when nothing is configured. */
export function getVideoConnection(): VideoConnection | null {
  const endpoint = read('arti_endpoint_video');
  if (!endpoint) return null;
  return { providerId: 'custom-server', endpoint, key: read('arti_key_video') };
}

export function isVideoProviderConfigured(): boolean {
  return getVideoConnection() !== null;
}

export function getSelectedVideoModel(): string {
  return read('arti_video_model');
}

export function videoConnectionLabel(): string {
  const conn = getVideoConnection();
  if (!conn) return 'Not connected';
  const model = getSelectedVideoModel();
  return model ? `Custom video bridge · ${model}` : 'Custom video bridge';
}

/* --------------------------------------------------------------------------
   Request / response shapes.
   -------------------------------------------------------------------------- */
export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  /** Requested duration in seconds (fractional allowed). */
  durationSeconds: number;
  aspectRatio: string;
  /** UI resolution token (e.g. `1080p`, `2160p`, `custom`). */
  resolution: string;
  /** Custom `WIDTHxHEIGHT` when `resolution` is `custom`. */
  customResolution?: string;
  fps: number;
  model: string;
  seed?: string;
  /** Optional reference-image data URL for identity continuity (bridge-dependent). */
  referenceImage?: string;
  startFrame?: string;
  endFrame?: string;
}

export interface GeneratedVideo {
  id: string;
  /** Provider URL or a data URL. ARTI never copies it to its own storage. */
  url: string;
  width: number;
  height: number;
  durationSeconds: number;
  format: string;
  /** Optional poster/thumbnail the provider returned. */
  poster?: string;
  /** Honest marker when the asset was upscaled by a real, separate step. */
  upscaledFrom?: string;
}

export interface VideoGenerationResponse {
  videos: GeneratedVideo[];
  providerId: VideoProviderId;
  model: string;
  /** What ARTI asked for. */
  requested: { durationSeconds: number; resolution: string; aspectRatio: string; fps: number };
  /** What the engine actually produced (may differ; never hidden). */
  effective: { durationSeconds?: number; resolution?: string; aspectRatio?: string; fps?: number };
  note?: string;
}

const REQUEST_TIMEOUT_MS = 600_000;

function classifyStatus(status: number): VideoErrorCode {
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

interface BridgeVideoRow {
  url?: string;
  b64_json?: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  poster?: string;
  upscaled_from?: string;
}

function decodeVideo(row: BridgeVideoRow, index: number, fallback: { width: number; height: number; duration: number }): GeneratedVideo {
  const id = 'vid_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 6);
  const width = typeof row.width === 'number' ? row.width : fallback.width;
  const height = typeof row.height === 'number' ? row.height : fallback.height;
  const durationSeconds = typeof row.duration === 'number' ? row.duration : fallback.duration;
  if (typeof row.b64_json === 'string' && row.b64_json) {
    return { id, url: `data:video/mp4;base64,${row.b64_json}`, width, height, durationSeconds, format: row.format || 'mp4', poster: row.poster, upscaledFrom: row.upscaled_from };
  }
  if (typeof row.url === 'string' && row.url) {
    return { id, url: row.url, width, height, durationSeconds, format: row.format || guessFormat(row.url), poster: row.poster, upscaledFrom: row.upscaled_from };
  }
  throw new VideoServiceError('provider', 'The video bridge returned an entry without a URL or data.', true);
}

function guessFormat(url: string): string {
  const m = url.split('?')[0].match(/\.(mp4|webm|mov|mkv|m4v)$/i);
  return m ? m[1].toLowerCase() : 'mp4';
}

/** Parse a `WIDTHxHEIGHT` token, returning zeros when it is not concrete. */
export function parseResolutionToken(token: string): { width: number; height: number } {
  const m = token.match(/^(\d+)x(\d+)$/);
  if (!m) return { width: 0, height: 0 };
  return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
}

async function requestBridge(
  conn: VideoConnection,
  req: VideoGenerationRequest,
  signal: AbortSignal
): Promise<VideoGenerationResponse> {
  // The endpoint is owner-configured in Settings (not user input from untrusted
  // content); only http(s) is accepted so no other scheme can be reached.
  let url: URL;
  try {
    url = new URL(conn.endpoint);
  } catch {
    throw new VideoServiceError('not-configured', 'The configured video endpoint is not a valid URL.', false);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new VideoServiceError('not-configured', 'The video endpoint must use http or https.', false);
  }

  const payload: Record<string, unknown> = {
    prompt: req.prompt,
    duration: req.durationSeconds,
    aspect_ratio: req.aspectRatio,
    resolution: req.resolution === 'custom' ? req.customResolution : req.resolution,
    fps: req.fps,
    model: req.model || 'custom',
  };
  if (req.negativePrompt) payload.negative_prompt = req.negativePrompt;
  if (req.seed && req.seed !== '-1') payload.seed = Number(req.seed) || req.seed;
  if (req.referenceImage) payload.reference_image = req.referenceImage;
  if (req.startFrame) payload.start_frame = req.startFrame;
  if (req.endFrame) payload.end_frame = req.endFrame;

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
    throw new VideoServiceError(
      classifyStatus(res.status),
      `Video bridge error ${res.status}${detail ? `: ${detail}` : ''}`,
      res.status >= 500 || res.status === 429
    );
  }

  const data = (await res.json()) as {
    videos?: BridgeVideoRow[];
    data?: BridgeVideoRow[];
    jobId?: string;
    width?: number;
    height?: number;
  };
  const rows = data.videos ?? data.data ?? [];
  if (rows.length === 0) {
    if (data.jobId) {
      throw new VideoServiceError(
        'provider',
        `The bridge accepted the job (id ${data.jobId}) but asynchronous polling is not connected here. Return the finished asset synchronously or poll from your own server.`,
        false
      );
    }
    throw new VideoServiceError('provider', 'The video bridge returned no video.', true);
  }

  const requestedRes = req.resolution === 'custom' ? req.customResolution || '' : req.resolution;
  const fallback = {
    width: data.width ?? parseResolutionToken(requestedRes).width,
    height: data.height ?? parseResolutionToken(requestedRes).height,
    duration: req.durationSeconds,
  };
  const videos = rows.map((row, i) => decodeVideo(row, i, fallback));
  const first = videos[0];

  // Report requested vs effective honestly: if the engine returned something
  // other than what was asked, say so rather than hiding it.
  const effectiveResolution = first && first.width ? `${first.width}x${first.height}` : undefined;
  const mismatches: string[] = [];
  if (effectiveResolution && requestedRes && effectiveResolution !== requestedRes) {
    mismatches.push(`resolution ${requestedRes} → ${effectiveResolution}`);
  }
  if (first && Math.abs(first.durationSeconds - req.durationSeconds) > 0.5) {
    mismatches.push(`duration ${req.durationSeconds}s → ${first.durationSeconds}s`);
  }

  return {
    videos,
    providerId: 'custom-server',
    model: req.model || 'custom',
    requested: {
      durationSeconds: req.durationSeconds,
      resolution: requestedRes,
      aspectRatio: req.aspectRatio,
      fps: req.fps,
    },
    effective: {
      durationSeconds: first?.durationSeconds,
      resolution: effectiveResolution,
      fps: req.fps,
    },
    note: mismatches.length
      ? `The engine produced different output than requested: ${mismatches.join(', ')}.`
      : undefined,
  };
}

/**
 * Ask the configured bridge to render the video. Throws {@link VideoServiceError}
 * on every failure path; never returns a fabricated result.
 */
export async function generateVideo(
  req: VideoGenerationRequest,
  signal: AbortSignal
): Promise<VideoGenerationResponse> {
  const conn = getVideoConnection();
  const activityId = activityStore.begin('video', 'Video generation');
  if (!conn) {
    const message =
      'No video bridge is configured. Add a video bridge endpoint in Settings > Connected Services, then try again.';
    activityStore.settle(activityId, 'blocked', message);
    throw new VideoServiceError('not-configured', message, false);
  }

  const { signal: linked, done } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  try {
    const response = await requestBridge(conn, req, signal && linked ? linked : signal);
    activityStore.settle(activityId, 'complete');
    return response;
  } catch (err) {
    if (err instanceof VideoServiceError) {
      activityStore.settle(activityId, err.code === 'not-configured' ? 'blocked' : 'failed', err.message);
      throw err;
    }
    if (isAbort(err)) {
      if (signal.aborted) {
        activityStore.settle(activityId, 'cancelled', 'Stopped by the operator.');
        throw err;
      }
      activityStore.settle(activityId, 'failed', 'The video engine timed out before returning a result.');
      throw new VideoServiceError('timeout', 'The video engine timed out before returning a result.', true);
    }
    activityStore.settle(activityId, 'failed', 'Could not reach the video bridge.');
    throw new VideoServiceError('network', 'Could not reach the video bridge. Check your network and endpoint.', true);
  } finally {
    done();
  }
}

/* --------------------------------------------------------------------------
   Duration / resolution validation against real capability.
   -------------------------------------------------------------------------- */
export interface DurationValidation {
  /** True when the request can be attempted as a single continuous render. */
  ok: boolean;
  /** Honest explanation when it cannot, or when the limit is unknown. */
  note?: string;
  /** Suggested segmented plan when a single render is not possible. */
  segments?: number;
}

/**
 * Validate a single continuous video request against the configured engine's
 * declared maximum clip length. When the limit is unknown it is reported as
 * unknown — ARTI never invents a provider maximum.
 */
export function validateContinuousDuration(
  requestedSeconds: number,
  capability: VideoCapabilityProfile = BRIDGE_CAPABILITY
): DurationValidation {
  if (capability.maxClipSeconds === null) {
    return {
      ok: true,
      note: 'The bridge has not declared a maximum clip length, so ARTI cannot confirm this length in one render. It will be attempted and the engine’s real response reported.',
    };
  }
  if (requestedSeconds <= capability.maxClipSeconds) return { ok: true };
  const segments = Math.ceil(requestedSeconds / capability.maxClipSeconds);
  return {
    ok: false,
    note: `The engine renders at most ${formatSeconds(capability.maxClipSeconds)} per continuous clip. This request needs about ${segments} segments; use a structured production (scenes/episodes) or segmented rendering.`,
    segments,
  };
}

function formatSeconds(s: number): string {
  if (s >= 3600) return `${Math.round(s / 360) / 10} h`;
  if (s >= 60) return `${Math.round(s / 6) / 10} min`;
  return `${s} s`;
}

/** The 16K honesty statement — never claim native 16K that the engine lacks. */
export function sixteenKStatement(capability: VideoCapabilityProfile = BRIDGE_CAPABILITY): string {
  if (capability.native16k === true) {
    return 'The engine reports native 16K output.';
  }
  if (capability.native16k === 'unknown') {
    return 'Native 16K is not declared by this engine. A 16K target would require the engine to generate it or a separate real upscale step; neither is claimed here.';
  }
  return 'The engine does not support native 16K. A lower-resolution render can be upscaled only if a real upscale step is connected, and upscaling never restores detail that was never captured.';
}
