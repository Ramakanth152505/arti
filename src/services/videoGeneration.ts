/**
 * ARTI AI — Videos generation orchestration.
 *
 * Turns a prepared prompt + settings into one real generation request against
 * the configured bridge and maps the response into a persisted result record.
 * The caller (the Videos workspace) is responsible for attaching the result to
 * the conversation and, for a structured production, to the shot/episode it
 * belongs to.
 *
 * Nothing here fabricates a result: a failure produces a `failed` record with
 * the real error, and a blocked request (no engine configured) produces a
 * `blocked` record explaining the exact setup requirement.
 */
import {
  generateVideo,
  getVideoConnection,
  isVideoProviderConfigured,
  VideoServiceError,
  type VideoGenerationRequest,
  type VideoGenerationResponse,
} from './videoProvider';
import { buildVideoPrompt, getResolutionPreset } from './videoPrompt';
import { getVideoStyleById } from './videoStyles';
import { getVideoTypeById } from './videoTypes';
import type { VideoGenerationSettings, VideoResultRecord } from './chatStore';

export const NOT_CONNECTED_MESSAGE =
  'No video bridge is connected, so no video was generated. Add a video bridge endpoint in Settings > Connected Services, then try again.';

export interface RunGenerationInput {
  originalPrompt: string;
  styleId?: string;
  settings: VideoGenerationSettings;
  /** Optional production context (bible/episode synopsis) appended to the prompt. */
  context?: string;
  /** Reference image data URL for continuity, when the bridge supports it. */
  referenceImage?: string;
}

function resolutionLabel(settings: VideoGenerationSettings): string {
  if (settings.resolution === 'custom') {
    return settings.customResolution || 'custom';
  }
  return getResolutionPreset(settings.resolution)?.label ?? settings.resolution;
}

/** Build the final provider request from structured settings. */
export function buildRequest(input: RunGenerationInput): VideoGenerationRequest {
  const { settings } = input;
  const resolutionLabelText = resolutionLabel(settings);
  const prompt = buildVideoPrompt({
    originalPrompt: input.originalPrompt,
    styleId: input.styleId,
    durationSeconds: settings.durationSeconds,
    aspectRatio: settings.aspectRatio,
    resolutionLabel: resolutionLabelText,
    fps: settings.fps,
    cameraMovement: settings.cameraMovement,
    lighting: settings.lighting,
    colorGrade: settings.colorGrade,
    motion: settings.motion,
    audio: settings.audio,
    narration: settings.narration,
    music: settings.music,
    language: settings.language,
    subtitles: settings.subtitles,
    negativePrompt: settings.negativePrompt,
    context: input.context,
  });

  return {
    prompt,
    negativePrompt: settings.negativePrompt || undefined,
    durationSeconds: settings.durationSeconds,
    aspectRatio: settings.aspectRatio,
    resolution: settings.resolution,
    customResolution: settings.customResolution || undefined,
    fps: settings.fps,
    model: settings.model,
    seed: settings.seed || undefined,
    referenceImage: input.referenceImage,
  };
}

/** The prepared prompt text, exposed so the UI can preview it before sending. */
export function previewPrompt(input: RunGenerationInput): string {
  return buildRequest(input).prompt;
}

/**
 * Run one real generation. Always resolves to a {@link VideoResultRecord}; a
 * thrown abort (user cancellation) is re-thrown so the caller can distinguish a
 * cancel from a failure.
 */
export async function runVideoGeneration(
  input: RunGenerationInput,
  signal: AbortSignal
): Promise<VideoResultRecord> {
  const { settings } = input;
  const style = getVideoStyleById(input.styleId);
  const request = buildRequest(input);

  const base = {
    id: 'vres_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    preparedPrompt: request.prompt,
    originalPrompt: input.originalPrompt,
    styleId: input.styleId,
    styleName: style?.name,
    settings,
  };

  if (!isVideoProviderConfigured()) {
    return {
      ...base,
      videos: [],
      status: 'blocked',
      error: NOT_CONNECTED_MESSAGE,
    };
  }

  try {
    const response: VideoGenerationResponse = await generateVideo(request, signal);
    return {
      ...base,
      videos: response.videos.map((v) => ({
        id: v.id,
        url: v.url,
        width: v.width,
        height: v.height,
        durationSeconds: v.durationSeconds,
        format: v.format,
        poster: v.poster,
        upscaledFrom: v.upscaledFrom,
      })),
      status: 'complete',
      effectiveNote: response.note,
    };
  } catch (err) {
    // A caller cancellation is not a failure — let the workspace handle it.
    if (err instanceof DOMException && err.name === 'AbortError' && signal.aborted) {
      throw err;
    }
    const message =
      err instanceof VideoServiceError
        ? err.message
        : 'The video request failed before a result was returned.';
    return {
      ...base,
      videos: [],
      status: 'failed',
      error: message,
    };
  }
}

/** Honest label for the current connection, for the composer notice. */
export function videoNoticeText(): string {
  const conn = getVideoConnection();
  if (!conn) {
    return 'Not connected. Configure a video bridge in Settings > Connected Services to enable real generation.';
  }
  return 'Connected to your video bridge. Requests are sent to your bridge; nothing is stored on an ARTI server.';
}

/** Human label for a video type id, for badges. */
export function videoTypeLabel(id: string | undefined): string {
  return getVideoTypeById(id)?.name ?? 'Single video';
}
