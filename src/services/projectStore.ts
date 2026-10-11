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

/* ==========================================================================
   Software classifications & platform configuration
   ------------------------------------------------------------------------
   A software project carries two independent, non-interchangeable
   classifications plus an explicit target-platform configuration:

     1. Core functional classification  — what kind of software it is.
     2. Technology & application domain — where/how it is applied (multi-select).

   These describe intent. Selecting a category never asserts that ARTI AI can
   build, compile, sign or deploy the target — capability is reported
   separately and honestly (see the platform support matrix below).
   ========================================================================== */

export interface ClassOption {
  value: string;
  label: string;
}

/** 1. Core Functional Classification — what kind of software the user wants. */
export const CORE_CATEGORIES: ClassOption[] = [
  { value: 'system-software', label: 'System Software' },
  { value: 'application-software', label: 'Application Software' },
  { value: 'programming-development', label: 'Programming and Development Software' },
  { value: 'utility-software', label: 'Utility Software' },
  { value: 'driver-device', label: 'Driver and Device Software' },
  { value: 'middleware-integration', label: 'Middleware and Integration Software' },
  { value: 'database-data-management', label: 'Database and Data-Management Software' },
  { value: 'security-software', label: 'Security Software' },
  { value: 'networking-communication', label: 'Networking and Communication Software' },
  { value: 'automation-software', label: 'Automation Software' },
  { value: 'enterprise-business', label: 'Enterprise and Business Software' },
  { value: 'embedded-real-time', label: 'Embedded and Real-Time Software' },
  { value: 'ai-ml-software', label: 'AI and Machine-Learning Software' },
  { value: 'scientific-engineering', label: 'Scientific and Engineering Software' },
  { value: 'multimedia-creative', label: 'Multimedia and Creative Software' },
  { value: 'gaming-software', label: 'Gaming Software' },
  { value: 'education-learning', label: 'Education and Learning Software' },
  { value: 'research-simulation', label: 'Research and Simulation Software' },
  { value: 'infrastructure-operations', label: 'Infrastructure and Operations Software' },
  { value: 'custom-other', label: 'Custom / Other Software' },
];

/** 2. Technology & Application Domain — multi-select; distinct from (1). */
export const DOMAIN_CATEGORIES: ClassOption[] = [
  { value: 'web-applications', label: 'Web Applications' },
  { value: 'mobile-applications', label: 'Mobile Applications' },
  { value: 'desktop-applications', label: 'Desktop Applications' },
  { value: 'embedded-software', label: 'Embedded Software' },
  { value: 'ai-ml', label: 'AI & Machine Learning Software' },
  { value: 'enterprise-software', label: 'Enterprise Software' },
  { value: 'cloud-software', label: 'Cloud Software' },
  { value: 'backend-api', label: 'Backend and API Services' },
  { value: 'data-science-analytics', label: 'Data Science and Analytics' },
  { value: 'database-systems', label: 'Database Systems' },
  { value: 'cybersecurity', label: 'Cybersecurity and Defensive Security' },
  { value: 'networking-distributed', label: 'Networking and Distributed Systems' },
  { value: 'iot', label: 'IoT Software' },
  { value: 'robotics', label: 'Robotics Software' },
  { value: 'scientific-computing', label: 'Scientific Computing' },
  { value: 'simulation-digital-twins', label: 'Simulation and Digital Twins' },
  { value: 'gaming-interactive', label: 'Gaming and Interactive Software' },
  { value: 'ar-vr', label: 'AR and VR Applications' },
  { value: 'blockchain-dlt', label: 'Blockchain and Distributed-Ledger Applications' },
  { value: 'developer-tools-ides', label: 'Developer Tools and IDEs' },
  { value: 'devops-infrastructure', label: 'DevOps and Infrastructure Automation' },
  { value: 'education-research', label: 'Education and Research Applications' },
  { value: 'healthcare-scientific', label: 'Healthcare and Scientific Applications' },
  { value: 'financial-quantitative', label: 'Financial and Quantitative Software' },
  { value: 'multimedia-creative', label: 'Multimedia and Creative Applications' },
  { value: 'cross-platform', label: 'Cross-Platform Software' },
  { value: 'custom-other', label: 'Custom / Other Domain' },
];

