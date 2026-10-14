/**
 * ARTI AI — Music Studio workspace (route `music`).
 *
 * A real AI music-generation workspace, not a mockup. It has four tabs —
 * Create, Chat, Library and Gallery — a searchable mode picker, a style catalog,
 * a language catalog with honest vocal capability, a lyrics editor, a vocal
 * configuration panel, an instrumental panel, an audio player and a track
 * library with transformations.
 *
 * Honesty contract (enforced throughout):
 *   - A track is only shown as ready when a real, playable asset was received.
 *   - Lyrics come from the language-model boundary; audio comes from the music
 *     provider boundary. The two are never conflated.
 *   - Unsupported/undeclared capabilities are stated, never claimed.
 *   - The in-component generation indicator is driven by real request state and
 *     never appears when no request is running.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Music as MusicIcon,
  Sparkles,
  Sliders,
  Plus,
  MessageSquare,
  X,
  Pencil,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Disc3,
  Library,
  Images,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import {
  chatStore,
  useChatStore,
  type ChatConversation,
  type GeneratedTrackRecord,
  type MusicConversationMeta,
} from '../../../services/chatStore';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';
import { useConversationFocus } from '../../../hooks/useConversationFocus';
import { ModePicker } from '../../music/ModePicker';
import { StylePicker } from '../../music/StylePicker';
import { LanguagePicker } from '../../music/LanguagePicker';
import { VocalPanel } from '../../music/VocalPanel';
import { InstrumentalPanel } from '../../music/InstrumentalPanel';
import { LyricsEditor } from '../../music/LyricsEditor';
import { BriefReview } from '../../music/BriefReview';
import { MusicPlayer } from '../../music/MusicPlayer';
import { TrackLibrary } from '../../music/TrackLibrary';
import { TransformPanel } from '../../music/TransformPanel';
import { GenerationIndicator } from '../../music/GenerationIndicator';
import {
  getMode,
  getTransform,
  type DuetArrangement,
  type MusicModeId,
  type SongSectionId,
  type SpeedMethod,
  type TransformId,
  type VocalType,
} from '../../../services/musicTypes';
import { type MusicBrief, emptyBrief } from '../../../services/musicPrompt';
import { interpretMusicRequest } from '../../../services/musicClarify';
import { runGeneration, runTransform, type GenerationStage } from '../../../services/musicGeneration';
import { isMusicProviderConfigured, getActiveMusicCapability } from '../../../services/musicProvider';
import { isAiConfigured } from '../../../services/aiService';
import { downloadTrack } from '../../../services/musicDownload';

type TabId = 'create' | 'chat' | 'library' | 'gallery';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'create', label: 'Create', icon: Sparkles },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'gallery', label: 'Gallery', icon: Images },
];

const DEFAULT_STRUCTURE: SongSectionId[] = ['intro', 'verse', 'chorus', 'bridge', 'chorus', 'outro'];

/** Persist a brief into the conversation's string settings map. */
function briefToSettings(brief: MusicBrief): Record<string, string> {
  return {
    mood: brief.mood,
    energy: brief.energy,
    tempo: brief.tempoBpm ? String(brief.tempoBpm) : '',
    rhythm: brief.rhythm ?? '',
    instruments: brief.instruments.join(','),
    structure: brief.structure.join(','),
    duration: String(brief.durationSeconds),
    productionStyle: brief.productionStyle ?? '',
    ending: brief.ending ?? '',
    transitions: brief.transitions ?? '',
    intendedUse: brief.intendedUse ?? '',
    backgroundForeground: brief.backgroundForeground ?? 'foreground',
    vocalDelivery: brief.vocalDelivery ?? '',
    customInstructions: brief.customInstructions ?? '',
    subgenre: brief.subgenre ?? '',
    audience: brief.audience ?? '',
  };
}

