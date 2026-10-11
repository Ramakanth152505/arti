import React, { useMemo, useState } from 'react';
import {
  Folder,
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  AlertCircle,
  HardDrive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { ViewToggle } from '../../common/ViewToggle';
import { Dialog } from '../../common/Dialog';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { MessageList } from '../../conversation/MessageList';
import { Composer } from '../../conversation/Composer';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import {
  projectStore,
  useProjectStore,
  PROJECT_TYPES,
  getProjectTypeOption,
  type Project,
  type ProjectType,
} from '../../../services/projectStore';
import { chatStore, useChatStore } from '../../../services/chatStore';
import { getConnection, isAiConfigured, getProviderLabel } from '../../../services/aiService';
import { resolveTargets } from '../../../services/projectStore';
import { ProjectSettingsPanel } from '../../software/ProjectSettingsPanel';

/* ==========================================================================
   Projects overview
   ========================================================================== */

export const ProjectsWorkspace: React.FC = () => {
  const { routeParams, navigate } = useWorkspace();
  const { showToast } = useToast();
  const { projects, isDemo } = useProjectStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProjectType>('web-application');
  const [formCustomType, setFormCustomType] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formStack, setFormStack] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openProject = (project: Project) => {
    navigate('projects', { id: project.id });
  };

  const resetForm = () => {
    setFormName('');
    setFormType('web-application');
    setFormCustomType('');
    setFormDesc('');
    setFormGoal('');
    setFormStack('');
    setFormNotes('');
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against double submission
    const name = formName.trim();
    if (!name) {
      setFormError('Project name is required.');
      return;
    }
    const duplicate = projects.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setFormError('A project with this name already exists.');
      return;
    }
    if (formType === 'custom' && !formCustomType.trim()) {
      setFormError('Please describe the custom project type.');
      return;
    }
    setIsSubmitting(true);
    const project = projectStore.createProject({
      name,
      type: formType,
      customType: formType === 'custom' ? formCustomType : undefined,
      description: formDesc,
      goal: formGoal,
      techStack: formStack,
      notes: formNotes,
    });
    setIsSubmitting(false);
    setIsCreateOpen(false);
    resetForm();
    showToast(`Project "${project.name}" created`, { type: 'success' });
    navigate('projects', { id: project.id });
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Delete project "${project.name}"? Its conversations will also be removed. This cannot be undone.`
      )
    ) {
      chatStore.deleteProjectConversations(project.id);
      projectStore.deleteProject(project.id);
      showToast('Project deleted', { type: 'info' });
    }
  };

  const filteredProjects = useMemo(
    () =>
      projects
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.goal.toLowerCase().includes(q) ||
            p.techStack.toLowerCase().includes(q);
          const matchesType = typeFilter === 'All' || p.type === typeFilter;
          return matchesSearch && matchesType;
        })
        .sort((a, b) => {
          if (sortBy === 'name') return a.name.localeCompare(b.name);
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [projects, searchQuery, typeFilter, sortBy]
  );

  const openProjectRecord = routeParams.id
    ? projects.find((p) => p.id === routeParams.id)
    : undefined;

  if (openProjectRecord) {
    return <ProjectWorkspaceView project={openProjectRecord} onBack={() => navigate('projects')} />;
  }

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Projects"
        description="Each project is a persistent workspace with its own conversations, brief, and notes."
        icon={Folder}
        badge={`${projects.length} Saved`}
        actions={
          <button type="button" className="gold-primary-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={15} />
            <span>Create Project</span>
          </button>
        }
      />

      {/* Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input field-integrated"
            placeholder="Search projects, goals, or stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <Filter size={13} className="select-icon" />
            <select
              className="toolbar-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
            >
              <option value="updated">Recent Activity</option>
              <option value="name">Project Name (A-Z)</option>
            </select>
          </div>

          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      <div className="workspace-storage-callout">
        <HardDrive size={13} className="callout-icon" />
        <span>
          Projects and their conversations are stored in this browser&apos;s local storage on this
          device. They persist across reloads in this browser only — not on a server.
        </span>
      </div>

      {isDemo && (
        <DemoDataNotice
          message="These example projects are placeholders, not real saved work. Create a project to start your own list."
          onClear={() => projectStore.clearDemo()}
        />
      )}

      <div className="workspace-content-area">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title={projects.length === 0 ? 'No projects yet' : 'No projects match your filter'}
            description={
              projects.length === 0
                ? 'Create your first project to organise conversations, briefs, and notes around a single goal.'
                : 'Adjust your search or type filter to find a project.'
            }
            actionLabel="Create Project"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="projects-grid">
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="project-card" onClick={() => openProject(proj)}>
                <div className="project-card-header">
                  <div className="project-card-category-tag">
                    {proj.type === 'custom' && proj.customType
                      ? proj.customType
                      : getProjectTypeOption(proj.type).label}
                  </div>
                  <div className="project-card-header-actions">
                    <button
                      type="button"
                      className={`star-btn ${proj.isStarred ? 'starred' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        projectStore.toggleStar(proj.id);
                      }}
                      title={proj.isStarred ? 'Unstar project' : 'Star project'}
                      aria-label={proj.isStarred ? 'Unstar project' : 'Star project'}
                    >
                      <Star size={14} />
                    </button>
                    <button
                      type="button"
                      className="row-action-btn danger"
                      onClick={(e) => handleDeleteProject(proj, e)}
                      title="Delete project"
                      aria-label="Delete project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="project-card-name">{proj.name}</h3>
                <p className="project-card-desc">
                  {proj.description || proj.goal || 'No description yet.'}
                </p>

                <div className="project-card-footer">
                  <div className="project-meta-item">
                    <Clock size={12} />
                    <span>{formatUpdated(proj.updatedAt)}</span>
                  </div>
                  <div className="project-meta-stats">
                    <MessageSquare size={12} />
                    <span>{chatStore.getProjectConversations(proj.id).length} chats</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="projects-list-table">
            <div className="table-header-row">
              <span className="col-name">Project</span>
              <span className="col-cat">Type</span>
              <span className="col-updated">Updated</span>
              <span className="col-actions">Actions</span>
            </div>
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="table-body-row" onClick={() => openProject(proj)}>
                <div className="col-name">
                  <span className="row-proj-title">{proj.name}</span>
                  <span className="row-proj-sub">{proj.description || proj.goal}</span>
                </div>
                <div className="col-cat">
                  {proj.type === 'custom' && proj.customType
                    ? proj.customType
                    : getProjectTypeOption(proj.type).label}
                </div>
                <div className="col-updated">{formatUpdated(proj.updatedAt)}</div>
                <div className="col-actions">
                  <button
                    type="button"
                    className="row-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      projectStore.toggleStar(proj.id);
                    }}
                    aria-label="Star project"
                  >
                    <Star size={13} className={proj.isStarred ? 'starred' : ''} />
                  </button>
                  <button
                    type="button"
                    className="row-action-btn danger"
                    onClick={(e) => handleDeleteProject(proj, e)}
                    aria-label="Delete project"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setFormError('');
        }}
        title="Create Project"
        description="Name the project, choose its type, and (optionally) add a brief."
      >
        <form onSubmit={handleCreateSubmit} className="dialog-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="proj-name">
              Project name *
            </label>
            <input
              id="proj-name"
              type="text"
              className="form-input"
              placeholder="e.g. Autonomous Agent Dispatcher"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formError) setFormError('');
              }}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="proj-type">
              Project type
            </label>
            <select
              id="proj-type"
              className="form-select"
              value={formType}
              onChange={(e) => setFormType(e.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="form-hint">{getProjectTypeOption(formType).capability}</p>
          </div>

          {formType === 'custom' && (
            <div className="form-field">
              <label className="form-label" htmlFor="proj-custom">
                Custom type *
              </label>
              <input
                id="proj-custom"
                type="text"
                className="form-input"
                placeholder="Describe your project type..."
                value={formCustomType}
                onChange={(e) => setFormCustomType(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="proj-desc">
              Description
            </label>
            <textarea
              id="proj-desc"
              className="form-textarea"
              rows={2}
              placeholder="Brief description of the project..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="proj-goal">
              Initial goal / requirements
            </label>
            <textarea
              id="proj-goal"
              className="form-textarea"
              rows={2}
              placeholder="What should this project achieve?"
              value={formGoal}
              onChange={(e) => setFormGoal(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="proj-stack">
              Preferred technology stack
            </label>
            <input
              id="proj-stack"
              type="text"
              className="form-input"
              placeholder="e.g. React, TypeScript, Postgres"
              value={formStack}
              onChange={(e) => setFormStack(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="proj-notes">
              Additional notes
            </label>
            <textarea
              id="proj-notes"
              className="form-textarea"
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="form-actions-row">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => {
                setIsCreateOpen(false);
                setFormError('');
              }}
            >
              Cancel
            </button>
            <button type="submit" className="gold-primary-btn" disabled={isSubmitting}>
              Create Project
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

/* ==========================================================================
   Project workspace — project details + project-scoped conversations
   ========================================================================== */

interface ProjectWorkspaceViewProps {
  project: Project;
  onBack: () => void;
}

const PROJECT_PANEL_PREF_KEY = 'arti_project_chat_panel_open';

/** Conversation panel starts collapsed; the user's last choice is restored. */
function loadPanelOpenPref(): boolean {
  try {
    return localStorage.getItem(PROJECT_PANEL_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

const ProjectWorkspaceView: React.FC<ProjectWorkspaceViewProps> = ({ project, onBack }) => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const chatState = useChatStore();
  const [input, setInput] = useState('');
  const [panelOpen, setPanelOpen] = useState<boolean>(loadPanelOpenPref);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PROJECT_PANEL_PREF_KEY, next ? '1' : '0');
      } catch {
        /* Storage unavailable — the toggle still works for this session. */
      }
      return next;
    });
  };

  const projectConversations = chatState.conversations.filter((c) => c.projectId === project.id);
  const activeConv = projectConversations.find((c) => c.id === chatState.activeId);
  const isPending = activeConv ? chatState.pendingIds.includes(activeConv.id) : false;
  const connected = isAiConfigured();
  const connection = getConnection();
  const typeLabel =
    project.type === 'custom' && project.customType
      ? project.customType
      : getProjectTypeOption(project.type).label;

  const handleNewChat = () => {
    const conv = chatStore.createConversation(project.id);
    projectStore.touchProject(project.id);
    setInput('');
    showToast('New conversation started', { type: 'gold' });
    return conv;
  };

  const handleSubmit = (value: string) => {
    if (!value.trim()) return;
    let conv = activeConv;
    if (!conv) conv = handleNewChat();
    void chatStore.sendMessage(conv.id, value);
    projectStore.touchProject(project.id);
    setInput('');
  };

  const handleDeleteChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = projectConversations.find((c) => c.id === convId);
    if (!window.confirm(`Delete conversation "${conv?.title ?? ''}"? This cannot be undone.`)) return;
    const remaining = projectConversations.filter((c) => c.id !== convId);
    chatStore.deleteConversation(convId);
    // Keep the user in this project: open the next remaining chat, or fall back
    // to the project's empty state when none are left.
    if (remaining.length > 0) chatStore.setActive(remaining[0].id);
    showToast('Conversation deleted', { type: 'info' });
  };

  return (
    <div className="project-workspace">
      <header className="project-workspace-header">
        <button type="button" className="project-back-btn" onClick={onBack}>
          <ChevronLeft size={15} aria-hidden="true" />
          <span>Projects</span>
        </button>
        <div className="project-workspace-title-group">
          <h2 className="t-h3 project-workspace-title">{project.name}</h2>
          <div className="project-workspace-meta">
            <span className="project-type-badge">{typeLabel}</span>
            {project.isSoftware && project.platformMode && (
              <span className="project-platform-badge" title="Target platform mode">
                {project.platformMode === 'all-platforms'
                  ? 'All Platforms'
                  : project.platformMode === 'cross-platform'
                    ? 'Cross-Platform'
                    : resolveTargets(project.platforms ?? [], 'single', project.customPlatform)[0]?.label ??
                      'Single platform'}
              </span>
            )}
            <span className="chat-private-pill">
              <ShieldCheck size={11} aria-hidden="true" />
              Local Browser Only
            </span>
          </div>
        </div>
        <button
          type="button"
          className="chat-action-btn"
          onClick={() => setSettingsOpen(true)}
          title="Project settings and testing"
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Project Settings</span>
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
        <aside
          className="project-chat-panel"
          aria-label="Project conversations"
          aria-expanded={panelOpen}
        >
          <div className="project-chat-panel-header">
            <button
              type="button"
              className="project-chat-disclosure"
              onClick={togglePanel}
              aria-expanded={panelOpen}
              aria-controls="project-chat-panel-content"
              title={panelOpen ? 'Collapse conversations' : 'Expand conversations'}
            >
              <ChevronRight
                size={15}
                className={`project-chat-disclosure-chevron ${panelOpen ? 'open' : ''}`}
                aria-hidden="true"
              />
              <span className="project-chat-panel-title">
                Conversations ({projectConversations.length})
              </span>
            </button>
            <button
              type="button"
              className="project-new-chat-btn"
              onClick={handleNewChat}
              title="New chat in this project"
            >
              <Plus size={14} aria-hidden="true" />
              <span>New Chat</span>
            </button>
          </div>

          {panelOpen && (
            <div id="project-chat-panel-content" className="project-chat-panel-content">
              {projectConversations.length === 0 ? (
                <div className="project-chat-empty">
                  <p>No conversations yet in this project.</p>
                  <button type="button" className="gold-ghost-btn" onClick={handleNewChat}>
                    New Chat
                  </button>
                </div>
              ) : (
                <div className="project-chat-list">
                  {projectConversations.map((conv) => (
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

        <section className="project-conversation-area" aria-label="Project conversation">
          {(project.description || project.goal || project.techStack) && (
            <div className="project-brief-strip">
              {project.description && <span>{project.description}</span>}
              {project.goal && (
                <span className="project-brief-goal">
                  <strong>Goal:</strong> {project.goal}
                </span>
              )}
              {project.techStack && (
                <span className="project-brief-stack">
                  <strong>Stack:</strong> {project.techStack}
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
                  <Sparkles size={26} aria-hidden="true" />
                </div>
                <h3>{activeConv ? 'Start this conversation' : 'No conversation selected'}</h3>
                <p>
                  {activeConv
                    ? 'Send the first message to begin working inside this project.'
                    : 'Create or select a conversation from the panel to begin.'}
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
            placeholder={`Message about ${project.name}… (Enter to send)`}
            notice={
              connected && connection ? (
                <span>
                  Connected to {getProviderLabel(connection.provider)}. Responses are generated live.
                </span>
              ) : (
                <span>
                  Not connected. Add an API key in{' '}
                  <button
                    type="button"
                    className="chat-link-btn"
                    onClick={() => navigate('settings')}
                  >
                    Settings &gt; Connected Services
                  </button>{' '}
                  to enable live AI responses.
                </span>
              )
            }
          />
        </section>
      </div>

      {settingsOpen && (
        <ProjectSettingsPanel
          project={project}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};

function formatUpdated(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export { ProjectWorkspaceView };
