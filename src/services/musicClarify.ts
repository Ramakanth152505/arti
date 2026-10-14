/**
 * ARTI AI — Music Studio natural-language interpreter.
 *
 * Reads a free-text music request and extracts the settings ARTI can act on:
 * mode, theme, genre, language, vocal type, mood, energy, tempo, instruments,
 * structure, duration, production, ending and intended use. The extracted
 * settings are always shown to the user for review and correction before
 * generation — the interpreter proposes, the user decides.
 *
 * Two honest paths:
 *   - `language-model` — when a language model is connected (`aiService`), it
 *     is asked to return strict JSON, which is validated and merged.
 *   - `rule-based`     — a transparent keyword analyser, labelled as such in the
 *     UI. It never invents a provider event and never claims more than it read.
 */
import { sendChatCompletion, isAiConfigured } from './aiService';
import { getMode, type MusicModeId, type SongSectionId, type VocalType } from './musicTypes';
import { MUSIC_GENRES, INSTRUMENTS, MOODS, ENERGIES, RHYTHMS } from './musicStyles';
import { MUSIC_LANGUAGES } from './musicLanguages';
import { parseDuration } from './musicTypes';
import type { MusicBrief } from './musicPrompt';
import { emptyBrief } from './musicPrompt';

export type Interpreter = 'language-model' | 'rule-based';

export interface Interpretation {
  brief: MusicBrief;
  /** Which fields the interpreter actually filled (for honest UI labelling). */
  filled: string[];
  interpreter: Interpreter;
  /** The user's original words, preserved verbatim. */
  originalPrompt: string;
  note: string;
}

/* --------------------------------------------------------------------------
   Rule-based analyser. Transparent keyword matching, no hidden inference.
   -------------------------------------------------------------------------- */

const LANGUAGE_HINTS: Record<string, string[]> = {
  te: ['telugu'],
  hi: ['hindi'],
  ta: ['tamil'],
  kn: ['kannada'],
  ml: ['malayalam'],
  bn: ['bengali'],
  mr: ['marathi'],
  pa: ['punjabi'],
  gu: ['gujarati'],
  ur: ['urdu'],
  sa: ['sanskrit'],
  en: ['english'],
  es: ['spanish'],
  fr: ['french'],
  de: ['german'],
  pt: ['portuguese'],
  ar: ['arabic'],
  ja: ['japanese'],
  ko: ['korean'],
  zh: ['chinese', 'mandarin'],
  ru: ['russian'],
  tr: ['turkish'],
  id: ['indonesian'],
  vi: ['vietnamese'],
};

const MOOD_HINTS: Record<string, string[]> = {
  romantic: ['romantic', 'romance', 'love'],
  emotional: ['emotional', 'heartfelt', 'touching'],
  uplifting: ['uplifting', 'inspiring'],
  melancholic: ['melancholic', 'sad', 'sorrow'],
  hopeful: ['hopeful', 'optimistic'],
  epic: ['epic', 'grand', 'heroic'],
  tense: ['tense', 'suspense', 'thriller'],
  calm: ['calm', 'relaxing', 'peaceful', 'soothing'],
  energetic: ['energetic', 'upbeat', 'driving'],
  playful: ['playful', 'fun', 'cheerful'],
  mysterious: ['mysterious', 'mystery', 'enigmatic'],
  triumphant: ['triumphant', 'victory'],
  nostalgic: ['nostalgic', 'memory', 'memories'],
  spiritual: ['spiritual', 'devotional', 'sacred', 'prayer'],
};

const INSTRUMENT_HINTS: Record<string, string[]> = {
  piano: ['piano'],
  'acoustic-guitar': ['acoustic guitar'],
  'electric-guitar': ['electric guitar', 'guitar'],
  strings: ['strings', 'string section'],
  cello: ['cello'],
  violin: ['violin'],
  flute: ['flute'],
  sitar: ['sitar'],
  tabla: ['tabla'],
  bansuri: ['bansuri', 'bamboo flute'],
  veena: ['veena'],
  mridangam: ['mridangam'],
  horns: ['horns', 'brass'],
  synth: ['synth', 'synthesizer', 'synthesiser'],
  pad: ['pad', 'drone'],
  drums: ['drums', 'drum'],
  percussion: ['percussion'],
  choir: ['choir', 'chorus vocals'],
  harp: ['harp'],
  organ: ['organ'],
  saxophone: ['sax', 'saxophone'],
  trumpet: ['trumpet'],
  'sub-bass': ['sub-bass', '808', 'sub bass'],
};

