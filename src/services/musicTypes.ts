/**
 * ARTI AI — Music Studio core types and creation-mode taxonomy.
 *
 * This module is pure data and types: the twelve creation modes, the vocal
 * configuration model, the song-structure vocabulary, the transformation
 * registry and the duration helpers. It declares no capability — the provider
 * boundary (`musicProvider.ts`) is the only place that decides what can really
 * be generated, and it reports unsupported requests honestly.
 */

/* ==========================================================================
   Creation modes
   ========================================================================== */

export type MusicModeId =
  | 'full-song-vocals'
  | 'song-ai-lyrics'
  | 'song-user-lyrics'
  | 'lyrics-only'
  | 'instrumental'
  | 'background-score'
  | 'beats-dj'
  | 'regional'
  | 'cinematic-orchestral'
  | 'ambient-atmospheric'
  | 'short-clip'
  | 'custom';

export interface MusicModeDef {
  id: MusicModeId;
  label: string;
  /** One-line description shown on the mode tile. */
  description: string;
  /** Longer guidance shown once the mode is selected. */
  guidance: string;
  /** Category used for grouping in the mode picker. */
  group: 'vocals' | 'lyrics' | 'instrumental' | 'specialist' | 'custom';
  /** The mode needs a lyrics body (generated or supplied) before it can run. */
  needsLyrics: boolean;
  /** The provider is expected to produce a sung/voiced performance. */
  expectsVocals: boolean;
  /** A real audio asset is expected back. `lyrics-only` is the exception. */
  producesAudio: boolean;
  /** The mode is fundamentally an instrumental request (no lyrics offered). */
  instrumentalOnly: boolean;
}

export const MUSIC_MODES: MusicModeDef[] = [
  {
    id: 'full-song-vocals',
    label: 'Full Song with Vocals',
    description: 'A complete song with sung vocals, written for you.',
    guidance:
      'Describe the story and the sound. ARTI writes the lyrics and asks the provider for a full vocal performance.',
    group: 'vocals',
    needsLyrics: true,
    expectsVocals: true,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'song-ai-lyrics',
    label: 'Song with AI-Generated Lyrics',
    description: 'Lyrics are generated from your theme, then sung.',
    guidance:
      'Give a theme or a story. ARTI writes original lyrics in your chosen language, shows them for review, then generates the song.',
    group: 'vocals',
    needsLyrics: true,
    expectsVocals: true,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'song-user-lyrics',
    label: 'Song Using My Lyrics',
    description: 'You supply the lyrics; the provider sings them.',
    guidance:
      'Paste your own lyrics. They are sent to the provider exactly as written; nothing is rewritten without your say-so.',
    group: 'vocals',
    needsLyrics: true,
    expectsVocals: true,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'lyrics-only',
    label: 'Lyrics Only',
    description: 'Original lyrics, no music. Written for you to keep.',
    guidance:
      'ARTI writes original lyrics from your theme or prompt. No audio is generated — this is a writing tool.',
    group: 'lyrics',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: false,
    instrumentalOnly: false,
  },
  {
    id: 'instrumental',
    label: 'Instrumental Music',
    description: 'Music without lyrics or vocals.',
    guidance:
      'Configure theme, mood, energy, tempo, instruments and arrangement. No lyrics are required or generated.',
    group: 'instrumental',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: true,
  },
  {
    id: 'background-score',
    label: 'Background Music & Soundtracks',
    description: 'Bed music for video, podcast, game or film.',
    guidance:
      'Pick the intended use (video, podcast, game, film, presentation) and ARTI shapes a background-appropriate arrangement.',
    group: 'instrumental',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: true,
  },
  {
    id: 'beats-dj',
    label: 'Beats & DJ Tracks',
    description: 'Rhythm-led beats, loops and club-oriented tracks.',
    guidance:
      'Rhythm, groove and energy lead here. Vocals are optional and usually minimal.',
    group: 'instrumental',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'regional',
    label: 'Regional & Local Music Styles',
    description: 'Traditional and regional styles in local languages.',
    guidance:
      'Choose a regional style and language. Where the provider cannot sing the language you pick, ARTI says so and offers an alternative instead of silently switching.',
    group: 'specialist',
    needsLyrics: true,
    expectsVocals: true,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'cinematic-orchestral',
    label: 'Cinematic & Orchestral Music',
    description: 'Score-led music for film, trailers and scenes.',
    guidance:
      'Emphasise arrangement, dynamics, progression and a cinematic ending.',
    group: 'specialist',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: true,
  },
  {
    id: 'ambient-atmospheric',
    label: 'Ambient & Atmospheric Music',
    description: 'Textural soundscapes for focus, relaxation or mood.',
    guidance:
      'Slow, texture-first. Choose intensity changes and whether it sits behind or in front of other audio.',
    group: 'specialist',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: true,
  },
  {
    id: 'short-clip',
    label: 'Short Clips & Intros',
    description: 'Short stings, intros, outros and idents.',
    guidance:
      'Very short durations. Good for intros, outros, jingles and transitions.',
    group: 'specialist',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: false,
  },
  {
    id: 'custom',
    label: 'Custom (Natural Language)',
    description: 'Describe anything in your own words.',
    guidance:
      'Write freely. ARTI interprets your request, extracts the settings it can, and shows them for you to correct before generating.',
    group: 'custom',
    needsLyrics: false,
    expectsVocals: false,
    producesAudio: true,
    instrumentalOnly: false,
  },
];

