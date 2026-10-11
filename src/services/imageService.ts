/**
 * ARTI AI — image-generation provider boundary.
 *
 * The single place where ARTI asks a real image model to render. No other
 * module may fabricate, mock or simulate an image; when nothing is configured
 * callers get an honest `not-configured` error and the UI shows a real setup
 * requirement.
 *
 * Two providers are supported, both opt-in from Settings > Connected Services:
 *
 *   1. `openai`        — direct browser call to api.openai.com using the same
 *                        OpenAI key already stored for chat (`arti_key_openai`).
 *                        Requires the owner's opt-in on a personal device; the
 *                        key is sent only to OpenAI's own host and never logged.
 *   2. `custom-server` — a user-run bridge endpoint (`arti_endpoint_image`).
 *                        This is the recommended path for production because
 *                        the provider credential then lives on the server, not
 *                        in the browser. ARTI POSTs JSON and expects
 *                        `{ images: [{ b64_json | url, width?, height? }] }`.
 *
 * Capability data below is the provider's declared capability, not a promise:
 * the Images UI only exposes a control when the selected model genuinely
 * supports it, and every unsupported request is reported honestly.
 */

import type { GeneratedImage } from './chatStore';

export type ImageProviderId = 'openai' | 'custom-server';

export type ImageErrorCode =
  | 'not-configured'
  | 'unsupported'
  | 'auth'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'provider';

