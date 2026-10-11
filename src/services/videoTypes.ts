/**
 * ARTI AI — Videos type taxonomy, duration model and prompt intelligence.
 *
 * Video *type* describes WHAT is being produced and how the production is
 * organised (a single clip, a feature film, a web series, a multi-season series,
 * a cinematic universe). It is deliberately independent of *style*
 * (`videoStyles.ts`), which describes how the video looks.
 *
 * The most important distinction in this module:
 *
 *   - A single video has a duration.
 *   - A series has seasons and episodes.
 *   - A franchise can contain several connected series and films.
 *
 * Their combined runtime can exceed 1,000 hours without being one continuous
 * file. `classifyVideoIntent` reads a natural-language request and reports which
 * of those structures the user actually means, and never silently decides when a
 * request is genuinely ambiguous.
 */

/* ==========================================================================
   1. Video type taxonomy (scalable, category-driven)
   ========================================================================== */
export type VideoTypeCategoryId =
  | 'standalone'
  | 'episodic'
  | 'season-based'
  | 'large-cinematic'
  | 'structured-other';

export interface VideoTypeCategory {
  id: VideoTypeCategoryId;
  label: string;
  description: string;
}

export interface VideoTypeDef {
  id: string;
  name: string;
  category: VideoTypeCategoryId;
  description: string;
  /**
   * True when this type is a multi-part production (seasons/episodes or a
   * franchise) rather than one continuous output. The Videos UI uses this to
   * route the request to the Series & Franchise Studio instead of the single
   * video flow.
   */
  structured: boolean;
}

export const VIDEO_TYPE_CATEGORIES: VideoTypeCategory[] = [
  { id: 'standalone', label: 'Standalone Formats', description: 'One self-contained video or film.' },
  { id: 'episodic', label: 'Episodic Formats', description: 'Series organised into episodes.' },
  { id: 'season-based', label: 'Season-Based Productions', description: 'Multiple seasons of episodes.' },
  { id: 'large-cinematic', label: 'Large Cinematic Productions', description: 'Franchises, universes and sagas.' },
  { id: 'structured-other', label: 'Other Structured Formats', description: 'Courses, adaptations, cuts and spin-offs.' },
];

type TypeSeed = [string, string, string, boolean?];

function types(category: VideoTypeCategoryId, seeds: TypeSeed[]): VideoTypeDef[] {
  return seeds.map((s) => ({
    id: s[0],
    name: s[1],
    category,
    description: s[2],
    structured: s[3] ?? false,
  }));
}

const STANDALONE = types('standalone', [
  ['single-video', 'Single video', 'One continuous video clip.'],
  ['short-film', 'Short film', 'A short narrative film.'],
  ['feature-film', 'Feature film', 'A full-length film, generated as scenes and shots.', true],
  ['micro-film', 'Micro-film', 'A very short film.'],
  ['trailer', 'Trailer', 'A promotional trailer.'],
  ['teaser', 'Teaser', 'A short teaser.'],
  ['promotional-video', 'Promotional video', 'Brand or campaign video.'],
  ['advertisement', 'Advertisement', 'A commercial advertisement.'],
  ['music-video', 'Music video', 'A music promo.'],
  ['documentary', 'Documentary', 'A documentary, generated as scenes.', true],
  ['educational-video', 'Educational video', 'A teaching video.'],
  ['explainer-video', 'Explainer video', 'An explainer.'],
  ['tutorial', 'Tutorial', 'A step-by-step tutorial.'],
  ['interview', 'Interview', 'An interview piece.'],
  ['product-demonstration', 'Product demonstration', 'A product demo.'],
  ['travel-film', 'Travel film', 'A travelogue.'],
  ['event-film', 'Event film', 'Coverage of an event.'],
  ['experimental-film', 'Experimental film', 'An experimental piece.'],
]);

const EPISODIC = types('episodic', [
  ['tv-series', 'TV series', 'A television series.', true],
  ['web-series', 'Web series', 'A web series.', true],
  ['animated-series', 'Animated series', 'An animated series.', true],
  ['anime-series', 'Anime series', 'An anime series.', true],
  ['documentary-series', 'Documentary series', 'A documentary series.', true],
  ['educational-series', 'Educational series', 'An educational series.', true],
  ['anthology-series', 'Anthology series', 'An anthology series.', true],
  ['limited-series', 'Limited series', 'A limited-run series.', true],
  ['miniseries', 'Miniseries', 'A short, closed series.', true],
  ['daily-episodic-drama', 'Daily episodic drama', 'A daily serial drama.', true],
  ['sitcom', 'Sitcom', 'A situation comedy.', true],
  ['serialized-drama', 'Serialized drama', 'A serialised narrative drama.', true],
  ['reality-show', 'Reality-show format', 'A reality format.', true],
  ['competition-show', 'Competition-show format', 'A competition format.', true],
  ['talk-show', 'Talk-show format', 'A talk-show format.', true],
  ['news-program', 'News or current-affairs program', 'A news/current-affairs programme.', true],
  ['podcast-video-series', 'Podcast video series', 'A video podcast series.', true],
  ['childrens-series', 'Children\'s series', 'A children\'s series.', true],
  ['historical-drama-series', 'Historical drama series', 'A period drama series.', true],
  ['science-fiction-series', 'Science-fiction series', 'A sci-fi series.', true],
  ['fantasy-series', 'Fantasy series', 'A fantasy series.', true],
]);

