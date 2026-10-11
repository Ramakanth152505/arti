import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Plus,
  MessageSquare,
  X,
  Image as ImageIcon,
  Palette,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Images,
  Download,
  Pencil,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import { Dialog } from '../../common/Dialog';
import {
  chatStore,
  useChatStore,
  type ChatConversation,
  type ImageGenerationSettings,
  type ImageResultRecord,
} from '../../../services/chatStore';
import {
  getImageConnection,
  getSelectedImageModel,
  getSelectedImageProvider,
  getModelCapability,
  getProviderCapability,
  generateImages,
  isImageProviderConfigured,
  resolveSize,
  ImageServiceError,
  type ImageProviderId,
} from '../../../services/imageService';
import {
  analyzePrompt,
  buildPreparedPrompt,
  getAspectRatio,
  type PromptAnalysis,
} from '../../../services/imageClarify';
import { getStyleById, type ImageStyle } from '../../../services/imageStyles';
import { downloadImage } from '../../../services/imageDownload';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';
import { useConversationFocus } from '../../../hooks/useConversationFocus';
import { ImageStylePicker } from '../../images/ImageStylePicker';
import { ImageClarificationPanel } from '../../images/ImageClarificationPanel';
import { ImageResultsGallery } from '../../images/ImageResultsGallery';
import { ImageSettingsPanel } from '../../images/ImageSettingsPanel';

const PANEL_PREF_KEY = 'arti_images_chat_panel_open';