export class ImageServiceError extends Error {
  readonly code: ImageErrorCode;
  readonly retryable: boolean;
  constructor(code: ImageErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'ImageServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export interface ImageModelCapability {
  id: string;
  label: string;
  /** Exact size tokens this model accepts. */
  sizes: string[];
  /** True when the model accepts an arbitrary `WxH` size (custom dimensions). */
  customSize: boolean;
  qualities: string[];
  /** Maximum images per request the API accepts. */
  maxCount: number;
  supportsSeed: boolean;
  supportsNegativePrompt: boolean;
  supportsStyleStrength: boolean;
  supportsTransparentBackground: boolean;
  /** Largest native output edge, in pixels, the model produces. */
  nativeMaxEdge: number;
  /** How the provider hands back the asset. */
  delivery: 'url' | 'base64';
  note: string;
}

export interface ImageProviderCapability {
  id: ImageProviderId;
  label: string;
  /** Where the credential lives for this provider. */
  credential: string;
  models: ImageModelCapability[];
  /** Honest statement of the resolution ceiling for this provider path. */
  resolutionNote: string;
}

const OPENAI_MODELS: ImageModelCapability[] = [
  {
    id: 'gpt-image-1',
    label: 'GPT Image 1',
    sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
    customSize: false,
    qualities: ['low', 'medium', 'high', 'auto'],
    maxCount: 10,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleStrength: false,
    supportsTransparentBackground: true,
    nativeMaxEdge: 1536,
    delivery: 'base64',
    note: 'Native output is up to 1536 px on the long edge. Higher sizes require a separate upscale step, which is not connected here.',
  },
  {
    id: 'dall-e-3',
    label: 'DALL·E 3',
    sizes: ['1024x1024', '1024x1792', '1792x1024'],
    customSize: false,
    qualities: ['standard', 'hd'],
    maxCount: 1,
    supportsSeed: false,
    supportsNegativePrompt: false,
    supportsStyleStrength: false,
    supportsTransparentBackground: false,
    nativeMaxEdge: 1792,
    delivery: 'url',
    note: 'One image per request; returns a temporary provider URL. Native output is up to 1792 px on the long edge.',
  },
];

const CUSTOM_MODEL: ImageModelCapability = {
  id: 'custom',
  label: 'Server-defined model',
  sizes: [
    '1024x1024', '1024x1792', '1792x1024', '1536x1024', '1024x1536',
    '2048x2048', '2048x1152', '1152x2048', '4096x2160', '2160x4096',
  ],
  customSize: true,
  qualities: ['standard', 'high', 'auto'],
  maxCount: 8,
  supportsSeed: true,
  supportsNegativePrompt: true,
  supportsStyleStrength: true,
  supportsTransparentBackground: true,
  nativeMaxEdge: 4096,
  delivery: 'base64',
  note: 'The custom bridge decides its own model and true limits. ARTI reports the width/height actually returned by the server and never assumes 16K support.',
};

export const IMAGE_PROVIDERS: ImageProviderCapability[] = [
  {
    id: 'openai',
    label: 'OpenAI Images (direct)',
    credential: 'Uses your OpenAI key (Settings > Connected Services). Sent only to api.openai.com.',
    models: OPENAI_MODELS,
    resolutionNote: 'Native output is provider-limited (up to 1792 px here). No 16K generation is claimed.',
  },
  {
    id: 'custom-server',
    label: 'Custom image bridge (server-side)',
    credential: 'Endpoint + optional key configured in Settings. Provider credentials stay on your server.',
    models: [CUSTOM_MODEL],
    resolutionNote: 'Native resolution is whatever your server returns. Upscaling to 16K only if your server performs it for real.',
  },
];

export function getProviderCapability(id: ImageProviderId): ImageProviderCapability {
  return IMAGE_PROVIDERS.find((p) => p.id === id) ?? IMAGE_PROVIDERS[0];
}

export function getModelCapability(
  providerId: ImageProviderId,
  modelId: string
): ImageModelCapability | undefined {
  return getProviderCapability(providerId).models.find((m) => m.id === modelId);
}

/* --------------------------------------------------------------------------
   Connection resolution. Provider choice, endpoint and key are read from the
   same localStorage the Settings workspace writes; nothing is bundled.
   -------------------------------------------------------------------------- */
export interface ImageConnection {
  providerId: ImageProviderId;
  /** API key for the provider path (empty for an unauthenticated local bridge). */
  key: string;
  /** Base endpoint for the custom bridge. */
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

const DEFAULT_IMAGE_ENDPOINT = '';

export function getSelectedImageProvider(): ImageProviderId {
  const stored = read('arti_image_provider');
  return stored === 'custom-server' ? 'custom-server' : 'openai';
}

/** Resolve the active image connection, or `null` when nothing is configured. */
export function getImageConnection(): ImageConnection | null {
  const providerId = getSelectedImageProvider();
  if (providerId === 'custom-server') {
    const endpoint = read('arti_endpoint_image') || DEFAULT_IMAGE_ENDPOINT;
    if (!endpoint) return null;
    return { providerId, endpoint, key: read('arti_key_image') };
  }
  const key = read('arti_key_openai');
  if (!key) return null;
  return { providerId, key, endpoint: '' };
}

export function isImageProviderConfigured(): boolean {
  return getImageConnection() !== null;
}

/** Honest label for the current connection state, used in the composer notice. */
export function imageConnectionLabel(): string {
  const conn = getImageConnection();
  if (!conn) return 'Not connected';
  return conn.providerId === 'custom-server'
    ? 'Custom image bridge'
    : `OpenAI Images · ${getSelectedImageModel()}`;
}

export function getSelectedImageModel(): string {
  const stored = read('arti_image_model');
  const providerId = getSelectedImageProvider();
  const capability = getProviderCapability(providerId);
  if (stored && capability.models.some((m) => m.id === stored)) return stored;
  return capability.models[0].id;
}

/* --------------------------------------------------------------------------
   Size resolution — maps a requested aspect ratio to a size token the chosen
   model actually accepts, and reports honestly when it cannot.
   -------------------------------------------------------------------------- */
export interface ResolvedSize {
  token: string;
  width: number;
  height: number;
  /** Set when the request could not be met exactly. */
  note?: string;
}

function parseSize(token: string): { width: number; height: number } {
  const m = token.match(/^(\d+)x(\d+)$/);
  if (!m) return { width: 0, height: 0 };
  return { width: parseInt(m[1], 10), height: parseInt(m[2], 10) };
}

/**
 * @param targetRatio requested width/height ratio
 * @param model the resolved model capability
 * @param custom custom `WxH` request when the model supports arbitrary sizes
 */
export function resolveSize(
  targetRatio: number,
  model: ImageModelCapability,
  custom?: { width: number; height: number }
): ResolvedSize {
  if (model.customSize && custom && custom.width > 0 && custom.height > 0) {
    const token = `${Math.round(custom.width)}x${Math.round(custom.height)}`;
    return { token, width: Math.round(custom.width), height: Math.round(custom.height) };
  }

  const concrete = model.sizes.filter((s) => /^\d+x\d+$/.test(s));
  if (concrete.length === 0) {
    return { token: 'auto', width: 0, height: 0, note: 'Model chooses its own output size.' };
  }

  let best = concrete[0];
  let bestDelta = Infinity;
  for (const token of concrete) {
    const { width, height } = parseSize(token);
    const delta = Math.abs(width / height - targetRatio);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = token;
    }
  }
  const { width, height } = parseSize(best);
  const note =
    bestDelta > 0.08
      ? `Model has no size matching this ratio; nearest supported is ${best}.`
      : undefined;
  return { token: best, width, height, note };
}

/* --------------------------------------------------------------------------
   Request / response shapes.
   -------------------------------------------------------------------------- */
export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  size: string;
  quality: string;
  count: number;
  model: string;
  seed?: string;
  styleStrength?: number;
  transparentBackground?: boolean;
}

