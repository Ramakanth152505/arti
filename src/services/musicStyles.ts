/**
 * ARTI AI — Music Studio style catalog.
 *
 * A broad, extensible product catalog of genres, instruments, moods and
 * rhythms. This is a discovery surface, NOT a capability promise: the provider
 * boundary (`musicProvider.ts`) decides what can actually be generated, and the
 * UI never claims that every model supports every style here.
 *
 * Users may combine compatible genres, instruments, rhythms and moods, and may
 * add a free-text custom style. Recently-used styles are tracked locally.
 */

export interface GenreDef {
  id: string;
  label: string;
  /** Broad family used for grouping in the picker. */
  family: string;
  /** One-line hint shown in the catalog. */
  hint: string;
  /** Compatible genre ids that pair well. */
  compatibleWith?: string[];
}

export const GENRE_FAMILIES = [
  'Popular',
  'Urban & Rhythm',
  'Electronic & Club',
  'Classical & Score',
  'Roots & Traditional',
  'Ambient & Texture',
  'Regional & Fusion',
] as const;

export const MUSIC_GENRES: GenreDef[] = [
  // Popular
  { id: 'pop', label: 'Pop', family: 'Popular', hint: 'Catchy hooks, bright production.', compatibleWith: ['dance-pop', 'synth-pop', 'rnb'] },
  { id: 'dance-pop', label: 'Dance Pop', family: 'Popular', hint: 'Pop with a four-on-the-floor pulse.', compatibleWith: ['pop', 'edm'] },
  { id: 'synth-pop', label: 'Synth Pop', family: 'Popular', hint: 'Retro synth leads and gated drums.', compatibleWith: ['pop', 'electronic'] },
  { id: 'rock', label: 'Rock', family: 'Popular', hint: 'Guitars, live drums, strong dynamics.', compatibleWith: ['indie', 'metal', 'blues'] },
  { id: 'indie', label: 'Indie', family: 'Popular', hint: 'Jangly guitars, intimate vocals.', compatibleWith: ['rock', 'folk'] },
  { id: 'folk', label: 'Folk', family: 'Popular', hint: 'Acoustic, storytelling-led.', compatibleWith: ['country', 'acoustic', 'indie'] },
  { id: 'country', label: 'Country', family: 'Popular', hint: 'Twang, pedal steel, narrative lyrics.', compatibleWith: ['folk', 'acoustic'] },
  { id: 'acoustic', label: 'Acoustic', family: 'Popular', hint: 'Unplugged instrumentation.', compatibleWith: ['folk', 'country'] },
  { id: 'metal', label: 'Metal', family: 'Popular', hint: 'Distorted guitars, heavy rhythm.', compatibleWith: ['rock'] },

  // Urban & Rhythm
  { id: 'hip-hop', label: 'Hip-hop', family: 'Urban & Rhythm', hint: 'Boom-bap or trap-leaning beats.', compatibleWith: ['rap', 'rnb', 'trap'] },
  { id: 'rap', label: 'Rap', family: 'Urban & Rhythm', hint: 'Spoken-word rhythm over beats.', compatibleWith: ['hip-hop', 'trap'] },
  { id: 'trap', label: 'Trap', family: 'Urban & Rhythm', hint: 'Rolling hi-hats, deep 808s.', compatibleWith: ['hip-hop', 'rap'] },
  { id: 'rnb', label: 'R&B', family: 'Urban & Rhythm', hint: 'Smooth grooves, soulful vocals.', compatibleWith: ['soul', 'pop'] },
  { id: 'soul', label: 'Soul', family: 'Urban & Rhythm', hint: 'Warm, expressive, vintage feel.', compatibleWith: ['rnb', 'funk'] },
  { id: 'funk', label: 'Funk', family: 'Urban & Rhythm', hint: 'Syncopated bass, tight horns.', compatibleWith: ['soul', 'disco'] },
  { id: 'reggae', label: 'Reggae', family: 'Urban & Rhythm', hint: 'Off-beat skank, laid-back groove.', compatibleWith: ['dub', 'ska'] },
  { id: 'dub', label: 'Dub', family: 'Urban & Rhythm', hint: 'Heavy bass, echo and space.', compatibleWith: ['reggae'] },

  // Electronic & Club
  { id: 'electronic', label: 'Electronic', family: 'Electronic & Club', hint: 'Synthesiser-led production.', compatibleWith: ['edm', 'house', 'techno'] },
  { id: 'edm', label: 'EDM', family: 'Electronic & Club', hint: 'Big builds, festival drops.', compatibleWith: ['electronic', 'house'] },
  { id: 'house', label: 'House', family: 'Electronic & Club', hint: 'Four-on-the-floor, groovy bass.', compatibleWith: ['techno', 'edm', 'disco'] },
  { id: 'techno', label: 'Techno', family: 'Electronic & Club', hint: 'Hypnotic, mechanical, driving.', compatibleWith: ['house', 'trance'] },
  { id: 'trance', label: 'Trance', family: 'Electronic & Club', hint: 'Soaring leads, long builds.', compatibleWith: ['techno', 'edm'] },
  { id: 'drum-and-bass', label: 'Drum & Bass', family: 'Electronic & Club', hint: 'Fast breakbeats, deep sub-bass.', compatibleWith: ['electronic'] },
  { id: 'dj-club', label: 'DJ & Club Tracks', family: 'Electronic & Club', hint: 'Built for the floor and mixing.', compatibleWith: ['house', 'techno', 'edm'] },
  { id: 'disco', label: 'Disco', family: 'Electronic & Club', hint: 'Strings, groove, four-on-the-floor.', compatibleWith: ['funk', 'house'] },
  { id: 'lo-fi', label: 'Lo-fi', family: 'Electronic & Club', hint: 'Dusty texture, relaxed rhythm.', compatibleWith: ['ambient', 'hip-hop'] },

  // Classical & Score
  { id: 'classical', label: 'Classical', family: 'Classical & Score', hint: 'Orchestral tradition.', compatibleWith: ['orchestral', 'acoustic'] },
  { id: 'orchestral', label: 'Orchestral', family: 'Classical & Score', hint: 'Full orchestra arrangement.', compatibleWith: ['cinematic', 'classical'] },
  { id: 'cinematic', label: 'Cinematic', family: 'Classical & Score', hint: 'Score for picture.', compatibleWith: ['orchestral', 'trailer'] },
  { id: 'trailer', label: 'Trailer', family: 'Classical & Score', hint: 'Big hits, risers, epic scale.', compatibleWith: ['cinematic', 'orchestral'] },
  { id: 'blues', label: 'Blues', family: 'Classical & Score', hint: 'Twelve-bar, expressive bends.', compatibleWith: ['rock', 'jazz'] },
  { id: 'jazz', label: 'Jazz', family: 'Classical & Score', hint: 'Improvisation, extended harmony.', compatibleWith: ['blues', 'soul'] },

  // Roots & Traditional
  { id: 'devotional', label: 'Devotional', family: 'Roots & Traditional', hint: 'Sacred and prayerful music.', compatibleWith: ['traditional', 'regional'] },
  { id: 'traditional', label: 'Traditional', family: 'Roots & Traditional', hint: 'Heritage forms and instruments.', compatibleWith: ['regional', 'folk'] },
  { id: 'regional', label: 'Regional', family: 'Roots & Traditional', hint: 'Local and regional styles.', compatibleWith: ['traditional', 'fusion'] },
  { id: 'world', label: 'World', family: 'Roots & Traditional', hint: 'Global instruments and scales.', compatibleWith: ['regional', 'fusion'] },

  // Ambient & Texture
  { id: 'ambient', label: 'Ambient', family: 'Ambient & Texture', hint: 'Slow, textural, beatless.', compatibleWith: ['atmospheric', 'lo-fi'] },
  { id: 'atmospheric', label: 'Atmospheric', family: 'Ambient & Texture', hint: 'Mood and space over hooks.', compatibleWith: ['ambient', 'cinematic'] },

  // Regional & Fusion
  { id: 'fusion', label: 'Fusion', family: 'Regional & Fusion', hint: 'Blends two traditions deliberately.', compatibleWith: ['regional', 'world', 'jazz'] },
];

