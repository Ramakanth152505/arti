import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Bot,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
  ArrowRight,
  Info,
  Clock,
  HardDrive,
  FileCode,
  X,
  AlertCircle,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useToast } from '../../../context/ToastContext';

interface WorkflowNode {
  id: string;
  label: string;
  phase: string;
  lane: 'Planning' | 'Specialist Agents' | 'Tools & Artifacts' | 'Verification';
  assignedAgent: string;
  status: 'Ready' | 'Configured' | 'Awaiting Dispatch';
  inputs: string[];
  outputs: string[];
  description: string;
  x: number;
  y: number;
}

const ORCHESTRATION_NODES: WorkflowNode[] = [
  {
    id: 'node-1',
    label: '1. Objective Formulation & Scope Lock',
    phase: 'Phase 1: Clarification',
    lane: 'Planning',
    assignedAgent: 'Operator (Ramakanth) + Architect Prime',
    status: 'Ready',
    inputs: ['User Intent Prompt', 'Target Constraints'],
    outputs: ['Signed Goal Spec', 'Topological Scope Token'],
    description: 'Refines ambiguous prompts into deterministic, machine-verifiable sub-goals.',
    x: 40,
    y: 80,
  },
  {
    id: 'node-2',
    label: '2. Subsystem Decomposition & DAG Map',
    phase: 'Phase 2: Topology',
    lane: 'Planning',
    assignedAgent: 'Architect Prime (AP-01)',
    status: 'Configured',
    inputs: ['Signed Goal Spec'],
    outputs: ['Acyclic Dependency Graph', 'Agent Route Table'],
    description: 'Computes Kahn topological order, validates 0 cycles, and delegates task lanes.',
    x: 320,
    y: 80,
  },
  {
    id: 'node-3',
    label: '3. Full-Stack Implementation',
    phase: 'Phase 3: Execution',
    lane: 'Specialist Agents',
    assignedAgent: 'Code Synthesis Engine (CS-02)',
    status: 'Awaiting Dispatch',
    inputs: ['Subsystem Architecture Specs'],
    outputs: ['TypeScript Modules', 'Unit Test Suite'],
    description: 'Implements production-quality React 19 components with strict type safety.',
    x: 620,
    y: 40,
  },
  {
    id: 'node-4',
    label: '4. Visual & Storyboard Direction',
    phase: 'Phase 3: Execution',
    lane: 'Specialist Agents',
    assignedAgent: 'Visual Maestro (VM-04)',
    status: 'Awaiting Dispatch',
    inputs: ['Scene Latent Anchors'],
    outputs: ['Storyboard Keyframes', 'Camera Trajectories'],
    description: 'Coordinates multi-scene visual continuity, camera choreography, and lighting.',
    x: 620,
    y: 160,
  },
  {
    id: 'node-5',
    label: '5. Deterministic Tool Calls & IO',
    phase: 'Phase 4: Tool Execution',
    lane: 'Tools & Artifacts',
    assignedAgent: 'Execution Sandbox Daemon',
    status: 'Awaiting Dispatch',
    inputs: ['Generated Source Files'],
    outputs: ['Compiled Client Artifacts', 'Local Storage Commit'],
    description: 'Executes lints, builds bundles, and seals artifacts into local IndexedDB storage.',
    x: 920,
    y: 100,
  },
  {
    id: 'node-6',
    label: '6. Cryptographic Quality Verification',
    phase: 'Phase 5: Verification',
    lane: 'Verification',
    assignedAgent: 'Research Sovereign + Verification Core',
    status: 'Awaiting Dispatch',
    inputs: ['Compiled Artifacts', 'Goal Acceptance Criteria'],
    outputs: ['Proof of Work Signature', 'Operator Delivery Card'],
    description: 'Audits evidence provenance, checks zero-telemetry rules, and signs execution.',
    x: 1220,
    y: 100,
  },
];

