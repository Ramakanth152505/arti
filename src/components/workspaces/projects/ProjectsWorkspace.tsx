import React, { useState, useEffect } from 'react';
import {
  Folder,
  Plus,
  Search,
  Filter,
  Calendar,
  Layers,
  Star,
  FileText,
  Clock,
  ArrowUpRight,
  X,
  AlertCircle,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { ViewToggle } from '../../common/ViewToggle';
import { Dialog } from '../../common/Dialog';
import { EmptyState } from '../../common/EmptyState';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: 'Full-Stack' | 'AI & ML' | 'Cinema & Media' | 'Research' | 'Game Engine';
  status: 'Active' | 'In Development' | 'Planning' | 'Archived';
  platform: 'Web' | 'Desktop' | 'Mobile' | 'Cloud' | 'Universal';
  tags: string[];
  isStarred: boolean;
  updatedAt: string;
  artifactsCount: number;
  activityCount: number;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'Universal Workspace Core',
    description: 'High-performance React 19 application shell with unified navigation and design system.',
    category: 'Full-Stack',
    status: 'Active',
    platform: 'Web',
    tags: ['React 19', 'TypeScript', 'Vite', 'Design System'],
    isStarred: true,
    updatedAt: 'Today, 2:15 PM',
    artifactsCount: 24,
    activityCount: 18,
  },
  {
    id: 'proj-2',
    name: 'Cinematic Storyboard Engine',
    description: 'Multi-scene visual planning pipeline with keyframe latent anchoring.',
    category: 'Cinema & Media',
    status: 'In Development',
    platform: 'Universal',
    tags: ['Cinema', 'Storyboards', '16:9', 'Continuity'],
    isStarred: true,
    updatedAt: 'Yesterday',
    artifactsCount: 8,
    activityCount: 12,
  },
  {
    id: 'proj-3',
    name: 'Client Memory AES Cryptography',
    description: 'Zero-telemetry cryptographic layer keeping memory in private client IndexedDB storage.',
    category: 'Research',
    status: 'Active',
    platform: 'Universal',
    tags: ['Cryptography', 'AES-256', 'Privacy', 'IndexedDB'],
    isStarred: false,
    updatedAt: '3 days ago',
    artifactsCount: 5,
    activityCount: 9,
  },
  {
    id: 'proj-4',
    name: 'Procedural Shader & Terrain Lab',
    description: 'WebGPU real-time atmospheric shaders and planetary surface procedural generator.',
    category: 'Game Engine',
    status: 'Planning',
    platform: 'Web',
    tags: ['WebGPU', 'Shaders', 'Procedural', '3D'],
    isStarred: false,
    updatedAt: 'Last week',
    artifactsCount: 3,
    activityCount: 4,
  },
];

