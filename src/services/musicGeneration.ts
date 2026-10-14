/**
 * ARTI AI — Music Studio generation & transformation orchestration.
 *
 * The single place that turns a reviewed brief into a persisted track record.
 * It composes the prompt, calls the provider boundary, and maps the real
 * response into a record. It never fabricates audio.
 *
 * Transformations are split by what they genuinely are:
 *   - `playback-speed`   real client-side processing (Web Audio): the same
 *                        recording played faster/slower, tempo and pitch moving
 *                        together. The result is encoded to a WAV locally.
 *   - `time-stretch`     pitch-preserving tempo change — needs a DSP service.
 *                        Reported honestly as not connected.
 *   - `ai-rearrangement` the provider genuinely re-performs the track.
 *
 * Every variation is stored as a NEW track linked to its source; the original is
 * never overwritten.
 */
import { chatStore, type GeneratedTrackRecord } from './chatStore';
import {
  generateMusic,
  toTrackRecord,
  MusicServiceError,
  type MusicGenerationRequest,
  type MusicGenerationResponse,
} from './musicProvider';
import { buildMusicPrompt, buildNegativePrompt, type MusicBrief } from './musicPrompt';
import { getMode, getTransform, type SpeedMethod, type TransformId } from './musicTypes';
import { getSelectedMusicModel } from './musicProvider';
import { writeLyrics, type LyricsRequest } from './musicLyrics';

export type GenerationStage =
  | 'preparing'
  | 'writing-lyrics'
  | 'generating'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'cancelled';

export const STAGE_LABELS: Record<GenerationStage, string> = {
  preparing: 'Preparing request',
  'writing-lyrics': 'Writing lyrics',
  generating: 'Generating music',
  processing: 'Processing returned audio',
  ready: 'Ready to play',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export interface GenerationOutcome {
  ok: boolean;
  record?: GeneratedTrackRecord;
  /** The real error text when the request failed. */
  error?: string;
  cancelled?: boolean;
}

/**
 * Run a real generation for a conversation. Handles the lyrics-only mode
 * (writing only — no audio), otherwise calls the provider. The caller owns the
 * AbortController and cancellation.
 */
export async function runGeneration(
  conversationId: string,
  brief: MusicBrief,
  lyricsText: string,
  signal: AbortSignal,
  onStage: (stage: GenerationStage) => void
): Promise<GenerationOutcome> {
  const mode = getMode(brief.mode);

  try {
    // 1. Lyrics-only: writing, not audio. Honest and separate from generation.
    if (mode.id === 'lyrics-only') {
      onStage('writing-lyrics');
      const req: LyricsRequest = {
        theme: brief.theme,
        language: brief.language,
        structure: brief.structure,
        vocalType: brief.vocalType === 'instrumental' ? 'female' : brief.vocalType,
        mood: brief.mood,
        extra: brief.customInstructions,
      };
      const result = await writeLyrics(req, signal);
      if (!result.ok) {
        onStage('failed');
        return { ok: false, error: result.reason };
      }
      chatStore.patchMusicMeta(conversationId, { lyrics: result.plain });
      onStage('ready');
      return { ok: true, error: undefined };
    }

    // 2. Real audio generation.
    onStage('generating');
    const preparedPrompt = buildMusicPrompt(brief, lyricsText);
    const request: MusicGenerationRequest = {
      prompt: preparedPrompt,
      negativePrompt: buildNegativePrompt(brief),
      lyrics: mode.instrumentalOnly ? undefined : lyricsText || undefined,
      instrumental: mode.instrumentalOnly || brief.vocalType === 'instrumental',
      vocalType: brief.vocalType,
      language: brief.language,
      durationSeconds: brief.durationSeconds,
      genre: brief.genre,
      mood: brief.mood,
      model: getSelectedMusicModel(),
    };

    const response: MusicGenerationResponse = await generateMusic(request, signal);
    onStage('processing');

    const provenance = request.instrumental ? 'ai-instrumental' : 'ai-vocals-and-music';
    const record = toTrackRecord(response, {
      originalPrompt: brief.theme || preparedPrompt,
      preparedPrompt,
      mode: brief.mode,
      title: deriveTitle(brief),
      language: brief.language,
      genre: brief.genre,
      lyrics: request.instrumental ? undefined : lyricsText || undefined,
      instrumental: request.instrumental,
      vocalType: brief.vocalType,
      provenance,
    });
    record.status = 'complete';
    chatStore.addMusicResult(conversationId, record);
    onStage('ready');
    return { ok: true, record };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onStage('cancelled');
      return { ok: false, cancelled: true };
    }
    const error = err instanceof MusicServiceError ? err.message : 'The music request failed before a result was returned.';
    // A failed request yields an honest failed record — never a fake track.
    const failed: GeneratedTrackRecord = {
      id: 'track_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      title: deriveTitle(brief),
      mode: brief.mode,
      providerId: 'custom-server',
      model: getSelectedMusicModel(),
      originalPrompt: brief.theme,
      preparedPrompt: buildMusicPrompt(brief, lyricsText),
      lyrics: mode.instrumentalOnly ? undefined : lyricsText || undefined,
      language: brief.language,
      genre: brief.genre,
      instrumental: mode.instrumentalOnly || brief.vocalType === 'instrumental',
      vocalType: brief.vocalType,
      durationSeconds: brief.durationSeconds,
      format: 'mp3',
      provenance: mode.instrumentalOnly ? 'ai-instrumental' : 'ai-vocals-and-music',
      favorite: false,
      status: 'failed',
      error,
    };
    chatStore.addMusicResult(conversationId, failed);
    onStage('failed');
    return { ok: false, error };
  }
}

