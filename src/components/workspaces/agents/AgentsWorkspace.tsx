import React, { useState } from 'react';
import {
  Bot,
  Plus,
  Play,
  Square,
  Sliders,
  Shield,
  Cpu,
  Layers,
  Terminal,
  Activity,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface AgentProfile {
  id: string;
  name: string;
  callsign: string;
  role: string;
  description: string;
  capabilities: string[];
  toolsAllowed: string[];
  contextWindow: string;
  status: 'Standby' | 'Configured';
  modelFoundation: string;
}

const SPECIALIST_AGENTS: AgentProfile[] = [
  {
    id: 'ag-1',
    name: 'Architect Prime',
    callsign: 'AP-01',
    role: 'System Design & Workflow Planning',
    description: 'Decomposes complex human objectives into verifiable DAG execution nodes and dependency maps.',
    capabilities: ['Topological Sort', 'Cycle Detection', 'Risk Estimation', 'Subsystem Boundaries'],
    toolsAllowed: ['TaskGraphAPI', 'WorkspaceInspector', 'DependencyValidator'],
    contextWindow: '128k Tokens',
    status: 'Standby',
    modelFoundation: 'ARTI Planning Foundation (Standby)',
  },
  {
    id: 'ag-2',
    name: 'Code Synthesis Engine',
    callsign: 'CS-02',
    role: 'Full-Stack Software Engineering',
    description: 'Generates strongly typed TypeScript, Rust runtimes, and WebGPU shaders adhering to strict lints.',
    capabilities: ['React 19 Architecture', 'AST Rewriting', 'Strict Type Checking', 'Test Simulation'],
    toolsAllowed: ['FileTreeIO', 'CompilerSandbox', 'LinterVerification'],
    contextWindow: '64k Tokens',
    status: 'Standby',
    modelFoundation: 'ARTI Code Specialist (Standby)',
  },
  {
    id: 'ag-3',
    name: 'Research Sovereign',
    callsign: 'RS-03',
    role: 'Scientific Evidence & Provenance',
    description: 'Verifies claims against primary literature and detects hallucinated citations in synthesis drafts.',
    capabilities: ['Corpus Cross-Examination', 'Citation Provenance', 'Logic Consistency'],
    toolsAllowed: ['LocalVectorVault', 'DocumentParser', 'CitationEngine'],
    contextWindow: '128k Tokens',
    status: 'Standby',
    modelFoundation: 'ARTI Research Core (Standby)',
  },
  {
    id: 'ag-4',
    name: 'Visual Maestro',
    callsign: 'VM-04',
    role: 'Cinematic Imagery & Shot Direction',
    description: 'Directs multi-scene storyboard continuity, camera motion trajectories, and latent keyframe consistency.',
    capabilities: ['Latent Keyframe Locking', 'Camera Choreography', 'Aspect Ratio Mastery'],
    toolsAllowed: ['StoryboardPlanner', 'LatentSeedAPI', 'VisualTimeline'],
    contextWindow: '32k Tokens',
    status: 'Standby',
    modelFoundation: 'ARTI Cinema Core (Standby)',
  },
  {
    id: 'ag-5',
    name: 'Linguistic Strategist',
    callsign: 'LS-05',
    role: 'Executive & Technical Writing',
    description: 'Drafts sovereign whitepapers, technical specifications, and manifesto literature with restrained elegance.',
    capabilities: ['Tone Harmonization', 'Technical Brevity', 'Information Density'],
    toolsAllowed: ['MarkdownEngine', 'LexicalAnalyzer', 'ExportFormatters'],
    contextWindow: '64k Tokens',
    status: 'Standby',
    modelFoundation: 'ARTI Prose Core (Standby)',
  },
];

export const AgentsWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [agents, setAgents] = useState<AgentProfile[]>(SPECIALIST_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ag-1');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleStartAgent = () => {
    showToast(
      'Autonomous Dispatch Standby: Independent execution daemon requires connected model endpoints in Settings > Connected Services.',
      { type: 'warning' }
    );
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Specialist Agents Fleet"
        description="Autonomous specialist agent directory, permission sandboxes, and orchestration profiles"
        icon={Bot}
        badge={`${agents.length} Specialist Profiles`}
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => showToast('Agent specification wizard ready', { type: 'gold' })}
            >
              <Plus size={15} />
              <span>Define Specialist Agent</span>
            </button>
          </div>
        }
      />

      <div className="agents-studio-grid">
        {/* Left Column: Agents Directory */}
        <aside className="agents-sidebar-column">
          <h3 className="section-title">Specialist Fleet Directory</h3>
          <div className="agents-list">
            {agents.map((ag) => {
              const isSelected = ag.id === selectedAgentId;
              return (
                <div
                  key={ag.id}
                  className={`agent-directory-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedAgentId(ag.id)}
                >
                  <div className="agent-card-header">
                    <span className="agent-callsign">{ag.callsign}</span>
                    <span className="agent-status-badge standby">{ag.status}</span>
                  </div>
                  <h4 className="agent-card-name">{ag.name}</h4>
                  <p className="agent-card-role">{ag.role}</p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center/Right: Agent Detail & Permission Sandbox */}
        <main className="agents-main-column">
          {/* Agent Identity & Dispatch Header */}
          <div className="agent-profile-header-card">
            <div className="profile-header-top">
              <div>
                <span className="profile-callsign-tag">{selectedAgent.callsign}</span>
                <h2 className="profile-heading">{selectedAgent.name}</h2>
                <p className="profile-role-sub">{selectedAgent.role}</p>
              </div>
              <div className="profile-actions-cluster">
                <button
                  type="button"
                  className="gold-ghost-btn"
                  onClick={handleStartAgent}
                >
                  <Play size={14} />
                  <span>Test Dispatch</span>
                </button>
                <button
                  type="button"
                  className="gold-primary-btn"
                  onClick={() => navigate('magic-mode')}
                >
                  <span>Orchestrate in Magic Mode</span>
                </button>
              </div>
            </div>

            <p className="profile-desc">{selectedAgent.description}</p>
          </div>

          {/* Capabilities & Specifications Grid */}
          <div className="agent-specs-grid">
            <div className="spec-tile">
              <span className="tile-label">Context Memory Window</span>
              <strong className="tile-value">{selectedAgent.contextWindow}</strong>
            </div>
            <div className="spec-tile">
              <span className="tile-label">Model Foundation</span>
              <strong className="tile-value">{selectedAgent.modelFoundation}</strong>
            </div>
            <div className="spec-tile">
              <span className="tile-label">Runtime State</span>
              <strong className="tile-value standby">Standby (Zero Fabricated Execution)</strong>
            </div>
            <div className="spec-tile">
              <span className="tile-label">Execution Sandbox</span>
              <strong className="tile-value">Restricted Client Environment</strong>
            </div>
          </div>

          {/* Capabilities Checklist */}
          <div className="agent-section-card">
            <h3 className="section-card-title">Core Capabilities</h3>
            <div className="capabilities-tags-cloud">
              {selectedAgent.capabilities.map((cap) => (
                <div key={cap} className="capability-tag-item">
                  <CheckCircle2 size={13} className="cap-check-icon" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tool Permissions */}
          <div className="agent-section-card">
            <h3 className="section-card-title">Permitted Tool Call Handlers</h3>
            <div className="tools-permitted-list">
              {selectedAgent.toolsAllowed.map((t) => (
                <div key={t} className="tool-permitted-row">
                  <Shield size={13} className="tool-perm-shield" />
                  <span className="tool-perm-name">{t}</span>
                  <span className="tool-perm-level">Read/Execute</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Execution Guarantee */}
          <div className="service-status-banner info">
            <AlertCircle size={15} />
            <div className="status-banner-text">
              <strong>Execution Transparency Guarantee</strong>
              <p>
                ARTI strictly represents real agent states. Running agents will only be displayed when an active background orchestration daemon is actively processing tasks.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