export function getGenre(id: string): GenreDef | undefined {
  return MUSIC_GENRES.find((g) => g.id === id);
}

/* ==========================================================================
   Instruments, moods, rhythms
   ========================================================================== */

export interface NamedDef {
  id: string;
  label: string;
}

export const INSTRUMENTS: NamedDef[] = [
  { id: 'piano', label: 'Grand Piano' },
  { id: 'acoustic-guitar', label: 'Acoustic Guitar' },
  { id: 'electric-guitar', label: 'Electric Guitar' },
  { id: 'bass', label: 'Bass Guitar' },
  { id: 'sub-bass', label: 'Sub Bass / 808' },
  { id: 'strings', label: 'String Section' },
  { id: 'cello', label: 'Solo Cello' },
  { id: 'violin', label: 'Solo Violin' },
  { id: 'flute', label: 'Flute' },
  { id: 'sitar', label: 'Sitar' },
  { id: 'tabla', label: 'Tabla' },
  { id: 'bansuri', label: 'Bansuri' },
  { id: 'veena', label: 'Veena' },
  { id: 'mridangam', label: 'Mridangam' },
  { id: 'horns', label: 'Brass / Horns' },
  { id: 'synth', label: 'Synthesiser' },
  { id: 'pad', label: 'Pad / Drone' },
  { id: 'arp', label: 'Arpeggiator' },
  { id: 'drums', label: 'Live Drums' },
  { id: 'percussion', label: 'Percussion' },
  { id: 'choir', label: 'Choir' },
  { id: 'harp', label: 'Harp' },
  { id: 'organ', label: 'Organ' },
  { id: 'saxophone', label: 'Saxophone' },
  { id: 'trumpet', label: 'Trumpet' },
];

