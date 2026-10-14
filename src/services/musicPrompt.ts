/**
 * ARTI AI — Music Studio brief → provider prompt builder.
 *
 * Turns the reviewed brief (mode, language, genre, vocals, mood, tempo,
 * instruments, structure, duration, production, ending) into the structured
 * prompt string a provider bridge receives. It is deterministic and transparent:
 * the UI shows the same fields that are assembled here, so what the user
 * reviewed is what is sent.
 */
import {
  getMode,
  SONG_SECTIONS,
  type MusicModeId,
  type SongSectionId,
  type VocalType,
} from './musicTypes';
import { getGenre, labelFor, INSTRUMENTS, MOODS, RHYTHMS, ENERGIES } from './musicStyles';
import { languageLabel } from './musicLanguages';

export interface MusicBrief {
  mode: MusicModeId;
  /** What the song is about / the story / the emotion. */
  theme: string;
  audience?: string;
  genre: string;
  subgenre?: string;
  language: string;
  vocalType: VocalType;
  vocalDelivery?: string;
  mood: string;
  energy: string;
  tempoBpm?: number;
  rhythm?: string;
  instruments: string[];
  structure: SongSectionId[];
  durationSeconds: number;
  productionStyle?: string;
  ending?: string;
  transitions?: string;
  intendedUse?: string;
  backgroundForeground?: 'background' | 'foreground';
  lyricsPreference?: string;
  customInstructions?: string;
}