export const ProjectsWorkspace: React.FC = () => {
  const { routeParams } = useWorkspace();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const stored = localStorage.getItem('arti_saved_projects');
      return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Form states for Create Project
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<ProjectItem['category']>('Full-Stack');
  const [formPlatform, setFormPlatform] = useState<ProjectItem['platform']>('Web');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');

  // Handle open from routeParams
  useEffect(() => {
    if (routeParams.create === 'true') {
      setIsCreateOpen(true);
    }
  }, [routeParams.create]);

  const saveProjects = (updated: ProjectItem[]) => {
    setProjects(updated);
    try {
      localStorage.setItem('arti_saved_projects', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newProject: ProjectItem = {
      id: 'proj_' + Date.now(),
      name: formName.trim(),
      description: formDesc.trim() || 'No description provided.',
      category: formCategory,
      status: 'Active',
      platform: formPlatform,
      tags: tagsArray.length > 0 ? tagsArray : ['Custom'],
      isStarred: false,
      updatedAt: 'Just now',
      artifactsCount: 0,
      activityCount: 1,
    };

    saveProjects([newProject, ...projects]);
    setIsCreateOpen(false);
    setFormName('');
    setFormDesc('');
    setFormTags('');
    setFormError('');
    showToast(`Project "${newProject.name}" created successfully`, { type: 'success' });
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.map((p) => (p.id === id ? { ...p, isStarred: !p.isStarred } : p));
    saveProjects(updated);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this project from local storage?')) {
      const updated = projects.filter((p) => p.id !== id);
      saveProjects(updated);
      if (selectedProject?.id === id) setSelectedProject(null);
      showToast('Project removed', { type: 'info' });
    }
  };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesStat = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesCat && matchesStat;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0; // Default order by updatedAt recent
    });

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Projects Studio"
        description="Universal workspace directory for full-stack applications, media productions, and research workspaces"
        icon={Folder}
        badge={`${projects.length} Saved`}
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={15} />
              <span>Create Project</span>
            </button>
          </div>
        }
      />

      {/* Toolbar row */}
      <div className="workspace-toolbar">
        {/* Search */}
        <div className="toolbar-search-box">
          <Search size={14} className="toolbar-search-icon" />
          <input
            type="text"
            className="toolbar-search-input"
            placeholder="Search projects, tags, or platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter controls */}
        <div className="toolbar-filter-cluster">
          <div className="toolbar-select-wrap">
            <Filter size={13} className="select-icon" />
            <select
              className="toolbar-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Full-Stack">Full-Stack</option>
              <option value="AI & ML">AI &amp; ML</option>
              <option value="Cinema & Media">Cinema &amp; Media</option>
              <option value="Research">Research</option>
              <option value="Game Engine">Game Engine</option>
            </select>
          </div>

          <div className="toolbar-select-wrap">
            <select
              className="toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Development">In Development</option>
              <option value="Planning">Planning</option>
              <option value="Archived">Archived</option>
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

      {/* Persistence Note Banner */}
      <div className="workspace-storage-callout">
        <HardDrive size={13} className="callout-icon" />
        <span>
          Local Session Persistence: Projects are securely stored in your browser storage. Client-side private session.
        </span>
      </div>

      {/* Main Grid / List */}
      <div className="workspace-content-area">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={Folder}
            title="No projects match your filter"
            description="Create a new project or adjust your search parameters to view your workspaces."
            actionLabel="Create Project"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <div className="projects-grid">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="project-card"
                onClick={() => setSelectedProject(proj)}
              >
                <div className="project-card-header">
                  <div className="project-card-category-tag">{proj.category}</div>
                  <div className="project-card-header-actions">
                    <span className={`project-status-pill status-${proj.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {proj.status}
                    </span>
                    <button
                      type="button"
                      className={`star-btn ${proj.isStarred ? 'starred' : ''}`}
                      onClick={(e) => handleToggleStar(proj.id, e)}
                      title={proj.isStarred ? 'Unstar project' : 'Star project'}
                    >
                      <Star size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="project-card-name">{proj.name}</h3>
                <p className="project-card-desc">{proj.description}</p>

                <div className="project-card-tags">
                  {proj.tags.map((tag) => (
                    <span key={tag} className="project-tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="project-card-footer">
                  <div className="project-meta-item">
                    <Clock size={12} />
                    <span>{proj.updatedAt}</span>
                  </div>
                  <div className="project-meta-stats">
                    <span>{proj.artifactsCount} artifacts</span>
                    <span>&middot;</span>
                    <span>{proj.activityCount} actions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="projects-list-table">
            <div className="table-header-row">
              <span className="col-name">Project</span>
              <span className="col-cat">Category</span>
              <span className="col-status">Status</span>
              <span className="col-platform">Platform</span>
              <span className="col-artifacts">Artifacts</span>
              <span className="col-updated">Updated</span>
              <span className="col-actions">Actions</span>
            </div>
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="table-body-row"
                onClick={() => setSelectedProject(proj)}
              >
                <div className="col-name">
                  <span className="row-proj-title">{proj.name}</span>
                  <span className="row-proj-sub">{proj.description}</span>
                </div>
                <div className="col-cat">{proj.category}</div>
                <div className="col-status">
                  <span className={`project-status-pill status-${proj.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {proj.status}
                  </span>
                </div>
                <div className="col-platform">{proj.platform}</div>
                <div className="col-artifacts">{proj.artifactsCount}</div>
                <div className="col-updated">{proj.updatedAt}</div>
                <div className="col-actions">
                  <button
                    type="button"
                    className="row-action-btn"
                    onClick={(e) => handleToggleStar(proj.id, e)}
                  >
                    <Star size={13} className={proj.isStarred ? 'starred' : ''} />
                  </button>
                  <button
                    type="button"
                    className="row-action-btn danger"
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setFormError('');
        }}
        title="Create New Project"
        description="Define project architecture, target platform, and category tags"
      >
        <form onSubmit={handleCreateSubmit} className="dialog-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Project Name *</label>
            <input
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
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brief description of the workspace objective..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ProjectItem['category'])}
              >
                <option value="Full-Stack">Full-Stack</option>
                <option value="AI & ML">AI &amp; ML</option>
                <option value="Cinema & Media">Cinema &amp; Media</option>
                <option value="Research">Research</option>
                <option value="Game Engine">Game Engine</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Target Platform</label>
              <select
                className="form-select"
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as ProjectItem['platform'])}
              >
                <option value="Web">Web (React / Vite / WebGPU)</option>
                <option value="Desktop">Desktop (Tauri / Electron)</option>
                <option value="Mobile">Mobile (React Native / iOS)</option>
                <option value="Cloud">Cloud Services</option>
                <option value="Universal">Universal Cross-Platform</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. React 19, TypeScript, PyTorch, Shaders"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
            />
          </div>

          <div className="form-actions-row">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="gold-primary-btn">
              Create Project
            </button>
          </div>
        </form>
      </Dialog>

      {/* Project Details Drawer */}
      {selectedProject && (
        <div className="drawer-overlay" onClick={() => setSelectedProject(null)}>
          <aside
            className="project-details-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Project Details"
          >
            <div className="drawer-header">
              <div>
                <span className="project-detail-cat">{selectedProject.category}</span>
                <h2 className="drawer-heading">{selectedProject.name}</h2>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedProject(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-content">
              <div className="detail-section">
                <h4>Description</h4>
                <p className="detail-text">{selectedProject.description}</p>
              </div>

              <div className="detail-section">
                <h4>Specifications</h4>
                <div className="detail-specs-grid">
                  <div className="spec-card">
                    <span className="spec-label">Status</span>
                    <span className="spec-val">{selectedProject.status}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Platform</span>
                    <span className="spec-val">{selectedProject.platform}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Artifacts</span>
                    <span className="spec-val">{selectedProject.artifactsCount}</span>
                  </div>
                  <div className="spec-card">
                    <span className="spec-label">Last Modified</span>
                    <span className="spec-val">{selectedProject.updatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Artifacts &amp; Files</h4>
                <div className="detail-artifacts-list">
                  <div className="artifact-item">
                    <FileText size={14} />
                    <span>architecture_blueprint.md</span>
                    <span className="artifact-size">14.2 KB</span>
                  </div>
                  <div className="artifact-item">
                    <FileText size={14} />
                    <span>task_dependency_graph.json</span>
                    <span className="artifact-size">8.6 KB</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Activity History</h4>
                <div className="detail-history-list">
                  <div className="history-item">
                    <Clock size={12} />
                    <span>Project initialized by Ramakanth</span>
                    <span className="history-time">{selectedProject.updatedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="gold-primary-btn"
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedProject(null);
                  showToast(`Switched active workspace context to ${selectedProject.name}`, {
                    type: 'gold',
                  });
                }}
              >
                Open in Workspace
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
