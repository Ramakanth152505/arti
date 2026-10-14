/**
 * ARTI AI — Music Studio original lyrics writer.
 *
 * Writes original lyrics from a theme/story or a detailed prompt, in a chosen
 * language, with a verse/chorus/bridge/intro/outro structure and optional
 * male/female duet assignment. It reuses the one language-model boundary
 * (`aiService`); it never fabricates lyrics itself.
 *
 * Honesty contract:
 *   - Lyrics are original. The writer is explicitly instructed not to reproduce
 *     any existing/copyrighted song and not to imitate a named songwriter.
 *   - If no language model is connected, this returns an honest failure — it
 *     never invents placeholder lyrics and presents them as real.
 *   - Transliteration and translation are separate, optional calls.
 */
import { sendChatCompletion, isAiConfigured, AiServiceError } from './aiService';
import {
  SONG_SECTIONS,
  type DuetArrangement,
  type LyricSection,
  type SongSectionId,
  type VocalType,
} from './musicTypes';
import { languageLabel } from './musicLanguages';

export interface LyricsRequest {
  theme: string;
  language: string;
  structure: SongSectionId[];
  vocalType: VocalType;
  duetArrangement?: DuetArrangement;
  mood?: string;
  tone?: string;
  /** Extra free-text direction from the user. */
  extra?: string;
}

export interface LyricsResult {
  ok: true;
  sections: LyricSection[];
  plain: string;
  /** Honest marker that these are AI-written originals. */
  note: string;
}

export interface LyricsFailure {
  ok: false;
  reason: string;
}

function sectionLabel(id: SongSectionId): string {
  return SONG_SECTIONS.find((s) => s.id === id)?.label ?? id;
}

function duetInstruction(arrangement: DuetArrangement | undefined): string {
  switch (arrangement) {
    case 'alternating-verses':
      return 'Assign the verses alternately to [MALE] and [FEMALE]. The chorus is sung together as [BOTH].';
    case 'shared-chorus':
      return 'Leads alternate verses ([MALE] / [FEMALE]) and sing the chorus together as [BOTH].';
    case 'call-and-response':
      return 'Use a call-and-response: one lead sings a line [MALE], the other answers [FEMALE].';
    case 'combined':
      return 'Both leads sing together throughout as [BOTH].';
    default:
      return 'Assign each section clearly to [MALE], [FEMALE] or [BOTH].';
  }
}

/**
 * Build the instruction sent to the language model. The section markers are a
 * stable, parseable contract.
 */
function buildInstruction(req: LyricsRequest): string {
  const structure = req.structure.map((s) => sectionLabel(s)).join(' → ');
  const isDuet = req.vocalType === 'duet';
  const lines = [
    'You are a professional lyricist writing ORIGINAL lyrics.',
    'Do not reproduce, paraphrase, or reference any existing or copyrighted song.',
    'Do not imitate or name any real songwriter or artist.',
    `Write the lyrics in ${languageLabel(req.language)} (language code: ${req.language}).`,
    `Theme / story: ${req.theme || 'a hopeful, heartfelt story'}.`,
    req.mood ? `Mood: ${req.mood}.` : '',
    req.tone ? `Tone: ${req.tone}.` : '',
    req.extra ? `Extra direction: ${req.extra}.` : '',
    `Structure (use exactly these section headings, in this order): ${structure}.`,
    isDuet ? duetInstruction(req.duetArrangement) : '',
    'Format every section as a heading line starting with "[" followed by the section name and an optional voice tag, e.g. "[Verse 1] [MALE]", then the lines.',
    'Keep lines singable. Do not add commentary, explanations or a title unless asked.',
  ].filter(Boolean);
  return lines.join('\n');
}

/** Parse the model's marked-up output into structured sections. */
function parseSections(raw: string): LyricSection[] {
  const lines = raw.split('\n');
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;
  let counter = 0;

  const heading = /^\s*\[\s*([^\]]+?)\s*\]\s*(?:\[?\s*(MALE|FEMALE|BOTH)\s*\]?)?\s*$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) current.text += '\n';
      continue;
    }
    const m = trimmed.match(heading);
    if (m) {
      if (current) sections.push({ ...current, text: current.text.trim() });
      const nameRaw = m[1].toLowerCase();
      const section =
        SONG_SECTIONS.find((s) => nameRaw.startsWith(s.id) || nameRaw.startsWith(s.label.toLowerCase()))?.id ??
        'verse';
      const voice = m[2] ? (m[2].toLowerCase() as 'male' | 'female' | 'both') : undefined;
      counter += 1;
      current = {
        id: `lyr_${Date.now()}_${counter}`,
        section,
        label: m[1],
        text: '',
        voice,
      };
      continue;
    }
    if (!current) {
      counter += 1;
      current = { id: `lyr_${Date.now()}_${counter}`, section: 'verse', text: '' };
    }
    current.text += (current.text ? '\n' : '') + trimmed;
  }
  if (current) sections.push({ ...current, text: current.text.trim() });
  return sections.filter((s) => s.text.length > 0);
}

