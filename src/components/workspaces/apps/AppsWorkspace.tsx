import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Layers,
  FileCode,
  CheckCircle2,
  Smartphone,
  Monitor,
  Server,
  Play,
  FolderTree,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { Dialog } from '../../common/Dialog';
import { useToast } from '../../../context/ToastContext';

interface AppFeature {
  id: string;
  name: string;
  category: string;
  status: 'Planned' | 'In Progress' | 'Conceptual';
}

export const AppsWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [platform, setPlatform] = useState<'Web' | 'Desktop' | 'Mobile' | 'Full-Stack'>('Web');
  const [activeTab, setActiveTab] = useState<'architecture' | 'code' | 'features'>('architecture');
  const [isNewAppOpen, setIsNewAppOpen] = useState(false);

  const [appName, setAppName] = useState('');
  const [appReqs, setAppReqs] = useState('');

  const [features] = useState<AppFeature[]>([
    { id: 'f-1', name: 'Directed Acyclic Task Graph (DAG)', category: 'Core Engine', status: 'Planned' },
    { id: 'f-2', name: 'Planned Encrypted Storage', category: 'Storage', status: 'Conceptual' },
    { id: 'f-3', name: 'Background Worker Daemon', category: 'Execution', status: 'Conceptual' },
    { id: 'f-4', name: 'Real-time Canvas Telemetry', category: 'UI Viewport', status: 'Planned' },
  ]);

  const handleRunBuild = () => {
    showToast(
      'No code generation or build service is connected. Build and test status requires an execution backend.',
      { type: 'warning' }
    );
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Apps Studio"
        description="Application architecture workspace. Code generation, builds, and execution are not connected in this phase."
        icon={LayoutGrid}
        badge="Integration Boundary"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={handleRunBuild}
              title="Build and test require a connected execution backend"
            >
              <Play size={14} />
              <span>Run Build</span>
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => setIsNewAppOpen(true)}
            >
              <Plus size={15} />
              <span>New Application</span>
            </button>
          </div>
        }
      />

      {/* Main Apps Layout */}
      <div className="apps-studio-grid">
        {/* Left Column: Requirements & Platform */}
        <aside className="apps-sidebar-column">
          <div className="spec-card">
            <h3 className="spec-card-heading">Target Platform</h3>
            <div className="platform-selector-pills">
              <button
                type="button"
                className={`platform-btn ${platform === 'Web' ? 'active' : ''}`}
                onClick={() => setPlatform('Web')}
              >
                <Monitor size={14} />
                <span>Web (Vite/React)</span>
              </button>
              <button
                type="button"
                className={`platform-btn ${platform === 'Desktop' ? 'active' : ''}`}
                onClick={() => setPlatform('Desktop')}
              >
                <Layers size={14} />
                <span>Desktop (Tauri/Rust)</span>
              </button>
              <button
                type="button"
                className={`platform-btn ${platform === 'Mobile' ? 'active' : ''}`}
                onClick={() => setPlatform('Mobile')}
              >
                <Smartphone size={14} />
                <span>Mobile (React Native)</span>
              </button>
              <button
                type="button"
                className={`platform-btn ${platform === 'Full-Stack' ? 'active' : ''}`}
                onClick={() => setPlatform('Full-Stack')}
              >
                <Server size={14} />
                <span>Full-Stack (Node/SQLite)</span>
              </button>
            </div>
          </div>

          <div className="spec-card">
            <h3 className="spec-card-heading">Product Requirements</h3>
            <textarea
              className="spec-brief-textarea"
              rows={4}
              value={appReqs}
              onChange={(e) => setAppReqs(e.target.value)}
              placeholder="Define core user journeys, performance thresholds, and data schemas..."
            />
          </div>

          {/* Build Telemetry Card */}
          <div className="spec-card subtle">
            <h4 className="info-card-subtitle">Integration Status</h4>
            <div className="build-status-box">
              <div className="build-row">
                <span>Code Generator:</span>
                <strong className="status-val standby">Not Connected</strong>
              </div>
              <div className="build-row">
                <span>Compiler Target:</span>
                <strong className="status-val standby">Not Configured</strong>
              </div>
              <div className="build-row">
                <span>Cloud Packager:</span>
                <strong className="status-val standby">Not Connected</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Center/Right Content Area */}
        <main className="apps-main-column">
          {/* Workspace Tabs */}
          <div className="apps-nav-toolbar">
            <button
              type="button"
              className={`apps-tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
              onClick={() => setActiveTab('architecture')}
            >
              <Layers size={14} />
              <span>Architecture Blueprint</span>
            </button>
            <button
              type="button"
              className={`apps-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <FileCode size={14} />
              <span>Project Files &amp; Code</span>
            </button>
            <button
              type="button"
              className={`apps-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              <CheckCircle2 size={14} />
              <span>Feature Status ({features.length})</span>
            </button>
          </div>

          <div className="apps-view-container">
            {activeTab === 'architecture' ? (
              <div className="architecture-view-grid">
                <div className="arch-card">
                  <h4>Data Models &amp; Storage <span className="blueprint-tag">Blueprint</span></h4>
                  <ul className="arch-list">
                    <li><strong>TaskEntity:</strong> id, title, priority, status, dependencies[]</li>
                    <li><strong>DependencyEdge:</strong> sourceId, targetId, condition</li>
                    <li><strong>ExecutionLog:</strong> timestamp, status, latencyMs</li>
                  </ul>
                </div>

                <div className="arch-card">
                  <h4>State Management &amp; Dispatch <span className="blueprint-tag">Blueprint</span></h4>
                  <ul className="arch-list">
                    <li>Deterministic event reducer loop</li>
                    <li>Synchronous local persistence journal commit</li>
                    <li>Web Worker message bridge for background work</li>
                  </ul>
                </div>

                <div className="arch-card">
                  <h4>UI Component Hierarchy <span className="blueprint-tag">Blueprint</span></h4>
                  <ul className="arch-list">
                    <li>AppShell &gt; TopBar &middot; Sidebar &middot; MainCanvas</li>
                    <li>DAGCanvas &gt; GraphNodes &middot; EdgeRenderers</li>
                    <li>TaskInspector &gt; DetailDrawer &middot; LogStream</li>
                  </ul>
                </div>

                <div className="arch-card">
                  <h4>Security &amp; Sandboxing <span className="blueprint-tag">Blueprint</span></h4>
                  <ul className="arch-list">
                    <li>Planned: restricted execution sandbox</li>
                    <li>Planned: local-only data handling policy</li>
                    <li>Planned: provider-scoped credential handling</li>
                  </ul>
                </div>
              </div>
            ) : activeTab === 'code' ? (
              <div className="code-workspace-layout">
                <div className="file-tree-sidebar">
                  <div className="tree-header">
                    <FolderTree size={13} />
                    <span>Project Tree (example)</span>
                  </div>
                  <div className="tree-items">
                    <div className="tree-leaf active">src/engine/dag.ts</div>
                    <div className="tree-leaf">src/engine/executor.ts</div>
                    <div className="tree-leaf">src/storage/db.ts</div>
                    <div className="tree-leaf">src/ui/Canvas.tsx</div>
                    <div className="tree-leaf">package.json</div>
                  </div>
                </div>

                <div className="code-editor-mock">
                  <div className="editor-tab-bar">
                    <span className="tab-pill active">dag.ts</span>
                    <span className="example-mock-tag">Illustrative example — not generated code</span>
                  </div>
                  <pre className="code-block">
{`export interface TaskNode {
  id: string;
  label: string;
  dependencies: string[];
  execute: () => Promise<TaskResult>;
}

export class TaskDAG {
  private nodes = new Map<string, TaskNode>();

  public addNode(node: TaskNode): void {
    this.nodes.set(node.id, node);
  }

  public getTopologicalOrder(): TaskNode[] {
    // Deterministic topological sort
    return Array.from(this.nodes.values());
  }
}`}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="features-list-card">
                <div className="features-header-row">
                  <span className="col-feat-name">Feature</span>
                  <span className="col-feat-cat">Subsystem</span>
                  <span className="col-feat-status">Verification Status</span>
                </div>
                {features.map((f) => (
                  <div key={f.id} className="feature-row">
                    <span className="feat-name">{f.name}</span>
                    <span className="feat-cat">{f.category}</span>
                    <span className={`feat-status-pill status-${f.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New App Modal */}
      <Dialog
        isOpen={isNewAppOpen}
        onClose={() => setIsNewAppOpen(false)}
        title="Initialize Application Workspace"
        description="Configure application identity and architecture parameters"
      >
        <div className="dialog-form">
          <div className="form-field">
            <label className="form-label">Application Name</label>
            <input
              type="text"
              className="form-input"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label">Target Framework</label>
            <select className="form-select">
              <option>React 19 + TypeScript + Vite</option>
              <option>Tauri 2.0 (Rust + Web Frontend)</option>
              <option>React Native (Expo SDK 52)</option>
            </select>
          </div>
          <div className="form-actions-row">
            <button
              type="button"
              className="gold-ghost-btn"
              onClick={() => setIsNewAppOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="gold-primary-btn"
              disabled={!appName.trim()}
              onClick={() => {
                if (!appName.trim()) {
                  showToast('Enter an application name', { type: 'warning' });
                  return;
                }
                setIsNewAppOpen(false);
                showToast(
                  `App blueprint draft "${appName}" prepared. Persistence and code generation are not connected yet.`,
                  { type: 'gold' }
                );
              }}
            >
              Create Workspace
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