const RHYTHM_HINTS: Record<string, string[]> = {
  'four-on-floor': ['four on the floor', 'four-on-the-floor'],
  swing: ['swing'],
  'half-time': ['half-time', 'half time'],
  breakbeat: ['breakbeat'],
  shuffle: ['shuffle'],
  syncopated: ['syncopated'],
  straight: ['straight'],
};

const STRUCTURE_HINTS: Record<SongSectionId, string[]> = {
  intro: ['intro', 'introduction', 'opening'],
  verse: ['verse'],
  'pre-chorus': ['pre-chorus', 'prechorus', 'pre chorus'],
  chorus: ['chorus'],
  bridge: ['bridge'],
  outro: ['outro', 'ending', 'end'],
};

function detectLanguage(text: string): string | undefined {
  for (const [code, hints] of Object.entries(LANGUAGE_HINTS)) {
    if (hints.some((h) => text.includes(h))) return code;
  }
  return undefined;
}

function detectGenre(text: string): string | undefined {
  let best: string | undefined;
  for (const g of MUSIC_GENRES) {
    if (text.includes(g.label.toLowerCase())) {
      // Prefer the longest label match to disambiguate "dance pop" over "pop".
      if (!best || g.label.length > (MUSIC_GENRES.find((x) => x.id === best)?.label.length ?? 0)) {
        best = g.id;
      }
    }
  }
  return best;
}

function detectVocalType(text: string): VocalType | undefined {
  const duet = /\bduet\b|\bmale and female\b|\bboth vocals\b/.test(text);
  if (duet) return 'duet';
  const instrumental = /\binstrumental\b|\bno vocals\b|\bwithout vocals\b|\bno lyrics\b/.test(text);
  if (instrumental) return 'instrumental';
  const female = /\bfemale\b|\bwoman\b|\bgirl\b|\bshe sings\b/.test(text);
  const male = /\bmale\b|\bman\b|\bboy\b|\bhe sings\b/.test(text);
  if (male && female) return 'duet';
  if (female) return 'female';
  if (male) return 'male';
  return undefined;
}

function detectTempo(text: string): number | undefined {
  const m = text.match(/(\d{2,3})\s*bpm/);
  if (m) {
    const bpm = parseInt(m[1], 10);
    if (bpm >= 20 && bpm <= 400) return bpm;
  }
  if (/\bslow\b|\bgentle\b|\bcalm\b/.test(text)) return 72;
  if (/\bfast\b|\bupbeat\b|\benergetic\b/.test(text)) return 140;
  return undefined;
}

function detectEnergy(text: string): string | undefined {
  if (/very high|intense|frantic/.test(text)) return 'very-high';
  if (/\bhigh\b|\bdriving\b|\bupbeat\b/.test(text)) return 'high';
  if (/very low|barely|whisper/.test(text)) return 'very-low';
  if (/\blow\b|\bgentle\b|\bcalm\b|\bquiet\b/.test(text)) return 'low';
  if (/\bmedium\b|\bmoderate\b/.test(text)) return 'medium';
  return undefined;
}

function detectDuration(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/);
  if (!m) return undefined;
  const parsed = parseDuration(`${m[1]}${m[2][0]}`);
  return parsed ?? undefined;
}

function detectStructure(text: string): SongSectionId[] | undefined {
  const found: SongSectionId[] = [];
  for (const [id, hints] of Object.entries(STRUCTURE_HINTS) as [SongSectionId, string[]][]) {
    if (hints.some((h) => text.includes(h))) found.push(id);
  }
  // Keep the canonical order, not the order of appearance.
  const order: SongSectionId[] = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro'];
  const ordered = order.filter((id) => found.includes(id));
  return ordered.length >= 2 ? ordered : undefined;
}

