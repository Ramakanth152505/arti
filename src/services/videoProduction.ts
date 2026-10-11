/**
 * ARTI AI — Videos production store.
 *
 * The single source of truth for video productions: standalone videos, series
 * (seasons → episodes → scenes → shots) and franchises (multiple connected
 * series/films). Persistence is browser localStorage
 * (`arti_video_productions`), the repository's only storage layer — nothing is
 * sent to a server and no server-side history is implied.
 *
 * The hierarchy is exactly the one the product requires:
 *
 *   Franchise / Universe → Series → Season → Episode → Scene → Shot → Job → Asset
 *
 * Regenerating one shot never touches the rest of a season: every node is
 * addressed by its own stable id. Statuses and the production overview are
 * computed from the real persisted records — no completion percentage is ever
 * fabricated.
 */
import { useSyncExternalStore } from 'react';
import { formatDuration } from './videoTypes';

const STORAGE_KEY = 'arti_video_productions';

/* ==========================================================================
   Node types
   ========================================================================== */
export type ProductionKind = 'standalone' | 'series' | 'franchise';

export type SceneStatus = 'draft' | 'planned' | 'ready' | 'generating' | 'generated' | 'failed' | 'blocked';
export type ShotStatus = SceneStatus;
export type EpisodeStatus =
  | 'planned'
  | 'outline'
  | 'script'
  | 'storyboard'
  | 'generating'
  | 'generated'
  | 'assembled'
  | 'exported'
  | 'failed'
  | 'blocked';

/** Genuine job states — never a timer pretending generation is occurring. */
export type JobState =
  | 'draft'
  | 'planned'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'blocked'
  | 'awaiting-approval';

export interface ShotVersion {
  id: string;
  url: string;
  createdAt: string;
  note?: string;
  width?: number;
  height?: number;
}

export interface Shot {
  id: string;
  number: number;
  prompt: string;
  durationSeconds: number;
  cameraMovement: string;
  status: ShotStatus;
  /** Generated versions, newest first. The first is the current take. */
  versions: ShotVersion[];
  /** Reference to the job that last produced a version, when known. */
  lastJobId?: string;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  synopsis: string;
  prompt: string;
  durationSeconds: number;
  lighting: string;
  status: SceneStatus;
  shots: Shot[];
}

export interface MediaAsset {
  id: string;
  kind: 'video' | 'poster';
  url: string;
  width: number;
  height: number;
  durationSeconds: number;
  format: string;
  createdAt: string;
  origin: string;
  /** Traceable ownership: which episode/scene/shot produced it. */
  episodeId?: string;
  sceneId?: string;
  shotId?: string;
}

export interface GenerationJob {
  id: string;
  /** What the job targets, so a failed job is retried in isolation. */
  target: { type: 'shot' | 'scene' | 'episode'; id: string };
  state: JobState;
  prompt: string;
  requested: { durationSeconds: number; resolution: string; aspectRatio: string; fps: number };
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  outputAssetIds: string[];
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  synopsis: string;
  script: string;
  beats: string[];
  status: EpisodeStatus;
  durationTargetSeconds: number;
  scenes: Scene[];
  jobs: GenerationJob[];
  assets: MediaAsset[];
  captions: string;
  versionNote: string;
}

export interface Season {
  id: string;
  number: number;
  title: string;
  description: string;
  arc: string;
  visualDirection: string;
  episodes: Episode[];
  archived: boolean;
  milestones: string[];
}

export interface Character {
  id: string;
  name: string;
  aliases: string;
  description: string;
  ageRange: string;
  appearance: string;
  personality: string;
  voice: string;
  relationships: string;
  history: string;
}

export interface CanonFact {
  id: string;
  text: string;
  approved: boolean;
  createdAt: string;
}

export interface ContinuityRecord {
  id: string;
  kind: 'character' | 'prop' | 'location' | 'costume' | 'timeline' | 'knowledge' | 'other';
  text: string;
  resolved: boolean;
  createdAt: string;
}

