/**
 * ARTI AI — shared conversation store.
 *
 * A single observable store backs both the Chats workspace and the dedicated
 * conversation workspace, so a conversation opened from Home is the same
 * object the Chats list shows, and messages never leak between conversations.
 *
 * Persistence is localStorage (`arti_ws_chats`), the repository's only storage
 * layer. Nothing is sent to a server; the store never claims server-side
 * history. Demonstration conversations are never persisted and are clearly
 * labelled by the UI until the owner creates a real one.
 */
import { useSyncExternalStore } from 'react';
import { sendChatCompletion, type ChatTurn } from '../services/aiService';
import { activityStore } from '../services/activityStore';

export type MessageSender = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'sending' | 'failed';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  status: MessageStatus;
  /** Present on a failed assistant turn so the UI can explain the real error. */
  error?: string;
  retryable?: boolean;
}

export type DateGroup = 'today' | 'yesterday' | 'previous7' | 'older';

/**
 * Which workspace owns a conversation. `general` is the default (Chats,
 * dedicated conversation workspace and Home prompts); `images` marks a
 * conversation created by the Images workspace. Projects and Games keep using
 * `projectId`, which is orthogonal to this flag.
 */
export type WorkspaceKind = 'general' | 'images' | 'videos' | 'music';

/** A single image returned by a real provider. The URL is the provider's own
 * temporary output URL (or a data URL); ARTI never copies it to its own
 * storage. */
export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  /** The provider's rewritten prompt, when it exposes one. */
  revisedPrompt?: string;
}

/** The provider-facing generation settings captured for one request. */
export interface ImageGenerationSettings {
  providerId: string;
  model: string;
  /** UI aspect-ratio value (e.g. `16:9`). */
  aspectRatio: string;
  /** Provider size token actually sent (e.g. `1024x1024`). */
  size: string;
  quality: string;
  count: number;
  seed: string;
  negativePrompt: string;
  transparentBackground: boolean;
  /** 0–100. Only applied when the provider/model supports it. */
  styleStrength: number;
}

/** One completed (or failed) generation, kept in the conversation history. */
export interface ImageResultRecord {
  id: string;
  createdAt: string;
  /** The final prepared prompt actually sent to the provider. */
  preparedPrompt: string;
  /** The user's original prompt, preserved verbatim. */
  originalPrompt: string;
  styleId?: string;
  styleName?: string;
  /** Answers the user gave in the clarification step. */
  clarifications: Record<string, string>;
  settings: ImageGenerationSettings;
  images: GeneratedImage[];
  status: 'complete' | 'failed';
  error?: string;
  /** Native resolution the provider returned. */
  nativeResolution?: string;
  /** Set only when a real, separate upscale step produced a larger asset. */
  upscaledTo?: string;
}

/** Images-workspace metadata carried on a conversation (`workspace: 'images'`). */
export interface ImageConversationMeta {
  styleId?: string;
  settings: Partial<ImageGenerationSettings>;
  results: ImageResultRecord[];
  /** True while a real provider request is in flight for this conversation. */
  pendingGeneration: boolean;
}

/* ==========================================================================
   Videos-workspace types. The Videos workspace owns conversations tagged
   `workspace: 'videos'`, grouped into production-type categories. A video chat
   may be linked to a production (a series/franchise/standalone record) so the
   chat and the production hierarchy never diverge.
   ========================================================================== */

export type VideoChatCategoryId =
  | 'standalone'
  | 'short-films'
  | 'feature-films'
  | 'tv-web-series'
  | 'animated-series'
  | 'anime-series'
  | 'documentary-series'
  | 'multi-season-series'
  | 'cinematic-universes'
  | 'trailers-teasers'
  | 'educational-series'
  | 'social-media-series'
  | 'other';

export interface VideoChatCategory {
  id: VideoChatCategoryId;
  label: string;
}