export interface GenerateImageResponse {
  images: GeneratedImage[];
  providerId: ImageProviderId;
  model: string;
  requestedSize: string;
  nativeResolution: string;
  note?: string;
}

const OPENAI_IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/generations';
const REQUEST_TIMEOUT_MS = 180_000;

function classifyStatus(status: number): ImageErrorCode {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  if (status === 400 || status === 404 || status === 422) return 'unsupported';
  return 'provider';
}

/** Link an external abort signal and a timeout into one signal. */
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

function decodeImage(
  entry: { b64_json?: string; url?: string; revised_prompt?: string },
  fallback: { width: number; height: number },
  index: number
): GeneratedImage {
  const id = 'img_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2, 6);
  if (typeof entry.b64_json === 'string' && entry.b64_json) {
    return {
      id,
      url: `data:image/png;base64,${entry.b64_json}`,
      width: fallback.width,
      height: fallback.height,
      format: 'png',
      revisedPrompt: entry.revised_prompt,
    };
  }
  if (typeof entry.url === 'string' && entry.url) {
    return {
      id,
      url: entry.url,
      width: fallback.width,
      height: fallback.height,
      format: guessFormat(entry.url),
      revisedPrompt: entry.revised_prompt,
    };
  }
  throw new ImageServiceError('provider', 'The provider returned an image without data or a URL.', true);
}

function guessFormat(url: string): string {
  const m = url.split('?')[0].match(/\.(png|jpe?g|webp|gif)$/i);
  if (!m) return 'png';
  const ext = m[1].toLowerCase();
  return ext === 'jpg' ? 'jpeg' : ext;
}

async function requestOpenAI(
  conn: ImageConnection,
  req: GenerateImageRequest,
  signal: AbortSignal
): Promise<GenerateImageResponse> {
  const model = getModelCapability('openai', req.model) ?? OPENAI_MODELS[0];
  const count = Math.max(1, Math.min(req.count, model.maxCount));
  const body: Record<string, unknown> = {
    model: model.id,
    prompt: req.prompt,
    n: count,
    size: req.size,
  };
  if (req.quality && model.qualities.includes(req.quality)) body.quality = req.quality;
  if (model.supportsTransparentBackground && req.transparentBackground) body.background = 'transparent';
  // Honest boundary: this provider path accepts no seed / negative prompt /
  // style strength, so those are never sent (the UI disables them).

  const res = await fetch(OPENAI_IMAGES_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${conn.key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await safeErrorText(res);
    throw new ImageServiceError(
      classifyStatus(res.status),
      `OpenAI Images error ${res.status}${detail ? `: ${detail}` : ''}`,
      res.status >= 500 || res.status === 429
    );
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string; size?: string }>;
  };
  const rows = data.data ?? [];
  if (rows.length === 0) {
    throw new ImageServiceError('provider', 'OpenAI returned no images.', true);
  }
  const { width, height } = parseSize(req.size);
  const images = rows.map((row, i) => decodeImage(row, { width, height }, i));
  return {
    images,
    providerId: 'openai',
    model: model.id,
    requestedSize: req.size,
    nativeResolution: width && height ? `${width}×${height}` : 'provider-default',
    note: model.nativeMaxEdge < Math.max(width, height)
      ? `Native maximum is ${model.nativeMaxEdge} px; larger requests are not generated natively.`
      : undefined,
  };
}