export interface SeriesBible {
  characters: Character[];
  locations: string;
  worldRules: string;
  timeline: string;
  factions: string;
  props: string;
  technology: string;
  palette: string;
  cinematography: string;
  music: string;
  terminology: string;
  canonFacts: CanonFact[];
  openThreads: string[];
  resolvedThreads: string[];
  approvedChanges: string[];
}

export interface Production {
  id: string;
  kind: ProductionKind;
  title: string;
  logline: string;
  genre: string;
  styleId?: string;
  audience: string;
  language: string;
  storyFormat: 'episodic' | 'serialized' | 'anthology' | 'hybrid';
  /** Franchise parent, when this production is one series inside a universe. */
  parentId?: string;
  /** Standalone single-video configuration. */
  singleVideo?: {
    prompt: string;
    durationSeconds: number;
    resolution: string;
    aspectRatio: string;
    fps: number;
    status: EpisodeStatus;
    assets: MediaAsset[];
    jobs: GenerationJob[];
  };
  bible: SeriesBible;
  seasons: Season[];
  continuity: ContinuityRecord[];
  /** Linked video conversations (chat ids) for the production. */
  chatIds: string[];
  targetResolution: string;
  aspectRatio: string;
  episodeDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

/* ==========================================================================
   Factories
   ========================================================================== */
function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function emptyBible(): SeriesBible {
  return {
    characters: [],
    locations: '',
    worldRules: '',
    timeline: '',
    factions: '',
    props: '',
    technology: '',
    palette: '',
    cinematography: '',
    music: '',
    terminology: '',
    canonFacts: [],
    openThreads: [],
    resolvedThreads: [],
    approvedChanges: [],
  };
}

export function createShot(number: number, partial: Partial<Shot> = {}): Shot {
  return {
    id: uid('shot'),
    number,
    prompt: partial.prompt ?? '',
    durationSeconds: partial.durationSeconds ?? 6,
    cameraMovement: partial.cameraMovement ?? 'Static',
    status: partial.status ?? 'draft',
    versions: partial.versions ?? [],
  };
}

export function createScene(number: number, partial: Partial<Scene> = {}): Scene {
  return {
    id: uid('scene'),
    number,
    title: partial.title ?? `Scene ${number}`,
    synopsis: partial.synopsis ?? '',
    prompt: partial.prompt ?? '',
    durationSeconds: partial.durationSeconds ?? 30,
    lighting: partial.lighting ?? '',
    status: partial.status ?? 'draft',
    shots: partial.shots ?? [createShot(1)],
  };
}

export function createEpisode(number: number, partial: Partial<Episode> = {}): Episode {
  return {
    id: uid('ep'),
    number,
    title: partial.title ?? `Episode ${number}`,
    synopsis: partial.synopsis ?? '',
    script: partial.script ?? '',
    beats: partial.beats ?? [],
    status: partial.status ?? 'planned',
    durationTargetSeconds: partial.durationTargetSeconds ?? 2700,
    scenes: partial.scenes ?? [],
    jobs: partial.jobs ?? [],
    assets: partial.assets ?? [],
    captions: partial.captions ?? '',
    versionNote: partial.versionNote ?? '',
  };
}

export function createSeason(number: number, partial: Partial<Season> = {}): Season {
  return {
    id: uid('season'),
    number,
    title: partial.title ?? `Season ${number}`,
    description: partial.description ?? '',
    arc: partial.arc ?? '',
    visualDirection: partial.visualDirection ?? '',
    episodes: partial.episodes ?? [],
    archived: partial.archived ?? false,
    milestones: partial.milestones ?? [],
  };
}

/* ==========================================================================
   Overview aggregation — real numbers only
   ========================================================================== */
export interface ProductionOverview {
  series: number;
  seasons: number;
  plannedEpisodes: number;
  completedEpisodes: number;
  episodesInProgress: number;
  failedTasks: number;
  missingScenes: number;
  continuityWarnings: number;
  queuedJobs: number;
  readyToExport: number;
  totalPlannedSeconds: number;
  totalPlannedRuntime: string;
}

function isComplete(status: EpisodeStatus): boolean {
  return status === 'assembled' || status === 'exported';
}

function isInProgress(status: EpisodeStatus): boolean {
  return status === 'outline' || status === 'script' || status === 'storyboard' || status === 'generating' || status === 'generated';
}

function isFailed(status: EpisodeStatus): boolean {
  return status === 'failed' || status === 'blocked';
}

/** Compute the at-a-glance dashboard for one production from its real records. */
export function productionOverview(p: Production): ProductionOverview {
  let seasons = 0;
  let plannedEpisodes = 0;
  let completedEpisodes = 0;
  let episodesInProgress = 0;
  let failedTasks = 0;
  let missingScenes = 0;
  let queuedJobs = 0;
  let readyToExport = 0;
  let totalPlannedSeconds = 0;

  for (const season of p.seasons) {
    if (!season.archived) seasons += 1;
    for (const ep of season.episodes) {
      plannedEpisodes += 1;
      totalPlannedSeconds += ep.durationTargetSeconds;
      if (isComplete(ep.status)) completedEpisodes += 1;
      if (isInProgress(ep.status)) episodesInProgress += 1;
      if (isFailed(ep.status)) failedTasks += 1;
      if (ep.status === 'generated' || ep.status === 'assembled') readyToExport += 1;
      if (ep.scenes.length === 0) missingScenes += 1;
      for (const job of ep.jobs) {
        if (job.state === 'queued' || job.state === 'planned') queuedJobs += 1;
        if (job.state === 'failed') failedTasks += 1;
      }
    }
  }

  if (p.kind === 'standalone' && p.singleVideo) {
    plannedEpisodes = 1;
    totalPlannedSeconds = p.singleVideo.durationSeconds;
    if (p.singleVideo.status === 'generated') completedEpisodes = 1;
    for (const job of p.singleVideo.jobs) {
      if (job.state === 'failed') failedTasks += 1;
      if (job.state === 'queued') queuedJobs += 1;
    }
  }

  return {
    series: 1,
    seasons,
    plannedEpisodes,
    completedEpisodes,
    episodesInProgress,
    failedTasks,
    missingScenes,
    continuityWarnings: p.continuity.filter((c) => !c.resolved).length,
    queuedJobs,
    readyToExport,
    totalPlannedSeconds,
    totalPlannedRuntime: formatDuration(totalPlannedSeconds),
  };
}

/** Build a flat season/episode manifest for a large production (paginated in the UI). */
export interface ManifestRow {
  seasonId: string;
  seasonNumber: number;
  seasonTitle: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  status: EpisodeStatus;
  durationSeconds: number;
  scenes: number;
  shots: number;
}

export function buildManifest(p: Production): ManifestRow[] {
  const rows: ManifestRow[] = [];
  for (const season of p.seasons) {
    for (const ep of season.episodes) {
      rows.push({
        seasonId: season.id,
        seasonNumber: season.number,
        seasonTitle: season.title,
        episodeId: ep.id,
        episodeNumber: ep.number,
        episodeTitle: ep.title,
        status: ep.status,
        durationSeconds: ep.durationTargetSeconds,
        scenes: ep.scenes.length,
        shots: ep.scenes.reduce((n, s) => n + s.shots.length, 0),
      });
    }
  }
  return rows;
}

/* ==========================================================================
   Store
   ========================================================================== */
interface StoreState {
  productions: Production[];
  activeId: string;
}

function readStored(): Production[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return (parsed as Production[]).map((p) => ({
      ...p,
      seasons: Array.isArray(p.seasons) ? p.seasons : [],
      continuity: Array.isArray(p.continuity) ? p.continuity : [],
      chatIds: Array.isArray(p.chatIds) ? p.chatIds : [],
      bible: { ...emptyBible(), ...(p.bible ?? {}) },
    }));
  } catch {
    return null;
  }
}

