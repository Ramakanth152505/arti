import React, { useState } from 'react';
import {
  Compass,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { useToast } from '../../../context/ToastContext';

interface EvidenceSource {
  id: string;
  title: string;
  provenance: 'Verified Peer-Reviewed' | 'Primary Documentation' | 'Model Inference' | 'Unverified Hypothesis';
  citation: string;
  notes: string;
}

const DEMO_RESEARCH_SOURCES: EvidenceSource[] = [
  {
    id: 'src-1',
    title: 'Example: In-browser index memory layout study',
    provenance: 'Unverified Hypothesis',
    citation: 'Not a real citation — demonstration entry',
    notes: 'Illustrates how a verified source record would appear. Not a real reference.',
  },
  {
    id: 'src-2',
    title: 'Example: Client-side embedding protocol spec',
    provenance: 'Unverified Hypothesis',
    citation: 'Not a real citation — demonstration entry',
    notes: 'Illustrates how a documentation record would appear. Not a real reference.',
  },
];

export const ResearchWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [question, setQuestion] = useState('');
  const [depth, setDepth] = useState('Deep Academic Synthesis');
  const [notes, setNotes] = useState('');

  const [sources, setSources] = useState<EvidenceSource[]>(DEMO_RESEARCH_SOURCES);
  const [isDemo, setIsDemo] = useState(true);

  const clearDemo = () => {
    setSources([]);
    setIsDemo(false);
  };

  const getProvenanceBadgeClass = (prov: EvidenceSource['provenance']) => {
    switch (prov) {
      case 'Verified Peer-Reviewed':
        return 'badge-verified';
      case 'Primary Documentation':
        return 'badge-primary';
      case 'Model Inference':
        return 'badge-inference';
      case 'Unverified Hypothesis':
      default:
        return 'badge-unverified';
    }
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Research Laboratory"
        description="Deep scientific inquiry, academic evidence synthesis, and verifiable source provenance"
        icon={Compass}
        badge="Research Workspace"
        actions={
          <div className="header-action-cluster">
            <button
              type="button"
              className="gold-primary-btn"
              onClick={() =>
                showToast(
                  'Research synthesis requires a configured retrieval and reasoning provider. None is connected.',
                  { type: 'warning' }
                )
              }
            >
              <Sparkles size={14} />
              <span>Execute Research Query</span>
            </button>
          </div>
        }
      />

      <div className="research-studio-grid">
        {isDemo && (
          <div className="demo-notice-span">
            <DemoDataNotice
              message="The sample sources and plan steps below are illustrative placeholders, not verified evidence."
              onClear={clearDemo}
            />
          </div>
        )}
        {/* Left Column: Research Question & Plan */}
        <aside className="research-sidebar-column">
          <div className="spec-card">
            <h3 className="spec-card-heading">Research Question</h3>
            <textarea
              className="spec-brief-textarea"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="State your formal hypothesis or research question..."
            />
            <div className="spec-style-row">
              <label className="spec-field-label">Investigation Depth</label>
              <select
                className="form-select"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              >
                <option value="Quick Synthesis">Quick Synthesis (Summary)</option>
                <option value="Deep Academic Synthesis">Deep Academic Synthesis</option>
                <option value="Patent & Prior Art Review">Patent &amp; Prior Art Review</option>
                <option value="Empirical Reproducibility Audit">Empirical Reproducibility Audit</option>
              </select>
            </div>
          </div>

          <div className="spec-card">
            <h3 className="spec-card-heading">Structured Research Plan</h3>
            <div className="research-plan-steps">
              <div className="plan-step-item">
                <span className="step-dot" />
                <span>1. Problem Formulation &amp; Query Tokenization</span>
              </div>
              <div className="plan-step-item">
                <span className="step-dot" />
                <span>2. Corpus Retrieval &amp; Citation Indexing</span>
              </div>
              <div className="plan-step-item">
                <span className="step-dot" />
                <span>3. Provenance Verification &amp; Hypothesis Audit</span>
              </div>
              <div className="plan-step-item">
                <span className="step-dot" />
                <span>4. Report Synthesis &amp; LaTeX Export</span>
              </div>
            </div>
            <span className="plan-step-meta">Plan outline only — steps execute once a research provider is connected.</span>
          </div>
        </aside>

        {/* Center/Right: Sources & Evidence with Clear Provenance */}
        <main className="research-main-column">
          {/* Provenance Transparency Legend */}
          <div className="provenance-legend-bar">
            <span className="legend-title">Evidence Provenance System:</span>
            <span className="legend-tag badge-verified">
              <CheckCircle2 size={11} /> Verified Peer-Reviewed
            </span>
            <span className="legend-tag badge-primary">
              <FileCheck size={11} /> Primary Documentation
            </span>
            <span className="legend-tag badge-inference">
              <Sparkles size={11} /> Model Inference (Derived)
            </span>
            <span className="legend-tag badge-unverified">
              <AlertTriangle size={11} /> Unverified Claim
            </span>
          </div>

          {/* Sources List */}
          <div className="sources-card">
            <div className="sources-header-row">
              <h3 className="sources-title">Indexed Sources &amp; Literature</h3>
              <span className="sources-count">{sources.length} Example Entries (not verified)</span>
            </div>

            <div className="sources-list">
              {sources.length === 0 ? (
                <EmptyState
                  icon={Compass}
                  title="No sources indexed"
                  description="Add references or connect a retrieval provider to ground this research in real evidence."
                />
              ) : (
                sources.map((src) => (
                  <div key={src.id} className="source-item-card">
                    <div className="source-item-header">
                      <span className="source-title">{src.title}</span>
                      <span className={`provenance-pill ${getProvenanceBadgeClass(src.provenance)}`}>
                        {src.provenance}
                      </span>
                    </div>
                    <span className="source-citation">{src.citation}</span>
                    <p className="source-notes">{src.notes}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Research Findings & Notes */}
          <div className="findings-card">
            <h3 className="findings-title">Synthesis Findings &amp; Scratchpad</h3>
            <textarea
              className="findings-textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record notes, methodology insights, or draft claims..."
            />
          </div>
        </main>
      </div>
    </div>
  );
};
