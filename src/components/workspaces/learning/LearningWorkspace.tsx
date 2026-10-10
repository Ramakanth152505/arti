import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Award,
  Layers,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useToast } from '../../../context/ToastContext';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalModules: number;
  completedModules: number;
  tags: string[];
}

export const LearningWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [paths, setPaths] = useState<LearningPath[]>([
    {
      id: 'path-1',
      title: 'Autonomous Multi-Agent Architecture',
      description: 'Master topological task planning, agent delegation hierarchies, and deterministic verification protocols.',
      totalModules: 6,
      completedModules: 2,
      tags: ['Agent DAG', 'Coordination', 'Consensus'],
    },
    {
      id: 'path-2',
      title: 'Zero-Telemetry Cryptographic Systems',
      description: 'Designing private-first client runtimes with AES-256 in-memory stores and ephemeral key handshakes.',
      totalModules: 5,
      completedModules: 1,
      tags: ['Cryptography', 'IndexedDB', 'Security'],
    },
    {
      id: 'path-3',
      title: 'Cinematic Latent Space Direction',
      description: 'Advanced shot composition, camera motion continuity, and keyframe latent anchor preservation.',
      totalModules: 8,
      completedModules: 0,
      tags: ['Cinema', 'Storyboarding', 'Latent Space'],
    },
  ]);

  const [activePathId, setActivePathId] = useState('path-1');
  const activePath = paths.find((p) => p.id === activePathId) || paths[0];

  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Learning Academy"
        description="Curated cognitive pathways, systems engineering curricula, and interactive knowledge checks"
        icon={GraduationCap}
        badge="Cognitive Curriculum"
      />

      <div className="learning-studio-grid">
        {/* Left Column: Learning Paths List */}
        <aside className="learning-sidebar-column">
          <h3 className="section-title">Cognitive Learning Pathways</h3>
          <div className="paths-list">
            {paths.map((p) => {
              const isActive = p.id === activePathId;
              const progressPct = Math.round((p.completedModules / p.totalModules) * 100);

              return (
                <div
                  key={p.id}
                  className={`path-card ${isActive ? 'active' : ''}`}
                  onClick={() => setActivePathId(p.id)}
                >
                  <div className="path-card-header">
                    <span className="path-card-title">{p.title}</span>
                  </div>
                  <p className="path-card-desc">{p.description}</p>

                  <div className="path-progress-container">
                    <div className="path-progress-bar">
                      <div className="path-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="path-progress-meta">
                      <span>{p.completedModules} of {p.totalModules} completed</span>
                      <span>{progressPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center/Right: Study Workspace & Interactive Question */}
        <main className="learning-main-column">
          {/* Active Lesson Header Card */}
          <div className="lesson-header-card">
            <span className="lesson-badge">Module 2 of {activePath.title}</span>
            <h2 className="lesson-title">Topological Sort &amp; Dependency Cycles in Task Engines</h2>
            <p className="lesson-summary">
              When decomposing goals into specialist agent operations, cyclic dependencies create infinite execution locks. Learn how Kahn&apos;s algorithm detects deadlocks before agent dispatch.
            </p>
          </div>

          {/* Core Concept Takeaway Grid */}
          <div className="concept-cards-grid">
            <div className="concept-card">
              <h4>1. Directed Acyclic Graph (DAG)</h4>
              <p>Each node represents a distinct verifiable operation with declared inputs and outputs.</p>
            </div>
            <div className="concept-card">
              <h4>2. In-Degree Computation</h4>
              <p>Nodes with in-degree of 0 are immediately executable in parallel without waiting for peers.</p>
            </div>
            <div className="concept-card">
              <h4>3. Checkpoint Serialization</h4>
              <p>Intermediate node outputs are signed and persisted before downstream dispatch.</p>
            </div>
          </div>

          {/* Interactive Practice Question */}
          <div className="practice-question-card">
            <div className="question-header">
              <HelpCircle size={16} />
              <span className="question-title">Knowledge Verification Check</span>
            </div>

            <p className="question-prompt">
              Why must an orchestration engine verify in-degree reachability before launching multi-agent execution?
            </p>

            <div className="question-options-list">
              {[
                'To prevent deadlocks from cyclic dependencies between agents',
                'To speed up CPU clock speed on the client host',
                'To bypass user approval queues automatically',
              ].map((opt, idx) => {
                const isSelected = practiceAnswer === idx;
                const isCorrect = idx === 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`question-option-btn ${isSelected ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                    onClick={() => {
                      setPracticeAnswer(idx);
                      showToast(
                        isCorrect
                          ? 'Correct: Topological cycle detection prevents deadlock loops.'
                          : 'Try again: Review in-degree resolution.',
                        { type: isCorrect ? 'success' : 'warning' }
                      );
                    }}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{opt}</span>
                    {isSelected && isCorrect && <CheckCircle2 size={14} className="correct-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