export const VIDEO_CHAT_CATEGORIES: VideoChatCategory[] = [
  { id: 'standalone', label: 'Standalone Videos' },
  { id: 'short-films', label: 'Short Films' },
  { id: 'feature-films', label: 'Feature Films' },
  { id: 'tv-web-series', label: 'TV / Web Series' },
  { id: 'animated-series', label: 'Animated Series' },
  { id: 'anime-series', label: 'Anime Series' },
  { id: 'documentary-series', label: 'Documentary Series' },
  { id: 'multi-season-series', label: 'Multi-Season Series' },
  { id: 'cinematic-universes', label: 'Cinematic Universes' },
  { id: 'trailers-teasers', label: 'Trailers & Teasers' },
  { id: 'educational-series', label: 'Educational Series' },
  { id: 'social-media-series', label: 'Social-Media Video Series' },
  { id: 'other', label: 'Other Custom Types' },
];

export function videoChatCategoryLabel(id: VideoChatCategoryId | undefined): string {
  return VIDEO_CHAT_CATEGORIES.find((c) => c.id === id)?.label ?? 'Other Custom Types';
}

/** The provider-facing settings captured for one video request. */
export interface VideoGenerationSettings {
  providerId: string;
  model: string;
  /** Video *type* id (independent of style). */
  videoType: string;
  aspectRatio: string;
  /** UI resolution token (`1080p`, `2160p`, `custom`). */
  resolution: string;
  customResolution: string;
  fps: number;
  /** Requested duration in seconds (fractional allowed). */
  durationSeconds: number;
  cameraMovement: string;
  lighting: string;
  colorGrade: string;
  motion: string;
  audio: string;
  narration: string;
  music: string;
  language: string;
  subtitles: boolean;
  negativePrompt: string;
  seed: string;
  intendedPlatform: string;
}

/** One completed (or failed) generation, kept in the conversation history. */
export interface VideoResultRecord {
  id: string;
  createdAt: string;
  preparedPrompt: string;
  originalPrompt: string;
  styleId?: string;
  styleName?: string;
  settings: VideoGenerationSettings;
  videos: GeneratedVideoRecord[];
  status: 'complete' | 'failed' | 'blocked';
  error?: string;
  /** What the engine actually produced, when it differed from the request. */
  effectiveNote?: string;
}

export interface GeneratedVideoRecord {
  id: string;
  url: string;
  width: number;
  height: number;
  durationSeconds: number;
  format: string;
  poster?: string;
  upscaledFrom?: string;
}

/** Videos-workspace metadata carried on a conversation (`workspace: 'videos'`). */
export interface VideoConversationMeta {
  category: VideoChatCategoryId;
  /** The video *type* selected for this conversation. */
  videoType: string;
  styleId?: string;
  /** The exact style guidance inserted into the composer, so it can be removed. */
  styleGuidance?: string;
  settings: Partial<VideoGenerationSettings>;
  results: VideoResultRecord[];
  /** True while a real provider request is in flight for this conversation. */
  pendingGeneration: boolean;
  /** Linked production (series/franchise/standalone) record id, when any. */
  productionId?: string;
}

/* ==========================================================================
   Music-workspace types. The Music Studio owns conversations tagged
   `workspace: 'music'`, carrying the creation mode, lyrics, the extracted
   settings, the generated track records and their transformation history. A
   track is only ever `complete` when a real, playable audio asset was received;
   otherwise it is `blocked` with the honest reason.
   ========================================================================== */

export type TrackStatus = 'complete' | 'blocked' | 'failed';

export type TrackProvenance =
  | 'ai-vocals-and-music'
  | 'ai-instrumental'
  | 'user-audio'
  | 'processed-from-ai'
  | 'licensed-external';

/** One generated (or processed) track. Audio is never fabricated. */
export interface GeneratedTrackRecord {
  id: string;
  createdAt: string;
  title: string;
  /** Creation mode id (`MusicModeId`). */
  mode: string;
  providerId: string;
  model: string;
  originalPrompt: string;
  preparedPrompt: string;
  lyrics?: string;
  language: string;
  genre: string;
  instrumental: boolean;
  vocalType?: string;
  durationSeconds: number;
  format: string;
  /** Set only when a real, playable asset exists. */
  audioUrl?: string;
  provenance: TrackProvenance;
  favorite: boolean;
  status: TrackStatus;
  error?: string;
  /** The source track when this is a variation/transformation. */
  sourceTrackId?: string;
  /** How a tempo transform was realized, when applicable. */
  transformMethod?: string;
  /** The transform id applied, when applicable. */
  transformId?: string;
  /** Honest note about what a transformation actually did. */
  transformNote?: string;
}