class VideoProductionStore {
  private state: StoreState;
  private listeners = new Set<() => void>();

  constructor() {
    const stored = readStored();
    this.state = stored && stored.length > 0
      ? { productions: stored, activeId: stored[0].id }
      : { productions: [], activeId: '' };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.productions));
    } catch {
      // Storage may be unavailable; the in-memory session still works.
    }
  }

  private setState(next: Partial<StoreState>) {
    this.state = { ...this.state, ...next };
    this.persist();
    this.emit();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): StoreState => this.state;

  getProduction(id: string): Production | undefined {
    return this.state.productions.find((p) => p.id === id);
  }

  setActive(id: string) {
    if (this.state.activeId === id) return;
    this.setState({ activeId: id });
  }

  private patch(id: string, updater: (p: Production) => Production) {
    this.setState({
      productions: this.state.productions.map((p) =>
        p.id === id ? { ...updater(p), updatedAt: new Date().toISOString() } : p
      ),
    });
  }

  /** Create a production of any kind. Returns the record. */
  createProduction(input: {
    kind: ProductionKind;
    title: string;
    logline?: string;
    genre?: string;
    styleId?: string;
    audience?: string;
    language?: string;
    storyFormat?: Production['storyFormat'];
    parentId?: string;
    targetResolution?: string;
    aspectRatio?: string;
    episodeDurationSeconds?: number;
    singleVideo?: Partial<NonNullable<Production['singleVideo']>>;
  }): Production {
    const now = new Date().toISOString();
    const production: Production = {
      id: uid('prod'),
      kind: input.kind,
      title: input.title.trim() || 'Untitled Production',
      logline: input.logline?.trim() ?? '',
      genre: input.genre?.trim() ?? '',
      styleId: input.styleId,
      audience: input.audience?.trim() ?? '',
      language: input.language?.trim() || 'English',
      storyFormat: input.storyFormat ?? 'serialized',
      parentId: input.parentId,
      singleVideo: input.kind === 'standalone'
        ? {
            prompt: input.singleVideo?.prompt ?? '',
            durationSeconds: input.singleVideo?.durationSeconds ?? 15,
            resolution: input.singleVideo?.resolution ?? '1080p',
            aspectRatio: input.singleVideo?.aspectRatio ?? '16:9',
            fps: input.singleVideo?.fps ?? 24,
            status: input.singleVideo?.status ?? 'planned',
            assets: input.singleVideo?.assets ?? [],
            jobs: input.singleVideo?.jobs ?? [],
          }
        : undefined,
      bible: emptyBible(),
      seasons: [],
      continuity: [],
      chatIds: [],
      targetResolution: input.targetResolution ?? '1080p',
      aspectRatio: input.aspectRatio ?? '16:9',
      episodeDurationSeconds: input.episodeDurationSeconds ?? 2700,
      createdAt: now,
      updatedAt: now,
    };
    this.setState({ productions: [production, ...this.state.productions], activeId: production.id });
    return production;
  }

  updateProduction(id: string, patch: Partial<Omit<Production, 'id' | 'createdAt'>>) {
    this.patch(id, (p) => ({ ...p, ...patch }));
  }

  deleteProduction(id: string) {
    const remaining = this.state.productions.filter((p) => p.id !== id);
    // Detach children so a franchise delete never orphans a series silently.
    const cleaned = remaining.map((p) => (p.parentId === id ? { ...p, parentId: undefined } : p));
    this.setState({
      productions: cleaned,
      activeId: this.state.activeId === id ? cleaned[0]?.id ?? '' : this.state.activeId,
    });
  }

  linkChat(productionId: string, chatId: string) {
    this.patch(productionId, (p) =>
      p.chatIds.includes(chatId) ? p : { ...p, chatIds: [...p.chatIds, chatId] }
    );
  }

  unlinkChat(productionId: string, chatId: string) {
    this.patch(productionId, (p) => ({ ...p, chatIds: p.chatIds.filter((c) => c !== chatId) }));
  }

  /* ---- Seasons --------------------------------------------------------- */
  addSeason(productionId: string, partial: Partial<Season> = {}): Season | undefined {
    const p = this.getProduction(productionId);
    if (!p) return undefined;
    const number = partial.number ?? (p.seasons.reduce((m, s) => Math.max(m, s.number), 0) + 1);
    const season = createSeason(number, partial);
    this.patch(productionId, (prod) => ({ ...prod, seasons: [...prod.seasons, season] }));
    return season;
  }

  /** Duplicate a season's structure (episode/scene/shot skeleton, no assets). */
  duplicateSeason(productionId: string, seasonId: string): Season | undefined {
    const p = this.getProduction(productionId);
    const source = p?.seasons.find((s) => s.id === seasonId);
    if (!p || !source) return undefined;
    const number = p.seasons.reduce((m, s) => Math.max(m, s.number), 0) + 1;
    const clone: Season = {
      ...createSeason(number, {
        title: `${source.title} (copy)`,
        description: source.description,
        arc: source.arc,
        visualDirection: source.visualDirection,
      }),
      episodes: source.episodes.map((ep, i) => ({
        ...createEpisode(i + 1, { title: ep.title, synopsis: ep.synopsis, durationTargetSeconds: ep.durationTargetSeconds }),
        scenes: ep.scenes.map((sc, si) => ({
          ...createScene(si + 1, { title: sc.title, synopsis: sc.synopsis, prompt: sc.prompt, durationSeconds: sc.durationSeconds, lighting: sc.lighting }),
          shots: sc.shots.map((sh, hi) => createShot(hi + 1, { prompt: sh.prompt, durationSeconds: sh.durationSeconds, cameraMovement: sh.cameraMovement })),
        })),
      })),
    };
    this.patch(productionId, (prod) => ({ ...prod, seasons: [...prod.seasons, clone] }));
    return clone;
  }

  updateSeason(productionId: string, seasonId: string, patch: Partial<Season>) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.map((s) => (s.id === seasonId ? { ...s, ...patch } : s)),
    }));
  }

  removeSeason(productionId: string, seasonId: string) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.filter((s) => s.id !== seasonId),
    }));
  }

  moveSeason(productionId: string, seasonId: string, direction: -1 | 1) {
    this.patch(productionId, (p) => {
      const idx = p.seasons.findIndex((s) => s.id === seasonId);
      const swap = idx + direction;
      if (idx < 0 || swap < 0 || swap >= p.seasons.length) return p;
      const seasons = [...p.seasons];
      [seasons[idx], seasons[swap]] = [seasons[swap], seasons[idx]];
      return { ...p, seasons };
    });
  }

  /* ---- Episodes -------------------------------------------------------- */
  addEpisode(productionId: string, seasonId: string, partial: Partial<Episode> = {}): Episode | undefined {
    const p = this.getProduction(productionId);
    const season = p?.seasons.find((s) => s.id === seasonId);
    if (!p || !season) return undefined;
    const number = partial.number ?? (season.episodes.reduce((m, e) => Math.max(m, e.number), 0) + 1);
    const episode = createEpisode(number, {
      durationTargetSeconds: partial.durationTargetSeconds ?? p.episodeDurationSeconds,
      ...partial,
    });
    this.patch(productionId, (prod) => ({
      ...prod,
      seasons: prod.seasons.map((s) =>
        s.id === seasonId ? { ...s, episodes: [...s.episodes, episode] } : s
      ),
    }));
    return episode;
  }

  duplicateEpisode(productionId: string, seasonId: string, episodeId: string): Episode | undefined {
    const p = this.getProduction(productionId);
    const season = p?.seasons.find((s) => s.id === seasonId);
    const source = season?.episodes.find((e) => e.id === episodeId);
    if (!p || !season || !source) return undefined;
    const number = season.episodes.reduce((m, e) => Math.max(m, e.number), 0) + 1;
    const clone: Episode = {
      ...createEpisode(number, {
        title: `${source.title} (alternate)`,
        synopsis: source.synopsis,
        script: source.script,
        beats: [...source.beats],
        durationTargetSeconds: source.durationTargetSeconds,
        versionNote: 'Alternate version',
      }),
      scenes: source.scenes.map((sc, si) => ({
        ...createScene(si + 1, { title: sc.title, synopsis: sc.synopsis, prompt: sc.prompt, durationSeconds: sc.durationSeconds, lighting: sc.lighting }),
        shots: sc.shots.map((sh, hi) => createShot(hi + 1, { prompt: sh.prompt, durationSeconds: sh.durationSeconds, cameraMovement: sh.cameraMovement })),
      })),
    };
    this.patch(productionId, (prod) => ({
      ...prod,
      seasons: prod.seasons.map((s) =>
        s.id === seasonId ? { ...s, episodes: [...s.episodes, clone] } : s
      ),
    }));
    return clone;
  }

  updateEpisode(productionId: string, seasonId: string, episodeId: string, patch: Partial<Episode>) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.map((s) =>
        s.id === seasonId
          ? { ...s, episodes: s.episodes.map((e) => (e.id === episodeId ? { ...e, ...patch } : e)) }
          : s
      ),
    }));
  }

  removeEpisode(productionId: string, seasonId: string, episodeId: string) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.map((s) =>
        s.id === seasonId ? { ...s, episodes: s.episodes.filter((e) => e.id !== episodeId) } : s
      ),
    }));
  }

  moveEpisode(productionId: string, seasonId: string, episodeId: string, direction: -1 | 1) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.map((s) => {
        if (s.id !== seasonId) return s;
        const idx = s.episodes.findIndex((e) => e.id === episodeId);
        const swap = idx + direction;
        if (idx < 0 || swap < 0 || swap >= s.episodes.length) return s;
        const episodes = [...s.episodes];
        [episodes[idx], episodes[swap]] = [episodes[swap], episodes[idx]];
        return { ...s, episodes };
      }),
    }));
  }

  /* ---- Scenes ---------------------------------------------------------- */
  addScene(productionId: string, seasonId: string, episodeId: string, partial: Partial<Scene> = {}): Scene | undefined {
    const p = this.getProduction(productionId);
    const ep = p?.seasons.find((s) => s.id === seasonId)?.episodes.find((e) => e.id === episodeId);
    if (!p || !ep) return undefined;
    const number = partial.number ?? (ep.scenes.reduce((m, s) => Math.max(m, s.number), 0) + 1);
    const scene = createScene(number, partial);
    this.patchEpisode(productionId, seasonId, episodeId, (e) => ({ ...e, scenes: [...e.scenes, scene] }));
    return scene;
  }

  updateScene(productionId: string, seasonId: string, episodeId: string, sceneId: string, patch: Partial<Scene>) {
    this.patchEpisode(productionId, seasonId, episodeId, (e) => ({
      ...e,
      scenes: e.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
    }));
  }

  removeScene(productionId: string, seasonId: string, episodeId: string, sceneId: string) {
    this.patchEpisode(productionId, seasonId, episodeId, (e) => ({
      ...e,
      scenes: e.scenes.filter((s) => s.id !== sceneId),
    }));
  }

  /* ---- Shots ----------------------------------------------------------- */
  addShot(productionId: string, seasonId: string, episodeId: string, sceneId: string, partial: Partial<Shot> = {}): Shot | undefined {
    const scene = this.getScene(productionId, seasonId, episodeId, sceneId);
    if (!scene) return undefined;
    const number = partial.number ?? (scene.shots.reduce((m, s) => Math.max(m, s.number), 0) + 1);
    const shot = createShot(number, partial);
    this.patchScene(productionId, seasonId, episodeId, sceneId, (s) => ({ ...s, shots: [...s.shots, shot] }));
    return shot;
  }

  updateShot(productionId: string, seasonId: string, episodeId: string, sceneId: string, shotId: string, patch: Partial<Shot>) {
    this.patchScene(productionId, seasonId, episodeId, sceneId, (s) => ({
      ...s,
      shots: s.shots.map((sh) => (sh.id === shotId ? { ...sh, ...patch } : sh)),
    }));
  }

  removeShot(productionId: string, seasonId: string, episodeId: string, sceneId: string, shotId: string) {
    this.patchScene(productionId, seasonId, episodeId, sceneId, (s) => ({
      ...s,
      shots: s.shots.filter((sh) => sh.id !== shotId),
    }));
  }

  /** Add a generated version to one shot and keep the previous takes. */
  addShotVersion(
    productionId: string,
    seasonId: string,
    episodeId: string,
    sceneId: string,
    shotId: string,
    version: ShotVersion
  ) {
    this.patchScene(productionId, seasonId, episodeId, sceneId, (s) => ({
      ...s,
      shots: s.shots.map((sh) =>
        sh.id === shotId
          ? { ...sh, status: 'generated', versions: [version, ...sh.versions] }
          : sh
      ),
    }));
  }

  /* ---- Jobs ------------------------------------------------------------ */
  addJob(productionId: string, seasonId: string | undefined, episodeId: string | undefined, job: GenerationJob) {
    if (episodeId && seasonId) {
      this.patchEpisode(productionId, seasonId, episodeId, (e) => ({ ...e, jobs: [job, ...e.jobs] }));
    } else {
      this.patch(productionId, (p) =>
        p.singleVideo
          ? { ...p, singleVideo: { ...p.singleVideo, jobs: [job, ...p.singleVideo.jobs] } }
          : p
      );
    }
  }

  /** Update one job's state without touching sibling jobs or assets. */
  setJobState(
    productionId: string,
    seasonId: string | undefined,
    episodeId: string | undefined,
    jobId: string,
    patch: Partial<GenerationJob>
  ) {
    const updater = (jobs: GenerationJob[]) =>
      jobs.map((j) => (j.id === jobId ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j));
    if (episodeId && seasonId) {
      this.patchEpisode(productionId, seasonId, episodeId, (e) => ({ ...e, jobs: updater(e.jobs) }));
    } else {
      this.patch(productionId, (p) =>
        p.singleVideo ? { ...p, singleVideo: { ...p.singleVideo, jobs: updater(p.singleVideo.jobs) } } : p
      );
    }
  }

  /* ---- Assets ---------------------------------------------------------- */
  addAsset(
    productionId: string,
    seasonId: string | undefined,
    episodeId: string | undefined,
    asset: MediaAsset
  ) {
    if (episodeId && seasonId) {
      this.patchEpisode(productionId, seasonId, episodeId, (e) => ({ ...e, assets: [asset, ...e.assets] }));
    } else {
      this.patch(productionId, (p) =>
        p.singleVideo ? { ...p, singleVideo: { ...p.singleVideo, assets: [asset, ...p.singleVideo.assets] } } : p
      );
    }
  }

  /* ---- Bible & continuity --------------------------------------------- */
  addCharacter(productionId: string, partial: Partial<Character> = {}): Character {
    const character: Character = {
      id: uid('char'),
      name: partial.name ?? 'New Character',
      aliases: partial.aliases ?? '',
      description: partial.description ?? '',
      ageRange: partial.ageRange ?? '',
      appearance: partial.appearance ?? '',
      personality: partial.personality ?? '',
      voice: partial.voice ?? '',
      relationships: partial.relationships ?? '',
      history: partial.history ?? '',
    };
    this.patch(productionId, (p) => ({
      ...p,
      bible: { ...p.bible, characters: [...p.bible.characters, character] },
    }));
    return character;
  }

  updateCharacter(productionId: string, characterId: string, patch: Partial<Character>) {
    this.patch(productionId, (p) => ({
      ...p,
      bible: {
        ...p.bible,
        characters: p.bible.characters.map((c) => (c.id === characterId ? { ...c, ...patch } : c)),
      },
    }));
  }

  removeCharacter(productionId: string, characterId: string) {
    this.patch(productionId, (p) => ({
      ...p,
      bible: { ...p.bible, characters: p.bible.characters.filter((c) => c.id !== characterId) },
    }));
  }

  updateBible(productionId: string, patch: Partial<SeriesBible>) {
    this.patch(productionId, (p) => ({ ...p, bible: { ...p.bible, ...patch } }));
  }

  addCanonFact(productionId: string, text: string, approved = false): CanonFact | undefined {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    const fact: CanonFact = { id: uid('fact'), text: trimmed, approved, createdAt: new Date().toISOString() };
    this.patch(productionId, (p) => ({
      ...p,
      bible: { ...p.bible, canonFacts: [...p.bible.canonFacts, fact] },
    }));
    return fact;
  }

  setCanonApproved(productionId: string, factId: string, approved: boolean) {
    this.patch(productionId, (p) => ({
      ...p,
      bible: {
        ...p.bible,
        canonFacts: p.bible.canonFacts.map((f) => (f.id === factId ? { ...f, approved } : f)),
      },
    }));
  }

  removeCanonFact(productionId: string, factId: string) {
    this.patch(productionId, (p) => ({
      ...p,
      bible: { ...p.bible, canonFacts: p.bible.canonFacts.filter((f) => f.id !== factId) },
    }));
  }

  addContinuity(productionId: string, kind: ContinuityRecord['kind'], text: string): ContinuityRecord | undefined {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    const record: ContinuityRecord = {
      id: uid('cont'),
      kind,
      text: trimmed,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    this.patch(productionId, (p) => ({ ...p, continuity: [record, ...p.continuity] }));
    return record;
  }

  setContinuityResolved(productionId: string, recordId: string, resolved: boolean) {
    this.patch(productionId, (p) => ({
      ...p,
      continuity: p.continuity.map((c) => (c.id === recordId ? { ...c, resolved } : c)),
    }));
  }

  removeContinuity(productionId: string, recordId: string) {
    this.patch(productionId, (p) => ({
      ...p,
      continuity: p.continuity.filter((c) => c.id !== recordId),
    }));
  }

  /* ---- Lookups & helpers ---------------------------------------------- */
  getSeason(productionId: string, seasonId: string): Season | undefined {
    return this.getProduction(productionId)?.seasons.find((s) => s.id === seasonId);
  }

  getEpisode(productionId: string, seasonId: string, episodeId: string): Episode | undefined {
    return this.getSeason(productionId, seasonId)?.episodes.find((e) => e.id === episodeId);
  }

  getScene(productionId: string, seasonId: string, episodeId: string, sceneId: string): Scene | undefined {
    return this.getEpisode(productionId, seasonId, episodeId)?.scenes.find((s) => s.id === sceneId);
  }

  private patchEpisode(
    productionId: string,
    seasonId: string,
    episodeId: string,
    updater: (e: Episode) => Episode
  ) {
    this.patch(productionId, (p) => ({
      ...p,
      seasons: p.seasons.map((s) =>
        s.id === seasonId
          ? { ...s, episodes: s.episodes.map((e) => (e.id === episodeId ? updater(e) : e)) }
          : s
      ),
    }));
  }

  private patchScene(
    productionId: string,
    seasonId: string,
    episodeId: string,
    sceneId: string,
    updater: (s: Scene) => Scene
  ) {
    this.patchEpisode(productionId, seasonId, episodeId, (e) => ({
      ...e,
      scenes: e.scenes.map((s) => (s.id === sceneId ? updater(s) : s)),
    }));
  }
}

export const videoProductionStore = new VideoProductionStore();

export function useVideoProductions(): StoreState {
  return useSyncExternalStore(
    videoProductionStore.subscribe,
    videoProductionStore.getState,
    videoProductionStore.getState
  );
}

/** Every generated media asset across a production (for the library view). */
export function collectProductionAssets(p: Production): MediaAsset[] {
  const out: MediaAsset[] = [];
  if (p.singleVideo) out.push(...p.singleVideo.assets);
  for (const season of p.seasons) {
    for (const ep of season.episodes) out.push(...ep.assets);
  }
  return out;
}