function settingsToBrief(meta: MusicConversationMeta | undefined): MusicBrief {
  const base = emptyBrief();
  if (!meta) return base;
  const s = meta.settings || {};
  return {
    ...base,
    mode: (meta.mode as MusicModeId) || base.mode,
    theme: '',
    genre: meta.genre || base.genre,
    language: meta.language || base.language,
    vocalType: (meta.vocalType as VocalType) || base.vocalType,
    mood: s.mood || base.mood,
    energy: s.energy || base.energy,
    tempoBpm: s.tempo ? parseInt(s.tempo, 10) : undefined,
    rhythm: s.rhythm || undefined,
    instruments: s.instruments ? s.instruments.split(',').filter(Boolean) : [],
    structure: s.structure ? (s.structure.split(',').filter(Boolean) as SongSectionId[]) : DEFAULT_STRUCTURE,
    durationSeconds: s.duration ? parseInt(s.duration, 10) : base.durationSeconds,
    productionStyle: s.productionStyle || undefined,
    ending: s.ending || undefined,
    transitions: s.transitions || undefined,
    intendedUse: s.intendedUse || undefined,
    backgroundForeground: (s.backgroundForeground as 'background' | 'foreground') || 'foreground',
    vocalDelivery: s.vocalDelivery || undefined,
    customInstructions: s.customInstructions || undefined,
    subgenre: s.subgenre || undefined,
    audience: s.audience || undefined,
  };
}

function emptyMusicMeta(mode: MusicModeId = 'full-song-vocals'): MusicConversationMeta {
  return {
    mode,
    language: 'en',
    genre: 'pop',
    vocalType: 'female',
    lyrics: '',
    settings: briefToSettings({ ...emptyBrief(), mode }),
    results: [],
    pendingGeneration: false,
  };
}

