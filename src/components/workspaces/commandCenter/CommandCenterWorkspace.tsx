import React, { useState } from 'react';
import {
  Terminal,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useWorkspace } from '../../../context/WorkspaceContext';

interface ApprovalItem {
  id: string;
  action: string;
  agent: string;
  riskLevel: 'Low' | 'Medium' | 'Elevated';
  details: string;
}

export const CommandCenterWorkspace: React.FC = () => {
  const { navigate } = useWorkspace();

  const [approvals] = useState<ApprovalItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="AI Command Center"
        description="Mission control orchestration interface. The orchestration engine is not connected in this phase."
        icon={Terminal}
        badge="Orchestration Offline"
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
            <span className="telemetry-label">Specialist Lanes</span>
            <strong className="telemetry-val">None Running</strong>
            <span className="telemetry-sub">No agents are currently executing</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Pending Approvals</span>
            <strong className={`telemetry-val ${approvals.length > 0 ? 'alert' : ''}`}>
              {approvals.length} Pending
            </strong>
            <span className="telemetry-sub">Human-in-the-loop safety protocol</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Execution Service</span>
            <strong className="telemetry-val standby">Not Connected</strong>
            <span className="telemetry-sub">No task engine configured</span>
          </div>
          <div className="telemetry-card">
            <span className="telemetry-label">Orchestrator Mode</span>
            <strong className="telemetry-val standby">Standby</strong>
            <span className="telemetry-sub">Awaiting workflow engine</span>
          </div>
        </div>

        {/* Center: Graph & Human-in-the-Loop Approval Queue */}
        <div className="command-center-body-grid">
          {/* Left: Workflow Graph Staging Area */}
          <div className="workflow-staging-card">
            <div className="staging-header">
              <Layers size={14} />
              <span>Planned Workflow Graph Architecture</span>
            </div>

            <div className="graph-preview-box">
              <div className="graph-node-preview stage">
                <span>Phase 1: Goal Clarification</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview agents">
                <span>Phase 2: Specialist Agent Decomposition</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview tools">
                <span>Phase 3: Deterministic Tool Call Execution</span>
              </div>
              <div className="graph-arrow">&darr;</div>
              <div className="graph-node-preview verify">
                <span>Phase 4: Artifact Quality &amp; Verification</span>
              </div>
            </div>
            <span className="plan-step-meta">
              Diagram shows the intended pipeline. No stages are executing and no status is live.
            </span>
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
                <p>No approvals pending</p>
                <span>
                  There is no active orchestration engine, so no agent actions are awaiting authorization.
                </span>
                <button
                  type="button"
                  className="gold-ghost-btn small"
                  onClick={() => setShowPreview((v) => !v)}
                >
                  {showPreview ? 'Hide example approval' : 'Show example approval (demo)'}
                </button>
                {showPreview && (
                  <div className="approval-row-card demo">
                    <span className="approval-demo-tag">Demonstration preview</span>
                    <div className="approval-row-header">
                      <span className="approval-agent">Example Agent</span>
                      <span className="risk-badge risk-low">Risk: Low</span>
                    </div>
                    <h4 className="approval-action">Example: File write request</h4>
                    <p className="approval-details">
                      This is an illustrative card showing how a real approval request would appear. It is
                      not a live request and cannot be authorized.
                    </p>
                    <div className="approval-btn-row">
                      <button type="button" className="gold-ghost-btn small danger" disabled>
                        Deny Action
                      </button>
                      <button type="button" className="gold-primary-btn small" disabled>
                        Authorize Execution
                      </button>
                    </div>
                  </div>
                )}
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