/* --------------------------------------------------------------------------
   Platform support matrix.

   `status` is an honestly-resolved capability for THIS build. ARTI AI runs
   entirely in the browser with no build toolchain, SDK, signing identity or
   deployment target connected, so no target can be marked build-ready or
   build-verified here. The states are the real ones from Section 10.4.
   -------------------------------------------------------------------------- */
export type PlatformStatus =
  | 'planned'
  | 'architecture-supported'
  | 'dependencies-required'
  | 'build-ready'
  | 'build-verified'
  | 'blocked'
  | 'not-supported';

export interface PlatformOption {
  value: string;
  label: string;
  /** SDKs / toolchains a real build of this target would require. */
  dependencies: string;
  /** Resolved capability note for the current environment. */
  status: PlatformStatus;
  statusNote: string;
}

export const PLATFORMS: PlatformOption[] = [
  { value: 'android', label: 'Android', dependencies: 'Android SDK, Gradle, JDK, keystore for signing', status: 'dependencies-required', statusNote: 'No Android SDK or signing toolchain is connected.' },
  { value: 'ios', label: 'iOS / iPadOS', dependencies: 'Xcode, Apple Developer signing identity', status: 'dependencies-required', statusNote: 'No Xcode or Apple signing identity is connected.' },
  { value: 'windows', label: 'Windows', dependencies: 'Platform SDK / MSVC or a cross-compiler', status: 'dependencies-required', statusNote: 'No Windows packaging toolchain is connected.' },
  { value: 'macos', label: 'macOS', dependencies: 'Xcode command-line tools, notarization identity', status: 'dependencies-required', statusNote: 'No macOS packaging or notarization is connected.' },
  { value: 'linux', label: 'Linux', dependencies: 'Native toolchain, packaging (deb/rpm/AppImage)', status: 'dependencies-required', statusNote: 'No Linux packaging toolchain is connected.' },
  { value: 'unix', label: 'Unix and Unix-like environments', dependencies: 'Portable POSIX build toolchain', status: 'dependencies-required', statusNote: 'Planned; no Unix build environment is connected.' },
  { value: 'web-browser', label: 'Web browser', dependencies: 'Node.js + bundler (Vite)', status: 'architecture-supported', statusNote: 'Static web output is the only target this environment natively supports; no build is automated here.' },
  { value: 'pwa', label: 'Progressive Web App', dependencies: 'Web build + service worker', status: 'architecture-supported', statusNote: 'Derived from a web build; no automated packaging.' },
  { value: 'server-cloud', label: 'Server / cloud deployment', dependencies: 'Runtime, container image, hosting target', status: 'dependencies-required', statusNote: 'No deployment provider or container runtime is connected.' },
  { value: 'embedded', label: 'Embedded targets', dependencies: 'Cross-compiler, board SDK, flashing tool', status: 'dependencies-required', statusNote: 'No cross-compiler or board SDK is connected.' },
  { value: 'other', label: 'Other / custom platform', dependencies: 'Depends on the custom target', status: 'planned', statusNote: 'Describe the target; capability depends on its toolchain.' },
];

export const OTHER_PLATFORM_VALUE = 'other';
export const CUSTOM_CLASS_VALUE = 'custom-other';

export type PlatformMode = 'single' | 'cross-platform' | 'all-platforms';

export interface ResolvedTarget {
  value: string;
  label: string;
  status: PlatformStatus;
  statusNote: string;
  dependencies: string;
}

export function getPlatformOption(value: string): PlatformOption | undefined {
  return PLATFORMS.find((p) => p.value === value);
}

/**
 * Resolve the platform matrix for a project's configuration. For `all-platforms`
 * every supported target is enumerated (with its real status); unsupported or
 * dependency-gated targets are reported, never silently dropped.
 */