const SEASON_BASED = types('season-based', [
  ['multi-season-series', 'Multi-season series', 'A series spanning several seasons.', true],
  ['season-1', 'Season 1', 'A single named season (Season 1).', true],
  ['season-2', 'Season 2', 'A continuation season.', true],
  ['season-3', 'Season 3', 'A continuation season.', true],
  ['season-later', 'Season 3 and beyond', 'A later continuation season.', true],
  ['multiple-parts', 'Multiple parts within a season', 'A season split into parts.', true],
  ['special-episodes', 'Special episodes', 'Special one-off episodes.', true],
  ['holiday-specials', 'Holiday specials', 'Holiday special episodes.', true],
  ['recap-episodes', 'Recap episodes', 'Recap/compilation episodes.', true],
  ['behind-the-scenes', 'Behind-the-scenes episodes', 'Behind-the-scenes content.', true],
  ['reunion-episodes', 'Reunion episodes', 'Reunion episodes.', true],
  ['finale-episodes', 'Finale episodes', 'Season/series finale episodes.', true],
  ['bonus-episodes', 'Bonus episodes', 'Bonus material.', true],
]);

const LARGE_CINEMATIC = types('large-cinematic', [
  ['film-franchise', 'Film franchise', 'A connected franchise of films.', true],
  ['cinematic-universe', 'Cinematic universe', 'A shared universe of connected productions.', true],
  ['multi-film-saga', 'Multi-film saga', 'A saga across several films.', true],
  ['trilogy', 'Trilogy', 'A three-film story.', true],
  ['multi-part-epic', 'Multi-part epic', 'A large multi-part epic.', true],
  ['animated-film-franchise', 'Animated film franchise', 'An animated franchise.', true],
  ['shared-universe', 'Shared fictional universe', 'A shared fictional universe.', true],
  ['anthology-universe', 'Anthology universe', 'An anthology of connected stories.', true],
  ['historical-saga', 'Historical saga', 'A historical saga.', true],
  ['fantasy-saga', 'Fantasy saga', 'A fantasy saga.', true],
  ['science-fiction-saga', 'Science-fiction saga', 'A science-fiction saga.', true],
  ['documentary-franchise', 'Documentary franchise', 'A documentary franchise.', true],
  ['educational-franchise', 'Educational franchise', 'An educational franchise.', true],
]);

const STRUCTURED_OTHER = types('structured-other', [
  ['vertical-short-series', 'Vertical short-video series', 'A vertical-format short series.', true],
  ['social-media-series', 'Social-media episode series', 'A social-media episode series.', true],
  ['episodic-tutorials', 'Episodic tutorials', 'A tutorial series.', true],
  ['course-video-series', 'Course video series', 'A structured course series.', true],
  ['research-documentary-collection', 'Research documentary collection', 'A research documentary collection.', true],
  ['interactive-narrative', 'Interactive narrative', 'An interactive narrative (where supported).', true],
  ['branching-story', 'Branching story', 'A branching story (where supported).', true],
  ['multi-language-adaptation', 'Multi-language adaptation', 'A multi-language adaptation.', true],
  ['dubbed-version', 'Dubbed version', 'A dubbed version.'],
  ['remastered-edition', 'Remastered edition', 'A remastered edition.'],
  ['extended-edition', 'Extended edition', 'An extended edition.'],
  ['alternate-cut', 'Alternate cut', 'An alternate cut.'],
  ['spin-off', 'Spin-off', 'A spin-off production.', true],
  ['prequel', 'Prequel', 'A prequel production.', true],
  ['sequel', 'Sequel', 'A sequel production.', true],
  ['reboot', 'Reboot', 'A reboot production.', true],
  ['companion-series', 'Companion series', 'A companion series.', true],
]);