export interface MusicConversationMeta {
  mode: string;
  language: string;
  genre: string;
  vocalType: string;
  lyrics: string;
  /** The extracted settings shown for review before generation. */
  settings: Record<string, string>;
  results: GeneratedTrackRecord[];
  pendingGeneration: boolean;
  /** Stage of the in-flight generation, for the in-component indicator. */
  pendingStage?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  isPinned: boolean;
  dateGroup: DateGroup;
  updatedAt: string;
  model: string;
  messages: ChatMessage[];
  /** Owning project id when this conversation belongs to a project workspace. */
  projectId?: string;
  /** Owning workspace kind; absent means `general`. */
  workspace?: WorkspaceKind;
  /** Images-only metadata (style, settings, results). */
  imageMeta?: ImageConversationMeta;
  /** Videos-only metadata (category, type, style, settings, results). */
  videoMeta?: VideoConversationMeta;
  /** Music-only metadata (mode, lyrics, settings, track records). */
  musicMeta?: MusicConversationMeta;
  /** Production-type category for a video chat (mirrors `videoMeta.category`). */
  category?: VideoChatCategoryId;
  /** Archived chats stay stored and can be restored; they are hidden from the list. */
  archived?: boolean;
}

const STORAGE_KEY = 'arti_ws_chats';

const DEMO_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-1',
    title: 'Universal AI Operating Architecture',
    isPinned: true,
    dateGroup: 'today',
    updatedAt: '10:45 AM',
    model: 'ARTI Engine (Standby)',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'How should ARTI AI structure its autonomous agent orchestration and task execution engine?',
        timestamp: '10:45 AM',
        status: 'complete',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        content:
          'ARTI AI is architected with a decoupled 3-tier foundation:\n1. Universal Workspace Shell & Graphical Canvas (User Interface)\n2. Task Control Center & Dependency Planner (Deterministic Orchestration)\n3. Model Execution & Verification Engine (Specialist Agents with Proof of Work)\n\nNote: Live AI inference requires connecting a provider in Settings > Connected Services.',
        timestamp: '10:45 AM',
        status: 'complete',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'High-Fidelity Cinema Pipeline Specs',
    isPinned: false,
    dateGroup: 'yesterday',
    updatedAt: 'Yesterday',
    model: 'ARTI Visual Orchestrator',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        content: 'Review the scene consistency requirements for multi-scene video generation.',
        timestamp: 'Yesterday',
        status: 'complete',
      },
      {
        id: 'msg-4',
        sender: 'assistant',
        content:
          'Scene continuity requires anchor latent embeddings, character identity seed locks, and camera trajectory interpolation across adjacent generation segments.',
        timestamp: 'Yesterday',
        status: 'complete',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Where Is My Data Stored?',
    isPinned: false,
    dateGroup: 'previous7',
    updatedAt: '3 days ago',
    model: 'ARTI Engine (Standby)',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        content: 'Where does ARTI store my conversations?',
        timestamp: '3 days ago',
        status: 'complete',
      },
      {
        id: 'msg-6',
        sender: 'assistant',
        content:
          'In this build, records you create are saved to your browser\u2019s localStorage on this device. They persist across reloads in this browser only. No encryption layer is applied and nothing is sent to a server.',
        timestamp: '3 days ago',
        status: 'complete',
      },
    ],
  },
];

interface StoreState {
  conversations: ChatConversation[];
  activeId: string;
  isDemo: boolean;
  /** Conversations with an assistant request currently in flight. */
  pendingIds: string[];
}

function readStored(): ChatConversation[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Older persisted records may predate `status`; default them to complete.
    return (parsed as ChatConversation[]).map((c) => ({
      ...c,
      messages: (c.messages || []).map((m) => ({ ...m, status: m.status || 'complete' })),
      archived: Boolean(c.archived),
    }));
  } catch {
    return null;
  }
}

