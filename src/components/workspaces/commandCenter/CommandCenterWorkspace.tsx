import React, { useState } from 'react';
import {
  Terminal,
  Activity,
  Layers,
  Cpu,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';

interface ApprovalItem {
  id: string;
  action: string;
  agent: string;
  riskLevel: 'Low' | 'Medium' | 'Elevated';
  details: string;
}

export const CommandCenterWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();
  const { showToast } = useToast();

  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 'appr-1',
      action: 'File IO Write: /src/engine/dag.ts',
      agent: 'Code Synthesis Engine',
      riskLevel: 'Low',
      details: 'Overwrites DAG topological resolver with unit-tested implementation.',
    },
    {
      id: 'appr-2',
      action: 'API Key Access: Google Gemini Model Endpoint',
      agent: 'Architect Prime',
      riskLevel: 'Medium',
      details: 'Requests token budget of 4k tokens to decompose project brief.',
    },
  ]);

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    showToast('Action approved by operator (Ramakanth)', { type: 'success' });
  };

  const handleReject = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    showToast('Action denied by operator', { type: 'warning' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="AI Command Center"
        description="Mission control orchestration interface, multi-agent dependency telemetry, and human-in-the-loop approval queue"
        icon={Terminal}
        badge="Mission Control"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() => navigate('magic-mode')}
            >
              <Sparkles size={14} />
              <span>Launch Magic Mode Canvas</span>
            </button>
          </div>
        }
      />

      <div className="command-center-grid">
        {/* Top Row: Mission Telemetry Overview */}
        <div className="command-overview-row">
          <div className="telemetry-card">
            <span className="telemetry-label">Active Specialist Lanes</span>
            <strong className="telemetry-val">5 Configured</strong>
            <span className="telemetry-sub">Architect, Code, Research, Visual, Prose</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Pending Operator Approvals</span>
            <strong className={`telemetry-val ${approvals.length > 0 ? 'alert' : ''}`}>
              {approvals.length} Pending
            </strong>
            <span className="telemetry-sub">Human-in-the-loop safety protocol</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Execution Guardrails</span>
            <strong className="telemetry-val">Zero-Eval Sandbox</strong>
            <span className="telemetry-sub">Client memory isolation</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Orchestrator Mode</span>
            <strong className="telemetry-val">Deterministic DAG</strong>
            <span className="telemetry-sub">Acyclic dependency mapping</span>
          </div>
        </div>

        {/* Center: Graph & Human-in-the-Loop Approval Queue */}
        <div className="command-center-body-grid">
          {/* Left: Workflow Graph Staging Area */}
          <div className="workflow-staging-card">
            <div className="staging-header">
              <Layers size={14} />
              <span>Universal Workflow Graph Architecture</span>
            </div>

            <div className="graph-preview-box">
              <div className="graph-node-preview stage">
                <span>Phase 1: Goal Clarification</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview agents">
                <span>Phase 2: Specialist Agent Decomposition (5 Lanes)</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview tools">
                <span>Phase 3: Deterministic Tool Call Execution</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview verify">
                <span>Phase 4: Artifact Quality &amp; Cryptographic Verification</span>
              </div>
            </div>
          </div>

          {/* Right: Human-in-the-Loop Approval Queue */}
          <div className="approvals-card">
            <div className="approvals-header">
              <ShieldAlert size={14} className="shield-alert-icon" />
              <span>Operator Approval Queue ({approvals.length})</span>
            </div>

            {approvals.length === 0 ? (
              <div className="approvals-empty">
                <CheckCircle2 size={24} className="empty-ok-icon" />
                <p>All agent operations cleared</p>
                <span>No high-privilege actions awaiting operator authorization</span>
              </div>
            ) : (
              <div className="approvals-list">
                {approvals.map((appr) => (
                  <div key={appr.id} className="approval-row-card">
                    <div className="approval-row-header">
                      <span className="approval-agent">{appr.agent}</span>
                      <span className={`risk-badge risk-${appr.riskLevel.toLowerCase()}`}>
                        Risk: {appr.riskLevel}
                      </span>
                    </div>

                    <h4 className="approval-action">{appr.action}</h4>
                    <p className="approval-details">{appr.details}</p>

                    <div className="approval-btn-row">
                      <button
                        type="button"
                        className="gold-ghost-btn small danger"
                        onClick={() => handleReject(appr.id)}
                      >
                        Deny Action
                      </button>
                      <button
                        type="button"
                        className="gold-primary-btn small"
                        onClick={() => handleApprove(appr.id)}
                      >
                        Authorize Execution
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