export const VIDEO_TYPES: VideoTypeDef[] = [
  ...STANDALONE,
  ...EPISODIC,
  ...SEASON_BASED,
  ...LARGE_CINEMATIC,
  ...STRUCTURED_OTHER,
];

const TYPE_BY_ID = new Map(VIDEO_TYPES.map((t) => [t.id, t]));

export function getVideoTypeById(id: string | undefined): VideoTypeDef | undefined {
  return id ? TYPE_BY_ID.get(id) : undefined;
}

export function videoTypeCategoryLabel(id: VideoTypeCategoryId): string {
  return VIDEO_TYPE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** The default type for the individual-video flow. */
export const DEFAULT_VIDEO_TYPE = 'single-video';

/* ==========================================================================
   2. Duration model — 0.1s .. 1,000h+ as a requested range
   ========================================================================== */

/** Fractional-second presets plus large-production presets (see spec §10). */
export interface DurationPreset {
  label: string;
  seconds: number;
  hint: string;
}

export const DURATION_PRESETS: DurationPreset[] = [
  { label: '0.1s', seconds: 0.1, hint: 'Sub-second micro-clip' },
  { label: '5s', seconds: 5, hint: 'Very short clip' },
  { label: '15s', seconds: 15, hint: 'Short social clip' },
  { label: '30s', seconds: 30, hint: 'Advert / teaser length' },
  { label: '90s', seconds: 90, hint: 'Short-form piece' },
  { label: '10 min', seconds: 600, hint: 'Short film range' },
  { label: '45 min', seconds: 2700, hint: 'Typical episode length' },
  { label: '2 h', seconds: 7200, hint: 'Feature-film length' },
  { label: '24 h', seconds: 86400, hint: 'Very long form' },
  { label: '100 h', seconds: 360000, hint: 'Large production' },
  { label: '1,000 h', seconds: 3600000, hint: 'Franchise-scale aggregate runtime' },
];

/** Largest requested duration the UI will accept without clamping. */
export const MAX_REQUESTED_SECONDS = 1_000_000 * 3600; // 1,000,000 hours

export interface ParsedDuration {
  seconds: number;
  /** The matched unit, for display. */
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
  /** The raw number the user typed. */
  value: number;
}

const UNIT_SECONDS: Record<string, number> = {
  ms: 0.001,
  millisecond: 0.001,
  milliseconds: 0.001,
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
};

function unitToCanonical(unit: string): ParsedDuration['unit'] {
  if (unit.startsWith('d')) return 'days';
  if (unit.startsWith('h')) return 'hours';
  if (unit.startsWith('m') && unit !== 'ms' && !unit.startsWith('mill')) return 'minutes';
  return 'seconds';
}

/**
 * Parse a human duration string. Accepts `90`, `90s`, `1.5 hours`, `2h 30m`,
 * `45 minutes`, `0.1 seconds`, `3 days`. Returns `null` when nothing parseable
 * is present. A bare number is interpreted as seconds.
 */
export function parseDuration(input: string): ParsedDuration | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  // Compound forms such as "2h 30m" / "1 hour 15 minutes" / "1000-hour".
  const compound = /(\d+(?:\.\d+)?)\s*-?\s*(milliseconds?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d)\b/g;
  const parts = [...text.matchAll(compound)];
  if (parts.length > 0) {
    let total = 0;
    for (const part of parts) {
      const value = parseFloat(part[1]);
      const factor = UNIT_SECONDS[part[2]] ?? 1;
      if (Number.isFinite(value)) total += value * factor;
    }
    if (total > 0) {
      const first = parts[0];
      return { seconds: total, unit: unitToCanonical(first[2]), value: parseFloat(first[1]) };
    }
  }

  // Bare number → seconds.
  const bare = text.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) {
    const value = parseFloat(bare[1]);
    if (value > 0) return { seconds: value, unit: 'seconds', value };
  }
  return null;
}

/** Human-readable duration from seconds (e.g. `2 h 30 min`, `45 min`, `0.1 s`). */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0 s';
  if (totalSeconds < 1) return `${round(totalSeconds, 2)} s`;

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const chunks: string[] = [];
  if (days > 0) chunks.push(`${days.toLocaleString()} d`);
  if (hours > 0) chunks.push(`${hours} h`);
  if (minutes > 0 && days === 0) chunks.push(`${minutes} min`);
  if (seconds > 0 && hours === 0 && days === 0 && minutes === 0) {
    chunks.push(`${round(seconds, 1)} s`);
  }
  if (chunks.length === 0) chunks.push(`${round(totalSeconds, 1)} s`);
  return chunks.slice(0, 2).join(' ');
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/* ==========================================================================
   3. Prompt intelligence — what is the user actually asking for?
   ========================================================================== */
