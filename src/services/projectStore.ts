/**
 * ARTI AI — shared project store.
 *
 * The single source of truth for project records. Projects are the parent of
 * project-scoped conversations: every project has a stable `id`, and every
 * project conversation stores that `projectId` (see `chatStore`). Persistence
 * is browser localStorage (`arti_saved_projects`), the repository's only
 * storage layer — nothing is sent to a server and no permanent persistence is
 * implied beyond this browser/device.
 *
 * Demonstration projects are never persisted and are clearly labelled by the
 * UI until the owner creates a real one.
 */
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'arti_saved_projects';

export type ProjectType =
  | 'website'
  | 'web-page'
  | 'web-application'
  | 'android-app'
  | 'ios-app'
  | 'cross-platform-mobile'
  | 'desktop-application'
  | 'full-stack'
  | 'backend-api'
  | 'automation'
  | 'browser-extension'
  | 'pwa'
  | 'research'
  | 'learning'
  | 'ai-ml'
  | 'data-science'
  | 'game'
  | 'creative'
  | 'custom';

export interface ProjectTypeOption {
  value: ProjectType;
  label: string;
  /** Honest capability note surfaced in the Create Software / Create Project UI. */
  capability: string;
}

export const PROJECT_TYPES: ProjectTypeOption[] = [
  { value: 'website', label: 'Website', capability: 'Brief and plan supported; hosting/build is not automated here.' },
  { value: 'web-page', label: 'Web page / Landing page', capability: 'Brief and plan supported.' },
  { value: 'web-application', label: 'Web application', capability: 'Architecture and planning supported.' },
  { value: 'android-app', label: 'Android application', capability: 'Planning supported; no Android build/sign toolchain connected.' },
  { value: 'ios-app', label: 'iOS application', capability: 'Planning supported; no iOS build/sign toolchain connected.' },
  { value: 'cross-platform-mobile', label: 'Cross-platform mobile app', capability: 'Planning supported; no mobile build toolchain connected.' },
  { value: 'desktop-application', label: 'Desktop application', capability: 'Planning supported; no desktop packaging connected.' },
  { value: 'full-stack', label: 'Full-stack application', capability: 'Architecture and planning supported.' },
  { value: 'backend-api', label: 'Backend / API service', capability: 'Design and planning supported.' },
  { value: 'automation', label: 'Automation software', capability: 'Design and planning supported.' },
  { value: 'browser-extension', label: 'Browser extension', capability: 'Planning supported; no store packaging connected.' },
  { value: 'pwa', label: 'Progressive Web App', capability: 'Planning supported.' },
  { value: 'research', label: 'Research project', capability: 'Research and synthesis supported.' },
  { value: 'learning', label: 'Learning project', capability: 'Curriculum and study planning supported.' },
  { value: 'ai-ml', label: 'AI / machine-learning project', capability: 'Design and planning supported; no training compute connected.' },
  { value: 'data-science', label: 'Data-science project', capability: 'Design and planning supported.' },
  { value: 'game', label: 'Game project', capability: 'Concept and planning supported; no engine/runtime connected.' },
  { value: 'creative', label: 'Creative project', capability: 'Concept and planning supported.' },
  { value: 'custom', label: 'Custom / other', capability: 'Describe your own project type; execution capability depends on tooling.' },
];

export function getProjectTypeOption(type: ProjectType): ProjectTypeOption {
  return PROJECT_TYPES.find((t) => t.value === type) ?? PROJECT_TYPES[PROJECT_TYPES.length - 1];
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  /** Free-text label when `type` is `custom`. */
  customType?: string;
  description: string;
  goal: string;
  techStack: string;
  notes: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Demo projects shown only until the owner creates a real one (never persisted). */
const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-demo-1',
    name: 'Universal Workspace Core',
    type: 'full-stack',
    description: 'High-performance React 19 application shell with unified navigation and design system.',
    goal: 'Ship a coherent multi-workspace shell with a single design language.',
    techStack: 'React 19, TypeScript, Vite',
    notes: '',
    isStarred: true,
    createdAt: '2026-01-01T09:00:00.000Z',
    updatedAt: '2026-01-04T14:15:00.000Z',
  },
  {
    id: 'proj-demo-2',
    name: 'Cinematic Storyboard Engine',
    type: 'creative',
    description: 'Multi-scene visual planning pipeline with keyframe latent anchoring.',
    goal: 'Plan consistent multi-scene visual sequences.',
    techStack: '',
    notes: '',
    isStarred: false,
    createdAt: '2026-01-02T09:00:00.000Z',
    updatedAt: '2026-01-03T09:00:00.000Z',
  },
];

function readStored(): Project[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return (parsed as Project[]).map((p) => ({
      ...p,
      description: p.description ?? '',
      goal: p.goal ?? '',
      techStack: p.techStack ?? '',
      notes: p.notes ?? '',
      isStarred: Boolean(p.isStarred),
    }));
  } catch {
    return null;
  }
}

interface StoreState {
  projects: Project[];
  isDemo: boolean;
}

class ProjectStore {
  private state: StoreState;
  private listeners = new Set<() => void>();

  constructor() {
    const stored = readStored();
    this.state = stored
      ? { projects: stored, isDemo: false }
      : { projects: DEMO_PROJECTS, isDemo: true };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private persist() {
    if (typeof window === 'undefined' || this.state.isDemo) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.projects));
    } catch {
      // Storage may be unavailable; the in-memory session still works.
    }
  }

  private setState(next: Partial<StoreState>) {
    this.state = { ...this.state, ...next };
    this.persist();
    this.emit();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): StoreState => this.state;

  getProject(id: string): Project | undefined {
    return this.state.projects.find((p) => p.id === id);
  }

  /** Create a real, persisted project with a stable id. Returns the record. */
  createProject(input: {
    name: string;
    type: ProjectType;
    customType?: string;
    description?: string;
    goal?: string;
    techStack?: string;
    notes?: string;
  }): Project {
    const nowIso = new Date().toISOString();
    const project: Project = {
      id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: input.name.trim(),
      type: input.type,
      customType: input.customType?.trim() || undefined,
      description: input.description?.trim() ?? '',
      goal: input.goal?.trim() ?? '',
      techStack: input.techStack?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      isStarred: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    // Drop demo content the moment a real project exists so demo records never
    // masquerade as saved work.
    const base = this.state.isDemo ? [] : this.state.projects;
    this.setState({ projects: [project, ...base], isDemo: false });
    return project;
  }

  updateProject(id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    this.setState({
      projects: this.state.projects.map((p) =>
        p.id === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p
      ),
    });
  }

  touchProject(id: string) {
    this.setState({
      projects: this.state.projects.map((p) =>
        p.id === id ? { ...p, updatedAt: new Date().toISOString() } : p
      ),
    });
  }

  toggleStar(id: string) {
    this.setState({
      projects: this.state.projects.map((p) =>
        p.id === id ? { ...p, isStarred: !p.isStarred } : p
      ),
    });
  }

  /** Delete a project. The caller is responsible for its conversations. */
  deleteProject(id: string) {
    this.setState({ projects: this.state.projects.filter((p) => p.id !== id) });
  }

  /** Remove demo content and start from an empty real collection. */
  clearDemo() {
    this.setState({ projects: [], isDemo: false });
  }
}

export const projectStore = new ProjectStore();

export function useProjectStore(): StoreState {
  return useSyncExternalStore(projectStore.subscribe, projectStore.getState, projectStore.getState);
}

export { DEMO_PROJECTS };