export function getMode(id: MusicModeId): MusicModeDef {
  return MUSIC_MODES.find((m) => m.id === id) ?? MUSIC_MODES[0];
}

/* ==========================================================================
   Vocals
   ========================================================================== */

export type VocalType = 'male' | 'female' | 'duet' | 'instrumental';

export interface VocalTypeDef {
  id: VocalType;
  label: string;
  description: string;
}

export const VOCAL_TYPES: VocalTypeDef[] = [
  { id: 'male', label: 'Male vocal', description: 'A single male lead vocal.' },
  { id: 'female', label: 'Female vocal', description: 'A single female lead vocal.' },
  {
    id: 'duet',
    label: 'Male–female duet',
    description: 'Two leads. ARTI can assign separate male and female lyric sections.',
  },
  { id: 'instrumental', label: 'Instrumental only', description: 'No vocals at all.' },
];

export const VOCAL_DELIVERIES: string[] = [
  'Gentle / intimate',
  'Warm / romantic',
  'Emotional / heartfelt',
  'Powerful / belted',
  'Soft / breathy',
  'Energetic / driving',
  'Melancholic',
  'Hopeful',
  'Playful',
  'Spoken-word',
];

/** How a duet is arranged across the song. */
export type DuetArrangement =
  | 'alternating-verses'
  | 'shared-chorus'
  | 'call-and-response'
  | 'combined';

export interface DuetArrangementDef {
  id: DuetArrangement;
  label: string;
  description: string;
}

export const DUET_ARRANGEMENTS: DuetArrangementDef[] = [
  {
    id: 'alternating-verses',
    label: 'Alternating verses',
    description: 'Male and female leads take separate verses.',
  },
  {
    id: 'shared-chorus',
    label: 'Shared chorus',
    description: 'Leads alternate verses and sing the chorus together.',
  },
  {
    id: 'call-and-response',
    label: 'Call and response',
    description: 'One lead calls a line, the other answers it.',
  },
  {
    id: 'combined',
    label: 'Combined throughout',
    description: 'Both leads sing together across the whole song.',
  },
];

/* ==========================================================================
   Song structure
   ========================================================================== */

export type SongSectionId = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro';

export interface SongSectionDef {
  id: SongSectionId;
  label: string;
}

export const SONG_SECTIONS: SongSectionDef[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'verse', label: 'Verse' },
  { id: 'pre-chorus', label: 'Pre-chorus' },
  { id: 'chorus', label: 'Chorus' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'outro', label: 'Outro' },
];

/** A lyric section, tagged so duet assignment and regeneration can target it. */
export interface LyricSection {
  id: string;
  section: SongSectionId;
  /** Optional label override, e.g. "Verse 1 (male)". */
  label?: string;
  text: string;
  /** Which voice sings this section, for a duet. */
  voice?: 'male' | 'female' | 'both';
}

/* ==========================================================================
   Provenance & licensing honesty
   ========================================================================== */

export type TrackProvenance =
  | 'ai-vocals-and-music'
  | 'ai-instrumental'
  | 'user-audio'
  | 'processed-from-ai'
  | 'licensed-external';