function detectMode(text: string, vocal: VocalType | undefined): MusicModeId | undefined {
  if (/\blyrics only\b|\bjust the lyrics\b|\bwrite lyrics\b/.test(text)) return 'lyrics-only';
  if (/\bbackground music\b|\bsoundtrack\b|\bscore for\b|\bpodcast\b|\bvideo background\b/.test(text)) return 'background-score';
  if (/\bbeat\b|\bdj\b|\bclub\b|\bremix\b/.test(text)) return 'beats-dj';
  if (/\bcinematic\b|\borchestral\b|\bfilm score\b|\btrailer\b/.test(text)) return 'cinematic-orchestral';
  if (/\bambient\b|\batmospheric\b|\bsoundscape\b/.test(text)) return 'ambient-atmospheric';
  if (/\bregional\b|\btraditional\b|\bfolk\b/.test(text)) return 'regional';
  if (/\bintro\b|\boutro\b|\bjingle\b|\bsting\b|\bshort clip\b/.test(text)) return 'short-clip';
  if (vocal === 'instrumental') return 'instrumental';
  if (/\bmy lyrics\b|\bthese lyrics\b|\bprovided lyrics\b/.test(text)) return 'song-user-lyrics';
  if (/\bwrite the lyrics\b|\boriginal lyrics\b|\bai lyrics\b/.test(text)) return 'song-ai-lyrics';
  if (vocal === 'male' || vocal === 'female' || vocal === 'duet') return 'full-song-vocals';
  return undefined;
}

function ruleBasedInterpret(prompt: string): Interpretation {
  const text = prompt.toLowerCase();
  const brief = emptyBrief();
  const filled: string[] = [];

  const vocal = detectVocalType(text);
  if (vocal) {
    brief.vocalType = vocal;
    filled.push('Vocals');
  }

  const mode = detectMode(text, vocal);
  if (mode) {
    brief.mode = mode;
    filled.push('Mode');
  }

  const language = detectLanguage(text);
  if (language) {
    brief.language = language;
    filled.push('Language');
  }

  const genre = detectGenre(text);
  if (genre) {
    brief.genre = genre;
    filled.push('Genre');
  }

  for (const [id, hints] of Object.entries(MOOD_HINTS)) {
    if (hints.some((h) => text.includes(h))) {
      brief.mood = id;
      filled.push('Mood');
      break;
    }
  }

  const energy = detectEnergy(text);
  if (energy) {
    brief.energy = energy;
    filled.push('Energy');
  }

  const tempo = detectTempo(text);
  if (tempo) {
    brief.tempoBpm = tempo;
    filled.push('Tempo');
  }

  for (const [id, hints] of Object.entries(INSTRUMENT_HINTS)) {
    if (hints.some((h) => text.includes(h))) brief.instruments.push(id);
  }
  if (brief.instruments.length) filled.push('Instruments');

  for (const [id, hints] of Object.entries(RHYTHM_HINTS)) {
    if (hints.some((h) => text.includes(h))) {
      brief.rhythm = id;
      filled.push('Rhythm');
      break;
    }
  }

  const structure = detectStructure(text);
  if (structure) {
    brief.structure = structure;
    filled.push('Structure');
  }

  const duration = detectDuration(text);
  if (duration) {
    brief.durationSeconds = duration;
    filled.push('Duration');
  }

  if (/\bcinematic ending\b|\bpowerful ending\b|\bbig ending\b/.test(text)) {
    brief.ending = 'powerful cinematic ending';
    filled.push('Ending');
  }
  if (/\bgentle introduction\b|\bsoft intro\b|\bgentle intro\b/.test(text)) {
    filled.push('Intro');
  }

  // The theme is the request itself, minus nothing — the user's words are kept.
  brief.theme = prompt.trim();
  filled.unshift('Theme');

  return {
    brief,
    filled,
    interpreter: 'rule-based',
    originalPrompt: prompt,
    note: 'Interpreted with a transparent rule-based analyser (no language model connected). Review and correct anything before generating.',
  };
}

/* --------------------------------------------------------------------------
   Language-model interpreter. Returns strict JSON; validated before merge.
   -------------------------------------------------------------------------- */

function extractJson(raw: string): unknown | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