export const MOODS: NamedDef[] = [
  { id: 'romantic', label: 'Romantic' },
  { id: 'emotional', label: 'Emotional' },
  { id: 'uplifting', label: 'Uplifting' },
  { id: 'melancholic', label: 'Melancholic' },
  { id: 'hopeful', label: 'Hopeful' },
  { id: 'epic', label: 'Epic' },
  { id: 'tense', label: 'Tense' },
  { id: 'calm', label: 'Calm' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'playful', label: 'Playful' },
  { id: 'mysterious', label: 'Mysterious' },
  { id: 'triumphant', label: 'Triumphant' },
  { id: 'nostalgic', label: 'Nostalgic' },
  { id: 'spiritual', label: 'Spiritual' },
];

export const RHYTHMS: NamedDef[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'swing', label: 'Swing' },
  { id: 'four-on-floor', label: 'Four on the floor' },
  { id: 'half-time', label: 'Half-time' },
  { id: 'breakbeat', label: 'Breakbeat' },
  { id: 'shuffle', label: 'Shuffle' },
  { id: 'syncopated', label: 'Syncopated' },
  { id: 'free', label: 'Free / rubato' },
];

export const ENERGIES: NamedDef[] = [
  { id: 'very-low', label: 'Very low' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'very-high', label: 'Very high' },
];

export function labelFor(list: NamedDef[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

/* ==========================================================================
   Recently-used styles (local, per-browser)
   ========================================================================== */

const RECENT_KEY = 'arti_music_recent_styles';
const RECENT_MAX = 8;

export function getRecentGenres(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]).filter((id) => getGenre(id)) : [];
  } catch {
    return [];
  }
}

export function rememberGenre(id: string): void {
  if (typeof window === 'undefined' || !getGenre(id)) return;
  try {
    const current = getRecentGenres().filter((x) => x !== id);
    const next = [id, ...current].slice(0, RECENT_MAX);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* Storage unavailable — recently-used is a convenience, not required. */
  }
}