export const PROVENANCE_LABELS: Record<TrackProvenance, string> = {
  'ai-vocals-and-music': 'AI-generated music with AI-generated vocals',
  'ai-instrumental': 'AI-generated instrumental music',
  'user-audio': 'User-uploaded audio',
  'processed-from-ai': 'AI audio processed by a real transformation step',
  'licensed-external': 'Licensed external audio',
};

export const PROVENANCE_NOTES: Record<TrackProvenance, string> = {
  'ai-vocals-and-music':
    'The vocals are synthetic. No human singer performed this track, and it is not a recording of any real artist.',
  'ai-instrumental':
    'The music is synthetic. There are no vocals in this track.',
  'user-audio': 'This audio was supplied by you and is stored locally.',
  'processed-from-ai':
    'This is AI-generated audio that was then processed by a real, separate transformation step. The processing method is recorded on the track.',
  'licensed-external':
    'This audio was supplied under an external licence. ARTI does not assert rights it has not been given.',
};

/* ==========================================================================
   Transformations (regenerate & transform existing songs)
   ========================================================================== */

/**
 * How a slowed/ultra-slow version is produced. These are genuinely different
 * operations and are never presented as the same thing:
 *   - `playback-speed`  plays the same audio faster/slower: tempo and pitch
 *                       change together (real, done locally with Web Audio).
 *   - `time-stretch`    changes tempo while preserving pitch; requires a DSP
 *                       step (an audio-processing service). Reported honestly
 *                       as not connected when none is configured.
 *   - `ai-rearrangement` asks the provider to genuinely re-perform the music at
 *                       the new tempo.
 */
export type SpeedMethod = 'playback-speed' | 'time-stretch' | 'ai-rearrangement';

export interface SpeedMethodDef {
  id: SpeedMethod;
  label: string;
  description: string;
}

export const SPEED_METHODS: SpeedMethodDef[] = [
  {
    id: 'playback-speed',
    label: 'Playback speed change',
    description:
      'The same recording played slower or faster. Tempo and pitch change together. Done locally in your browser.',
  },
  {
    id: 'time-stretch',
    label: 'Time stretch (pitch preserved)',
    description:
      'Tempo changes while pitch is preserved. This needs a real DSP step; it is not available until an audio-processing service is connected.',
  },
  {
    id: 'ai-rearrangement',
    label: 'AI re-arrangement',
    description:
      'The provider genuinely re-performs the music at the new tempo. Requires a connected music provider.',
  },
];

export type TransformId =
  | 'slower'
  | 'ultra-slow'
  | 'faster'
  | 'instrumental'
  | 'alternate-arrangement'
  | 'different-genre'
  | 'different-mood'
  | 'revised-lyrics'
  | 'revised-vocals'
  | 'different-intro'
  | 'different-ending'
  | 'extended'
  | 'shortened'
  | 'alternative-mix';

export type TransformCategory =
  | 'tempo'
  | 'arrangement'
  | 'revision'
  | 'structure'
  | 'mix';

export interface TransformDef {
  id: TransformId;
  label: string;
  description: string;
  category: TransformCategory;
  /** How the transformation is realized. */
  method: 'ai-provider' | 'client-audio';
  /** Only tempo transforms carry the explicit speed-method choice. */
  speedMethods?: SpeedMethodDef[];
  /** What ARTI will actually do — shown to the user before starting. */
  performs: string;
}

