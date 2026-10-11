import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Plus,
  MessageSquare,
  X,
  Video as VideoIcon,
  Film,
  Layers,
  History,
  Palette,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Clapperboard,
  Search,
  Pencil,
  Archive,
  ArchiveRestore,
  Pin,
  PinOff,
  Trash2,
  Library,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import { Dialog } from '../../common/Dialog';
import {
  chatStore,
  useChatStore,
  VIDEO_CHAT_CATEGORIES,
  videoChatCategoryLabel,
  type ChatConversation,
  type VideoChatCategoryId,
  type VideoGenerationSettings,
  type VideoResultRecord,
} from '../../../services/chatStore';
import {
  isVideoProviderConfigured,
  validateContinuousDuration,
  BRIDGE_CAPABILITY,
} from '../../../services/videoProvider';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_FPS,
  DEFAULT_RESOLUTION,
  insertStyleIntoPrompt,
  removeStyleFromPrompt,
} from '../../../services/videoPrompt';
import { getVideoStyleById, type VideoStyle } from '../../../services/videoStyles';
import {
  classifyVideoIntent,
  DEFAULT_VIDEO_TYPE,
  getVideoTypeById,
  formatDuration,
  type VideoTypeDef,
} from '../../../services/videoTypes';
import {
  runVideoGeneration,
  previewPrompt,
  NOT_CONNECTED_MESSAGE,
  videoNoticeText,
} from '../../../services/videoGeneration';
import {
  useVideoProductions,
  videoProductionStore,
  type Production,
  type Scene,
  type Shot,
} from '../../../services/videoProduction';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';
import { useConversationFocus } from '../../../hooks/useConversationFocus';
import { VideoStylePicker } from '../../videos/VideoStylePicker';
import { VideoTypePicker } from '../../videos/VideoTypePicker';
import { VideoSettingsPanel } from '../../videos/VideoSettingsPanel';
import { VideoResultsGallery } from '../../videos/VideoResultsGallery';
import { VideoProviderStatus } from '../../videos/VideoProviderStatus';
import { SeriesCreationForm } from '../../videos/SeriesCreationForm';
import { ProductionWorkspaceView } from '../../videos/ProductionWorkspaceView';
import { VideoLibrary } from '../../videos/VideoLibrary';

const PANEL_PREF_KEY = 'arti_videos_chat_panel_open';

type WorkspaceTab = 'create-video' | 'create-series' | 'productions' | 'chats' | 'previous';