function deriveTitle(brief: MusicBrief): string {
  const theme = brief.theme.trim();
  if (!theme) return 'Untitled Track';
  return theme.length > 48 ? theme.slice(0, 48).trim() + '…' : theme;
}

/* ==========================================================================
   Transformations
   ========================================================================== */

export interface TransformOutcome {
  ok: boolean;
  record?: GeneratedTrackRecord;
  error?: string;
  /** Set when the requested transform could not be performed here. */
  blocked?: boolean;
}

/**
 * Client-side playback-speed transform. Fetches the source audio, decodes it
 * with Web Audio and re-renders it at the given rate. Tempo and pitch move
 * together — this is a genuine playback-speed change, not time stretching.
 */
export async function playbackSpeedTransform(
  conversationId: string,
  source: GeneratedTrackRecord,
  rate: number,
  signal: AbortSignal
): Promise<TransformOutcome> {
  if (!source.audioUrl) {
    return { ok: false, blocked: true, error: 'The source track has no audio asset to process.' };
  }
  const AudioCtx: typeof AudioContext | undefined =
    typeof window !== 'undefined'
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!AudioCtx) {
    return { ok: false, blocked: true, error: 'This browser does not expose the Web Audio API, so local processing is unavailable.' };
  }

  try {
    const res = await fetch(source.audioUrl);
    if (!res.ok) throw new Error(`source returned ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const decodeCtx = new AudioCtx();
    const decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    await decodeCtx.close();

    const outLength = Math.max(1, Math.ceil(decoded.length / rate));
    const offline = new OfflineAudioContext(decoded.numberOfChannels, outLength, decoded.sampleRate);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.playbackRate.value = rate;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const wavUrl = encodeWav(rendered);
    const direction = rate < 1 ? 'slowed' : 'sped up';
    const record: GeneratedTrackRecord = {
      ...source,
      id: 'track_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
      title: `${source.title} (${direction} ${Math.round(rate * 100)}%)`,
      durationSeconds: rendered.duration,
      format: 'wav',
      audioUrl: wavUrl,
      provenance: 'processed-from-ai',
      favorite: false,
      status: 'complete',
      error: undefined,
      sourceTrackId: source.id,
      transformMethod: 'playback-speed',
      transformNote:
        'Real local playback-speed processing (Web Audio). Tempo and pitch changed together; the original track is preserved.',
    };
    chatStore.addMusicResult(conversationId, record);
    return { ok: true, record };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, error: 'Cancelled.' };
    const message = err instanceof Error ? err.message : 'unknown error';
    return { ok: false, error: `Local processing failed (${message}).` };
  }
}

/**
 * Run a transform. Tempo transforms route to the chosen speed method; every
 * other transform asks the provider to genuinely re-generate.
 */
export async function runTransform(
  conversationId: string,
  source: GeneratedTrackRecord,
  transformId: TransformId,
  options: { speedMethod?: SpeedMethod; rate?: number; genre?: string; mood?: string; lyrics?: string; instruction?: string },
  signal: AbortSignal,
  onStage: (stage: GenerationStage) => void
): Promise<TransformOutcome> {
  const transform = getTransform(transformId);

  // Tempo transforms: the method decides what actually happens.
  if (transform.category === 'tempo') {
    const method = options.speedMethod ?? 'playback-speed';
    if (method === 'time-stretch') {
      return {
        ok: false,
        blocked: true,
        error:
          'Pitch-preserving time stretching needs a real DSP service, which is not connected. Use playback-speed (changes pitch) or AI re-arrangement (needs a music provider) instead.',
      };
    }
    if (method === 'playback-speed') {
      const rate = options.rate ?? (transformId === 'ultra-slow' ? 0.6 : transformId === 'slower' ? 0.8 : 1.25);
      onStage('processing');
      const outcome = await playbackSpeedTransform(conversationId, source, rate, signal);
      onStage(outcome.ok ? 'ready' : outcome.blocked ? 'failed' : 'failed');
      return outcome;
    }
    // ai-rearrangement falls through to the provider path below.
  }

  if (!source.audioUrl) {
    return { ok: false, blocked: true, error: 'The source track has no audio asset to work from.' };
  }

  try {
    onStage('generating');
    const extra: string[] = [];
    if (transformId === 'slower') extra.push('Render this as a slower version.');
    if (transformId === 'ultra-slow') extra.push('Render this as a heavily slowed (ultra-slow) version.');
    if (transformId === 'faster') extra.push('Render this as a faster version.');
    if (transformId === 'instrumental') extra.push('Remove all vocals; instrumental only.');
    if (transformId === 'alternate-arrangement') extra.push('Use a clearly different arrangement.');
    if (options.genre) extra.push(`Use the ${options.genre} genre.`);
    if (options.mood) extra.push(`Use a ${options.mood} mood.`);
    if (transformId === 'different-intro') extra.push('Write a different introduction.');
    if (transformId === 'different-ending') extra.push('Write a different ending.');
    if (transformId === 'extended') extra.push('Make it longer.');
    if (transformId === 'shortened') extra.push('Make it shorter.');
    if (transformId === 'alternative-mix') extra.push('Use a different mix emphasis.');
    if (options.instruction) extra.push(options.instruction);

    const prompt = [source.preparedPrompt, ...extra].join(' ');
    const lyrics = transformId === 'revised-lyrics' && options.lyrics ? options.lyrics : source.lyrics;
    const instrumental = transformId === 'instrumental' ? true : source.instrumental;

    const response = await generateMusic(
      {
        prompt,
        lyrics: instrumental ? undefined : lyrics,
        instrumental,
        vocalType: instrumental ? 'instrumental' : source.vocalType,
        language: source.language,
        durationSeconds: source.durationSeconds,
        genre: options.genre || source.genre,
        mood: options.mood,
        model: getSelectedMusicModel(),
      },
      signal
    );

    onStage('processing');
    const record = toTrackRecord(response, {
      originalPrompt: source.originalPrompt,
      preparedPrompt: prompt,
      mode: source.mode,
      title: `${source.title} (${transform.label})`,
      language: source.language,
      genre: options.genre || source.genre,
      lyrics: instrumental ? undefined : lyrics,
      instrumental,
      vocalType: instrumental ? 'instrumental' : source.vocalType,
      provenance: instrumental ? 'ai-instrumental' : 'ai-vocals-and-music',
    });
    record.status = 'complete';
    record.sourceTrackId = source.id;
    record.transformId = transformId;
    record.transformMethod = transformId === 'slower' || transformId === 'ultra-slow' || transformId === 'faster' ? 'ai-rearrangement' : undefined;
    record.transformNote = `Generated as a new variation of "${source.title}". The original track is unchanged.`;
    chatStore.addMusicResult(conversationId, record);
    onStage('ready');
    return { ok: true, record };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      onStage('cancelled');
      return { ok: false, error: 'Cancelled.' };
    }
    const error = err instanceof MusicServiceError ? err.message : 'The transformation failed before a result was returned.';
    onStage('failed');
    return { ok: false, error };
  }
}

/* ==========================================================================
   WAV encoding (for locally processed audio)
   ========================================================================== */

function encodeWav(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;
  const view = new DataView(new ArrayBuffer(bufferSize));

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  const bytes = new Uint8Array(view.buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}