function loadPanelOpenPref(): boolean {
  try {
    return localStorage.getItem(PANEL_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

/** Default generation settings for the currently configured provider/model. */
function defaultSettings(): ImageGenerationSettings {
  const providerId = getSelectedImageProvider() as ImageProviderId;
  const modelId = getSelectedImageModel();
  const model = getModelCapability(providerId, modelId) ?? getProviderCapability(providerId).models[0];
  const size = resolveSize(1, model).token;
  return {
    providerId,
    model: model.id,
    aspectRatio: '1:1',
    size,
    quality: model.qualities[0],
    count: 1,
    seed: '-1',
    negativePrompt: '',
    transparentBackground: false,
    styleStrength: 70,
  };
}

/** Merge stored (partial) settings over fresh provider defaults. */
function mergeSettings(stored: Partial<ImageGenerationSettings> | undefined): ImageGenerationSettings {
  const base = defaultSettings();
  const merged = { ...base, ...stored };
  // The provider may have changed since the conversation was stored.
  const model = getModelCapability(merged.providerId as ImageProviderId, merged.model);
  if (!model) {
    return base;
  }
  return merged;
}

/**
 * Images — the dedicated image-generation workspace.
 *
 * A real conversation surface with its own persistent, workspace-tagged
 * conversation history, a data-driven style library, an intelligent
 * clarification step, and generation against a genuinely configured provider.
 * Nothing is fabricated: when no provider is connected the workspace says so and
 * no placeholder image is ever produced.
 */
export const ImagesWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const chatState = useChatStore();

  const [input, setInput] = useState('');
  const [panelOpen, setPanelOpen] = useState<boolean>(loadPanelOpenPref);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [clarify, setClarify] = useState<{ analysis: PromptAnalysis; prompt: string } | null>(null);

  const genAbortRef = useRef<AbortController | null>(null);
  const analyzeAbortRef = useRef<AbortController | null>(null);

  const conversations = useMemo(
    () => chatState.conversations.filter((c) => !c.projectId && c.workspace === 'images'),
    [chatState.conversations]
  );
  const activeConv = conversations.find((c) => c.id === chatState.activeId);
  const settings = useMemo(() => mergeSettings(activeConv?.imageMeta?.settings), [activeConv]);
  const styleId = activeConv?.imageMeta?.styleId;
  const style = getStyleById(styleId);
  const results = activeConv?.imageMeta?.results ?? [];
  const isPending = activeConv?.imageMeta?.pendingGeneration ?? false;
  const connected = isImageProviderConfigured();

  const hasConversation = (activeConv?.messages.length ?? 0) > 0 || results.length > 0 || isPending;
  const { chromeRevealed, toggleChrome, containerRef } = useConversationFocus(hasConversation);
  const focusActive = hasConversation && !chromeRevealed;

  // Opening Images restores one of its own conversations. The shared store keeps
  // a single active conversation, so if the active one belongs to a different
  // workspace this view selects its most recent images chat instead.
  useEffect(() => {
    const convs = chatStore.getWorkspaceConversations('images');
    if (convs.length === 0) return;
    if (!convs.some((c) => c.id === chatState.activeId)) {
      chatStore.setActive(convs[0].id);
    }
  }, [chatState.activeId, chatState.conversations]);

  useEffect(
    () => () => {
      genAbortRef.current?.abort();
      analyzeAbortRef.current?.abort();
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
    return chatStore.createWorkspaceConversation('images', 'New Image Conversation', {
      settings: defaultSettings(),
      results: [],
      pendingGeneration: false,
    });
  }, [activeConv]);

  const handleNewChat = () => {
    chatStore.createWorkspaceConversation('images', 'New Image Conversation', {
      settings: defaultSettings(),
      results: [],
      pendingGeneration: false,
    });
    setInput('');
    setClarify(null);
    showToast('New image conversation started', { type: 'gold' });
  };

  const notConnectedMessage =
    'No image provider is connected, so no image was generated. Add an OpenAI key or configure an image bridge in Settings > Connected Services, then try again.';

  /** Run a real generation request for a prepared prompt. */
  const runGeneration = useCallback(
    async (conv: ChatConversation, preparedPrompt: string, originalPrompt: string) => {
      if (isPending) return;
      if (!isImageProviderConfigured()) {
        chatStore.appendAssistantMessage(conv.id, notConnectedMessage);
        showToast('Image provider not connected', { type: 'warning' });
        return;
      }

      const controller = new AbortController();
      genAbortRef.current = controller;
      const current = mergeSettings(chatStore.getConversation(conv.id)?.imageMeta?.settings);
      chatStore.patchImageMeta(conv.id, { pendingGeneration: true });

      const ratio = getAspectRatio(current.aspectRatio);
      const custom =
        current.aspectRatio === 'custom' && current.size.match(/^\d+x\d+$/)
          ? {
              width: parseInt(current.size.split('x')[0], 10),
              height: parseInt(current.size.split('x')[1], 10),
            }
          : undefined;
      const providerId = current.providerId as ImageProviderId;
      const model =
        getModelCapability(providerId, current.model) ?? getProviderCapability(providerId).models[0];
      const resolved = resolveSize(ratio.ratio, model, custom);

      try {
        const response = await generateImages(
          {
            prompt: preparedPrompt,
            negativePrompt: model.supportsNegativePrompt ? current.negativePrompt : undefined,
            size: resolved.token,
            quality: current.quality,
            count: current.count,
            model: current.model,
            seed: model.supportsSeed ? current.seed : undefined,
            styleStrength: model.supportsStyleStrength ? current.styleStrength : undefined,
            transparentBackground: model.supportsTransparentBackground ? current.transparentBackground : undefined,
          },
          controller.signal
        );

        const record: ImageResultRecord = {
          id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          preparedPrompt,
          originalPrompt,
          styleId,
          styleName: style?.name,
          clarifications: {},
          settings: { ...current, size: response.requestedSize, model: response.model },
          images: response.images,
          status: 'complete',
          nativeResolution: response.nativeResolution,
        };
        chatStore.addImageResult(conv.id, record);
        chatStore.appendAssistantMessage(
          conv.id,
          `Generated ${response.images.length} image${response.images.length === 1 ? '' : 's'} at ${response.nativeResolution} native resolution. The result is shown above — download it to keep a copy on this device.`
        );
        showToast('Image generated', { type: 'success' });
      } catch (err) {
        const aborted = err instanceof DOMException && err.name === 'AbortError';
        if (aborted) {
          chatStore.appendAssistantMessage(conv.id, 'Generation cancelled. No image was produced.');
          showToast('Generation cancelled', { type: 'info' });
        } else {
          const message =
            err instanceof ImageServiceError
              ? err.message
              : 'The image request failed before a result was returned.';
          const record: ImageResultRecord = {
            id: 'res_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            preparedPrompt,
            originalPrompt,
            styleId,
            styleName: style?.name,
            clarifications: {},
            settings: { ...current, size: resolved.token },
            images: [],
            status: 'failed',
            error: message,
          };
          chatStore.addImageResult(conv.id, record);
          showToast('Image generation failed', { type: 'error' });
        }
      } finally {
        chatStore.patchImageMeta(conv.id, { pendingGeneration: false });
        genAbortRef.current = null;
      }
    },
    [isPending, notConnectedMessage, showToast, styleId, style]
  );

  /** Submit from the composer: append the prompt, then clarify or generate. */
  const handleSubmit = (value: string) => {
    const text = value.trim();
    if (!text) return;
    const conv = ensureConversation();
    chatStore.appendUserMessage(conv.id, text);
    setInput('');

    // Immediate, honest feedback when nothing can generate yet.
    if (!isImageProviderConfigured()) {
      chatStore.appendAssistantMessage(conv.id, notConnectedMessage);
      showToast('Image provider not connected', { type: 'warning' });
      return;
    }

    setAnalyzing(true);
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    void analyzePrompt(text, style, controller.signal)
      .then((analysis) => {
        if (controller.signal.aborted) return;
        if (analysis.needsClarification) {
          setClarify({ analysis, prompt: text });
        } else {
          const prepared = buildPreparedPrompt({
            originalPrompt: text,
            styleId,
            answers: {},
            ratioLabel: getAspectRatio(settings.aspectRatio).label,
          });
          void runGeneration(conv, prepared, text);
        }
      })
      .finally(() => {
        setAnalyzing(false);
        analyzeAbortRef.current = null;
      });
  };

  const handleClarifyConfirm = (_answers: Record<string, string>, preparedPrompt: string) => {
    if (!clarify) return;
    const conv = ensureConversation();
    setClarify(null);
    void runGeneration(conv, preparedPrompt, clarify.prompt);
  };

  const handleStop = () => {
    genAbortRef.current?.abort();
  };

  const handleSelectStyle = (selected: ImageStyle) => {
    const conv = ensureConversation();
    chatStore.patchImageMeta(conv.id, { styleId: selected.id });
    // Attach the style's real prompt guidance to the composer — never submit.
    setInput((prev) => {
      const guidance = selected.promptGuidance;
      if (prev.includes(guidance)) return prev;
      return prev.trim() ? `${prev.trim()} ${guidance}` : guidance;
    });
    setStylePickerOpen(false);
    showToast(`${selected.name} style applied to this conversation`, { type: 'gold' });
  };

  const handleClearStyle = () => {
    if (!activeConv) return;
    const current = getStyleById(activeConv.imageMeta?.styleId);
    chatStore.patchImageMeta(activeConv.id, { styleId: undefined });
    if (current) {
      setInput((prev) => prev.replace(current.promptGuidance, '').trim());
    }
    showToast('Style removed from this conversation', { type: 'info' });
  };

  const patchSettings = (patch: Partial<ImageGenerationSettings>) => {
    const conv = ensureConversation();
    const merged = {
      ...mergeSettings(chatStore.getConversation(conv.id)?.imageMeta?.settings),
      ...patch,
    };
    chatStore.patchImageMeta(conv.id, { settings: merged });
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

  const handleRegenerate = (result: ImageResultRecord) => {
    const conv = ensureConversation();
    chatStore.appendUserMessage(conv.id, `Regenerate: ${result.originalPrompt}`);
    void runGeneration(conv, result.preparedPrompt, result.originalPrompt);
  };

  const handleVariation = (result: ImageResultRecord) => {
    const conv = ensureConversation();
    chatStore.appendUserMessage(conv.id, `Create a variation of: ${result.originalPrompt}`);
    // A variation changes the seed when the model supports it, otherwise the
    // prompt is resubmitted unchanged (the provider will vary naturally).
    const model = getModelCapability(result.settings.providerId as ImageProviderId, result.settings.model);
    if (model?.supportsSeed) {
      const seed = String(Math.floor(Math.random() * 1_000_000));
      const merged = {
        ...mergeSettings(chatStore.getConversation(conv.id)?.imageMeta?.settings),
        seed,
      };
      chatStore.patchImageMeta(conv.id, { settings: merged });
    }
    void runGeneration(conv, result.preparedPrompt, result.originalPrompt);
  };

  const handleReuse = (result: ImageResultRecord) => {
    setInput(result.preparedPrompt);
    showToast('Prompt restored to the composer', { type: 'info' });
  };

  const handleRemoveResult = (resultId: string) => {
    if (!activeConv) return;
    chatStore.removeImageResult(activeConv.id, resultId);
  };

  const handleNotify = (message: string, type: 'success' | 'warning' | 'error' | 'info' | 'gold') => {
    showToast(message, { type });
  };

  const allGalleryImages = useMemo(
    () =>
      conversations.flatMap((c) =>
        (c.imageMeta?.results ?? [])
          .filter((r) => r.status === 'complete')
          .flatMap((r) => r.images.map((img) => ({ image: img, result: r, conversation: c.title })))
      ),
    [conversations]
  );

  return (
    <div
      className={`project-workspace images-workspace ${focusActive ? 'focus-active' : ''}`}
      ref={containerRef}
    >
      <header className="project-workspace-header images-header">
        <div className="project-workspace-title-group">
          <h2 className="t-h3 project-workspace-title">Images Studio</h2>
          <div className="project-workspace-meta">
            <span className="project-type-badge">Image Studio</span>
            {style && (
              <span className="project-platform-badge images-style-badge" title="Style applied to this conversation">
                <Palette size={11} aria-hidden="true" /> {style.name}
              </span>
            )}
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

        <button
          type="button"
          className="chat-action-btn"
          onClick={() => setGalleryOpen(true)}
          title="Browse generated images from your conversations"
        >
          <Images size={14} aria-hidden="true" />
          <span>Gallery</span>
        </button>

        <button
          type="button"
          className="chat-action-btn"
          onClick={() => setSettingsOpen(true)}
          title="Model, dimensions and quality settings"
        >
          <Sliders size={14} aria-hidden="true" />
          <span>Settings</span>
        </button>

        {/* Choose Style — upper-right of the chatbot workspace. */}
        <button
          type="button"
          className="gold-primary-btn images-choose-style-btn"
          onClick={() => setStylePickerOpen(true)}
          title="Choose an image style for this conversation"
        >
          <Palette size={14} aria-hidden="true" />
          <span>Choose Style</span>
        </button>
      </header>

      <div className={`project-workspace-body ${panelOpen ? 'panel-open' : 'panel-collapsed'}`}>
        <aside className="project-chat-panel" aria-label="Image conversations" aria-expanded={panelOpen}>
          <div className="project-chat-panel-header">
            <button
              type="button"
              className="project-chat-disclosure"
              onClick={togglePanel}
              aria-expanded={panelOpen}
              aria-controls="images-chat-panel-content"
              title={panelOpen ? 'Collapse conversations' : 'Expand conversations'}
            >
              <ChevronRight
                size={15}
                className={`project-chat-disclosure-chevron ${panelOpen ? 'open' : ''}`}
                aria-hidden="true"
              />
              <span className="project-chat-panel-title">Conversations</span>
            </button>
            <button type="button" className="project-new-chat-btn" onClick={handleNewChat} title="New image chat">
              <Plus size={14} aria-hidden="true" />
              <span>New Chat</span>
            </button>
          </div>

          {panelOpen && (
            <div id="images-chat-panel-content" className="project-chat-panel-content">
              {conversations.length === 0 ? (
                <div className="project-chat-empty">
                  <p>No image conversations yet.</p>
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

        <section className="project-conversation-area images-conversation-area" aria-label="Image conversation">
          <MessageList
            messages={activeConv?.messages ?? []}
            footer={
              <ImageResultsGallery
                results={results}
                onRegenerate={handleRegenerate}
                onVariation={handleVariation}
                onReuse={handleReuse}
                onRemove={handleRemoveResult}
                onNotify={handleNotify}
              />
            }
            emptyState={
              <div className="chat-empty-state">
                <div className="chat-empty-spark">
                  <ImageIcon size={26} aria-hidden="true" />
                </div>
                <h3>Describe the image you want to create</h3>
                <p>
                  Type an image prompt below. Add a style with <strong>Choose Style</strong>, then ARTI asks
                  only for details it still needs before sending the request to your connected image provider.
                </p>
                {!connected && (
                  <div className="images-setup-callout" role="note">
                    <AlertCircle size={14} aria-hidden="true" />
                    <span>
                      No image provider is connected. Add an OpenAI key or an image bridge in{' '}
                      <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                        Settings &gt; Connected Services
                      </button>
                      . No image is generated until then.
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
            pending={isPending || analyzing}
            onStop={handleStop}
            placeholder="Describe an image… (Enter to send, Shift+Enter for new line)"
            notice={
              connected ? (
                <span>
                  Connected to{' '}
                  {getImageConnection()?.providerId === 'custom-server' ? 'your image bridge' : 'OpenAI Images'}.
                  Requests are sent to your provider; nothing is stored on an ARTI server.
                </span>
              ) : (
                <span>
                  Not connected. Configure an image provider in{' '}
                  <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                    Settings &gt; Connected Services
                  </button>{' '}
                  to enable real generation.
                </span>
              )
            }
          />
        </section>
      </div>

      {focusActive && (
        <button
          type="button"
          className="focus-reveal-pill"
          onClick={toggleChrome}
          title="Show navigation and panels"
        >
          <Eye size={14} aria-hidden="true" />
          <span>Show panels</span>
        </button>
      )}

      <ImageStylePicker
        isOpen={stylePickerOpen}
        activeStyleId={styleId}
        onSelect={handleSelectStyle}
        onClear={handleClearStyle}
        onClose={() => setStylePickerOpen(false)}
      />

      {clarify && (
        <ImageClarificationPanel
          isOpen
          analysis={clarify.analysis}
          originalPrompt={clarify.prompt}
          styleId={styleId}
          ratioValue={settings.aspectRatio}
          onConfirm={handleClarifyConfirm}
          onClose={() => setClarify(null)}
        />
      )}

      {settingsOpen && (
        <ImageSettingsPanel
          settings={settings}
          onChange={patchSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <Dialog
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="Generated images"
        description="Images returned by your provider across all image conversations. Provider URLs may expire — download any image you want to keep."
        maxWidth="820px"
      >
        {allGalleryImages.length === 0 ? (
          <p className="images-gallery-empty">No images have been generated yet.</p>
        ) : (
          <div className="images-gallery-grid">
            {allGalleryImages.map(({ image, result, conversation }) => (
              <figure key={image.id} className="images-gallery-item">
                <img src={image.url} alt={result.originalPrompt.slice(0, 80)} loading="lazy" decoding="async" />
                <figcaption>
                  <span className="images-gallery-conv">{conversation}</span>
                  <span className="images-gallery-spec">
                    {image.width && image.height ? `${image.width}×${image.height}` : image.format.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    className="image-tile-action"
                    title="Download to this device"
                    aria-label="Download image"
                    onClick={async () => {
                      const outcome = await downloadImage(image.url, result.originalPrompt, image.format);
                      handleNotify(
                        outcome.ok ? `Downloaded ${outcome.filename}.` : outcome.reason,
                        outcome.ok ? 'success' : 'error'
                      );
                    }}
                  >
                    <Download size={13} aria-hidden="true" />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
};
