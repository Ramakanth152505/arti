import React, { useMemo, useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Search,
  AlertCircle,
  Settings2,
  ArrowRight,
  Cpu,
  Boxes,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { EmptyState } from '../../common/EmptyState';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import {
  projectStore,
  useProjectStore,
  CORE_CATEGORIES,
  DOMAIN_CATEGORIES,
  resolveTargets,
  type Project,
  type PlatformMode,
} from '../../../services/projectStore';
import { chatStore } from '../../../services/chatStore';
import { SoftwareClassificationForm } from '../../software/SoftwareClassificationForm';
import {
  initialClassifyState,
  validateClassifyState,
  type SoftwareClassifyState,
} from '../../../services/softwareClassify';
import { ProjectSettingsPanel } from '../../software/ProjectSettingsPanel';

const coreLabel = (value?: string) =>
  CORE_CATEGORIES.find((c) => c.value === value)?.label ?? 'Unclassified';

const domainLabel = (value: string) =>
  DOMAIN_CATEGORIES.find((c) => c.value === value)?.label ?? value;

function platformSummary(project: Project): string {
  const mode = project.platformMode ?? 'single';
  if (mode === 'all-platforms') return 'All Platforms';
  if (mode === 'cross-platform') return 'Cross-Platform';
  const targets = resolveTargets(project.platforms ?? [], 'single', project.customPlatform);
  return targets.length > 0 ? targets.map((t) => t.label).join(', ') : 'No platform set';
}

/**
 * Apps — the software-creation and software-project management workspace.
 *
 * Lists real, persisted software projects (records with `isSoftware`), provides
 * search and filtering, a full Create New Software workflow with both
 * classification categories and target-platform configuration, and per-project
 * access to Project Settings / Perform Tests. It never shows fabricated project
 * counts or generated artifacts.
 */
export const AppsWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const { projects } = useProjectStore();

  const [query, setQuery] = useState('');
  const [coreFilter, setCoreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [settingsFor, setSettingsFor] = useState<Project | null>(null);

  const [state, setState] = useState<SoftwareClassifyState>(initialClassifyState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const softwareProjects = useMemo(() => projects.filter((p) => p.isSoftware), [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return softwareProjects.filter((p) => {
      if (coreFilter !== 'all' && p.coreClassification !== coreFilter) return false;
      if (platformFilter !== 'all') {
        const mode = p.platformMode ?? 'single';
        if (platformFilter === 'all-platforms' && mode !== 'all-platforms') return false;
        if (platformFilter === 'cross-platform' && mode !== 'cross-platform') return false;
        if (
          platformFilter === 'single-web' &&
          !(mode === 'single' && (p.platforms ?? []).includes('web-browser'))
        )
          return false;
        if (
          platformFilter === 'mobile' &&
          !(p.platforms ?? []).some((v) => v === 'android' || v === 'ios')
        )
          return false;
      }
      if (q && !p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [softwareProjects, query, coreFilter, platformFilter]);

  const resetForm = () => {
    setState(initialClassifyState);
    setError('');
  };

  const patch = (p: Partial<SoftwareClassifyState>) => {
    setState((prev) => ({ ...prev, ...p }));
    if (error) setError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const problem = validateClassifyState(state);
    if (problem) {
      setError(problem);
      return;
    }
    if (projects.some((p) => p.name.toLowerCase() === state.name.trim().toLowerCase())) {
      setError('A project with this name already exists. Choose a different name.');
      return;
    }
    setIsSubmitting(true);
    const project = projectStore.createProject({
      name: state.name,
      type: 'custom',
      customType: 'Software project',
      isSoftware: true,
      description: state.description,
      goal: state.requirements,
      techStack: state.stack,
      stackPreference: state.stack,
      coreClassification: state.core,
      coreCustom: state.coreCustom,
      domains: state.domains,
      domainCustom: state.domainCustom,
      platforms: state.platforms,
      platformMode: state.platformMode as PlatformMode,
      customPlatform: state.customPlatform,
    });
    const conv = chatStore.createConversation(project.id);
    setIsSubmitting(false);
    setIsCreateOpen(false);
    showToast(`Software project "${project.name}" created`, { type: 'success' });
    if (state.requirements.trim()) {
      void chatStore.sendMessage(conv.id, state.requirements.trim());
    }
    resetForm();
    navigate('projects', { id: project.id });
  };

  return (
    <div className="workspace-page-container apps-workspace-page">
      <WorkspaceHeader
        title="Apps"
        description="Create and manage software projects — classifications, target platforms, planning and testing."
        icon={LayoutGrid}
        badge="Software workspace"
        actions={
          <button type="button" className="gold-primary-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={15} />
            <span>Create New Software</span>
          </button>
        }
      />

      <div className="apps-toolbar">
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="toolbar-search-input field-integrated"
            placeholder="Search software projects…"
            aria-label="Search software projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="apps-filter-field">
          <span className="apps-filter-label">Core</span>
          <select
            className="form-select apps-filter-select"
            value={coreFilter}
            onChange={(e) => setCoreFilter(e.target.value)}
          >
            <option value="all">All classifications</option>
            {CORE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="apps-filter-field">
          <span className="apps-filter-label">Platform</span>
          <select
            className="form-select apps-filter-select"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All targets</option>
            <option value="all-platforms">All Platforms</option>
            <option value="cross-platform">Cross-Platform</option>
            <option value="single-web">Web</option>
            <option value="mobile">Android / iOS</option>
          </select>
        </label>
      </div>

      {softwareProjects.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No software projects yet"
          description="Create your first software project to capture its classification, technology domain and target platforms."
          actionLabel="Create New Software"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No matching software projects"
          description="Adjust your search or filters to find a software project."
        />
      ) : (
        <div className="apps-project-grid">
          {filtered.map((p) => (
            <article key={p.id} className="apps-project-card">
              <header className="apps-project-card-head">
                <h3 className="apps-project-name">{p.name}</h3>
                <span className="apps-platform-pill">{platformSummary(p)}</span>
              </header>
              {p.description && <p className="apps-project-desc">{p.description}</p>}
              <div className="apps-project-meta">
                <span className="apps-meta-row">
                  <Cpu size={12} aria-hidden="true" />
                  <span className="apps-meta-key">Core</span>
                  <span className="apps-meta-val">
                    {p.coreClassification === 'custom-other' && p.coreCustom
                      ? p.coreCustom
                      : coreLabel(p.coreClassification)}
                  </span>
                </span>
                <span className="apps-meta-row">
                  <Boxes size={12} aria-hidden="true" />
                  <span className="apps-meta-key">Domain</span>
                  <span className="apps-meta-val">
                    {p.domains && p.domains.length > 0
                      ? p.domains
                          .slice(0, 3)
                          .map((d) =>
                            d === 'custom-other' && p.domainCustom ? p.domainCustom : domainLabel(d)
                          )
                          .join(', ') + (p.domains.length > 3 ? ` +${p.domains.length - 3}` : '')
                      : 'Not set'}
                  </span>
                </span>
              </div>
              <div className="apps-project-actions">
                <button type="button" className="gold-ghost-btn" onClick={() => setSettingsFor(p)}>
                  <Settings2 size={13} aria-hidden="true" />
                  <span>Settings &amp; Tests</span>
                </button>
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={() => navigate('projects', { id: p.id })}
                >
                  <span>Open</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Create New Software"
        description="Classify the software, choose its technology domain and target platforms."
      >
        <form className="dialog-form" onSubmit={handleCreate}>
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <SoftwareClassificationForm state={state} onChange={patch} />
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
              <span>Create &amp; Open Project</span>
            </button>
          </div>
        </form>
      </Dialog>

      {settingsFor && (
        <ProjectSettingsPanel project={settingsFor} onClose={() => setSettingsFor(null)} />
      )}
    </div>
  );
};