export function emptyBrief(): MusicBrief {
  return {
    mode: 'full-song-vocals',
    theme: '',
    genre: 'pop',
    language: 'en',
    vocalType: 'female',
    mood: 'emotional',
    energy: 'medium',
    instruments: [],
    structure: ['intro', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    durationSeconds: 180,
    backgroundForeground: 'foreground',
  };
}

function structureLabel(ids: SongSectionId[]): string {
  return ids
    .map((id) => SONG_SECTIONS.find((s) => s.id === id)?.label ?? id)
    .join(' → ');
}

function vocalPhrase(brief: MusicBrief): string {
  const mode = getMode(brief.mode);
  if (mode.instrumentalOnly || brief.vocalType === 'instrumental') return 'instrumental, no vocals';
  const map: Record<VocalType, string> = {
    male: 'male lead vocal',
    female: 'female lead vocal',
    duet: 'male and female duet vocals',
    instrumental: 'instrumental, no vocals',
  };
  const delivery = brief.vocalDelivery ? `, ${brief.vocalDelivery.toLowerCase()}` : '';
  return `${map[brief.vocalType]} in ${languageLabel(brief.language)}${delivery}`;
}

/**
 * Build the positive prompt string. It leads with the mode, then the creative
 * brief, so a bridge that only reads the first sentence still gets the intent.
 */
export function buildMusicPrompt(brief: MusicBrief, lyrics?: string): string {
  const mode = getMode(brief.mode);
  const genre = getGenre(brief.genre);
  const parts: string[] = [];

  const modeLead: Record<MusicModeId, string> = {
    'full-song-vocals': 'Create a full song with vocals.',
    'song-ai-lyrics': 'Create a song with original lyrics.',
    'song-user-lyrics': 'Create a song using the supplied lyrics.',
    'lyrics-only': 'Write original lyrics only (no audio).',
    instrumental: 'Create an instrumental piece.',
    'background-score': 'Create background music.',
    'beats-dj': 'Create a beats/DJ-oriented track.',
    regional: 'Create a regional/local-style song.',
    'cinematic-orchestral': 'Create cinematic orchestral music.',
    'ambient-atmospheric': 'Create ambient atmospheric music.',
    'short-clip': 'Create a short music clip.',
    custom: 'Create music from the following description.',
  };
  parts.push(modeLead[brief.mode]);

  if (brief.theme) parts.push(`Theme: ${brief.theme}.`);
  if (brief.audience) parts.push(`Audience: ${brief.audience}.`);

  const genreBits: string[] = [];
  if (genre) genreBits.push(genre.label);
  if (brief.subgenre) genreBits.push(brief.subgenre);
  if (genreBits.length) parts.push(`Genre: ${genreBits.join(' / ')}.`);

  parts.push(`Vocals: ${vocalPhrase(brief)}.`);
  if (!mode.instrumentalOnly) parts.push(`Lyrics language: ${languageLabel(brief.language)}.`);

  parts.push(`Mood: ${labelFor(MOODS, brief.mood)}. Energy: ${labelFor(ENERGIES, brief.energy)}.`);
  if (typeof brief.tempoBpm === 'number') parts.push(`Tempo: about ${brief.tempoBpm} BPM.`);
  if (brief.rhythm) parts.push(`Rhythm: ${labelFor(RHYTHMS, brief.rhythm)}.`);

  if (brief.instruments.length) {
    parts.push(`Instrumentation: ${brief.instruments.map((id) => labelFor(INSTRUMENTS, id)).join(', ')}.`);
  }

  if (brief.structure.length) parts.push(`Structure: ${structureLabel(brief.structure)}.`);
  parts.push(`Approximate duration: ${Math.round(brief.durationSeconds)} seconds.`);
  if (brief.productionStyle) parts.push(`Production: ${brief.productionStyle}.`);
  if (brief.ending) parts.push(`Ending: ${brief.ending}.`);
  if (brief.transitions) parts.push(`Transitions: ${brief.transitions}.`);
  if (brief.intendedUse) parts.push(`Intended use: ${brief.intendedUse}.`);
  if (brief.backgroundForeground === 'background') {
    parts.push('Keep the arrangement unobtrusive as background music.');
  } else if (brief.backgroundForeground === 'foreground') {
    parts.push('Foreground prominence: the music should lead.');
  }
  if (brief.lyricsPreference) parts.push(`Lyrics preference: ${brief.lyricsPreference}.`);
  if (brief.customInstructions) parts.push(`Additional direction: ${brief.customInstructions}.`);

  if (lyrics && lyrics.trim() && !mode.instrumentalOnly) {
    parts.push(`\nLyrics:\n${lyrics.trim()}`);
  }

  return parts.join(' ');
}

/** Negative guidance: what to avoid. Never a fabricated capability claim. */
export function buildNegativePrompt(brief: MusicBrief): string {
  const mode = getMode(brief.mode);
  const out: string[] = [];
  if (mode.instrumentalOnly || brief.vocalType === 'instrumental') out.push('no vocals, no lyrics');
  out.push('no copyrighted melody, no imitation of a named artist');
  return out.join(', ');
}

/** Human-readable summary rows for the review panel (label → value). */
export function briefSummary(brief: MusicBrief): { label: string; value: string }[] {
  const mode = getMode(brief.mode);
  const rows: { label: string; value: string }[] = [
    { label: 'Mode', value: mode.label },
    { label: 'Theme', value: brief.theme || '—' },
    { label: 'Genre', value: getGenre(brief.genre)?.label ?? (brief.genre || '—') },
    { label: 'Language', value: languageLabel(brief.language) },
    { label: 'Vocals', value: vocalPhrase(brief) },
    { label: 'Mood', value: labelFor(MOODS, brief.mood) },
    { label: 'Energy', value: labelFor(ENERGIES, brief.energy) },
  ];
  if (typeof brief.tempoBpm === 'number') rows.push({ label: 'Tempo', value: `${brief.tempoBpm} BPM` });
  if (brief.rhythm) rows.push({ label: 'Rhythm', value: labelFor(RHYTHMS, brief.rhythm) });
  if (brief.instruments.length) {
    rows.push({ label: 'Instruments', value: brief.instruments.map((id) => labelFor(INSTRUMENTS, id)).join(', ') });
  }
  if (brief.structure.length) rows.push({ label: 'Structure', value: structureLabel(brief.structure) });
  rows.push({ label: 'Duration', value: `${Math.round(brief.durationSeconds)} s` });
  if (brief.productionStyle) rows.push({ label: 'Production', value: brief.productionStyle });
  if (brief.ending) rows.push({ label: 'Ending', value: brief.ending });
  if (brief.intendedUse) rows.push({ label: 'Intended use', value: brief.intendedUse });
  return rows;
}

/** Deterministic key used to detect accidental duplicate submissions. */
export function briefSignature(brief: MusicBrief, lyrics: string): string {
  return JSON.stringify({
    m: brief.mode,
    t: brief.theme.trim().toLowerCase(),
    g: brief.genre,
    l: brief.language,
    v: brief.vocalType,
    mo: brief.mood,
    e: brief.energy,
    b: brief.tempoBpm ?? null,
    i: [...brief.instruments].sort(),
    s: brief.structure,
    d: Math.round(brief.durationSeconds),
    ly: lyrics.trim().toLowerCase(),
  });
}