function loadPanelOpenPref(): boolean {
  try {
    return localStorage.getItem(PANEL_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

/** Default output settings: 1920×1080, 16:9 landscape (spec §11.1). */
function defaultSettings(): VideoGenerationSettings {
  return {
    providerId: 'custom-server',
    model: '',
    videoType: DEFAULT_VIDEO_TYPE,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    resolution: DEFAULT_RESOLUTION,
    customResolution: '',
    fps: DEFAULT_FPS,
    durationSeconds: 15,
    cameraMovement: 'Static',
    lighting: '',
    colorGrade: 'Neutral',
    motion: 'Natural',
    audio: 'Music + effects',
    narration: '',
    music: '',
    language: 'English',
    subtitles: false,
    negativePrompt: '',
    seed: '-1',
    intendedPlatform: '',
  };
}

function mergeSettings(stored: Partial<VideoGenerationSettings> | undefined): VideoGenerationSettings {
  return { ...defaultSettings(), ...stored };
}

/** The chat category implied by a video type. */
function categoryForType(type: VideoTypeDef | undefined): VideoChatCategoryId {
  if (!type) return 'standalone';
  switch (type.category) {
    case 'episodic':
      if (type.id === 'anime-series') return 'anime-series';
      if (type.id === 'animated-series') return 'animated-series';
      if (type.id === 'documentary-series') return 'documentary-series';
      if (type.id === 'educational-series') return 'educational-series';
      return 'tv-web-series';
    case 'season-based':
      return 'multi-season-series';
    case 'large-cinematic':
      return 'cinematic-universes';
    case 'structured-other':
      return type.id === 'social-media-series' || type.id === 'vertical-short-series'
        ? 'social-media-series'
        : 'other';
    default:
      if (type.id === 'short-film' || type.id === 'micro-film') return 'short-films';
      if (type.id === 'feature-film') return 'feature-films';
      if (type.id === 'trailer' || type.id === 'teaser') return 'trailers-teasers';
      return 'standalone';
  }
}

/**
 * Videos — the dedicated video-production workspace.
 *
 * Two connected creation modes live here and are never confused:
 *   - Individual Video Creation: one video with configurable duration, style,
 *     resolution, aspect ratio and settings.
 *   - Series & Cinematic Universe Creation: a production with seasons, episodes,
 *     scenes and shots, managed as one organised project.
 *
 * A real conversation surface with its own persistent, workspace-tagged history,
 * a data-driven style library, a separate video-type taxonomy, an honest
 * provider capability registry, and generation against a genuinely configured
 * bridge. Nothing is fabricated.
 */
export const VideosWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const chatState = useChatStore();
  const prodState = useVideoProductions();

  const [tab, setTab] = useState<WorkspaceTab>('create-video');
  const [input, setInput] = useState('');
  const [panelOpen, setPanelOpen] = useState<boolean>(loadPanelOpenPref);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [activeProductionId, setActiveProductionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ kind: string; prompt: string; summary: string } | null>(null);

  const genAbortRef = useRef<AbortController | null>(null);

  const conversations = useMemo(
    () => chatState.conversations.filter((c) => !c.projectId && c.workspace === 'videos'),
    [chatState.conversations]
  );
  const activeConv = conversations.find((c) => c.id === chatState.activeId);
  const settings = useMemo(() => mergeSettings(activeConv?.videoMeta?.settings), [activeConv]);
  const styleId = activeConv?.videoMeta?.styleId;
  const style = getVideoStyleById(styleId);
  const videoType = getVideoTypeById(activeConv?.videoMeta?.videoType ?? DEFAULT_VIDEO_TYPE);
  const results = activeConv?.videoMeta?.results ?? [];
  const isPending = activeConv?.videoMeta?.pendingGeneration ?? false;
  const connected = isVideoProviderConfigured();

  const hasConversation = (activeConv?.messages.length ?? 0) > 0 || results.length > 0 || isPending;
  const { chromeRevealed, toggleChrome, containerRef } = useConversationFocus(
    hasConversation && tab === 'create-video'
  );
  const focusActive = hasConversation && tab === 'create-video' && !chromeRevealed;

  const activeProduction = activeProductionId
    ? prodState.productions.find((p) => p.id === activeProductionId)
    : undefined;

  // Opening Videos restores one of its own conversations.
  useEffect(() => {
    const convs = chatStore.getVideoConversations();
    if (convs.length === 0) return;
    if (!convs.some((c) => c.id === chatState.activeId)) {
      chatStore.setActive(convs[0].id);
    }
  }, [chatState.activeId, chatState.conversations]);

  useEffect(
    () => () => {
      genAbortRef.current?.abort();
    },
    []
  );

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PANEL_PREF_KEY, next ? '1' : '0');
      } catch {
        /* Storage unavailable — the toggle still works for this session. */
      }
      return next;
    });
  };

  const ensureConversation = useCallback((): ChatConversation => {
    if (activeConv) return activeConv;
    const category = categoryForType(videoType);
    return chatStore.createVideoConversation(category, 'New Video Conversation', {
      category,
      videoType: settings.videoType,
      settings: defaultSettings(),
      results: [],
      pendingGeneration: false,
    });
  }, [activeConv, videoType, settings.videoType]);

  const handleNewChat = (category: VideoChatCategoryId = 'standalone') => {
    chatStore.createVideoConversation(category, 'New Video Conversation', {
      category,
      videoType: settings.videoType,
      settings: defaultSettings(),
      results: [],
      pendingGeneration: false,
    });
    setInput('');
    setTab('create-video');
    showToast('New video conversation started', { type: 'gold' });
  };

  /** Run a real generation for a prepared prompt. */
  const runGeneration = useCallback(
    async (conv: ChatConversation, originalPrompt: string, context?: string) => {
      if (isPending) return;
      const current = mergeSettings(chatStore.getConversation(conv.id)?.videoMeta?.settings);
      const convStyleId = chatStore.getConversation(conv.id)?.videoMeta?.styleId;

      if (!isVideoProviderConfigured()) {
        chatStore.appendAssistantMessage(conv.id, NOT_CONNECTED_MESSAGE);
        const record: VideoResultRecord = {
          id: 'vres_' + Date.now(),
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          preparedPrompt: previewPrompt({ originalPrompt, styleId: convStyleId, settings: current, context }),
          originalPrompt,
          styleId: convStyleId,
          styleName: getVideoStyleById(convStyleId)?.name,
          settings: current,
          videos: [],
          status: 'blocked',
          error: NOT_CONNECTED_MESSAGE,
        };
        chatStore.addVideoResult(conv.id, record);
        showToast('Video bridge not connected', { type: 'warning' });
        return;
      }

      const controller = new AbortController();
      genAbortRef.current = controller;
      chatStore.patchVideoMeta(conv.id, { pendingGeneration: true });

      try {
        const record = await runVideoGeneration(
          { originalPrompt, styleId: convStyleId, settings: current, context },
          controller.signal
        );
        chatStore.addVideoResult(conv.id, record);
        if (record.status === 'complete') {
          chatStore.appendAssistantMessage(
            conv.id,
            `Generated ${record.videos.length} clip${record.videos.length === 1 ? '' : 's'}. ` +
              (record.effectiveNote ? `${record.effectiveNote} ` : '') +
              'Download it to keep a copy on this device.'
          );
          showToast('Video generated', { type: 'success' });
        } else {
          showToast('Video generation failed', { type: 'error' });
        }
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        if (aborted) {
          chatStore.appendAssistantMessage(conv.id, 'Generation cancelled. No video was produced.');
          showToast('Generation cancelled', { type: 'info' });
        }
      } finally {
        chatStore.patchVideoMeta(conv.id, { pendingGeneration: false });
        genAbortRef.current = null;
      }
    },
    [isPending, showToast]
  );

  /** Submit from the composer: append the prompt, then classify or generate. */
  const handleSubmit = (value: string) => {
    const text = value.trim();
    if (!text) return;
    const conv = ensureConversation();
    chatStore.appendUserMessage(conv.id, text);
    setInput('');

    const intent = classifyVideoIntent(text);

    // A structured or ambiguous request must not silently become one clip.
    if (
      intent.kind === 'ambiguous' ||
      intent.kind === 'multi-season-series' ||
      intent.kind === 'episodic-series' ||
      intent.kind === 'franchise' ||
      intent.kind === 'continuation'
    ) {
      setDecision({ kind: intent.kind, prompt: text, summary: intent.summary });
      return;
    }

    void runGeneration(conv, text);
  };

  const handleStop = () => {
    genAbortRef.current?.abort();
  };

  const handleSelectStyle = (selected: VideoStyle) => {
    const conv = ensureConversation();
    chatStore.patchVideoMeta(conv.id, { styleId: selected.id, styleGuidance: selected.promptGuidance });
    setInput((prev) => insertStyleIntoPrompt(prev, selected.id));
    setStylePickerOpen(false);
    showToast(`${selected.name} style applied to this conversation`, { type: 'gold' });
  };

  const handleClearStyle = () => {
    if (!activeConv) return;
    const currentId = activeConv.videoMeta?.styleId;
    chatStore.patchVideoMeta(activeConv.id, { styleId: undefined, styleGuidance: undefined });
    setInput((prev) => removeStyleFromPrompt(prev, currentId));
    showToast('Style removed from this conversation', { type: 'info' });
  };

  const handleSelectType = (t: VideoTypeDef) => {
    const conv = ensureConversation();
    const category = categoryForType(t);
    chatStore.patchVideoMeta(conv.id, { videoType: t.id, category });
    setTypePickerOpen(false);
    if (t.structured) {
      showToast(`${t.name} is a structured production — create it in Series Studio`, { type: 'info' });
      setDecision({ kind: 'structured-type', prompt: '', summary: `${t.name} is organised as a structured production.` });
    } else {
      showToast(`Video type set to ${t.name}`, { type: 'gold' });
    }
  };

  const patchSettings = (patch: Partial<VideoGenerationSettings>) => {
    const conv = ensureConversation();
    const merged = { ...mergeSettings(chatStore.getConversation(conv.id)?.videoMeta?.settings), ...patch };
    chatStore.patchVideoMeta(conv.id, { settings: merged });
  };

  const handleDeleteChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    if (!window.confirm(`Delete conversation "${conv?.title ?? ''}"? This cannot be undone.`)) return;
    chatStore.deleteConversation(convId);
    showToast('Conversation deleted', { type: 'info' });
  };

  const handleRenameChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    const next = window.prompt('Rename conversation:', conv?.title);
    if (next && next.trim()) {
      chatStore.rename(convId, next);
      showToast('Conversation renamed', { type: 'success' });
    }
  };

  const handleArchiveChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    chatStore.setArchived(convId, !conv?.archived);
    showToast(conv?.archived ? 'Conversation restored' : 'Conversation archived', { type: 'info' });
  };

  const handleGenerateShot = useCallback(
    async (production: Production, seasonId: string, episodeId: string, scene: Scene, shot: Shot) => {
      const shotSettings: VideoGenerationSettings = {
        ...defaultSettings(),
        resolution: production.targetResolution,
        aspectRatio: production.aspectRatio,
        durationSeconds: shot.durationSeconds,
        cameraMovement: shot.cameraMovement,
      };
      const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const nowIso = new Date().toISOString();
      const prompt = [scene.prompt, shot.prompt].filter(Boolean).join(' — ') || `Shot ${shot.number}`;

      videoProductionStore.addJob(production.id, seasonId, episodeId, {
        id: jobId,
        target: { type: 'shot', id: shot.id },
        state: 'queued',
        prompt,
        requested: {
          durationSeconds: shot.durationSeconds,
          resolution: production.targetResolution,
          aspectRatio: production.aspectRatio,
          fps: shotSettings.fps,
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: nowIso,
        updatedAt: nowIso,
        outputAssetIds: [],
      });
      videoProductionStore.updateShot(production.id, seasonId, episodeId, scene.id, shot.id, {
        status: 'generating',
        lastJobId: jobId,
      });

      const controller = new AbortController();
      genAbortRef.current = controller;
      setBusy(true);
      try {
        const context = production.bible.canonFacts
          .filter((f) => f.approved)
          .slice(0, 5)
          .map((f) => f.text)
          .join('; ');
        const record = await runVideoGeneration(
          {
            originalPrompt: prompt,
            styleId: production.styleId,
            settings: shotSettings,
            context: context || undefined,
          },
          controller.signal
        );

        if (record.status === 'complete' && record.videos.length > 0) {
          const v = record.videos[0];
          const assetId = 'asset_' + Date.now();
          videoProductionStore.addShotVersion(production.id, seasonId, episodeId, scene.id, shot.id, {
            id: 'ver_' + Date.now(),
            url: v.url,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            width: v.width,
            height: v.height,
            note: record.effectiveNote,
          });
          videoProductionStore.addAsset(production.id, seasonId, episodeId, {
            id: assetId,
            kind: 'video',
            url: v.url,
            width: v.width,
            height: v.height,
            durationSeconds: v.durationSeconds,
            format: v.format,
            createdAt: nowIso,
            origin: 'generated',
            episodeId,
            sceneId: scene.id,
            shotId: shot.id,
          });
          videoProductionStore.setJobState(production.id, seasonId, episodeId, jobId, {
            state: 'completed',
            attempts: 1,
            outputAssetIds: [assetId],
          });
          showToast('Shot generated', { type: 'success' });
        } else {
          const blocked = record.status === 'blocked';
          videoProductionStore.updateShot(production.id, seasonId, episodeId, scene.id, shot.id, {
            status: blocked ? 'blocked' : 'failed',
          });
          videoProductionStore.setJobState(production.id, seasonId, episodeId, jobId, {
            state: blocked ? 'blocked' : 'failed',
            attempts: 1,
            error: record.error,
          });
          showToast(blocked ? 'No video bridge connected' : 'Shot generation failed', { type: blocked ? 'warning' : 'error' });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          videoProductionStore.setJobState(production.id, seasonId, episodeId, jobId, { state: 'cancelled' });
        }
      } finally {
        setBusy(false);
        genAbortRef.current = null;
      }
    },
    [showToast]
  );

  const handleCreatedSeries = (productionId: string, chatId: string) => {
    setActiveProductionId(productionId);
    setTab('productions');
    chatStore.setActive(chatId);
  };

  const filteredChats = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    return conversations.filter((c) => (q ? c.title.toLowerCase().includes(q) : true));
  }, [conversations, chatSearch]);

  const groupedChats = useMemo(
    () =>
      VIDEO_CHAT_CATEGORIES.map((cat) => ({
        cat,
        items: filteredChats.filter((c) => (c.category ?? c.videoMeta?.category ?? 'standalone') === cat.id),
      })).filter((g) => g.items.length > 0),
    [filteredChats]
  );

  const previewText = useMemo(
    () => previewPrompt({ originalPrompt: input || 'Your prompt…', styleId, settings }),
    [input, styleId, settings]
  );

  const allVideoResults = useMemo(
    () => conversations.flatMap((c) => (c.videoMeta?.results ?? []).filter((r) => r.videos.length > 0)),
    [conversations]
  );

  return (
    <div
      className={`project-workspace videos-workspace ${focusActive ? 'focus-active' : ''}`}
      ref={containerRef}
    >
      <header className="project-workspace-header videos-header">
        <div className="project-workspace-title-group">
          <h2 className="t-h3 project-workspace-title">Videos Studio</h2>
          <div className="project-workspace-meta">
            <span className="project-type-badge">Video Production</span>
            {style && (
              <span className="project-platform-badge images-style-badge" title="Style applied to this conversation">
                <Palette size={11} aria-hidden="true" /> {style.name}
              </span>
            )}
            {videoType && (
              <span className="project-platform-badge video-type-badge" title="Video type">
                <Clapperboard size={11} aria-hidden="true" /> {videoType.name}
              </span>
            )}
            <span className="chat-private-pill">
              <ShieldCheck size={11} aria-hidden="true" />
              Local Browser Only
            </span>
          </div>
        </div>

        {hasConversation && tab === 'create-video' && (
          <button
            type="button"
            className="chat-action-btn game-focus-toggle"
            onClick={toggleChrome}
            title={chromeRevealed ? 'Enter distraction-free mode' : 'Show navigation and panels'}
            aria-label={chromeRevealed ? 'Enter distraction-free mode' : 'Show navigation and panels'}
          >
            {chromeRevealed ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
            <span>{chromeRevealed ? 'Focus' : 'Show panels'}</span>
          </button>
        )}

        <button type="button" className="chat-action-btn" onClick={() => setProviderOpen(true)} title="Provider & capability status">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Providers</span>
        </button>

        <button type="button" className="chat-action-btn" onClick={() => setSettingsOpen(true)} title="Output settings">
          <Sliders size={14} aria-hidden="true" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="gold-primary-btn images-choose-style-btn"
          onClick={() => setStylePickerOpen(true)}
          title="Choose a video style"
        >
          <Palette size={14} aria-hidden="true" />
          <span>Choose Style</span>
        </button>
      </header>

      <nav className="videos-tabs" role="tablist" aria-label="Videos workspace sections">
        {(
          [
            ['create-video', 'Create Video', <VideoIcon size={13} key="i" aria-hidden="true" />],
            ['create-series', 'Create Series', <Layers size={13} key="i" aria-hidden="true" />],
            ['productions', 'My Productions', <Film size={13} key="i" aria-hidden="true" />],
            ['chats', 'Video Chats', <MessageSquare size={13} key="i" aria-hidden="true" />],
            ['previous', 'Previous Videos', <History size={13} key="i" aria-hidden="true" />],
          ] as Array<[WorkspaceTab, string, React.ReactNode]>
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`videos-tab ${tab === id ? 'active' : ''}`}
            onClick={() => {
              setTab(id);
              if (id !== 'productions') setActiveProductionId(null);
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {tab === 'create-video' && (
        <div className={`project-workspace-body ${panelOpen ? 'panel-open' : 'panel-collapsed'}`}>
          <aside className="project-chat-panel" aria-label="Video conversations" aria-expanded={panelOpen}>
            <div className="project-chat-panel-header">
              <button
                type="button"
                className="project-chat-disclosure"
                onClick={togglePanel}
                aria-expanded={panelOpen}
                aria-controls="videos-chat-panel-content"
                title={panelOpen ? 'Collapse conversations' : 'Expand conversations'}
              >
                <ChevronRight
                  size={15}
                  className={`project-chat-disclosure-chevron ${panelOpen ? 'open' : ''}`}
                  aria-hidden="true"
                />
                <span className="project-chat-panel-title">Conversations</span>
              </button>
              <button type="button" className="project-new-chat-btn" onClick={() => handleNewChat()} title="New video chat">
                <Plus size={14} aria-hidden="true" />
                <span>New Chat</span>
              </button>
            </div>

            {panelOpen && (
              <div id="videos-chat-panel-content" className="project-chat-panel-content">
                {conversations.length === 0 ? (
                  <div className="project-chat-empty">
                    <p>No video conversations yet.</p>
                    <button type="button" className="gold-ghost-btn" onClick={() => handleNewChat()}>
                      New Chat
                    </button>
                  </div>
                ) : (
                  <div className="project-chat-list">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`project-chat-item ${conv.id === chatState.activeId ? 'active' : ''}`}
                        onClick={() => chatStore.setActive(conv.id)}
                      >
                        <MessageSquare size={13} className="project-chat-item-icon" aria-hidden="true" />
                        <span className="project-chat-item-title">{conv.title}</span>
                        <button
                          type="button"
                          className="project-chat-rename-btn"
                          onClick={(e) => handleRenameChat(conv.id, e)}
                          title="Rename conversation"
                          aria-label={`Rename conversation ${conv.title}`}
                        >
                          <Pencil size={12} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="project-chat-delete-btn"
                          onClick={(e) => handleDeleteChat(conv.id, e)}
                          title="Delete conversation"
                          aria-label={`Delete conversation ${conv.title}`}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>

          <section className="project-conversation-area videos-conversation-area" aria-label="Video conversation">
            <div className="videos-quick-controls">
              <button type="button" className="video-quick-btn" onClick={() => setTypePickerOpen(true)}>
                <Clapperboard size={13} aria-hidden="true" />
                <span>{videoType?.name ?? 'Single video'}</span>
              </button>
              <button type="button" className="video-quick-btn" onClick={() => setSettingsOpen(true)}>
                <Sliders size={13} aria-hidden="true" />
                <span>
                  {formatDuration(settings.durationSeconds)} · {settings.resolution} · {settings.aspectRatio}
                </span>
              </button>
              <span className="videos-category-pill">
                {videoChatCategoryLabel(activeConv?.category ?? categoryForType(videoType))}
              </span>
            </div>

            <MessageList
              messages={activeConv?.messages ?? []}
              footer={
                <VideoResultsGallery
                  results={results}
                  onRegenerate={(r) => {
                    const conv = ensureConversation();
                    chatStore.appendUserMessage(conv.id, `Regenerate: ${r.originalPrompt}`);
                    void runGeneration(conv, r.originalPrompt);
                  }}
                  onReuse={(r) => {
                    setInput(r.preparedPrompt);
                    showToast('Prompt restored to the composer', { type: 'info' });
                  }}
                  onRemove={(id) => activeConv && chatStore.removeVideoResult(activeConv.id, id)}
                  onNotify={(message, type) => showToast(message, { type })}
                />
              }
              emptyState={
                <div className="chat-empty-state">
                  <div className="chat-empty-spark">
                    <VideoIcon size={26} aria-hidden="true" />
                  </div>
                  <h3>Create a video or plan a whole series</h3>
                  <p>
                    Describe a single video, or ask for a series with seasons and episodes. ARTI keeps the two
                    distinct — a series has episodes, a single video has a duration.
                  </p>
                  {!connected && (
                    <div className="images-setup-callout" role="note">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span>
                        No video bridge is connected. Add one in{' '}
                        <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                          Settings &gt; Connected Services
                        </button>
                        . No video is generated until then.
                      </span>
                    </div>
                  )}
                </div>
              }
            />

            <Composer
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              pending={isPending}
              onStop={handleStop}
              placeholder="Describe a video or a series… (Enter to send, Shift+Enter for new line)"
              notice={<span>{videoNoticeText()}</span>}
            />
          </section>
        </div>
      )}

      {tab === 'create-series' && (
        <div className="videos-section-scroll">
          <SeriesCreationForm onCreated={handleCreatedSeries} />
        </div>
      )}

      {tab === 'productions' && (
        <div className="videos-section-scroll">
          {activeProduction ? (
            <ProductionWorkspaceView
              production={activeProduction}
              busy={busy}
              onGenerateShot={handleGenerateShot}
              onBack={() => setActiveProductionId(null)}
            />
          ) : prodState.productions.length === 0 ? (
            <div className="video-library-empty">
              <Film size={26} aria-hidden="true" />
              <h3>No productions yet</h3>
              <p>Create a series or franchise in Create Series to manage its seasons, episodes and scenes here.</p>
              <button type="button" className="gold-primary-btn" onClick={() => setTab('create-series')}>
                <Layers size={14} aria-hidden="true" />
                <span>Create Series</span>
              </button>
            </div>
          ) : (
            <div className="production-grid">
              {prodState.productions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="production-card"
                  onClick={() => setActiveProductionId(p.id)}
                >
                  <div className="production-card-head">
                    <span className="production-card-kind">
                      {p.kind === 'franchise' ? 'Franchise' : p.kind === 'series' ? 'Series' : 'Standalone'}
                    </span>
                    <span className="production-card-count">
                      {p.seasons.length} season{p.seasons.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="production-card-title">{p.title}</h3>
                  {p.logline && <p className="production-card-logline">{p.logline}</p>}
                  <span className="production-card-open">
                    Open workspace <ChevronRight size={12} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'chats' && (
        <div className="videos-section-scroll">
          <div className="video-library-toolbar">
            <div className="style-picker-search video-library-search">
              <Search size={14} className="style-picker-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="style-picker-search-input field-integrated"
                placeholder="Search video chats…"
                aria-label="Search video chats"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
              />
            </div>
            <button type="button" className="gold-primary-btn small" onClick={() => handleNewChat()}>
              <Plus size={13} aria-hidden="true" />
              <span>New Chat</span>
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="video-library-empty">
              <MessageSquare size={24} aria-hidden="true" />
              <p>No video conversations yet.</p>
            </div>
          ) : (
            <div className="video-chat-groups">
              {groupedChats.map(({ cat, items }) => (
                <section key={cat.id} className="video-chat-group" aria-label={cat.label}>
                  <h3 className="video-chat-group-title">
                    {cat.label} ({items.length})
                  </h3>
                  <ul className="video-chat-group-list">
                    {items.map((c) => (
                      <li key={c.id} className={`video-chat-row ${c.archived ? 'archived' : ''}`}>
                        <button
                          type="button"
                          className="video-chat-row-main"
                          onClick={() => {
                            chatStore.setActive(c.id);
                            setTab('create-video');
                          }}
                        >
                          <span className="video-chat-row-title">{c.title}</span>
                          <span className="video-chat-row-meta">
                            {c.messages.length} messages · {c.updatedAt}
                            {c.archived ? ' · archived' : ''}
                          </span>
                        </button>
                        <div className="video-chat-row-tools">
                          <button
                            type="button"
                            className="season-tool-btn"
                            title="Pin / unpin"
                            onClick={() => chatStore.togglePin(c.id)}
                          >
                            {c.isPinned ? <PinOff size={11} aria-hidden="true" /> : <Pin size={11} aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            className="season-tool-btn"
                            title="Rename"
                            onClick={(e) => handleRenameChat(c.id, e)}
                          >
                            <Pencil size={11} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="season-tool-btn"
                            title={c.archived ? 'Restore' : 'Archive'}
                            onClick={(e) => handleArchiveChat(c.id, e)}
                          >
                            {c.archived ? (
                              <ArchiveRestore size={11} aria-hidden="true" />
                            ) : (
                              <Archive size={11} aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="season-tool-btn danger"
                            title="Delete"
                            onClick={(e) => handleDeleteChat(c.id, e)}
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'previous' && (
        <div className="videos-section-scroll">
          <VideoLibrary
            onOpenConversation={(chatId) => {
              chatStore.setActive(chatId);
              setTab('create-video');
            }}
            onOpenProduction={(productionId) => {
              setActiveProductionId(productionId);
              setTab('productions');
            }}
          />
        </div>
      )}

      {focusActive && (
        <button type="button" className="focus-reveal-pill" onClick={toggleChrome} title="Show navigation and panels">
          <Eye size={14} aria-hidden="true" />
          <span>Show panels</span>
        </button>
      )}

      <VideoStylePicker
        isOpen={stylePickerOpen}
        activeStyleId={styleId}
        onSelect={handleSelectStyle}
        onClear={handleClearStyle}
        onClose={() => setStylePickerOpen(false)}
      />

      <VideoTypePicker
        isOpen={typePickerOpen}
        activeTypeId={videoType?.id}
        onSelect={handleSelectType}
        onClose={() => setTypePickerOpen(false)}
      />

      {settingsOpen && (
        <VideoSettingsPanel
          settings={settings}
          structured={false}
          onChange={patchSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {providerOpen && <VideoProviderStatus onClose={() => setProviderOpen(false)} />}

      {/* Intent decision dialog — never silently decides a structured request */}
      <Dialog
        isOpen={!!decision}
        onClose={() => setDecision(null)}
        title="How should this be produced?"
        description={decision?.summary}
        maxWidth="620px"
      >
        {decision && (
          <div className="video-decision">
            {decision.kind === 'ambiguous' ||
            decision.kind === 'multi-season-series' ||
            decision.kind === 'episodic-series' ||
            decision.kind === 'franchise' ? (
              <>
                <p className="video-decision-text">
                  A request like this can be a <strong>structured production</strong> (seasons and episodes) or,
                  where the engine allows, one continuous video. ARTI will not silently decide for you.
                </p>
                <div className="video-decision-options">
                  <button
                    type="button"
                    className="gold-primary-btn"
                    onClick={() => {
                      setDecision(null);
                      setTab('create-series');
                    }}
                  >
                    <Layers size={14} aria-hidden="true" />
                    <span>Create a structured production</span>
                  </button>
                  <button
                    type="button"
                    className="gold-ghost-btn"
                    onClick={() => {
                      const conv = ensureConversation();
                      const validation = validateContinuousDuration(settings.durationSeconds, BRIDGE_CAPABILITY);
                      const prompt = decision.prompt;
                      setDecision(null);
                      if (!validation.ok) {
                        chatStore.appendAssistantMessage(conv.id, validation.note ?? '');
                        showToast('Single continuous render not possible at this length', { type: 'warning' });
                        return;
                      }
                      void runGeneration(conv, prompt);
                    }}
                  >
                    <VideoIcon size={14} aria-hidden="true" />
                    <span>Generate one continuous video</span>
                  </button>
                </div>
                <p className="video-decision-hint">
                  Single continuous length is validated against the engine’s real clip limit before rendering.
                </p>
              </>
            ) : decision.kind === 'continuation' ? (
              <>
                <p className="video-decision-text">
                  This continues an existing production. Open a series in My Productions to reuse its established
                  bible, characters and canon, or create a new season there.
                </p>
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={() => {
                    setDecision(null);
                    setTab('productions');
                  }}
                >
                  <Film size={14} aria-hidden="true" />
                  <span>Open My Productions</span>
                </button>
              </>
            ) : (
              <>
                <p className="video-decision-text">
                  {decision.summary} Structured productions are created in the Series &amp; Franchise Studio.
                </p>
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={() => {
                    setDecision(null);
                    setTab('create-series');
                  }}
                >
                  <Layers size={14} aria-hidden="true" />
                  <span>Open Series Studio</span>
                </button>
              </>
            )}

            <details className="video-decision-preview">
              <summary>Prepared prompt preview</summary>
              <pre className="video-decision-prompt">{previewText}</pre>
            </details>
          </div>
        )}
      </Dialog>

      {/* Library shortcut in the conversation view */}
      {allVideoResults.length > 0 && tab === 'create-video' && (
        <button type="button" className="videos-library-fab" onClick={() => setTab('previous')} title="Previous videos">
          <Library size={14} aria-hidden="true" />
          <span>{allVideoResults.length}</span>
        </button>
      )}
    </div>
  );
};
