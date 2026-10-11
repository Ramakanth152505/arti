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
import { projectStore, useProjectStore, type PlatformMode } from '../../../services/projectStore';
import { chatStore } from '../../../services/chatStore';
import { SoftwareClassificationForm } from '../../software/SoftwareClassificationForm';
import {
  initialClassifyState,
  validateClassifyState,
  type SoftwareClassifyState,
} from '../../../services/softwareClassify';

/**
 * Create Software — the entry point to ARTI AI's software-creation workspace.
 *
 * Captures a real software brief with the two classifications (core functional
 * + technology/domain) and a target-platform configuration, then creates a real
 * persisted software project and opens its workspace. It does NOT compile, sign
 * or deploy software — no build toolchain or execution engine is connected, and
 * the UI states that honestly.
 */
export const CreateSoftwareWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();
  const { projects } = useProjectStore();
  // Games are excluded — they belong to the Games workspace, not Projects.
  const generalProjects = projects.filter((p) => !p.isGame);

  const [state, setState] = useState<SoftwareClassifyState>(initialClassifyState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    showToast(`Software project "${project.name}" created`, { type: 'success' });
    if (state.requirements.trim()) {
      void chatStore.sendMessage(conv.id, state.requirements.trim());
    }
    navigate('projects', { id: project.id });
  };

  return (
    <div className="workspace-page-container create-software-page">
      <WorkspaceHeader
        title="Create Software"
        description="Brief a software idea, classify it, choose its targets, and open a real project workspace."
        icon={Code2}
        badge="Project foundation"
        actions={
          <button type="button" className="gold-ghost-btn" onClick={() => navigate('apps')}>
            <Folder size={14} />
            <span>Apps</span>
          </button>
        }
      />

      <div className="software-capability-banner" role="note">
        <Sparkles size={14} className="software-capability-icon" aria-hidden="true" />
        <span>
          ARTI AI captures your software brief and opens a project workspace to plan it. Generating,
          compiling, signing, or deploying working software is <strong>not</strong> connected in this
          build — the plan and metadata are real, the automated build is not.
        </span>
      </div>

      <div className="create-software-grid">
        <form className="software-brief-card" onSubmit={handleCreate}>
          <h2 className="software-section-title">New software project</h2>
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <SoftwareClassificationForm state={state} onChange={patch} />
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

        <div className="software-side-column">
          <div className="software-existing-card">
            <h2 className="software-section-title">Continue an existing project</h2>
            {generalProjects.length === 0 ? (
              <p className="software-types-note">
                No projects yet. Create one from the brief to get started.
              </p>
            ) : (
              <ul className="software-existing-list">
                {generalProjects.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="software-existing-item"
                      onClick={() => navigate('projects', { id: p.id })}
                    >
                      <ExternalLink size={13} aria-hidden="true" />
                      <span className="software-existing-name">{p.name}</span>
                      <span className="software-existing-type">
                        {p.isSoftware ? 'Software' : 'Project'}
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