export const MUSIC_TRANSFORMS: TransformDef[] = [
  {
    id: 'slower',
    label: 'Slower version',
    description: 'A noticeably slower take of this track.',
    category: 'tempo',
    method: 'client-audio',
    speedMethods: SPEED_METHODS,
    performs:
      'You choose the method: a local playback-speed change, a pitch-preserving time stretch (needs an audio service), or an AI re-arrangement (needs a music provider).',
  },
  {
    id: 'ultra-slow',
    label: 'Ultra-slow version',
    description: 'A heavily slowed take of this track.',
    category: 'tempo',
    method: 'client-audio',
    speedMethods: SPEED_METHODS,
    performs:
      'You choose the method, exactly as for the slower version. Ultra-slow playback-speed processing will shift pitch substantially.',
  },
  {
    id: 'faster',
    label: 'Faster version',
    description: 'A faster take of this track.',
    category: 'tempo',
    method: 'client-audio',
    speedMethods: SPEED_METHODS,
    performs:
      'You choose the method: local playback-speed, pitch-preserving time stretch (needs an audio service), or AI re-arrangement.',
  },
  {
    id: 'instrumental',
    label: 'Instrumental version',
    description: 'The same song with the vocals removed.',
    category: 'arrangement',
    method: 'ai-provider',
    performs:
      'The provider is asked to re-generate the track as an instrumental. Vocal removal from an existing mix is not claimed.',
  },
  {
    id: 'alternate-arrangement',
    label: 'Alternate arrangement',
    description: 'A different arrangement of the same song.',
    category: 'arrangement',
    method: 'ai-provider',
    performs: 'The provider generates a new arrangement from the same brief and lyrics.',
  },
  {
    id: 'different-genre',
    label: 'Different genre',
    description: 'Re-record in a different, compatible genre.',
    category: 'arrangement',
    method: 'ai-provider',
    performs: 'The provider re-generates the track in the genre you choose.',
  },
  {
    id: 'different-mood',
    label: 'Different mood',
    description: 'Re-record with a different mood.',
    category: 'arrangement',
    method: 'ai-provider',
    performs: 'The provider re-generates the track with the mood you choose.',
  },
  {
    id: 'revised-lyrics',
    label: 'Revised lyrics',
    description: 'Re-generate with edited lyrics.',
    category: 'revision',
    method: 'ai-provider',
    performs: 'You edit the lyrics, then the provider re-generates the vocal performance.',
  },
  {
    id: 'revised-vocals',
    label: 'Revised vocals',
    description: 'Re-generate the vocal performance.',
    category: 'revision',
    method: 'ai-provider',
    performs: 'The provider re-generates the vocals from the same lyrics and brief.',
  },
  {
    id: 'different-intro',
    label: 'Different introduction',
    description: 'A new introduction.',
    category: 'structure',
    method: 'ai-provider',
    performs: 'The provider re-generates with a different introduction.',
  },
  {
    id: 'different-ending',
    label: 'Different ending',
    description: 'A new ending or outro.',
    category: 'structure',
    method: 'ai-provider',
    performs: 'The provider re-generates with a different ending.',
  },
  {
    id: 'extended',
    label: 'Extended version',
    description: 'A longer version.',
    category: 'structure',
    method: 'ai-provider',
    performs: 'The provider re-generates a longer take within its own duration limit.',
  },
  {
    id: 'shortened',
    label: 'Shortened version',
    description: 'A shorter version.',
    category: 'structure',
    method: 'ai-provider',
    performs: 'The provider re-generates a shorter take.',
  },
  {
    id: 'alternative-mix',
    label: 'Alternative mix',
    description: 'A different mix of the same performance.',
    category: 'mix',
    method: 'ai-provider',
    performs:
      'The provider re-generates with different mix emphasis. True stem-level re-mixing is not claimed.',
  },
];

export function getTransform(id: TransformId): TransformDef {
  return MUSIC_TRANSFORMS.find((t) => t.id === id) ?? MUSIC_TRANSFORMS[0];
}

/* ==========================================================================
   Duration helpers (0.1 s → 1,000 h+)
   ========================================================================== */

export const MIN_DURATION_SECONDS = 0.1;
export const MAX_DURATION_SECONDS = 3_600_000; // 1,000 hours

/** Format a duration in seconds as `m:ss`, `h:mm:ss` or a `d h m` summary. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  if (seconds < 60) return `0:${String(Math.floor(seconds)).padStart(2, '0')}`;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m}m`;
  }
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parse a human duration token. Accepts `mm:ss`, `h:mm:ss`, a bare number of
 * seconds, or a value with a unit suffix (`90s`, `3m`, `1.5h`).
 */
export function parseDuration(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  const clock = raw.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})$/);
  if (clock) {
    const h = clock[1] ? parseInt(clock[1], 10) : 0;
    const m = parseInt(clock[2], 10);
    const s = parseInt(clock[3], 10);
    return h * 3600 + m * 60 + s;
  }
  const unit = raw.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?)$/);
  if (unit) {
    const value = parseFloat(unit[1]);
    const u = unit[2][0];
    if (u === 'h') return value * 3600;
    if (u === 'm') return value * 60;
    return value;
  }
  const bare = raw.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return parseFloat(bare[1]);
  return null;
}

/** Clamp a duration to the model's honest range. */
export function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return 60;
  return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, seconds));
}