export type VideoIntentKind =
  | 'single-clip'
  | 'long-continuous'
  | 'feature-film'
  | 'episodic-series'
  | 'multi-season-series'
  | 'franchise'
  | 'continuation'
  | 'ambiguous';

export interface VideoIntent {
  kind: VideoIntentKind;
  /** Short, human-readable explanation of the interpretation. */
  summary: string;
  /** Duration parsed from the prompt, when present. */
  requestedDuration?: ParsedDuration;
  /** Season count detected in the prompt, when present. */
  seasons?: number;
  /** Episodes-per-season count detected, when present. */
  episodesPerSeason?: number;
  /** True when the request needs a decision from the user before proceeding. */
  needsDecision: boolean;
  /** Sensible default suggestion to offer when a decision is needed. */
  suggestion?: string;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, hundred: 100, thousand: 1000,
};

function toNumber(token: string | undefined): number | undefined {
  if (!token) return undefined;
  const lower = token.toLowerCase();
  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower];
  const n = parseInt(lower.replace(/[,_]/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Read a natural-language video request and report which production structure
 * the user means. This never silently decides an ambiguous case: when a request
 * could be a continuous video or a structured production, it returns
 * `ambiguous` with a suggestion and `needsDecision: true`.
 */
export function classifyVideoIntent(prompt: string): VideoIntent {
  const text = prompt.toLowerCase();
  const duration = parseDuration(text);

  // Season / episode counts.
  const seasonsMatch = text.match(/(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty)\s+seasons?/);
  const episodesMatch = text.match(
    /(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty)\s+episodes?/
  );
  const seasons = toNumber(seasonsMatch?.[1]);
  const episodesPerSeason = toNumber(episodesMatch?.[1]);

  const seriesWords = /\b(series|season|seasons|episodes?|episodic|show|sitcom|anthology|miniseries)\b/.test(text);
  const franchiseWords = /\b(franchise|cinematic universe|shared universe|saga|trilogy|multi-film)\b/.test(text);
  const continuationWords = /\b(continuing|continue|sequel to|next season|season\s*2\b|season two|pick up)\b/.test(text);
  const filmWords = /\b(film|movie|feature|cinema)\b/.test(text);

  if (continuationWords && seriesWords) {
    return {
      kind: 'continuation',
      summary: 'Continues an existing production, reusing its established bible, characters and canon.',
      requestedDuration: duration ?? undefined,
      seasons,
      episodesPerSeason,
      needsDecision: false,
    };
  }

  if (franchiseWords) {
    return {
      kind: 'franchise',
      summary: 'A franchise / universe of connected series and films, managed as one production.',
      requestedDuration: duration ?? undefined,
      seasons,
      episodesPerSeason,
      needsDecision: false,
    };
  }

  if (seriesWords) {
    if (seasons !== undefined && seasons > 1) {
      return {
        kind: 'multi-season-series',
        summary: `A series with ${seasons} season${seasons === 1 ? '' : 's'}${
          episodesPerSeason ? ` × ${episodesPerSeason} episodes` : ''
        }, managed as a structured production.`,
        requestedDuration: duration ?? undefined,
        seasons,
        episodesPerSeason,
        needsDecision: false,
      };
    }
    return {
      kind: 'episodic-series',
      summary: 'An episodic series organised into episodes.',
      requestedDuration: duration ?? undefined,
      seasons,
      episodesPerSeason,
      needsDecision: false,
    };
  }

  // A very long duration without any episodic language is genuinely ambiguous:
  // it could be one enormous continuous video or a structured production.
  const isVeryLong = duration !== null && duration.seconds >= 6 * 3600;
  if (isVeryLong) {
    return {
      kind: 'ambiguous',
      summary: 'A very long runtime that could be one continuous video or a structured production.',
      requestedDuration: duration ?? undefined,
      needsDecision: true,
      suggestion:
        'Most engines cannot render one continuous file of this length. A structured production (seasons and episodes) is the practical default; a single continuous video is validated against the provider limit.',
    };
  }

  if (filmWords) {
    return {
      kind: 'feature-film',
      summary: 'A single film production, broken into scenes and shots as the engine requires.',
      requestedDuration: duration ?? undefined,
      needsDecision: false,
    };
  }

  const isLongContinuous = duration !== null && duration.seconds >= 10 * 60;
  return {
    kind: isLongContinuous ? 'long-continuous' : 'single-clip',
    summary: isLongContinuous
      ? 'One long continuous video, validated against the selected engine\'s real clip limit.'
      : 'A single video clip.',
    requestedDuration: duration ?? undefined,
    needsDecision: false,
  };
}
