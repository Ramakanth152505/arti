import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Pause,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Terminal,
  Activity,
  Filter,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { useToast } from '../../../context/ToastContext';

interface TaskRecord {
  id: string;
  name: string;
  stage: string;
  status: 'In Progress' | 'Queued' | 'Completed' | 'Paused' | 'Failed';
  progress: number;
  elapsedTime: string;
  agentAssigned: string;
  logs: string[];
}

const INITIAL_TASKS: TaskRecord[] = [
  {
    id: 'tsk-101',
    name: 'Topological Sort Verification for Universal Workspace',
    stage: 'Linting & DAG Consistency Audit',
    status: 'Completed',
    progress: 100,
    elapsedTime: '1.2s',
    agentAssigned: 'Architect Prime',
    logs: [
      '[10:45:01] Initializing in-degree array for 22 workspace nodes.',
      '[10:45:02] Cycle check: 0 cycles detected. Graph is strictly acyclic.',
      '[10:45:02] Completed topological ordering.',
    ],
  },
  {
    id: 'tsk-102',
    name: 'AES-256 Client-Side Key Generation & Salt Sealing',
    stage: 'Client Security Initialization',
    status: 'Completed',
    progress: 100,
    elapsedTime: '0.4s',
    agentAssigned: 'Security Core',
    logs: [
      '[10:45:03] Generating crypto.subtle 256-bit GCM key pair.',
      '[10:45:03] Key wrapped and sealed into client memory.',
    ],
  },
  {
    id: 'tsk-103',
    name: 'Background WebGL Shader Precompilation',
    stage: 'Shader Pipeline Optimization',
    status: 'Paused',
    progress: 45,
    elapsedTime: '3.8s',
    agentAssigned: 'Visual Maestro',
    logs: [
      '[10:45:05] Compiling WGSL vertex pipelines for volumetric fog.',
      '[10:45:07] Paused: Viewport idle.',
    ],
  },
];

export const TaskControlWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<TaskRecord[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('tsk-101');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleTogglePause = (task: TaskRecord) => {
    const newStatus = task.status === 'In Progress' ? 'Paused' : 'In Progress';
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    showToast(`Task ${task.name} is now ${newStatus}`, { type: 'gold' });
  };

  const handleCancelTask = (task: TaskRecord) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'Failed' } : t))
    );
    showToast(`Task ${task.name} cancelled by operator`, { type: 'warning' });
  };

  const filteredTasks = tasks.filter(
    (t) => filterStatus === 'All' || t.status === filterStatus
  );

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Task Control Center"
        description="Deterministic multi-stage task scheduler, real execution tracker, and recovery checkpoints"
        icon={CheckSquare}
        badge="Deterministic Scheduler"
      />

      <div className="task-control-grid">
        {/* Left Column: Task Queue List */}
        <aside className="task-queue-column">
          <div className="queue-filter-bar">
            <span className="queue-title">Execution Queue</span>
            <select
              className="toolbar-select mini"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Queued">Queued</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          <div className="tasks-list">
            {filteredTasks.map((t) => {
              const isSelected = t.id === selectedTaskId;
              return (
                <div
                  key={t.id}
                  className={`task-row-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTaskId(t.id)}
                >
                  <div className="task-card-header">
                    <span className="task-agent-tag">{t.agentAssigned}</span>
                    <span className={`task-status-pill status-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                  </div>

                  <h4 className="task-name">{t.name}</h4>
                  <span className="task-stage">{t.stage}</span>

                  <div className="task-progress-bar-wrap">
                    <div className="task-progress-fill" style={{ width: `${t.progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center/Right: Task Inspector & Timeline Logs */}
        <main className="task-inspector-column">
          {/* Header Card */}
          <div className="inspector-header-card">
            <div className="inspector-header-top">
              <div>
                <span className="inspector-id">{selectedTask.id}</span>
                <h2 className="inspector-title">{selectedTask.name}</h2>
                <span className="inspector-stage">{selectedTask.stage}</span>
              </div>

              <div className="inspector-actions">
                {selectedTask.status !== 'Completed' && (
                  <>
                    <button
                      type="button"
                      className="gold-ghost-btn small"
                      onClick={() => handleTogglePause(selectedTask)}
                    >
                      {selectedTask.status === 'In Progress' ? (
                        <>
                          <Pause size={13} />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="gold-ghost-btn small danger"
                      onClick={() => handleCancelTask(selectedTask)}
                    >
                      <XCircle size={13} />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="inspector-specs-row">
              <div><span>Agent:</span> <strong>{selectedTask.agentAssigned}</strong></div>
              <div><span>Elapsed:</span> <strong>{selectedTask.elapsedTime}</strong></div>
              <div><span>Progress:</span> <strong>{selectedTask.progress}%</strong></div>
              <div><span>Checkpoints:</span> <strong>Verified</strong></div>
            </div>
          </div>

          {/* Execution Log Stream */}
          <div className="inspector-logs-card">
            <div className="logs-header">
              <Terminal size={14} />
              <span>Real-Time Audit Log Stream</span>
            </div>

            <div className="logs-stream-box">
              {selectedTask.logs.map((log, i) => (
                <div key={i} className="log-line">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