export function resolveTargets(
  platforms: string[],
  mode: PlatformMode,
  customPlatform?: string
): ResolvedTarget[] {
  const toTarget = (p: PlatformOption): ResolvedTarget => ({
    value: p.value,
    label: p.label,
    status: p.status,
    statusNote: p.statusNote,
    dependencies: p.dependencies,
  });

  const base =
    mode === 'all-platforms'
      ? PLATFORMS.filter((p) => p.value !== OTHER_PLATFORM_VALUE).map(toTarget)
      : platforms
          .map((v) => {
            if (v === OTHER_PLATFORM_VALUE) {
              return {
                value: 'other',
                label: customPlatform?.trim() ? `Other — ${customPlatform.trim()}` : 'Other / custom platform',
                status: 'planned' as PlatformStatus,
                statusNote: 'Describe the target; capability depends on its toolchain.',
                dependencies: 'Depends on the custom target',
              };
            }
            const p = getPlatformOption(v);
            return p ? toTarget(p) : null;
          })
          .filter((t): t is ResolvedTarget => t !== null);

  return base;
}

/* --------------------------------------------------------------------------
   Test configuration & run records. ARTI AI has no server-side execution
   environment, so a run is either `not-configured` (nothing to run) or
   `blocked` (configured, but this environment cannot execute it) — it is never
   reported as passed or failed without a real execution.
   -------------------------------------------------------------------------- */
export interface TestConfig {
  framework: string;
  command: string;
  includeLint: boolean;
  includeTypeCheck: boolean;
  includeUnit: boolean;
  includeIntegration: boolean;
  includeE2e: boolean;
  includeBuild: boolean;
}

export type TestStatus =
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'not-configured'
  | 'skipped';

export interface TestSuiteResult {
  name: string;
  status: TestStatus;
  detail: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  createdAt: string;
  command: string;
  framework: string;
  status: TestStatus;
  exitStatus: string;
  suites: TestSuiteResult[];
  message: string;
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

  /** True when this record is a software project (created via Create Software / Apps). */
  isSoftware?: boolean;
  /** 1. Core functional classification value. */
  coreClassification?: string;
  /** Details when the core classification is `Custom / Other Software`. */
  coreCustom?: string;
  /** 2. Technology & application domain classification values (multi-select). */
  domains?: string[];
  /** Details when a domain classification is `Custom / Other Domain`. */
  domainCustom?: string;
  /** Requested target-platform values. */
  platforms?: string[];
  /** Target-platform mode; distinguishes cross-platform from all-platforms. */
  platformMode?: PlatformMode;
  /** Details when a target platform is `Other / custom platform`. */
  customPlatform?: string;
  /** Optional preferred technology stack (separate from the free-text `techStack`). */
  stackPreference?: string;
  /** Test configuration for Project Settings > Perform Tests. */
  testConfig?: TestConfig;
  /** Most recent Perform Tests run, if any. */
  lastTestRun?: TestRun;
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
      isSoftware: Boolean(p.isSoftware),
      domains: Array.isArray(p.domains) ? p.domains : [],
      platforms: Array.isArray(p.platforms) ? p.platforms : [],
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
    isSoftware?: boolean;
    coreClassification?: string;
    coreCustom?: string;
    domains?: string[];
    domainCustom?: string;
    platforms?: string[];
    platformMode?: PlatformMode;
    customPlatform?: string;
    stackPreference?: string;
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
      isSoftware: input.isSoftware ?? false,
      coreClassification: input.coreClassification,
      coreCustom: input.coreCustom?.trim() || undefined,
      domains: input.domains ?? [],
      domainCustom: input.domainCustom?.trim() || undefined,
      platforms: input.platforms ?? [],
      platformMode: input.platformMode,
      customPlatform: input.customPlatform?.trim() || undefined,
      stackPreference: input.stackPreference?.trim() || undefined,
    };
    // Drop demo content the moment a real project exists so demo records never
    // masquerade as saved work.
    const base = this.state.isDemo ? [] : this.state.projects;
    this.setState({ projects: [project, ...base], isDemo: false });
    return project;
  }

  /** Persist the most recent test run for a project (kept in project history). */
  saveTestRun(projectId: string, run: TestRun) {
    this.setState({
      projects: this.state.projects.map((p) =>
        p.id === projectId ? { ...p, lastTestRun: run, updatedAt: new Date().toISOString() } : p
      ),
    });
  }

  setTestConfig(projectId: string, config: TestConfig) {
    this.setState({
      projects: this.state.projects.map((p) =>
        p.id === projectId ? { ...p, testConfig: config, updatedAt: new Date().toISOString() } : p
      ),
    });
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
