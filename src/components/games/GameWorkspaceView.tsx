import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Gamepad2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { projectStore } from '../../services/projectStore';
import { chatStore, useChatStore } from '../../services/chatStore';
import { getConnection, isAiConfigured, getProviderLabel } from '../../services/aiService';
import { MessageList } from '../conversation/MessageList';
import { Composer } from '../conversation/Composer';
import { useConversationFocus } from '../../hooks/useConversationFocus';
import { type Project } from '../../services/projectStore';
import {
  engineLabel,
  mechanicLabel,
  modeLabel,
  resolveGameTargets,
  themeLabel,
} from '../../services/gameTaxonomy';
import { GameSettingsPanel } from './GameSettingsPanel';

const GAME_PANEL_PREF_KEY = 'arti_game_chat_panel_open';

function loadPanelOpenPref(): boolean {
  try {
    return localStorage.getItem(GAME_PANEL_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Dedicated game workspace (route: games?id=…).
 *
 * Restores the game's saved metadata and its own conversations, offers a
 * collapsible project-scoped conversation list with New Chat, and enters the
 * shared distraction-free focus mode once a conversation is under way.
 */
export const GameWorkspaceView: React.FC<{ game: Project; onBack: () => void }> = ({ game, onBack }) => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const chatState = useChatStore();
  const [input, setInput] = useState('');
  const [panelOpen, setPanelOpen] = useState<boolean>(loadPanelOpenPref);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const meta = game.game;
  const gameConversations = chatState.conversations.filter((c) => c.projectId === game.id);
  const activeConv = gameConversations.find((c) => c.id === chatState.activeId);
  const isPending = activeConv ? chatState.pendingIds.includes(activeConv.id) : false;
  const connected = isAiConfigured();
  const connection = getConnection();

  // Distraction-free mode engages once the conversation has real content.
  const hasConversation = (activeConv?.messages.length ?? 0) > 0 || isPending;
  const { chromeRevealed, toggleChrome, containerRef } = useConversationFocus(hasConversation);
  const focusActive = hasConversation && !chromeRevealed;

  const targets = resolveGameTargets(meta?.platforms ?? [], meta?.platformMode ?? 'single', meta?.customPlatform);
  const engineText =
    meta?.engine === 'custom-engine' && meta?.customEngine
      ? meta.customEngine
      : engineLabel(meta?.engine ?? 'not-decided');
  const platformModeText =
    meta?.platformMode === 'all-platforms'
      ? 'All Platforms'
      : meta?.platformMode === 'cross-platform'
        ? 'Cross-Platform'
        : targets.length === 1
          ? targets[0].label
          : `${targets.length} targets`;

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(GAME_PANEL_PREF_KEY, next ? '1' : '0');
      } catch {
        /* Storage unavailable — the toggle still works for this session. */
      }
      return next;
    });
  };

  const handleNewChat = () => {
    const conv = chatStore.createConversation(game.id);
    projectStore.touchProject(game.id);
    setInput('');
    showToast('New conversation started', { type: 'gold' });
    return conv;
  };

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;
    let conv = activeConv;
    if (!conv) conv = handleNewChat();
    void chatStore.sendMessage(conv.id, value);
    projectStore.touchProject(game.id);
    setInput('');
  };

  // Opening a game restores its own conversation. The shared store keeps a
  // single active conversation, so if the active one belongs to a different
  // project this game's most recent chat is selected instead.
  useEffect(() => {
    const convs = chatStore.getProjectConversations(game.id);
    if (convs.length === 0) return;
    if (!convs.some((c) => c.id === chatState.activeId)) {
      chatStore.setActive(convs[0].id);
    }
  }, [game.id, chatState.activeId, chatState.conversations]);

  const handleDeleteChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = gameConversations.find((c) => c.id === convId);
    if (!window.confirm(`Delete conversation "${conv?.title ?? ''}"? This cannot be undone.`)) return;
    const remaining = gameConversations.filter((c) => c.id !== convId);
    chatStore.deleteConversation(convId);
    // Stay in the game: open the next remaining chat, or fall back to empty.
    if (remaining.length > 0) chatStore.setActive(remaining[0].id);
    showToast('Conversation deleted', { type: 'info' });
  };

  return (
    <div
      className={`project-workspace game-workspace ${focusActive ? 'focus-active' : ''}`}
      ref={containerRef}
    >
      <header className="project-workspace-header">
        <button type="button" className="project-back-btn" onClick={onBack}>
          <ChevronLeft size={15} aria-hidden="true" />
          <span>Games</span>
        </button>
        <div className="project-workspace-title-group">
          <h2 className="t-h3 project-workspace-title">{game.name}</h2>
          <div className="project-workspace-meta">
            <span className="project-type-badge">Game project</span>
            <span className="project-platform-badge" title="Preferred engine">
              {engineText}
            </span>
            <span className="project-platform-badge" title="Target platform mode">
              {platformModeText}
            </span>
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
          onClick={() => setSettingsOpen(true)}
          title="Game settings, targets and testing"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Game Settings</span>
        </button>
        <button
          type="button"
          className="chat-action-btn"
          onClick={() => navigate('settings')}
          title="Configure model providers"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Model Config</span>
        </button>
      </header>

      <div className={`project-workspace-body ${panelOpen ? 'panel-open' : 'panel-collapsed'}`}>
        <aside className="project-chat-panel" aria-label="Game conversations" aria-expanded={panelOpen}>
          <div className="project-chat-panel-header">
            <button
              type="button"
              className="project-chat-disclosure"
              onClick={togglePanel}
              aria-expanded={panelOpen}
              aria-controls="game-chat-panel-content"
              title={panelOpen ? 'Collapse conversations' : 'Expand conversations'}
            >
              <ChevronRight
                size={15}
                className={`project-chat-disclosure-chevron ${panelOpen ? 'open' : ''}`}
                aria-hidden="true"
              />
              <span className="project-chat-panel-title">Conversations ({gameConversations.length})</span>
            </button>
            <button type="button" className="project-new-chat-btn" onClick={handleNewChat} title="New chat in this game">
              <Plus size={14} aria-hidden="true" />
              <span>New Chat</span>
            </button>
          </div>

          {panelOpen && (
            <div id="game-chat-panel-content" className="project-chat-panel-content">
              {gameConversations.length === 0 ? (
                <div className="project-chat-empty">
                  <p>No conversations yet in this game.</p>
                  <button type="button" className="gold-ghost-btn" onClick={handleNewChat}>
                    New Chat
                  </button>
                </div>
              ) : (
                <div className="project-chat-list">
                  {gameConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`project-chat-item ${conv.id === chatState.activeId ? 'active' : ''}`}
                      onClick={() => chatStore.setActive(conv.id)}
                    >
                      <MessageSquare size={13} className="project-chat-item-icon" aria-hidden="true" />
                      <span className="project-chat-item-title">{conv.title}</span>
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

        <section className="project-conversation-area" aria-label="Game conversation">
          {(game.description || meta?.visualStyle) && (
            <div className="project-brief-strip">
              {game.description && <span>{game.description}</span>}
              {meta?.mechanics && meta.mechanics.length > 0 && (
                <span className="project-brief-goal">
                  <strong>Mechanics:</strong> {meta.mechanics.slice(0, 4).map(mechanicLabel).join(', ')}
                  {meta.mechanics.length > 4 ? ` +${meta.mechanics.length - 4}` : ''}
                </span>
              )}
              {meta?.themes && meta.themes.length > 0 && (
                <span className="project-brief-stack">
                  <strong>World:</strong>{' '}
                  {meta.themes
                    .map((t) => (t === 'custom-world' && meta.customTheme ? meta.customTheme : themeLabel(t)))
                    .join(', ')}
                </span>
              )}
              {meta?.modes && meta.modes.length > 0 && (
                <span className="project-brief-stack">
                  <strong>Modes:</strong>{' '}
                  {meta.modes
                    .map((m) => (m === 'custom-game-mode' && meta.customMode ? meta.customMode : modeLabel(m)))
                    .join(', ')}
                </span>
              )}
            </div>
          )}

          <MessageList
            messages={activeConv?.messages ?? []}
            onRetry={() => activeConv && void chatStore.retry(activeConv.id)}
            emptyState={
              <div className="chat-empty-state">
                <div className="chat-empty-spark">
                  <Gamepad2 size={26} aria-hidden="true" />
                </div>
                <h3>{activeConv ? 'Start planning this game' : 'No conversation selected'}</h3>
                <p>
                  {activeConv
                    ? 'Describe a gameplay system, world, level or technical requirement to begin.'
                    : 'Create or select a conversation from the panel to begin planning this game.'}
                </p>
              </div>
            }
          />

          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            pending={isPending}
            onStop={() => activeConv && chatStore.stop(activeConv.id)}
            placeholder={`Message about ${game.name}… (Enter to send)`}
            notice={
              connected && connection ? (
                <span>Connected to {getProviderLabel(connection.provider)}. Responses are generated live.</span>
              ) : (
                <span>
                  Not connected. Add an API key in{' '}
                  <button type="button" className="chat-link-btn" onClick={() => navigate('settings')}>
                    Settings &gt; Connected Services
                  </button>{' '}
                  to enable live AI responses.
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

      {settingsOpen && (
        <GameSettingsPanel game={game} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
};