async function requestCustomServer(
  conn: ImageConnection,
  req: GenerateImageRequest,
  signal: AbortSignal
): Promise<GenerateImageResponse> {
  // The endpoint is owner-configured in Settings (not user input from untrusted
  // content); only http(s) is accepted so no other scheme can be reached.
  let url: URL;
  try {
    url = new URL(conn.endpoint);
  } catch {
    throw new ImageServiceError('not-configured', 'The configured image endpoint is not a valid URL.', false);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ImageServiceError('not-configured', 'The image endpoint must use http or https.', false);
  }

  const model = CUSTOM_MODEL;
  const count = Math.max(1, Math.min(req.count, model.maxCount));
  const payload: Record<string, unknown> = {
    prompt: req.prompt,
    n: count,
    size: req.size,
    model: req.model || 'custom',
  };
  if (req.negativePrompt && model.supportsNegativePrompt) payload.negative_prompt = req.negativePrompt;
  if (req.seed && req.seed !== '-1' && model.supportsSeed) payload.seed = Number(req.seed) || req.seed;
  if (typeof req.styleStrength === 'number' && model.supportsStyleStrength) {
    payload.style_strength = req.styleStrength / 100;
  }
  if (req.transparentBackground && model.supportsTransparentBackground) payload.background = 'transparent';

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
    throw new ImageServiceError(
      classifyStatus(res.status),
      `Image bridge error ${res.status}${detail ? `: ${detail}` : ''}`,
      res.status >= 500 || res.status === 429
    );
  }

  const data = (await res.json()) as {
    images?: Array<{ b64_json?: string; url?: string; width?: number; height?: number; revised_prompt?: string; format?: string }>;
    data?: Array<{ b64_json?: string; url?: string; width?: number; height?: number; revised_prompt?: string }>;
  };
  const rows = data.images ?? data.data ?? [];
  if (rows.length === 0) {
    throw new ImageServiceError('provider', 'The image bridge returned no images.', true);
  }
  const requested = parseSize(req.size);
  const images = rows.map((row, i) => {
    const width = typeof row.width === 'number' ? row.width : requested.width;
    const height = typeof row.height === 'number' ? row.height : requested.height;
    const image = decodeImage(row, { width, height }, i);
    return image;
  });
  const first = images[0];
  return {
    images,
    providerId: 'custom-server',
    model: req.model || 'custom',
    requestedSize: req.size,
    nativeResolution: first && first.width ? `${first.width}×${first.height}` : 'server-reported',
  };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const trimmed = text.slice(0, 300);
    // Never echo anything that looks like a key back to the UI.
    return trimmed.replace(/(sk-[A-Za-z0-9_-]{8,})/g, 'sk-***');
  } catch {
    return '';
  }
}

/**
 * Ask the configured provider to render the image(s). Throws
 * {@link ImageServiceError} on every failure path; never returns a fabricated
 * result.
 */
export async function generateImages(
  req: GenerateImageRequest,
  signal: AbortSignal
): Promise<GenerateImageResponse> {
  const conn = getImageConnection();
  if (!conn) {
    throw new ImageServiceError(
      'not-configured',
      conn === null && getSelectedImageProvider() === 'custom-server'
        ? 'No image bridge endpoint is configured. Add one in Settings > Connected Services.'
        : 'No image provider is connected. Add an OpenAI key or configure an image bridge in Settings > Connected Services.',
      false
    );
  }

  const { signal: linked, done } = withTimeout(signal, REQUEST_TIMEOUT_MS);
  try {
    return conn.providerId === 'custom-server'
      ? await requestCustomServer(conn, req, linked)
      : await requestOpenAI(conn, req, linked);
  } catch (err) {
    if (err instanceof ImageServiceError) throw err;
    if (isAbort(err)) {
      // Distinguish a caller cancellation from our own timeout.
      if (signal.aborted) throw err;
      throw new ImageServiceError('timeout', 'The image provider timed out before returning a result.', true);
    }
    throw new ImageServiceError('network', 'Could not reach the image provider. Check your network and endpoint.', true);
  } finally {
    done();
  }
}
