import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
import { DemoDataNotice } from '../../common/DemoDataNotice';
import { useToast } from '../../../context/ToastContext';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalModules: number;
  completedModules: number;
  tags: string[];
}

const DEMO_PATHS: LearningPath[] = [
  {
    id: 'path-1',
    title: 'Task Orchestration Fundamentals',
    description: 'Planning, task delegation hierarchies, and verification protocols for agent workflows.',
    totalModules: 6,
    completedModules: 0,
    tags: ['Agent DAG', 'Coordination', 'Consensus'],
  },
  {
    id: 'path-2',
    title: 'Private Local-First Workspaces',
    description: 'Designing browser-only runtimes: local persistence boundaries, privacy trade-offs, and data handling.',
    totalModules: 5,
    completedModules: 0,
    tags: ['localStorage', 'Privacy', 'Client Store'],
  },
  {
    id: 'path-3',
    title: 'Cinematic Latent Space Direction',
    description: 'Advanced shot composition, camera motion continuity, and keyframe latent anchor preservation.',
    totalModules: 8,
    completedModules: 0,
    tags: ['Cinema', 'Storyboarding', 'Latent Space'],
  },
];

const PROGRESS_KEY = 'arti_ws_learning_progress';

function readProgress(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const LearningWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [paths, setPaths] = useState<LearningPath[]>(() => {
    const progress = readProgress();
    return DEMO_PATHS.map((p) => ({
      ...p,
      completedModules: Math.min(p.completedModules + (progress[p.id] ?? 0), p.totalModules),
    }));
  });
  const [isDemo, setIsDemo] = useState(true);

  const [activePathId, setActivePathId] = useState('path-1');
  const activePath = paths.find((p) => p.id === activePathId) || paths[0];

  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);

  const clearDemo = () => {
    setPaths([]);
    setIsDemo(false);
    setPracticeAnswer(null);
  };

  const handleAnswer = (idx: number, isCorrect: boolean) => {
    setPracticeAnswer(idx);
    if (!isCorrect || !activePath) {
      showToast('Try again: Review in-degree resolution.', { type: 'warning' });
      return;
    }
    const updated = paths.map((p) =>
      p.id === activePath.id
        ? { ...p, completedModules: Math.min(p.completedModules + 1, p.totalModules) }
        : p
    );
    setPaths(updated);
    const progress = readProgress();
    progress[activePath.id] = (progress[activePath.id] ?? 0) + 1;
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // storage unavailable
    }
    showToast('Correct: Topological cycle detection prevents deadlock loops.', { type: 'success' });
  };

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Learning Academy"
        description="Learning paths, study notes, and practice. Progress reflects completed activities only."
        icon={GraduationCap}
        badge="Cognitive Curriculum"
      />

      <div className="learning-studio-grid">
        {isDemo && (
          <div className="demo-notice-span">
            <DemoDataNotice
              message="Sample learning paths are illustrative. Progress you complete is tracked locally on this device."
              onClear={clearDemo}
            />
          </div>
        )}
        {/* Left Column: Learning Paths List */}
        <aside className="learning-sidebar-column">
          <h3 className="section-title">Cognitive Learning Pathways</h3>
          {paths.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No learning paths"
              description="Learning paths will appear here once curriculum content is created or imported."
              actionLabel="Restore Sample Curriculum"
              onAction={() => {
                setPaths(DEMO_PATHS);
                setIsDemo(true);
              }}
            />
          ) : (
          <div className="paths-list">
            {paths.map((p) => {
              const isActive = p.id === activePathId;
              const progressPct = p.totalModules > 0
                ? Math.round((p.completedModules / p.totalModules) * 100)
                : 0;

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
          )}
        </aside>

        {/* Center/Right: Study Workspace & Interactive Question */}
        <main className="learning-main-column">
          {!activePath ? (
            <EmptyState
              icon={GraduationCap}
              title="Select a learning path"
              description="Choose a path to begin studying, or restore the sample curriculum above."
            />
          ) : (
          <>
          {/* Active Lesson Header Card */}
          <div className="lesson-header-card">
            <span className="lesson-badge">
              Module {activePath.completedModules + 1} of {activePath.totalModules} &middot; {activePath.title}
            </span>
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
                    onClick={() => handleAnswer(idx, isCorrect)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{opt}</span>
                    {isSelected && isCorrect && <CheckCircle2 size={14} className="correct-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};
