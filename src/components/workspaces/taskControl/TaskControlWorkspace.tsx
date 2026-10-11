import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Pause,
  XCircle,
  Terminal,
} from 'lucide-react';
import { WorkspaceHeader } from '../../common/WorkspaceHeader';
import { EmptyState } from '../../common/EmptyState';
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

export const TaskControlWorkspace: React.FC = () => {
  const { showToast } = useToast();

  const [tasks] = useState<TaskRecord[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const requireEngine = () => {
    showToast(
      'No task execution engine is connected. Start, pause, and cancel controls require a running task service.',
      { type: 'warning' }
    );
  };

  const filteredTasks = tasks.filter(
    (t) => filterStatus === 'All' || t.status === filterStatus
  );

  return (
    <div className="workspace-page-container">
      <WorkspaceHeader
        title="Task Control Center"
        description="Multi-stage task scheduler and execution tracker. No execution engine is connected yet."
        icon={CheckSquare}
        badge="No Engine Connected"
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
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks"
                description="Tasks will appear here once a task execution engine is connected and work is submitted."
              />
            ) : (
              filteredTasks.map((t) => {
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
              })
            )}
          </div>
        </aside>

        {/* Center/Right: Task Inspector & Timeline Logs */}
        <main className="task-inspector-column">
          {!selectedTask ? (
            <EmptyState
              icon={CheckSquare}
              title="No task selected"
              description="There is no active execution to inspect. The task execution engine is not connected in this phase."
            />
          ) : (
          <>
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
                      onClick={requireEngine}
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
                      onClick={requireEngine}
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
              <div><span>Checkpoints:</span> <strong>{selectedTask.status === 'Completed' ? 'Verified' : 'None'}</strong></div>
            </div>
          </div>

          {/* Execution Log Stream */}
          <div className="inspector-logs-card">
            <div className="logs-header">
              <Terminal size={14} />
              <span>Task Audit Log Stream</span>
            </div>

            <div className="logs-stream-box">
              {selectedTask.logs.length === 0 ? (
                <div className="log-line muted">No log entries recorded.</div>
              ) : (
                selectedTask.logs.map((log, i) => (
                  <div key={i} className="log-line">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};