async function llmInterpret(prompt: string, signal: AbortSignal): Promise<Interpretation | null> {
  const instruction = [
    'You extract music-generation settings from a user request. Return ONLY JSON.',
    'Keys: theme (string), mode (one of: full-song-vocals, song-ai-lyrics, song-user-lyrics, lyrics-only, instrumental, background-score, beats-dj, regional, cinematic-orchestral, ambient-atmospheric, short-clip, custom),',
    'genre (a short label), language (ISO code like en, te, hi), vocalType (male|female|duet|instrumental),',
    'mood (a short word), energy (very-low|low|medium|high|very-high), tempoBpm (number), rhythm (short word),',
    'instruments (array of short labels), structure (array of: intro, verse, pre-chorus, chorus, bridge, outro),',
    'durationSeconds (number), productionStyle (string), ending (string), intendedUse (string).',
    'Only include keys you can genuinely infer. Do not invent details that are not present or strongly implied.',
    '',
    `Request: ${prompt}`,
  ].join('\n');

  const reply = await sendChatCompletion([{ role: 'user', content: instruction }], signal);
  const json = extractJson(reply);
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;

  const brief = emptyBrief();
  const filled: string[] = ['Theme'];
  brief.theme = asString(obj.theme) ?? prompt.trim();

  const mode = asString(obj.mode);
  if (mode && getMode(mode as MusicModeId).id === mode) {
    brief.mode = mode as MusicModeId;
    filled.push('Mode');
  }
  const genreLabel = asString(obj.genre);
  if (genreLabel) {
    const match = MUSIC_GENRES.find((g) => g.label.toLowerCase() === genreLabel.toLowerCase() || g.id === genreLabel);
    brief.genre = match?.id ?? brief.genre;
    filled.push('Genre');
  }
  const lang = asString(obj.language);
  if (lang && MUSIC_LANGUAGES.some((l) => l.code === lang)) {
    brief.language = lang;
    filled.push('Language');
  }
  const vocal = asString(obj.vocalType);
  if (vocal && ['male', 'female', 'duet', 'instrumental'].includes(vocal)) {
    brief.vocalType = vocal as VocalType;
    filled.push('Vocals');
  }
  const mood = asString(obj.mood);
  if (mood) {
    const match = MOODS.find((m) => m.label.toLowerCase() === mood.toLowerCase() || m.id === mood);
    if (match) {
      brief.mood = match.id;
      filled.push('Mood');
    }
  }
  const energy = asString(obj.energy);
  if (energy) {
    const match = ENERGIES.find((e) => e.id === energy);
    if (match) {
      brief.energy = match.id;
      filled.push('Energy');
    }
  }
  if (typeof obj.tempoBpm === 'number' && obj.tempoBpm >= 20 && obj.tempoBpm <= 400) {
    brief.tempoBpm = Math.round(obj.tempoBpm);
    filled.push('Tempo');
  }
  const rhythm = asString(obj.rhythm);
  if (rhythm) {
    const match = RHYTHMS.find((r) => r.id === rhythm || r.label.toLowerCase() === rhythm.toLowerCase());
    if (match) {
      brief.rhythm = match.id;
      filled.push('Rhythm');
    }
  }
  if (Array.isArray(obj.instruments)) {
    const ids = obj.instruments
      .map((x) => (typeof x === 'string' ? INSTRUMENTS.find((i) => i.label.toLowerCase() === x.toLowerCase() || i.id === x)?.id : undefined))
      .filter((x): x is string => Boolean(x));
    if (ids.length) {
      brief.instruments = ids;
      filled.push('Instruments');
    }
  }
  if (Array.isArray(obj.structure)) {
    const order: SongSectionId[] = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro'];
    const ids = order.filter((id) => (obj.structure as unknown[]).includes(id));
    if (ids.length >= 2) {
      brief.structure = ids;
      filled.push('Structure');
    }
  }
  if (typeof obj.durationSeconds === 'number' && obj.durationSeconds > 0) {
    brief.durationSeconds = obj.durationSeconds;
    filled.push('Duration');
  }
  const production = asString(obj.productionStyle);
  if (production) {
    brief.productionStyle = production;
    filled.push('Production');
  }
  const ending = asString(obj.ending);
  if (ending) {
    brief.ending = ending;
    filled.push('Ending');
  }
  const use = asString(obj.intendedUse);
  if (use) {
    brief.intendedUse = use;
    filled.push('Intended use');
  }

  return {
    brief,
    filled,
    interpreter: 'language-model',
    originalPrompt: prompt,
    note: 'Interpreted with the connected language model. Review and correct anything before generating.',
  };
}

/**
 * Interpret a natural-language request. Uses the language model when connected
 * and falls back to the transparent rule-based analyser otherwise. Never throws
 * for an ordinary failure — an unusable model reply degrades to the rule-based
 * result rather than losing the user's request.
 */
export async function interpretMusicRequest(prompt: string, signal: AbortSignal): Promise<Interpretation> {
  const text = prompt.trim();
  if (!text) {
    return ruleBasedInterpret('');
  }
  if (isAiConfigured()) {
    try {
      const result = await llmInterpret(text, signal);
      if (result) return result;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      // Fall through to the rule-based analyser with an honest note.
      const fallback = ruleBasedInterpret(text);
      return {
        ...fallback,
        note: 'The language model could not be reached, so this was interpreted with the rule-based analyser instead. Review before generating.',
      };
    }
  }
  return ruleBasedInterpret(text);
}