function sectionsToPlain(sections: LyricSection[]): string {
  return sections
    .map((s) => {
      const voice = s.voice ? ` [${s.voice.toUpperCase()}]` : '';
      return `[${s.label ?? sectionLabel(s.section)}]${voice}\n${s.text}`;
    })
    .join('\n\n');
}

/** Write original lyrics. Honest failure when no language model is connected. */
export async function writeLyrics(req: LyricsRequest, signal: AbortSignal): Promise<LyricsResult | LyricsFailure> {
  if (!isAiConfigured()) {
    return {
      ok: false,
      reason:
        'No language model is connected, so original lyrics cannot be written. Add an Anthropic or OpenAI key in Settings > Connected Services.',
    };
  }
  try {
    const reply = await sendChatCompletion([{ role: 'user', content: buildInstruction(req) }], signal);
    const sections = parseSections(reply);
    if (sections.length === 0) {
      return { ok: false, reason: 'The language model returned no usable lyric sections.' };
    }
    return {
      ok: true,
      sections,
      plain: sectionsToPlain(sections),
      note: 'Original lyrics written by an AI language model. Not from any real songwriter.',
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const reason =
      err instanceof AiServiceError
        ? err.message
        : 'Lyrics generation failed before any result was returned.';
    return { ok: false, reason };
  }
}

/** Rewrite a single section (regenerate selected sections). */
export async function rewriteSection(
  req: LyricsRequest,
  section: LyricSection,
  instruction: string | undefined,
  signal: AbortSignal
): Promise<LyricsResult | LyricsFailure> {
  if (!isAiConfigured()) {
    return { ok: false, reason: 'No language model is connected, so this section cannot be rewritten.' };
  }
  const isDuet = req.vocalType === 'duet';
  const prompt = [
    'Rewrite ONLY the following lyric section as ORIGINAL lyrics.',
    'Do not reproduce or reference any existing/copyrighted song or real artist.',
    `Language: ${languageLabel(req.language)} (${req.language}).`,
    `Section: ${section.label ?? sectionLabel(section.section)}${section.voice ? ` [${section.voice}]` : ''}.`,
    req.theme ? `Theme: ${req.theme}.` : '',
    isDuet ? duetInstruction(req.duetArrangement) : '',
    instruction ? `Direction for this rewrite: ${instruction}.` : '',
    'Return the section with its heading line, then the new lines. Nothing else.',
    '',
    `Current section:\n${section.text}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const reply = await sendChatCompletion([{ role: 'user', content: prompt }], signal);
    const parsed = parseSections(reply);
    if (parsed.length === 0) {
      return { ok: false, reason: 'The rewrite returned no usable lines.' };
    }
    // Preserve the original section identity; only the text/voice change.
    const merged: LyricSection = {
      ...section,
      text: parsed.map((p) => p.text).join('\n\n'),
      voice: parsed[0].voice ?? section.voice,
    };
    return {
      ok: true,
      sections: [merged],
      plain: merged.text,
      note: 'Section rewritten by an AI language model. Original content.',
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const reason =
      err instanceof AiServiceError ? err.message : 'The section rewrite failed before a result was returned.';
    return { ok: false, reason };
  }
}

/**
 * Optional transliteration or translation of an existing lyric body. Returns an
 * honest failure when no model is connected — the original is never replaced
 * silently.
 */
export async function transformLyricsText(
  text: string,
  target: string,
  kind: 'transliterate' | 'translate',
  signal: AbortSignal
): Promise<{ ok: true; text: string; note: string } | LyricsFailure> {
  if (!isAiConfigured()) {
    return {
      ok: false,
      reason: `No language model is connected, so ${kind === 'translate' ? 'translation' : 'transliteration'} is unavailable.`,
    };
  }
  const verb = kind === 'translate' ? 'Translate' : 'Transliterate';
  const prompt = [
    `${verb} the following lyrics into ${target}.`,
    kind === 'transliterate'
      ? 'Keep the original language and meaning; render the sounds in Latin script.'
      : 'Preserve line breaks and singable structure. Do not add commentary.',
    '',
    text,
  ].join('\n');
  try {
    const reply = await sendChatCompletion([{ role: 'user', content: prompt }], signal);
    return {
      ok: true,
      text: reply.trim(),
      note: `${verb}d by an AI language model. The original lyrics are preserved separately.`,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const reason = err instanceof AiServiceError ? err.message : 'The request failed before a result was returned.';
    return { ok: false, reason };
  }
}
