import React, { useState } from 'react';
import {
  Code2,
  Plus,
  AlertCircle,
  ArrowRight,
  Folder,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import {
  projectStore,
  useProjectStore,
  PROJECT_TYPES,
  getProjectTypeOption,
  type ProjectType,
} from '../../../services/projectStore';
import { chatStore } from '../../../services/chatStore';

/**
 * Create Software — the entry point to ARTI AI's software-creation workspace.
 *
 * This is a real brief-and-plan foundation: it captures a software brief, lets
 * the user pick a target project type (with an honest capability note), and
 * creates or opens a real project in the Projects workspace. It does NOT claim
 * to compile, sign, or deploy software — no build toolchain or execution engine
 * is connected in this build, and the UI says so.
 */
export const CreateSoftwareWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const { projects } = useProjectStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('web-application');
  const [customType, setCustomType] = useState('');
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedType = getProjectTypeOption(type);
  const customTypeMissing = type === 'custom' && !customType.trim();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const projectName = name.trim() || brief.trim().slice(0, 48) || 'Untitled Software Project';
    if (type === 'custom' && !customType.trim()) {
      setError('Describe your custom software type before continuing.');
      return;
    }
    if (projects.some((p) => p.name.toLowerCase() === projectName.toLowerCase())) {
      setError('A project with this name already exists. Choose a different name.');
      return;
    }
    setIsSubmitting(true);
    const project = projectStore.createProject({
      name: projectName,
      type,
      customType: type === 'custom' ? customType : undefined,
      goal: brief,
    });
    // Seed the project with a first planning conversation carrying the brief,
    // so software creation continues into a real project-scoped workspace.
    const conv = chatStore.createConversation(project.id);
    setIsSubmitting(false);
    showToast(`Software project "${project.name}" created`, { type: 'success' });
    if (brief.trim()) {
      void chatStore.sendMessage(conv.id, brief.trim());
    }
    navigate('projects', { id: project.id });
  };

  return (
    <div className="workspace-page-container create-software-page">
      <WorkspaceHeader
        title="Create Software"
        description="Brief a software idea, choose its target, and open a real project workspace to plan it."
        icon={Code2}
        badge="Project foundation"
        actions={
          <button type="button" className="gold-ghost-btn" onClick={() => navigate('projects')}>
            <Folder size={14} />
            <span>All Projects</span>
          </button>
        }
      />

      {/* Honest capability banner */}
      <div className="software-capability-banner" role="note">
        <Sparkles size={14} className="software-capability-icon" aria-hidden="true" />
        <span>
          ARTI AI captures your software brief and opens a project workspace to plan it. Generating,
          compiling, signing, or deploying working software is <strong>not</strong> connected in this
          build — the plan is real, the automated build is not.
        </span>
      </div>

      <div className="create-software-grid">
        {/* Brief form */}
        <form className="software-brief-card" onSubmit={handleCreate}>
          <h2 className="software-section-title">New software project</h2>

          {error && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="sw-name">
              Project name
            </label>
            <input
              id="sw-name"
              type="text"
              className="form-input"
              placeholder="e.g. Inventory Management App"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="sw-type">
              What are you building?
            </label>
            <select
              id="sw-type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="form-hint">{selectedType.capability}</p>
          </div>

          {customTypeMissing && (
            <div className="form-field">
              <label className="form-label" htmlFor="sw-custom">
                Custom software type *
              </label>
              <input
                id="sw-custom"
                type="text"
                className="form-input"
                placeholder="Describe what you are building..."
                value={customType}
                onChange={(e) => {
                  setCustomType(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="sw-brief">
              Software idea / requirements
            </label>
            <textarea
              id="sw-brief"
              className="form-textarea"
              rows={5}
              placeholder="Describe the software you want to create — purpose, key features, and any constraints."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </div>

          <div className="form-actions-row">
            <button type="button" className="gold-ghost-btn" onClick={() => navigate('projects')}>
              Cancel
            </button>
            <button type="submit" className="gold-primary-btn" disabled={isSubmitting}>
              <Plus size={15} />
              <span>Create &amp; Open Project</span>
            </button>
          </div>
        </form>

        {/* Project types reference + existing projects */}
        <div className="software-side-column">
          <div className="software-types-card">
            <h2 className="software-section-title">Project types</h2>
            <p className="software-types-note">
              Choose the closest target. Categories describe intent — not a guarantee that every
              target can be built or deployed automatically.
            </p>
            <ul className="software-types-list">
              {PROJECT_TYPES.map((t) => (
                <li
                  key={t.value}
                  className={`software-type-row ${t.value === type ? 'active' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  <span className="software-type-label">{t.label}</span>
                  <span className="software-type-cap">{t.capability}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="software-existing-card">
            <h2 className="software-section-title">Continue an existing project</h2>
            {projects.length === 0 ? (
              <p className="software-types-note">
                No projects yet. Create one from the brief to get started.
              </p>
            ) : (
              <ul className="software-existing-list">
                {projects.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="software-existing-item"
                      onClick={() => navigate('projects', { id: p.id })}
                    >
                      <ExternalLink size={13} aria-hidden="true" />
                      <span className="software-existing-name">{p.name}</span>
                      <span className="software-existing-type">
                        {p.type === 'custom' && p.customType
                          ? p.customType
                          : getProjectTypeOption(p.type).label}
                      </span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