export const MusicWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const chatState = useChatStore();

  const [tab, setTab] = useState<TabId>('create');
  const [input, setInput] = useState('');
  const [brief, setBrief] = useState<MusicBrief>(() => emptyBrief());
  const [panelOpen, setPanelOpen] = useState(true);
  const [review, setReview] = useState<{ brief: MusicBrief; note: string; filled: string[] } | null>(null);
  const [stage, setStage] = useState<GenerationStage | null>(null);
  const [generationActive, setGenerationActive] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transformTarget, setTransformTarget] = useState<GeneratedTrackRecord | null>(null);
  const [transformBusy, setTransformBusy] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [duetArrangement, setDuetArrangement] = useState<DuetArrangement>('shared-chorus');
  const [harmony, setHarmony] = useState(false);
  const [backingVocals, setBackingVocals] = useState(false);
  const [prominence, setProminence] = useState(80);
  const [preset, setPreset] = useState('cinematic-background');
  const [progression, setProgression] = useState('');
  const [intro, setIntro] = useState('');
  const [intensity, setIntensity] = useState('');

  const genAbortRef = useRef<AbortController | null>(null);
  const interpretAbortRef = useRef<AbortController | null>(null);
  const lastSignatureRef = useRef<string>('');

  const conversations = useMemo(
    () => chatState.conversations.filter((c) => !c.projectId && c.workspace === 'music'),
    [chatState.conversations]
  );
  const activeConv = conversations.find((c) => c.id === chatState.activeId);
  const meta = activeConv?.musicMeta;
  const tracks = meta?.results ?? [];
  const pending = meta?.pendingGeneration ?? false;
  const connected = isMusicProviderConfigured();
  const capability = getActiveMusicCapability();

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  const hasConversation = (activeConv?.messages.length ?? 0) > 0 || tracks.length > 0 || pending;
  const { chromeRevealed, toggleChrome, containerRef } = useConversationFocus(hasConversation);
  const focusActive = hasConversation && !chromeRevealed;

  // Restore one of Music's own conversations when this workspace mounts.
  useEffect(() => {
    const convs = chatStore.getMusicConversations();
    if (convs.length === 0) return;
    if (!convs.some((c) => c.id === chatState.activeId)) {
      chatStore.setActive(convs[0].id);
    }
  }, [chatState.activeId, chatState.conversations]);

  // Load the active conversation's stored brief into the controls when the
  // active conversation changes. Adjusting during render avoids a cascading
  // render from an effect.
  const [briefConvId, setBriefConvId] = useState<string | null>(activeConv?.id ?? null);
  if (briefConvId !== (activeConv?.id ?? null)) {
    setBriefConvId(activeConv?.id ?? null);
    setBrief(settingsToBrief(meta));
  }

  useEffect(
    () => () => {
      genAbortRef.current?.abort();
      interpretAbortRef.current?.abort();
    },
    []
  );

  const patchBrief = useCallback(
    (patch: Partial<MusicBrief>) => {
      setBrief((prev) => {
        const next = { ...prev, ...patch };
        const conv = activeConv ?? chatStore.createMusicConversation('New Music Conversation', emptyMusicMeta(next.mode));
        chatStore.patchMusicMeta(conv.id, {
          mode: next.mode,
          language: next.language,
          genre: next.genre,
          vocalType: next.vocalType,
          settings: briefToSettings(next),
        });
        return next;
      });
    },
    [activeConv]
  );

  const ensureConversation = useCallback((): ChatConversation => {
    if (activeConv) return activeConv;
    return chatStore.createMusicConversation('New Music Conversation', emptyMusicMeta(brief.mode));
  }, [activeConv, brief.mode]);

  const handleNewChat = () => {
    const conv = chatStore.createMusicConversation('New Music Conversation', emptyMusicMeta(brief.mode));
    chatStore.patchMusicMeta(conv.id, { settings: briefToSettings(brief) });
    setInput('');
    setReview(null);
    setActiveTrackId('');
    showToast('New music conversation started', { type: 'gold' });
  };

  const notConnectedAudio =
    'No music provider is connected, so no audio was generated. Add a music bridge endpoint in Settings > Connected Services, then try again.';
  const notConnectedLyrics =
    'No language model is connected, so original lyrics cannot be written. Add an Anthropic or OpenAI key in Settings > Connected Services, or paste your own lyrics.';

  /* ---- Generation ------------------------------------------------------- */

  const runForConversation = useCallback(
    async (conv: ChatConversation, useBrief: MusicBrief, lyrics: string) => {
      const mode = getMode(useBrief.mode);
      // Guard: duplicate requests and honest not-connected states.
      if (chatStore.getConversation(conv.id)?.musicMeta?.pendingGeneration) return;

      if (mode.producesAudio && !isMusicProviderConfigured()) {
        chatStore.appendAssistantMessage(conv.id, notConnectedAudio);
        showToast('Music provider not connected', { type: 'warning' });
        return;
      }
      if (!mode.producesAudio && !isAiConfigured()) {
        chatStore.appendAssistantMessage(conv.id, notConnectedLyrics);
        showToast('Language model not connected', { type: 'warning' });
        return;
      }

      const controller = new AbortController();
      genAbortRef.current = controller;
      chatStore.patchMusicMeta(conv.id, { pendingGeneration: true, pendingStage: 'preparing' });
      setGenerationActive(true);
      setStage('preparing');

      const outcome = await runGeneration(conv.id, useBrief, lyrics, controller.signal, (s) => {
        setStage(s);
        chatStore.patchMusicMeta(conv.id, { pendingStage: s });
      });

      chatStore.patchMusicMeta(conv.id, { pendingGeneration: false, pendingStage: undefined });
      genAbortRef.current = null;
      setGenerationActive(false);

      if (outcome.cancelled) {
        chatStore.appendAssistantMessage(conv.id, 'Generation cancelled. No track was produced.');
        showToast('Generation cancelled', { type: 'info' });
        setStage(null);
        return;
      }
      if (!outcome.ok) {
        chatStore.appendAssistantMessage(conv.id, outcome.error ?? 'The music request failed.');
        showToast('Music generation failed', { type: 'error' });
        setStage(null);
        return;
      }
      if (getMode(useBrief.mode).producesAudio && outcome.record?.status === 'complete') {
        chatStore.appendAssistantMessage(
          conv.id,
          `Generated "${outcome.record.title}" (${Math.round(outcome.record.durationSeconds)}s, ${outcome.record.format}). It is ready to play above. The audio is the provider's own asset; download it to keep a copy.`
        );
        showToast('Track generated', { type: 'success' });
      } else if (!getMode(useBrief.mode).producesAudio) {
        chatStore.appendAssistantMessage(conv.id, 'Original lyrics written and shown above. Review or edit them before generating music.');
        showToast('Lyrics written', { type: 'success' });
      }
      setStage(null);
    },
    [notConnectedAudio, notConnectedLyrics, showToast]
  );

  const handleStop = () => genAbortRef.current?.abort();

  /* ---- Chat submit: interpret → review → generate ---------------------- */

  const handleSubmit = (value: string) => {
    const text = value.trim();
    if (!text) return;
    const conv = ensureConversation();
    chatStore.appendUserMessage(conv.id, text);
    setInput('');

    const mode = getMode(brief.mode);
    if (mode.producesAudio && !isMusicProviderConfigured()) {
      chatStore.appendAssistantMessage(conv.id, notConnectedAudio);
      showToast('Music provider not connected', { type: 'warning' });
      return;
    }
    if (!mode.producesAudio && !isAiConfigured()) {
      chatStore.appendAssistantMessage(conv.id, notConnectedLyrics);
      showToast('Language model not connected', { type: 'warning' });
      return;
    }

    setInterpreting(true);
    const controller = new AbortController();
    interpretAbortRef.current = controller;
    void interpretMusicRequest(text, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setReview({ brief: result.brief, note: result.note, filled: result.filled });
        setTab('create');
        showToast('Settings extracted — review before generating', { type: 'info' });
      })
      .finally(() => {
        setInterpreting(false);
        interpretAbortRef.current = null;
      });
  };

  const confirmReview = () => {
    if (!review) return;
    const conv = ensureConversation();
    setBrief(review.brief);
    chatStore.patchMusicMeta(conv.id, {
      mode: review.brief.mode,
      language: review.brief.language,
      genre: review.brief.genre,
      vocalType: review.brief.vocalType,
      settings: briefToSettings(review.brief),
    });
    const mode = getMode(review.brief.mode);
    const lyrics = mode.instrumentalOnly ? '' : meta?.lyrics ?? '';
    setReview(null);
    setTab('chat');
    void runForConversation(conv, review.brief, lyrics);
  };

  /* ---- Create tab generate --------------------------------------------- */

  const handleCreateGenerate = () => {
    const conv = ensureConversation();
    const mode = getMode(brief.mode);
    const lyrics = mode.instrumentalOnly ? '' : meta?.lyrics ?? '';
    const signature = JSON.stringify({ b: brief, l: lyrics });
    if (signature === lastSignatureRef.current) {
      showToast('This exact request is already in progress or was just submitted.', { type: 'info' });
      return;
    }
    lastSignatureRef.current = signature;
    setTab('chat');
    void runForConversation(conv, brief, lyrics);
  };

  /* ---- Library actions -------------------------------------------------- */

  const handlePlayToggle = (track: GeneratedTrackRecord) => {
    if (!track.audioUrl || track.status !== 'complete') {
      showToast('No playable audio for this track.', { type: 'warning' });
      return;
    }
    setActiveTrackId(track.id);
    setPlayingId((prev) => (prev === track.id ? null : track.id));
  };

  const handleRename = (track: GeneratedTrackRecord) => {
    if (!activeConv) return;
    const next = window.prompt('Rename track:', track.title);
    if (next && next.trim()) {
      chatStore.updateMusicResult(activeConv.id, track.id, { title: next.trim() });
      showToast('Track renamed', { type: 'success' });
    }
  };

  const handleFavorite = (track: GeneratedTrackRecord) => {
    if (!activeConv) return;
    chatStore.updateMusicResult(activeConv.id, track.id, { favorite: !track.favorite });
  };

  const handleDelete = (track: GeneratedTrackRecord) => {
    if (!activeConv) return;
    if (!window.confirm(`Delete "${track.title}"? This cannot be undone.`)) return;
    chatStore.removeMusicResult(activeConv.id, track.id);
    showToast('Track deleted', { type: 'info' });
  };

  const handleDownload = async (track: GeneratedTrackRecord) => {
    if (!track.audioUrl) {
      showToast('No audio asset to download.', { type: 'warning' });
      return;
    }
    const outcome = await downloadTrack(track.audioUrl, track.title, track.format);
    showToast(outcome.ok ? `Downloaded ${outcome.filename}.` : outcome.reason, {
      type: outcome.ok ? 'success' : 'error',
    });
  };

  const handleTransformApply = async (
    transformId: TransformId,
    options: { speedMethod?: SpeedMethod; rate?: number; genre?: string; mood?: string; lyrics?: string }
  ) => {
    if (!activeConv || !transformTarget) return;
    const transform = getTransform(transformId);
    setTransformBusy(true);
    const controller = new AbortController();
    genAbortRef.current = controller;
    setGenerationActive(true);
    chatStore.patchMusicMeta(activeConv.id, { pendingGeneration: true });
    const outcome = await runTransform(activeConv.id, transformTarget, transformId, options, controller.signal, (s) => setStage(s));
    chatStore.patchMusicMeta(activeConv.id, { pendingGeneration: false });
    genAbortRef.current = null;
    setGenerationActive(false);
    setTransformBusy(false);
    setStage(null);
    if (outcome.ok) {
      showToast(`${transform.label} created as a new track.`, { type: 'success' });
      setTransformTarget(null);
    } else if (outcome.blocked) {
      showToast(outcome.error ?? 'That transformation is not available here.', { type: 'warning' });
    } else {
      showToast(outcome.error ?? 'The transformation failed.', { type: 'error' });
    }
  };

  const handleDeleteChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === convId);
    if (!window.confirm(`Delete conversation "${conv?.title ?? ''}"? This cannot be undone.`)) return;
    const remaining = conversations.filter((c) => c.id !== convId);
    chatStore.deleteConversation(convId);
    if (remaining.length > 0) chatStore.setActive(remaining[0].id);
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

  const mode = getMode(brief.mode);
  const allTracks = useMemo(() => conversations.flatMap((c) => c.musicMeta?.results ?? []), [conversations]);

  /* ---- Render ----------------------------------------------------------- */

  const createPanel = (
    <div className="music-create-grid">
      <aside className="music-create-aside">
        <div className="music-card">
          <h3 className="music-card-heading">Creation mode</h3>
          <ModePicker activeMode={brief.mode} onSelect={(id) => patchBrief({ mode: id })} />
        </div>
        <div className="music-card">
          <h3 className="music-card-heading">Language</h3>
          <LanguagePicker language={brief.language} onLanguage={(code) => patchBrief({ language: code })} capability={capability} />
        </div>
      </aside>

      <main className="music-create-main">
        <div className="music-card">
          <h3 className="music-card-heading">{mode.label}</h3>
          <p className="music-card-subheading">{mode.guidance}</p>

          <label className="music-field-label" htmlFor="music-theme">
            What is this song about? (theme / story / emotion)
          </label>
          <textarea
            id="music-theme"
            className="form-textarea"
            rows={3}
            value={brief.theme}
            onChange={(e) => patchBrief({ theme: e.target.value })}
            placeholder="e.g. A nostalgic Telugu romance about two people meeting again after years apart…"
          />

          <label className="music-field-label" htmlFor="music-custom-instructions">
            Extra direction (optional)
          </label>
          <input
            id="music-custom-instructions"
            type="text"
            className="form-input field-integrated"
            value={brief.customInstructions ?? ''}
            onChange={(e) => patchBrief({ customInstructions: e.target.value })}
            placeholder="e.g. gentle introduction, powerful chorus, cinematic ending"
          />

          <div className="music-inst-grid" style={{ marginTop: 12 }}>
            <label className="music-field-label">
              Subgenre / custom style
              <input
                type="text"
                className="form-input field-integrated"
                value={brief.subgenre ?? ''}
                onChange={(e) => patchBrief({ subgenre: e.target.value })}
                placeholder="e.g. neo-classical cinema"
              />
            </label>
            <label className="music-field-label">
              Approximate duration (seconds)
              <input
                type="number"
                className="form-input field-integrated"
                min={1}
                value={brief.durationSeconds}
                onChange={(e) => patchBrief({ durationSeconds: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              />
            </label>
          </div>
        </div>

        {!mode.instrumentalOnly && (
          <div className="music-card">
            <h3 className="music-card-heading">Lyrics</h3>
            <LyricsEditor
              language={brief.language}
              vocalType={brief.vocalType}
              theme={brief.theme}
              mood={brief.mood}
              structure={brief.structure}
              lyricsText={meta?.lyrics ?? ''}
              sections={[]}
              onLyricsText={(t) => activeConv && chatStore.patchMusicMeta(activeConv.id, { lyrics: t })}
              onSections={() => {}}
              onStructure={(s) => patchBrief({ structure: s })}
              onNotify={(message, type) => showToast(message, { type })}
            />
          </div>
        )}

        {mode.instrumentalOnly ? (
          <div className="music-card">
            <h3 className="music-card-heading">Instrumental configuration</h3>
            <InstrumentalPanel
              preset={preset}
              onPreset={setPreset}
              theme={brief.theme}
              onTheme={(v) => patchBrief({ theme: v })}
              mood={brief.mood}
              onMood={(v) => patchBrief({ mood: v })}
              energy={brief.energy}
              onEnergy={(v) => patchBrief({ energy: v })}
              tempo={brief.tempoBpm ?? 90}
              onTempo={(v) => patchBrief({ tempoBpm: v })}
              rhythm={brief.rhythm ?? ''}
              onRhythm={(v) => patchBrief({ rhythm: v || undefined })}
              durationSeconds={brief.durationSeconds}
              onDuration={(v) => patchBrief({ durationSeconds: v })}
              instruments={brief.instruments}
              onInstruments={(ids) => patchBrief({ instruments: ids })}
              progression={progression}
              onProgression={setProgression}
              intro={intro}
              onIntro={setIntro}
              ending={brief.ending ?? ''}
              onEnding={(v) => patchBrief({ ending: v })}
              intensity={intensity}
              onIntensity={setIntensity}
              transitions={brief.transitions ?? ''}
              onTransitions={(v) => patchBrief({ transitions: v })}
              backgroundForeground={brief.backgroundForeground ?? 'foreground'}
              onBackgroundForeground={(v) => patchBrief({ backgroundForeground: v })}
              intendedUse={brief.intendedUse ?? ''}
              onIntendedUse={(v) => patchBrief({ intendedUse: v })}
            />
          </div>
        ) : (
          <div className="music-card">
            <h3 className="music-card-heading">Vocals</h3>
            <VocalPanel
              vocalType={brief.vocalType}
              onVocalType={(v) => patchBrief({ vocalType: v })}
              language={brief.language}
              delivery={brief.vocalDelivery ?? ''}
              onDelivery={(v) => patchBrief({ vocalDelivery: v || undefined })}
              duetArrangement={duetArrangement}
              onDuetArrangement={setDuetArrangement}
              harmony={harmony}
              onHarmony={setHarmony}
              backingVocals={backingVocals}
              onBackingVocals={setBackingVocals}
              prominence={prominence}
              onProminence={setProminence}
              capability={capability}
            />
          </div>
        )}

        <div className="music-card">
          <h3 className="music-card-heading">Style &amp; instrumentation</h3>
          <StylePicker
            genre={brief.genre}
            onGenre={(id) => patchBrief({ genre: id })}
            instruments={brief.instruments}
            onInstruments={(ids) => patchBrief({ instruments: ids })}
            mood={brief.mood}
            onMood={(v) => patchBrief({ mood: v })}
            energy={brief.energy}
            onEnergy={(v) => patchBrief({ energy: v })}
            rhythm={brief.rhythm ?? ''}
            onRhythm={(v) => patchBrief({ rhythm: v || undefined })}
            customStyle={brief.subgenre ?? ''}
            onCustomStyle={(v) => patchBrief({ subgenre: v })}
          />
        </div>

        {review && (
          <BriefReview
            brief={review.brief}
            interpreterNote={review.note}
            filled={review.filled}
            capability={capability}
            onEdit={() => {
              setBrief(review.brief);
              setReview(null);
            }}
            onConfirm={confirmReview}
            onCancel={() => setReview(null)}
          />
        )}

        <div className="music-create-actions">
          <button type="button" className="gold-primary-btn" onClick={handleCreateGenerate} disabled={pending || interpreting}>
            <Sparkles size={14} aria-hidden="true" />
            <span>{pending ? 'Generating…' : mode.producesAudio ? 'Generate track' : 'Write lyrics'}</span>
          </button>
          <span className="music-style-hint">
            {connected || !mode.producesAudio
              ? 'The reviewed settings are exactly what is sent to the provider.'
              : 'No provider is connected yet — configure one in Settings > Connected Services.'}
          </span>
        </div>
      </main>
    </div>
  );

  const chatPanel = (
    <div className="music-chat-layout">
      <div className="music-chat-scroll">
        {stage && (
          <div style={{ marginBottom: 12 }}>
            <GenerationIndicator stage={stage} onCancel={handleStop} cancellable={generationActive} />
          </div>
        )}

        {pending && !stage && (
          <div style={{ marginBottom: 12 }}>
            <GenerationIndicator stage="generating" onCancel={handleStop} />
          </div>
        )}

        {activeTrack && activeTrack.status === 'complete' && (
          <div className="music-chat-results">
            <div className="music-card">
              <div className="music-library-row-top" style={{ marginBottom: 8 }}>
                <Disc3 size={16} aria-hidden="true" />
                <span className="music-gallery-title">{activeTrack.title}</span>
                <span className="music-library-status status-complete">Ready</span>
              </div>
              <MusicPlayer track={activeTrack} onDownload={() => handleDownload(activeTrack)} />
            </div>
          </div>
        )}

        <MessageList
          messages={activeConv?.messages ?? []}
          emptyState={
            <div className="music-chat-empty">
              <div className="chat-empty-spark">
                <MusicIcon size={26} aria-hidden="true" />
              </div>
              <h3>Describe the music you want to create</h3>
              <p>
                Write a request in your own words — the story, mood, genre, language, vocals and ending. ARTI
                extracts the settings and shows them for you to review before generating.
              </p>
              <div className="music-chat-actions">
                <button
                  type="button"
                  className="music-chip"
                  onClick={() =>
                    setInput(
                      'Create an emotional Telugu romantic duet with male and female vocals, original lyrics, a gentle introduction, traditional Indian instrumentation, a powerful chorus, and a cinematic ending.'
                    )
                  }
                >
                  Telugu romantic duet
                </button>
                <button
                  type="button"
                  className="music-chip"
                  onClick={() => setInput('Create a calm ambient instrumental soundscape for studying, about 4 minutes.')}
                >
                  Ambient study instrumental
                </button>
              </div>
              {!connected && (
                <div className="music-setup-callout" role="note">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>
                    No music provider is connected. Add a music bridge endpoint in{' '}
                    <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                      Settings &gt; Connected Services
                    </button>
                    . No audio is generated until then.
                  </span>
                </div>
              )}
            </div>
          }
        />
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        pending={pending || interpreting}
        onStop={handleStop}
        placeholder="Describe a song… (Enter to send, Shift+Enter for new line)"
        notice={
          connected ? (
            <span>
              Connected to your music bridge. Requests are sent to your provider; nothing is stored on an ARTI
              server.
            </span>
          ) : (
            <span>
              Not connected. Configure a music bridge in{' '}
              <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                Settings &gt; Connected Services
              </button>{' '}
              to enable real generation.
            </span>
          )
        }
      />
    </div>
  );

  const libraryPanel = (
    <div className="music-library">
      {activeTrack && activeTrack.status === 'complete' && (
        <div className="music-card">
          <MusicPlayer track={activeTrack} onDownload={() => handleDownload(activeTrack)} />
        </div>
      )}
      <TrackLibrary
        tracks={tracks}
        activeId={activeTrack?.id ?? ''}
        playingId={playingId}
        onSelect={setActiveTrackId}
        onPlayToggle={handlePlayToggle}
        onRename={handleRename}
        onFavorite={handleFavorite}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onTransform={(t) => setTransformTarget(t)}
      />
      {transformTarget && (
        <TransformPanel
          track={transformTarget}
          onApply={handleTransformApply}
          onClose={() => setTransformTarget(null)}
          busy={transformBusy}
        />
      )}
    </div>
  );

  return (
    <div
      className={`project-workspace music-workspace ${focusActive ? 'focus-active' : ''}`}
      ref={containerRef}
    >
      <header className="project-workspace-header music-header">
        <div className="project-workspace-title-group">
          <h2 className="t-h3 project-workspace-title">Music Studio</h2>
          <div className="project-workspace-meta">
            <span className="project-type-badge music-type-badge">Music Studio</span>
            <span className="chat-private-pill">
              <ShieldCheck size={11} aria-hidden="true" />
              Local Browser Only
            </span>
          </div>
        </div>

        {hasConversation && (
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

        <button type="button" className="chat-action-btn" onClick={() => setTab('library')} title="Your tracks">
          <Library size={14} aria-hidden="true" />
          <span>Library</span>
        </button>
        <button type="button" className="chat-action-btn" onClick={() => navigate('settings')} title="Provider settings">
          <Sliders size={14} aria-hidden="true" />
          <span>Settings</span>
        </button>
        <button type="button" className="gold-primary-btn" onClick={handleNewChat} title="New music conversation">
          <Plus size={14} aria-hidden="true" />
          <span>New Chat</span>
        </button>
      </header>

      <div className="music-tabs" role="tablist" aria-label="Music Studio sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`music-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className={`project-workspace-body ${panelOpen ? 'panel-open' : 'panel-collapsed'}`}>
          <aside className="project-chat-panel" aria-label="Music conversations" aria-expanded={panelOpen}>
            <div className="project-chat-panel-header">
              <button
                type="button"
                className="project-chat-disclosure"
                onClick={() => setPanelOpen((p) => !p)}
                aria-expanded={panelOpen}
                aria-controls="music-chat-panel-content"
              >
                <MessageSquare size={14} aria-hidden="true" />
                <span className="project-chat-panel-title">Conversations</span>
              </button>
            </div>
            {panelOpen && (
              <div id="music-chat-panel-content" className="project-chat-panel-content">
                {conversations.length === 0 ? (
                  <div className="project-chat-empty">
                    <p>No music conversations yet.</p>
                    <button type="button" className="gold-ghost-btn" onClick={handleNewChat}>
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

          <section className="project-conversation-area" aria-label="Music conversation">
            {chatPanel}
          </section>
        </div>
      ) : (
        <div className="music-section-scroll">
          {tab === 'create' && createPanel}
          {tab === 'library' && libraryPanel}
          {tab === 'gallery' && (
            <div>
              {allTracks.length === 0 ? (
                <p className="music-gallery-empty">No tracks have been generated yet.</p>
              ) : (
                <div className="music-gallery-grid">
                  {allTracks.map((t) => (
                    <div key={t.id} className="music-gallery-item">
                      <span className="music-gallery-title">{t.title}</span>
                      <span className="music-gallery-meta">
                        {getMode(t.mode as MusicModeId).label} · {t.providerId}
                        {t.model ? `/${t.model}` : ''}
                      </span>
                      <span className="music-library-status status-complete">{t.status}</span>
                      <MusicPlayer track={t} onDownload={() => handleDownload(t)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {focusActive && (
        <button type="button" className="focus-reveal-pill" onClick={toggleChrome} title="Show navigation and panels">
          <Eye size={14} aria-hidden="true" />
          <span>Show panels</span>
        </button>
      )}
    </div>
  );
};

export default MusicWorkspace;
