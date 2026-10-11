import React, { useMemo, useState } from 'react';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Clock,
  MessageSquare,
  Trash2,
  AlertCircle,
  HardDrive,
  Cpu,
  MonitorSmartphone,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { ViewToggle } from '../../common/ViewToggle';
import { Dialog } from '../../common/Dialog';
import { EmptyState } from '../../common/EmptyState';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import {
  projectStore,
  useProjectStore,
  type GameMetadata,
  type Project,
} from '../../../services/projectStore';
import { chatStore, useChatStore } from '../../../services/chatStore';
import { GameCreationForm } from '../../games/GameCreationForm';
import { GameWorkspaceView } from '../../games/GameWorkspaceView';
import {
  initialGameCreateState,
  validateGameCreateState,
  type GameCreateState,
} from '../../../services/gameClassify';
import {
  engineLabel,
  mechanicLabel,
  MECHANIC_GROUPS,
  modeLabel,
  resolveGameTargets,
  themeLabel,
} from '../../../services/gameTaxonomy';

function formatUpdated(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function platformSummary(meta: GameMetadata | undefined): string {
  const mode = meta?.platformMode ?? 'single';
  if (mode === 'all-platforms') return 'All Platforms';
  if (mode === 'cross-platform') return 'Cross-Platform';
  const targets = resolveGameTargets(meta?.platforms ?? [], 'single', meta?.customPlatform);
  return targets.length > 0 ? targets.map((t) => t.label).join(', ') : 'No platform set';
}

/** Build persisted game metadata from the validated creation state. */
function toGameMetadata(s: GameCreateState): GameMetadata {
  return {
    mechanics: s.mechanics,
    themes: s.themes,
    customTheme: s.customTheme.trim() || undefined,
    modes: s.modes,
    customMode: s.customMode.trim() || undefined,
    multiplayerRequirements: s.multiplayerRequirements,
    engine: s.engine,
    customEngine: s.customEngine.trim() || undefined,
    platforms: s.platforms,
    platformMode: s.platformMode,
    customPlatform: s.customPlatform.trim() || undefined,
    visualStyle: s.visualStyle.trim() || undefined,
    instructions: s.instructions.trim() || undefined,
    languages: s.languages,
    dimensions: s.dimensions,
    rendering: s.rendering,
    physics: s.physics,
    ai: s.ai,
    procedural: s.procedural,
    audio: s.audio,
    animation: s.animation,
    input: s.input,
    accessibility: s.accessibility,
    saveLoad: s.saveLoad,
    performance: s.performance,
    targetHardware: s.targetHardware.trim() || undefined,
    assetRequirements: s.assetRequirements.trim() || undefined,
    buildPackaging: s.buildPackaging,
  };
}

/** First-message seed describing the created game so the workspace is useful. */
function buildSeedPrompt(game: Project): string {
  const m = game.game;
  const lines = [
    `I just created a game project called "${game.name}".`,
    `Concept: ${game.description}`,
    m?.mechanics && m.mechanics.length > 0 ? `Mechanics: ${m.mechanics.map(mechanicLabel).join(', ')}` : '',
    m?.themes && m.themes.length > 0
      ? `World: ${m.themes.map((t) => (t === 'custom-world' && m.customTheme ? m.customTheme : themeLabel(t))).join(', ')}`
      : '',
    m?.modes && m.modes.length > 0
      ? `Modes: ${m.modes.map((mo) => (mo === 'custom-game-mode' && m.customMode ? m.customMode : modeLabel(mo))).join(', ')}`
      : '',
    `Preferred engine: ${m?.engine === 'custom-engine' && m.customEngine ? m.customEngine : engineLabel(m?.engine ?? 'not-decided')}`,
    `Target platforms: ${platformSummary(m)}`,
    m?.instructions ? `Additional instructions: ${m.instructions}` : '',
    '',
    'Help me plan this game: suggest a game design document outline, core gameplay systems and a technical plan for the chosen engine. Do not claim any code, assets or a playable build exist — those are not connected in this build.',
  ];
  return lines.filter(Boolean).join('\n');
}

/**
 * Games — the dedicated game-development workspace.
 *
 * Lists real, persisted game projects (records with `isGame`), provides search,
 * filtering and sorting, a full Create-a-New-Game workflow covering the 13
 * gameplay-mechanic categories, 15 world themes, 11 game modes, engine choice
 * and target platforms, and per-game access to the game workspace. Games never
 * appear in the general Projects list, and this view never shows fabricated
 * games, builds or playable previews.
 */
export const GamesWorkspace: React.FC = () => {
  const { routeParams, navigate } = useWorkspace();
  const { showToast } = useToast();
  const { projects } = useProjectStore();
  const chatState = useChatStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [state, setState] = useState<GameCreateState>(initialGameCreateState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const games = useMemo(() => projects.filter((p) => p.isGame), [projects]);
  const chatCountByGame = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of chatState.conversations) {
      if (c.projectId) map.set(c.projectId, (map.get(c.projectId) ?? 0) + 1);
    }
    return map;
  }, [chatState.conversations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games
      .filter((g) => {
        if (mechanicFilter !== 'all') {
          const group = MECHANIC_GROUPS.find((m) => m.id === mechanicFilter);
          const groupValues = new Set(group?.options.map((o) => o.value) ?? []);
          if (!(g.game?.mechanics ?? []).some((m) => groupValues.has(m))) return false;
        }
        if (platformFilter !== 'all') {
          const mode = g.game?.platformMode ?? 'single';
          if (platformFilter === 'all-platforms' && mode !== 'all-platforms') return false;
          if (platformFilter === 'cross-platform' && mode !== 'cross-platform') return false;
          if (
            platformFilter === 'single-web' &&
            !(mode === 'single' && (g.game?.platforms ?? []).includes('web-browser'))
          )
            return false;
          if (
            platformFilter === 'mobile' &&
            !(g.game?.platforms ?? []).some((v) => v === 'android' || v === 'ios')
          )
            return false;
        }
        if (q && !g.name.toLowerCase().includes(q) && !(g.description ?? '').toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (sortBy === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [games, query, mechanicFilter, platformFilter, sortBy]);

  const openGameRecord = routeParams.id ? games.find((g) => g.id === routeParams.id) : undefined;

  const resetForm = () => {
    setState(initialGameCreateState);
    setError('');
  };

  const patch = (p: Partial<GameCreateState>) => {
    setState((prev) => ({ ...prev, ...p }));
    if (error) setError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const problem = validateGameCreateState(state);
    if (problem) {
      setError(problem);
      return;
    }
    if (games.some((g) => g.name.toLowerCase() === state.name.trim().toLowerCase())) {
      setError('A game with this name already exists. Choose a different name.');
      return;
    }
    setIsSubmitting(true);
    const game = projectStore.createGame({
      name: state.name,
      description: state.description,
      goal: state.instructions,
      game: toGameMetadata(state),
    });
    // Seed a real first planning conversation so the workspace opens ready to
    // work. The record is genuinely persisted; no game is "generated".
    const conv = chatStore.createConversation(game.id);
    setIsSubmitting(false);
    setIsCreateOpen(false);
    resetForm();
    showToast(`Game project "${game.name}" created`, { type: 'success' });
    void chatStore.sendMessage(conv.id, buildSeedPrompt(game));
    navigate('games', { id: game.id });
  };

  const handleDeleteGame = (game: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Delete game "${game.name}"? Its conversations will also be removed. This cannot be undone.`
      )
    ) {
      chatStore.deleteProjectConversations(game.id);
      projectStore.deleteProject(game.id);
      showToast('Game deleted', { type: 'info' });
    }
  };

  if (openGameRecord) {
    return <GameWorkspaceView game={openGameRecord} onBack={() => navigate('games')} />;
  }

  return (
    <div className="workspace-page-container games-workspace-page">
      <WorkspaceHeader
        title="Games"
        description="Each game is a persistent workspace with its own conversations, mechanics, world and target platforms."
        icon={Gamepad2}
        badge={`${games.length} Saved`}
        actions={
          <button type="button" className="gold-primary-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={15} />
            <span>Create a New Game</span>
          </button>
        }
      />

      <div className="workspace-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="toolbar-search-input field-integrated"
            placeholder="Search games or concepts…"
            aria-label="Search games"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <Filter size={13} className="select-icon" aria-hidden="true" />
            <select
              className="toolbar-select"
              value={mechanicFilter}
              onChange={(e) => setMechanicFilter(e.target.value)}
              aria-label="Filter by gameplay mechanic"
            >
              <option value="all">All mechanics</option>
              {MECHANIC_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              aria-label="Filter by platform"
            >
              <option value="all">All targets</option>
              <option value="all-platforms">All Platforms</option>
              <option value="cross-platform">Cross-Platform</option>
              <option value="single-web">Web</option>
              <option value="mobile">Android / iOS</option>
            </select>
          </div>

          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
              aria-label="Sort games"
            >
              <option value="updated">Recent Activity</option>
              <option value="name">Game Name (A-Z)</option>
            </select>
          </div>

          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      <div className="workspace-storage-callout">
        <HardDrive size={13} className="callout-icon" aria-hidden="true" />
        <span>
          Games and their conversations are stored in this browser&apos;s local storage on this device.
          They persist across reloads in this browser only — not on a server.
        </span>
      </div>

      <div className="workspace-content-area">
        {games.length === 0 ? (
          <EmptyState
            icon={Gamepad2}
            title="No games yet"
            description="Create your first game project to capture its gameplay mechanics, world, modes and target platforms, and open a workspace to plan it."
            actionLabel="Create a New Game"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No matching games"
            description="Adjust your search or filters to find a game project."
          />
        ) : viewMode === 'grid' ? (
          <div className="games-grid">
            {filtered.map((g) => (
              <article key={g.id} className="game-card" onClick={() => navigate('games', { id: g.id })}>
                <header className="game-card-head">
                  <h3 className="game-card-name">{g.name}</h3>
                  <button
                    type="button"
                    className="row-action-btn danger"
                    onClick={(e) => handleDeleteGame(g, e)}
                    title="Delete game"
                    aria-label={`Delete game ${g.name}`}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </header>
                <p className="game-card-desc">{g.description || 'No description yet.'}</p>
                <div className="game-card-meta">
                  <span className="game-meta-row">
                    <Gamepad2 size={12} aria-hidden="true" />
                    <span className="game-meta-key">Mechanics</span>
                    <span className="game-meta-val">
                      {g.game?.mechanics && g.game.mechanics.length > 0
                        ? g.game.mechanics.slice(0, 2).map(mechanicLabel).join(', ') +
                          (g.game.mechanics.length > 2 ? ` +${g.game.mechanics.length - 2}` : '')
                        : 'Not set'}
                    </span>
                  </span>
                  <span className="game-meta-row">
                    <Cpu size={12} aria-hidden="true" />
                    <span className="game-meta-key">World</span>
                    <span className="game-meta-val">
                      {g.game?.themes && g.game.themes.length > 0
                        ? g.game.themes.slice(0, 2).map(themeLabel).join(', ') +
                          (g.game.themes.length > 2 ? ` +${g.game.themes.length - 2}` : '')
                        : 'Not set'}
                    </span>
                  </span>
                  <span className="game-meta-row">
                    <MonitorSmartphone size={12} aria-hidden="true" />
                    <span className="game-meta-key">Targets</span>
                    <span className="game-meta-val">{platformSummary(g.game)}</span>
                  </span>
                </div>
                <div className="game-card-footer">
                  <span className="game-card-engine">
                    {g.game?.engine === 'custom-engine' && g.game.customEngine
                      ? g.game.customEngine
                      : engineLabel(g.game?.engine ?? 'not-decided')}
                  </span>
                  <div className="game-card-stats">
                    <span className="game-meta-item">
                      <Clock size={12} aria-hidden="true" />
                      {formatUpdated(g.updatedAt)}
                    </span>
                    <span className="game-meta-item">
                      <MessageSquare size={12} aria-hidden="true" />
                      {chatCountByGame.get(g.id) ?? 0} chats
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="projects-list-table">
            <div className="table-header-row">
              <span className="col-name">Game</span>
              <span className="col-cat">Engine</span>
              <span className="col-updated">Updated</span>
              <span className="col-actions">Actions</span>
            </div>
            {filtered.map((g) => (
              <div key={g.id} className="table-body-row" onClick={() => navigate('games', { id: g.id })}>
                <div className="col-name">
                  <span className="row-proj-title">{g.name}</span>
                  <span className="row-proj-sub">{g.description || platformSummary(g.game)}</span>
                </div>
                <div className="col-cat">
                  {g.game?.engine === 'custom-engine' && g.game.customEngine
                    ? g.game.customEngine
                    : engineLabel(g.game?.engine ?? 'not-decided')}
                </div>
                <div className="col-updated">{formatUpdated(g.updatedAt)}</div>
                <div className="col-actions">
                  <button
                    type="button"
                    className="row-action-btn danger"
                    onClick={(e) => handleDeleteGame(g, e)}
                    aria-label={`Delete game ${g.name}`}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Create a New Game"
        description="Define the concept, mechanics, world, modes, engine and target platforms. Only the starred fields are required."
        maxWidth="720px"
      >
        <form className="dialog-form" onSubmit={handleCreate}>
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <GameCreationForm state={state} onChange={patch} />
          <div className="form-actions-row">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="gold-primary-btn" disabled={isSubmitting}>
              <Plus size={15} />
              <span>Create &amp; Open Game</span>
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