function initialState(): StoreState {
  const stored = readStored();
  if (stored) {
    return { conversations: stored, activeId: stored[0]?.id ?? '', isDemo: false, pendingIds: [] };
  }
  return {
    conversations: DEMO_CONVERSATIONS,
    activeId: DEMO_CONVERSATIONS[0]?.id ?? '',
    isDemo: DEMO_CONVERSATIONS.length > 0,
    pendingIds: [],
  };
}

class ChatStore {
  private state: StoreState = initialState();
  private listeners = new Set<() => void>();
  private pendingControllers = new Map<string, AbortController>();

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private persist() {
    if (typeof window === 'undefined' || this.state.isDemo) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.conversations));
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

  getConversation(id: string): ChatConversation | undefined {
    return this.state.conversations.find((c) => c.id === id);
  }

  setActive(id: string) {
    if (this.state.activeId === id) return;
    this.setState({ activeId: id });
  }

  createConversation(projectId?: string): ChatConversation {
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: 'New Conversation',
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Engine',
      messages: [],
      projectId,
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    return conv;
  }

  /** Conversations that belong to a given project, newest first. */
  getProjectConversations(projectId: string): ChatConversation[] {
    return this.state.conversations.filter((c) => c.projectId === projectId);
  }

  /**
   * Conversations owned by a non-project workspace kind (e.g. `images`).
   * Project- and game-scoped conversations are excluded so the Images list can
   * never surface a project/game chat.
   */
  getWorkspaceConversations(kind: WorkspaceKind): ChatConversation[] {
    return this.state.conversations.filter((c) => !c.projectId && (c.workspace ?? 'general') === kind);
  }

  /**
   * Create a real conversation owned by a workspace kind. Used by Images so its
   * chats are tagged and never mixed with general Chats or project/game chats.
   */
  createWorkspaceConversation(
    kind: WorkspaceKind,
    title = 'New Image Conversation',
    imageMeta?: ImageConversationMeta
  ): ChatConversation {
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title,
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Image Studio',
      messages: [],
      workspace: kind,
      imageMeta,
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    return conv;
  }

  /** Patch the Images metadata for one conversation, creating it if absent. */
  patchImageMeta(id: string, patch: Partial<ImageConversationMeta>) {
    this.replaceConversation(id, (c) => {
      const base: ImageConversationMeta = c.imageMeta ?? {
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      return { ...c, imageMeta: { ...base, ...patch }, updatedAt: 'Just now' };
    });
  }

  /** Append a completed/failed image result to a conversation's history. */
  addImageResult(id: string, result: ImageResultRecord) {
    this.replaceConversation(id, (c) => {
      const base: ImageConversationMeta = c.imageMeta ?? {
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      return {
        ...c,
        imageMeta: { ...base, results: [result, ...base.results] },
        updatedAt: 'Just now',
      };
    });
  }

  /** Remove one image result from a conversation (does not touch the parent). */
  removeImageResult(id: string, resultId: string) {
    this.replaceConversation(id, (c) => {
      if (!c.imageMeta) return c;
      return {
        ...c,
        imageMeta: {
          ...c.imageMeta,
          results: c.imageMeta.results.filter((r) => r.id !== resultId),
        },
      };
    });
  }

  /* ======================================================================
     Videos workspace. Video conversations are tagged `workspace: 'videos'`,
     carry a production-type `category` and a `videoMeta` blob, and may be
     linked to a production record. They never appear in Chats, Images,
     Projects or Games, and vice versa.
     ====================================================================== */

  /** Video conversations only, newest first. */
  getVideoConversations(): ChatConversation[] {
    return this.state.conversations.filter((c) => !c.projectId && c.workspace === 'videos');
  }

  /**
   * Create a real video conversation owned by the Videos workspace, tagged with
   * its production-type category and an optional linked production id.
   */
  createVideoConversation(
    category: VideoChatCategoryId,
    title = 'New Video Conversation',
    videoMeta?: VideoConversationMeta,
    productionId?: string
  ): ChatConversation {
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title,
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Video Studio',
      messages: [],
      workspace: 'videos',
      category,
      videoMeta: videoMeta
        ? { ...videoMeta, category, productionId: productionId ?? videoMeta.productionId }
        : undefined,
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    return conv;
  }

  /** Patch the Videos metadata for one conversation, creating it if absent. */
  patchVideoMeta(id: string, patch: Partial<VideoConversationMeta>) {
    this.replaceConversation(id, (c) => {
      const base: VideoConversationMeta = c.videoMeta ?? {
        category: c.category ?? 'standalone',
        videoType: 'single-video',
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      const next: VideoConversationMeta = { ...base, ...patch };
      return {
        ...c,
        videoMeta: next,
        category: next.category,
        updatedAt: 'Just now',
      };
    });
  }

  /** Append a completed/failed video result to a conversation's history. */
  addVideoResult(id: string, result: VideoResultRecord) {
    this.replaceConversation(id, (c) => {
      const base: VideoConversationMeta = c.videoMeta ?? {
        category: c.category ?? 'standalone',
        videoType: 'single-video',
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      return {
        ...c,
        videoMeta: { ...base, results: [result, ...base.results] },
        updatedAt: 'Just now',
      };
    });
  }

  /** Remove one video result from a conversation (does not touch the parent). */
  removeVideoResult(id: string, resultId: string) {
    this.replaceConversation(id, (c) => {
      if (!c.videoMeta) return c;
      return {
        ...c,
        videoMeta: {
          ...c.videoMeta,
          results: c.videoMeta.results.filter((r) => r.id !== resultId),
        },
      };
    });
  }

  /* ======================================================================
     Music Studio. Music conversations are tagged `workspace: 'music'`, carry a
     `musicMeta` blob and never appear in Chats, Images, Videos, Projects or
     Games — and vice versa.
     ====================================================================== */

  /** Music conversations only, newest first. */
  getMusicConversations(): ChatConversation[] {
    return this.state.conversations.filter((c) => !c.projectId && c.workspace === 'music');
  }

  /** Create a real music conversation owned by the Music Studio. */
  createMusicConversation(
    title = 'New Music Conversation',
    musicMeta?: MusicConversationMeta
  ): ChatConversation {
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title,
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Music Studio',
      messages: [],
      workspace: 'music',
      musicMeta,
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    return conv;
  }

  /** Patch the Music metadata for one conversation, creating it if absent. */
  patchMusicMeta(id: string, patch: Partial<MusicConversationMeta>) {
    this.replaceConversation(id, (c) => {
      const base: MusicConversationMeta = c.musicMeta ?? {
        mode: 'full-song-vocals',
        language: 'en',
        genre: '',
        vocalType: 'female',
        lyrics: '',
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      return { ...c, musicMeta: { ...base, ...patch }, updatedAt: 'Just now' };
    });
  }

  /** Append a generated/failed/blocked track record to a conversation. */
  addMusicResult(id: string, result: GeneratedTrackRecord) {
    this.replaceConversation(id, (c) => {
      const base: MusicConversationMeta = c.musicMeta ?? {
        mode: 'full-song-vocals',
        language: 'en',
        genre: '',
        vocalType: 'female',
        lyrics: '',
        settings: {},
        results: [],
        pendingGeneration: false,
      };
      return {
        ...c,
        musicMeta: { ...base, results: [result, ...base.results] },
        updatedAt: 'Just now',
      };
    });
  }

  /** Patch a single stored track record (rename, favorite, etc.). */
  updateMusicResult(conversationId: string, resultId: string, patch: Partial<GeneratedTrackRecord>) {
    this.replaceConversation(conversationId, (c) => {
      if (!c.musicMeta) return c;
      return {
        ...c,
        musicMeta: {
          ...c.musicMeta,
          results: c.musicMeta.results.map((r) => (r.id === resultId ? { ...r, ...patch } : r)),
        },
      };
    });
  }

  /** Remove one track record from a conversation (does not touch the parent). */
  removeMusicResult(id: string, resultId: string) {
    this.replaceConversation(id, (c) => {
      if (!c.musicMeta) return c;
      return {
        ...c,
        musicMeta: {
          ...c.musicMeta,
          results: c.musicMeta.results.filter((r) => r.id !== resultId),
        },
      };
    });
  }

  /** Archive a conversation: kept in storage, hidden from the active list. */
  setArchived(id: string, archived: boolean) {
    this.replaceConversation(id, (c) => ({ ...c, archived }));
  }

  /** Drop demonstration content and start from an empty real collection. */
  clearDemo() {
    this.setState({ conversations: [], activeId: '', isDemo: false });
  }

  /**
   * Start a new real conversation from a Home prompt and immediately request
   * the assistant reply. Returns the new conversation id so the caller can put
   * it in the URL.
   */
  startFromPrompt(prompt: string): string {
    const text = prompt.trim();
    const conv: ChatConversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: text.slice(0, 40) || 'New Conversation',
      isPinned: false,
      dateGroup: 'today',
      updatedAt: 'Just now',
      model: 'ARTI Engine',
      messages: [],
    };
    this.setState({
      conversations: [conv, ...this.state.conversations],
      activeId: conv.id,
      isDemo: false,
    });
    if (text) void this.sendMessage(conv.id, text);
    return conv.id;
  }

  private replaceConversation(id: string, updater: (c: ChatConversation) => ChatConversation) {
    this.setState({
      conversations: this.state.conversations.map((c) => (c.id === id ? updater(c) : c)),
    });
  }

  private now(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Append a user turn without requesting a language-model reply. Used by the
   * Images workspace, where the "reply" is a real image generation rather than
   * a text completion. The title is set from the first turn.
   */
  appendUserMessage(conversationId: string, rawText: string, fallbackTitle?: string) {
    const text = rawText.trim();
    if (!text) return;
    const existing = this.getConversation(conversationId);
    if (!existing) return;
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      title:
        c.title === 'New Conversation' || c.title === 'New Image Conversation'
          ? (fallbackTitle ?? text).slice(0, 40)
          : c.title,
      updatedAt: 'Just now',
      messages: [
        ...c.messages,
        {
          id: 'msg_' + Date.now() + '_u',
          sender: 'user',
          content: text,
          timestamp: this.now(),
          status: 'complete',
        },
      ],
    }));
  }

  /** Append a plain assistant turn (no provider call). */
  appendAssistantMessage(conversationId: string, content: string) {
    if (!content.trim()) return;
    const existing = this.getConversation(conversationId);
    if (!existing) return;
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      updatedAt: 'Just now',
      messages: [
        ...c.messages,
        {
          id: 'msg_' + Date.now() + '_a',
          sender: 'assistant',
          content,
          timestamp: this.now(),
          status: 'complete',
        },
      ],
    }));
  }

  /**
   * Append a user message and request the real assistant reply. The user turn
   * is committed immediately and kept even if the request fails.
   */
  async sendMessage(conversationId: string, rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    const existing = this.getConversation(conversationId);
    if (!existing) return;
    // Guard against overlapping sends for the same conversation.
    if (this.pendingControllers.has(conversationId)) return;

    const stamp = this.now();
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_u',
      sender: 'user',
      content: text,
      timestamp: stamp,
      status: 'complete',
    };

    this.replaceConversation(conversationId, (c) => ({
      ...c,
      title: c.title === 'New Conversation' ? text.slice(0, 40) : c.title,
      updatedAt: 'Just now',
      messages: [...c.messages, userMsg],
    }));

    await this.requestReply(conversationId);
  }

  /**
   * (Re)request the assistant reply for the latest user turn. Used both for the
   * first send and for an explicit retry after a failure.
   */
  async requestReply(conversationId: string) {
    const conv = this.getConversation(conversationId);
    if (!conv || this.pendingControllers.has(conversationId)) return;

    // Build the context from completed turns only (drop failed placeholders).
    const turns: ChatTurn[] = conv.messages
      .filter((m) => m.status !== 'failed')
      .map((m) => ({ role: m.sender, content: m.content }));
    if (turns.length === 0) return;

    const controller = new AbortController();
    this.pendingControllers.set(conversationId, controller);
    this.setState({ pendingIds: [...this.pendingControllers.keys()] });

    // Publish the real request into the shared activity store so the execution
    // timeline and the AI core reflect genuine in-flight work. The provider
    // cannot report fractional progress, so progress stays `null` (rendered as
    // indeterminate) rather than a fabricated percentage.
    const activityId = activityStore.begin('chat', `Language model · ${conv.title}`);

    // Show a pending assistant placeholder so the UI has a real "waiting" state.
    const pendingId = 'msg_' + Date.now() + '_a';
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      messages: [
        ...c.messages.filter((m) => m.status !== 'failed'),
        { id: pendingId, sender: 'assistant', content: '', timestamp: this.now(), status: 'sending' },
      ],
    }));

    try {
      const reply = await sendChatCompletion(turns, controller.signal);
      this.replaceConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === pendingId ? { ...m, content: reply, status: 'complete' } : m
        ),
      }));
      activityStore.settle(activityId, 'complete');
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (aborted) {
        // A stop was requested; remove the placeholder without an error state.
        this.replaceConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== pendingId),
        }));
        activityStore.settle(activityId, 'cancelled', 'Stopped by the operator.');
      } else {
        const message = err instanceof Error ? err.message : 'The AI request failed.';
        const retryable = (err as { retryable?: boolean }).retryable !== false;
        this.replaceConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === pendingId
              ? { ...m, content: message, status: 'failed', error: message, retryable }
              : m
          ),
        }));
        const notConfigured = (err as { code?: string }).code === 'not-configured';
        activityStore.settle(activityId, notConfigured ? 'blocked' : 'failed', message);
      }
    } finally {
      this.pendingControllers.delete(conversationId);
      this.setState({ pendingIds: [...this.pendingControllers.keys()] });
    }
  }

  /** Abort an in-flight request for a conversation (the Stop control). */
  stop(conversationId: string) {
    this.pendingControllers.get(conversationId)?.abort();
  }

  isPending(conversationId: string): boolean {
    return this.pendingControllers.has(conversationId);
  }

  /**
   * Retry a failed assistant turn: drop the failed placeholder and request the
   * reply again from the completed history.
   */
  async retry(conversationId: string) {
    const conv = this.getConversation(conversationId);
    if (!conv) return;
    this.replaceConversation(conversationId, (c) => ({
      ...c,
      messages: c.messages.filter((m) => m.status !== 'failed'),
    }));
    await this.requestReply(conversationId);
  }

  togglePin(id: string) {
    this.replaceConversation(id, (c) => ({ ...c, isPinned: !c.isPinned }));
  }

  rename(id: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.replaceConversation(id, (c) => ({ ...c, title: trimmed }));
  }

  archive(id: string) {
    const remaining = this.state.conversations.filter((c) => c.id !== id);
    const activeId = this.state.activeId === id ? remaining[0]?.id ?? '' : this.state.activeId;
    this.setState({ conversations: remaining, activeId });
  }

  /**
   * Permanently delete a single conversation. Targets exactly one id, so it can
   * never remove a sibling chat or the parent project. Aborts an in-flight
   * request for that conversation first.
   */
  deleteConversation(id: string): void {
    if (!this.state.conversations.some((c) => c.id === id)) return;
    this.pendingControllers.get(id)?.abort();
    this.pendingControllers.delete(id);
    const remaining = this.state.conversations.filter((c) => c.id !== id);
    const activeId = this.state.activeId === id ? remaining[0]?.id ?? '' : this.state.activeId;
    this.setState({
      conversations: remaining,
      activeId,
      pendingIds: [...this.pendingControllers.keys()],
    });
  }

  /** Delete every conversation belonging to a project (used when a project is removed). */
  deleteProjectConversations(projectId: string): void {
    const remaining = this.state.conversations.filter((c) => c.projectId !== projectId);
    const activeStillExists = remaining.some((c) => c.id === this.state.activeId);
    this.setState({
      conversations: remaining,
      activeId: activeStillExists ? this.state.activeId : remaining[0]?.id ?? '',
    });
  }
}

export const chatStore = new ChatStore();

/** React binding: re-renders subscribers when the store changes. */
export function useChatStore(): StoreState {
  return useSyncExternalStore(chatStore.subscribe, chatStore.getState, chatStore.getState);
}

export { DEMO_CONVERSATIONS };