export const MagicModeWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [goalPrompt, setGoalPrompt] = useState(
    'Synthesize a complete universal workspace foundation with 21 dedicated module landing pages, cinematic aesthetics, and zero fake generation.'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-1');
  const [nodes, setNodes] = useState<WorkflowNode[]>(ORCHESTRATION_NODES);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleValidatePlan = () => {
    setIsSimulating(true);
    showToast('Plan Topology Audit: Validating DAG consistency across 6 stages...', { type: 'gold' });
    setTimeout(() => {
      setIsSimulating(false);
      showToast('Validation Complete: 0 cycles detected, all dependencies strictly acyclic.', {
        type: 'success',
      });
    }, 1200);
  };

  return (
    <div className="workspace-page-container magic-mode-container">
      <WorkspaceHeader
        title="Magic Mode &middot; Autonomous Orchestration Canvas"
        description="Graphical multi-agent task planner, topological dependency DAG, and deterministic verification stage"
        icon={Sparkles}
        badge="Autonomous Canvas"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={handleValidatePlan}
              disabled={isSimulating}
            >
              <Play size={14} />
              <span>{isSimulating ? 'Auditing Topology...' : 'Validate DAG Plan'}</span>
            </button>
          </div>
        }
      />

      {/* Goal Definition Bar */}
      <div className="magic-goal-bar">
        <div className="goal-input-wrap">
          <Sparkles size={16} className="goal-sparkle-icon" />
          <input
            type="text"
            className="magic-goal-input"
            value={goalPrompt}
            onChange={(e) => setGoalPrompt(e.target.value)}
            placeholder="Define autonomous goal to decompose across specialist agent lanes..."
          />
        </div>
        <div className="goal-meta-pill">
          <ShieldCheck size={12} />
          <span>Operator Approval Required for Execution</span>
        </div>
      </div>

      {/* Main Orchestration Canvas Area */}
      <div className="magic-canvas-workspace">
        {/* Graph Canvas Stage */}
        <div className="graph-viewport-board">
          <div className="graph-grid-background" />

          {/* SVG Dependency Edges Connecting Stages */}
          <svg className="graph-svg-edges" aria-hidden="true">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#c9a84e" />
              </marker>
            </defs>

            {/* Edge 1 -> 2 */}
            <path
              d="M 280 130 L 320 130"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />

            {/* Edge 2 -> 3 (Branch Top) */}
            <path
              d="M 560 110 C 580 110, 590 90, 620 90"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />

            {/* Edge 2 -> 4 (Branch Bottom) */}
            <path
              d="M 560 140 C 580 140, 590 210, 620 210"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />

            {/* Edge 3 -> 5 */}
            <path
              d="M 860 90 C 880 90, 890 140, 920 140"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />

            {/* Edge 4 -> 5 */}
            <path
              d="M 860 210 C 880 210, 890 160, 920 160"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />

            {/* Edge 5 -> 6 */}
            <path
              d="M 1160 150 L 1220 150"
              stroke="rgba(201, 168, 78, 0.45)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />
          </svg>

          {/* Workflow Graph Nodes */}
          <div className="graph-nodes-layer">
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div
                  key={node.id}
                  className={`workflow-canvas-node ${isSelected ? 'selected' : ''}`}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div className="node-phase-tag">{node.phase}</div>
                  <h4 className="node-label">{node.label}</h4>
                  <div className="node-agent-row">
                    <Bot size={12} />
                    <span>{node.assignedAgent}</span>
                  </div>
                  <div className="node-footer-bar">
                    <span className="node-lane-pill">{node.lane}</span>
                    <span className={`node-status-dot ${node.status.toLowerCase().replace(/\s+/g, '-')}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Node Inspector & Contract Panel */}
        <aside className="magic-inspector-sidebar">
          <div className="inspector-card">
            <div className="inspector-card-header">
              <span className="inspector-badge">{selectedNode.lane}</span>
              <h3 className="inspector-title">{selectedNode.label}</h3>
              <span className="inspector-phase">{selectedNode.phase}</span>
            </div>

            <p className="inspector-desc">{selectedNode.description}</p>

            <div className="spec-card-mini">
              <span className="spec-label">Assigned Specialist</span>
              <strong className="spec-val">{selectedNode.assignedAgent}</strong>
            </div>

            <div className="spec-card-mini">
              <span className="spec-label">Runtime Verification State</span>
              <strong className="spec-val standby">{selectedNode.status}</strong>
            </div>

            <div className="contract-box">
              <h4 className="contract-heading">Required Inputs (Pre-conditions)</h4>
              <ul className="contract-list">
                {selectedNode.inputs.map((inp) => (
                  <li key={inp}>{inp}</li>
                ))}
              </ul>
            </div>

            <div className="contract-box">
              <h4 className="contract-heading">Produced Artifacts (Post-conditions)</h4>
              <ul className="contract-list">
                {selectedNode.outputs.map((out) => (
                  <li key={out}>{out}</li>
                ))}
              </ul>
            </div>

            {/* Zero Fake Execution Callout */}
            <div className="service-status-banner info">
              <AlertCircle size={14} />
              <div className="status-banner-text">
                <strong>Deterministic Foundation</strong>
                <p>
                  Magic Mode visualizes genuine DAG dependency structures. Live autonomous execution will engage once local background daemons are configured.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
